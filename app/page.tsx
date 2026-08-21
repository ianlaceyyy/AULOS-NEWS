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
type SourceClass = "official"|"primary-research"|"independent-reporting";
type IntelligencePerspective = { source:string; sourceClass:SourceClass; title:string; summary:string; url:string; publishedAt:string; tier:number; stance:Stance; entities:string[] };
type NarrativeSentence = { id:string; label:string; classification:string; text:string; citationIndexes:number[] };
type IntelligenceCluster = { id:string; topic:string; title:string; updatedAt:string; sourceCount:number; itemCount:number; confidence:number; corroboration:"cross-source"|"single-source"; agreement:"mixed"|"aligned"|"insufficient"; entities:string[]; summary:string; narrative:{headline:string;dek:string;mode:string;sentences:NarrativeSentence[];whatChanged:Array<{id:string;sequence:string;publishedAt:string;source:string;title:string;url:string;stance:Stance}>}; perspectives:IntelligencePerspective[]; timeline:Array<{publishedAt:string;source:string;title:string;url:string;stance:Stance}> };
type FeedHealth = { slug:string; name:string; domain:string; sourceClass:SourceClass; url:string; status:"live"|"degraded"; latencyMs:number; itemCount:number; error?:string };
type NewsItem = { id:string; sourceName:string; sourceClass:SourceClass; title:string; summary:string; url:string; publishedAt:string; topic:string; tier:number };
type IntelligencePayload = { status:"live"|"degraded"; persistence?:string; generatedAt:string; itemCount:number; entityCount:number; latestItems:NewsItem[]; clusters:IntelligenceCluster[]; feedHealth:FeedHealth[]; methodology:{clustering:string;corroboration:string;stance:string;guardrail:string} };

const emptySelection:Event={id:"none",category:"LIVE INTELLIGENCE",kicker:"AWAITING EVIDENCE",title:"Select a live dossier",summary:"AULOS will display only retrieved, cited evidence here.",change:"No claim is shown until a source is available.",confidence:0,sources:0,updated:"Connecting",tone:"blue",tags:[]};
const nav = ["World Now", "Markets", "Geopolitics", "Technology", "Science"];

