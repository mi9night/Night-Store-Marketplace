import React from 'react';
import { Ban, VolumeX, TriangleAlert } from 'lucide-react';
import BadgeTooltip from './BadgeTooltip';
import { formatPunishmentDate, getPunishmentDescription, getPunishmentTitle, Punishment, PunishmentType } from '../lib/moderation';

const cfg: Record<PunishmentType, { Icon: React.ElementType; cls: string; glow: string; label: string }> = {
  ban: {
    Icon: Ban,
    cls: 'bg-red-900/30 text-red-400 border-red-700/40',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,0.45)]',
    label: 'BAN',
  },
  mute: {
    Icon: VolumeX,
    cls: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
    glow: 'shadow-[0_0_14px_rgba(234,179,8,0.35)]',
    label: 'MUTE',
  },
  warn: {
    Icon: TriangleAlert,
    cls: 'bg-orange-900/30 text-orange-400 border-orange-700/40',
    glow: 'shadow-[0_0_14px_rgba(249,115,22,0.35)]',
    label: 'WARN',
  },
};

interface Props {
  type: PunishmentType;
  punishment?: Punishment | null;
  count?: number;
  compact?: boolean;
}

export const PunishmentBadge: React.FC<Props> = ({ type, punishment, count, compact }) => {
  const c = cfg[type];
  const Icon = c.Icon;
  const title = getPunishmentTitle(type);
  const description = getPunishmentDescription(type);
  const suffix = type === 'warn' && count ? ` ${count}/3` : '';
  const tip = [
    `${title}${suffix}`,
    description,
    punishment?.reason ? `Причина: ${punishment.reason}` : null,
    punishment?.moderator_name ? `Выдал: ${punishment.moderator_name}` : null,
    punishment?.ends_at || type !== 'warn' ? `До: ${formatPunishmentDate(punishment?.ends_at)}` : null,
  ].filter(Boolean).join('\n');

  return (
    <BadgeTooltip text={tip}>
      <span className={`inline-flex items-center ${compact ? 'gap-1 px-1.5 py-0.5 text-[10px]' : 'gap-1.5 px-2 py-1 text-xs'} rounded-full border font-bold ${c.cls} ${c.glow}`}>
        <Icon size={compact ? 11 : 13} />
        {compact ? c.label : `${c.label}${suffix}`}
      </span>
    </BadgeTooltip>
  );
};

export default PunishmentBadge;
