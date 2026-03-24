import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import MarketPulseApp from './MarketPulseApp';

export default function App() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mp_token');
    const stored = localStorage.getItem('mp_user');
    if (token && stored) setUser(JSON.parse(stored));
    setChecked(true);
  }, []);

  function handleAuth(data) {
    setUser({ id: data.user_id, email: data.email, name: data.name });
  }

  function handleLogout() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
    setUser(null);
  }

  if (!checked) return null;
  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <MarketPulseApp user={user} onLogout={handleLogout} />;
}
