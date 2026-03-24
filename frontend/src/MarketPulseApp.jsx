import { useState, useEffect } from 'react';
import api from './api';
import SparklineChart from './components/SparklineChart';
import AIChat from './components/AIChat';
import AlertsPanel from './components/AlertsPanel';
import SectorHeatMap from './components/SectorHeatMap';
import { useTheme, makeSIG, makeDIR } from './theme';

const TICKERS = [
  { label: 'NIFTY 50', val: '23,847', chg: '+0.34%', up: true },
  { label: 'SENSEX',   val: '78,542', chg: '+0.28%', up: true },
  { label: 'SILVER',   val: '$87.2',  chg: '+0.6%',  up: true },
  { label: 'GOLD',     val: '₹72,450',chg: '+0.2%',  up: true },
  { label: 'USD/INR',  val: '83.42',  chg: '-0.1%',  up: false },
];

const NAV = [
  { icon: '◈', label: 'Dashboard' },
  { icon: '◉', label: 'Watchlist' },
  { icon: '◎', label: 'Market Pulse' },
  { icon: '▣', label: 'Portfolio' },
  { icon: '◐', label: 'Accuracy' },
  { icon: '◷', label: 'Earnings' },
  { icon: '◻', label: 'Alerts' },
  { icon: '◇', label: 'How It Works' },
];

// ─── Shared Components ────────────────────────────────────────────────────────
function SignalBadge({ signal }) {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const color = SIG[signal] || C.dim;
  return (
    <span style={{
      display: 'inline-block',
      background: `${color}18`, border: `1px solid ${color}55`,
      color, fontSize: 10, fontWeight: 800, padding: '3px 12px',
      borderRadius: 20, letterSpacing: '0.08em', whiteSpace: 'nowrap',
      boxShadow: signal ? `0 0 12px ${color}25` : 'none',
    }}>
      {signal || 'PENDING'}
    </span>
  );
}

