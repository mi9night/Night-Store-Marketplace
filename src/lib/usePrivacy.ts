// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

// Единый набор цветов для обеих систем
const COLOR_PALETTE = {
  night:    { label: 'Night',      accent: '#8A2BE2', hover: '#A855F7', soft: '#B57CFF',
              bg: '#0B0A12', bg2: '#12101C', bg3: '#171425', text: '#EAE6FF', text2: '#9CA3AF' },
  midnight: { label: 'Midnight',   accent: '#6366F1', hover: '#818CF8', soft: '#A5B4FC',
              bg: '#0A0E20', bg2: '#0F1432', bg3: '#161D40', text: '#E0E7FF', text2: '#94A3B8' },
  royal:    { label: 'Royal Gold', accent: '#D97706', hover: '#F59E0B', soft: '#FBBF24',
              bg: '#1A1408', bg2: '#221A0E', bg3: '#2C2314', text: '#FFF8E6', text2: '#B8A878' },
  sakura:   { label: 'Sakura',     accent: '#EC4899', hover: '#F472B6', soft: '#F9A8D4',
              bg: '#1A0A14', bg2: '#22101C', bg3: '#2C1525', text: '#FFE6F2', text2: '#B8949C' },
  ocean:    { label: 'Ocean',      accent: '#06B6D4', hover: '#22D3EE', soft: '#67E8F9',
              bg: '#06141A', bg2: '#0A1E26', bg3: '#0F2A35', text: '#E0F7FF', text2: '#94B5C0' },
  forest:   { label: 'Forest',     accent: '#10B981', hover: '#34D399', soft: '#6EE7B7',
              bg: '#08160F', bg2: '#0E2018', bg3: '#142C20', text: '#E6FFF5', text2: '#94C0A8' },
  crimson:  { label: 'Crimson',    accent: '#DC2626', hover: '#EF4444', soft: '#F87171',
              bg: '#150505', bg2: '#1F0808', bg3: '#2A0E0E', text: '#FFE6E6', text2: '#B89898' },
  amber:    { label: 'Amber',      accent: '#F59E0B', hover: '#FBBF24', soft: '#FCD34D',
              bg: '#1A0E00', bg2: '#22140A', bg3: '#2C1C10', text: '#FFF4E0', text2: '#B89878' },
  emerald:  { label: 'Emerald',    accent: '#059669', hover: '#10B981', soft: '#34D399',
              bg: '#06160F', bg2: '#0A1E16', bg3: '#0F2820', text: '#E6FFF5', text2: '#94B5A8' },
  amoled:   { label: 'AMOLED',     accent: '#A855F7', hover: '#C084FC', soft: '#D8B4FE',
              bg: '#000000', bg2: '#080808', bg3: '#121212', text: '#FFFFFF', text2: '#9CA3AF' },
  graphite: { label: 'Graphite',   accent: '#A78BFA', hover: '#C4B5FD', soft: '#DDD6FE',
              bg: '#1A1A1A', bg2: '#222222', bg3: '#2A2A2A', text: '#F5F5F5', text2: '#A0A0A0' },
  navy:     { label: '🌊 Navy',       accent: '#3B82F6', hover: '#60A5FA', soft: '#93C5FD',
              bg: '#0A1228', bg2: '#0F1838', bg3: '#152048', text: '#E0EAFF', text2: '#94A3B8' },
  mint:     { label: 'Mint',       accent: '#14B8A6', hover: '#2DD4BF', soft: '#5EEAD4',
              bg: '#0A1A14', bg2: '#0E241D', bg3: '#142E26', text: '#E0FFF4', text2: '#94B8AB' },
  light:    { label: 'Light',      accent: '#FFFFFF', hover: '#F3F4F6', soft: '#E5E7EB',
              bg: '#F8F8FB', bg2: '#FFFFFF', bg3: '#FFFFFF', text: '#1A1A2E', text2: '#6B7280' },
} as const;

export type ThemeKey = keyof typeof COLOR_PALETTE;
export type FullThemeKey = keyof typeof COLOR_PALETTE;

export const THEMES = Object.fromEntries(
  Object.entries(COLOR_PALETTE).map(([k, v]) => [k, { label: v.label, accent: v.accent, hover: v.hover, soft: v.soft }])
) as Record<ThemeKey, { label: string; accent: string; hover: string; soft: string }>;

