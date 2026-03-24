from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.session import get_db
from db.models import MacroSignal
from core.auth import get_current_user

router = APIRouter(prefix="/macro", tags=["Macro & Trends"])


@router.get("/signals")
async def get_macro_signals(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return latest macro signals from DB."""
    result = await db.execute(
        select(MacroSignal).order_by(MacroSignal.created_at.desc()).limit(limit)
    )
    signals = result.scalars().all()
    return {
        "signals": [
            {
                "id": s.id,
                "event": s.event,
                "impact": s.impact,
                "direction": s.direction,
                "sectors_affected": s.sectors_affected,
                "summary": s.summary,
                "source_url": s.source_url,
                "created_at": s.created_at.isoformat(),
            }
            for s in signals
        ]
    }


@router.post("/refresh")
async def refresh_macro(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a macro scan (runs MacroLensAgent standalone)."""
    background_tasks.add_task(_run_macro_scan)
    return {"status": "macro_scan_queued"}


async def _run_macro_scan():
    """Standalone macro scan — saves results to macro_signals table."""
    from agents.tools import web_search, get_macro_indicator
    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage, SystemMessage
    from core.config import settings
    from db.session import AsyncSessionLocal
    import json

    try:
        oil = get_macro_indicator.invoke("oil_price")
        vix = get_macro_indicator.invoke("vix")
        dxy = get_macro_indicator.invoke("dxy")
        india_news = web_search.invoke("India economy market macro policy 2024")

        llm = ChatGroq(api_key=settings.groq_api_key, model="llama-3.3-70b-versatile", temperature=0.1)
        resp = llm.invoke([
            SystemMessage(content=
                "You are a macro analyst. Identify 3 key macro events and their impact on Indian equity/commodity markets. "
                "Return JSON array: [{event, impact(HIGH/MED/LOW), direction(TAILWIND/HEADWIND/NEUTRAL), sectors_affected(array), summary}]"
                "Return ONLY valid JSON, no markdown."
            ),
            HumanMessage(content=f"Oil: {oil}\nVIX: {vix}\nDXY: {dxy}\nNews: {india_news[:1000]}")
        ])

        events = json.loads(resp.content)
        async with AsyncSessionLocal() as db:
            for ev in events[:3]:
                signal = MacroSignal(
                    event=ev.get("event", "Unknown"),
                    impact=ev.get("impact", "MED"),
                    direction=ev.get("direction", "NEUTRAL"),
                    sectors_affected=json.dumps(ev.get("sectors_affected", [])),
                    summary=ev.get("summary", ""),
                )
                db.add(signal)
            await db.commit()
    except Exception as e:
        print(f"Macro scan error: {e}")
