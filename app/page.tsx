"use client";

import { useEffect, useMemo, useState } from "react";

type Event = { id: string; category: string; kicker: string; title: string; summary: string; change: string; confidence: number; sources: number; updated: string; tone: string; tags: string[] };
type LiveObservation = { seriesId:string; label:string; date:string; value:number; display:string };
type RegistrySource = { slug:string; name:string; category:string; sourceType:string; accessMethod:string; url:string; authorityTier:number };
type LivePayload = { status:"live"|"degraded"; source:string; retrievedAt:string; persistence:string; data:LiveObservation[]; registry:RegistrySource[] };
type Citation = { source:string; sourceSlug:string; label:string; url:string; evidenceType:string };
type EventClaim = { id:string; status:string; classification:"fact"|"inference"; confidence:number; statement:string; qualification:string; citations:Citation[] };
type LiveEvent = Event & { methodology:string; claims:EventClaim[] };
type EventPayload = { status:"live"|"degraded"; generatedAt:string; events:LiveEvent[] };
type Stance = "upward"|"downward"|"restrictive"|"supportive"|"finding"|"neutral";
type IntelligencePerspective = { source:string; sourceClass:"official"|"primary-research"; title:string; summary:string; url:string; publishedAt:string; tier:number; stance:Stance; entities:string[] };
type IntelligenceCluster = { id:string; topic:string; title:string; updatedAt:string; sourceCount:number; itemCount:number; confidence:number; corroboration:"cross-source"|"single-source"; agreement:"mixed"|"aligned"|"insufficient"; entities:string[]; summary:string; perspectives:IntelligencePerspective[]; timeline:Array<{publishedAt:string;source:string;title:string;url:string;stance:Stance}> };
type FeedHealth = { slug:string; name:string; domain:string; sourceClass:"official"|"primary-research"; url:string; status:"live"|"degraded"; latencyMs:number; itemCount:number; error?:string };
type IntelligencePayload = { status:"live"|"degraded"; generatedAt:string; itemCount:number; entityCount:number; clusters:IntelligenceCluster[]; feedHealth:FeedHealth[]; methodology:{clustering:string;corroboration:string;stance:string;guardrail:string} };

const events: Event[] = [
  { id: "fed", category: "MACRO · MONETARY POLICY", kicker: "THE POLICY PATH", title: "Markets are repricing the next phase of Federal Reserve policy", summary: "A softer labor pulse is colliding with persistent services inflation. The debate has shifted from whether policy is restrictive to how quickly the Fed can normalize without reigniting prices.", change: "Rate-cut expectations moved forward; the long end remained resistant.", confidence: 88, sources: 18, updated: "22 min ago", tone: "amber", tags: ["Federal Reserve", "Treasuries", "Inflation"] },
  { id: "energy", category: "ENERGY · GEOPOLITICS", kicker: "SUPPLY RISK", title: "Oil markets balance visible supply against a widening geopolitical premium", summary: "Physical balances remain adequately supplied, but shipping risk and uncertain spare capacity are steepening the cost of protection. Futures and tanker data tell different stories.", change: "Brent volatility rose while prompt spreads held near neutral.", confidence: 81, sources: 23, updated: "47 min ago", tone: "red", tags: ["Oil", "OPEC+", "Shipping"] },
  { id: "ai-power", category: "AI · INFRASTRUCTURE", kicker: "THE POWER BOTTLENECK", title: "AI investment is becoming an electricity, grid and financing story", summary: "The next constraint on model deployment may sit outside the data center. Utilities, gas generation, grid equipment and project finance are becoming part of the AI capital cycle.", change: "New utility guidance points to a faster data-center demand ramp.", confidence: 84, sources: 16, updated: "1 hr ago", tone: "blue", tags: ["AI", "Electricity", "Infrastructure"] },
  { id: "credit", category: "CREDIT · CAPITAL MARKETS", kicker: "RISK TRANSMISSION", title: "Credit remains calm even as refinancing pressure becomes more uneven", summary: "Headline spreads signal confidence, but dispersion is growing beneath the index. Lower-quality borrowers and rate-sensitive property exposures face a different cycle from large issuers.", change: "Index spreads tightened; single-name dispersion widened.", confidence: 78, sources: 14, updated: "2 hrs ago", tone: "violet", tags: ["Credit", "Refinancing", "CRE"] },
];

