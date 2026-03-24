# MarketPulse AI — Feature Roadmap

## In Progress / Being Coded Now

- [x] Price Sparklines on watchlist cards (SparklineChart.jsx)
- [x] AI Chat per symbol (AIChat.jsx + /chat/{symbol} backend)
- [x] Signal Change Alerts UI (AlertsPanel.jsx + existing alerts router)
- [x] Sector Heat Map on Dashboard (SectorHeatMap.jsx)

---

## UI / UX

- [ ] Sidebar layout (left nav, right content — like Kite/Zerodha)
- [ ] Responsive / mobile layout
- [ ] Loading skeletons instead of text spinners
- [ ] Onboarding flow for new users (empty state with guided steps)
- [ ] Light mode toggle
- [ ] Global symbol search with autocomplete (NSE/BSE ticker lookup)
- [ ] Error boundary components with retry button

---

## Core Features

- [ ] Portfolio Simulator — paper-trade on AI signals, track P&L vs Nifty
- [ ] Signal Accuracy Tracker — did last month's BUY calls actually go up?
- [ ] Watchlist Compare — side-by-side two symbols
- [ ] Earnings Calendar — upcoming results for tracked symbols
- [ ] Correlation Matrix — which symbols move together
- [ ] News Feed per symbol — show actual headlines used to generate signal
- [ ] Sources panel — display the sources[] stored in DB but never shown

---

## Data & Real-Time

- [ ] Live price feed — SSE or WebSocket for real-time price updates (not just on page load)
- [ ] Scheduled signal refresh — auto-refresh signals every 24h (currently manual only)
- [ ] FII/DII institutional flow data
- [ ] MarketPulse tab — replace hardcoded data with live macro API calls
- [ ] Bulk deals / insider activity from BSE/NSE

---

## Notifications & Alerts

- [ ] Alert trigger engine — background job that checks signals and fires alerts
- [ ] Email delivery for triggered alerts
- [ ] Browser push notifications (service worker)

---

## Infrastructure

- [ ] Rate limiting on backend (per user, per endpoint)
- [ ] Password reset / forgot-password flow
- [ ] Google OAuth login
- [ ] API pagination for large watchlists
- [ ] Replace Tavily with duckduckgo-search + trafilatura (open source, $0)

---

## Nice to Have

- [ ] Watchlist sharing — read-only public link
- [ ] PDF export of signal report
- [ ] "Consensus Score" — combine 3 public analyst ratings + AI signal
- [ ] Sector vs Nifty relative strength chart
