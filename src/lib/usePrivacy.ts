// src/lib/usePrivacy.ts
import { useEffect, useState } from 'react';

export const usePrivacy = () => {
  const [hideBalance, setHB] = useState<boolean>(() => localStorage.getItem('hide_balance') === '1');
  const [hideEmail, setHE]   = useState<boolean>(() => localStorage.getItem('hide_email') !== '0');
  const [glowEnabled, setGE] = useState<boolean>(() => localStorage.getItem('glow_enabled') !== '0');

  useEffect(() => {
    const onChange = () => {
      setHB(localStorage.getItem('hide_balance') === '1');
      setHE(localStorage.getItem('hide_email') !== '0');
      setGE(localStorage.getItem('glow_enabled') !== '0');
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('privacy-changed', onChange as any);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('privacy-changed', onChange as any);
    };
  }, []);

  const setHideBalance = (v: boolean) => {
    localStorage.setItem('hide_balance', v ? '1' : '0');
    setHB(v);
    window.dispatchEvent(new Event('privacy-changed'));
  };
  const setHideEmail = (v: boolean) => {
    localStorage.setItem('hide_email', v ? '1' : '0');
    setHE(v);
    window.dispatchEvent(new Event('privacy-changed'));
  };
  const setGlowEnabled = (v: boolean) => {
    localStorage.setItem('glow_enabled', v ? '1' : '0');
    setGE(v);
    window.dispatchEvent(new Event('privacy-changed'));
  };

  return { hideBalance, setHideBalance, hideEmail, setHideEmail, glowEnabled, setGlowEnabled };
};
