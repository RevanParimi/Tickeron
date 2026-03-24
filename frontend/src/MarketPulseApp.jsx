import { useState, useEffect, useRef } from 'react';
import api from './api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#06080F', surface: '#0B0F1A', card: '#0F1520', card2: '#121A28',
  border: '#192338', accent: '#00D4FF', gold: '#F0B429',
  green: '#00E87A', red: '#FF3D5A', purple: '#7B61FF',
  text: '#DDE8F5', dim: '#6A88A8', muted: '#2E4560',
};

const SIG = { BUY: C.green, ACCUMULATE: C.accent, HOLD: C.gold, WATCH: C.purple, AVOID: C.red };
const DIR = {
  BULLISH: { icon: '↑', color: C.green, label: 'Bullish' },
  BEARISH: { icon: '↓', color: C.red, label: 'Bearish' },
  NEUTRAL: { icon: '→', color: C.gold, label: 'Neutral' },
};

// ─── Shared Components ────────────────────────────────────────────────────────
function SignalBadge({ signal }) {
  const color = SIG[signal] || C.dim;
  return (
    <span style={{
      display: 'inline-block',
      background: `${color}18`, border: `1px solid ${color}`,
      color, fontSize: 10, fontWeight: 800, padding: '3px 12px',
      borderRadius: 20, letterSpacing: '0.08em',
      boxShadow: signal ? `0 0 10px ${color}30` : 'none',
      whiteSpace: 'nowrap',
    }}>
      {signal || 'PENDING'}
    </span>
  );
}

