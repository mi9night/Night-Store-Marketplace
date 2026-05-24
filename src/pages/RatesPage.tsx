// src/pages/RatesPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, ArrowLeftRight } from 'lucide-react';

interface Rate {
  code: string;
  name: string;
  flag: string;
  current: number;
  history: number[];
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

  // Калькулятор
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcFrom, setCalcFrom] = useState('USD');
  const [calcTo, setCalcTo] = useState('RUB');

  const fetchRates = async () => {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/RUB');
      const d = await r.json();
      if (d?.result !== 'success') throw new Error();

      const stored = JSON.parse(localStorage.getItem('rates_history') || '{}');
      const newRates: Record<string, Rate> = {};

      CURRENCIES.forEach(c => {
        const inRub = 1 / d.rates[c.code];
        const prev: number[] = stored[c.code] || [];
        // Добавляем только если изменилось или прошло время
        const last = prev[prev.length - 1];
        const history = (last !== undefined && Math.abs(last - inRub) < 0.0001)
          ? prev.slice(-30)
          : [...prev, inRub].slice(-30);
        newRates[c.code] = { code: c.code, name: c.name, flag: c.flag, current: inRub, history };
      });

      const toSave: Record<string, number[]> = {};
      Object.values(newRates).forEach(r => { toSave[r.code] = r.history; });
      localStorage.setItem('rates_history', JSON.stringify(toSave));

      setRates(newRates);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn('Курсы не загрузились');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const t = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Калькулятор
  const getRubRate = (code: string): number => {
    if (code === 'RUB') return 1;
    return rates[code]?.current || 0;
  };

  const calcResult = (() => {
    const amount = parseFloat(calcAmount) || 0;
    const fromRate = getRubRate(calcFrom);
    const toRate = getRubRate(calcTo);
    if (toRate === 0) return 0;
    return (amount * fromRate) / toRate;
  })();

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

      {/* === Калькулятор === */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-700/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Калькулятор валют</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          {/* Откуда */}
          <div>
            <label className="text-[10px] text-text-secondary uppercase mb-1 block">Сумма</label>
            <div className="flex gap-2">
              <input type="number" value={calcAmount}
                onChange={e => setCalcAmount(e.target.value)}
                placeholder="100"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm" />
              <select value={calcFrom} onChange={e => setCalcFrom(e.target.value)}
                className="px-2 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm">
                <option value="RUB">🇷🇺 RUB</option>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
          </div>

          {/* Стрелка / своп */}
          <button onClick={() => { const t = calcFrom; setCalcFrom(calcTo); setCalcTo(t); }}
            className="hidden sm:block p-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg mb-0">
            <ArrowLeftRight size={16} />
          </button>

          {/* Куда */}
          <div>
            <label className="text-[10px] text-text-secondary uppercase mb-1 block">Получится</label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm font-bold">
                {calcResult.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
              </div>
              <select value={calcTo} onChange={e => setCalcTo(e.target.value)}
                className="px-2 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm">
                <option value="RUB">🇷🇺 RUB</option>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-text-secondary mt-2">
          Курс: 1 {calcFrom} = {(getRubRate(calcFrom) / getRubRate(calcTo)).toFixed(4)} {calcTo}
        </p>
      </motion.div>

      {/* === Сетка валют === */}
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

            // Реальный график с точками
            const w = 200, h = 60;
            const min = Math.min(...r.history);
            const max = Math.max(...r.history);
            const range = max - min || 1;
            const pad = 5;
            const innerH = h - pad * 2;
            const innerW = w - pad * 2;

            const points = r.history.map((v, idx) => {
              const x = pad + (idx / Math.max(r.history.length - 1, 1)) * innerW;
              const y = pad + innerH - ((v - min) / range) * innerH;
              return { x, y, v };
            });

            const pathLine = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
            const pathArea = `${pathLine} L ${points[points.length - 1]?.x || 0},${h - pad} L ${pad},${h - pad} Z`;

            const lineColor = isUp ? '#22c55e' : isDown ? '#ef4444' : '#a855f7';

            return (
              <motion.div key={r.code}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#171425] border border-purple-900/20 rounded-xl p-3 hover:border-purple-700/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{r.flag}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.code}</p>
                      <p className="text-xs text-text-secondary">{r.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {r.current.toFixed(2)} <span className="text-sm text-text-secondary">₽</span>
                    </p>
                    {Math.abs(diff) > 0.001 && (
                      <p className={`text-xs flex items-center justify-end gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {diffPct.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Реальный график */}
                {r.history.length > 1 ? (
                  <svg width="100%" height="60" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2">
                    <defs>
                      <linearGradient id={`grad-${r.code}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Сетка */}
                    <line x1={pad} y1={h/2} x2={w-pad} y2={h/2} stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
                    {/* Заливка */}
                    <path d={pathArea} fill={`url(#grad-${r.code})`} />
                    {/* Линия */}
                    <path d={pathLine} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Точки */}
                    {points.map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r={idx === points.length - 1 ? 3 : 1.5} fill={lineColor} />
                    ))}
                  </svg>
                ) : (
                  <div className="h-[60px] flex items-center justify-center text-[10px] text-text-secondary">
                    Накапливается история...
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-text-secondary text-center">
        💡 Обновление раз в 5 минут · история {Object.values(rates)[0]?.history.length || 0} точек
      </div>
    </div>
  );
};

export default RatesPage;
