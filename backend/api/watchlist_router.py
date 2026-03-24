from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime

from db.session import get_db
from db.models import WatchlistItem, Signal
from core.auth import get_current_user
from services.price_service import get_current_price

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


class AddRequest(BaseModel):
    symbol: str
    name: Optional[str] = None
    asset_type: str = "equity"   # equity | commodity
    sector: str = "General"


async def _run_and_save(symbol: str, sector: str, asset_type: str, watchlist_id: int, db_url: str):
    """Background task: run agent pipeline and persist signal."""
    from agents.graph import run_analysis
    from db.session import AsyncSessionLocal
    from db.models import Signal

    result = await run_analysis(symbol, sector, asset_type)

    async with AsyncSessionLocal() as db:
        sig = Signal(
            watchlist_item_id=watchlist_id,
            symbol=symbol,
            signal=result.get("signal", "HOLD"),
            confidence=result.get("confidence", 0.5),
            direction=result.get("direction", "NEUTRAL"),
            score_news=result.get("score_news", 50),
            score_macro=result.get("score_macro", 50),
            score_sector=result.get("score_sector", 50),
            score_quant=result.get("score_quant", 50),
            summary=result.get("summary", ""),
            sources=json.dumps(result.get("sources", [])),
            reasoning_chain=result.get("reasoning_chain", ""),
        )
        db.add(sig)
        await db.commit()


@router.get("")
async def get_watchlist(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == current_user["id"])
    )
    items = result.scalars().all()

    out = []
    for item in items:
        # Get latest signal
        sig_result = await db.execute(
            select(Signal)
            .where(Signal.watchlist_item_id == item.id)
            .order_by(Signal.created_at.desc())
            .limit(1)
        )
        sig = sig_result.scalar_one_or_none()

        # Live price
        price_data = get_current_price(item.symbol)

        out.append({
            "id": item.id,
            "symbol": item.symbol,
            "name": item.name or item.symbol,
            "sector": item.sector,
            "asset_type": item.asset_type,
            "added_at": item.added_at.isoformat(),
            "price": price_data.get("price"),
            "change_pct": price_data.get("change_pct"),
            "signal": sig.signal if sig else None,
            "confidence": sig.confidence if sig else None,
            "direction": sig.direction if sig else None,
            "summary": sig.summary if sig else "Analysis pending...",
            "signal_at": sig.created_at.isoformat() if sig else None,
        })
    return {"items": out}


@router.post("", status_code=202)
async def add_to_watchlist(
    body: AddRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Prevent duplicates
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user["id"],
            WatchlistItem.symbol == body.symbol.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{body.symbol} already in watchlist")

    item = WatchlistItem(
        user_id=current_user["id"],
        symbol=body.symbol.upper(),
        name=body.name or body.symbol.upper(),
        asset_type=body.asset_type,
        sector=body.sector,
    )
    db.add(item)
    await db.flush()

    # Kick off analysis in background
    from core.config import settings
    background_tasks.add_task(
        _run_and_save,
        body.symbol.upper(),
        body.sector,
        body.asset_type,
        item.id,
        settings.database_url,
    )

    return {"status": "queued", "symbol": body.symbol.upper(), "watchlist_id": item.id}


@router.delete("/{symbol}", status_code=200)
async def remove_from_watchlist(
    symbol: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user["id"],
            WatchlistItem.symbol == symbol.upper(),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not in watchlist")
    await db.delete(item)
    return {"removed": True, "symbol": symbol.upper()}
