import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { useTheme, makeSIG } from '../theme';

const SUGGESTIONS = [
  'Why this rating?',
  'What are the key risks?',
  'What would change your view?',
  'How does the sector look?',
];

export default function AIChat({ symbol, signal, onClose }) {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I'm your AI analyst for **${symbol}**. Current signal: **${signal || 'PENDING'}**.\n\nAsk me anything — why this rating, key risks, sector outlook, or what would change my view.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post(`/chat/${symbol}`, { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  const sigColor = SIG[signal] || C.accent;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#00000070', display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440, height: '100vh', background: C.card,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-12px 0 60px #00000060',
          animation: 'slideIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px',
          background: `linear-gradient(135deg, ${C.muted} 0%, ${C.card} 100%)`,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${sigColor}30, ${sigColor}15)`,
                  border: `1px solid ${sigColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>◈</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{symbol}</div>
                  <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.08em' }}>AI ANALYST CHAT</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {signal && (
                <span style={{
                  fontSize: 10, fontWeight: 800, color: sigColor,
                  border: `1px solid ${sigColor}50`, borderRadius: 6,
                  padding: '3px 10px', letterSpacing: '0.07em',
                  background: `${sigColor}12`,
                }}>{signal}</span>
              )}
              <button onClick={onClose} style={{
                background: 'none', border: `1px solid ${C.border}`, color: C.dim,
                cursor: 'pointer', fontSize: 16, padding: '4px 10px', borderRadius: 6,
                fontFamily: 'inherit',
              }}>×</button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.accent}30, ${C.purple}20)`,
                  border: `1px solid ${C.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, marginRight: 8, marginTop: 2,
                }}>◈</div>
              )}
              <div style={{
                maxWidth: '80%',
                background: m.role === 'user'
                  ? `linear-gradient(135deg, ${C.accent}22, ${C.accent}12)`
                  : `linear-gradient(135deg, ${C.card2} 0%, ${C.surface} 100%)`,
                border: `1px solid ${m.role === 'user' ? C.accent + '35' : C.border}`,
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                padding: '10px 14px',
                fontSize: 12, color: C.text, lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: `linear-gradient(135deg, ${C.accent}30, ${C.purple}20)`,
                border: `1px solid ${C.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>◈</div>
              <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: C.card2, borderRadius: '4px 14px 14px 14px', border: `1px solid ${C.border}` }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: C.accent,
                    opacity: 0.6,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 22px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
                color: C.dim, fontSize: 10, padding: '5px 14px', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s',
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); send(); }} style={{
          padding: '14px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
          background: `linear-gradient(0deg, ${C.surface} 0%, transparent 100%)`,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about risks, outlook, why this signal..."
              style={{
                flex: 1, padding: '11px 16px', background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                color: C.text, fontSize: 12, fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              padding: '11px 18px', borderRadius: 10,
              background: loading || !input.trim() ? C.muted : `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              border: 'none', color: loading || !input.trim() ? C.dim : '#fff',
              fontWeight: 800, fontSize: 16, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}>↑</button>
          </div>
        </form>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