const ticker = [["UST 10Y", "4.21%", "+4 bp"], ["2s10s", "+31 bp", "+3 bp"], ["BRENT", "$82.46", "+1.4%"], ["GOLD", "$2,548", "+0.7%"], ["IG OAS", "91 bp", "−1 bp"], ["VIX", "16.8", "+0.9"]];
const claims = [
  { status: "CONFIRMED", claim: "Recent labor data show a measurable cooling in hiring momentum.", evidence: "BLS release · Fed Beige Book · 3 independent reports", color: "green" },
  { status: "SUPPORTED", claim: "The committee has become more sensitive to downside employment risks.", evidence: "FOMC minutes · 4 speeches · Reuters analysis", color: "blue" },
  { status: "DISPUTED", claim: "A near-term cut would necessarily restart inflation.", evidence: "Conflicting model estimates and policymaker views", color: "amber" },
];
const nav = ["World Now", "Markets", "Geopolitics", "Technology", "Science"];

export default function Home() {
  const [activeNav, setActiveNav] = useState("World Now");
  const [selected, setSelected] = useState<Event>(events[0]);
  const [query, setQuery] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [liveData, setLiveData] = useState<LivePayload | null>(null);
  const [eventData, setEventData] = useState<EventPayload | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligencePayload | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  useEffect(() => { fetch("/api/live-data").then((response) => response.json()).then(setLiveData).catch(() => setLiveData(null)); }, []);
  useEffect(() => { fetch("/api/events").then((response) => response.json()).then((payload:EventPayload) => { setEventData(payload); if(payload.events[0])setSelected(payload.events[0]); }).catch(() => setEventData(null)); }, []);
  useEffect(() => { fetch("/api/intelligence").then((response)=>response.json()).then((payload:IntelligencePayload)=>{setIntelligence(payload);if(payload.clusters[0])setSelectedCluster(payload.clusters[0].id)}).catch(()=>setIntelligence(null)); }, []);
  const activeEvents = useMemo(() => eventData?.events.length ? [...eventData.events, ...events.slice(1)] : events, [eventData]);
  const marketPulse = liveData?.data.length ? liveData.data.filter((item) => ["DGS2","DGS10","DGS30","T10Y2Y","DCOILBRENTEU"].includes(item.seriesId)).map((item) => [item.label,item.display,item.date]) : ticker;
  const observation = (seriesId:string) => liveData?.data.find((item)=>item.seriesId===seriesId);
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"America/Chicago" }).format(new Date()).toUpperCase();
  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    const matcher = q.length <= 2 ? new RegExp(`\\b${q.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i") : null;
    return activeEvents.filter((event) => {
      const haystack = [event.title, event.summary, event.category, ...event.tags].join(" ");
      return matcher ? matcher.test(haystack) : haystack.toLowerCase().includes(q);
    });
  }, [query, activeEvents]);
  const selectedClaims = selected.id === "fed-live" ? eventData?.events[0]?.claims ?? [] : null;

  return (
    <main>
      <header className="site-header">
        <div className="brand-wrap">
          <button className="menu-button" aria-label="Open navigation"><span /><span /></button>
          <a className="brand" href="#top" aria-label="Aulos News home">AULOS <i>NEWS</i></a>
          <span className="edition">INTELLIGENCE EDITION</span>
        </div>
        <nav aria-label="Primary navigation">
          {nav.map((item) => <button className={activeNav === item ? "nav-active" : ""} key={item} onClick={() => setActiveNav(item)}>{item}</button>)}
        </nav>
        <div className="header-actions">
          <label className="search"><span>⌕</span><input aria-label="Search intelligence" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search intelligence" /></label>
          <button className="brief-button" onClick={() => setBriefOpen(!briefOpen)}>{briefOpen ? "Close brief" : "Morning brief"}</button>
        </div>
      </header>

      <section className="ticker" aria-label="Market snapshot">
        <span className="ticker-label">MARKET PULSE</span>
        <div className="ticker-items">{marketPulse.map(([label, value, move]) => <div className="ticker-item" key={label}><b>{label}</b><span>{value}</span><em>{move}</em></div>)}</div>
        <span className={`live ${liveData?.status === "live" ? "verified" : ""}`}><i /> {liveData?.status === "live" ? "VERIFIED LIVE" : "CONNECTING"}</span>
      </section>

      {briefOpen && <section className="morning-brief">
        <div><span className="eyebrow">YOUR MORNING BRIEF · {todayLabel}</span><h2>The world changed at three important pressure points.</h2></div>
        <ol><li><b>Rates:</b> The latest 2-year Treasury observation is {observation("DGS2")?.display ?? "loading"}; the 10-year is {observation("DGS10")?.display ?? "loading"}.</li><li><b>Curve:</b> The latest 10s–2s Treasury spread is {observation("T10Y2Y")?.display ?? "loading"}.</li><li><b>Energy:</b> The latest Brent crude observation is {observation("DCOILBRENTEU")?.display ?? "loading"}. Narrative interpretation remains under development.</li></ol>
      </section>}

      <div className="page" id="top">
        <section className="page-intro">
          <div><span className="eyebrow">{todayLabel} · CHICAGO</span><h1>{activeNav === "World Now" ? "The world, with the signal restored." : activeNav}</h1></div>
          <p>A continuously updated map of the events shaping policy, markets and power—built from primary evidence, independent reporting and competing perspectives.</p>
        </section>

        <section className="content-grid">
          <div className="event-feed">
            <div className="section-heading"><span>THE CONSEQUENTIAL</span><small>{visibleEvents.length} ACTIVE DOSSIERS</small></div>
            {visibleEvents.length ? visibleEvents.map((event, index) => <article className={`event-card ${selected.id === event.id ? "selected" : ""}`} key={event.id} onClick={() => setSelected(event)}>
              <div className={`event-index ${event.tone}`}>0{index + 1}</div>
              <div className="event-body">
                <div className="event-meta"><span>{event.category}</span><span>{event.updated}</span></div>
                <p className="kicker">{event.kicker}</p><h2>{event.title}</h2><p className="summary">{event.summary}</p>
                <div className="change-line"><b>WHAT CHANGED</b><span>{event.change}</span></div>
                <div className="card-footer"><div className="tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button aria-label={`Open dossier: ${event.title}`}>Open dossier →</button></div>
              </div>
            </article>) : <div className="empty-state">No dossiers match “{query}”. Try a market, institution or topic.</div>}
          </div>

          <aside className="side-rail">
            <div className="section-heading"><span>SIGNAL BOARD</span><small>UPDATED NOW</small></div>
            <div className="data-health"><span className="eyebrow">DATA HEALTH</span><b>{liveData?.status === "live" ? "PRIMARY FEED ONLINE" : "ESTABLISHING FEED"}</b><p>{liveData?.status === "live" ? `${liveData.data.length} current observations · ${liveData.source}` : "Illustrative values remain visible until the primary feed responds."}</p><small>{liveData?.retrievedAt ? `Retrieved ${new Date(liveData.retrievedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "Checking now"}</small></div>
            <div className="signal-card"><div className="signal-top"><span>POLICY-SENSITIVE RATE</span><b>{observation("DGS2") ? "LIVE" : "CONNECTING"}</b></div><div className="rate-row"><strong>{observation("DGS2")?.display ?? "—"}</strong><span>2-year Treasury yield<br />latest FRED observation</span></div><small>{observation("DGS2") ? `Observation date ${observation("DGS2")?.date}` : "Awaiting primary data"}</small></div>
            <div className="signal-card curve-card"><div className="signal-top"><span>YIELD CURVE</span><b>OBSERVED</b></div><div className="rate-row"><strong>{observation("T10Y2Y")?.display ?? "—"}</strong><span>10-year minus 2-year<br />Treasury spread</span></div><small>{observation("T10Y2Y") ? `Observation date ${observation("T10Y2Y")?.date}` : "Awaiting primary data"}</small></div>
            <div className="watch-card"><span className="eyebrow">EVIDENCE PIPELINE</span><div><b>LIVE</b><p>FRED market and macro observations</p></div><div><b>SCHEMA READY</b><p>Events, articles, claims and citations</p></div><div><b>NEXT</b><p>Scheduled official-release ingestion</p></div></div>
            <blockquote>“The purpose is not to eliminate uncertainty. It is to make the uncertainty legible.”<cite>AULOS PRINCIPLE 01</cite></blockquote>
          </aside>
        </section>

        <section className="wire-room">
          <div className="wire-head"><div><span className="eyebrow">MULTI-SOURCE ENGINE · OFFICIAL + PRIMARY RESEARCH</span><h2>Evidence streams, clustered before narrative.</h2></div><div className="wire-stats"><strong>{intelligence?.itemCount ?? "—"}</strong><span>NORMALIZED ITEMS</span><strong>{intelligence?.feedHealth.filter((feed)=>feed.status==="live").length ?? "—"}/{intelligence?.feedHealth.length ?? 9}</strong><span>FEEDS ONLINE</span><strong>{intelligence?.entityCount ?? "—"}</strong><span>ENTITIES MAPPED</span></div></div>
          <div className="wire-layout">
            <div className="cluster-list"><div className="section-heading"><span>DEVELOPING CLUSTERS</span><small>{intelligence?.methodology.clustering ?? "CONNECTING"}</small></div>{intelligence?.clusters.length ? intelligence.clusters.map((cluster)=><button className={`cluster-card ${selectedCluster===cluster.id?"active":""}`} key={cluster.id} onClick={()=>setSelectedCluster(cluster.id)}><span className={`cluster-state ${cluster.corroboration}`}>{cluster.corroboration==="cross-source"?"CROSS-SOURCE":"UNCONFIRMED"}</span><div><small>{cluster.topic} · {cluster.itemCount} ITEMS · {cluster.agreement.toUpperCase()}</small><h3>{cluster.title}</h3><div className="entity-chips">{cluster.entities.map((entity)=><span key={entity}>{entity}</span>)}</div><p>{cluster.summary}</p><div className="cluster-footer"><span>{cluster.sourceCount} {cluster.sourceCount===1?"source":"sources"}</span><span>{cluster.confidence}/100 evidence score</span></div></div></button>) : <div className="wire-loading">Gathering and normalizing official releases…</div>}</div>
            <div className="evidence-pane">{intelligence?.clusters.find((cluster)=>cluster.id===selectedCluster) ? (()=>{const cluster=intelligence.clusters.find((item)=>item.id===selectedCluster)!;return <><div className="section-heading"><span>EVIDENCE & PERSPECTIVES</span><small>{cluster.agreement==="mixed"?"DISAGREEMENT DETECTED":"DIRECT LINKS"}</small></div><div className="evidence-summary"><span className={`cluster-state ${cluster.corroboration}`}>{cluster.corroboration==="cross-source"?"CORROBORATED STREAM":"SINGLE-SOURCE SIGNAL"}</span><span className={`agreement ${cluster.agreement}`}>{cluster.agreement.toUpperCase()} EVIDENCE</span><h3>{cluster.topic}</h3><div className="entity-chips">{cluster.entities.map((entity)=><span key={entity}>{entity}</span>)}</div><p>{cluster.summary}</p></div><div className="event-timeline"><span>TIMELINE</span>{cluster.timeline.map((point,index)=><a href={point.url} target="_blank" rel="noreferrer" key={`${point.url}-timeline`}><i/><time>{point.publishedAt?new Date(point.publishedAt).toLocaleDateString():"—"}</time><b>{point.source}</b><em>{point.stance}</em><p>{point.title}</p>{index<cluster.timeline.length-1&&<small/>}</a>)}</div>{cluster.perspectives.map((item,index)=><a className="wire-source" href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}><b>0{index+1}</b><div><span>{item.source} · T{item.tier} {item.sourceClass.replace("-"," ")} · {item.stance}</span><h4>{item.title}</h4>{item.summary&&<p>{item.summary}</p>}<small>{item.publishedAt?new Date(item.publishedAt).toLocaleString():"Publication time unavailable"} ↗</small></div></a>)}</>} )() : <div className="wire-loading">Select a cluster to inspect its evidence.</div>}</div>
          </div>
          <div className="feed-health"><span>METHODOLOGY</span><p>{intelligence?.methodology.guardrail ?? "AULOS never upgrades a single-source item to confirmed."}</p><div>{intelligence?.feedHealth.map((feed)=><a href={feed.url} target="_blank" rel="noreferrer" key={feed.slug}><i className={feed.status}/>{feed.name}<small>{feed.itemCount} items</small></a>)}</div></div>
        </section>

        <section className="dossier" id="dossier">
          <div className="dossier-head"><div><span className="eyebrow">LIVE EVENT DOSSIER · {selected.category}</span><h2>{selected.title}</h2></div><div className="confidence"><strong>{selected.confidence}</strong><span>/100<br />CONFIDENCE</span></div></div>
          <div className="dossier-grid">
            <div className="claims"><div className="section-heading"><span>CLAIM LEDGER</span><small>{selectedClaims ? "LIVE · PRIMARY EVIDENCE" : "TRACEABLE EVIDENCE"}</small></div>{selectedClaims ? selectedClaims.map((item) => <div className="claim live-claim" key={item.id}><span className={`status ${item.classification === "fact" ? "green" : "blue"}`}>{item.status}</span><div><h3>{item.statement}</h3><p>{item.qualification}</p><div className="claim-citations">{item.citations.map((source)=><a href={source.url} target="_blank" rel="noreferrer" key={`${item.id}-${source.url}`}>{source.label} ↗</a>)}</div></div></div>) : claims.map((item) => <div className="claim" key={item.claim}><span className={`status ${item.color}`}>{item.status}</span><div><h3>{item.claim}</h3><p>{item.evidence}</p></div></div>)}</div>
            <div className="perspectives"><div className="section-heading"><span>COMPETING READS</span><small>NOT FALSE BALANCE</small></div>
              <div className="perspective"><b>01</b><div><h3>Controlled normalization</h3><p>Disinflation can continue while policy gradually moves toward neutral.</p><span>Fed officials · labor data · market consensus</span></div></div>
              <div className="perspective"><b>02</b><div><h3>Premature easing risk</h3><p>Sticky services prices make the final stage of disinflation structurally harder.</p><span>Regional Fed research · inflation hawks</span></div></div>
              <div className="perspective"><b>03</b><div><h3>Fiscal dominance</h3><p>Long yields increasingly reflect supply and term premium rather than the policy path.</p><span>Treasury data · independent strategists</span></div></div>
            </div>
          </div>
          <div className="source-strip"><span>SOURCE MIX</span><b>{selected.sources} {selected.sources === 1 ? "primary source" : "sources"}</b><i /><span>{selectedClaims ? `${selectedClaims.reduce((total,item)=>total+item.citations.length,0)} direct citations` : "6 primary"}</span><span>{selectedClaims ? "Observed facts separated from inference" : "7 independent reports"}</span>{!selectedClaims && <span>5 specialist analyses</span>}<button onClick={() => setSourcesOpen(!sourcesOpen)}>{sourcesOpen ? "Close registry ↑" : "Inspect provenance →"}</button></div>
        </section>
        {sourcesOpen && <section className="registry-panel">
          <div className="registry-head"><div><span className="eyebrow">SOURCE CONTROL</span><h2>Active source registry</h2></div><p>Every source is classified by proximity to evidence. Tier 1 is primary data or direct institutional evidence; Tier 2 is independent reporting or an interested participant.</p></div>
          <div className="registry-table"><div className="registry-row registry-labels"><span>SOURCE</span><span>DOMAIN</span><span>ACCESS</span><span>TIER</span></div>{(liveData?.registry ?? []).map((source) => <a className="registry-row" href={source.url} target="_blank" rel="noreferrer" key={source.slug}><b>{source.name}</b><span>{source.category}<small>{source.sourceType}</small></span><span>{source.accessMethod}</span><strong>T{source.authorityTier}</strong></a>)}</div>
        </section>}
      </div>
      <footer><a className="brand" href="#top">AULOS <i>NEWS</i></a><p>Evidence before narrative. Context before conclusion.</p><span>Live primary data · Narrative layer in development</span></footer>
    </main>
  );
}
