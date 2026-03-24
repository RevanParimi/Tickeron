import { useState, useEffect, useRef } from "react";
import api from "./api";

const COLORS = {
  bg: "#080C14",
  surface: "#0D1420",
  card: "#111827",
  border: "#1E2D45",
  accent: "#00D4FF",
  gold: "#FFB800",
  green: "#00E87A",
  red: "#FF3D5A",
  muted: "#4A6080",
  text: "#E2EAF4",
  dim: "#8BA0BC",
};

const mockWatchlist = [
  { id: 1, symbol: "SUZLON", name: "Suzlon Energy", price: 58.4, change: +3.2, signal: "BUY", sentiment: 82, sector: "Renewables" },
  { id: 2, symbol: "IREDA", name: "IREDA Ltd", price: 172.5, change: -1.8, signal: "HOLD", sentiment: 61, sector: "Finance" },
  { id: 3, symbol: "TRENT", name: "Trent Ltd", price: 5840, change: +1.1, signal: "BUY", sentiment: 74, sector: "Retail" },
  { id: 4, symbol: "PAYTM", name: "Paytm", price: 621, change: -2.4, signal: "WATCH", sentiment: 45, sector: "Fintech" },
  { id: 5, symbol: "SILVER", name: "Silver Futures", price: 87.2, change: +0.6, signal: "ACCUMULATE", sentiment: 67, sector: "Commodity" },
];

const agentNodes = [
  { id: "browse", label: "Web Scout", icon: "🌐", desc: "Real-time news, filings, analyst notes", x: 50, y: 10 },
  { id: "macro", label: "Macro Lens", icon: "🌍", desc: "Geopolitical signals, war, policy", x: 15, y: 40 },
  { id: "sector", label: "Sector Pulse", icon: "🏭", desc: "Industry demand, supply chain", x: 85, y: 40 },
  { id: "quant", label: "Quant Engine", icon: "📊", desc: "Historical patterns, seasonality", x: 35, y: 65 },
  { id: "corp", label: "Corp Radar", icon: "🏢", desc: "Mega-company needs & dependencies", x: 65, y: 65 },
  { id: "synth", label: "Synthesis Core", icon: "⚡", desc: "Trend confidence scoring", x: 50, y: 90 },
];

const agentEdges = [
  ["browse", "macro"], ["browse", "sector"], ["browse", "quant"],
  ["macro", "synth"], ["sector", "corp"], ["quant", "synth"], ["corp", "synth"],
];

const TABS = ["Overview", "Agent Flow", "Watchlist", "Trends", "Roadmap"];

function MiniSparkline({ up }) {
  const points = up
    ? "0,20 10,18 20,15 30,16 40,12 50,10 60,8 70,9 80,5 90,3"
    : "0,5 10,7 20,6 30,10 40,12 50,11 60,15 70,16 80,18 90,20";
  return (
    <svg width="90" height="24" viewBox="0 0 90 24">
      <polyline points={points} fill="none" stroke={up ? COLORS.green : COLORS.red} strokeWidth="1.5" />
    </svg>
  );
}