function ConfidenceBar({ value, showLabel = true }) {
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
        <div style={{ height: 3, width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value }) {
  const color = value >= 70 ? C.green : value >= 50 ? C.gold : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 10, color: C.dim, width: 50, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: C.muted, borderRadius: 4 }}>
        <div style={{ height: 4, width: `${value}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, width: 26, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ user, onNavigate }) {
  const [watchlist, setWatchlist] = useState([]);
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/watchlist').then(({ data }) => {
      const items = data.items || data;
      setWatchlist(items);
      // Signal data is already embedded in each item
      const sigMap = {};
      items.forEach(item => {
        if (item.signal) sigMap[item.symbol] = item;
      });
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

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: C.dim }}>
          Your AI research team has been working. Here's what they found.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Symbols Tracked', value: watchlist.length, color: C.accent, icon: '◉' },
          { label: 'Signals Ready', value: ready, color: C.green, icon: '◈' },
          { label: 'Pending Analysis', value: Math.max(0, watchlist.length - ready), color: C.gold, icon: '◎' },
        ].map(s => (
          <div key={s.label} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: '20px 22px',
          }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 10 }}>{s.label.toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 18, color: s.color, paddingBottom: 4 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Signal distribution */}
      {Object.keys(signalCounts).length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px', marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>SIGNAL DISTRIBUTION</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(signalCounts).map(([sig, count]) => (
              <div key={sig} style={{
                background: `${SIG[sig] || C.dim}12`, border: `1px solid ${SIG[sig] || C.dim}40`,
                borderRadius: 12, padding: '14px 20px', textAlign: 'center', minWidth: 80,
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: SIG[sig] || C.dim, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 9, color: SIG[sig] || C.dim, marginTop: 5, letterSpacing: '0.08em' }}>{sig}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.dim, fontSize: 12 }}>
          Fetching your portfolio...
        </div>
      ) : watchlist.length === 0 ? (
        <div style={{
          background: C.card, border: `2px dashed ${C.border}`, borderRadius: 16,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📈</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Start tracking markets</div>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 20, lineHeight: 1.6 }}>
            Add symbols to your watchlist and our AI will generate<br />trend signals within minutes.
          </div>
          <button onClick={() => onNavigate(1)} style={{
            padding: '10px 24px', background: C.accent, border: 'none', borderRadius: 8,
            color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em',
          }}>
            GO TO WATCHLIST →
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>YOUR SIGNALS AT A GLANCE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {watchlist.map(item => {
              const sig = signals[item.symbol];
              const dir = sig?.direction ? DIR[sig.direction] : null;
              const confidence = sig ? Math.round((sig.confidence || 0.5) * 100) : null;
              return (
                <div key={item.id} style={{
                  background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: '0 0 90px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{item.symbol}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.sector || item.asset_type}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
                    {sig?.summary ? sig.summary.slice(0, 100) + '…' : 'Analysis running…'}
                  </div>
                  {dir && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, color: dir.color, lineHeight: 1 }}>{dir.icon}</div>
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
  const [watchlist, setWatchlist] = useState([]);
  const [signals, setSignals] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/watchlist');
      const items = data.items || data;
      setWatchlist(items);
      const sigMap = {};
      items.forEach(item => { if (item.signal) sigMap[item.symbol] = item; });
      setSignals(sigMap);
      pendingRef.current = items.some(item => !item.signal);
    } finally { setLoading(false); }
  }

  const pendingRef = useRef(false);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (pendingRef.current) load();
    }, 15000);
    return () => clearInterval(interval);
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

  return (
    <div>
      {/* Add form */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px', marginBottom: 28 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>TRACK A NEW SYMBOL</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol — e.g. RELIANCE, SUZLON" required
            style={{ flex: '2 1 200px', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
          <input value={sector} onChange={e => setSector(e.target.value)} placeholder="Sector (optional)"
            style={{ flex: '1 1 140px', padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
          <button type="submit" disabled={adding} style={{
            padding: '10px 22px', background: C.accent, border: 'none', borderRadius: 8,
            color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.07em', opacity: adding ? 0.6 : 1,
          }}>{adding ? 'ADDING…' : '+ TRACK'}</button>
        </form>
        {addError && <div style={{ color: C.red, fontSize: 11, marginTop: 8 }}>{addError}</div>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.dim, fontSize: 12 }}>Loading watchlist…</div>
      ) : watchlist.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Nothing tracked yet</div>
          <div style={{ color: C.dim, fontSize: 12 }}>Add a symbol above to start receiving AI trend signals.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {watchlist.map(item => {
            const sig = signals[item.symbol];
            const isOpen = expanded === item.symbol;
            const confidence = sig ? Math.round((sig.confidence || 0.5) * 100) : null;
            const dir = sig?.direction ? DIR[sig.direction] : null;
            return (
              <div key={item.id}
                onClick={() => setExpanded(isOpen ? null : item.symbol)}
                style={{
                  background: C.card, border: `1px solid ${isOpen ? C.accent : C.border}`,
                  borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                  boxShadow: isOpen ? `0 0 24px ${C.accent}18` : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Collapsed row */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 90px' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{item.symbol}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.sector || item.asset_type}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
                      {sig?.summary ? (isOpen ? sig.summary : sig.summary.slice(0, 110) + '…') : <span style={{ color: C.muted }}>AI analysis in progress…</span>}
                    </div>
                  </div>
                  {dir && (
                    <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                      <div style={{ fontSize: 22, color: dir.color, lineHeight: 1, fontWeight: 700 }}>{dir.icon}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 3 }}>{dir.label.toUpperCase()}</div>
                    </div>
                  )}
                  {confidence !== null && (
                    <div style={{ flex: '0 0 100px' }}>
                      <ConfidenceBar value={confidence} />
                    </div>
                  )}
                  <SignalBadge signal={sig?.signal} />
                  <div style={{ color: C.muted, fontSize: 11 }}>{isOpen ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {isOpen && sig && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>SIGNAL BREAKDOWN</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <ScoreBar label="News" value={Math.round(sig.score_news || 0)} />
                          <ScoreBar label="Macro" value={Math.round(sig.score_macro || 0)} />
                          <ScoreBar label="Sector" value={Math.round(sig.score_sector || 0)} />
                          <ScoreBar label="Quant" value={Math.round(sig.score_quant || 0)} />
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
                    <div style={{ marginTop: 14, fontSize: 10, color: C.muted }}>
                      Last updated: {new Date(sig.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 20, padding: '10px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 10 }}>
        Signals are AI-generated trend estimates from public data only. Not SEBI-registered investment advice.
      </div>
    </div>
  );
}

// ─── Market Pulse View ────────────────────────────────────────────────────────
function MarketPulseView() {
  const macroEvents = [
    { event: 'US Fed Rate Decision', impact: 'HIGH', direction: 'HEADWIND', sectors: ['IT', 'NBFC', 'Banks'], color: C.red, desc: 'Higher-for-longer rates pressure growth stocks and weaken FII inflows into India.' },
    { event: 'India Budget 2025 — Capex Push', impact: 'HIGH', direction: 'TAILWIND', sectors: ['Infra', 'Defence', 'Rail'], color: C.green, desc: 'Record capex allocation benefits infrastructure and defence manufacturing.' },
    { event: 'China Solar Dumping', impact: 'MED', direction: 'HEADWIND', sectors: ['Renewables', 'Solar EPC'], color: C.gold, desc: 'Cheap Chinese modules hurt Indian solar manufacturers but benefit project developers.' },
    { event: 'EV Supply Chain Buildout', impact: 'HIGH', direction: 'TAILWIND', sectors: ['Lithium', 'EV', 'Battery'], color: C.green, desc: 'Global EV adoption accelerates demand for lithium, copper, and Indian component makers.' },
    { event: 'US–China Tensions', impact: 'MED', direction: 'TAILWIND', sectors: ['Defence', 'Silver', 'Gold'], color: C.accent, desc: 'Geopolitical uncertainty drives safe-haven demand. India benefits as China+1 hub.' },
  ];

  const currentQ = Math.floor(new Date().getMonth() / 3);
  const seasons = [
    { q: 'Q1', months: 'Jan – Mar', silver: '↓ Weak demand', equity: '↑ Budget Rally', trigger: 'Pre-election spending, oil demand drop' },
    { q: 'Q2', months: 'Apr – Jun', silver: '↑ Industrial pickup', equity: '→ Sideways', trigger: 'Monsoon uncertainty, earnings season' },
    { q: 'Q3', months: 'Jul – Sep', silver: '↑↑ Peak season', equity: '↑ FII Inflows', trigger: 'Safe-haven demand, festive build-up' },
    { q: 'Q4', months: 'Oct – Dec', silver: '→ Consolidation', equity: '↑ Festive + Capex', trigger: 'US Fed decisions, Q3 results' },
  ];

  return (
    <div>
      {/* Macro signals */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>GLOBAL EVENTS → INDIAN MARKET IMPACT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {macroEvents.map(ev => (
            <div key={ev.event} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ev.event}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 9px', borderRadius: 4,
                      border: `1px solid ${ev.color}`, color: ev.color, letterSpacing: '0.07em',
                    }}>{ev.direction}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6, marginBottom: 10 }}>{ev.desc}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ev.sectors.map(s => (
                      <span key={s} style={{
                        fontSize: 10, color: C.dim, background: C.surface,
                        border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 9px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: ev.color,
                  border: `1px solid ${ev.color}`, borderRadius: 7,
                  padding: '5px 10px', letterSpacing: '0.06em', flexShrink: 0,
                }}>{ev.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal calendar */}
      <div>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>SEASONAL CALENDAR — RECURRING MARKET PATTERNS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {seasons.map((s, i) => {
            const now = i === currentQ;
            return (
              <div key={s.q} style={{
                background: now ? '#091624' : C.card, border: `1px solid ${now ? C.accent : C.border}`,
                borderRadius: 16, padding: '18px 20px',
                boxShadow: now ? `0 0 24px ${C.accent}20` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: now ? C.accent : C.dim }}>{s.q}</span>
                  <span style={{ fontSize: 11, color: C.dim }}>{s.months}</span>
                  {now && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 9, color: C.accent,
                      border: `1px solid ${C.accent}`, borderRadius: 4, padding: '1px 7px', letterSpacing: '0.06em',
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
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{s.trigger}</div>
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
  const steps = [
    { icon: '🌐', name: 'Web Scout', color: C.accent, desc: 'Scans real-time news, earnings, filings, and analyst reports from across the internet for every symbol in your watchlist.' },
    { icon: '🌍', name: 'Macro Lens', color: C.purple, desc: 'Reads geopolitical events, policy decisions, and global trade data. Maps them to which Indian sectors get a tailwind or headwind.' },
    { icon: '🏭', name: 'Sector Pulse', color: C.gold, desc: 'Understands supply chains. When Apple buys more components, Indian suppliers benefit — before the market notices.' },
    { icon: '📊', name: 'Quant Engine', color: C.green, desc: 'Identifies historical seasonal patterns. Silver always peaks in Q3. We know why — and we factor it in.' },
    { icon: '⚡', name: 'Synthesis Core', color: C.accent, desc: 'Combines all signals into a single confidence-weighted score with a clear verdict: BUY, HOLD, ACCUMULATE, or WATCH.' },
  ];

  const compare = [
    ['', 'Buy / Sell', 'News Feed', 'AI Signals', 'Personalized', 'Explainable'],
    ['Groww / Zerodha', '✅', '❌', '❌', '❌', '❌'],
    ['YouTube Analysts', '❌', '✅', 'Partial', '❌', '❌'],
    ['Tickertape', '❌', '✅', 'Partial', '❌', '❌'],
    ['MarketPulse AI ✦', '❌', '✅', '✅', '✅', '✅'],
  ];

  return (
    <div>
      {/* Thesis */}
      <div style={{
        background: 'linear-gradient(135deg, #091624 0%, #0D2033 100%)',
        border: `1px solid ${C.border}`, borderRadius: 18, padding: '30px 28px', marginBottom: 36,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`,
        }} />
        <div style={{ fontSize: 9, color: C.accent, letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>THE THESIS</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.3, marginBottom: 14 }}>
          Groww is the restaurant.<br />
          <span style={{ color: C.accent }}>We're the Swiggy.</span>
        </div>
        <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.8, maxWidth: 600 }}>
          You already have platforms to buy and sell. What's missing is the intelligence layer —
          the same research a 5-person analyst team produces from public internet, now automated,
          personalized, and delivered to your watchlist.
        </div>
      </div>

      {/* AI Pipeline */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 20 }}>HOW YOUR SIGNAL IS GENERATED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={step.name} style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: C.card,
                  border: `2px solid ${step.color}`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  boxShadow: `0 0 12px ${step.color}30`,
                }}>{step.icon}</div>
                {i < steps.length - 1 && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 28, margin: '3px 0',
                    background: `linear-gradient(to bottom, ${step.color}80, ${C.muted}40)`,
                  }} />
                )}
              </div>
              <div style={{ flex: 1, paddingLeft: 18, paddingBottom: i < steps.length - 1 ? 24 : 0, paddingTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>{step.name}</div>
                <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 14 }}>HOW WE COMPARE</div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {compare.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              padding: '11px 20px',
              background: i === 0 ? C.surface : i === compare.length - 1 ? '#091624' : 'transparent',
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
const TICKERS = [
  { label: 'NIFTY 50', val: '23,847', chg: '+0.34%', up: true },
  { label: 'SENSEX', val: '78,542', chg: '+0.28%', up: true },
  { label: 'SILVER', val: '$87.2', chg: '+0.6%', up: true },
  { label: 'GOLD', val: '₹72,450', chg: '+0.2%', up: true },
  { label: 'USD/INR', val: '83.42', chg: '-0.1%', up: false },
];

const TABS = [
  { label: 'Dashboard', icon: '◈' },
  { label: 'Watchlist', icon: '◉' },
  { label: 'Market Pulse', icon: '◎' },
  { label: 'How It Works', icon: '◇' },
];

export default function MarketPulseApp({ user, onLogout }) {
  const [tab, setTab] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const views = [
    <DashboardView user={user} onNavigate={setTab} />,
    <WatchlistView />,
    <MarketPulseView />,
    <HowItWorksView />,
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: "'DM Mono', 'Fira Code', 'Consolas', monospace" }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: `${C.bg}EE`, backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Top bar */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, #0080AA)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#000',
            }}>M</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.03em' }}>MarketPulse</div>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em' }}>AI TREND INTELLIGENCE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
              <span style={{ fontSize: 10, color: C.dim }}>
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
              </span>
            </div>
            {user && <span style={{ fontSize: 11, color: C.dim }}>{user.name}</span>}
            <button onClick={onLogout} style={{
              background: 'none', border: `1px solid ${C.border}`, color: C.dim,
              fontSize: 9, padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.07em', transition: 'border-color 0.2s',
            }}>LOGOUT</button>
          </div>
        </div>

        {/* Ticker strip */}
        <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '7px 28px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 36 }}>
            {TICKERS.map(t => (
              <div key={t.label} style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 9, color: C.dim, letterSpacing: '0.05em' }}>{t.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.val}</span>
                <span style={{ fontSize: 10, color: t.up ? C.green : C.red }}>{t.chg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ borderTop: `1px solid ${C.border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', display: 'flex', gap: 0 }}>
            {TABS.map((t, i) => (
              <button key={t.label} onClick={() => setTab(i)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '13px 20px', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.07em', whiteSpace: 'nowrap',
                color: tab === i ? C.accent : C.dim,
                borderBottom: tab === i ? `2px solid ${C.accent}` : '2px solid transparent',
                fontFamily: 'inherit', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <span>{t.icon}</span>
                {t.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 80px' }}>
        {views[tab]}
      </div>
    </div>
  );
}
