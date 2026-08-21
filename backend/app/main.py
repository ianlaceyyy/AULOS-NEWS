from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import feedparser
import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, create_engine, desc, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("aulos.ingestion")


class Settings(BaseSettings):
    database_url: str
    poll_interval_seconds: int = 300
    request_timeout_seconds: int = 20
    max_items_per_feed: int = 30
    admin_token: str = ""
    cors_origins: str = "https://aulos-news.ian-g-lacey2.chatgpt.site"
    alpaca_api_key_id: str = ""
    alpaca_api_secret_key: str = ""
    alpaca_data_base_url: str = "https://data.alpaca.markets"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

FEEDS: list[dict[str, Any]] = json.loads(Path(__file__).with_name("sources.json").read_text())


class Base(DeclarativeBase):
    pass


class Source(Base):
    __tablename__ = "sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(Text)
    authority_tier: Mapped[int] = mapped_column(Integer)
    source_class: Mapped[str] = mapped_column(String(50), default="official")
    geography: Mapped[str] = mapped_column(String(100), default="Global")
    publisher_type: Mapped[str] = mapped_column(String(100), default="institution")
    active: Mapped[int] = mapped_column(Integer, default=1)
    articles: Mapped[list["Article"]] = relationship(back_populates="source")


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)
    canonical_url: Mapped[str] = mapped_column(Text, unique=True)
    title: Mapped[str] = mapped_column(Text)
    summary: Mapped[str] = mapped_column(Text, default="")
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    source: Mapped[Source] = relationship(back_populates="articles")


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"
    id: Mapped[int] = mapped_column(primary_key=True)
    source_slug: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(30))
    records_received: Mapped[int] = mapped_column(Integer, default=0)
    records_inserted: Mapped[int] = mapped_column(Integer, default=0)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    message: Mapped[str | None] = mapped_column(Text)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class SourceState(BaseModel):
    active: bool


def alpaca_headers() -> dict[str, str]:
    if not settings.alpaca_api_key_id or not settings.alpaca_api_secret_key:
        raise HTTPException(status_code=503, detail="Alpaca market data is not configured")
    return {"APCA-API-KEY-ID": settings.alpaca_api_key_id, "APCA-API-SECRET-KEY": settings.alpaca_api_secret_key}


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
ingestion_lock = asyncio.Lock()
last_cycle: dict[str, Any] = {"status": "not_started", "completedAt": None, "inserted": 0}


def canonicalize_url(value: str) -> str:
    parts = urlsplit(value.strip())
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/") or "/", parts.query, ""))


def parsed_datetime(entry: Any) -> datetime | None:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if not parsed:
        return None
    return datetime(*parsed[:6], tzinfo=timezone.utc)


def seed_sources() -> None:
    with SessionLocal.begin() as session:
        for feed in FEEDS:
            statement = insert(Source).values(
                slug=feed["slug"], name=feed["name"], category=feed["category"],
                url=feed["url"], authority_tier=feed["tier"], source_class=feed["source_class"],
                geography=feed["geography"], publisher_type=feed["publisher_type"], active=1,
            ).on_conflict_do_update(
                index_elements=[Source.slug],
                set_={"name": feed["name"], "category": feed["category"], "url": feed["url"], "authority_tier": feed["tier"], "source_class": feed["source_class"], "geography": feed["geography"], "publisher_type": feed["publisher_type"]},
            )
            session.execute(statement)


async def ingest_feed(client: httpx.AsyncClient, feed: dict[str, Any]) -> dict[str, Any]:
    started = asyncio.get_running_loop().time()
    status, message, received, inserted_count = "live", None, 0, 0
    try:
        response = await client.get(feed["url"])
        response.raise_for_status()
        parsed = feedparser.parse(response.content)
        if parsed.bozo and not parsed.entries:
            raise ValueError(str(parsed.bozo_exception))
        entries = parsed.entries[: settings.max_items_per_feed]
        received = len(entries)
        with SessionLocal.begin() as session:
            source_id = session.scalar(select(Source.id).where(Source.slug == feed["slug"]))
            for entry in entries:
                url = canonicalize_url(entry.get("link", ""))
                title = str(entry.get("title", "")).strip()
                if not url or not title or source_id is None:
                    continue
                summary = str(entry.get("summary", ""))[:4000]
                digest = hashlib.sha256(f"{title}\n{summary}".encode()).hexdigest()
                result = session.execute(
                    insert(Article).values(
                        source_id=source_id, canonical_url=url, title=title, summary=summary,
                        content_hash=digest, published_at=parsed_datetime(entry),
                    ).on_conflict_do_nothing(index_elements=[Article.canonical_url]).returning(Article.id)
                )
                if result.scalar_one_or_none() is not None:
                    inserted_count += 1
    except Exception as exc:  # keep one failed publisher from stopping the cycle
        status, message = "degraded", str(exc)[:1000]
        log.warning("Feed %s failed: %s", feed["slug"], exc)
    latency_ms = int((asyncio.get_running_loop().time() - started) * 1000)
    with SessionLocal.begin() as session:
        session.add(IngestionRun(source_slug=feed["slug"], status=status, records_received=received, records_inserted=inserted_count, latency_ms=latency_ms, message=message))
    return {"slug": feed["slug"], "status": status, "received": received, "inserted": inserted_count, "latencyMs": latency_ms, "error": message}


