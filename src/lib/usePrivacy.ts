// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

// Единый набор цветов для обеих систем
const COLOR_PALETTE = {
  night:    { label: '🌙 Night',     accent: '#8A2BE2', hover: '#A855F7', soft: '#B57CFF',
              bg: '#0B0A12', bg2: '#12101C', bg3: '#171425', text: '#EAE6FF', text2: '#9CA3AF' },
  midnight: { label: '🌌 Midnight',  accent: '#6366F1', hover: '#818CF8', soft: '#A5B4FC',
              bg: '#0A0E20', bg2: '#0F1432', bg3: '#161D40', text: '#E0E7FF', text2: '#94A3B8' },
  royal:    { label: '👑 Royal Gold', accent: '#D97706', hover: '#F59E0B', soft: '#FBBF24',
              bg: '#1A1408', bg2: '#221A0E', bg3: '#2C2314', text: '#FFF8E6', text2: '#B8A878' },
  sakura:   { label: '🌸 Sakura',    accent: '#EC4899', hover: '#F472B6', soft: '#F9A8D4',
              bg: '#1A0A14', bg2: '#22101C', bg3: '#2C1525', text: '#FFE6F2', text2: '#B8949C' },
  ocean:    { label: '🌊 Ocean',     accent: '#06B6D4', hover: '#22D3EE', soft: '#67E8F9',
              bg: '#06141A', bg2: '#0A1E26', bg3: '#0F2A35', text: '#E0F7FF', text2: '#94B5C0' },
  forest:   { label: '🌲 Forest',    accent: '#10B981', hover: '#34D399', soft: '#6EE7B7',
              bg: '#08160F', bg2: '#0E2018', bg3: '#142C20', text: '#E6FFF5', text2: '#94C0A8' },
  crimson:  { label: '🩸 Crimson',   accent: '#DC2626', hover: '#EF4444', soft: '#F87171',
              bg: '#150505', bg2: '#1F0808', bg3: '#2A0E0E', text: '#FFE6E6', text2: '#B89898' },
  amber:    { label: '🔥 Amber',     accent: '#F59E0B', hover: '#FBBF24', soft: '#FCD34D',
              bg: '#1A0E00', bg2: '#22140A', bg3: '#2C1C10', text: '#FFF4E0', text2: '#B89878' },
  emerald:  { label: '💚 Emerald',   accent: '#059669', hover: '#10B981', soft: '#34D399',
              bg: '#06160F', bg2: '#0A1E16', bg3: '#0F2820', text: '#E6FFF5', text2: '#94B5A8' },
  amoled:   { label: '⚫ AMOLED',    accent: '#A855F7', hover: '#C084FC', soft: '#D8B4FE',
              bg: '#000000', bg2: '#080808', bg3: '#121212', text: '#FFFFFF', text2: '#9CA3AF' },
  graphite: { label: '⚪ Graphite',  accent: '#A78BFA', hover: '#C4B5FD', soft: '#DDD6FE',
              bg: '#1A1A1A', bg2: '#222222', bg3: '#2A2A2A', text: '#F5F5F5', text2: '#A0A0A0' },
  navy:     { label: '🌊 Navy',      accent: '#3B82F6', hover: '#60A5FA', soft: '#93C5FD',
              bg: '#0A1228', bg2: '#0F1838', bg3: '#152048', text: '#E0EAFF', text2: '#94A3B8' },
  mint:     { label: '🍃 Mint',      accent: '#14B8A6', hover: '#2DD4BF', soft: '#5EEAD4',
              bg: '#0A1A14', bg2: '#0E241D', bg3: '#142E26', text: '#E0FFF4', text2: '#94B8AB' },
  light:    { label: '☀️ Light',     accent: '#FFFFFF', hover: '#F3F4F6', soft: '#E5E7EB',
              bg: '#F8F8FB', bg2: '#FFFFFF', bg3: '#FFFFFF', text: '#1A1A2E', text2: '#6B7280' },
} as const;

export type ThemeKey = keyof typeof COLOR_PALETTE;
export type FullThemeKey = keyof typeof COLOR_PALETTE;

