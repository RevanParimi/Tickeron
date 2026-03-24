from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from db.session import get_db
from db.models import Signal, WatchlistItem
from core.auth import get_current_user
from services.price_service import get_seasonal_pattern, get_historical

router = APIRouter(prefix="/signal", tags=["Signals"])


@router.get("/{symbol}")
async def get_signal(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Latest trend signal for a symbol."""
    result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(
            WatchlistItem.user_id == current_user["id"],
            Signal.symbol == symbol.upper(),
        )
        .order_by(Signal.created_at.desc())
        .limit(1)
    )
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="No signal found. Add symbol to watchlist first.")

    return {
        "symbol": symbol.upper(),
        "signal": sig.signal,
        "confidence": sig.confidence,
        "direction": sig.direction,
        "summary": sig.summary,
        "created_at": sig.created_at.isoformat(),
    }


@router.get("/{symbol}/explain")
async def explain_signal(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full reasoning chain with source attribution."""
    result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(
            WatchlistItem.user_id == current_user["id"],
            Signal.symbol == symbol.upper(),
        )
        .order_by(Signal.created_at.desc())
        .limit(1)
    )
    sig = result.scalar_one_or_none()
    if not sig:
        raise HTTPException(status_code=404, detail="No signal found.")

    sources = []
    try:
        sources = json.loads(sig.sources or "[]")
    except:
        pass

    return {
        "symbol": symbol.upper(),
        "signal": sig.signal,
        "confidence": sig.confidence,
        "summary": sig.summary,
        "reasoning_chain": sig.reasoning_chain,
        "agent_scores": {
            "news": sig.score_news,
            "macro": sig.score_macro,
            "sector": sig.score_sector,
            "quant": sig.score_quant,
        },
        "agent_weights": {
            "news": "25%",
            "macro": "25%",
            "sector": "25%",
            "quant": "25%",
        },
        "sources": sources,
        "disclaimer": "Signals are AI-generated trend estimates based on public data. Not SEBI-registered investment advice.",
        "created_at": sig.created_at.isoformat(),
    }


@router.get("/{symbol}/history")
async def signal_history(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All historical signals for a symbol (for trend chart)."""
    result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(
            WatchlistItem.user_id == current_user["id"],
            Signal.symbol == symbol.upper(),
        )
        .order_by(Signal.created_at.asc())
    )
    signals = result.scalars().all()
    return {
        "symbol": symbol.upper(),
        "history": [
            {
                "date": s.created_at.isoformat(),
                "signal": s.signal,
                "confidence": s.confidence,
                "direction": s.direction,
            }
            for s in signals
        ],
    }


@router.post("/{symbol}/refresh")
async def refresh_signal(
    symbol: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger re-analysis for a symbol."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user["id"],
            WatchlistItem.symbol == symbol.upper(),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not in your watchlist")

    from api.watchlist_router import _run_and_save
    from core.config import settings
    background_tasks.add_task(
        _run_and_save,
        symbol.upper(),
        item.sector or "General",
        item.asset_type or "equity",
        item.id,
        settings.database_url,
    )
    return {"status": "refresh_queued", "symbol": symbol.upper()}


@router.get("/{symbol}/seasonal")
async def seasonal_pattern(symbol: str, current_user: dict = Depends(get_current_user)):
    """Seasonal monthly return pattern (5yr data)."""
    data = get_seasonal_pattern(symbol)
    return data


@router.get("/{symbol}/prices")
async def price_history(
    symbol: str,
    period: str = "3mo",
    current_user: dict = Depends(get_current_user),
):
    """OHLCV price history for charting."""
    data = get_historical(symbol, period=period)
    return {"symbol": symbol.upper(), "period": period, "data": data}
