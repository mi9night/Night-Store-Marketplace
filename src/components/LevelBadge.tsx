// src/components/LevelBadge.tsx
import React from 'react';

interface Props {
  level?: number;
  compact?: boolean;
}

const map: Record<number, { label: string; icon: string; cls: string; glow: string }> = {
  1: {
    label: 'Новичок',
    icon: '⭐',
    cls: 'text-gray-400 bg-gray-500/15 border-gray-500/30',
    glow: '',
  },
  2: {
    label: 'Бронза',
    icon: '🥉',
    cls: 'text-amber-500 bg-amber-600/15 border-amber-600/30',
    glow: 'shadow-[0_0_8px_rgba(217,119,6,0.35)]',
  },
  3: {
    label: 'Серебро',
    icon: '🏅',
    cls: 'text-gray-200 bg-gray-300/15 border-gray-300/40',
    glow: 'shadow-[0_0_10px_rgba(209,213,219,0.5)]',
  },
  4: {
    label: 'Золото',
    icon: '🌟',
    cls: 'text-yellow-400 bg-yellow-400/15 border-yellow-400/40',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.6)]',
  },
  5: {
    label: 'Платина',
    icon: '💎',
    cls: 'text-cyan-300 bg-cyan-400/15 border-cyan-400/40',
    glow: 'shadow-[0_0_14px_rgba(34,211,238,0.65)] animate-pulse',
  },
  6: {
    label: 'Бриллиант',
    icon: '👑',
    cls: 'text-purple-300 bg-purple-400/15 border-purple-400/50',
    glow: 'shadow-[0_0_18px_rgba(168,85,247,0.75)] animate-pulse',
  },
};

export const LevelBadge: React.FC<Props> = ({ level, compact }) => {
  const lv = level && level >= 1 && level <= 6 ? level : 1;
  const l = map[lv];

  if (compact) {
    return (
      <span
        title={l.label}
        className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded border ${l.cls} ${l.glow}`}
      >
        {l.icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${l.cls} ${l.glow}`}
    >
      <span>{l.icon}</span>
      <span>{l.label}</span>
    </span>
  );
};

export default LevelBadge;
