import { useState } from 'react';
import api from './api';
import { useTheme } from './theme';

export default function AuthPage({ onAuth }) {
  const { C, isDark, toggle } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        console.log('[auth] registering', email);
        const { data } = await api.post('/auth/register', { email, password, name });
        console.log('[auth] register response', data);
        localStorage.setItem('mp_token', data.access_token);
        localStorage.setItem('mp_user', JSON.stringify({ id: data.user_id, email: data.email, name: data.name }));
        onAuth(data);
      } else {
        console.log('[auth] logging in', email);
        const form = new URLSearchParams();
        form.append('username', email);
        form.append('password', password);
        console.log('[auth] form payload', form.toString());
        const { data } = await api.post('/auth/login', form, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('[auth] login response', data);
        localStorage.setItem('mp_token', data.access_token);
        localStorage.setItem('mp_user', JSON.stringify({ id: data.user_id, email: data.email, name: data.name }));
        onAuth(data);
      }
    } catch (err) {
      console.error('[auth] error', err.response?.status, err.response?.data, err.message);
      setError(err.response?.data?.detail || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontSize: 13, outline: 'none',
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      transition: 'background 0.25s',
    }}>
      {/* Theme toggle — top right */}
      <div style={{ position: 'fixed', top: 20, right: 24 }}>
        <ThemeToggle C={C} isDark={isDark} toggle={toggle} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff',
          }}>M</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '0.04em' }}>MarketPulse</div>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.1em', marginTop: 2 }}>AI TREND INTELLIGENCE</div>
        </div>

        {/* Card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '28px 24px',
          boxShadow: isDark ? `0 8px 40px #00000060` : `0 8px 40px ${C.accent}12`,
        }}>
          {/* Toggle */}
          <div style={{ display: 'flex', marginBottom: 24, background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'inherit',
                background: mode === m ? C.accent : 'transparent',
                color: mode === m ? '#fff' : C.dim,
                transition: 'all 0.2s',
              }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: '0.06em' }}>NAME</div>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                  placeholder="Revan" required />
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: '0.06em' }}>EMAIL</div>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 6, letterSpacing: '0.06em' }}>PASSWORD</div>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ color: C.red, fontSize: 11, padding: '8px 12px', background: `${C.red}18`, borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '11px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              color: '#fff', fontSize: 12, fontWeight: 800,
              letterSpacing: '0.08em', fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
            }}>
              {loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ C, isDark, toggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={toggle}>
      <span style={{ fontSize: 10, color: C.dim, letterSpacing: '0.06em', userSelect: 'none' }}>
        {isDark ? 'DARK' : 'LIGHT'}
      </span>
      <div style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative',
        background: isDark ? C.accent : C.border,
        border: `1px solid ${isDark ? C.accent : C.border}`,
        transition: 'background 0.25s',
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: isDark ? 20 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.25s',
          boxShadow: '0 1px 4px #00000030',
        }} />
      </div>
    </div>
  );
}
