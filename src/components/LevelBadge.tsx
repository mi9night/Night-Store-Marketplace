// src/components/LevelBadge.tsx
import React, { useEffect, useState } from 'react';
import { Award, Crown, Star, Trophy } from 'lucide-react';
import BadgeTooltip from './BadgeTooltip';

interface Props {
  level?: number;
  compact?: boolean;
}

const PlatinumGem: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M6.5 4.5h11L21 9l-9 11L3 9l3.5-4.5Z" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M3 9h18M8 4.5 12 20l4-15.5M6.5 4.5 8 9l4-4.5L16 9l1.5-4.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </svg>
);

const map: Record<number, { label: string; Icon: React.ElementType; cls: string; glow: string; desc: string }> = {
  1: { label: 'Новичок',   Icon: Star,        cls: 'text-gray-300 bg-gray-500/15 border-gray-500/30',        glow: 'shadow-[0_0_6px_rgba(156,163,175,0.4)]',                desc: '0–50 продаж' },
  2: { label: 'Бронза',    Icon: Award,       cls: 'text-amber-500 bg-amber-600/15 border-amber-600/30',     glow: 'shadow-[0_0_8px_rgba(217,119,6,0.35)]',                 desc: '50–200 продаж' },
  3: { label: 'Серебро',   Icon: Award,       cls: 'text-gray-200 bg-gray-300/15 border-gray-300/40',        glow: 'shadow-[0_0_10px_rgba(209,213,219,0.5)]',                desc: '200–500 продаж' },
  4: { label: 'Золото',    Icon: Trophy,      cls: 'text-yellow-400 bg-yellow-400/15 border-yellow-400/40',  glow: 'shadow-[0_0_12px_rgba(250,204,21,0.6)]',                desc: '500–1000 продаж' },
  5: { label: 'Платина',   Icon: PlatinumGem, cls: 'text-cyan-300 bg-cyan-400/15 border-cyan-400/40',        glow: 'shadow-[0_0_14px_rgba(34,211,238,0.65)] animate-pulse', desc: '1000–2500 продаж' },
  6: { label: 'Бриллиант', Icon: Crown,       cls: 'text-purple-300 bg-purple-400/15 border-purple-400/50',  glow: 'shadow-[0_0_18px_rgba(168,85,247,0.75)] animate-pulse', desc: '2500+ продаж' },
};

const useGlowEnabled = () => {
  const [v, setV] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem('glow_enabled') !== '0';
  });
  useEffect(() => {
    const h = () => setV(localStorage.getItem('glow_enabled') !== '0');
    window.addEventListener('privacy-changed', h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener('privacy-changed', h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return v;
};

export const LevelBadge: React.FC<Props> = ({ level, compact }) => {
  const glowEnabled = useGlowEnabled();
  const lv = level && level >= 1 && level <= 6 ? level : 1;
  const l = map[lv];
  const Icon = l.Icon;
  const glow = glowEnabled ? l.glow : '';
  const tip = `${l.label}\nУровень продавца · ${l.desc}`;

  if (compact) {
    return (
      <BadgeTooltip text={tip}>
        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded border ${l.cls} ${glow}`}>
          <Icon size={12} />
        </span>
      </BadgeTooltip>
    );
  }

  return (
    <BadgeTooltip text={tip}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${l.cls} ${glow}`}>
        <Icon size={13} />
        <span>{l.label}</span>
      </span>
    </BadgeTooltip>
  );
};

export default LevelBadge;