export const FULL_THEMES = Object.fromEntries(
  Object.entries(COLOR_PALETTE).map(([k, v]) => [k, {
    label: v.label,
    accent: v.accent,
    hover: v.hover,
    soft: v.soft,
    bg: v.bg,
    bg2: v.bg2,
    bg3: v.bg3,
    text: v.text,
    text2: v.text2,
  }])
) as Record<FullThemeKey, {
  label: string;
  accent: string;
  hover: string;
  soft: string;
  bg: string;
  bg2: string;
  bg3: string;
  text: string;
  text2: string;
}>;

const emit = () => window.dispatchEvent(new Event('privacy-changed'));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbString = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
};

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const cssEscapeHexClass = (prefix: 'bg' | 'from' | 'via' | 'to' | 'border', hex: string) =>
  `.${prefix}-\\[\\${hex.toUpperCase()}\\], .${prefix}-\\[\\${hex.toLowerCase()}\\]`;

const purpleSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const alphaSteps = ['5', '10', '20', '25', '30', '40', '50', '60', '70', '80', '90'];

const utilitySelectors = (prefix: string, color = 'purple') => [
  ...purpleSteps.map(step => `.${prefix}-${color}-${step}`),
  ...alphaSteps.flatMap(alpha => purpleSteps.map(step => `.${prefix}-${color}-${step}\\/${alpha}`)),
].join(',\n');

const variantSelectors = (variant: 'hover' | 'focus' | 'focus-within', prefix: string, pseudo: ':hover' | ':focus' | ':focus-within', color = 'purple') => [
  ...purpleSteps.map(step => `.${variant}\\:${prefix}-${color}-${step}${pseudo}`),
  ...alphaSteps.flatMap(alpha => purpleSteps.map(step => `.${variant}\\:${prefix}-${color}-${step}\\/${alpha}${pseudo}`)),
].join(',\n');

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
  root.style.setProperty('--accent-rgb', rgbString(t.accent));
  root.style.setProperty('--accent-hover-rgb', rgbString(t.hover));
  root.style.setProperty('--accent-soft-rgb', rgbString(t.soft));
};

// Определяем, светлая ли тема (по фону)
const isLightTheme = (bg: string): boolean => {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) > 128;
};

