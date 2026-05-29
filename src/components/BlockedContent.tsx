import React, { useState } from 'react';
import { Eye, ShieldOff } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  className?: string;
  label?: string;
}

const BlockedContent: React.FC<Props> = ({ children, className = '', label = 'Сообщение скрыто' }) => {
  const [shown, setShown] = useState(false);

  if (shown) return <>{children || null}</>;

  return (
    <div className={`bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-900/50 border border-gray-700/40 flex items-center justify-center text-gray-400">
          <ShieldOff size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-300">Заблокированный пользователь</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
        <button
          onClick={() => setShown(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 text-xs font-semibold transition-all"
        >
          <Eye size={12} /> Показать
        </button>
      </div>
    </div>
  );
};

export default BlockedContent;