function ConfidenceBar({ value, showLabel = true }) {
  const { C } = useTheme();
  const color = value >= 70 ? C.green : value >= 50 ? C.gold : C.red;
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: C.dim, letterSpacing: '0.06em' }}>CONFIDENCE</span>
          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value}%</span>
        </div>
      )}
      <div style={{ height: 3, background: C.muted, borderRadius: 3 }}>
        <div style={{ height: 3, width: `${value}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value }) {
  const { C } = useTheme();
  const color = value >= 70 ? C.green : value >= 50 ? C.gold : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 10, color: C.dim, width: 50, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: C.muted, borderRadius: 4 }}>
        <div style={{ height: 4, width: `${value}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, width: 26, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, user, onLogout }) {
  const { C, isDark, toggle } = useTheme();
  return (
    <aside style={{
      width: 230, height: '100vh', position: 'fixed', left: 0, top: 0,
      background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
      borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7C5CFC 0%, #A855F7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 20px #7C5CFC45',
          }}>M</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '-0.01em' }}>MarketPulse</div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginTop: 1 }}>AI INTELLIGENCE</div>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 10px ${C.green}` }} />
          <span style={{ fontSize: 10, color: C.dim }}>Markets Live</span>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '20px 20px 8px' }}>
        <span style={{ fontSize: 9, color: C.dim, letterSpacing: '0.14em' }}>MAIN MENU</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV.map((item, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10, border: 'none',
            cursor: 'pointer', marginBottom: 3, fontFamily: 'inherit',
            background: tab === i ? `linear-gradient(135deg, ${C.accent}18 0%, ${C.accent2}0A 100%)` : 'none',
            color: tab === i ? C.accent : C.dim,
            fontSize: 12, fontWeight: tab === i ? 700 : 400,
            letterSpacing: '0.02em', textAlign: 'left',
            borderLeft: `2px solid ${tab === i ? C.accent : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Disclaimer */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{
          background: `${C.accent}0A`, border: `1px solid ${C.accent}20`,
          borderRadius: 8, padding: '8px 10px',
          fontSize: 9, color: C.dim, lineHeight: 1.5,
        }}>
          AI-generated trend estimates. Not SEBI-registered advice.
        </div>
      </div>

      {/* Theme toggle */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.muted, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '8px 12px',
        }}>
          <span style={{ fontSize: 10, color: C.dim, letterSpacing: '0.06em' }}>
            {isDark ? 'DARK MODE' : 'LIGHT MODE'}
          </span>
          <div
            onClick={toggle}
            style={{
              width: 40, height: 22, borderRadius: 11, position: 'relative',
              background: isDark ? C.accent : C.border,
              border: `1px solid ${isDark ? C.accent : C.border}`,
              cursor: 'pointer', transition: 'background 0.25s, border-color 0.25s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2,
              left: isDark ? 20 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.25s',
              boxShadow: '0 1px 4px #00000030',
            }} />
          </div>
        </div>
      </div>

      {/* User section */}
      <div style={{ padding: '14px 16px 20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C5CFC, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0,
            boxShadow: '0 2px 12px #7C5CFC35',
          }}>{(user?.name || 'U')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 9, color: C.green, marginTop: 2 }}>● Active</div>
          </div>
          <button onClick={onLogout} style={{
            background: `${C.red}18`, border: `1px solid ${C.red}30`,
            color: C.red, fontSize: 9, padding: '5px 9px', borderRadius: 6,
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
          }}>OUT</button>
        </div>
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ time }) {
  const { C } = useTheme();
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 15,
      background: `${C.bg}F5`, backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '0 36px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', gap: 32, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TICKERS.map(t => (
          <div key={t.label} style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 9, color: C.dim, letterSpacing: '0.05em' }}>{t.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.val}</span>
            <span style={{ fontSize: 10, color: t.up ? C.green : C.red, fontWeight: 700 }}>{t.chg}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          <span style={{ fontSize: 10, color: C.dim }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ user, onNavigate }) {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [watchlist, setWatchlist] = useState([]);
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/watchlist').then(({ data }) => {
      const items = data.items || data;
      setWatchlist(items);
      const sigMap = {};
      items.forEach(item => { if (item.signal) sigMap[item.symbol] = item; });
      setSignals(sigMap);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const signalCounts = Object.values(signals).reduce((acc, s) => {
    if (s?.signal) acc[s.signal] = (acc[s.signal] || 0) + 1;
    return acc;
  }, {});
  const ready = Object.keys(signals).length;
  const avgConf = ready
    ? Math.round(Object.values(signals).reduce((s, i) => s + (i.confidence || 0), 0) / ready * 100)
    : 0;
  const actionable = (signalCounts.BUY || 0) + (signalCounts.ACCUMULATE || 0);

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: C.dim }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {ready > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${C.green}18, ${C.accent}0A)`,
            border: `1px solid ${C.green}30`, borderRadius: 14,
            padding: '12px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.green, lineHeight: 1 }}>{avgConf}%</div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.08em', marginTop: 4 }}>AVG CONFIDENCE</div>
          </div>
        )}
      </div>

      {/* Symbol cards row — TailAdmin style */}
      {watchlist.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 14 }}>PORTFOLIO OVERVIEW</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
            {watchlist.map(item => {
              const sig = signals[item.symbol];
              const sigColor = SIG[sig?.signal] || C.dim;
              return (
                <div key={item.symbol} onClick={() => onNavigate(1)} style={{
                  minWidth: 182, flexShrink: 0, cursor: 'pointer',
                  background: `linear-gradient(160deg, ${C.card2} 0%, ${C.card} 100%)`,
                  border: `1px solid ${C.border}`, borderTop: `2px solid ${sigColor}`,
                  borderRadius: 16, padding: '16px 18px',
                  boxShadow: `0 4px 24px ${sigColor}12`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{item.symbol}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: sigColor,
                      background: `${sigColor}18`, border: `1px solid ${sigColor}40`,
                      borderRadius: 4, padding: '2px 8px', letterSpacing: '0.06em',
                    }}>{sig?.signal || 'PENDING'}</span>
                  </div>
                  <SparklineChart symbol={item.symbol} width={146} height={42} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 10, color: C.dim }}>{item.sector || item.asset_type}</span>
                    {sig?.confidence != null && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: sigColor }}>
                        {Math.round(sig.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Symbols Tracked', value: watchlist.length, color: C.accent,  icon: '◉', sub: 'in watchlist' },
          { label: 'Signals Ready',   value: ready,            color: C.green,   icon: '◈', sub: 'analyzed' },
          { label: 'Pending',         value: Math.max(0, watchlist.length - ready), color: C.gold, icon: '◎', sub: 'in queue' },
          { label: 'Actionable',      value: actionable,       color: C.green,   icon: '↑', sub: 'BUY / ACCUMULATE' },
        ].map(s => (
          <div key={s.label} style={{
            background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`,
            border: `1px solid ${C.border}`, borderTop: `2px solid ${s.color}`,
            borderRadius: 16, padding: '20px 22px',
            boxShadow: `0 8px 32px ${s.color}08`,
          }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>{s.label.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 20, color: `${s.color}70`, paddingBottom: 3 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 9, color: C.dim }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Signal breakdown + Sector map */}
      {watchlist.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, marginBottom: 28 }}>
          <div style={{
            background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`,
            border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 22px',
          }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 20 }}>SIGNAL BREAKDOWN</div>
            {!Object.keys(signalCounts).length ? (
              <div style={{ color: C.dim, fontSize: 12 }}>No signals yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['BUY', 'ACCUMULATE', 'HOLD', 'WATCH', 'AVOID'].map(sig => {
                  const count = signalCounts[sig] || 0;
                  if (!count) return null;
                  const pct = Math.round(count / watchlist.length * 100);
                  return (
                    <div key={sig}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: SIG[sig], fontWeight: 700 }}>{sig}</span>
                        <span style={{ fontSize: 10, color: C.dim }}>{count} · {pct}%</span>
                      </div>
                      <div style={{ height: 5, background: C.muted, borderRadius: 5 }}>
                        <div style={{ height: 5, width: `${pct}%`, background: `linear-gradient(90deg, ${SIG[sig]}60, ${SIG[sig]})`, borderRadius: 5, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{
            background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`,
            border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 22px',
          }}>
            <SectorHeatMap watchlist={watchlist} />
          </div>
        </div>
      )}

      {/* Signals list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: C.dim, fontSize: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, opacity: 0.7 }} />
          Loading portfolio...
        </div>
      ) : watchlist.length === 0 ? (
        <div style={{
          background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          border: `2px dashed ${C.border}`, borderRadius: 20,
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>📈</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 10 }}>Start tracking markets</div>
          <div style={{ fontSize: 13, color: C.dim, marginBottom: 28, lineHeight: 1.8, maxWidth: 380, margin: '0 auto 28px' }}>
            Add symbols to your watchlist and our AI will generate trend signals within minutes.
          </div>
          <button onClick={() => onNavigate(1)} style={{
            padding: '13px 32px',
            background: 'linear-gradient(135deg, #7C5CFC, #A855F7)',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.08em',
            boxShadow: '0 4px 24px #7C5CFC40',
          }}>GO TO WATCHLIST →</button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 14 }}>LATEST SIGNALS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {watchlist.map(item => {
              const sig = signals[item.symbol];
              const dir = sig?.direction ? DIR[sig.direction] : null;
              const confidence = sig ? Math.round((sig.confidence || 0.5) * 100) : null;
              const sigColor = SIG[sig?.signal] || C.dim;
              return (
                <div key={item.id} style={{
                  background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`,
                  border: `1px solid ${C.border}`, borderLeft: `3px solid ${sigColor}`,
                  borderRadius: 14, padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
                  boxShadow: `0 2px 16px ${sigColor}08`,
                }}>
                  <div style={{ flex: '0 0 90px' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{item.symbol}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.sector || item.asset_type}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                    {sig?.summary ? sig.summary.slice(0, 100) + '…' : 'Analysis running…'}
                  </div>
                  {dir && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, color: dir.color, lineHeight: 1, fontWeight: 700 }}>{dir.icon}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{dir.label}</div>
                    </div>
                  )}
                  {confidence !== null && (
                    <div style={{ flex: '0 0 90px' }}>
                      <ConfidenceBar value={confidence} />
                    </div>
                  )}
                  <SignalBadge signal={sig?.signal} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Watchlist View ───────────────────────────────────────────────────────────
function WatchlistView() {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const DIR = makeDIR(C);
  const [watchlist, setWatchlist] = useState([]);
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [chatSymbol, setChatSymbol] = useState(null);
  const [alertSymbol, setAlertSymbol] = useState(null);

  async function load() {
    try {
      const { data } = await api.get('/watchlist');
      const items = data.items || data;
      setWatchlist(items);
      const sigMap = {};
      items.forEach(item => { if (item.signal) sigMap[item.symbol] = item; });
      setSignals(sigMap);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const token = localStorage.getItem('mp_token');
    const es = new EventSource(`http://localhost:8000/watchlist/stream?token=${token}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'signal_update') {
        setWatchlist(prev => prev.map(item =>
          item.symbol === event.symbol ? { ...item, ...event } : item
        ));
        setSignals(prev => ({ ...prev, [event.symbol]: { ...prev[event.symbol], ...event } }));
      }
    };
    return () => es.close();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true); setAddError('');
    try {
      await api.post('/watchlist', { symbol: symbol.toUpperCase(), sector: sector || 'Unknown', asset_type: 'equity' });
      setSymbol(''); setSector('');
      setLoading(true); load();
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Failed to add symbol');
    } finally { setAdding(false); }
  }

  const inputStyle = {
    padding: '10px 14px', background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
    fontSize: 12, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div>
      {/* Add form */}
      <div style={{
        background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`,
        border: `1px solid ${C.border}`, borderRadius: 18,
        padding: '24px 26px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 16 }}>TRACK A NEW SYMBOL</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input value={symbol} onChange={e => setSymbol(e.target.value)}
              placeholder="Symbol — RELIANCE, SUZLON, HDFCBANK"
              required style={{ ...inputStyle, width: '100%' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <input value={sector} onChange={e => setSector(e.target.value)}
              placeholder="Sector (optional)"
              style={{ ...inputStyle, width: '100%' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <button type="submit" disabled={adding} style={{
            padding: '10px 24px',
            background: adding ? C.muted : 'linear-gradient(135deg, #7C5CFC, #A855F7)',
            border: 'none', borderRadius: 8, color: adding ? C.dim : '#fff',
            fontSize: 11, fontWeight: 800, cursor: adding ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.07em',
            boxShadow: adding ? 'none' : '0 4px 16px #7C5CFC35',
            transition: 'all 0.2s',
          }}>{adding ? 'ADDING…' : '+ TRACK'}</button>
        </form>
        {addError && <div style={{ color: C.red, fontSize: 11, marginTop: 10 }}>{addError}</div>}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.dim, fontSize: 12 }}>Loading watchlist…</div>
      ) : watchlist.length === 0 ? (
        <div style={{
          background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          border: `2px dashed ${C.border}`, borderRadius: 18, padding: '56px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Nothing tracked yet</div>
          <div style={{ color: C.dim, fontSize: 12 }}>Add a symbol above to start receiving AI trend signals.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {watchlist.map(item => {
            const sig = signals[item.symbol];
            const isOpen = expanded === item.symbol;
            const confidence = sig ? Math.round((sig.confidence || 0.5) * 100) : null;
            const dir = sig?.direction ? DIR[sig.direction] : null;
            const sigColor = SIG[sig?.signal] || C.dim;

            return (
              <div key={item.id} style={{
                background: isOpen
                  ? `linear-gradient(135deg, ${C.muted} 0%, ${C.card2} 100%)`
                  : `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`,
                border: `1px solid ${isOpen ? C.accent : C.border}`,
                borderLeft: `3px solid ${isOpen ? C.accent : sigColor}`,
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                boxShadow: isOpen ? `0 4px 32px ${C.accent}25` : `0 2px 12px ${C.border}`,
                transition: 'all 0.2s',
              }}>
                {/* Collapsed row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : item.symbol)}
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
                >
                  {/* Symbol */}
                  <div style={{ flex: '0 0 96px' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{item.symbol}</div>
                    <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.sector || item.asset_type}</div>
                  </div>

                  {/* Sparkline */}
                  <div onClick={e => e.stopPropagation()}>
                    <SparklineChart symbol={item.symbol} />
                  </div>

                  {/* Summary */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                      {sig?.summary
                        ? (isOpen ? sig.summary : sig.summary.slice(0, 110) + '…')
                        : <span style={{ color: C.muted }}>AI analysis in progress…</span>}
                    </div>
                  </div>

                  {/* Direction */}
                  {dir && (
                    <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                      <div style={{ fontSize: 22, color: dir.color, lineHeight: 1, fontWeight: 700 }}>{dir.icon}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 3 }}>{dir.label.toUpperCase()}</div>
                    </div>
                  )}

                  {/* Confidence */}
                  {confidence !== null && (
                    <div style={{ flex: '0 0 100px' }}>
                      <ConfidenceBar value={confidence} />
                    </div>
                  )}

                  <SignalBadge signal={sig?.signal} />

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setChatSymbol(item.symbol)} style={{
                      background: `${C.accent}18`, border: `1px solid ${C.accent}35`,
                      color: C.accent, borderRadius: 7, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
                    }}>◈ Ask AI</button>
                    <button onClick={() => setAlertSymbol(item.symbol)} style={{
                      background: `${C.gold}12`, border: `1px solid ${C.gold}35`,
                      color: C.gold, borderRadius: 7, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700,
                    }}>◎ Alert</button>
                  </div>

                  <div style={{ color: C.dim, fontSize: 11 }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {isOpen && sig && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>SIGNAL BREAKDOWN</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <ScoreBar label="News"   value={Math.round(sig.score_news   || 0)} />
                          <ScoreBar label="Macro"  value={Math.round(sig.score_macro  || 0)} />
                          <ScoreBar label="Sector" value={Math.round(sig.score_sector || 0)} />
                          <ScoreBar label="Quant"  value={Math.round(sig.score_quant  || 0)} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>AI REASONING</div>
                        <div style={{
                          background: C.surface, borderRadius: 10, padding: '12px 14px',
                          fontSize: 10, color: C.dim, lineHeight: 1.8, maxHeight: 130, overflowY: 'auto',
                          border: `1px solid ${C.border}`,
                        }}>
                          {sig.reasoning_chain || 'Detailed reasoning not available.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, fontSize: 10, color: C.dim }}>
                      Last updated: {new Date(sig.created_at || sig.signal_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {chatSymbol && (
        <AIChat symbol={chatSymbol} signal={signals[chatSymbol]?.signal} onClose={() => setChatSymbol(null)} />
      )}
      {alertSymbol && (
        <AlertsPanel symbol={alertSymbol} onClose={() => setAlertSymbol(null)} />
      )}
    </div>
  );
}

// ─── Market Pulse View ────────────────────────────────────────────────────────
function MarketPulseView() {
  const { C } = useTheme();
  const DIR = makeDIR(C);
  const macroEvents = [
    { event: 'US Fed Rate Decision',       impact: 'HIGH', direction: 'HEADWIND', sectors: ['IT', 'NBFC', 'Banks'],         color: C.red,    desc: 'Higher-for-longer rates pressure growth stocks and weaken FII inflows into India.' },
    { event: 'India Budget 2025 — Capex',  impact: 'HIGH', direction: 'TAILWIND', sectors: ['Infra', 'Defence', 'Rail'],     color: C.green,  desc: 'Record capex allocation benefits infrastructure and defence manufacturing.' },
    { event: 'China Solar Dumping',         impact: 'MED',  direction: 'HEADWIND', sectors: ['Renewables', 'Solar EPC'],      color: C.gold,   desc: 'Cheap Chinese modules hurt Indian solar manufacturers but benefit project developers.' },
    { event: 'EV Supply Chain Buildout',    impact: 'HIGH', direction: 'TAILWIND', sectors: ['Lithium', 'EV', 'Battery'],     color: C.green,  desc: 'Global EV adoption accelerates demand for lithium, copper, and Indian component makers.' },
    { event: 'US–China Tensions',           impact: 'MED',  direction: 'TAILWIND', sectors: ['Defence', 'Silver', 'Gold'],    color: C.accent, desc: 'Geopolitical uncertainty drives safe-haven demand. India benefits as China+1 hub.' },
  ];

  const currentQ = Math.floor(new Date().getMonth() / 3);
  const seasons = [
    { q: 'Q1', months: 'Jan – Mar', silver: '↓ Weak demand',    equity: '↑ Budget Rally',   trigger: 'Pre-election spending, oil demand drop' },
    { q: 'Q2', months: 'Apr – Jun', silver: '↑ Industrial pickup', equity: '→ Sideways',      trigger: 'Monsoon uncertainty, earnings season' },
    { q: 'Q3', months: 'Jul – Sep', silver: '↑↑ Peak season',    equity: '↑ FII Inflows',    trigger: 'Safe-haven demand, festive build-up' },
    { q: 'Q4', months: 'Oct – Dec', silver: '→ Consolidation',   equity: '↑ Festive + Capex',trigger: 'US Fed decisions, Q3 results' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.01em' }}>Market Pulse</h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: C.dim }}>Global events and their impact on Indian markets</p>
      </div>

      {/* Macro events */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 16 }}>GLOBAL EVENTS → INDIAN MARKET IMPACT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {macroEvents.map(ev => (
            <div key={ev.event} style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`,
              border: `1px solid ${C.border}`, borderLeft: `3px solid ${ev.color}`,
              borderRadius: 16, padding: '18px 22px',
              boxShadow: `0 2px 16px ${ev.color}08`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ev.event}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
                      border: `1px solid ${ev.color}50`, color: ev.color,
                      background: `${ev.color}12`, letterSpacing: '0.07em',
                    }}>{ev.direction}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7, marginBottom: 12 }}>{ev.desc}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ev.sectors.map(s => (
                      <span key={s} style={{
                        fontSize: 10, color: C.dim, background: C.muted,
                        border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 10px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 900, color: ev.color,
                  border: `1px solid ${ev.color}40`, background: `${ev.color}12`,
                  borderRadius: 7, padding: '6px 12px', letterSpacing: '0.06em', flexShrink: 0,
                }}>{ev.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal calendar */}
      <div>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 16 }}>SEASONAL CALENDAR — RECURRING PATTERNS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {seasons.map((s, i) => {
            const now = i === currentQ;
            return (
              <div key={s.q} style={{
                background: now
                  ? `linear-gradient(160deg, ${C.muted} 0%, ${C.card2} 100%)`
                  : `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`,
                border: `1px solid ${now ? C.accent : C.border}`,
                borderTop: now ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                borderRadius: 16, padding: '18px 20px',
                boxShadow: now ? `0 0 28px ${C.accent}15` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: now ? C.accent : C.dim }}>{s.q}</span>
                  <span style={{ fontSize: 11, color: C.dim }}>{s.months}</span>
                  {now && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, color: C.accent,
                      border: `1px solid ${C.accent}`, borderRadius: 4,
                      padding: '2px 8px', letterSpacing: '0.06em',
                    }}>NOW</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: C.dim }}>Silver  </span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{s.silver}</span>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: C.dim }}>Equity  </span>
                    <span style={{ color: C.text, fontWeight: 600 }}>{s.equity}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{s.trigger}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── How It Works View ────────────────────────────────────────────────────────
