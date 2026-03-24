import { useState } from "react";

const C = {
  bg: "#070B12",
  surface: "#0C1219",
  card: "#101820",
  card2: "#141E2A",
  border: "#1A2840",
  accent: "#00C8F0",
  gold: "#F0A500",
  green: "#00D97A",
  red: "#FF3558",
  purple: "#9B6BFF",
  muted: "#3D5872",
  text: "#D8E8F5",
  dim: "#6A8AA8",
};

const TABS = ["Tech Stack", "Agent System", "Data Flow", "API Design", "Infra & Scale"];

// ─── TAB 1: TECH STACK ────────────────────────────────────────────────────────
function TechStackTab() {
  const [hover, setHover] = useState(null);
  const stack = [
    {
      layer: "Frontend", icon: "🖥️", color: C.accent,
      items: [
        { name: "React + Vite", role: "SPA shell", why: "Fast HMR, tree-shaking, ideal for dashboard apps" },
        { name: "TailwindCSS", role: "Styling", why: "Utility-first — rapid iteration for startup speed" },
        { name: "Recharts / D3", role: "Charts & sparklines", why: "Lightweight, composable, SSR-friendly" },
        { name: "React Query", role: "Server state", why: "Polling, caching, background refetch for live data" },
        { name: "Zustand", role: "Client state", why: "Minimal boilerplate vs Redux for watchlist/prefs" },
      ]
    },
    {
      layer: "API Gateway", icon: "⚡", color: C.gold,
      items: [
        { name: "FastAPI", role: "REST + WebSocket", why: "Async Python, OpenAPI auto-docs, native Pydantic" },
        { name: "WebSockets", role: "Live price feed", why: "Push ticks to frontend without polling overhead" },
        { name: "Celery + Redis", role: "Task queue", why: "Agent runs are async jobs — fire and track" },
        { name: "JWT Auth", role: "Auth layer", why: "Stateless, works for mobile + web + Telegram bot" },
      ]
    },
    {
      layer: "AI / Agent Core", icon: "🧠", color: C.purple,
      items: [
        { name: "LangGraph", role: "Agent orchestration", why: "Stateful graph — retry, branch, conditional edges" },
        { name: "LangChain", role: "Tool abstractions", why: "Tavily search, scraping, document loaders" },
        { name: "Groq (LLaMA 3.3 70B)", role: "Inference", why: "Ultra-fast, cheap, great for chain-of-thought" },
        { name: "Claude Sonnet (fallback)", role: "Complex synthesis", why: "Better reasoning for macro signal interpretation" },
        { name: "Tavily API", role: "Web search tool", why: "LLM-optimized search — clean structured results" },
        { name: "Firecrawl", role: "Deep scrape", why: "Full-page extraction for annual reports, filings" },
      ]
    },
    {
      layer: "Data & Storage", icon: "🗄️", color: C.green,
      items: [
        { name: "PostgreSQL", role: "Primary DB", why: "Users, watchlist, signal history, audit logs" },
        { name: "Redis", role: "Cache + pub/sub", why: "Price ticks, session cache, real-time event bus" },
        { name: "ChromaDB / Qdrant", role: "Vector store", why: "Embed news/filings for semantic trend retrieval" },
        { name: "TimescaleDB", role: "Time-series", why: "Price history, signal confidence over time" },
        { name: "S3 / MinIO", role: "Object store", why: "Raw scraped HTML, PDF filings, agent run logs" },
      ]
    },
    {
      layer: "Data Ingestion", icon: "📡", color: "#FF8C42",
      items: [
        { name: "NSE/BSE APIs", role: "Price feed", why: "Official OHLCV data — legally safe" },
        { name: "Yahoo Finance (yfinance)", role: "Historical data", why: "Free, reliable for backtesting seasonal patterns" },
        { name: "Tavily + SerpAPI", role: "News harvest", why: "Trigger on watchlist symbols — event-driven" },
        { name: "RSS (ET, Moneycontrol)", role: "News stream", why: "Low-latency financial news without scraping" },
        { name: "FRED / World Bank API", role: "Macro indicators", why: "Interest rates, inflation, trade data — free" },
      ]
    },
    {
      layer: "Infra / DevOps", icon: "☁️", color: C.dim,
      items: [
        { name: "Railway / Render (MVP)", role: "Hosting", why: "Zero DevOps overhead for early stages" },
        { name: "AWS EKS (scale)", role: "K8s cluster", why: "Your existing Kubernetes expertise — smooth transition" },
        { name: "ArgoCD + Helm", role: "GitOps deploy", why: "You already use this at IBM — reuse the playbook" },
        { name: "Prometheus + Grafana", role: "Observability", why: "Monitor agent runs, API latency, LLM costs" },
        { name: "GitHub Actions", role: "CI/CD", why: "Auto-test and deploy on PR merge" },
      ]
    },
  ];

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 20 }}>
        FULL STACK — LAYER BY LAYER
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {stack.map((layer, li) => (
          <div key={layer.layer} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden"
          }}>
            <div style={{
              padding: "12px 18px",
              background: `linear-gradient(90deg, ${layer.color}18, transparent)`,
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span style={{ fontSize: 16 }}>{layer.icon}</span>
              <span style={{ color: layer.color, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" }}>
                {layer.layer.toUpperCase()}
              </span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {layer.items.map((item, ii) => (
                <div key={item.name}
                  onMouseEnter={() => setHover(`${li}-${ii}`)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    display: "grid", gridTemplateColumns: "160px 1fr",
                    gap: 12, alignItems: "start",
                    padding: "6px 8px", borderRadius: 8,
                    background: hover === `${li}-${ii}` ? `${layer.color}0A` : "transparent",
                    transition: "background 0.15s", cursor: "default"
                  }}>
                  <div>
                    <div style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: layer.color, fontSize: 10, marginTop: 2, opacity: 0.8 }}>{item.role}</div>
                  </div>
                  <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.5 }}>{item.why}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 2: AGENT SYSTEM ─────────────────────────────────────────────────────
function AgentSystemTab() {
  const [selected, setSelected] = useState(0);
  const agents = [
    {
      name: "WebScoutAgent",
      icon: "🌐", color: C.accent,
      trigger: "Symbol added to watchlist OR cron every 4h",
      tools: ["tavily_search", "firecrawl_scrape", "rss_reader", "pdf_loader"],
      inputs: ["symbol: str", "sector: str", "lookback_days: int"],
      outputs: ["news_chunks: List[Doc]", "filing_summaries: List[str]", "sentiment_raw: float"],
      logic: `
1. Search: "{symbol} news site:moneycontrol.com OR economictimes.com"
2. Search: "{symbol} annual report OR earnings call {year}"
3. Scrape top 5 results → chunk → embed → store in ChromaDB
4. Score sentiment via LLM (bullish/bearish/neutral + confidence)
5. Return structured NewsBundle`,
      model: "Groq LLaMA 3.3 70B",
      avgRuntime: "~8s",
    },
    {
      name: "MacroLensAgent",
      icon: "🌍", color: C.gold,
      trigger: "Daily 6AM IST + on major news event detection",
      tools: ["tavily_search", "fred_api", "worldbank_api", "rss_geopolitics"],
      inputs: ["watchlist_sectors: List[str]", "region: str = 'India'"],
      outputs: ["macro_signals: List[MacroSignal]", "sector_impact_map: Dict[str, ImpactScore]"],
      logic: `
1. Fetch global events: wars, sanctions, trade policy, rate decisions
2. Map event → affected commodities/sectors using LLM reasoning
3. Cross-reference with FRED: US rates, DXY, oil, inflation
4. For India-specific: check RBI circulars, GOI press releases
5. Score each sector: TAILWIND / HEADWIND / NEUTRAL + magnitude`,
      model: "Claude Sonnet (complex geopolitical reasoning)",
      avgRuntime: "~15s",
    },
    {
      name: "SectorPulseAgent",
      icon: "🏭", color: "#FF8C42",
      trigger: "Weekly Sunday 10PM IST + on earnings season",
      tools: ["tavily_search", "yfinance_tool", "nse_api"],
      inputs: ["sector: str", "sub_sector: str"],
      outputs: ["sector_momentum: float", "peer_comparison: List[PeerData]", "demand_signals: List[str]"],
      logic: `
1. Identify top 10 companies in sector
2. Fetch recent earnings surprises, order books, capex announcements
3. Track FII/DII flow data for the sector
4. Identify demand signals: govt contracts, infra spend, PLI scheme updates
5. Compute relative momentum vs Nifty sector indices`,
      model: "Groq LLaMA 3.3 70B",
      avgRuntime: "~12s",
    },
    {
      name: "CorpRadarAgent",
      icon: "🏢", color: C.purple,
      trigger: "Triggered by SectorPulseAgent OR weekly",
      tools: ["tavily_search", "firecrawl_scrape", "sec_edgar_api"],
      inputs: ["target_company: str", "dependency_type: str"],
      outputs: ["upstream_demand: List[DemandSignal]", "customer_health: float", "order_pipeline: str"],
      logic: `
1. Find mega-corp customers of target company (e.g. Apple → Dixon)
2. Scrape Apple/Samsung earnings for India manufacturing plans
3. Search for contract renewals, new orders, vendor diversification news
4. Check US/EU regulatory filings for supply chain disclosures
5. Score: EXPANDING / STABLE / CONTRACTING demand from mega-corps`,
      model: "Groq LLaMA 3.3 70B",
      avgRuntime: "~18s",
    },
    {
      name: "QuantEngine",
      icon: "📊", color: C.green,
      trigger: "On new price data OR weekly recompute",
      tools: ["yfinance_tool", "timescaledb_query", "pandas_tool"],
      inputs: ["symbol: str", "lookback_years: int = 5"],
      outputs: ["seasonal_bands: SeasonalPattern", "support_resistance: List[float]", "trend_confidence: float"],
      logic: `
1. Fetch 5yr OHLCV data from TimescaleDB / yfinance
2. Compute monthly return distribution → seasonal heatmap
3. Identify recurring patterns (pre-budget rally, Q1 weakness etc.)
4. Calculate rolling correlation with macro indicators (DXY, oil, VIX)
5. Output: trend direction + confidence band (NOT price target)`,
      model: "Python (no LLM — pure quant)",
      avgRuntime: "~3s",
    },
    {
      name: "SynthesisCore",
      icon: "⚡", color: "#FF4FA3",
      trigger: "After all upstream agents complete (LangGraph fan-in)",
      tools: ["chromadb_query", "postgres_write"],
      inputs: ["news_bundle", "macro_signals", "sector_data", "corp_radar", "quant_pattern"],
      outputs: ["final_signal: TrendSignal", "confidence: float", "reasoning_chain: str", "sources: List[URL]"],
      logic: `
1. Receive outputs from all 5 upstream agents via LangGraph state
2. Weighted scoring:
   - Macro signal:     25%
   - Sector momentum:  20%
   - Corp radar:       20%
   - News sentiment:   20%
   - Quant pattern:    15%
3. LLM synthesizes reasoning in plain language
4. Classify: STRONG_BUY / BUY / ACCUMULATE / HOLD / WATCH / AVOID
5. Attach full source chain for explainability
6. Store in PostgreSQL + push to Redis pub/sub → frontend`,
      model: "Claude Sonnet (final synthesis)",
      avgRuntime: "~10s",
    },
  ];

  const a = agents[selected];
  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 16 }}>AGENT REGISTRY</div>
      {/* Agent selector pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {agents.map((ag, i) => (
          <button key={ag.name} onClick={() => setSelected(i)} style={{
            background: selected === i ? `${ag.color}20` : C.card,
            border: `1px solid ${selected === i ? ag.color : C.border}`,
            color: selected === i ? ag.color : C.dim,
            borderRadius: 20, padding: "5px 14px", fontSize: 11,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "0.04em", transition: "all 0.15s"
          }}>
            {ag.icon} {ag.name.replace("Agent", "").replace("Core", "").replace("Engine", "")}
          </button>
        ))}
      </div>

      {/* Agent detail card */}
      <div style={{
        background: C.card, border: `1px solid ${a.color}40`,
        borderRadius: 16, overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(90deg, ${a.color}18, transparent)`,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <div>
              <div style={{ color: a.color, fontSize: 14, fontWeight: 800 }}>{a.name}</div>
              <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>🤖 {a.model}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.dim, fontSize: 10 }}>AVG RUNTIME</div>
            <div style={{ color: C.green, fontSize: 13, fontWeight: 700 }}>{a.avgRuntime}</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Trigger */}
          <div>
            <div style={{ color: C.dim, fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>TRIGGER</div>
            <div style={{
              background: C.surface, borderRadius: 8, padding: "8px 12px",
              color: C.text, fontSize: 11, borderLeft: `3px solid ${a.color}`
            }}>{a.trigger}</div>
          </div>

          {/* I/O */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: C.dim, fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>INPUTS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {a.inputs.map(inp => (
                  <div key={inp} style={{
                    background: C.surface, borderRadius: 6, padding: "5px 10px",
                    fontSize: 10, color: "#7FDBFF", fontFamily: "monospace"
                  }}>{inp}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: C.dim, fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>OUTPUTS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {a.outputs.map(out => (
                  <div key={out} style={{
                    background: C.surface, borderRadius: 6, padding: "5px 10px",
                    fontSize: 10, color: "#98FF8A", fontFamily: "monospace"
                  }}>{out}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Tools */}
          <div>
            <div style={{ color: C.dim, fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>TOOLS USED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {a.tools.map(t => (
                <span key={t} style={{
                  background: `${a.color}12`, border: `1px solid ${a.color}40`,
                  color: a.color, fontSize: 10, borderRadius: 6, padding: "3px 10px",
                  fontFamily: "monospace"
                }}>🔧 {t}</span>
              ))}
            </div>
          </div>

          {/* Logic */}
          <div>
            <div style={{ color: C.dim, fontSize: 10, letterSpacing: "0.08em", marginBottom: 6 }}>EXECUTION LOGIC</div>
            <pre style={{
              background: "#060C14", borderRadius: 10, padding: "14px 16px",
              fontSize: 11, color: C.dim, lineHeight: 1.7, margin: 0,
              border: `1px solid ${C.border}`, whiteSpace: "pre-wrap",
              fontFamily: "'Fira Code', monospace"
            }}>
              <span style={{ color: a.color }}>{a.name}</span>{a.logic}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: DATA FLOW ─────────────────────────────────────────────────────────
function DataFlowTab() {
  const flows = [
    {
      title: "User Adds Symbol to Watchlist",
      color: C.accent,
      steps: [
        { actor: "Frontend", action: "POST /api/watchlist/add { symbol: 'SUZLON' }", type: "http" },
        { actor: "FastAPI", action: "Save to PostgreSQL, publish event to Redis", type: "db" },
        { actor: "Celery Worker", action: "Dequeue → spawn LangGraph run for SUZLON", type: "queue" },
        { actor: "WebScoutAgent", action: "Search news + filings, embed to ChromaDB", type: "agent" },
        { actor: "MacroLensAgent", action: "Check macro signals relevant to Renewables sector", type: "agent" },
        { actor: "SynthesisCore", action: "Score + generate trend signal with reasoning", type: "agent" },
        { actor: "Redis Pub/Sub", action: "Push signal update to user's WebSocket channel", type: "realtime" },
        { actor: "Frontend", action: "Watchlist card updates live with new signal", type: "http" },
      ]
    },
    {
      title: "Daily Macro Refresh (6AM IST)",
      color: C.gold,
      steps: [
        { actor: "Celery Beat", action: "Trigger MacroLensAgent for all active sectors", type: "queue" },
        { actor: "MacroLensAgent", action: "Fetch global events, rate decisions, geopolitical signals", type: "agent" },
        { actor: "SectorPulseAgent", action: "Re-score all sectors based on new macro context", type: "agent" },
        { actor: "SynthesisCore", action: "Recalculate signals for all watchlist items", type: "agent" },
        { actor: "Notification Service", action: "Check user alert thresholds, fire WhatsApp/Push", type: "notify" },
        { actor: "TimescaleDB", action: "Write signal history snapshot for trend charts", type: "db" },
      ]
    },
    {
      title: "User Requests Trend Explanation",
      color: C.purple,
      steps: [
        { actor: "Frontend", action: "GET /api/signal/SUZLON/explain", type: "http" },
        { actor: "FastAPI", action: "Fetch latest signal + reasoning chain from PostgreSQL", type: "db" },
        { actor: "ChromaDB", action: "Retrieve top 5 source chunks used in synthesis", type: "db" },
        { actor: "FastAPI", action: "Assemble: signal + reasoning + sources → response", type: "http" },
        { actor: "Frontend", action: "Render explainability panel with source links", type: "http" },
      ]
    }
  ];

  const typeColors = {
    http: C.accent, db: C.green, queue: C.gold,
    agent: C.purple, realtime: "#FF8C42", notify: C.dim
  };

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 20 }}>
        END-TO-END DATA FLOWS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {flows.map(flow => (
          <div key={flow.title} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden"
          }}>
            <div style={{
              padding: "12px 18px",
              background: `linear-gradient(90deg, ${flow.color}15, transparent)`,
              borderBottom: `1px solid ${C.border}`,
              color: flow.color, fontSize: 12, fontWeight: 800, letterSpacing: "0.06em"
            }}>▶ {flow.title.toUpperCase()}</div>
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 0 }}>
              {flow.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 0 }}>
                  {/* timeline */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 14 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: `${typeColors[step.type]}20`,
                      border: `1.5px solid ${typeColors[step.type]}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: typeColors[step.type], fontWeight: 700
                    }}>{i + 1}</div>
                    {i < flow.steps.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: C.border, minHeight: 16 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 14, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ color: C.text, fontSize: 11, fontWeight: 700 }}>{step.actor}</span>
                      <span style={{
                        fontSize: 9, color: typeColors[step.type],
                        border: `1px solid ${typeColors[step.type]}`,
                        borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em"
                      }}>{step.type.toUpperCase()}</span>
                    </div>
                    <div style={{
                      fontFamily: "monospace", fontSize: 10, color: C.dim,
                      background: C.surface, borderRadius: 6, padding: "5px 10px",
                      border: `1px solid ${C.border}`
                    }}>{step.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 4: API DESIGN ────────────────────────────────────────────────────────
function ApiDesignTab() {
  const [expanded, setExpanded] = useState(null);
  const endpoints = [
    {
      group: "Auth", color: C.dim,
      routes: [
        { method: "POST", path: "/auth/register", desc: "Email + password signup", body: '{"email","password","name"}', res: '{"token","user"}' },
        { method: "POST", path: "/auth/login", desc: "Get JWT token", body: '{"email","password"}', res: '{"access_token","refresh_token"}' },
        { method: "POST", path: "/auth/refresh", desc: "Rotate tokens", body: '{"refresh_token"}', res: '{"access_token"}' },
      ]
    },
    {
      group: "Watchlist", color: C.accent,
      routes: [
        { method: "GET", path: "/watchlist", desc: "Get user's full watchlist with latest signals", body: null, res: '{"items":[{symbol,signal,confidence,sentiment}]}' },
        { method: "POST", path: "/watchlist/add", desc: "Add symbol — triggers async agent run", body: '{"symbol":"SUZLON","type":"equity"}', res: '{"status":"queued","job_id"}' },
        { method: "DELETE", path: "/watchlist/{symbol}", desc: "Remove symbol", body: null, res: '{"removed":true}' },
      ]
    },
    {
      group: "Signals", color: C.purple,
      routes: [
        { method: "GET", path: "/signal/{symbol}", desc: "Latest trend signal + confidence", body: null, res: '{"signal","confidence","band_low","band_high","timestamp"}' },
        { method: "GET", path: "/signal/{symbol}/explain", desc: "Full reasoning chain + sources", body: null, res: '{"reasoning","sources","agent_weights","raw_scores"}' },
        { method: "GET", path: "/signal/{symbol}/history", desc: "Signal history for trend chart", body: null, res: '{"history":[{date,signal,confidence}]}' },
      ]
    },
    {
      group: "Macro & Trends", color: C.gold,
      routes: [
        { method: "GET", path: "/macro/signals", desc: "Current global macro signals", body: null, res: '{"signals":[{event,impact,sectors_affected}]}' },
        { method: "GET", path: "/trends/seasonal/{symbol}", desc: "Seasonal pattern for symbol", body: null, res: '{"monthly_returns","best_months","worst_months"}' },
        { method: "GET", path: "/trends/sector/{sector}", desc: "Sector-level trend overview", body: null, res: '{"momentum","peer_comparison","demand_signals"}' },
      ]
    },
    {
      group: "Alerts", color: "#FF8C42",
      routes: [
        { method: "POST", path: "/alerts/create", desc: "Create signal-change alert for symbol", body: '{"symbol","condition":"signal_changes_to","value":"BUY"}', res: '{"alert_id","active":true}' },
        { method: "GET", path: "/alerts", desc: "List all active alerts", body: null, res: '{"alerts":[{id,symbol,condition,created_at}]}' },
        { method: "DELETE", path: "/alerts/{id}", desc: "Delete alert", body: null, res: '{"deleted":true}' },
      ]
    },
    {
      group: "WebSocket", color: C.green,
      routes: [
        { method: "WS", path: "/ws/feed/{user_id}", desc: "Live feed: price ticks + signal updates for watchlist", body: "Bearer token in header", res: '{"type":"signal_update"|"price_tick","data":{...}}' },
      ]
    },
  ];

  const methodColors = { GET: C.green, POST: C.accent, DELETE: C.red, WS: C.gold };

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 20 }}>
        REST API + WEBSOCKET CONTRACTS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {endpoints.map((group, gi) => (
          <div key={group.group} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden"
          }}>
            <div style={{
              padding: "10px 18px",
              background: `linear-gradient(90deg, ${group.color}15, transparent)`,
              borderBottom: `1px solid ${C.border}`,
              color: group.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em"
            }}>/{group.group.toUpperCase()}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {group.routes.map((r, ri) => {
                const key = `${gi}-${ri}`;
                const isOpen = expanded === key;
                return (
                  <div key={r.path}>
                    <div onClick={() => setExpanded(isOpen ? null : key)}
                      style={{
                        padding: "10px 18px", display: "flex", alignItems: "center", gap: 12,
                        cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                        background: isOpen ? `${group.color}08` : "transparent",
                        transition: "background 0.15s"
                      }}>
                      <span style={{
                        color: methodColors[r.method] || C.dim,
                        fontSize: 10, fontWeight: 800, fontFamily: "monospace",
                        minWidth: 36
                      }}>{r.method}</span>
                      <span style={{ color: C.text, fontSize: 11, fontFamily: "monospace", flex: 1 }}>{r.path}</span>
                      <span style={{ color: C.dim, fontSize: 11 }}>{r.desc}</span>
                      <span style={{ color: C.muted, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div style={{
                        padding: "12px 18px", background: "#060C14",
                        borderBottom: `1px solid ${C.border}`,
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12
                      }}>
                        <div>
                          <div style={{ color: C.dim, fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>REQUEST BODY</div>
                          <pre style={{
                            margin: 0, background: C.surface, borderRadius: 8,
                            padding: "10px 12px", fontSize: 10, color: "#98FF8A",
                            fontFamily: "monospace", border: `1px solid ${C.border}`,
                            whiteSpace: "pre-wrap"
                          }}>{r.body || "— (no body)"}</pre>
                        </div>
                        <div>
                          <div style={{ color: C.dim, fontSize: 9, letterSpacing: "0.1em", marginBottom: 6 }}>RESPONSE</div>
                          <pre style={{
                            margin: 0, background: C.surface, borderRadius: 8,
                            padding: "10px 12px", fontSize: 10, color: "#7FDBFF",
                            fontFamily: "monospace", border: `1px solid ${C.border}`,
                            whiteSpace: "pre-wrap"
                          }}>{r.res}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 5: INFRA & SCALE ────────────────────────────────────────────────────
function InfraTab() {
  const phases = [
    {
      phase: "MVP (0–500 users)", color: C.accent, icon: "🚀",
      monthly_cost: "~$40–80/mo",
      infra: [
        { name: "Railway / Render", role: "FastAPI + Celery", note: "1 dyno, free tier ok" },
        { name: "Supabase", role: "PostgreSQL + Auth", note: "Free up to 500MB" },
        { name: "Upstash Redis", role: "Cache + queue", note: "Serverless, pay-per-request" },
        { name: "ChromaDB (local)", role: "Vector store", note: "In-process for MVP" },
        { name: "Groq API", role: "LLM inference", note: "Free tier 30 req/min" },
        { name: "Vercel", role: "Frontend CDN", note: "Free tier, edge-optimized" },
      ]
    },
    {
      phase: "Growth (500–50k users)", color: C.gold, icon: "📈",
      monthly_cost: "~$400–1200/mo",
      infra: [
        { name: "AWS ECS / EKS (t3.medium)", role: "API + worker pods", note: "Your k8s expertise applies" },
        { name: "RDS PostgreSQL (t3.small)", role: "Primary DB + TimescaleDB", note: "Multi-AZ for HA" },
        { name: "ElastiCache Redis", role: "Managed Redis cluster", note: "Replicated, AOF persistence" },
        { name: "Qdrant Cloud", role: "Managed vector DB", note: "Better than Chroma at scale" },
        { name: "CloudFront + S3", role: "Static assets + logs", note: "Edge caching globally" },
        { name: "Groq + Claude API", role: "Multi-model routing", note: "Route by agent complexity" },
      ]
    },
    {
      phase: "Scale (50k+ users)", color: C.green, icon: "🏢",
      monthly_cost: "~$3k–10k/mo",
      infra: [
        { name: "EKS multi-AZ + HPA", role: "Auto-scaling agent workers", note: "ArgoCD GitOps — your domain" },
        { name: "Aurora PostgreSQL", role: "Read replicas + PITR", note: "Sub-ms reads for signal feed" },
        { name: "Redis Cluster (6-node)", role: "Sharded, 99.99% uptime", note: "Partitioned by user region" },
        { name: "Self-hosted Qdrant", role: "Cost-optimized vectors", note: "On spot instances with NVMe" },
        { name: "Bedrock / vLLM", role: "LLM cost control", note: "Fine-tuned model for India finance" },
        { name: "Jaeger + Grafana", role: "Full observability stack", note: "MMCMEDCOMP pattern reused" },
      ]
    },
  ];

  const costBreakdown = [
    { item: "LLM API (Groq + Claude)", mvp: "$15", growth: "$300", scale: "$2000" },
    { item: "Hosting (servers)", mvp: "$20", growth: "$600", scale: "$4000" },
    { item: "Data APIs (Tavily, NSE)", mvp: "$10", growth: "$200", scale: "$800" },
    { item: "Storage (DB + vector)", mvp: "$0", growth: "$150", scale: "$1200" },
    { item: "CDN + bandwidth", mvp: "$0", growth: "$50", scale: "$500" },
  ];

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 20 }}>
        INFRA EVOLUTION — 3 PHASES
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 30 }}>
        {phases.map(p => (
          <div key={p.phase} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden"
          }}>
            <div style={{
              padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: `linear-gradient(90deg, ${p.color}15, transparent)`,
              borderBottom: `1px solid ${C.border}`
            }}>
              <div style={{ color: p.color, fontSize: 12, fontWeight: 800 }}>{p.icon} {p.phase}</div>
              <div style={{
                color: p.color, fontSize: 11, background: `${p.color}15`,
                border: `1px solid ${p.color}40`, borderRadius: 20, padding: "3px 12px"
              }}>{p.monthly_cost}</div>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 7 }}>
              {p.infra.map(item => (
                <div key={item.name} style={{
                  display: "grid", gridTemplateColumns: "160px 140px 1fr", gap: 10, alignItems: "start"
                }}>
                  <div style={{ color: C.text, fontSize: 11, fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: p.color, fontSize: 10, opacity: 0.8 }}>{item.role}</div>
                  <div style={{ color: C.dim, fontSize: 10 }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cost table */}
      <div style={{ color: C.dim, fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>
        MONTHLY COST BREAKDOWN
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        {[["Cost Item", "MVP", "Growth", "Scale"], ...costBreakdown.map(r => [r.item, r.mvp, r.growth, r.scale])].map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
            padding: "10px 18px",
            background: i === 0 ? C.surface : i % 2 === 0 ? `${C.card2}` : "transparent",
            borderBottom: `1px solid ${C.border}`
          }}>
            {row.map((cell, j) => (
              <div key={j} style={{
                fontSize: 11,
                color: i === 0 ? C.dim : j === 0 ? C.text : j === 1 ? C.accent : j === 2 ? C.gold : C.green,
                fontWeight: i === 0 ? 700 : j === 0 ? 400 : 700,
                letterSpacing: i === 0 ? "0.06em" : 0,
                textAlign: j === 0 ? "left" : "right"
              }}>{cell}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div style={{
        marginTop: 20, padding: "14px 18px",
        background: "#0A1829", border: `1px solid ${C.gold}40`,
        borderRadius: 10, borderLeft: `3px solid ${C.gold}`
      }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>💡 LEVERAGE YOUR IBM STACK</div>
        <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.7 }}>
          Your existing expertise in EKS, ArgoCD, Helm, Jaeger, Prometheus + Grafana 
          is the exact infra needed at Phase 3. Zero learning curve — this is your competitive moat in execution speed.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const content = [<TechStackTab />, <AgentSystemTab />, <DataFlowTab />, <ApiDesignTab />, <InfraTab />];
  const icons = ["🧱", "🤖", "🔄", "📡", "☁️"];

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      maxWidth: 760, margin: "0 auto", paddingBottom: 60
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, background: C.bg, zIndex: 100
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: `linear-gradient(135deg, ${C.accent}, #0070A0)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 900, color: "#fff"
        }}>M</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.04em" }}>MarketPulse AI</div>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: "0.1em" }}>BACKEND ARCHITECTURE v0.1</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["FastAPI", "LangGraph", "Groq"].map(t => (
            <span key={t} style={{
              fontSize: 9, color: C.muted, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: "2px 7px", letterSpacing: "0.04em"
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${C.border}`,
        overflowX: "auto", scrollbarWidth: "none", padding: "0 12px"
      }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "12px 14px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", whiteSpace: "nowrap", fontFamily: "inherit",
            color: tab === i ? C.accent : C.dim,
            borderBottom: tab === i ? `2px solid ${C.accent}` : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 5
          }}>
            <span>{icons[i]}</span> {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {content[tab]}
      </div>
    </div>
  );
}
