// src/lib/CurrencyContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const CURRENCIES = [
  { code: 'RUB', name: 'Рубль',   flag: '🇷🇺', symbol: '₽' },
  { code: 'USD', name: 'Доллар',  flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Евро',    flag: '🇪🇺', symbol: '€' },
  { code: 'UAH', name: 'Гривна',  flag: '🇺🇦', symbol: '₴' },
  { code: 'KZT', name: 'Тенге',   flag: '🇰🇿', symbol: '₸' },
];

interface CurrencyCtx {
  currency: string;
  setCurrency: (c: string) => void;
  rates: Record<string, number>;        // сколько X за 1 RUB
  convert: (amountRub: number) => number;
  format: (amountRub: number, opts?: { showCode?: boolean }) => string;
  symbol: string;
  // 👇 Скрытие баланса/почты (раньше отсутствовали — ошибка "X is not a function")
  hideBalance: boolean;
  setHideBalance: (v: boolean) => void;
  hideEmail: boolean;
  setHideEmail: (v: boolean) => void;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('user_currency') || 'RUB';
  });
  const [rates, setRates] = useState<Record<string, number>>({ RUB: 1 });

  // 👇 Состояния для глазиков
  const [hideBalance, setHideBalanceState] = useState<boolean>(() => {
    return localStorage.getItem('hide_balance') === 'true';
  });
  const [hideEmail, setHideEmailState] = useState<boolean>(() => {
    return localStorage.getItem('hide_email') === 'true';
  });

  const setHideBalance = (v: boolean) => {
    localStorage.setItem('hide_balance', String(v));
    setHideBalanceState(v);
  };

  const setHideEmail = (v: boolean) => {
    localStorage.setItem('hide_email', String(v));
    setHideEmailState(v);
  };

  const setCurrency = (c: string) => {
    localStorage.setItem('user_currency', c);
    setCurrencyState(c);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/RUB');
        const d = await r.json();
        if (d?.result === 'success') setRates({ RUB: 1, ...d.rates });
      } catch {}
    };
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const convert = (amountRub: number): number => {
    if (currency === 'RUB') return amountRub;
    const rate = rates[currency];
    if (!rate) return amountRub;
    return amountRub * rate;
  };

  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

  const format = (amountRub: number, opts: { showCode?: boolean } = {}): string => {
    const value = convert(amountRub);
    const formatted = value.toLocaleString('ru-RU', {
      maximumFractionDigits: currency === 'RUB' ? 0 : 2,
    });
    return `${formatted} ${opts.showCode ? currency : symbol}`;
  };

  return (
    <Ctx.Provider value={{
      currency, setCurrency, rates, convert, format, symbol,
      hideBalance, setHideBalance, hideEmail, setHideEmail,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCurrency = (): CurrencyCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Безопасный fallback если провайдер не подключён
    return {
      currency: 'RUB', setCurrency: () => {}, rates: { RUB: 1 },
      convert: (x) => x,
      format: (x) => `${x.toLocaleString('ru-RU')} ₽`,
      symbol: '₽',
      hideBalance: false, setHideBalance: () => {},
      hideEmail: false, setHideEmail: () => {},
    };
  }
  return ctx;
};