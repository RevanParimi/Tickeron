"""
Price service — fetches live + historical prices via yfinance.
For Indian equities: append .NS (NSE) or .BO (BSE) to symbol.
"""
import yfinance as yf
import pandas as pd
from typing import Optional
from datetime import datetime, timedelta


# Map user-friendly symbols to yfinance tickers
SYMBOL_MAP = {
    "SUZLON": "SUZLON.NS",
    "IREDA": "IREDA.NS",
    "TRENT": "TRENT.NS",
    "DIXON": "DIXON.NS",
    "PAYTM": "PAYTM.NS",
    "BSE": "BSE.NS",
    "SILVER": "SI=F",          # Silver futures (USD)
    "GOLD": "GC=F",            # Gold futures (USD)
    "NIFTY50": "^NSEI",
    "SENSEX": "^BSESN",
}


def _resolve(symbol: str) -> str:
    """Return yfinance ticker for a given symbol."""
    return SYMBOL_MAP.get(symbol.upper(), symbol.upper() + ".NS")


def get_current_price(symbol: str) -> dict:
    """Fetch latest price, change %, volume."""
    ticker = yf.Ticker(_resolve(symbol))
    try:
        info = ticker.fast_info
        price = round(float(info.last_price), 2)
        prev_close = round(float(info.previous_close), 2)
        change_pct = round(((price - prev_close) / prev_close) * 100, 2) if prev_close else 0
        return {
            "symbol": symbol,
            "price": price,
            "prev_close": prev_close,
            "change_pct": change_pct,
            "currency": info.currency,
            "as_of": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": str(e)}


def get_historical(symbol: str, period: str = "1y", interval: str = "1d") -> list[dict]:
    """
    Fetch OHLCV history.
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y
    interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo
    """
    ticker = yf.Ticker(_resolve(symbol))
    df = ticker.history(period=period, interval=interval)
    if df.empty:
        return []
    df = df.reset_index()
    df.columns = [c.lower() for c in df.columns]
    records = df[["date", "open", "high", "low", "close", "volume"]].copy()
    records["date"] = records["date"].astype(str)
    return records.round(2).to_dict(orient="records")


def get_seasonal_pattern(symbol: str) -> dict:
    """
    Compute average monthly returns over 5 years.
    Returns best/worst months and monthly avg return map.
    """
    ticker = yf.Ticker(_resolve(symbol))
    df = ticker.history(period="5y", interval="1mo")
    if df.empty:
        return {"monthly_avg": {}, "best_months": [], "worst_months": []}

    df["month"] = df.index.month
    df["return"] = df["Close"].pct_change() * 100
    monthly = df.groupby("month")["return"].mean().round(2)

    month_names = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
                   7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}

    monthly_avg = {month_names[m]: v for m, v in monthly.items()}
    sorted_months = sorted(monthly_avg.items(), key=lambda x: x[1], reverse=True)

    return {
        "symbol": symbol,
        "monthly_avg": monthly_avg,
        "best_months": [m for m, _ in sorted_months[:3]],
        "worst_months": [m for m, _ in sorted_months[-3:]],
        "data_years": 5,
    }


def get_earnings_calendar(symbol: str) -> dict:
    """
    Fetch next earnings date + EPS estimates from yfinance.
    Returns None for next_earnings if unavailable.
    """
    ticker = yf.Ticker(_resolve(symbol))
    result = {"symbol": symbol, "next_earnings": None, "eps_estimate": None, "revenue_estimate": None}
    try:
        cal = ticker.calendar
        if cal is not None and not (hasattr(cal, "empty") and cal.empty):
            if isinstance(cal, dict):
                dates = cal.get("Earnings Date", [])
                result["next_earnings"] = str(dates[0]) if dates else None
                eps = cal.get("Earnings Average", [])
                result["eps_estimate"] = round(float(eps[0]), 2) if eps else None
                rev = cal.get("Revenue Average", [])
                result["revenue_estimate"] = int(rev[0]) if rev else None
            elif hasattr(cal, "iloc"):
                row = cal.iloc[0] if len(cal) > 0 else {}
                result["next_earnings"] = str(row.name) if hasattr(row, "name") else None
    except Exception:
        pass
    return result


def check_signal_accuracy(symbol: str, signal: str, signal_date: datetime, days: int = 14) -> dict:
    """
    Check if a past signal was correct by comparing price N days after signal date.
    Returns outcome: 'correct' | 'incorrect' | 'pending'
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    if signal_date > cutoff:
        return {"outcome": "pending", "price_change_pct": None}

    try:
        ticker = yf.Ticker(_resolve(symbol))
        start = signal_date.date()
        end = (signal_date + timedelta(days=days + 5)).date()
        df = ticker.history(start=str(start), end=str(end), interval="1d")
        if len(df) < 2:
            return {"outcome": "pending", "price_change_pct": None}

        entry = float(df["Close"].iloc[0])
        exit_idx = min(days, len(df) - 1)
        exit_p = float(df["Close"].iloc[exit_idx])
        pct = round(((exit_p - entry) / entry) * 100, 2)

        if signal in ("BUY", "ACCUMULATE"):
            correct = pct >= 2
        elif signal == "AVOID":
            correct = pct <= -2
        else:  # HOLD, WATCH
            correct = abs(pct) < 5

        return {
            "outcome": "correct" if correct else "incorrect",
            "price_change_pct": pct,
            "entry_price": round(entry, 2),
            "exit_price": round(exit_p, 2),
            "days_checked": exit_idx,
        }
    except Exception as e:
        return {"outcome": "error", "price_change_pct": None, "error": str(e)}
