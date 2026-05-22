// src/components/LabelChip.tsx
import React from 'react';

interface Props {
  label: { name: string; color?: string; icon?: string };
  onClick?: () => void;
  onRemove?: () => void;
}

const colorClasses: Record<string, string> = {
  red:    'bg-red-900/30 text-red-300 border-red-700/40',
  orange: 'bg-orange-900/30 text-orange-300 border-orange-700/40',
  yellow: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/40',
  green:  'bg-green-900/30 text-green-300 border-green-700/40',
  blue:   'bg-blue-900/30 text-blue-300 border-blue-700/40',
  cyan:   'bg-cyan-900/30 text-cyan-300 border-cyan-700/40',
  purple: 'bg-purple-900/30 text-purple-300 border-purple-700/40',
  pink:   'bg-pink-900/30 text-pink-300 border-pink-700/40',
};

const LabelChip: React.FC<Props> = ({ label, onClick, onRemove }) => {
  const cls = colorClasses[label.color || 'purple'] || colorClasses.purple;
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${cls} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
    >
      <span>{label.icon || '🏷'}</span>
      <span>{label.name}</span>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 text-current hover:text-white"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default LabelChip;
