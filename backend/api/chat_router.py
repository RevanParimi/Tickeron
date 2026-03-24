from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models import Signal, WatchlistItem
from core.auth import get_current_user
from core.config import settings

router = APIRouter(prefix="/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []


@router.post("/{symbol}")
async def chat_with_symbol(
    symbol: str,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chat with AI analyst about a specific symbol using its signal context."""
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

    context = f"Symbol: {symbol.upper()}\n"
    if sig:
        context += (
            f"Signal: {sig.signal} | Confidence: {sig.confidence:.0%} | Direction: {sig.direction}\n"
            f"Summary: {sig.summary}\n"
            f"Score breakdown — News: {sig.score_news:.0f}, Macro: {sig.score_macro:.0f}, "
            f"Sector: {sig.score_sector:.0f}, Quant: {sig.score_quant:.0f}\n"
            f"Reasoning: {(sig.reasoning_chain or '')[:600]}\n"
        )
    else:
        context += "No signal generated yet — analysis still pending.\n"

    from langchain_groq import ChatGroq
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="LLM not configured")

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0.3,
        max_tokens=400,
    )

    messages = [
        SystemMessage(content=(
            "You are a concise financial trend analyst for Indian equity markets. "
            "Answer questions about the given symbol using the provided signal context. "
            "Be direct, factual, and max 4 sentences. "
            "Never give specific price targets or investment advice — describe trends and analysis only. "
            "End every reply with a bolded one-line key takeaway on a new line: **Key: <takeaway>**"
        )),
        HumanMessage(content=f"Signal context:\n{context}"),
    ]

    # Append prior conversation (last 3 exchanges = 6 messages)
    for msg in (body.history or [])[-6:]:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=body.message))

    try:
        resp = await llm.ainvoke(messages)
        return {"reply": resp.content, "symbol": symbol.upper()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
