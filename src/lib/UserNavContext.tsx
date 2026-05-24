// src/lib/UserNavContext.tsx
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface Ctx {
  viewedUserId: string | null;
  openUser: (id: string) => void;
  closeUser: () => void;
  setOpenFullProfile: (fn: ((id: string) => void) | null) => void;
  goToFullProfile: (id: string) => void;
}

const C = createContext<Ctx | null>(null);

export const UserNavProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const fnRef = useRef<((id: string) => void) | null>(null);

  return (
    <C.Provider value={{
      viewedUserId,
      openUser: (id) => setViewedUserId(id),
      closeUser: () => setViewedUserId(null),
      setOpenFullProfile: (fn) => { fnRef.current = fn; },
      goToFullProfile: (id) => {
        setViewedUserId(null);
        if (fnRef.current) {
          fnRef.current(id);
        } else {
          // fallback — через hash
          localStorage.setItem('view_profile_id', id);
          window.location.hash = '#view-profile';
        }
      },
    }}>
      {children}
    </C.Provider>
  );
};

export const useUserNav = (): Ctx => {
  const ctx = useContext(C);
  if (!ctx) return {
    viewedUserId: null, openUser: () => {}, closeUser: () => {},
    setOpenFullProfile: () => {}, goToFullProfile: () => {},
  };
  return ctx;
};
