import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import MarketPulseApp from './MarketPulseApp';
import { ThemeCtx, DARK, LIGHT } from './theme';

export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('mp_theme') === 'dark');

  useEffect(() => {
    const token = localStorage.getItem('mp_token');
    const stored = localStorage.getItem('mp_user');
    if (token && stored) setUser(JSON.parse(stored));
    setChecked(true);
  }, []);

  useEffect(() => {
    document.body.style.background = isDark ? DARK.bg : LIGHT.bg;
  }, [isDark]);

  function toggle() {
    setIsDark(d => {
      const next = !d;
      localStorage.setItem('mp_theme', next ? 'dark' : 'light');
      return next;
    });
  }

  function handleAuth(data) {
    setUser({ id: data.user_id, email: data.email, name: data.name });
  }

  function handleLogout() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
    setUser(null);
  }

  if (!checked) return null;

  const C = isDark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ C, isDark, toggle }}>
      {!user ? <AuthPage onAuth={handleAuth} /> : <MarketPulseApp user={user} onLogout={handleLogout} />}
    </ThemeCtx.Provider>
  );
}