export const applyFullTheme = (key: FullThemeKey) => {
  const t = FULL_THEMES[key];
  if (!t) return;

  const root = document.documentElement;
  const light = isLightTheme(t.bg);
  const bg4 = light ? '#F3F4F6' : rgba(t.bg3, 0.72);

  // Полное оформление теперь меняет не только фон, но и акцентные переменные.
  root.dataset.fullTheme = key;
  root.dataset.themeMode = light ? 'light' : 'dark';

  root.style.setProperty('--color-bg-primary', t.bg);
  root.style.setProperty('--color-bg-secondary', t.bg2);
  root.style.setProperty('--color-bg-card', t.bg3);
  root.style.setProperty('--color-text-primary', t.text);
  root.style.setProperty('--color-text-secondary', t.text2);
  root.style.setProperty('--color-accent', t.accent);
  root.style.setProperty('--color-accent-hover', t.hover);
  root.style.setProperty('--color-accent-soft', t.soft);

  root.style.setProperty('--bg-primary', t.bg);
  root.style.setProperty('--bg-secondary', t.bg2);
  root.style.setProperty('--bg-card', t.bg3);
  root.style.setProperty('--text-primary', t.text);
  root.style.setProperty('--text-secondary', t.text2);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-hover', t.hover);
  root.style.setProperty('--accent-soft', t.soft);

  root.style.setProperty('--bg-primary-rgb', rgbString(t.bg));
  root.style.setProperty('--bg-secondary-rgb', rgbString(t.bg2));
  root.style.setProperty('--bg-card-rgb', rgbString(t.bg3));
  root.style.setProperty('--text-primary-rgb', rgbString(t.text));
  root.style.setProperty('--text-secondary-rgb', rgbString(t.text2));
  root.style.setProperty('--accent-rgb', rgbString(t.accent));
  root.style.setProperty('--accent-hover-rgb', rgbString(t.hover));
  root.style.setProperty('--accent-soft-rgb', rgbString(t.soft));

  document.body.style.backgroundColor = t.bg;
  document.body.style.color = t.text;

  let style = document.getElementById('theme-override') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'theme-override';
    document.head.appendChild(style);
  }

  style.textContent = `
    :root {
      color-scheme: ${light ? 'light' : 'dark'};
    }

    html,
    body,
    #root {
      background: ${t.bg} !important;
      color: ${t.text} !important;
    }

    body {
      transition: background-color .25s ease, color .25s ease;
    }

    /* Базовые поверхности приложения */
    .bg-bg-primary { background-color: ${t.bg} !important; }
    .bg-bg-secondary { background-color: ${t.bg2} !important; }
    .bg-bg-card { background-color: ${t.bg3} !important; }
    .text-text-primary { color: ${t.text} !important; }
    .text-text-secondary { color: ${t.text2} !important; }

    /* Hardcoded dark backgrounds from old components */
    ${cssEscapeHexClass('bg', '#0B0A12')} { background-color: ${t.bg} !important; }
    ${cssEscapeHexClass('bg', '#12101C')} { background-color: ${t.bg2} !important; }
    ${cssEscapeHexClass('bg', '#171425')} { background-color: ${t.bg3} !important; }
    ${cssEscapeHexClass('bg', '#120F1E')} { background-color: ${t.bg2} !important; }
    ${cssEscapeHexClass('bg', '#1E1A30')} { background-color: ${bg4} !important; }

    ${cssEscapeHexClass('border', '#171425')} { border-color: ${t.bg3} !important; }

    /* Hardcoded gradients */
    ${cssEscapeHexClass('from', '#0B0A12')} {
      --tw-gradient-from: ${t.bg} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${rgba(t.bg, 0)} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    ${cssEscapeHexClass('from', '#12101C')},
    ${cssEscapeHexClass('from', '#120F1E')} {
      --tw-gradient-from: ${t.bg2} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${rgba(t.bg2, 0)} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    ${cssEscapeHexClass('from', '#171425')},
    ${cssEscapeHexClass('from', '#1E1A30')} {
      --tw-gradient-from: ${t.bg3} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${rgba(t.bg3, 0)} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    ${cssEscapeHexClass('via', '#0B0A12')} { --tw-gradient-via: ${t.bg} var(--tw-gradient-via-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to) !important; }
    ${cssEscapeHexClass('via', '#12101C')},
    ${cssEscapeHexClass('via', '#120F1E')} { --tw-gradient-via: ${t.bg2} var(--tw-gradient-via-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to) !important; }
    ${cssEscapeHexClass('via', '#171425')},
    ${cssEscapeHexClass('via', '#1E1A30')} { --tw-gradient-via: ${t.bg3} var(--tw-gradient-via-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to) !important; }
    ${cssEscapeHexClass('to', '#0B0A12')} { --tw-gradient-to: ${t.bg} var(--tw-gradient-to-position) !important; }
    ${cssEscapeHexClass('to', '#12101C')},
    ${cssEscapeHexClass('to', '#120F1E')} { --tw-gradient-to: ${t.bg2} var(--tw-gradient-to-position) !important; }
    ${cssEscapeHexClass('to', '#171425')},
    ${cssEscapeHexClass('to', '#1E1A30')} { --tw-gradient-to: ${t.bg3} var(--tw-gradient-to-position) !important; }

    /* Полное оформление должно перекрашивать старые purple-утилиты в выбранный акцент */
    ${utilitySelectors('text')} { color: ${t.soft} !important; }
    ${variantSelectors('hover', 'text', ':hover')} { color: ${t.text} !important; }
    ${utilitySelectors('border')} { border-color: ${rgba(t.accent, 0.28)} !important; }
    ${variantSelectors('hover', 'border', ':hover')} { border-color: ${rgba(t.accent, 0.55)} !important; }
    ${variantSelectors('focus', 'border', ':focus')},
    ${variantSelectors('focus-within', 'border', ':focus-within')} { border-color: ${rgba(t.accent, 0.7)} !important; }
    ${utilitySelectors('ring')} { --tw-ring-color: ${rgba(t.accent, 0.45)} !important; }

    ${utilitySelectors('bg')} { background-color: ${rgba(t.accent, 0.16)} !important; }
    .bg-purple-500,
    .bg-purple-600,
    .bg-purple-700,
    .bg-purple-800,
    .bg-purple-900,
    .bg-accent { background-color: ${t.accent} !important; }
    .hover\\:bg-purple-500:hover,
    .hover\\:bg-purple-600:hover,
    .hover\\:bg-purple-700:hover,
    .hover\\:bg-purple-800:hover,
    .hover\\:bg-purple-900:hover,
    .hover\\:bg-accent-hover:hover { background-color: ${t.hover} !important; }

    ${utilitySelectors('from')} {
      --tw-gradient-from: ${rgba(t.accent, 0.42)} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${rgba(t.accent, 0)} var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    ${utilitySelectors('via')} {
      --tw-gradient-via: ${rgba(t.accent, 0.2)} var(--tw-gradient-via-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to) !important;
    }
    ${utilitySelectors('to')} {
      --tw-gradient-to: ${rgba(t.accent, 0.16)} var(--tw-gradient-to-position) !important;
    }

    /* Тексты и стекло */
    .text-white { color: ${t.text} !important; }
    .glass {
      background: ${rgba(t.bg2, 0.84)} !important;
      border-color: ${rgba(t.accent, 0.16)} !important;
    }
    .dropdown,
    .notif-panel {
      background: ${t.bg2} !important;
      border-color: ${rgba(t.accent, 0.24)} !important;
      box-shadow: 0 20px 60px ${rgba('#000000', light ? 0.12 : 0.45)}, 0 0 40px ${rgba(t.accent, 0.08)} !important;
    }

    .gradient-text {
      background: linear-gradient(135deg, ${t.accent}, ${t.soft}, ${t.hover}) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }

    .btn-primary,
    .progress-bar,
    .chart-bar {
      background: linear-gradient(135deg, ${t.accent}, ${t.hover}) !important;
    }

    .glow-purple,
    .glow-purple-hover:hover,
    .glow-card:hover,
    .avatar-ring {
      box-shadow: 0 0 24px ${rgba(t.accent, 0.28)}, 0 0 48px ${rgba(t.accent, 0.1)} !important;
    }

    input,
    textarea,
    select {
      background-color: ${t.bg2} !important;
      color: ${t.text} !important;
      border-color: ${rgba(t.accent, 0.24)} !important;
    }
    input:focus,
    textarea:focus,
    select:focus {
      border-color: ${t.accent} !important;
      box-shadow: 0 0 0 2px ${rgba(t.accent, 0.16)} !important;
    }
    ::placeholder { color: ${t.text2} !important; opacity: .72; }
    ::selection { background: ${rgba(t.accent, 0.28)} !important; color: ${t.text} !important; }
    ::-webkit-scrollbar-track { background: ${t.bg2} !important; }
    ::-webkit-scrollbar-thumb { background: ${t.accent} !important; }
    ::-webkit-scrollbar-thumb:hover { background: ${t.hover} !important; }

    ${light ? `
      .bg-black\\/40,
      .bg-black\\/50,
      .bg-black\\/60,
      .bg-black\\/70,
      .bg-black\\/80 {
        background-color: rgba(255, 255, 255, .72) !important;
        color: ${t.text} !important;
      }
      .border-white,
      .border-white\\/10,
      .border-white\\/20 {
        border-color: ${rgba(t.accent, 0.24)} !important;
      }
    ` : ''}
  `;
};

export const applyStoredAppearance = () => {
  if (typeof window === 'undefined') return;
  const savedFullTheme = (localStorage.getItem('full_theme') as FullThemeKey) || 'night';
  const savedTheme = (localStorage.getItem('theme') as ThemeKey) || savedFullTheme;
  applyFullTheme(savedFullTheme);
  applyTheme(savedTheme);
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
  const setFullTheme = (k: FullThemeKey) => {
    // Полная тема должна выглядеть цельно: фон + карточки + текст + акцент.
    // Поэтому при выборе полной темы синхронизируем и акцентную тему.
    localStorage.setItem('full_theme', k);
    localStorage.setItem('theme', k);
    setFT(k);
    setT(k);
    applyFullTheme(k);
    emit();
  };

  return {
    hideBalance, setHideBalance,
    hideEmail, setHideEmail,
    glowEnabled, setGlowEnabled,
    liveFeedEnabled, setLiveFeedEnabled,
    theme, setTheme,
    fullTheme, setFullTheme,
  };
};
