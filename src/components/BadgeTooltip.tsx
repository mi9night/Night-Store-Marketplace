// src/components/BadgeTooltip.tsx
import React, { useState, ReactNode } from 'react';

interface Props {
  text: string;
  children: ReactNode;
}

const BadgeTooltip: React.FC<Props> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="absolute z-[200] bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-[#0B0A12] border border-purple-700/40 rounded-lg shadow-xl text-[11px] text-white whitespace-pre-line min-w-[140px] max-w-[260px] text-center pointer-events-none"
          style={{ width: 'max-content' }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#0B0A12] border-r border-b border-purple-700/40 rotate-45" />
        </span>
      )}
    </span>
  );
};

export default BadgeTooltip;
