// src/components/RoleBadge.tsx
import React from 'react';

interface User {
  role?: string;
  custom_role_label?: string;
  custom_role_icon?: string;
  custom_role_color?: string;
}

interface Props {
  role?: string;
  user?: User;
}

const presetMap: Record<string, { label: string; icon: string; cls: string }> = {
  owner:     { label: 'OWNER',     icon: '👑', cls: 'bg-red-900/30 text-red-400 border-red-800/40' },
  admin:     { label: 'ADMIN',     icon: '🛡',  cls: 'bg-orange-900/30 text-orange-400 border-orange-800/40' },
  moderator: { label: 'MOD',       icon: '⚖️', cls: 'bg-blue-900/30 text-blue-400 border-blue-800/40' },
  support:   { label: 'SUPPORT',   icon: '🛟', cls: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/40' },
  vip:       { label: 'VIP',       icon: '💎', cls: 'bg-purple-900/30 text-purple-300 border-purple-700/40' },
};

const colorClasses: Record<string, string> = {
  red:    'bg-red-900/30 text-red-400 border-red-800/40',
  orange: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
  yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  green:  'bg-green-900/30 text-green-400 border-green-800/40',
  blue:   'bg-blue-900/30 text-blue-400 border-blue-800/40',
  cyan:   'bg-cyan-900/30 text-cyan-400 border-cyan-800/40',
  purple: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
  pink:   'bg-pink-900/30 text-pink-400 border-pink-800/40',
};

export const RoleBadge: React.FC<Props> = ({ role, user }) => {
  // Если есть кастомная роль — показываем её
  if (user?.custom_role_label) {
    const cls = colorClasses[user.custom_role_color || 'purple'] || colorClasses.purple;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls}`}>
        {user.custom_role_icon || '⭐'} {user.custom_role_label.toUpperCase()}
      </span>
    );
  }

  const r = role || user?.role;
  if (!r || r === 'user') return null;
  const p = presetMap[r];
  if (!p) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${p.cls}`}>
      {p.icon} {p.label}
    </span>
  );
};

export default RoleBadge;
