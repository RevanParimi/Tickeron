"""
Tools per agent:

WebScoutAgent   → yahoo_finance_news (free, unlimited) + tavily_search (filings/analyst notes)
MacroLensAgent  → tavily_search (policy/geo news) + get_macro_indicator (yfinance, free)
QuantEngine     → get_price_trend + get_company_info (yfinance, free)
SynthesisCore   → no tools (pure scoring + LLM)
"""
import json
import re
import os
from langchain_core.tools import tool
from langchain_community.tools.yahoo_finance_news import YahooFinanceNewsTool
from langchain_community.tools.tavily_search import TavilySearchResults
from core.config import settings


# ── WebScoutAgent Tool 1: Yahoo Finance News (free, unlimited) ─────────────────
# Fetches latest news articles for a ticker — purpose-built for financial symbols
_yahoo_news = YahooFinanceNewsTool()

@tool
def get_symbol_news(symbol: str) -> str:
    """
    Fetch latest financial news for a stock symbol via Yahoo Finance.
    Free and unlimited. Use for earnings, results, analyst coverage.
    Symbol should be NSE ticker e.g. SUZLON, TRENT, IREDA.
    """
    try:
        from services.price_service import _resolve
        yf_symbol = _resolve(symbol)
        result = _yahoo_news.run(yf_symbol)
        return result if result else f"No recent news found for {symbol}"
    except Exception as e:
        return f"Yahoo news error for {symbol}: {e}"


# ── WebScoutAgent Tool 2 + MacroLensAgent Tool 1: Tavily Search ───────────────
# Used for: filings/analyst notes (WebScout) + policy/geopolitical news (MacroLens)
def _get_tavily():
    if not settings.tavily_api_key:
        return None
    return TavilySearchResults(
        api_key=settings.tavily_api_key,
        max_results=5,
        search_depth="basic",
        include_answer=True,
    )

@tool
def tavily_search(query: str) -> str:
    """
    Search the web via Tavily for analyst notes, filings, policy news, geopolitical events.
    Uses Tavily API quota — use sparingly (macro + filings only, not general news).
    Falls back to DuckDuckGo if Tavily key not set.
    """
    client = _get_tavily()
    if client:
        try:
            results = client.invoke(query)
            if isinstance(results, list):
                output = ""
                for r in results:
                    output += f"- {r.get('title','')}\n  {r.get('content','')[:200]}\n  {r.get('url','')}\n"
                return output or "No results"
            return str(results)
        except Exception as e:
            return f"Tavily error: {e} — falling back to DuckDuckGo"

    # Fallback: DuckDuckGo (no key needed)
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        return "\n".join([f"- {r['title']}: {r['body']}" for r in results])
    except Exception as e:
        return f"Search unavailable: {e}"


# ── MacroLensAgent Tool 2: Macro Indicators via yfinance (free) ───────────────
@tool
def get_macro_indicator(indicator: str) -> str:
    """
    Fetch macro indicators via yfinance. Free, no API key needed.
    Supported: oil_price, vix, dxy, us_rates, gold, silver.
    """
    import yfinance as yf
    ticker_map = {
        "us_rates": "^TNX",
        "dxy":      "DX-Y.NYB",
        "oil_price":"CL=F",
        "vix":      "^VIX",
        "gold":     "GC=F",
        "silver":   "SI=F",
    }
    key = indicator.lower().replace(" ", "_")
    ticker_sym = ticker_map.get(key, "^VIX")
    try:
        hist = yf.Ticker(ticker_sym).history(period="5d")
        if hist.empty or len(hist) < 2:
            return f"No data for {indicator}"
        latest = round(float(hist["Close"].iloc[-1]), 2)
        prev   = round(float(hist["Close"].iloc[-2]), 2)
        chg    = round(((latest - prev) / prev) * 100, 2) if prev else 0
        trend  = "↑" if chg > 0 else "↓"
        return f"{indicator.upper()}: {latest} ({trend} {abs(chg)}% vs prev close)"
    except Exception as e:
        return f"Macro data error: {e}"


# ── QuantEngine Tool 1: Price Trend via yfinance (free) ───────────────────────
@tool
def get_price_trend(symbol: str) -> str:
    """
    3-month OHLCV trend summary for a symbol.
    Returns momentum label, return %, price range. Uses yfinance — free.
    """
    from services.price_service import get_historical
    try:
        history = get_historical(symbol, period="3mo", interval="1wk")
        if not history:
            return f"No price history for {symbol}"
        closes = [h["close"] for h in history if h.get("close")]
        if len(closes) < 4:
            return "Insufficient data"
        start, end = closes[0], closes[-1]
        ret    = round(((end - start) / start) * 100, 2)
        peak   = max(closes)
        trough = min(closes)
        # Use exact match to avoid substring issues (STRONG_UP contains UP)
        if ret > 10:   momentum = "STRONG_UP"
        elif ret > 3:  momentum = "UP"
        elif ret < -10:momentum = "STRONG_DOWN"
        elif ret < -3: momentum = "DOWN"
        else:          momentum = "FLAT"
        return (
            f"{symbol} 3-month trend: {ret:+.1f}%\n"
            f"Momentum: {momentum}\n"
            f"Range: {trough} – {peak}\n"
            f"Current: {end}"
        )
    except Exception as e:
        return f"Price trend error: {e}"


# ── QuantEngine Tool 2: Company Fundamentals via yfinance (free) ──────────────
@tool
def get_company_info(symbol: str) -> str:
    """
    Fetch company fundamentals: sector, market cap, P/E, 52w high/low.
    Uses yfinance — free, no API key needed.
    """
    import yfinance as yf
    from services.price_service import _resolve
    try:
        info = yf.Ticker(_resolve(symbol)).info
        return json.dumps({
            "name":           info.get("longName", symbol),
            "sector":         info.get("sector", "Unknown"),
            "industry":       info.get("industry", "Unknown"),
            "market_cap_cr":  round(info.get("marketCap", 0) / 1e7, 0),
            "pe_ratio":       info.get("trailingPE"),
            "52w_high":       info.get("fiftyTwoWeekHigh"),
            "52w_low":        info.get("fiftyTwoWeekLow"),
            "description":    (info.get("longBusinessSummary") or "")[:400],
        }, indent=2)
    except Exception as e:
        return f"Company info error: {e}"
