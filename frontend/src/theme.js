import { createContext, useContext } from 'react';

export const DARK = {
  bg: '#050B18',      surface: '#0A1628',   card: '#0D1F3C',
  card2: '#0D2245',   border: '#1E3560',    accent: '#4F8CFF',
  accent2: '#8B5CF6', gold: '#F59E0B',      green: '#10D9A0',
  red: '#F87171',     purple: '#A78BFA',    text: '#EBF4FF',
  dim: '#5272A0',     muted: '#0E1F38',
};

export const LIGHT = {
  bg: '#F2EEFF',      surface: '#FFFFFF',   card: '#FDFCFF',
  card2: '#F5F0FF',   border: '#E4DEFF',    accent: '#7C5CFC',
  accent2: '#A855F7', gold: '#F59E0B',      green: '#22C55E',
  red: '#EF4444',     purple: '#9F7AEA',    text: '#1E1B4B',
  dim: '#7C6FA0',     muted: '#EDE9FF',
};

export const makeSIG = (C) => ({
  BUY: C.green, ACCUMULATE: C.accent, HOLD: C.gold, WATCH: C.purple, AVOID: C.red,
});

export const makeDIR = (C) => ({
  BULLISH: { icon: '↑', color: C.green, label: 'Bullish' },
  BEARISH: { icon: '↓', color: C.red, label: 'Bearish' },
  NEUTRAL:  { icon: '→', color: C.gold, label: 'Neutral' },
});

export const ThemeCtx = createContext({ C: LIGHT, isDark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);
