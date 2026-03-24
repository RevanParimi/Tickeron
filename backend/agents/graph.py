"""
MarketPulse AI — LangGraph agent pipeline.

Graph topology (sequential for MVP, easy to parallelize later):
  START → web_scout → macro_lens → quant_engine → synthesis → END

State flows through each node and accumulates results.
"""
from typing import TypedDict, Annotated, List, Optional
import operator
import json
from datetime import datetime

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from agents.tools import get_symbol_news, tavily_search, get_macro_indicator, get_company_info, get_price_trend
from core.config import settings


# ── State Schema ──────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    symbol: str
    sector: str
    asset_type: str                          # equity | commodity

    # Accumulated findings
    news_summary: str
    macro_summary: str
    price_trend: str
    company_info: str
    sources: Annotated[List[str], operator.add]

    # Final output
    signal: str                              # BUY | ACCUMULATE | HOLD | WATCH | AVOID
    confidence: float
    direction: str                           # BULLISH | BEARISH | NEUTRAL
    score_news: float
    score_macro: float
    score_sector: float
    score_quant: float
    summary: str
    reasoning_chain: str
    error: Optional[str]


# ── LLM setup ─────────────────────────────────────────────────────────────────
def _get_llm(bind_tools=None):
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY not set in .env")
    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=1024,
    )
    if bind_tools:
        return llm.bind_tools(bind_tools)
    return llm


# ── Node 1: Web Scout ─────────────────────────────────────────────────────────
def web_scout_node(state: AgentState) -> dict:
    """
    WebScoutAgent:
    - YahooFinanceNewsTool → latest ticker news (free, unlimited)
    - tavily_search        → analyst notes + filings (uses Tavily quota)
    """
    symbol = state["symbol"]
    try:
        # Tool 1: Yahoo Finance news — free, unlimited, financial-specific
        yahoo_news = get_symbol_news.invoke(symbol)

        # Tool 2: Tavily for analyst notes + filings — uses quota (~1 search)
        analyst_notes = tavily_search.invoke(f"{symbol} NSE analyst rating outlook report 2024")

        # Extract source URLs from tavily output
        sources = []
        for line in analyst_notes.split("\n"):
            line = line.strip()
            if line.startswith("http"):
                sources.append(line)

        llm = _get_llm()
        resp = llm.invoke([
            SystemMessage(content=(
                "You are a financial analyst. Summarize news sentiment in 3 concise bullet points. "
                "Be factual, not promotional. End with: SENTIMENT_SCORE: <number 0-100>"
            )),
            HumanMessage(content=(
                f"Symbol: {symbol}\n"
                f"Yahoo Finance News:\n{yahoo_news}\n\n"
                f"Analyst Notes:\n{analyst_notes[:600]}"
            ))
        ])
        return {
            "news_summary": resp.content,
            "sources": sources[:5],
        }
    except Exception as e:
        return {"news_summary": f"News fetch failed: {e}", "sources": []}


# ── Node 2: Macro Lens ────────────────────────────────────────────────────────
def macro_lens_node(state: AgentState) -> dict:
    """
    MacroLensAgent:
    - get_macro_indicator → oil, VIX, DXY via yfinance (free)
    - tavily_search       → RBI policy, geopolitical news (~1 search, uses quota)
    """
    symbol = state["symbol"]
    sector = state["sector"]
    try:
        # Tool 1: Free macro indicators via yfinance
        oil = get_macro_indicator.invoke("oil_price")
        vix = get_macro_indicator.invoke("vix")
        dxy = get_macro_indicator.invoke("dxy")

        # Tool 2: Tavily for India macro/policy context (~1 Tavily search)
        india_macro = tavily_search.invoke(f"India {sector} sector outlook RBI policy interest rate 2024")

        llm = _get_llm()
        resp = llm.invoke([
            SystemMessage(content=(
                "You are a macro analyst. Given indicators and news, assess impact on the specified sector. "
                "Write 2-3 bullet points. End with: MACRO_SCORE: <number 0-100> "
                "(100=very bullish macro for this sector)"
            )),
            HumanMessage(content=(
                f"Symbol: {symbol} | Sector: {sector}\n"
                f"Oil: {oil}\nVIX: {vix}\nDXY: {dxy}\n"
                f"India macro news:\n{india_macro[:800]}"
            ))
        ])
        return {"macro_summary": resp.content}
    except Exception as e:
        return {"macro_summary": f"Macro analysis failed: {e}"}


# ── Node 3: Quant Engine ──────────────────────────────────────────────────────
def quant_engine_node(state: AgentState) -> dict:
    """Fetch price trend and company fundamentals."""
    symbol = state["symbol"]
    try:
        trend = get_price_trend.invoke(symbol)
        info = get_company_info.invoke(symbol)
        return {
            "price_trend": trend,
            "company_info": info,
        }
    except Exception as e:
        return {"price_trend": f"Quant failed: {e}", "company_info": "{}"}


