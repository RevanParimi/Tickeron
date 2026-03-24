from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    watchlist = relationship("WatchlistItem", back_populates="user", cascade="all, delete")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete")
    paper_trades = relationship("PaperTrade", back_populates="user", cascade="all, delete")


class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    name = Column(String)
    asset_type = Column(String, default="equity")   # equity | commodity | index
    sector = Column(String)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist")
    signals = relationship("Signal", back_populates="watchlist_item", cascade="all, delete")


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True)
    watchlist_item_id = Column(Integer, ForeignKey("watchlist.id"), nullable=False)
    symbol = Column(String, nullable=False, index=True)

    # Core signal
    signal = Column(String)          # BUY | ACCUMULATE | HOLD | WATCH | AVOID
    confidence = Column(Float)       # 0.0 – 1.0
    direction = Column(String)       # BULLISH | BEARISH | NEUTRAL

    # Component scores (0-100 each)
    score_news = Column(Float, default=0)
    score_macro = Column(Float, default=0)
    score_sector = Column(Float, default=0)
    score_quant = Column(Float, default=0)

    # Reasoning
    summary = Column(Text)           # plain-language explanation
    sources = Column(Text)           # JSON list of URLs
    reasoning_chain = Column(Text)   # step-by-step agent reasoning

    created_at = Column(DateTime, default=datetime.utcnow)

    watchlist_item = relationship("WatchlistItem", back_populates="signals")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    condition = Column(String)       # e.g. "signal_changes_to"
    value = Column(String)           # e.g. "BUY"
    active = Column(Boolean, default=True)
    last_triggered = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String, nullable=False)
    ai_signal = Column(String)           # AI signal that prompted the trade
    action = Column(String, nullable=False)   # BUY | SELL
    quantity = Column(Float, default=1.0)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    entry_at = Column(DateTime, default=datetime.utcnow)
    exit_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="paper_trades")


class MacroSignal(Base):
    __tablename__ = "macro_signals"

    id = Column(Integer, primary_key=True)
    event = Column(String, nullable=False)
    impact = Column(String)          # HIGH | MED | LOW
    direction = Column(String)       # TAILWIND | HEADWIND | NEUTRAL
    sectors_affected = Column(Text)  # JSON list
    summary = Column(Text)
    source_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
