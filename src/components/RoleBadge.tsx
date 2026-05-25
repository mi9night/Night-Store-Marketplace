// src/components/RoleBadge.tsx
import React, { useEffect, useState } from 'react';
import BadgeTooltip from './BadgeTooltip';

interface CustomRole {
  id?: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  has_glow?: boolean;
  has_pulse?: boolean;
}

interface User {
  role?: string;
  custom_role_label?: string;
  custom_role_icon?: string;
  custom_role_color?: string;
  custom_role_description?: string;
  custom_role_glow?: boolean;
  custom_role_pulse?: boolean;
  custom_roles?: CustomRole[];
}

interface Props {
  role?: string;
  user?: User;
}

const presetMap: Record<string, { label: string; icon: string; cls: string; glow: string; tip: string }> = {
  owner:     { label: 'OWNER',     icon: '👑', cls: 'bg-red-900/30 text-red-400 border-red-800/40',           glow: 'shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse', tip: '👑 OWNER\nВладелец сайта' },
  admin:     { label: 'ADMIN',     icon: '🛡',  cls: 'bg-orange-900/30 text-orange-400 border-orange-800/40', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]',              tip: '🛡 ADMIN\nАдминистратор сайта' },
  moderator: { label: 'MOD',       icon: '⚖️', cls: 'bg-blue-900/30 text-blue-400 border-blue-800/40',        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',              tip: '⚖️ MOD\nМодератор сайта' },
  support:   { label: 'SUPPORT',   icon: '🛟', cls: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/40',        glow: 'shadow-[0_0_8px_rgba(6,182,212,0.4)]',                tip: '🛟 SUPPORT\nСлужба поддержки' },
  vip:       { label: 'VIP',       icon: '💎', cls: 'bg-purple-900/30 text-purple-300 border-purple-700/40',  glow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',              tip: '💎 VIP\nVIP-статус' },
};

const glowByColor: Record<string, string> = {
  red:    'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
  orange: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]',
  yellow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
  green:  'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
  blue:   'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  cyan:   'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
  purple: 'shadow-[0_0_10px_rgba(168,85,247,0.55)]',
  pink:   'shadow-[0_0_10px_rgba(236,72,153,0.5)]',
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

const DEFAULT_CUSTOM_DESC = 'Кастомная роль, выданная за определённые услуги';

export const RoleBadge: React.FC<Props> = ({ role, user }) => {
  const glowEnabled = useGlowEnabled();
  const badges: React.ReactNode[] = [];

  // 1) Основная роль
  const r = role || user?.role;
  if (r && r !== 'user' && r !== 'custom') {
    const p = presetMap[r];
    if (p) {
      badges.push(
        <BadgeTooltip key="role" text={p.tip}>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${p.cls} ${glowEnabled ? p.glow : ''}`}>
            {p.icon} {p.label}
          </span>
        </BadgeTooltip>
      );
    }
  }

  // 2) Массив кастомных ролей
  if (user?.custom_roles && user.custom_roles.length > 0) {
    user.custom_roles.forEach((cr, i) => {
      const cls = colorClasses[cr.color || 'purple'] || colorClasses.purple;
      // Свечение — по флагу has_glow (по умолчанию true), отключается глобально через glowEnabled
      const wantGlow = cr.has_glow !== false;
      const cglow = (glowEnabled && wantGlow) ? (glowByColor[cr.color || 'purple'] || '') : '';
      const pulse = (glowEnabled && cr.has_pulse) ? 'animate-pulse' : '';
      const tip = `${cr.icon || '⭐'} ${cr.label.toUpperCase()}\n${cr.description || DEFAULT_CUSTOM_DESC}`;
      badges.push(
        <BadgeTooltip key={`cr-${cr.id || i}`} text={tip}>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls} ${cglow} ${pulse}`}>
            {cr.icon || '⭐'} {cr.label.toUpperCase()}
          </span>
        </BadgeTooltip>
      );
    });
  } else if (user?.custom_role_label) {
    const cls = colorClasses[user.custom_role_color || 'purple'] || colorClasses.purple;
    const wantGlow = user.custom_role_glow !== false;
    const cglow = (glowEnabled && wantGlow) ? (glowByColor[user.custom_role_color || 'purple'] || '') : '';
    const pulse = (glowEnabled && user.custom_role_pulse) ? 'animate-pulse' : '';
    const tip = `${user.custom_role_icon || '⭐'} ${user.custom_role_label.toUpperCase()}\n${user.custom_role_description || DEFAULT_CUSTOM_DESC}`;
    badges.push(
      <BadgeTooltip key="custom" text={tip}>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls} ${cglow} ${pulse}`}>
          {user.custom_role_icon || '⭐'} {user.custom_role_label.toUpperCase()}
        </span>
      </BadgeTooltip>
    );
  }

  if (badges.length === 0) return null;
  return <>{badges}</>;
};

export default RoleBadge;