function HowItWorksView() {
  const { C } = useTheme();
  const steps = [
    { icon: '🌐', name: 'Web Scout',      color: C.accent,  desc: 'Scans real-time news, earnings, filings, and analyst reports from across the internet for every symbol in your watchlist.' },
    { icon: '🌍', name: 'Macro Lens',     color: C.accent2, desc: 'Reads geopolitical events, policy decisions, and global trade data. Maps them to which Indian sectors get a tailwind or headwind.' },
    { icon: '🏭', name: 'Sector Pulse',   color: C.gold,    desc: 'Understands supply chains. When Apple buys more components, Indian suppliers benefit — before the market notices.' },
    { icon: '📊', name: 'Quant Engine',   color: C.green,   desc: 'Identifies historical seasonal patterns. Silver always peaks in Q3. We know why — and we factor it in.' },
    { icon: '⚡', name: 'Synthesis Core', color: C.accent,  desc: 'Combines all signals into a single confidence-weighted score with a clear verdict: BUY, HOLD, ACCUMULATE, or WATCH.' },
  ];

  const compare = [
    ['', 'Buy/Sell', 'News Feed', 'AI Signals', 'Personalized', 'Explainable'],
    ['Groww / Zerodha', '✅', '❌', '❌', '❌', '❌'],
    ['YouTube Analysts', '❌', '✅', 'Partial', '❌', '❌'],
    ['Tickertape', '❌', '✅', 'Partial', '❌', '❌'],
    ['MarketPulse AI ✦', '❌', '✅', '✅', '✅', '✅'],
  ];

  return (
    <div>
      {/* Thesis */}
      <div style={{
        background: `linear-gradient(135deg, ${C.muted} 0%, ${C.card} 100%)`,
        border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 30px', marginBottom: 36,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}12 0%, transparent 70%)`,
        }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent2}10 0%, transparent 70%)` }} />
        <div style={{ fontSize: 9, color: C.accent, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 14 }}>THE THESIS</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          Groww is the restaurant.<br />
          <span style={{ background: 'linear-gradient(135deg, #7C5CFC, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            We're the Swiggy.
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.8, maxWidth: 560 }}>
          You already have platforms to buy and sell. What's missing is the intelligence layer —
          the same research a 5-person analyst team produces from public internet, now automated,
          personalized, and delivered to your watchlist.
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 22 }}>HOW YOUR SIGNAL IS GENERATED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={step.name} style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52, flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${step.color}25, ${step.color}12)`,
                  border: `2px solid ${step.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, boxShadow: `0 0 16px ${step.color}20`,
                }}>{step.icon}</div>
                {i < steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 28, margin: '3px 0', background: `linear-gradient(to bottom, ${step.color}60, ${C.muted}50)` }} />
                )}
              </div>
              <div style={{ flex: 1, paddingLeft: 20, paddingBottom: i < steps.length - 1 ? 26 : 0, paddingTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{step.name}</div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', marginBottom: 14 }}>HOW WE COMPARE</div>
        <div style={{
          background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden',
        }}>
          {compare.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              padding: '12px 22px',
              background: i === 0
                ? C.surface
                : i === compare.length - 1
                  ? `linear-gradient(135deg, ${C.muted}, ${C.card2})`
                  : 'transparent',
              borderBottom: i < compare.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              {row.map((cell, j) => (
                <div key={j} style={{
                  fontSize: 11,
                  color: i === compare.length - 1 && j === 0 ? C.accent : i === 0 ? C.dim : C.text,
                  fontWeight: i === 0 || (i === compare.length - 1 && j === 0) ? 700 : 400,
                  textAlign: j === 0 ? 'left' : 'center',
                }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
// ─── Portfolio View ───────────────────────────────────────────────────────────
function PortfolioView() {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symbol: '', action: 'BUY', quantity: 1, entry_price: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([api.get('/portfolio'), api.get('/portfolio/summary')]);
      setTrades(t.data.trades || []);
      setSummary(s.data);
    } catch { } finally { setLoading(false); }
  }

  async function addTrade(e) {
    e.preventDefault(); setError('');
    setAdding(true);
    try {
      await api.post('/portfolio', { ...form, quantity: Number(form.quantity), entry_price: Number(form.entry_price) });
      setForm({ symbol: '', action: 'BUY', quantity: 1, entry_price: '', notes: '' });
      await load();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add trade'); }
    finally { setAdding(false); }
  }

  async function closeTrade(id) {
    const price = prompt('Exit price?');
    if (!price) return;
    await api.post(`/portfolio/${id}/close`, { exit_price: Number(price) });
    await load();
  }

  async function deleteTrade(id) {
    await api.delete(`/portfolio/${id}`);
    await load();
  }

  const inputSt = { padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11, fontFamily: 'inherit', outline: 'none' };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: C.text }}>Portfolio Simulator</h2>
        <p style={{ margin: 0, fontSize: 12, color: C.dim }}>Paper-trade on AI signals — track P&L vs Nifty 50</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total P&L', value: summary.total_pnl != null ? `₹${summary.total_pnl >= 0 ? '+' : ''}${summary.total_pnl}` : '—', color: summary.total_pnl >= 0 ? C.green : C.red },
            { label: 'Portfolio Return', value: summary.portfolio_return_pct != null ? `${summary.portfolio_return_pct >= 0 ? '+' : ''}${summary.portfolio_return_pct}%` : '—', color: summary.portfolio_return_pct >= 0 ? C.green : C.red },
            { label: 'Nifty Return', value: summary.nifty_return_pct != null ? `${summary.nifty_return_pct >= 0 ? '+' : ''}${summary.nifty_return_pct}%` : '—', color: C.accent },
            { label: 'Win Rate', value: summary.win_rate != null ? `${summary.win_rate}%` : '—', color: C.gold },
            { label: 'Open Trades', value: summary.open_count ?? 0, color: C.text },
            { label: 'Closed Trades', value: summary.closed_count ?? 0, color: C.dim },
          ].map(s => (
            <div key={s.label} style={{ background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add trade form */}
      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>NEW PAPER TRADE</div>
        <form onSubmit={addTrade} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input style={{ ...inputSt, width: 90 }} placeholder="Symbol" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} required />
          <select style={inputSt} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
            <option value="BUY">BUY</option><option value="SELL">SELL</option>
          </select>
          <input style={{ ...inputSt, width: 80 }} type="number" placeholder="Qty" min="0.01" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
          <input style={{ ...inputSt, width: 100 }} type="number" placeholder="Entry ₹" step="0.01" value={form.entry_price} onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))} required />
          <input style={{ ...inputSt, flex: 1, minWidth: 140 }} placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <button type="submit" disabled={adding} style={{ padding: '9px 22px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: adding ? 0.6 : 1 }}>
            + ADD
          </button>
        </form>
        {error && <div style={{ color: C.red, fontSize: 11, marginTop: 8 }}>{error}</div>}
      </div>

      {/* Trades table */}
      {loading ? (
        <div style={{ color: C.dim, fontSize: 12 }}>Loading trades…</div>
      ) : trades.length === 0 ? (
        <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: C.dim, fontSize: 12 }}>
          No trades yet. Add your first paper trade above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trades.map(t => {
            const pnlColor = t.pnl == null ? C.dim : t.pnl >= 0 ? C.green : C.red;
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${t.status === 'open' ? C.accent : C.dim}`, borderRadius: 12, padding: '14px 18px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 80 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{t.symbol}</div>
                  <div style={{ fontSize: 9, color: t.action === 'BUY' ? C.green : C.red, fontWeight: 700 }}>{t.action}</div>
                </div>
                {t.ai_signal && <span style={{ fontSize: 9, fontWeight: 800, color: SIG[t.ai_signal] || C.dim, background: `${SIG[t.ai_signal] || C.dim}15`, border: `1px solid ${SIG[t.ai_signal] || C.dim}40`, borderRadius: 4, padding: '2px 8px' }}>{t.ai_signal}</span>}
                <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: 9, color: C.dim }}>ENTRY</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>₹{t.entry_price}</div></div>
                  <div><div style={{ fontSize: 9, color: C.dim }}>CURRENT</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>₹{t.current_price ?? '—'}</div></div>
                  <div><div style={{ fontSize: 9, color: C.dim }}>QTY</div><div style={{ fontSize: 12, color: C.text }}>{t.quantity}</div></div>
                  <div><div style={{ fontSize: 9, color: C.dim }}>P&L</div><div style={{ fontSize: 14, fontWeight: 900, color: pnlColor }}>{t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl}` : '—'}</div></div>
                  {t.pnl_pct != null && <div><div style={{ fontSize: 9, color: C.dim }}>RETURN</div><div style={{ fontSize: 12, fontWeight: 700, color: pnlColor }}>{t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%</div></div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 5, background: t.status === 'open' ? `${C.green}18` : `${C.dim}15`, color: t.status === 'open' ? C.green : C.dim, border: `1px solid ${t.status === 'open' ? C.green : C.dim}30`, fontWeight: 700 }}>{t.status.toUpperCase()}</span>
                  {t.status === 'open' && <button onClick={() => closeTrade(t.id)} style={{ fontSize: 10, padding: '3px 10px', background: `${C.gold}18`, border: `1px solid ${C.gold}40`, color: C.gold, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}>CLOSE</button>}
                  <button onClick={() => deleteTrade(t.id)} style={{ fontSize: 10, padding: '3px 10px', background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Accuracy View ────────────────────────────────────────────────────────────
function AccuracyView() {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [summary, setSummary] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/signal/accuracy/summary?days=14')
      .then(r => setSummary(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadDetail(sym) {
    if (!sym) return;
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/signal/${sym}/accuracy?days=14`);
      setDetail(data);
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  }

  const outcomeColor = (o) => o === 'correct' ? C.green : o === 'incorrect' ? C.red : C.dim;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: C.text }}>Signal Accuracy</h2>
        <p style={{ margin: 0, fontSize: 12, color: C.dim }}>Did last month's signals actually play out? Checked 14 days after each signal.</p>
      </div>

      {/* Overall summary */}
      {loading ? <div style={{ color: C.dim, fontSize: 12 }}>Calculating accuracy…</div> : summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.accent}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>OVERALL ACCURACY</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: summary.accuracy_pct >= 60 ? C.green : summary.accuracy_pct >= 40 ? C.gold : C.red }}>{summary.accuracy_pct != null ? `${summary.accuracy_pct}%` : '—'}</div>
          </div>
          <div style={{ background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>SIGNALS EVALUATED</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.text }}>{summary.evaluated}</div>
          </div>
          <div style={{ background: `linear-gradient(160deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 8 }}>CORRECT CALLS</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.green }}>{summary.correct}</div>
          </div>
        </div>
      )}

      {/* By signal type */}
      {summary?.by_signal && Object.keys(summary.by_signal).length > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>ACCURACY BY SIGNAL TYPE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(summary.by_signal).map(([sig, stat]) => {
              const color = SIG[sig] || C.dim;
              return (
                <div key={sig} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 90, fontSize: 11, fontWeight: 800, color }}>{sig}</span>
                  <div style={{ flex: 1, height: 6, background: C.muted, borderRadius: 6 }}>
                    <div style={{ height: 6, width: `${stat.accuracy_pct}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 6, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color, width: 48, textAlign: 'right' }}>{stat.accuracy_pct}%</span>
                  <span style={{ fontSize: 10, color: C.dim, width: 60 }}>{stat.correct}/{stat.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-symbol drill-down */}
      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>DRILL DOWN BY SYMBOL</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="RELIANCE, SUZLON…"
            style={{ flex: 1, padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => loadDetail(symbol)} disabled={!symbol || detailLoading}
            style={{ padding: '9px 20px', background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: !symbol ? 0.5 : 1 }}>
            CHECK
          </button>
        </div>
        {detailLoading && <div style={{ color: C.dim, fontSize: 12 }}>Loading…</div>}
        {detail && !detailLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{detail.symbol} — {detail.accuracy_pct != null ? `${detail.accuracy_pct}% accurate` : 'Pending data'}</div>
            {detail.records.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', background: C.muted, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${outcomeColor(r.outcome)}` }}>
                <span style={{ fontSize: 10, color: C.dim, width: 90 }}>{r.date.slice(0, 10)}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: SIG[r.signal] || C.dim, width: 80 }}>{r.signal}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: outcomeColor(r.outcome), width: 70 }}>{r.outcome.toUpperCase()}</span>
                {r.price_change_pct != null && <span style={{ fontSize: 11, color: r.price_change_pct >= 0 ? C.green : C.red }}>{r.price_change_pct >= 0 ? '+' : ''}{r.price_change_pct}%</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Earnings View ────────────────────────────────────────────────────────────
function EarningsView() {
  const { C } = useTheme();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/earnings')
      .then(r => setEarnings(r.data.earnings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = earnings.filter(e => e.next_earnings && e.next_earnings >= today);
  const unknown = earnings.filter(e => !e.next_earnings);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: C.text }}>Earnings Calendar</h2>
        <p style={{ margin: 0, fontSize: 12, color: C.dim }}>Upcoming results for your tracked symbols — sourced from yfinance</p>
      </div>

      {loading ? <div style={{ color: C.dim, fontSize: 12 }}>Loading earnings data…</div> : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>UPCOMING RESULTS ({upcoming.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(e => {
                  const daysAway = Math.round((new Date(e.next_earnings) - new Date(today)) / 86400000);
                  const urgency = daysAway <= 7 ? C.red : daysAway <= 30 ? C.gold : C.green;
                  return (
                    <div key={e.symbol} style={{ display: 'flex', alignItems: 'center', gap: 18, background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${urgency}`, borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{e.symbol}</div>
                        <div style={{ fontSize: 10, color: C.dim }}>{e.sector || '—'}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{e.next_earnings}</div>
                        <div style={{ fontSize: 10, color: C.dim }}>{e.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: urgency }}>{daysAway === 0 ? 'TODAY' : `${daysAway}d away`}</div>
                        {e.eps_estimate != null && <div style={{ fontSize: 10, color: C.dim }}>EPS est: ₹{e.eps_estimate}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unknown.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>DATE UNAVAILABLE ({unknown.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {unknown.map(e => (
                  <div key={e.symbol} style={{ background: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 11, color: C.dim }}>
                    {e.symbol}
                  </div>
                ))}
              </div>
            </div>
          )}

          {earnings.length === 0 && (
            <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: C.dim, fontSize: 12 }}>
              Add symbols to your watchlist to see their earnings calendar.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Alerts View ──────────────────────────────────────────────────────────────
function AlertsView() {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [alerts, setAlerts] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ symbol: '', condition: 'signal_changes_to', value: 'BUY' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const CONDITIONS = [
    { value: 'signal_changes_to', label: 'Signal changes to' },
    { value: 'confidence_above', label: 'Confidence above' },
    { value: 'confidence_below', label: 'Confidence below' },
  ];
  const SIGNALS = ['BUY', 'ACCUMULATE', 'HOLD', 'WATCH', 'AVOID'];

  useEffect(() => {
    Promise.all([api.get('/alerts'), api.get('/watchlist')])
      .then(([a, w]) => {
        setAlerts(a.data.alerts || []);
        setWatchlist((w.data.items || []).map(i => i.symbol));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createAlert(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/alerts', form);
      const { data } = await api.get('/alerts');
      setAlerts(data.alerts || []);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create alert'); }
    finally { setSaving(false); }
  }

  async function deleteAlert(id) {
    await api.delete(`/alerts/${id}`);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const inputSt = { padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 11, fontFamily: 'inherit', outline: 'none' };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: C.text }}>Alert Manager</h2>
        <p style={{ margin: 0, fontSize: 12, color: C.dim }}>Get notified when signals change. Engine checks every hour automatically.</p>
      </div>

      {/* Create alert */}
      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>NEW ALERT</div>
        <form onSubmit={createAlert} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <select style={inputSt} value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} required>
            <option value="">Select symbol…</option>
            {watchlist.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={inputSt} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {form.condition === 'signal_changes_to' ? (
            <select style={inputSt} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}>
              {SIGNALS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input style={{ ...inputSt, width: 80 }} type="number" placeholder="0.75" step="0.01" min="0" max="1" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
          )}
          <button type="submit" disabled={saving || !form.symbol}
            style={{ padding: '9px 22px', background: `linear-gradient(135deg, ${C.gold}, #F97316)`, border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 11, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
            + SET ALERT
          </button>
        </form>
        {error && <div style={{ color: C.red, fontSize: 11, marginTop: 8 }}>{error}</div>}
      </div>

      {/* Alerts list */}
      <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>ACTIVE ALERTS ({alerts.length})</div>
      {loading ? <div style={{ color: C.dim, fontSize: 12 }}>Loading…</div> : alerts.length === 0 ? (
        <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: C.dim, fontSize: 12 }}>
          No alerts set. Create one above to start monitoring your signals.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(a => {
            const sigColor = SIG[a.value] || C.accent;
            const condLabel = CONDITIONS.find(c => c.value === a.condition)?.label || a.condition;
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: `linear-gradient(135deg, ${C.card} 0%, ${C.surface} 100%)`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sigColor}`, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ minWidth: 80, fontSize: 14, fontWeight: 900, color: C.text }}>{a.symbol}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.dim }}>{condLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: sigColor }}>{a.value}</div>
                </div>
                {a.last_triggered && (
                  <div style={{ fontSize: 10, color: C.dim }}>Last fired: {new Date(a.last_triggered).toLocaleDateString('en-IN')}</div>
                )}
                <span style={{ fontSize: 9, padding: '3px 9px', borderRadius: 5, background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}30`, fontWeight: 700 }}>ACTIVE</span>
                <button onClick={() => deleteAlert(a.id)} style={{ fontSize: 11, padding: '4px 12px', background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MarketPulseApp({ user, onLogout }) {
  const { C } = useTheme();
  const [tab, setTab] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: C.bg, minHeight: '100vh', color: C.text,
      fontFamily: "'DM Mono', 'Fira Code', 'Consolas', monospace",
      display: 'flex',
    }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, marginLeft: 230, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        <TopBar time={time} />
        <main style={{ flex: 1, padding: '32px 36px 60px' }}>
          {tab === 0 && <DashboardView user={user} onNavigate={setTab} />}
          {tab === 1 && <WatchlistView />}
          {tab === 2 && <MarketPulseView />}
          {tab === 3 && <PortfolioView />}
          {tab === 4 && <AccuracyView />}
          {tab === 5 && <EarningsView />}
          {tab === 6 && <AlertsView />}
          {tab === 7 && <HowItWorksView />}
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.dim}; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}