function AgentFlowTab() {
  const [active, setActive] = useState(null);
  const svgRef = useRef();

  const getCoords = (node) => ({
    cx: (node.x / 100) * 560 + 20,
    cy: (node.y / 100) * 300 + 20,
  });

  return (
    <div style={{ padding: "24px 0" }}>
      <p style={{ color: COLORS.dim, fontSize: 13, marginBottom: 20, letterSpacing: "0.04em" }}>
        AI PIPELINE — AGENT DEPENDENCY GRAPH
      </p>
      <div style={{
        background: COLORS.surface, borderRadius: 16, border: `1px solid ${COLORS.border}`,
        padding: "20px", position: "relative", overflow: "hidden"
      }}>
        <svg ref={svgRef} width="100%" viewBox="0 0 600 340" style={{ display: "block" }}>
          {/* edges */}
          {agentEdges.map(([a, b], i) => {
            const A = agentNodes.find(n => n.id === a);
            const B = agentNodes.find(n => n.id === b);
            const ac = getCoords(A), bc = getCoords(B);
            return (
              <line key={i}
                x1={ac.cx} y1={ac.cy} x2={bc.cx} y2={bc.cy}
                stroke={COLORS.border} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"
              />
            );
          })}
          {/* nodes */}
          {agentNodes.map(node => {
            const { cx, cy } = getCoords(node);
            const isActive = active === node.id;
            const isSynth = node.id === "synth";
            return (
              <g key={node.id} onClick={() => setActive(isActive ? null : node.id)} style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={isSynth ? 38 : 30}
                  fill={isActive ? "#0D2033" : COLORS.card}
                  stroke={isActive ? COLORS.accent : isSynth ? COLORS.gold : COLORS.border}
                  strokeWidth={isActive || isSynth ? 2 : 1}
                />
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16">{node.icon}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9"
                  fill={isActive ? COLORS.accent : COLORS.text} fontWeight="600" letterSpacing="0.05em">
                  {node.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        {active && (() => {
          const node = agentNodes.find(n => n.id === active);
          return (
            <div style={{
              position: "absolute", bottom: 16, left: 16,
              background: "#0A1829", border: `1px solid ${COLORS.accent}`,
              borderRadius: 10, padding: "10px 16px", minWidth: 200
            }}>
              <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 12 }}>{node.icon} {node.label}</div>
              <div style={{ color: COLORS.dim, fontSize: 11, marginTop: 4 }}>{node.desc}</div>
            </div>
          );
        })()}
      </div>

      {/* Gap-fill: What makes this billion dollar */}
      <div style={{ marginTop: 28 }}>
        <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 14 }}>
          BILLION-DOLLAR GAPS → FILLED
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "🔔", gap: "Alert Personalization", fill: "Push notifications on user's watchlist triggers — not generic noise" },
            { icon: "🧭", gap: "Trend Confidence Bands", fill: "Not price targets. Probabilistic ranges with season overlays" },
            { icon: "🤝", gap: "Community Consensus", fill: "Anonymized aggregate sentiment from platform users vs AI signal" },
            { icon: "📱", gap: "WhatsApp / Telegram Bot", fill: "AI weekly digest delivered on user's preferred channel" },
            { icon: "🏦", gap: "Broker Integration", fill: "Link Zerodha/Groww to see portfolio context (read-only)" },
            { icon: "🧠", gap: "Explainability Layer", fill: "Every signal shows WHY — sources, agent reasoning chain" },
          ].map(item => (
            <div key={item.gap} style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, padding: "12px 14px"
            }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ color: COLORS.accent, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{item.gap}</div>
              <div style={{ color: COLORS.dim, fontSize: 11, lineHeight: 1.5 }}>{item.fill}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WatchlistTab() {
  const [watchlist, setWatchlist] = useState([]);
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newSector, setNewSector] = useState("");
  const [addError, setAddError] = useState("");

  async function fetchWatchlist() {
    try {
      const { data } = await api.get("/watchlist");
      setWatchlist(data);
      // Fetch signals for each item
      data.forEach(async (item) => {
        try {
          const { data: sig } = await api.get(`/signal/${item.symbol}`);
          setSignals(prev => ({ ...prev, [item.symbol]: sig }));
        } catch (_) {}
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWatchlist(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      await api.post("/watchlist", {
        symbol: newSymbol.toUpperCase(),
        sector: newSector || "Unknown",
        asset_type: "equity",
      });
      setNewSymbol(""); setNewSector("");
      await fetchWatchlist();
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to add symbol");
    } finally {
      setAdding(false);
    }
  }

  const signalColor = (s) => ({ BUY: COLORS.green, HOLD: COLORS.gold, WATCH: COLORS.dim, ACCUMULATE: COLORS.accent, AVOID: COLORS.red }[s] || COLORS.dim);

  return (
    <div style={{ paddingTop: 24 }}>
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 16 }}>
        MY WATCHLIST — AI SIGNAL OVERLAY
      </p>

      {/* Add symbol form */}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
          placeholder="Symbol (e.g. RELIANCE)" required
          style={{
            flex: "1 1 140px", padding: "8px 12px", background: COLORS.card,
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none",
          }}
        />
        <input
          value={newSector} onChange={e => setNewSector(e.target.value)}
          placeholder="Sector (e.g. Energy)"
          style={{
            flex: "1 1 120px", padding: "8px 12px", background: COLORS.card,
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none",
          }}
        />
        <button type="submit" disabled={adding} style={{
          padding: "8px 18px", background: COLORS.accent, border: "none",
          borderRadius: 8, color: "#000", fontSize: 11, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em",
          opacity: adding ? 0.6 : 1,
        }}>
          {adding ? "ADDING..." : "+ ADD"}
        </button>
      </form>
      {addError && <div style={{ color: COLORS.red, fontSize: 11, marginBottom: 10 }}>{addError}</div>}

      {/* List */}
      {loading ? (
        <div style={{ color: COLORS.dim, fontSize: 12, textAlign: "center", padding: "40px 0" }}>Loading watchlist...</div>
      ) : watchlist.length === 0 ? (
        <div style={{ color: COLORS.dim, fontSize: 12, textAlign: "center", padding: "40px 0" }}>
          No symbols yet. Add one above to start getting AI signals.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {watchlist.map(item => {
            const sig = signals[item.symbol];
            const sc = signalColor(sig?.signal);
            const confidence = sig ? Math.round((sig.confidence || 0.5) * 100) : null;
            return (
              <div key={item.id} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                <div style={{ flex: "0 0 60px" }}>
                  <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 700 }}>{item.symbol}</div>
                  <div style={{ color: COLORS.muted, fontSize: 10 }}>{item.sector || "—"}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: COLORS.dim, fontSize: 11 }}>{item.asset_type?.toUpperCase()}</div>
                  {sig?.summary && (
                    <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 3, lineHeight: 1.4, maxWidth: 400 }}>
                      {sig.summary.slice(0, 90)}…
                    </div>
                  )}
                </div>
                {confidence !== null && (
                  <div style={{ flex: "0 0 80px" }}>
                    <div style={{ fontSize: 10, color: COLORS.dim, marginBottom: 4 }}>CONFIDENCE</div>
                    <div style={{ height: 4, background: COLORS.border, borderRadius: 4 }}>
                      <div style={{
                        height: 4, borderRadius: 4, width: `${confidence}%`,
                        background: confidence > 70 ? COLORS.green : confidence > 50 ? COLORS.gold : COLORS.red
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.dim, marginTop: 3 }}>{confidence}%</div>
                  </div>
                )}
                <div style={{
                  background: sig ? `${sc}18` : COLORS.surface,
                  border: `1px solid ${sig ? sc : COLORS.border}`,
                  color: sig ? sc : COLORS.dim,
                  fontSize: 10, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 20, letterSpacing: "0.08em",
                  whiteSpace: "nowrap",
                }}>
                  {sig ? sig.signal : "PENDING"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: 16, padding: "12px 16px",
        background: "#0A1829", border: `1px solid ${COLORS.border}`,
        borderRadius: 10, color: COLORS.muted, fontSize: 11
      }}>
        Signals are AI-generated trend estimates based on public data. Not SEBI-registered financial advice.
      </div>
    </div>
  );
}

function TrendsTab() {
  const seasons = [
    { label: "Q1 (Jan–Mar)", silver: "↓ Weak", equity: "↑ Budget Rally", global: "Oil demand drop" },
    { label: "Q2 (Apr–Jun)", silver: "↑ Industrial demand", equity: "→ Sideways", global: "Monsoon uncertainty" },
    { label: "Q3 (Jul–Sep)", silver: "↑↑ Peak", equity: "↑ FII inflows", global: "Safe haven demand" },
    { label: "Q4 (Oct–Dec)", silver: "→ Consolidation", equity: "↑ Festive + Capex", global: "US Fed decisions" },
  ];

  const macroSignals = [
    { label: "US–China Tensions", impact: "HIGH", markets: ["Silver ↑", "IT ↓", "Defence ↑"], color: COLORS.red },
    { label: "India Rate Pause", impact: "MED", markets: ["Banks ↑", "NBFCs ↑", "Bonds ↑"], color: COLORS.gold },
    { label: "EV Adoption Wave", impact: "HIGH", markets: ["Lithium ↑", "Suzlon ↑", "IREDA ↑"], color: COLORS.green },
    { label: "China Solar Dump", impact: "MED", markets: ["Adani Green ↓", "Module cos ↓"], color: COLORS.red },
  ];

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Seasonal Calendar */}
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 14 }}>
        SEASONAL MARKET CALENDAR
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {seasons.map(s => (
          <div key={s.label} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "14px 16px"
          }}>
            <div style={{ color: COLORS.accent, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: COLORS.dim }}>Silver  </span>
                <span style={{ color: COLORS.text }}>{s.silver}</span>
              </div>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: COLORS.dim }}>Equity  </span>
                <span style={{ color: COLORS.text }}>{s.equity}</span>
              </div>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: COLORS.dim }}>Trigger  </span>
                <span style={{ color: COLORS.muted }}>{s.global}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Macro signals */}
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 14 }}>
        LIVE MACRO SIGNALS → MARKET IMPACT
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {macroSignals.map(sig => (
          <div key={sig.label} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 16
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>{sig.label}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {sig.markets.map(m => (
                  <span key={m} style={{
                    fontSize: 10, color: COLORS.dim,
                    background: COLORS.surface, borderRadius: 4,
                    padding: "2px 8px", border: `1px solid ${COLORS.border}`
                  }}>{m}</span>
                ))}
              </div>
            </div>
            <div style={{
              color: sig.color, fontSize: 10, fontWeight: 800,
              border: `1px solid ${sig.color}`, borderRadius: 6,
              padding: "4px 10px", letterSpacing: "0.06em"
            }}>
              {sig.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapTab() {
  const phases = [
    {
      phase: "Phase 1", title: "Signal MVP", timeline: "0–3 mo",
      items: ["Watchlist + AI trend signals", "Web browsing agent (Tavily/Serper)", "Seasonal calendar overlay", "Basic macro event parser"],
      status: "BUILD", color: COLORS.accent
    },
    {
      phase: "Phase 2", title: "Intelligence Layer", timeline: "3–6 mo",
      items: ["Multi-agent orchestration (LangGraph)", "Sector dependency graph", "Mega-corp demand tracker", "Confidence bands (not predictions)"],
      status: "PLAN", color: COLORS.gold
    },
    {
      phase: "Phase 3", title: "Social + Distribution", timeline: "6–12 mo",
      items: ["WhatsApp/Telegram digest bot", "Anonymous community consensus", "Broker read-only link (Zerodha)", "Mobile app (React Native)"],
      status: "IDEA", color: COLORS.green
    },
    {
      phase: "Phase 4", title: "Moat & Scale", timeline: "12–24 mo",
      items: ["Proprietary data partnerships", "SEBI RIA licensing pathway", "B2B API for Groww / Zerodha", "Regional language support"],
      status: "VISION", color: COLORS.dim
    },
  ];

  return (
    <div style={{ paddingTop: 24 }}>
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 20 }}>
        PRODUCT ROADMAP — SWIGGY FOR MARKETS
      </p>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        {/* vertical line */}
        <div style={{
          position: "absolute", left: 8, top: 0, bottom: 0,
          width: 2, background: `linear-gradient(to bottom, ${COLORS.accent}, ${COLORS.dim}20)`
        }} />
        {phases.map((p, i) => (
          <div key={p.phase} style={{ marginBottom: 28, position: "relative" }}>
            {/* dot */}
            <div style={{
              position: "absolute", left: -20, top: 2,
              width: 12, height: 12, borderRadius: "50%",
              background: p.color, boxShadow: `0 0 8px ${p.color}`
            }} />
            <div style={{
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: "16px 18px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ color: p.color, fontSize: 11, fontWeight: 700 }}>{p.phase}</div>
                <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                <div style={{ marginLeft: "auto", color: COLORS.dim, fontSize: 11 }}>{p.timeline}</div>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                  color: p.color, border: `1px solid ${p.color}`,
                  borderRadius: 4, padding: "2px 7px"
                }}>{p.status}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {p.items.map(item => (
                  <div key={item} style={{
                    fontSize: 11, color: COLORS.dim,
                    background: COLORS.surface, borderRadius: 6,
                    padding: "4px 10px", border: `1px solid ${COLORS.border}`
                  }}>→ {item}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab() {
  const pillars = [
    { icon: "🔭", title: "Browse & Collect", desc: "Agents scan news, earnings, filings, analyst notes — public internet only" },
    { icon: "🌍", title: "Macro Filter", desc: "War, policy, rates, trade — mapped to Indian market sectors" },
    { icon: "🏭", title: "Sector Wiring", desc: "Understand which mega-corp buying drives which Indian mid-cap" },
    { icon: "📈", title: "Trend Synthesis", desc: "Confidence-based seasonal trend bands, not price targets" },
    { icon: "🎯", title: "Personalized Feed", desc: "User's watchlist gets tailored trend digest — like Swiggy's discovery feed" },
    { icon: "🔒", title: "Zero Inside Trading", desc: "100% public internet data. Clean, legal, explainable" },
  ];

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Hero positioning */}
      <div style={{
        background: "linear-gradient(135deg, #0A1829 0%, #0D2033 100%)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: "28px 24px", marginBottom: 28,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}15 0%, transparent 70%)`
        }} />
        <div style={{ fontSize: 11, color: COLORS.accent, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>
          THE THESIS
        </div>
        <div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 12 }}>
          Groww is the restaurant.<br />
          <span style={{ color: COLORS.accent }}>We're the Swiggy.</span>
        </div>
        <div style={{ color: COLORS.dim, fontSize: 13, lineHeight: 1.7 }}>
          Investors already have platforms to buy/sell. What they lack is intelligent, unbiased trend intelligence — 
          the same research a 5-person analyst team does from public internet, now automated, personalized, delivered.
        </div>
      </div>

      {/* 6 pillars */}
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginBottom: 14 }}>
        CORE CAPABILITIES
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {pillars.map(p => (
          <div key={p.title} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "14px 14px"
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ color: COLORS.text, fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{p.title}</div>
            <div style={{ color: COLORS.dim, fontSize: 11, lineHeight: 1.5 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* vs competition */}
      <p style={{ color: COLORS.dim, fontSize: 13, letterSpacing: "0.04em", marginTop: 28, marginBottom: 14 }}>
        POSITIONING MAP
      </p>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 12, overflow: "hidden"
      }}>
        {[
          ["", "Buy/Sell", "News", "AI Trends", "Personalized", "Explainable"],
          ["Groww / Zerodha", "✅", "❌", "❌", "❌", "❌"],
          ["YouTube Analysts", "❌", "✅", "Partial", "❌", "❌"],
          ["Tickertape", "❌", "✅", "Partial", "❌", "❌"],
          ["MarketPulse AI ✦", "❌", "✅", "✅", "✅", "✅"],
        ].map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1fr",
            padding: "10px 16px",
            background: i === 0 ? COLORS.surface : i === 4 ? "#0A1829" : "transparent",
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            {row.map((cell, j) => (
              <div key={j} style={{
                fontSize: 11,
                color: i === 4 && j === 0 ? COLORS.accent : i === 0 ? COLORS.dim : COLORS.text,
                fontWeight: i === 0 || (i === 4 && j === 0) ? 700 : 400,
                textAlign: j === 0 ? "left" : "center"
              }}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(0);
  const [time, setTime] = useState(new Date());
  const [marketOpen, setMarketOpen] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabContent = [<OverviewTab />, <AgentFlowTab />, <WatchlistTab />, <TrendsTab />, <RoadmapTab />];

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh", color: COLORS.text,
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      maxWidth: 960, margin: "0 auto", padding: "0 0 60px"
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, #0080AA)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900
          }}>M</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.04em" }}>MarketPulse</div>
            <div style={{ fontSize: 9, color: COLORS.dim, letterSpacing: "0.08em" }}>AI TREND INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: marketOpen ? COLORS.green : COLORS.red,
              boxShadow: `0 0 6px ${marketOpen ? COLORS.green : COLORS.red}`
            }} />
            <span style={{ fontSize: 10, color: COLORS.dim }}>
              {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </span>
          </div>
          {user && (
            <span style={{ fontSize: 10, color: COLORS.dim }}>
              {user.name}
            </span>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{
              background: "none", border: `1px solid ${COLORS.border}`,
              color: COLORS.dim, fontSize: 9, padding: "4px 10px",
              borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
              letterSpacing: "0.06em",
            }}>
              LOGOUT
            </button>
          )}
        </div>
      </div>

      {/* Market ticker strip */}
      <div style={{
        background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`,
        padding: "8px 20px", display: "flex", gap: 24, overflowX: "auto",
        scrollbarWidth: "none"
      }}>
        {[
          { label: "NIFTY 50", val: "23,847", chg: "+0.34%" },
          { label: "SENSEX", val: "78,542", chg: "+0.28%" },
          { label: "SILVER", val: "$87.2", chg: "+0.6%" },
          { label: "GOLD", val: "₹72,450", chg: "+0.2%" },
          { label: "USD/INR", val: "83.42", chg: "-0.1%" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 10, color: COLORS.dim }}>{item.label}</span>
            <span style={{ fontSize: 11, color: COLORS.text, fontWeight: 600 }}>{item.val}</span>
            <span style={{ fontSize: 10, color: item.chg.startsWith("+") ? COLORS.green : COLORS.red }}>
              {item.chg}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "12px 20px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        overflowX: "auto", scrollbarWidth: "none"
      }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 14px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", whiteSpace: "nowrap",
            color: activeTab === i ? COLORS.accent : COLORS.dim,
            borderBottom: activeTab === i ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            transition: "all 0.2s", fontFamily: "inherit"
          }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "0 20px" }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
