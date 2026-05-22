// src/lib/UserNavContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Ctx {
  viewedUserId: string | null;
  openUser: (id: string) => void;
  closeUser: () => void;
}

const C = createContext<Ctx | null>(null);

export const UserNavProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  return (
    <C.Provider value={{
      viewedUserId,
      openUser: (id) => setViewedUserId(id),
      closeUser: () => setViewedUserId(null),
    }}>
      {children}
    </C.Provider>
  );
};

export const useUserNav = (): Ctx => {
  const ctx = useContext(C);
  if (!ctx) return { viewedUserId: null, openUser: () => {}, closeUser: () => {} };
  return ctx;
};
