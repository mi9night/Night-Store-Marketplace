// src/pages/RatesPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Rate {
  code: string;
  name: string;
  flag: string;
  current: number;        // сколько ₽ за 1 единицу
  history: number[];      // последние значения
}

const CURRENCIES = [
  { code: 'USD', name: 'Доллар США', flag: '🇺🇸' },
  { code: 'EUR', name: 'Евро',       flag: '🇪🇺' },
  { code: 'UAH', name: 'Гривна',     flag: '🇺🇦' },
  { code: 'KZT', name: 'Тенге',      flag: '🇰🇿' },
  { code: 'BYN', name: 'Бел. рубль', flag: '🇧🇾' },
  { code: 'CNY', name: 'Юань',       flag: '🇨🇳' },
];

const RatesPage: React.FC = () => {
  const [rates, setRates] = useState<Record<string, Rate>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = async () => {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/RUB');
      const d = await r.json();
      if (d?.result !== 'success') throw new Error();

      const stored = JSON.parse(localStorage.getItem('rates_history') || '{}');
      const newRates: Record<string, Rate> = {};

      CURRENCIES.forEach(c => {
        const inRub = 1 / d.rates[c.code];
        const prevHistory: number[] = stored[c.code] || [];
        const history = [...prevHistory, inRub].slice(-20);
        newRates[c.code] = { code: c.code, name: c.name, flag: c.flag, current: inRub, history };
      });

      // Сохраняем историю
      const toSave: Record<string, number[]> = {};
      Object.values(newRates).forEach(r => { toSave[r.code] = r.history; });
      localStorage.setItem('rates_history', JSON.stringify(toSave));

      setRates(newRates);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn('Не удалось загрузить курсы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const t = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Курсы валют</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-text-secondary">
              Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
            </span>
          )}
          <button onClick={fetchRates} disabled={loading}
            className="p-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {loading && Object.keys(rates).length === 0 ? (
        <div className="text-center py-12 text-text-secondary">Загрузка курсов...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(rates).map((r, i) => {
            const prev = r.history.length > 1 ? r.history[r.history.length - 2] : r.current;
            const diff = r.current - prev;
            const diffPct = prev > 0 ? (diff / prev) * 100 : 0;
            const isUp = diff > 0;
            const isDown = diff < 0;

            // SVG спарклайн
            const w = 100, h = 30;
            const min = Math.min(...r.history);
            const max = Math.max(...r.history);
            const range = max - min || 1;
            const points = r.history.map((v, idx) => {
              const x = (idx / Math.max(r.history.length - 1, 1)) * w;
              const y = h - ((v - min) / range) * h;
              return `${x},${y}`;
            }).join(' ');

            const lineColor = isUp ? '#22c55e' : isDown ? '#ef4444' : '#a855f7';

            return (
              <motion.div key={r.code}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#171425] border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{r.flag}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.code}</p>
                        <p className="text-xs text-text-secondary">{r.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {r.current.toFixed(2)} <span className="text-sm text-text-secondary">₽</span>
                    </p>
                    {Math.abs(diff) > 0.001 && (
                      <p className={`text-xs flex items-center justify-end gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {diff > 0 ? '+' : ''}{diff.toFixed(3)} ({diffPct.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                </div>

                {/* Маленький график под ценой */}
                {r.history.length > 1 && (
                  <svg width="100%" height="24" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-1">
                    <defs>
                      <linearGradient id={`grad-${r.code}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${r.code})`} />
                    <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" />
                  </svg>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-text-secondary text-center">
        💡 Обновление раз в 5 минут
      </div>
    </div>
  );
};

export default RatesPage;
