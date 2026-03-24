from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import WatchlistItem
from core.auth import get_current_user
from services.price_service import get_earnings_calendar

router = APIRouter(prefix="/earnings", tags=["Earnings"])


@router.get("")
async def earnings_calendar(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upcoming earnings dates for all symbols in the user's watchlist.
    Uses yfinance calendar data — best-effort, not guaranteed for all symbols.
    """
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == current_user["id"])
    )
    items = result.scalars().all()

    earnings = []
    for item in items:
        cal = get_earnings_calendar(item.symbol)
        earnings.append({
            "symbol": item.symbol,
            "name": item.name or item.symbol,
            "sector": item.sector,
            "next_earnings": cal.get("next_earnings"),
            "eps_estimate": cal.get("eps_estimate"),
            "revenue_estimate": cal.get("revenue_estimate"),
        })

    # Sort: symbols with known dates first, then by date
    def sort_key(e):
        d = e["next_earnings"]
        return (0, d) if d else (1, "")

    earnings.sort(key=sort_key)
    return {"earnings": earnings, "count": len(earnings)}
