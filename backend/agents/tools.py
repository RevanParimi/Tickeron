"""
All LangChain tools used by the agents.
Each tool is a simple function wrapped with @tool.
"""
from langchain_core.tools import tool
from core.config import settings
import httpx
import json


# ── Web Search via Tavily ──────────────────────────────────────────────────────
@tool
def web_search(query: str) -> str:
    """Search the web for current financial news and analysis. Use for news, events, earnings."""
    if not settings.tavily_api_key:
        return f"[MOCK] Web search results for: {query}\n- Article 1: Positive outlook for {query}\n- Article 2: Analyst upgrades {query}"
    
    try:
        import httpx
        resp = httpx.post(
            "https://api.tavily.com/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": query,
                "max_results": 5,
                "include_answer": True,
                "search_depth": "basic",
            },
            timeout=15,
        )
        data = resp.json()
        results = data.get("results", [])
        answer = data.get("answer", "")
        
        output = f"Summary: {answer}\n\nSources:\n"
        for r in results:
            output += f"- [{r['title']}]({r['url']})\n  {r.get('content','')[:200]}\n"
        return output
    except Exception as e:
        return f"Search error: {e}"


# ── Macro Indicators (FRED-like, free) ────────────────────────────────────────
@tool
def get_macro_indicator(indicator: str) -> str:
    """
    Fetch macro indicators. Supported: 'us_rates', 'india_inflation', 'dxy', 'oil_price', 'vix'.
    Returns latest value + trend.
    """
    # Using yfinance as free proxy for macro data
    import yfinance as yf
    ticker_map = {
        "us_rates": "^TNX",        # 10Y treasury yield
        "dxy": "DX-Y.NYB",         # USD index
        "oil_price": "CL=F",       # Crude oil futures
        "vix": "^VIX",             # Volatility index
        "gold": "GC=F",
        "silver": "SI=F",
    }
    key = indicator.lower().replace(" ", "_")
    ticker_sym = ticker_map.get(key, "^VIX")
    try:
        t = yf.Ticker(ticker_sym)
        hist = t.history(period="5d")
        if hist.empty:
            return f"No data for {indicator}"
        latest = round(hist["Close"].iloc[-1], 2)
        prev = round(hist["Close"].iloc[-2], 2)
        chg = round(((latest - prev) / prev) * 100, 2)
        trend = "↑" if chg > 0 else "↓"
        return f"{indicator.upper()}: {latest} ({trend} {abs(chg)}% vs prev close)"
    except Exception as e:
        return f"Macro data error: {e}"


# ── Company Info ──────────────────────────────────────────────────────────────
@tool
def get_company_info(symbol: str) -> str:
    """
    Fetch company fundamentals: sector, market cap, P/E, 52w high/low.
    Symbol should be NSE ticker like SUZLON, TRENT etc.
    """
    import yfinance as yf
    from services.price_service import _resolve
    try:
        t = yf.Ticker(_resolve(symbol))
        info = t.info
        return json.dumps({
            "name": info.get("longName", symbol),
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "market_cap_cr": round(info.get("marketCap", 0) / 1e7, 0),  # in crores
            "pe_ratio": info.get("trailingPE"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "description": (info.get("longBusinessSummary", "") or "")[:400],
        }, indent=2)
    except Exception as e:
        return f"Company info error: {e}"


# ── Price History Summary ──────────────────────────────────────────────────────
@tool
def get_price_trend(symbol: str) -> str:
    """
    Get 3-month price trend summary for a symbol.
    Returns direction, momentum, and key price levels.
    """
    from services.price_service import get_historical, _resolve
    try:
        history = get_historical(symbol, period="3mo", interval="1wk")
        if not history:
            return f"No price history for {symbol}"
        closes = [h["close"] for h in history if h.get("close")]
        if len(closes) < 4:
            return "Insufficient data"
        start, end = closes[0], closes[-1]
        ret = round(((end - start) / start) * 100, 2)
        peak = max(closes)
        trough = min(closes)
        momentum = "STRONG_UP" if ret > 10 else "UP" if ret > 3 else "DOWN" if ret < -3 else "STRONG_DOWN" if ret < -10 else "FLAT"
        return (
            f"{symbol} 3-month trend: {ret:+.1f}%\n"
            f"Momentum: {momentum}\n"
            f"Range: {trough} – {peak}\n"
            f"Current: {end}"
        )
    except Exception as e:
        return f"Price trend error: {e}"
