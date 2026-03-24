import { useState, useEffect } from 'react';
import api from '../api';
import { useTheme, makeSIG } from '../theme';

const CONDITIONS = [
  { value: 'signal_changes_to', label: 'Signal changes to' },
  { value: 'confidence_above', label: 'Confidence above' },
  { value: 'confidence_below', label: 'Confidence below' },
];
const SIGNALS = ['BUY', 'ACCUMULATE', 'HOLD', 'WATCH', 'AVOID'];

export default function AlertsPanel({ symbol, onClose }) {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [alerts, setAlerts] = useState([]);
  const [condition, setCondition] = useState('signal_changes_to');
  const [value, setValue] = useState('BUY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadAlerts(); }, [symbol]);

  async function loadAlerts() {
    try {
      const { data } = await api.get('/alerts');
      setAlerts((data.alerts || []).filter(a => a.symbol === symbol));
    } catch {}
  }

  async function createAlert(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/alerts', { symbol, condition, value });
      await loadAlerts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create alert');
    } finally { setSaving(false); }
  }

  async function deleteAlert(id) {
    try {
      await api.delete(`/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {}
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#00000070', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 80px #00000080',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '22px 26px 20px',
          background: `linear-gradient(135deg, ${C.muted} 0%, ${C.card} 100%)`,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${C.gold}20`, border: `1px solid ${C.gold}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>◎</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Signal Alerts</div>
                <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.07em' }}>{symbol}</div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${C.border}`, color: C.dim,
            cursor: 'pointer', fontSize: 16, padding: '4px 10px', borderRadius: 6, fontFamily: 'inherit',
          }}>×</button>
        </div>

        <div style={{ padding: '22px 26px' }}>
          {/* Create form */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 12 }}>NEW ALERT</div>
            <form onSubmit={createAlert}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={condition} onChange={e => setCondition(e.target.value)}
                  style={{
                    flex: '2 1 180px', padding: '10px 12px', background: C.surface,
                    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
                    fontSize: 11, fontFamily: 'inherit', outline: 'none',
                  }}
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                {condition === 'signal_changes_to' ? (
                  <select
                    value={value} onChange={e => setValue(e.target.value)}
                    style={{
                      flex: '1 1 110px', padding: '10px 12px', background: C.surface,
                      border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
                      fontSize: 11, fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    {SIGNALS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    value={value} onChange={e => setValue(e.target.value)}
                    placeholder="e.g. 0.75"
                    style={{
                      flex: '1 1 80px', padding: '10px 12px', background: C.surface,
                      border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
                      fontSize: 11, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                )}

                <button type="submit" disabled={saving} style={{
                  padding: '10px 20px', background: `linear-gradient(135deg, ${C.gold}, #F97316)`,
                  border: 'none', borderRadius: 8, color: '#000',
                  fontSize: 11, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: saving ? 0.6 : 1, whiteSpace: 'nowrap',
                }}>+ SET</button>
              </div>
              {error && <div style={{ color: C.red, fontSize: 11, marginTop: 8 }}>{error}</div>}
            </form>
          </div>

          {/* Active alerts */}
          <div>
            <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 12 }}>
              ACTIVE ALERTS ({alerts.length})
            </div>
            {alerts.length === 0 ? (
              <div style={{
                background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 12,
                padding: '24px', textAlign: 'center', color: C.dim, fontSize: 12,
              }}>
                No alerts set. Create one above to get notified.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.map(a => {
                  const sigColor = SIG[a.value] || C.accent;
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: `linear-gradient(135deg, ${C.surface} 0%, ${C.card2}60 100%)`,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${sigColor}`,
                      borderRadius: 10, padding: '11px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>◎</span>
                        <div>
                          <div style={{ fontSize: 11, color: C.dim }}>
                            {CONDITIONS.find(c => c.value === a.condition)?.label || a.condition}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: sigColor, marginTop: 1 }}>{a.value}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {a.last_triggered && (
                          <span style={{ fontSize: 9, color: C.dim }}>
                            Last: {new Date(a.last_triggered).toLocaleDateString('en-IN')}
                          </span>
                        )}
                        <button onClick={() => deleteAlert(a.id)} style={{
                          background: `${C.red}15`, border: `1px solid ${C.red}30`,
                          color: C.red, cursor: 'pointer', fontSize: 12,
                          padding: '4px 10px', borderRadius: 6, fontFamily: 'inherit',
                        }}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
