"""
MarketPulse AI — FastAPI Application
Run: uvicorn main:app --reload --port 8000
"""
import asyncio
import json
from contextlib import asynccontextmanager
from typing import Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.auth import decode_token
from db.session import init_db
from api.auth_router import router as auth_router
from api.watchlist_router import router as watchlist_router
from api.signals_router import router as signals_router
from api.macro_router import router as macro_router
from api.alerts_router import router as alerts_router


# ── WebSocket Connection Manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # user_id -> set of active websocket connections
        self.active: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id].discard(ws)
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user(self, user_id: int, message: dict):
        """Push a message to all connections of a user."""
        dead = set()
        for ws in self.active.get(user_id, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active.get(user_id, set()).discard(ws)


manager = ConnectionManager()


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("✅ Database initialized")
    yield
    print("👋 Shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MarketPulse AI",
    description="AI-powered trend intelligence for Indian markets",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "version": "0.1.0"}


# ── WebSocket: Live Feed ───────────────────────────────────────────────────────
@app.websocket("/ws/feed")
async def websocket_feed(
    ws: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    Live feed for a user's watchlist:
    - Sends price ticks every 15s
    - Pushes signal_update events when new signals are computed
    
    Connect: ws://localhost:8000/ws/feed?token=<JWT>
    """
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception:
        await ws.close(code=4001, reason="Invalid token")
        return

    await manager.connect(user_id, ws)
    try:
        # Send welcome
        await ws.send_json({"type": "connected", "user_id": user_id})

        # Price tick loop
        from services.price_service import get_current_price
        from db.session import AsyncSessionLocal
        from db.models import WatchlistItem
        from sqlalchemy import select

        while True:
            await asyncio.sleep(15)
            try:
                async with AsyncSessionLocal() as db:
                    result = await db.execute(
                        select(WatchlistItem).where(WatchlistItem.user_id == user_id)
                    )
                    items = result.scalars().all()

                for item in items:
                    price_data = get_current_price(item.symbol)
                    await ws.send_json({
                        "type": "price_tick",
                        "symbol": item.symbol,
                        "price": price_data.get("price"),
                        "change_pct": price_data.get("change_pct"),
                    })
            except Exception as e:
                await ws.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)


# ── Utility: push signal update (called by background tasks) ──────────────────
async def push_signal_update(user_id: int, symbol: str, signal: str, confidence: float):
    """Called after agent completes to push update to connected clients."""
    await manager.send_to_user(user_id, {
        "type": "signal_update",
        "symbol": symbol,
        "signal": signal,
        "confidence": confidence,
    })
