// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

export type ThemeKey = 'night' | 'midnight' | 'royal' | 'sakura' | 'ocean' | 'forest';

export const THEMES: Record<ThemeKey, { label: string; accent: string; hover: string; soft: string }> = {
  night:    { label: '🌙 Night (по умолч.)', accent: '#8A2BE2', hover: '#A855F7', soft: '#B57CFF' },
  midnight: { label: '🌌 Midnight',          accent: '#6366F1', hover: '#818CF8', soft: '#A5B4FC' },
  royal:    { label: '👑 Royal Gold',        accent: '#D97706', hover: '#F59E0B', soft: '#FBBF24' },
  sakura:   { label: '🌸 Sakura',            accent: '#EC4899', hover: '#F472B6', soft: '#F9A8D4' },
  ocean:    { label: '🌊 Ocean',             accent: '#06B6D4', hover: '#22D3EE', soft: '#67E8F9' },
  forest:   { label: '🌲 Forest',            accent: '#10B981', hover: '#34D399', soft: '#6EE7B7' },
};

const emit = () => window.dispatchEvent(new Event('privacy-changed'));

export const applyTheme = (key: ThemeKey) => {
  const t = THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  // Tailwind v4 переменные
  root.style.setProperty('--color-accent', t.accent);
  root.style.setProperty('--color-accent-hover', t.hover);
  root.style.setProperty('--color-accent-soft', t.soft);
  // Дублируем для совместимости
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-hover', t.hover);
  root.style.setProperty('--accent-soft', t.soft);
};

export const usePrivacy = () => {
  const [hideBalance, setHB] = useState<boolean>(() => localStorage.getItem('hide_balance') === '1');
  const [hideEmail, setHE]   = useState<boolean>(() => localStorage.getItem('hide_email') !== '0');
  const [glowEnabled, setGE] = useState<boolean>(() => localStorage.getItem('glow_enabled') !== '0');
  const [liveFeedEnabled, setLFE] = useState<boolean>(() => localStorage.getItem('live_feed_enabled') !== '0');
  const [theme, setT] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'night');

  // Применяем тему при ЛЮБОМ изменении (включая первый рендер)
  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const onChange = () => {
      setHB(localStorage.getItem('hide_balance') === '1');
      setHE(localStorage.getItem('hide_email') !== '0');
      setGE(localStorage.getItem('glow_enabled') !== '0');
      setLFE(localStorage.getItem('live_feed_enabled') !== '0');
      const t = (localStorage.getItem('theme') as ThemeKey) || 'night';
      setT(t);
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('privacy-changed', onChange as any);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('privacy-changed', onChange as any);
    };
  }, []);

  const setHideBalance = (v: boolean) => { localStorage.setItem('hide_balance', v ? '1' : '0'); setHB(v); emit(); };
  const setHideEmail   = (v: boolean) => { localStorage.setItem('hide_email',   v ? '1' : '0'); setHE(v); emit(); };
  const setGlowEnabled = (v: boolean) => { localStorage.setItem('glow_enabled', v ? '1' : '0'); setGE(v); emit(); };
  const setLiveFeedEnabled = (v: boolean) => { localStorage.setItem('live_feed_enabled', v ? '1' : '0'); setLFE(v); emit(); };
  const setTheme = (k: ThemeKey) => { localStorage.setItem('theme', k); setT(k); applyTheme(k); emit(); };

  return {
    hideBalance, setHideBalance,
    hideEmail, setHideEmail,
    glowEnabled, setGlowEnabled,
    liveFeedEnabled, setLiveFeedEnabled,
    theme, setTheme,
  };
};
