from __future__ import annotations

import asyncio
import hashlib
import logging
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import feedparser
import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, create_engine, desc, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("aulos.ingestion")


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://aulos:aulos@postgres:5432/aulos"
    poll_interval_seconds: int = 300
    request_timeout_seconds: int = 20
    max_items_per_feed: int = 30
    admin_token: str = ""
    cors_origins: str = "https://aulos-news.ian-g-lacey2.chatgpt.site"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

FEEDS = [
    {"slug": "fed-all", "name": "Federal Reserve Board", "category": "Policy & Banking", "url": "https://www.federalreserve.gov/feeds/press_all.xml", "tier": 1},
    {"slug": "fed-monetary", "name": "Federal Reserve Monetary Policy", "category": "Monetary Policy", "url": "https://www.federalreserve.gov/feeds/press_monetary.xml", "tier": 1},
    {"slug": "bls-jobs", "name": "BLS Employment Situation", "category": "Labor", "url": "https://www.bls.gov/feed/empsit.rss", "tier": 1},
    {"slug": "bls-cpi", "name": "BLS Consumer Price Index", "category": "Inflation", "url": "https://www.bls.gov/feed/cpi.rss", "tier": 1},
    {"slug": "eia-today", "name": "EIA Today in Energy", "category": "Energy", "url": "https://www.eia.gov/rss/todayinenergy.xml", "tier": 1},
    {"slug": "eia-press", "name": "EIA Press Releases", "category": "Energy", "url": "https://www.eia.gov/rss/press_rss.xml", "tier": 1},
    {"slug": "sec-press", "name": "SEC Press Releases", "category": "Capital Markets", "url": "https://www.sec.gov/news/pressreleases.rss", "tier": 1},
    {"slug": "nasa-releases", "name": "NASA News Releases", "category": "Science & Space", "url": "https://www.nasa.gov/news-release/feed/", "tier": 1},
    {"slug": "arxiv-ai", "name": "arXiv Artificial Intelligence", "category": "AI Research", "url": "https://export.arxiv.org/api/query?search_query=cat%3Acs.AI&sortBy=submittedDate&sortOrder=descending&max_results=30", "tier": 2},
]


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
                url=feed["url"], authority_tier=feed["tier"], active=1,
            ).on_conflict_do_update(
                index_elements=[Source.slug],
                set_={"name": feed["name"], "category": feed["category"], "url": feed["url"], "authority_tier": feed["tier"]},
            )
            session.execute(statement)


async def ingest_feed(client: httpx.AsyncClient, feed: dict[str, Any]) -> dict[str, Any]:
    started = asyncio.get_running_loop().time()
    status, message, received, inserted_count = "live", None, 0, 0
    try:
        response = await client.get(feed["url"])
        response.raise_for_status()
        parsed = feedparser.loads(response.content)
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
                    ).on_conflict_do_nothing(index_elements=[Article.canonical_url])
                )
                inserted_count += result.rowcount or 0
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
        headers = {"User-Agent": "AULOS-NEWS/1.0 (+https://aulos-news.ian-g-lacey2.chatgpt.site; research aggregator)"}
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds, follow_redirects=True, headers=headers) as client:
            results = await asyncio.gather(*(ingest_feed(client, feed) for feed in FEEDS))
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
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
        return {"count": len(rows), "sources": [{"slug": row.slug, "name": row.name, "category": row.category, "url": row.url, "authorityTier": row.authority_tier} for row in rows]}


@app.get("/v1/articles")
def articles(limit: int = Query(default=100, ge=1, le=500), source: str | None = None) -> dict[str, Any]:
    with SessionLocal() as session:
        query = select(Article).join(Article.source).order_by(desc(Article.published_at), desc(Article.retrieved_at)).limit(limit)
        if source:
            query = query.where(Source.slug == source)
        rows = session.scalars(query).all()
        return {"count": len(rows), "articles": [{"id": row.id, "sourceSlug": row.source.slug, "sourceName": row.source.name, "title": row.title, "summary": row.summary, "url": row.canonical_url, "publishedAt": row.published_at.isoformat() if row.published_at else None, "retrievedAt": row.retrieved_at.isoformat()} for row in rows]}


@app.post("/v1/ingest/run", dependencies=[Depends(require_admin)])
async def run_ingestion() -> dict[str, Any]:
    return await ingest_all()
