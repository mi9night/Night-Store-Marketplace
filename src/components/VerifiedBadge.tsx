// src/components/VerifiedBadge.tsx — синяя/красная галочка с тултипом
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import BadgeTooltip from './BadgeTooltip';

interface Props {
  type: 'verified' | 'discord';
  size?: number;
  discordName?: string;
}

const VerifiedBadge: React.FC<Props> = ({ type, size = 16, discordName }) => {
  if (type === 'verified') {
    return (
      <BadgeTooltip text={'✓ Верифицирован\nЛично проверен модерацией сайта'}>
        <CheckCircle2 size={size} className="text-blue-400 fill-blue-400/20" />
      </BadgeTooltip>
    );
  }
  return (
    <BadgeTooltip text={discordName
      ? `Discord: ${discordName}\nИнтеграция с Discord подтверждена`
      : 'Discord верифицирован\nИнтеграция с Discord подтверждена'}>
      <CheckCircle2 size={size} className="text-red-400 fill-red-400/20" />
    </BadgeTooltip>
  );
};

export default VerifiedBadge;
