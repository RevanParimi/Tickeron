"""
MarketPulse AI — FastAPI Application
Run: uvicorn main:app --reload --port 8000
"""
import asyncio
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from core.config import settings
from core.auth import decode_token
from db.session import init_db, AsyncSessionLocal
from db.models import WatchlistItem, Alert, Signal
from api.auth_router import router as auth_router
from api.watchlist_router import router as watchlist_router
from api.signals_router import router as signals_router
from api.macro_router import router as macro_router
from api.alerts_router import router as alerts_router
from api.chat_router import router as chat_router
from api.earnings_router import router as earnings_router
from api.portfolio_router import router as portfolio_router
from sqlalchemy import select


# ── SSE Queue Registry ────────────────────────────────────────────────────────
_sse_queues: Dict[int, asyncio.Queue] = {}


async def notify_signal(user_id: int, symbol: str, signal: str, confidence: float,
                         direction: str, summary: str, score_news: float,
                         score_macro: float, score_sector: float, score_quant: float):
    """Called after agent completes to push signal update to connected SSE client."""
    q = _sse_queues.get(user_id)
    if q:
        await q.put({
            "type": "signal_update",
            "symbol": symbol,
            "signal": signal,
            "confidence": confidence,
            "direction": direction,
            "summary": summary,
            "score_news": score_news,
            "score_macro": score_macro,
            "score_sector": score_sector,
            "score_quant": score_quant,
        })


# ── Background: Alert Trigger Engine ─────────────────────────────────────────
async def _check_and_fire_alerts():
    """
    Check all active alerts against the latest signal for each symbol.
    Marks alert as triggered if the condition is met.
    Runs every hour.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Alert).where(Alert.active == True)
        )
        alerts = result.scalars().all()

        for alert in alerts:
            try:
                # Get latest signal for this symbol (any user)
                sig_result = await db.execute(
                    select(Signal)
                    .join(WatchlistItem)
                    .where(
                        WatchlistItem.user_id == alert.user_id,
                        Signal.symbol == alert.symbol,
                    )
                    .order_by(Signal.created_at.desc())
                    .limit(1)
                )
                sig = sig_result.scalar_one_or_none()
                if not sig:
                    continue

                triggered = False
                if alert.condition == "signal_changes_to" and sig.signal == alert.value:
                    triggered = True
                elif alert.condition == "confidence_above":
                    try:
                        if sig.confidence and sig.confidence >= float(alert.value):
                            triggered = True
                    except ValueError:
                        pass
                elif alert.condition == "confidence_below":
                    try:
                        if sig.confidence and sig.confidence <= float(alert.value):
                            triggered = True
                    except ValueError:
                        pass

                if triggered:
                    alert.last_triggered = datetime.utcnow()
                    # Push to SSE if user is connected
                    q = _sse_queues.get(alert.user_id)
                    if q:
                        await q.put({
                            "type": "alert_triggered",
                            "symbol": alert.symbol,
                            "condition": alert.condition,
                            "value": alert.value,
                            "signal": sig.signal,
                            "confidence": sig.confidence,
                        })

            except Exception as e:
                print(f"[alerts] error checking alert {alert.id}: {e}")

        await db.commit()


async def alert_trigger_loop():
    """Runs alert checks every hour."""
    while True:
        await asyncio.sleep(3600)
        try:
            print(f"[alerts] checking alerts at {datetime.utcnow().isoformat()}")
            await _check_and_fire_alerts()
        except Exception as e:
            print(f"[alerts] loop error: {e}")


# ── Background: Scheduled Signal Refresh ─────────────────────────────────────
async def _refresh_all_signals():
    """Re-run AI analysis for all watchlist items. Called by scheduler."""
    from agents.graph import run_analysis
    import json as _json

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(WatchlistItem))
        items = result.scalars().all()

    print(f"[scheduler] refreshing {len(items)} watchlist items")
    for item in items:
        try:
            result = await run_analysis(item.symbol, item.sector or "General", item.asset_type or "equity")
            async with AsyncSessionLocal() as db:
                sig = Signal(
                    watchlist_item_id=item.id,
                    symbol=item.symbol,
                    signal=result.get("signal", "HOLD"),
                    confidence=result.get("confidence", 0.5),
                    direction=result.get("direction", "NEUTRAL"),
                    score_news=result.get("score_news", 50),
                    score_macro=result.get("score_macro", 50),
                    score_sector=result.get("score_sector", 50),
                    score_quant=result.get("score_quant", 50),
                    summary=result.get("summary", ""),
                    sources=_json.dumps(result.get("sources", [])),
                    reasoning_chain=result.get("reasoning_chain", ""),
                )
                db.add(sig)
                await db.commit()

            await notify_signal(
                user_id=item.user_id,
                symbol=item.symbol,
                signal=result.get("signal", "HOLD"),
                confidence=result.get("confidence", 0.5),
                direction=result.get("direction", "NEUTRAL"),
                summary=result.get("summary", ""),
                score_news=result.get("score_news", 50),
                score_macro=result.get("score_macro", 50),
                score_sector=result.get("score_sector", 50),
                score_quant=result.get("score_quant", 50),
            )
            print(f"[scheduler] refreshed {item.symbol}")
        except Exception as e:
            print(f"[scheduler] error refreshing {item.symbol}: {e}")


async def scheduled_refresh_loop():
    """Refreshes all signals every 24 hours."""
    while True:
        await asyncio.sleep(24 * 3600)
        try:
            print(f"[scheduler] starting 24h refresh at {datetime.utcnow().isoformat()}")
            await _refresh_all_signals()
        except Exception as e:
            print(f"[scheduler] refresh error: {e}")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("Database initialized")
    # Start background tasks
    alert_task = asyncio.create_task(alert_trigger_loop())
    refresh_task = asyncio.create_task(scheduled_refresh_loop())
    print("Background scheduler started (alerts: 1h, refresh: 24h)")
    yield
    alert_task.cancel()
    refresh_task.cancel()
    print("Shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MarketPulse AI",
    description="AI-powered trend intelligence for Indian markets",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(watchlist_router)
app.include_router(signals_router)
app.include_router(macro_router)
app.include_router(alerts_router)
app.include_router(chat_router)
app.include_router(earnings_router)
app.include_router(portfolio_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "version": "0.2.0"}


# ── Manual Refresh Trigger ────────────────────────────────────────────────────
@app.post("/admin/refresh-all", tags=["System"])
async def trigger_full_refresh(background_tasks=None):
    """Manually trigger a full signal refresh for all watchlist items."""
    asyncio.create_task(_refresh_all_signals())
    return {"status": "refresh_triggered"}


# ── SSE: Signal Updates ───────────────────────────────────────────────────────
@app.get("/watchlist/stream", tags=["Watchlist"])
async def watchlist_stream(token: str = Query(...)):
    """
    SSE stream for real-time signal and alert updates.
    Connect: GET /watchlist/stream?token=<JWT>
    Events: signal_update | alert_triggered
    """
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception:
        async def error_stream():
            yield f"data: {json.dumps({'error': 'Invalid token'})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    queue: asyncio.Queue = asyncio.Queue()
    _sse_queues[user_id] = queue

    async def event_stream():
        try:
            yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            _sse_queues.pop(user_id, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
