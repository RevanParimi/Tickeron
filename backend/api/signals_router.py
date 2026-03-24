from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
from datetime import datetime, timedelta

from db.session import get_db
from db.models import Signal, WatchlistItem
from core.auth import get_current_user
from services.price_service import get_seasonal_pattern, get_historical, check_signal_accuracy

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
        current_user["id"],
    )
    return {"status": "refresh_queued", "symbol": symbol.upper()}


@router.get("/{symbol}/seasonal")
async def seasonal_pattern(symbol: str, current_user: dict = Depends(get_current_user)):
    """Seasonal monthly return pattern (5yr data)."""
    data = get_seasonal_pattern(symbol)
    return data


@router.get("/{symbol}/sources")
async def signal_sources(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """News headlines / source URLs used to generate the latest signal."""
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
    except Exception:
        pass

    return {
        "symbol": symbol.upper(),
        "signal": sig.signal,
        "created_at": sig.created_at.isoformat(),
        "sources": sources,
        "summary": sig.summary,
    }


@router.get("/{symbol}/accuracy")
async def signal_accuracy(
    symbol: str,
    days: int = 14,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    How accurate were this symbol's past signals?
    Checks each signal against actual price movement N days after generation.
    """
    result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(
            WatchlistItem.user_id == current_user["id"],
            Signal.symbol == symbol.upper(),
        )
        .order_by(Signal.created_at.desc())
        .limit(20)
    )
    signals = result.scalars().all()

    if not signals:
        raise HTTPException(status_code=404, detail="No signals found.")

    records = []
    correct = 0
    evaluated = 0

    for sig in signals:
        outcome = check_signal_accuracy(symbol, sig.signal, sig.created_at, days=days)
        if outcome["outcome"] not in ("pending", "error"):
            evaluated += 1
            if outcome["outcome"] == "correct":
                correct += 1
        records.append({
            "date": sig.created_at.isoformat(),
            "signal": sig.signal,
            "confidence": sig.confidence,
            **outcome,
        })

    return {
        "symbol": symbol.upper(),
        "days_window": days,
        "total_signals": len(signals),
        "evaluated": evaluated,
        "correct": correct,
        "accuracy_pct": round(correct / evaluated * 100, 1) if evaluated else None,
        "records": records,
    }


@router.get("/accuracy/summary")
async def accuracy_summary(
    days: int = 14,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Overall signal accuracy across all watchlist symbols."""
    result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(WatchlistItem.user_id == current_user["id"])
        .order_by(Signal.created_at.desc())
    )
    signals = result.scalars().all()

    if not signals:
        return {"accuracy_pct": None, "evaluated": 0, "correct": 0, "by_signal": {}}

    correct_by_type: dict = {}
    total_by_type: dict = {}
    total_correct = 0
    total_evaluated = 0

    for sig in signals:
        outcome = check_signal_accuracy(sig.symbol, sig.signal, sig.created_at, days=days)
        if outcome["outcome"] in ("pending", "error"):
            continue
        total_evaluated += 1
        total_by_type[sig.signal] = total_by_type.get(sig.signal, 0) + 1
        if outcome["outcome"] == "correct":
            total_correct += 1
            correct_by_type[sig.signal] = correct_by_type.get(sig.signal, 0) + 1

    by_signal = {
        sig_type: {
            "correct": correct_by_type.get(sig_type, 0),
            "total": total_by_type[sig_type],
            "accuracy_pct": round(correct_by_type.get(sig_type, 0) / total_by_type[sig_type] * 100, 1),
        }
        for sig_type in total_by_type
    }

    return {
        "days_window": days,
        "accuracy_pct": round(total_correct / total_evaluated * 100, 1) if total_evaluated else None,
        "correct": total_correct,
        "evaluated": total_evaluated,
        "by_signal": by_signal,
    }


@router.get("/{symbol}/prices")
async def price_history(
    symbol: str,
    period: str = "3mo",
    current_user: dict = Depends(get_current_user),
):
    """OHLCV price history for charting."""
    data = get_historical(symbol, period=period)
    return {"symbol": symbol.upper(), "period": period, "data": data}
