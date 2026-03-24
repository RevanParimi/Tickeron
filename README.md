# MarketPulse AI 📈

> **AI-powered trend intelligence for Indian markets.**
> Groww is the restaurant. We're the Swiggy.

MarketPulse aggregates public internet data through a multi-agent AI pipeline and delivers personalized, explainable trend signals for your stock/commodity watchlist — no inside information, no false price targets, just research-grade trend analysis automated.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Tree](#repository-tree)
- [Agent Pipeline](#agent-pipeline)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
- [Setup & Run](#setup--run)
- [Testing Commands](#testing-commands)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   React SPA (Vite)  ◄──── WebSocket (live ticks) ────►  App    │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / WS
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                      │
│   /auth   /watchlist   /signal   /macro   /alerts   /ws/feed    │
└──────┬──────────┬──────────────────────┬────────────────────────┘
       │          │                      │
       ▼          ▼                      ▼
  SQLite DB   Background          WebSocket Manager
  (PostgreSQL  Task Queue         (push signal updates
   in prod)   (APScheduler)       to connected clients)
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                   LANGGRAPH AGENT PIPELINE                      │
│                                                                 │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐             │
│   │ WebScout   │──►│ MacroLens  │──►│  Quant     │             │
│   │  Agent     │   │  Agent     │   │  Engine    │             │
│   └────────────┘   └────────────┘   └─────┬──────┘             │
│   Tavily search    FRED/yfinance     yfinance +                 │
│   news + filings   geo + policy      price history              │
│                                           │                     │
│                              ┌────────────▼──────────┐         │
│                              │   Synthesis Core       │         │
│                              │  Weighted scoring +    │         │
│                              │  LLM plain-language    │         │
│                              │  summary + sources     │         │
│                              └───────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
  Signal persisted to DB → pushed via WebSocket → shown in UI
```

### Technology Choices

| Layer | Technology | Why |
|---|---|---|
| API | FastAPI + Uvicorn | Async, auto OpenAPI docs, native Pydantic |
| Agent Orchestration | LangGraph | Stateful graph, retry, conditional edges |
| LLM (primary) | Groq — LLaMA 3.3 70B | Ultra-fast inference, generous free tier |
| LLM (synthesis) | Groq (Claude Sonnet optional) | Complex reasoning for final signal |
| Web Search | Tavily API | LLM-optimized search, structured results |
| Price Data | yfinance | Free OHLCV for NSE/BSE/commodities |
| Database (MVP) | SQLite + SQLAlchemy async | Zero-setup for local dev |
| Database (prod) | PostgreSQL + TimescaleDB | Time-series signals, read replicas |
| Cache / Queue | Redis (prod) / APScheduler (MVP) | Background agent jobs |
| Auth | JWT (python-jose + bcrypt) | Stateless, works for web + mobile + bot |
| Frontend | React + Vite + Zustand | Fast SPA, minimal state management |

---

## Repository Tree

```
marketpulse/
│
├── backend/
│   │
│   ├── main.py                     ← FastAPI app, WebSocket, lifespan
│   ├── requirements.txt            ← All Python dependencies
│   ├── .env.example                ← Copy to .env and fill keys
│   │
│   ├── core/
│   │   ├── config.py               ← Pydantic settings (reads .env)
│   │   └── auth.py                 ← JWT create/verify, get_current_user dep
│   │
│   ├── db/
│   │   ├── models.py               ← SQLAlchemy ORM: User, Watchlist,
│   │   │                             Signal, Alert, MacroSignal
│   │   └── session.py              ← Async engine, get_db dep, init_db()
│   │
│   ├── agents/
│   │   ├── tools.py                ← LangChain @tools: web_search,
│   │   │                             get_macro_indicator, get_company_info,
│   │   │                             get_price_trend
│   │   └── graph.py                ← LangGraph pipeline:
│   │                                 WebScout → MacroLens → QuantEngine
│   │                                 → SynthesisCore
│   │                                 run_analysis(symbol) → signal dict
│   │
│   ├── api/
│   │   ├── auth_router.py          ← POST /auth/register, /auth/login
│   │   ├── watchlist_router.py     ← GET/POST/DELETE /watchlist
│   │   │                             (add triggers background agent run)
│   │   ├── signals_router.py       ← GET /signal/{symbol}
│   │   │                             GET /signal/{symbol}/explain
│   │   │                             GET /signal/{symbol}/history
│   │   │                             POST /signal/{symbol}/refresh
│   │   │                             GET /signal/{symbol}/seasonal
│   │   │                             GET /signal/{symbol}/prices
│   │   ├── macro_router.py         ← GET /macro/signals
│   │   │                             POST /macro/refresh
│   │   └── alerts_router.py        ← GET/POST/DELETE /alerts
│   │
│   └── services/
│       └── price_service.py        ← get_current_price(), get_historical(),
│                                     get_seasonal_pattern() via yfinance
│
└── frontend/                       ← React app (Vite) — Phase 2
    └── src/
```

---

## Agent Pipeline

Each agent is a LangGraph node. They run **sequentially** (easy to parallelize in v2).

```
User adds SUZLON to watchlist
          │
          ▼
  ┌───────────────────────────────────────────────┐
  │  Node 1: WebScoutAgent                        │
  │  Tools: web_search (×2)                       │
  │  • Search "{symbol} stock news India"         │
  │  • Search "{symbol} quarterly results"        │
  │  • LLM summarizes → SENTIMENT_SCORE: 0-100    │
  │  Output: news_summary, sources[]              │
  └───────────────────┬───────────────────────────┘
                      │
                      ▼
  ┌───────────────────────────────────────────────┐
  │  Node 2: MacroLensAgent                       │
  │  Tools: get_macro_indicator (×3), web_search  │
  │  • Fetch: oil, VIX, DXY via yfinance          │
  │  • Search: India {sector} macro outlook       │
  │  • LLM assesses sector impact → MACRO_SCORE   │
  │  Output: macro_summary                        │
  └───────────────────┬───────────────────────────┘
                      │
                      ▼
  ┌───────────────────────────────────────────────┐
  │  Node 3: QuantEngine                          │
  │  Tools: get_price_trend, get_company_info     │
  │  • 3-month price trend + momentum label       │
  │  • Fundamentals: PE, market cap, 52w range    │
  │  Output: price_trend, company_info            │
  └───────────────────┬───────────────────────────┘
                      │
                      ▼
  ┌───────────────────────────────────────────────┐
  │  Node 4: SynthesisCore                        │
  │  • Extract scores from upstream text          │
  │  • Weighted composite:                        │
  │      News  25% + Macro 25%                    │
  │    + Quant 25% + Sector 25%                   │
  │  • Map composite → signal label:              │
  │      ≥75 → BUY     ≥62 → ACCUMULATE           │
  │      ≥50 → HOLD    ≥38 → WATCH                │
  │       <38 → AVOID                             │
  │  • LLM writes plain-language summary          │
  │  • Persist Signal to DB                       │
  │  • Push WebSocket event to user               │
  └───────────────────────────────────────────────┘
```

**Signal labels are trend direction estimates — not price targets, not investment advice.**

---

## Data Flow

### 1. Add to Watchlist (triggers full analysis)
```
POST /watchlist
    │
    ├── Save WatchlistItem to DB
    ├── Return 202 Accepted immediately
    └── Background task → run_analysis(symbol)
            │
            ├── LangGraph pipeline runs (~30-60s)
            ├── Signal saved to DB
            └── WebSocket push → frontend updates live
```

### 2. Daily Macro Refresh (scheduled)
```
APScheduler (6AM IST daily)
    │
    └── _run_macro_scan()
            ├── Fetch oil, VIX, DXY
            ├── Search India market news
            ├── LLM extracts 3 macro events as JSON
            └── Save MacroSignal records to DB
```

### 3. Fetch Signal with Explanation
```
GET /signal/SUZLON/explain
    │
    ├── Query latest Signal from DB
    ├── Return: signal, confidence, reasoning_chain,
    │           agent_scores, sources[], disclaimer
    └── Frontend renders explainability panel
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except `/auth/*` and `/health`.

### Auth
```
POST  /auth/register    { email, password, name }  → { access_token, user_id }
POST  /auth/login       { username, password }      → { access_token, user_id }
GET   /auth/me                                      → { id, email }
```

### Watchlist
```
GET    /watchlist                           → { items: [...signals+prices] }
POST   /watchlist   { symbol, sector, ... } → 202 { status: "queued" }
DELETE /watchlist/{symbol}                  → { removed: true }
```

### Signals
```
GET  /signal/{symbol}            → { signal, confidence, direction, summary }
GET  /signal/{symbol}/explain    → { reasoning_chain, agent_scores, sources }
GET  /signal/{symbol}/history    → { history: [{date, signal, confidence}] }
POST /signal/{symbol}/refresh    → 202 trigger re-analysis
GET  /signal/{symbol}/seasonal   → { monthly_avg, best_months, worst_months }
GET  /signal/{symbol}/prices     → { data: OHLCV[] }
```

### Macro
```
GET  /macro/signals       → { signals: [{event, impact, sectors_affected}] }
POST /macro/refresh       → 202 trigger macro scan
```

### Alerts
```
GET    /alerts                                              → { alerts: [] }
POST   /alerts  { symbol, condition, value }               → { alert_id }
DELETE /alerts/{id}                                        → { deleted: true }
```

### WebSocket
```
WS  /ws/feed?token=<JWT>
    ← { type: "connected" }
    ← { type: "price_tick", symbol, price, change_pct }   every 15s
    ← { type: "signal_update", symbol, signal, confidence } on new analysis
    ← { type: "error", message }
```

---

## Setup & Run

### Prerequisites
- Python 3.11+
- A free [Groq API key](https://console.groq.com) — primary LLM
- A free [Tavily API key](https://app.tavily.com) — web search
- Git

### 1. Clone & enter backend
```bash
git clone https://github.com/your-org/marketpulse.git
cd marketpulse/backend
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env — add GROQ_API_KEY and TAVILY_API_KEY at minimum
```

### 5. Run the server
```bash
uvicorn main:app --reload --port 8000
```

Server starts at: `http://localhost:8000`
Auto docs at:     `http://localhost:8000/docs`
ReDoc at:         `http://localhost:8000/redoc`

---

## Testing Commands

All commands use `curl`. Replace `TOKEN` with the JWT from login.

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"0.1.0"}
```

### Register a user
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"revan@marketpulse.ai","password":"test1234","name":"Revan"}'
# Returns: { "access_token": "eyJ...", "user_id": 1 }
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -F "username=revan@marketpulse.ai" \
  -F "password=test1234"
# Returns: { "access_token": "eyJ...", "user_id": 1 }

# Save token for subsequent calls:
TOKEN="eyJ..."
```

### Add symbol to watchlist (triggers AI analysis)
```bash
curl -X POST http://localhost:8000/watchlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"SUZLON","name":"Suzlon Energy","sector":"Renewables","asset_type":"equity"}'
# Returns 202: { "status": "queued", "symbol": "SUZLON", "watchlist_id": 1 }
# Agent pipeline now running in background (~30-60s)
```

### Add commodity (silver)
```bash
curl -X POST http://localhost:8000/watchlist \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"SILVER","name":"Silver Futures","sector":"Commodities","asset_type":"commodity"}'
```

### Get full watchlist with live prices + signals
```bash
curl http://localhost:8000/watchlist \
  -H "Authorization: Bearer $TOKEN"
```

### Get trend signal for a symbol
```bash
curl http://localhost:8000/signal/SUZLON \
  -H "Authorization: Bearer $TOKEN"
# Returns: { signal, confidence, direction, summary }
```

### Get full AI reasoning (explainability)
```bash
curl http://localhost:8000/signal/SUZLON/explain \
  -H "Authorization: Bearer $TOKEN"
# Returns: reasoning_chain, agent_scores, sources[], disclaimer
```

### Get seasonal pattern (5yr monthly averages)
```bash
curl http://localhost:8000/signal/SUZLON/seasonal \
  -H "Authorization: Bearer $TOKEN"
# Returns: { monthly_avg: {Jan: 2.1, Feb: -0.4, ...}, best_months, worst_months }
```

### Manually refresh signal
```bash
curl -X POST http://localhost:8000/signal/SUZLON/refresh \
  -H "Authorization: Bearer $TOKEN"
# Triggers fresh agent run in background
```

### Trigger macro scan
```bash
curl -X POST http://localhost:8000/macro/refresh \
  -H "Authorization: Bearer $TOKEN"
# Runs MacroLensAgent standalone, saves 3 macro events to DB
```

### Get latest macro signals
```bash
curl http://localhost:8000/macro/signals \
  -H "Authorization: Bearer $TOKEN"
```

### Create an alert
```bash
curl -X POST http://localhost:8000/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"SUZLON","condition":"signal_changes_to","value":"BUY"}'
```

### List alerts
```bash
curl http://localhost:8000/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### Delete an alert
```bash
curl -X DELETE http://localhost:8000/alerts/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Test WebSocket (requires wscat)
```bash
# Install: npm install -g wscat
wscat -c "ws://localhost:8000/ws/feed?token=$TOKEN"
# You'll receive price ticks every 15s and signal updates live
```

### Remove from watchlist
```bash
curl -X DELETE http://localhost:8000/watchlist/SUZLON \
  -H "Authorization: Bearer $TOKEN"
```

### Run agent pipeline directly (Python REPL test)
```bash
cd backend
python - <<'EOF'
import asyncio
from agents.graph import run_analysis

async def test():
    result = await run_analysis("SUZLON", sector="Renewables", asset_type="equity")
    print("Signal:    ", result["signal"])
    print("Confidence:", result["confidence"])
    print("Direction: ", result["direction"])
    print("Summary:\n", result["summary"])
    print("\nReasoning:\n", result["reasoning_chain"][:500])

asyncio.run(test())
EOF
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Primary LLM inference |
| `TAVILY_API_KEY` | ✅ Yes | — | Web search for agents |
| `ANTHROPIC_API_KEY` | Optional | — | Fallback for synthesis node |
| `SECRET_KEY` | ✅ Yes | dev-secret | JWT signing key |
| `DATABASE_URL` | No | SQLite | `sqlite+aiosqlite:///./marketpulse.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 60 | JWT expiry |
| `DEBUG` | No | true | SQLAlchemy echo |
| `CORS_ORIGINS` | No | localhost | Comma-separated allowed origins |

---

## Roadmap

```
Phase 1 — MVP (current)
├── ✅ FastAPI backend skeleton
├── ✅ SQLite DB with all models
├── ✅ JWT auth (register/login)
├── ✅ Watchlist CRUD
├── ✅ LangGraph 4-node agent pipeline
│     WebScout → MacroLens → QuantEngine → SynthesisCore
├── ✅ Signal persistence + history
├── ✅ Explainability endpoint (reasoning + sources)
├── ✅ Seasonal pattern (5yr monthly returns)
├── ✅ WebSocket live price feed
├── ✅ Alerts CRUD
└── ✅ Macro scan (standalone MacroLens run)

Phase 2 — Intelligence (next)
├── [ ] SectorPulseAgent node (FII/DII flows, peer comparison)
├── [ ] CorpRadarAgent (mega-corp demand dependency)
├── [ ] Parallel agent execution (LangGraph fan-out)
├── [ ] Redis queue replacing background tasks
├── [ ] React frontend connecting to this backend
└── [ ] Alert notification delivery (email first)

Phase 3 — Distribution
├── [ ] WhatsApp / Telegram weekly digest bot
├── [ ] Community consensus layer (anonymized)
├── [ ] Read-only broker link (Zerodha Kite API)
├── [ ] Mobile app (React Native)
└── [ ] PostgreSQL migration (swap DATABASE_URL)

Phase 4 — Moat
├── [ ] Fine-tuned model on India financial corpus
├── [ ] SEBI RIA licensing pathway
├── [ ] B2B signal API for Groww / Zerodha / Smallcase
└── [ ] Regional language summaries (Hindi, Telugu, Tamil)
```

---

## Legal Disclaimer

MarketPulse AI aggregates **publicly available** internet data only.
No insider information is used or accessed at any stage.
Signals are **trend direction estimates** — not price targets, not buy/sell recommendations.
MarketPulse AI is **not a SEBI-registered investment advisor**.
All investment decisions are solely the responsibility of the user.

---

*Built with FastAPI · LangGraph · Groq · yfinance · Tavily*
