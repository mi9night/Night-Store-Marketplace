// src/components/UserLink.tsx
import React from 'react';
import { useUserNav } from '../lib/UserNavContext';

interface Props {
  userId?: string | null;
  username?: string | null;
  className?: string;
  children?: React.ReactNode;
}

/** Кликабельный никнейм — открывает профиль пользователя */
export const UserLink: React.FC<Props> = ({ userId, username, className, children }) => {
  const { openUser } = useUserNav();

  if (!userId) {
    return <span className={className}>{children ?? username ?? '—'}</span>;
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); openUser(userId); }}
      className={`hover:text-purple-300 hover:underline transition-colors text-left ${className || ''}`}
    >
      {children ?? username ?? '—'}
    </button>
  );
};

export default UserLink;
