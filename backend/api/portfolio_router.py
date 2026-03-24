from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db.session import get_db
from db.models import PaperTrade, WatchlistItem, Signal
from core.auth import get_current_user
from services.price_service import get_current_price, get_historical

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

NIFTY_SYMBOL = "NIFTY50"


class TradeRequest(BaseModel):
    symbol: str
    action: str            # BUY | SELL
    quantity: float = 1.0
    entry_price: float
    notes: Optional[str] = None


class CloseRequest(BaseModel):
    exit_price: float


@router.get("")
async def list_trades(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All paper trades with live P&L for open positions."""
    result = await db.execute(
        select(PaperTrade)
        .where(PaperTrade.user_id == current_user["id"])
        .order_by(PaperTrade.entry_at.desc())
    )
    trades = result.scalars().all()

    out = []
    for t in trades:
        pnl = None
        pnl_pct = None
        current_price = None

        if t.exit_price is not None:
            # Closed trade
            pnl = round((t.exit_price - t.entry_price) * t.quantity, 2)
            pnl_pct = round(((t.exit_price - t.entry_price) / t.entry_price) * 100, 2)
            current_price = t.exit_price
        else:
            # Open trade — fetch live price
            price_data = get_current_price(t.symbol)
            if price_data.get("price"):
                current_price = price_data["price"]
                pnl = round((current_price - t.entry_price) * t.quantity, 2)
                pnl_pct = round(((current_price - t.entry_price) / t.entry_price) * 100, 2)

        out.append({
            "id": t.id,
            "symbol": t.symbol,
            "ai_signal": t.ai_signal,
            "action": t.action,
            "quantity": t.quantity,
            "entry_price": t.entry_price,
            "exit_price": t.exit_price,
            "current_price": current_price,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
            "status": "closed" if t.exit_price is not None else "open",
            "entry_at": t.entry_at.isoformat(),
            "exit_at": t.exit_at.isoformat() if t.exit_at else None,
            "notes": t.notes,
        })

    return {"trades": out}


@router.post("", status_code=201)
async def add_trade(
    body: TradeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Open a new paper trade. Attaches the latest AI signal for the symbol if available."""
    # Look up current AI signal for this symbol
    sig_result = await db.execute(
        select(Signal)
        .join(WatchlistItem)
        .where(
            WatchlistItem.user_id == current_user["id"],
            Signal.symbol == body.symbol.upper(),
        )
        .order_by(Signal.created_at.desc())
        .limit(1)
    )
    sig = sig_result.scalar_one_or_none()

    trade = PaperTrade(
        user_id=current_user["id"],
        symbol=body.symbol.upper(),
        ai_signal=sig.signal if sig else None,
        action=body.action.upper(),
        quantity=body.quantity,
        entry_price=body.entry_price,
        notes=body.notes,
    )
    db.add(trade)
    await db.flush()
    return {"id": trade.id, "symbol": trade.symbol, "status": "open"}


@router.post("/{trade_id}/close")
async def close_trade(
    trade_id: int,
    body: CloseRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Close an open paper trade with an exit price."""
    result = await db.execute(
        select(PaperTrade).where(
            PaperTrade.id == trade_id,
            PaperTrade.user_id == current_user["id"],
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if trade.exit_price is not None:
        raise HTTPException(status_code=400, detail="Trade already closed")

    trade.exit_price = body.exit_price
    trade.exit_at = datetime.utcnow()
    pnl = round((trade.exit_price - trade.entry_price) * trade.quantity, 2)
    return {"id": trade.id, "pnl": pnl, "status": "closed"}


@router.delete("/{trade_id}", status_code=200)
async def delete_trade(
    trade_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PaperTrade).where(
            PaperTrade.id == trade_id,
            PaperTrade.user_id == current_user["id"],
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    await db.delete(trade)
    return {"deleted": True}


@router.get("/summary")
async def portfolio_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Total P&L, win rate, and comparison vs Nifty 50."""
    result = await db.execute(
        select(PaperTrade).where(PaperTrade.user_id == current_user["id"])
    )
    trades = result.scalars().all()

    if not trades:
        return {"total_pnl": 0, "total_invested": 0, "win_rate": None, "trade_count": 0, "nifty_return_pct": None}

    total_pnl = 0.0
    total_invested = 0.0
    closed_correct = 0
    closed_total = 0

    earliest_date = min(t.entry_at for t in trades)

    for t in trades:
        invested = t.entry_price * t.quantity
        total_invested += invested
        if t.exit_price is not None:
            pnl = (t.exit_price - t.entry_price) * t.quantity
            total_pnl += pnl
            closed_total += 1
            if pnl > 0:
                closed_correct += 1
        else:
            price_data = get_current_price(t.symbol)
            if price_data.get("price"):
                total_pnl += (price_data["price"] - t.entry_price) * t.quantity

    # Nifty comparison from earliest trade date
    nifty_return_pct = None
    try:
        nifty_hist = get_historical(NIFTY_SYMBOL, period="1y")
        if nifty_hist:
            # Find closest price to earliest_date
            target = earliest_date.strftime("%Y-%m-%d")
            entry_row = next((r for r in nifty_hist if r["date"][:10] >= target), None)
            if entry_row:
                nifty_entry = entry_row["close"]
                nifty_now = nifty_hist[-1]["close"]
                nifty_return_pct = round(((nifty_now - nifty_entry) / nifty_entry) * 100, 2)
    except Exception:
        pass

    portfolio_return_pct = round((total_pnl / total_invested) * 100, 2) if total_invested else 0

    return {
        "total_pnl": round(total_pnl, 2),
        "total_invested": round(total_invested, 2),
        "portfolio_return_pct": portfolio_return_pct,
        "win_rate": round(closed_correct / closed_total * 100, 1) if closed_total else None,
        "trade_count": len(trades),
        "open_count": sum(1 for t in trades if t.exit_price is None),
        "closed_count": closed_total,
        "nifty_return_pct": nifty_return_pct,
    }
