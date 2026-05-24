// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

export type ThemeKey = 'night' | 'midnight' | 'royal' | 'sakura' | 'ocean' | 'forest';
export type FullThemeKey = 'default' | 'light' | 'amoled' | 'gray' | 'crimson' | 'navy' | 'mint';

export const THEMES: Record<ThemeKey, { label: string; accent: string; hover: string; soft: string }> = {
  night:    { label: '🌙 Night (по умолч.)', accent: '#8A2BE2', hover: '#A855F7', soft: '#B57CFF' },
  midnight: { label: '🌌 Midnight',          accent: '#6366F1', hover: '#818CF8', soft: '#A5B4FC' },
  royal:    { label: '👑 Royal Gold',        accent: '#D97706', hover: '#F59E0B', soft: '#FBBF24' },
  sakura:   { label: '🌸 Sakura',            accent: '#EC4899', hover: '#F472B6', soft: '#F9A8D4' },
  ocean:    { label: '🌊 Ocean',             accent: '#06B6D4', hover: '#22D3EE', soft: '#67E8F9' },
  forest:   { label: '🌲 Forest',            accent: '#10B981', hover: '#34D399', soft: '#6EE7B7' },
};

export const FULL_THEMES: Record<FullThemeKey, { label: string; vars: Record<string, string> }> = {
  default: {
    label: '🌙 Тёмная (стандарт)',
    vars: {
      '--color-bg-primary':    '#0B0A12',
      '--color-bg-secondary':  '#12101C',
      '--color-bg-card':       '#171425',
      '--color-text-primary':  '#EAE6FF',
      '--color-text-secondary':'#9CA3AF',
      '--bg-primary':          '#0B0A12',
      '--bg-secondary':        '#12101C',
      '--bg-card':             '#171425',
      '--text-primary':        '#EAE6FF',
      '--text-secondary':      '#9CA3AF',
    },
  },
  amoled: {
    label: '⚫ AMOLED Чёрная',
    vars: {
      '--color-bg-primary':    '#000000',
      '--color-bg-secondary':  '#080808',
      '--color-bg-card':       '#121212',
      '--color-text-primary':  '#FFFFFF',
      '--color-text-secondary':'#9CA3AF',
      '--bg-primary':          '#000000',
      '--bg-secondary':        '#080808',
      '--bg-card':             '#121212',
      '--text-primary':        '#FFFFFF',
      '--text-secondary':      '#9CA3AF',
    },
  },
  gray: {
    label: '⚪ Графит',
    vars: {
      '--color-bg-primary':    '#1A1A1A',
      '--color-bg-secondary':  '#222222',
      '--color-bg-card':       '#2A2A2A',
      '--color-text-primary':  '#F5F5F5',
      '--color-text-secondary':'#A0A0A0',
      '--bg-primary':          '#1A1A1A',
      '--bg-secondary':        '#222222',
      '--bg-card':             '#2A2A2A',
      '--text-primary':        '#F5F5F5',
      '--text-secondary':      '#A0A0A0',
    },
  },
  crimson: {
    label: '🩸 Кровавая',
    vars: {
      '--color-bg-primary':    '#150505',
      '--color-bg-secondary':  '#1F0808',
      '--color-bg-card':       '#2A0E0E',
      '--color-text-primary':  '#FFE6E6',
      '--color-text-secondary':'#B89898',
      '--bg-primary':          '#150505',
      '--bg-secondary':        '#1F0808',
      '--bg-card':             '#2A0E0E',
      '--text-primary':        '#FFE6E6',
      '--text-secondary':      '#B89898',
    },
  },
  navy: {
    label: '🌊 Морская',
    vars: {
      '--color-bg-primary':    '#0A1228',
      '--color-bg-secondary':  '#0F1838',
      '--color-bg-card':       '#152048',
      '--color-text-primary':  '#E0EAFF',
      '--color-text-secondary':'#94A3B8',
      '--bg-primary':          '#0A1228',
      '--bg-secondary':        '#0F1838',
      '--bg-card':             '#152048',
      '--text-primary':        '#E0EAFF',
      '--text-secondary':      '#94A3B8',
    },
  },
  mint: {
    label: '🍃 Мятная',
    vars: {
      '--color-bg-primary':    '#0A1A14',
      '--color-bg-secondary':  '#0E241D',
      '--color-bg-card':       '#142E26',
      '--color-text-primary':  '#E0FFF4',
      '--color-text-secondary':'#94B8AB',
      '--bg-primary':          '#0A1A14',
      '--bg-secondary':        '#0E241D',
      '--bg-card':             '#142E26',
      '--text-primary':        '#E0FFF4',
      '--text-secondary':      '#94B8AB',
    },
  },
  light: {
    label: '☀️ Светлая',
    vars: {
      '--color-bg-primary':    '#F8F8FB',
      '--color-bg-secondary':  '#FFFFFF',
      '--color-bg-card':       '#FFFFFF',
      '--color-text-primary':  '#1A1A2E',
      '--color-text-secondary':'#6B7280',
      '--bg-primary':          '#F8F8FB',
      '--bg-secondary':        '#FFFFFF',
      '--bg-card':             '#FFFFFF',
      '--text-primary':        '#1A1A2E',
      '--text-secondary':      '#6B7280',
    },
  },
};

