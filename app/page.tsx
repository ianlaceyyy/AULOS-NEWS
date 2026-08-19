"use client";

import { useMemo, useState } from "react";

type Event = { id: string; category: string; kicker: string; title: string; summary: string; change: string; confidence: number; sources: number; updated: string; tone: string; tags: string[] };

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
  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    const matcher = q.length <= 2 ? new RegExp(`\\b${q.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i") : null;
    return events.filter((event) => {
      const haystack = [event.title, event.summary, event.category, ...event.tags].join(" ");
      return matcher ? matcher.test(haystack) : haystack.toLowerCase().includes(q);
    });
  }, [query]);

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
        <div className="ticker-items">{ticker.map(([label, value, move]) => <div className="ticker-item" key={label}><b>{label}</b><span>{value}</span><em className={move.startsWith("−") ? "down" : "up"}>{move}</em></div>)}</div>
        <span className="live"><i /> LIVE</span>
      </section>

      {briefOpen && <section className="morning-brief">
        <div><span className="eyebrow">YOUR MORNING BRIEF · 19 AUGUST</span><h2>The world changed at three important pressure points.</h2></div>
        <ol><li><b>Rates:</b> Softer labor evidence pulled policy expectations forward, but term premium kept long yields elevated.</li><li><b>Energy:</b> Oil’s risk premium rose without a matching signal from the physical curve.</li><li><b>AI:</b> Utility guidance made power availability a more immediate constraint on data-center growth.</li></ol>
      </section>}

      <div className="page" id="top">
        <section className="page-intro">
          <div><span className="eyebrow">WEDNESDAY · 19 AUGUST 2026 · CHICAGO</span><h1>{activeNav === "World Now" ? "The world, with the signal restored." : activeNav}</h1></div>
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
            <div className="signal-card"><div className="signal-top"><span>POLICY EXPECTATIONS</span><b>SHIFTING</b></div><div className="rate-row"><strong>63%</strong><span>Probability of easing<br />within two meetings</span></div><div className="bar"><i style={{ width: "63%" }} /></div><small>+11 pts over 7 days · CME-implied</small></div>
            <div className="signal-card curve-card"><div className="signal-top"><span>YIELD CURVE</span><b>NORMALIZING</b></div><div className="curve" aria-label="Illustrative yield curve"><div className="curve-line" />{["3M", "2Y", "5Y", "10Y", "30Y"].map((label) => <span key={label}>{label}</span>)}</div><small>Bear steepening over the last session</small></div>
            <div className="watch-card"><span className="eyebrow">NEXT CATALYSTS</span><div><b>08:30 ET</b><p>U.S. housing starts</p></div><div><b>14:00 ET</b><p>FOMC minutes</p></div><div><b>THU</b><p>Initial jobless claims</p></div></div>
            <blockquote>“The purpose is not to eliminate uncertainty. It is to make the uncertainty legible.”<cite>AULOS PRINCIPLE 01</cite></blockquote>
          </aside>
        </section>

        <section className="dossier" id="dossier">
          <div className="dossier-head"><div><span className="eyebrow">LIVE EVENT DOSSIER · {selected.category}</span><h2>{selected.title}</h2></div><div className="confidence"><strong>{selected.confidence}</strong><span>/100<br />CONFIDENCE</span></div></div>
          <div className="dossier-grid">
            <div className="claims"><div className="section-heading"><span>CLAIM LEDGER</span><small>TRACEABLE EVIDENCE</small></div>{claims.map((item) => <div className="claim" key={item.claim}><span className={`status ${item.color}`}>{item.status}</span><div><h3>{item.claim}</h3><p>{item.evidence}</p></div></div>)}</div>
            <div className="perspectives"><div className="section-heading"><span>COMPETING READS</span><small>NOT FALSE BALANCE</small></div>
              <div className="perspective"><b>01</b><div><h3>Controlled normalization</h3><p>Disinflation can continue while policy gradually moves toward neutral.</p><span>Fed officials · labor data · market consensus</span></div></div>
              <div className="perspective"><b>02</b><div><h3>Premature easing risk</h3><p>Sticky services prices make the final stage of disinflation structurally harder.</p><span>Regional Fed research · inflation hawks</span></div></div>
              <div className="perspective"><b>03</b><div><h3>Fiscal dominance</h3><p>Long yields increasingly reflect supply and term premium rather than the policy path.</p><span>Treasury data · independent strategists</span></div></div>
            </div>
          </div>
          <div className="source-strip"><span>SOURCE MIX</span><b>{selected.sources} sources</b><i /><span>6 primary</span><span>7 independent reports</span><span>5 specialist analyses</span><button>Inspect provenance →</button></div>
        </section>
      </div>
      <footer><a className="brand" href="#top">AULOS <i>NEWS</i></a><p>Evidence before narrative. Context before conclusion.</p><span>Prototype intelligence environment · Data is illustrative</span></footer>
    </main>
  );
}
