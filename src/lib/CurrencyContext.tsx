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
}

const Ctx = createContext<CurrencyCtx | null>(null);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('user_currency') || 'RUB';
  });
  const [rates, setRates] = useState<Record<string, number>>({ RUB: 1 });

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
    <Ctx.Provider value={{ currency, setCurrency, rates, convert, format, symbol }}>
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
    };
  }
  return ctx;
};