// Для UI — оба показывают одни и те же 14 вариантов
export const THEMES = Object.fromEntries(
  Object.entries(COLOR_PALETTE).map(([k, v]) => [k, { label: v.label, accent: v.accent, hover: v.hover, soft: v.soft }])
) as Record<ThemeKey, { label: string; accent: string; hover: string; soft: string }>;

export const FULL_THEMES = Object.fromEntries(
  Object.entries(COLOR_PALETTE).map(([k, v]) => [k, {
    label: v.label,
    accent: v.accent,
    bg: v.bg, bg2: v.bg2, bg3: v.bg3, text: v.text, text2: v.text2,
  }])
) as Record<FullThemeKey, { label: string; accent: string; bg: string; bg2: string; bg3: string; text: string; text2: string }>;

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

// Определяем, светлая ли тема (по фону)
const isLightTheme = (bg: string): boolean => {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // YIQ формула — светлота
  return ((r * 299 + g * 587 + b * 114) / 1000) > 128;
};

export const applyFullTheme = (key: FullThemeKey) => {
  const t = FULL_THEMES[key];
  if (!t) return;
  const root = document.documentElement;

  // Стандартные переменные
  root.style.setProperty('--color-bg-primary',    t.bg);
  root.style.setProperty('--color-bg-secondary',  t.bg2);
  root.style.setProperty('--color-bg-card',       t.bg3);
  root.style.setProperty('--color-text-primary',  t.text);
  root.style.setProperty('--color-text-secondary',t.text2);
  root.style.setProperty('--bg-primary',          t.bg);
  root.style.setProperty('--bg-secondary',        t.bg2);
  root.style.setProperty('--bg-card',             t.bg3);
  root.style.setProperty('--text-primary',        t.text);
  root.style.setProperty('--text-secondary',      t.text2);

  document.body.style.backgroundColor = t.bg;
  document.body.style.color = t.text;

  // Глобальный CSS-override для hardcoded цветов
  let style = document.getElementById('theme-override') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'theme-override';
    document.head.appendChild(style);
  }

  const light = isLightTheme(t.bg);

  style.textContent = `
    /* Перекрываем hardcoded тёмные цвета на переменные темы */
    .bg-\\[\\#0B0A12\\] { background-color: ${t.bg} !important; }
    .bg-\\[\\#12101C\\] { background-color: ${t.bg2} !important; }
    .bg-\\[\\#171425\\] { background-color: ${t.bg3} !important; }

    /* Текст */
    .text-white { color: ${t.text} !important; }
    .text-text-primary { color: ${t.text} !important; }
    .text-text-secondary { color: ${t.text2} !important; }

    /* Для светлой темы — инвертируем некоторые приглушённые элементы */
    ${light ? `
      /* Полупрозрачные фоны на тёмных карточках в светлой теме становятся тёмными */
      .bg-purple-900\\/10,
      .bg-purple-900\\/20,
      .bg-purple-900\\/30 {
        background-color: rgba(138, 43, 226, 0.08) !important;
      }
      /* Тёмные плэйсхолдеры читаемые */
      ::placeholder { color: ${t.text2} !important; opacity: 0.7; }

      /* Инвертируем элементы которые были тёмными */
      input, textarea, select {
        background-color: ${t.bg3} !important;
        color: ${t.text} !important;
        border-color: rgba(138, 43, 226, 0.2) !important;
      }
    ` : ''}

    /* Фон body всегда из темы */
    body { background-color: ${t.bg} !important; color: ${t.text} !important; }
  `;
};

export const usePrivacy = () => {
  const [hideBalance, setHB] = useState<boolean>(() => localStorage.getItem('hide_balance') === '1');
  const [hideEmail, setHE]   = useState<boolean>(() => localStorage.getItem('hide_email') !== '0');
  const [glowEnabled, setGE] = useState<boolean>(() => localStorage.getItem('glow_enabled') !== '0');
  const [liveFeedEnabled, setLFE] = useState<boolean>(() => localStorage.getItem('live_feed_enabled') !== '0');
  const [theme, setT] = useState<ThemeKey>(() => (localStorage.getItem('theme') as ThemeKey) || 'night');
  const [fullTheme, setFT] = useState<FullThemeKey>(() => (localStorage.getItem('full_theme') as FullThemeKey) || 'night');

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
      const ft = (localStorage.getItem('full_theme') as FullThemeKey) || 'night';
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
