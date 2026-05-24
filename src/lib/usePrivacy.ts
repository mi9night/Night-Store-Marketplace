// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

export type ThemeKey = 'night' | 'midnight' | 'royal' | 'sakura' | 'ocean' | 'forest';

export const THEMES: Record<ThemeKey, { label: string; vars: Record<string, string> }> = {
  night:    { label: '🌙 Night (по умолч.)', vars: { '--accent': '#8A2BE2', '--accent-hover': '#A855F7', '--accent-soft': '#B57CFF' } },
  midnight: { label: '🌌 Midnight', vars: { '--accent': '#6366F1', '--accent-hover': '#818CF8', '--accent-soft': '#A5B4FC' } },
  royal:    { label: '👑 Royal Gold', vars: { '--accent': '#D97706', '--accent-hover': '#F59E0B', '--accent-soft': '#FBBF24' } },
  sakura:   { label: '🌸 Sakura', vars: { '--accent': '#EC4899', '--accent-hover': '#F472B6', '--accent-soft': '#F9A8D4' } },
  ocean:    { label: '🌊 Ocean', vars: { '--accent': '#06B6D4', '--accent-hover': '#22D3EE', '--accent-soft': '#67E8F9' } },
  forest:   { label: '🌲 Forest', vars: { '--accent': '#10B981', '--accent-hover': '#34D399', '--accent-soft': '#6EE7B7' } },
};

const emit = () => window.dispatchEvent(new Event('privacy-changed'));

export const applyTheme = (key: ThemeKey) => {
  const t = THEMES[key];
  if (!t) return;
  Object.entries(t.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
};

export const usePrivacy = () => {
  const [hideBalance, setHB] = useState<boolean>(() => localStorage.getItem('hide_balance') === '1');
  const [hideEmail, setHE]   = useState<boolean>(() => localStorage.getItem('hide_email') !== '0');
  const [glowEnabled, setGE] = useState<boolean>(() => localStorage.getItem('glow_enabled') !== '0');
  const [liveFeedEnabled, setLFE] = useState<boolean>(() => localStorage.getItem('live_feed_enabled') !== '0');
  const [theme, setT] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'night');

  useEffect(() => {
    // Применить тему при загрузке
    applyTheme(theme);
  }, []);

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