# ── Node 4: Synthesis Core ────────────────────────────────────────────────────
def synthesis_node(state: AgentState) -> dict:
    """
    Combine all signals into a final trend rating.
    Weights: news=25%, macro=25%, price_trend=25%, fundamentals=25%
    """
    symbol = state["symbol"]

    def _extract_score(text: str, key: str) -> float:
        """Pull SCORE: <n> from LLM output."""
        for line in (text or "").split("\n"):
            if key in line and ":" in line:
                try:
                    return min(100, max(0, float(line.split(":")[-1].strip().split()[0])))
                except:
                    pass
        return 50.0  # default neutral

    score_news = _extract_score(state.get("news_summary", ""), "SENTIMENT_SCORE")
    score_macro = _extract_score(state.get("macro_summary", ""), "MACRO_SCORE")

    # Simple quant score from trend text
    trend_text = state.get("price_trend", "")
    if "STRONG_UP" in trend_text:
        score_quant = 80
    elif "UP" in trend_text:
        score_quant = 65
    elif "STRONG_DOWN" in trend_text:
        score_quant = 20
    elif "DOWN" in trend_text:
        score_quant = 35
    else:
        score_quant = 50

    # Sector score — borrow from macro for now (will be its own agent in v2)
    score_sector = score_macro

    # Weighted composite
    composite = (
        score_news * 0.25 +
        score_macro * 0.25 +
        score_quant * 0.25 +
        score_sector * 0.25
    )

    # Map composite → signal
    if composite >= 75:
        signal, direction = "BUY", "BULLISH"
    elif composite >= 62:
        signal, direction = "ACCUMULATE", "BULLISH"
    elif composite >= 50:
        signal, direction = "HOLD", "NEUTRAL"
    elif composite >= 38:
        signal, direction = "WATCH", "BEARISH"
    else:
        signal, direction = "AVOID", "BEARISH"

    confidence = round(composite / 100, 2)

    # LLM plain-language summary
    try:
        llm = _get_llm()
        resp = llm.invoke([
            SystemMessage(content=
                "You are a financial trend analyst. Write a 3-sentence plain English summary of the trend outlook "
                "for retail investors. Do NOT give price targets. Focus on direction, confidence, and key risks. "
                "Do NOT give investment advice — describe trends only."
            ),
            HumanMessage(content=
                f"Symbol: {symbol}\n"
                f"Signal: {signal} | Confidence: {confidence:.0%}\n"
                f"News:\n{state.get('news_summary','')[:400]}\n"
                f"Macro:\n{state.get('macro_summary','')[:400]}\n"
                f"Price trend: {state.get('price_trend','')}"
            )
        ])
        summary = resp.content
    except Exception as e:
        summary = f"Auto-summary unavailable: {e}"

    reasoning_chain = (
        f"WebScout (news): {state.get('news_summary','N/A')[:300]}\n\n"
        f"MacroLens: {state.get('macro_summary','N/A')[:300]}\n\n"
        f"QuantEngine: {state.get('price_trend','N/A')}\n\n"
        f"Scores → News:{score_news:.0f} Macro:{score_macro:.0f} "
        f"Quant:{score_quant:.0f} Sector:{score_sector:.0f} → Composite:{composite:.1f}"
    )

    return {
        "signal": signal,
        "confidence": confidence,
        "direction": direction,
        "score_news": score_news,
        "score_macro": score_macro,
        "score_sector": score_sector,
        "score_quant": score_quant,
        "summary": summary,
        "reasoning_chain": reasoning_chain,
    }


# ── Build Graph ───────────────────────────────────────────────────────────────
def build_graph():
    g = StateGraph(AgentState)
    g.add_node("web_scout", web_scout_node)
    g.add_node("macro_lens", macro_lens_node)
    g.add_node("quant_engine", quant_engine_node)
    g.add_node("synthesis", synthesis_node)

    g.set_entry_point("web_scout")
    g.add_edge("web_scout", "macro_lens")
    g.add_edge("macro_lens", "quant_engine")
    g.add_edge("quant_engine", "synthesis")
    g.add_edge("synthesis", END)

    return g.compile()


# Singleton — compiled once, reused
_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


# ── Public API ────────────────────────────────────────────────────────────────
async def run_analysis(symbol: str, sector: str = "General", asset_type: str = "equity") -> dict:
    """
    Run the full agent pipeline for a symbol.
    Returns a dict matching the Signal schema.
    """
    graph = get_graph()
    initial_state: AgentState = {
        "symbol": symbol,
        "sector": sector,
        "asset_type": asset_type,
        "news_summary": "",
        "macro_summary": "",
        "price_trend": "",
        "company_info": "",
        "sources": [],
        "signal": "HOLD",
        "confidence": 0.5,
        "direction": "NEUTRAL",
        "score_news": 50,
        "score_macro": 50,
        "score_sector": 50,
        "score_quant": 50,
        "summary": "",
        "reasoning_chain": "",
        "error": None,
    }
    try:
        result = await graph.ainvoke(initial_state)
        return result
    except Exception as e:
        initial_state["error"] = str(e)
        initial_state["summary"] = f"Analysis failed: {e}"
        return initial_state