const emit = () => window.dispatchEvent(new Event('privacy-changed'));

export const applyTheme = (key: ThemeKey) => {
  const t = THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty('--color-accent', t.accent);
  root.style.setProperty('--color-accent-hover', t.hover);
  root.style.setProperty('--color-accent-soft', t.soft);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-hover', t.hover);
  root.style.setProperty('--accent-soft', t.soft);
};

export const applyFullTheme = (key: FullThemeKey) => {
  const t = FULL_THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // body background для надёжности
  if (key === 'light') {
    document.body.style.backgroundColor = '#F8F8FB';
    document.body.style.color = '#1A1A2E';
  } else {
    document.body.style.backgroundColor = t.vars['--bg-primary'];
    document.body.style.color = t.vars['--text-primary'];
  }
};

export const usePrivacy = () => {
  const [hideBalance, setHB] = useState<boolean>(() => localStorage.getItem('hide_balance') === '1');
  const [hideEmail, setHE]   = useState<boolean>(() => localStorage.getItem('hide_email') !== '0');
  const [glowEnabled, setGE] = useState<boolean>(() => localStorage.getItem('glow_enabled') !== '0');
  const [liveFeedEnabled, setLFE] = useState<boolean>(() => localStorage.getItem('live_feed_enabled') !== '0');
  const [theme, setT] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'night');
  const [fullTheme, setFT] = useState<FullThemeKey>(() => (localStorage.getItem('full_theme') as FullThemeKey) || 'default');

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { applyFullTheme(fullTheme); }, [fullTheme]);

  useEffect(() => {
    const onChange = () => {
      setHB(localStorage.getItem('hide_balance') === '1');
      setHE(localStorage.getItem('hide_email') !== '0');
      setGE(localStorage.getItem('glow_enabled') !== '0');
      setLFE(localStorage.getItem('live_feed_enabled') !== '0');
      const t = (localStorage.getItem('theme') as ThemeKey) || 'night';
      setT(t);
      const ft = (localStorage.getItem('full_theme') as FullThemeKey) || 'default';
      setFT(ft);
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
  const setFullTheme = (k: FullThemeKey) => { localStorage.setItem('full_theme', k); setFT(k); applyFullTheme(k); emit(); };

  return {
    hideBalance, setHideBalance,
    hideEmail, setHideEmail,
    glowEnabled, setGlowEnabled,
    liveFeedEnabled, setLiveFeedEnabled,
    theme, setTheme,
    fullTheme, setFullTheme,
  };
};