export default function Home() {
  const [activeNav, setActiveNav] = useState("World Now");
  const [selected, setSelected] = useState<Event>(emptySelection);
  const [query, setQuery] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [liveData, setLiveData] = useState<LivePayload | null>(null);
  const [eventData, setEventData] = useState<EventPayload | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligencePayload | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState("All topics");
  const [qualityFilter, setQualityFilter] = useState<"all"|"cross-source"|"mixed">("all");
  const [sourceFilter, setSourceFilter] = useState<"all"|SourceClass>("all");
  const [dossierMode, setDossierMode] = useState(false);
  useEffect(() => { const load=()=>fetch("/api/live-data",{cache:"no-store"}).then((response) => response.json()).then(setLiveData).catch(() => setLiveData(null));load();const timer=setInterval(load,60_000);return()=>clearInterval(timer); }, []);
  useEffect(() => { const load=()=>fetch("/api/events",{cache:"no-store"}).then((response) => response.json()).then((payload:EventPayload) => { setEventData(payload); if(payload.events[0])setSelected(payload.events[0]); }).catch(() => setEventData(null));load();const timer=setInterval(load,60_000);return()=>clearInterval(timer); }, []);
  useEffect(() => { const load=()=>fetch("/api/intelligence",{cache:"no-store"}).then((response)=>response.json()).then((payload:IntelligencePayload)=>{setIntelligence(payload);if(payload.clusters[0])setSelectedCluster(payload.clusters[0].id)}).catch(()=>setIntelligence(null));load();const timer=setInterval(load,60_000);return()=>clearInterval(timer); }, []);
  const clusterEvents = useMemo<Event[]>(() => (intelligence?.clusters ?? []).map((cluster)=>({id:`wire-${cluster.id}`,category:cluster.topic.toUpperCase(),kicker:cluster.corroboration==="cross-source"?"CROSS-SOURCE EVIDENCE":"DEVELOPING SIGNAL",title:cluster.title,summary:cluster.summary,change:cluster.narrative.whatChanged[0]?.title??"Evidence stream initialized.",confidence:cluster.confidence,sources:cluster.sourceCount,updated:cluster.updatedAt?new Date(cluster.updatedAt).toLocaleString():"Updated now",tone:cluster.agreement==="mixed"?"red":"blue",tags:cluster.entities.slice(0,3)})), [intelligence]);
  const activeEvents = useMemo(() => [...(eventData?.events ?? []), ...clusterEvents], [eventData, clusterEvents]);
  const topics = useMemo(()=>["All topics",...new Set((intelligence?.clusters??[]).map((cluster)=>cluster.topic))],[intelligence]);
  const filteredClusters = useMemo(()=>(intelligence?.clusters??[]).filter((cluster)=>{
    if(topicFilter!=="All topics"&&cluster.topic!==topicFilter)return false;
    if(qualityFilter==="cross-source"&&cluster.corroboration!=="cross-source")return false;
    if(qualityFilter==="mixed"&&cluster.agreement!=="mixed")return false;
    if(sourceFilter!=="all"&&!cluster.perspectives.some((item)=>item.sourceClass===sourceFilter))return false;
    return true;
  }),[intelligence,topicFilter,qualityFilter,sourceFilter]);
  useEffect(()=>{if(filteredClusters.length&&!filteredClusters.some((cluster)=>cluster.id===selectedCluster))setSelectedCluster(filteredClusters[0].id)},[filteredClusters,selectedCluster]);
  const marketPulse = liveData?.data.filter((item) => item.seriesId.startsWith("ALPACA:")||item.seriesId.startsWith("EIA:")||["DGS2","DGS10","T10Y2Y"].includes(item.seriesId)).slice(0,10).map((item) => [item.label,item.display,item.seriesId.startsWith("ALPACA:")?new Date(item.date).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):item.date]) ?? [];
  const observation = (seriesId:string) => liveData?.data.find((item)=>item.seriesId===seriesId);
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:"America/Chicago" }).format(new Date()).toUpperCase();
  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeEvents;
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
        <div className="ticker-items">{marketPulse.length ? marketPulse.map(([label, value, date]) => <div className="ticker-item" key={label}><b>{label}</b><span>{value}</span><em>{date}</em></div>) : <div className="ticker-item"><b>NO FALLBACK VALUES</b><span>Awaiting source</span></div>}</div>
        <span className={`live ${liveData?.status === "live" ? "verified" : ""}`}><i /> {liveData?.status === "live" ? "SOURCE CONNECTED" : "CONNECTING"}</span>
      </section>

      {briefOpen && <section className="morning-brief">
        <div><span className="eyebrow">YOUR MORNING BRIEF · {todayLabel}</span><h2>The world changed at three important pressure points.</h2></div>
        <ol><li><b>Rates:</b> The latest 2-year Treasury observation is {observation("DGS2")?.display ?? "loading"}; the 10-year is {observation("DGS10")?.display ?? "loading"}.</li><li><b>Curve:</b> The latest 10s–2s Treasury spread is {observation("T10Y2Y")?.display ?? "loading"}.</li><li><b>Energy:</b> The latest Brent crude observation is {observation("DCOILBRENTEU")?.display ?? "loading"}. Narrative interpretation remains under development.</li></ol>
      </section>}

      <div className="page" id="top">
        <section className="page-intro">
          <div><span className="eyebrow">{todayLabel} · CHICAGO</span><h1>{activeNav === "World Now" ? "The world, with the signal restored." : activeNav}</h1></div>
          <p>A continuously updated map of the events shaping policy, markets and power—built from official evidence, primary research and explicitly competing signals.</p>
        </section>

        <section className="live-newswire" aria-label="Latest live stories">
          <div className="section-heading"><span>LATEST LIVE STORIES</span><small>{intelligence?.generatedAt ? `REFRESHED ${new Date(intelligence.generatedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "CONNECTING"}</small></div>
          <div className="newswire-list">{intelligence?.latestItems?.length ? intelligence.latestItems.slice(0,12).map((item)=><a href={item.url} target="_blank" rel="noreferrer" key={item.id}><time>{item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "—"}</time><span>{item.sourceName}<small>T{item.tier} · {item.sourceClass.replace("-"," ")}</small></span><h3>{item.title}</h3><b>{item.topic} ↗</b></a>) : <div className="empty-state">Connecting to the chronological source wire. No placeholder stories are shown.</div>}</div>
        </section>

        <section className="content-grid">
          <div className="event-feed">
            <div className="section-heading"><span>THE CONSEQUENTIAL</span><small>{visibleEvents.length} ACTIVE DOSSIERS</small></div>
            {visibleEvents.length ? visibleEvents.map((event, index) => <article className={`event-card ${selected.id === event.id ? "selected" : ""}`} key={event.id} onClick={() => {setSelected(event);if(event.id.startsWith("wire-"))setSelectedCluster(event.id.slice(5));}}>
              <div className={`event-index ${event.tone}`}>0{index + 1}</div>
              <div className="event-body">
                <div className="event-meta"><span>{event.category}</span><span>{event.updated}</span></div>
                <p className="kicker">{event.kicker}</p><h2>{event.title}</h2><p className="summary">{event.summary}</p>
                <div className="change-line"><b>WHAT CHANGED</b><span>{event.change}</span></div>
                <div className="card-footer"><div className="tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><button aria-label={`Open dossier: ${event.title}`}>Open dossier →</button></div>
              </div>
            </article>) : <div className="empty-state">{intelligence ? `No dossiers match “${query}”. Try a market, institution or topic.` : "Gathering live evidence streams…"}</div>}
          </div>

          <aside className="side-rail">
            <div className="section-heading"><span>SIGNAL BOARD</span><small>UPDATED NOW</small></div>
            <div className="data-health"><span className="eyebrow">DATA HEALTH</span><b>{liveData?.status === "live" ? "PRIMARY FEED ONLINE" : "ESTABLISHING FEED"}</b><p>{liveData?.status === "live" ? `${liveData.data.length} sourced observations · ${liveData.source}` : "No market values are displayed until a source responds."}</p><small>{liveData?.retrievedAt ? `Retrieved ${new Date(liveData.retrievedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "Checking now"}</small></div>
            <div className="signal-card"><div className="signal-top"><span>POLICY-SENSITIVE RATE</span><b>{observation("DGS2") ? "LIVE" : "CONNECTING"}</b></div><div className="rate-row"><strong>{observation("DGS2")?.display ?? "—"}</strong><span>2-year Treasury yield<br />latest FRED observation</span></div><small>{observation("DGS2") ? `Observation date ${observation("DGS2")?.date}` : "Awaiting primary data"}</small></div>
            <div className="signal-card curve-card"><div className="signal-top"><span>YIELD CURVE</span><b>OBSERVED</b></div><div className="rate-row"><strong>{observation("T10Y2Y")?.display ?? "—"}</strong><span>10-year minus 2-year<br />Treasury spread</span></div><small>{observation("T10Y2Y") ? `Observation date ${observation("T10Y2Y")?.date}` : "Awaiting primary data"}</small></div>
            <div className="watch-card"><span className="eyebrow">EVIDENCE PIPELINE</span><div><b>LIVE</b><p>FRED market and macro observations</p></div><div><b>PERSISTENT</b><p>PostgreSQL source and article history</p></div><div><b>GLOBAL</b><p>Macro, markets, energy, policy and research registry</p></div></div>
            <blockquote>“The purpose is not to eliminate uncertainty. It is to make the uncertainty legible.”<cite>AULOS PRINCIPLE 01</cite></blockquote>
          </aside>
        </section>

        <section className={`wire-room ${dossierMode?"dossier-mode":""}`}>
          <div className="wire-head"><div><span className="eyebrow">MULTI-SOURCE ENGINE · OFFICIAL + PRIMARY RESEARCH</span><h2>Evidence streams, clustered before narrative.</h2></div><div className="wire-stats"><strong>{intelligence?.itemCount ?? "—"}</strong><span>NORMALIZED ITEMS</span><strong>{intelligence?.feedHealth.filter((feed)=>feed.status==="live").length ?? "—"}/{intelligence?.feedHealth.length ?? 9}</strong><span>FEEDS ONLINE</span><strong>{intelligence?.entityCount ?? "—"}</strong><span>ENTITIES MAPPED</span></div></div>
          <div className="intelligence-controls"><label>TOPIC<select value={topicFilter} onChange={(event)=>setTopicFilter(event.target.value)}>{topics.map((topic)=><option key={topic}>{topic}</option>)}</select></label><div><span>QUALITY</span><button className={qualityFilter==="all"?"active":""} onClick={()=>setQualityFilter("all")}>All</button><button className={qualityFilter==="cross-source"?"active":""} onClick={()=>setQualityFilter("cross-source")}>Cross-source</button><button className={qualityFilter==="mixed"?"active":""} onClick={()=>setQualityFilter("mixed")}>Disputed</button></div><div><span>SOURCE CLASS</span><button className={sourceFilter==="all"?"active":""} onClick={()=>setSourceFilter("all")}>All</button><button className={sourceFilter==="official"?"active":""} onClick={()=>setSourceFilter("official")}>Official</button><button className={sourceFilter==="primary-research"?"active":""} onClick={()=>setSourceFilter("primary-research")}>Research</button><button className={sourceFilter==="independent-reporting"?"active":""} onClick={()=>setSourceFilter("independent-reporting")}>News</button></div><button className="expand-dossier" onClick={()=>setDossierMode(!dossierMode)}>{dossierMode?"Exit dossier view":"Expand dossier"}</button></div>
          <div className="wire-layout">
            <div className="cluster-list"><div className="section-heading"><span>DEVELOPING CLUSTERS</span><small>{filteredClusters.length} SHOWN · {intelligence?.methodology.clustering ?? "CONNECTING"}</small></div>{filteredClusters.length ? filteredClusters.map((cluster)=><button className={`cluster-card ${selectedCluster===cluster.id?"active":""}`} key={cluster.id} onClick={()=>setSelectedCluster(cluster.id)}><span className={`cluster-state ${cluster.corroboration}`}>{cluster.corroboration==="cross-source"?"CROSS-SOURCE":"UNCONFIRMED"}</span><div><small>{cluster.topic} · {cluster.itemCount} ITEMS · {cluster.agreement.toUpperCase()}</small><h3>{cluster.title}</h3><div className="entity-chips">{cluster.entities.map((entity)=><span key={entity}>{entity}</span>)}</div><p>{cluster.summary}</p><div className="cluster-footer"><span>{cluster.sourceCount} {cluster.sourceCount===1?"source":"sources"}</span><span>{cluster.confidence}/100 evidence score</span></div></div></button>) : <div className="wire-loading">No clusters match these filters.</div>}</div>
            <div className="evidence-pane">{intelligence?.clusters.find((cluster)=>cluster.id===selectedCluster) ? (()=>{const cluster=intelligence.clusters.find((item)=>item.id===selectedCluster)!;return <><div className="section-heading"><span>EVIDENCE & PERSPECTIVES</span><small>{cluster.agreement==="mixed"?"DISAGREEMENT DETECTED":"DIRECT LINKS"}</small></div><div className="evidence-summary"><span className={`cluster-state ${cluster.corroboration}`}>{cluster.corroboration==="cross-source"?"CORROBORATED STREAM":"SINGLE-SOURCE SIGNAL"}</span><span className={`agreement ${cluster.agreement}`}>{cluster.agreement.toUpperCase()} EVIDENCE</span><h3>{cluster.topic}</h3><div className="entity-chips">{cluster.entities.map((entity)=><span key={entity}>{entity}</span>)}</div><p>{cluster.summary}</p></div><article className="aulos-brief"><header><span>AULOS BRIEF · {cluster.narrative.mode.replace("-"," ")}</span><h3>{cluster.narrative.headline}</h3><p>{cluster.narrative.dek}</p></header>{cluster.narrative.sentences.map((sentence)=><p className={`brief-sentence ${sentence.classification}`} key={sentence.id}><b>{sentence.label}</b>{sentence.text}<span>{sentence.citationIndexes.map((sourceIndex)=><a href={cluster.perspectives[sourceIndex]?.url} target="_blank" rel="noreferrer" title={cluster.perspectives[sourceIndex]?.source} key={`${sentence.id}-${sourceIndex}`}>{sourceIndex+1}</a>)}</span></p>)}<footer><b>WHAT CHANGED</b>{cluster.narrative.whatChanged.map((change)=><a href={change.url} target="_blank" rel="noreferrer" key={change.id}><span>{change.sequence}</span><p>{change.title}</p><small>{change.source} · {change.publishedAt?new Date(change.publishedAt).toLocaleDateString():"—"}</small></a>)}</footer></article><div className="event-timeline"><span>FULL TIMELINE</span>{cluster.timeline.map((point,index)=><a href={point.url} target="_blank" rel="noreferrer" key={`${point.url}-timeline`}><i/><time>{point.publishedAt?new Date(point.publishedAt).toLocaleDateString():"—"}</time><b>{point.source}</b><em>{point.stance}</em><p>{point.title}</p>{index<cluster.timeline.length-1&&<small/>}</a>)}</div>{cluster.perspectives.map((item,index)=><a className="wire-source" href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${index}`}><b>0{index+1}</b><div><span>{item.source} · T{item.tier} {item.sourceClass.replace("-"," ")} · {item.stance}</span><h4>{item.title}</h4>{item.summary&&<p>{item.summary}</p>}<small>{item.publishedAt?new Date(item.publishedAt).toLocaleString():"Publication time unavailable"} ↗</small></div></a>)}</>} )() : <div className="wire-loading">Select a cluster to inspect its evidence.</div>}</div>
          </div>
          <div className="feed-health"><span>METHODOLOGY</span><p>{intelligence?.methodology.guardrail ?? "AULOS never upgrades a single-source item to confirmed."}</p><div>{intelligence?.feedHealth.map((feed)=><a href={feed.url} target="_blank" rel="noreferrer" key={feed.slug}><i className={feed.status}/>{feed.name}<small>{feed.itemCount} items</small></a>)}</div></div>
        </section>

        {selected.id === "fed-live" && <section className="dossier" id="dossier">
          <div className="dossier-head"><div><span className="eyebrow">LIVE EVENT DOSSIER · {selected.category}</span><h2>{selected.title}</h2></div><div className="confidence"><strong>{selected.confidence}</strong><span>/100<br />CONFIDENCE</span></div></div>
          <div className="dossier-grid">
            <div className="claims"><div className="section-heading"><span>CLAIM LEDGER</span><small>{selectedClaims ? "LIVE · PRIMARY EVIDENCE" : "TRACEABLE EVIDENCE"}</small></div>{selectedClaims ? selectedClaims.map((item) => <div className="claim live-claim" key={item.id}><span className={`status ${item.classification === "fact" ? "green" : "blue"}`}>{item.status}</span><div><h3>{item.statement}</h3><p>{item.qualification}</p><div className="claim-citations">{item.citations.map((source)=><a href={source.url} target="_blank" rel="noreferrer" key={`${item.id}-${source.url}`}>{source.label} ↗</a>)}</div></div></div>) : <div className="empty-state">No uncited claims are displayed. Select a live primary-evidence dossier.</div>}</div>
            <div className="perspectives"><div className="section-heading"><span>COMPETING READS</span><small>NOT FALSE BALANCE</small></div>
              <div className="perspective"><b>01</b><div><h3>Controlled normalization</h3><p>Disinflation can continue while policy gradually moves toward neutral.</p><span>Fed officials · labor data · market consensus</span></div></div>
              <div className="perspective"><b>02</b><div><h3>Premature easing risk</h3><p>Sticky services prices make the final stage of disinflation structurally harder.</p><span>Regional Fed research · inflation hawks</span></div></div>
              <div className="perspective"><b>03</b><div><h3>Fiscal dominance</h3><p>Long yields increasingly reflect supply and term premium rather than the policy path.</p><span>Treasury data · independent strategists</span></div></div>
            </div>
          </div>
          <div className="source-strip"><span>SOURCE MIX</span><b>{selected.sources} {selected.sources === 1 ? "primary source" : "sources"}</b><i /><span>{selectedClaims ? `${selectedClaims.reduce((total,item)=>total+item.citations.length,0)} direct citations` : "6 primary"}</span><span>{selectedClaims ? "Observed facts separated from inference" : "7 independent reports"}</span>{!selectedClaims && <span>5 specialist analyses</span>}<button onClick={() => setSourcesOpen(!sourcesOpen)}>{sourcesOpen ? "Close registry ↑" : "Inspect provenance →"}</button></div>
        </section>}
        {sourcesOpen && <section className="registry-panel">
          <div className="registry-head"><div><span className="eyebrow">SOURCE CONTROL</span><h2>Active source registry</h2></div><p>Every source is classified by proximity to evidence. Tier 1 is primary data or direct institutional evidence; Tier 2 is independent reporting or an interested participant.</p></div>
          <div className="registry-table"><div className="registry-row registry-labels"><span>SOURCE</span><span>DOMAIN</span><span>ACCESS</span><span>TIER</span></div>{(liveData?.registry ?? []).map((source) => <a className="registry-row" href={source.url} target="_blank" rel="noreferrer" key={source.slug}><b>{source.name}</b><span>{source.category}<small>{source.sourceType}</small></span><span>{source.accessMethod}</span><strong>T{source.authorityTier}</strong></a>)}</div>
        </section>}
      </div>
      <footer><a className="brand" href="#top">AULOS <i>NEWS</i></a><p>Evidence before narrative. Context before conclusion.</p><span>Live evidence · Cited deterministic briefs</span></footer>
    </main>
  );
}