async def ingest_all() -> dict[str, Any]:
    global last_cycle
    if ingestion_lock.locked():
        return {"status": "already_running"}
    async with ingestion_lock:
        with SessionLocal() as session:
            rows = session.scalars(select(Source).where(Source.active == 1).order_by(Source.authority_tier, Source.slug)).all()
            active_feeds = [{"slug": row.slug, "name": row.name, "category": row.category, "url": row.url, "tier": row.authority_tier} for row in rows]
        headers = {"User-Agent": "AULOS-NEWS/1.1 (+https://aulos-news.ian-g-lacey2.chatgpt.site; public research aggregator)"}
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds, follow_redirects=True, headers=headers) as client:
            semaphore = asyncio.Semaphore(6)
            async def limited(feed: dict[str, Any]) -> dict[str, Any]:
                async with semaphore:
                    return await ingest_feed(client, feed)
            results = await asyncio.gather(*(limited(feed) for feed in active_feeds))
        last_cycle = {
            "status": "live" if any(item["status"] == "live" for item in results) else "degraded",
            "completedAt": datetime.now(timezone.utc).isoformat(),
            "inserted": sum(item["inserted"] for item in results),
            "feeds": results,
        }
        return last_cycle


async def scheduler() -> None:
    while True:
        try:
            await ingest_all()
        except Exception:
            log.exception("Ingestion cycle failed")
        await asyncio.sleep(max(60, settings.poll_interval_seconds))


def upgrade_schema() -> None:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_class VARCHAR(50) NOT NULL DEFAULT 'official'"))
        connection.execute(text("ALTER TABLE sources ADD COLUMN IF NOT EXISTS geography VARCHAR(100) NOT NULL DEFAULT 'Global'"))
        connection.execute(text("ALTER TABLE sources ADD COLUMN IF NOT EXISTS publisher_type VARCHAR(100) NOT NULL DEFAULT 'institution'"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    upgrade_schema()
    seed_sources()
    task = asyncio.create_task(scheduler())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="AULOS NEWS Intelligence API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])


def require_admin(authorization: str | None = Header(default=None)) -> None:
    if not settings.admin_token:
        raise HTTPException(status_code=503, detail="Administrative endpoint is disabled")
    expected = f"Bearer {settings.admin_token}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        with SessionLocal() as session:
            session.execute(select(Source.id).limit(1))
        database = "connected"
    except Exception:
        database = "unavailable"
    return {"status": "ok" if database == "connected" else "degraded", "database": database, "lastCycle": last_cycle}


@app.get("/v1/sources")
def sources() -> dict[str, Any]:
    with SessionLocal() as session:
        rows = session.scalars(select(Source).order_by(Source.authority_tier, Source.name)).all()
        return {"count": len(rows), "sources": [{"slug": row.slug, "name": row.name, "category": row.category, "url": row.url, "authorityTier": row.authority_tier, "sourceClass": row.source_class, "geography": row.geography, "publisherType": row.publisher_type, "active": bool(row.active)} for row in rows]}


@app.get("/v1/articles")
def articles(limit: int = Query(default=100, ge=1, le=500), source: str | None = None) -> dict[str, Any]:
    with SessionLocal() as session:
        query = select(Article).join(Article.source).order_by(desc(Article.published_at), desc(Article.retrieved_at)).limit(limit)
        if source:
            query = query.where(Source.slug == source)
        rows = session.scalars(query).all()
        return {"count": len(rows), "articles": [{"id": row.id, "sourceSlug": row.source.slug, "sourceName": row.source.name, "title": row.title, "summary": row.summary, "url": row.canonical_url, "publishedAt": row.published_at.isoformat() if row.published_at else None, "retrievedAt": row.retrieved_at.isoformat()} for row in rows]}


@app.get("/v1/markets/snapshots")
async def market_snapshots(symbols: str = Query(default="SPY,QQQ,IWM,GLD,SLV,USO")) -> dict[str, Any]:
    requested = ",".join(symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip())[:250]
    async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
        response = await client.get(f"{settings.alpaca_data_base_url.rstrip('/')}/v2/stocks/snapshots", params={"symbols": requested}, headers=alpaca_headers())
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Market data provider returned {response.status_code}")
    return {"status": "live", "provider": "Alpaca Market Data", "retrievedAt": datetime.now(timezone.utc).isoformat(), "symbols": response.json()}


@app.get("/v1/news")
async def live_news(limit: int = Query(default=50, ge=1, le=50)) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
        response = await client.get(f"{settings.alpaca_data_base_url.rstrip('/')}/v1beta1/news", params={"limit": limit, "sort": "desc", "include_content": "false"}, headers=alpaca_headers())
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"News provider returned {response.status_code}")
    return {"status": "live", "provider": "Alpaca News", "retrievedAt": datetime.now(timezone.utc).isoformat(), **response.json()}


@app.patch("/v1/sources/{slug}", dependencies=[Depends(require_admin)])
def set_source_state(slug: str, state: SourceState) -> dict[str, Any]:
    with SessionLocal.begin() as session:
        source = session.scalar(select(Source).where(Source.slug == slug))
        if source is None:
            raise HTTPException(status_code=404, detail="Source not found")
        source.active = int(state.active)
        return {"slug": source.slug, "active": state.active}


@app.post("/v1/ingest/run", dependencies=[Depends(require_admin)])
async def run_ingestion() -> dict[str, Any]:
    return await ingest_all()
