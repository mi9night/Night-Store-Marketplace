import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface Rate {
  code: string;
  name: string;
  flag: string;
  rateRub: number;        // сколько рублей за 1 единицу валюты
  prev?: number;
}

const CURRENCIES = [
  { code: 'USD', name: 'Доллар США', flag: '🇺🇸' },
  { code: 'EUR', name: 'Евро', flag: '🇪🇺' },
  { code: 'UAH', name: 'Гривна', flag: '🇺🇦' },
  { code: 'KZT', name: 'Тенге', flag: '🇰🇿' },
];

const RatesPage: React.FC = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Конвертер
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('RUB');
  const [amount, setAmount] = useState('100');

  const loadRates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Бесплатное публичное API (без ключа). База — RUB
      const res = await fetch('https://open.er-api.com/v6/latest/RUB');
      const data = await res.json();

      if (data.result !== 'success' || !data.rates) {
        throw new Error('Не удалось загрузить курсы');
      }

      // data.rates содержит сколько единиц валюты за 1 RUB → инвертируем
      const previous = JSON.parse(localStorage.getItem('rates_prev') || '{}');

      const newRates: Rate[] = CURRENCIES.map(c => {
        const rateRub = 1 / data.rates[c.code];
        return {
          ...c,
          rateRub,
          prev: previous[c.code]
        };
      });

      setRates(newRates);
      setUpdatedAt(new Date(data.time_last_update_unix * 1000));

      // Сохраняем для отслеживания тренда
      const toSave: Record<string, number> = {};
      newRates.forEach(r => toSave[r.code] = r.rateRub);
      localStorage.setItem('rates_prev', JSON.stringify(toSave));

    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // Обновляем каждые 5 минут
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* ============ Конвертер ============ */
  const getRubValue = (code: string): number => {
    if (code === 'RUB') return 1;
    return rates.find(r => r.code === code)?.rateRub || 0;
  };

  const fromRub = getRubValue(fromCurrency);
  const toRub = getRubValue(toCurrency);
  const converted = (parseFloat(amount) || 0) * fromRub / toRub;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-white">Курсы валют</h1>
            {updatedAt && (
              <p className="text-xs text-text-secondary mt-0.5">
                Обновлено: {updatedAt.toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        </div>
        <motion.button
          onClick={loadRates}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-900/20 border border-purple-800/30 text-white rounded-xl text-sm hover:border-purple-600/50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </motion.button>
      </motion.div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error p-4 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Курсы относительно рубля */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* RUB как база */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card border border-accent/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇷🇺</span>
              <div>
                <p className="text-sm font-semibold text-white">Рубль</p>
                <p className="text-xs text-text-secondary">RUB · базовая валюта</p>
              </div>
            </div>
            <span className="text-lg font-bold text-accent-soft">1.00</span>
          </div>
        </motion.div>

        {rates.map((r, i) => {
          const trend = r.prev ? (r.rateRub > r.prev ? 'up' : r.rateRub < r.prev ? 'down' : 'same') : 'same';
          const diff = r.prev ? ((r.rateRub - r.prev) / r.prev * 100) : 0;

          return (
            <motion.div
              key={r.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-bg-card border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-text-secondary">{r.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {r.rateRub < 1
                      ? r.rateRub.toFixed(4)
                      : r.rateRub.toFixed(2)} ₽
                  </p>
                  {trend !== 'same' && (
                    <div className={`flex items-center gap-1 justify-end text-xs ${
                      trend === 'up' ? 'text-success' : 'text-error'
                    }`}>
                      {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(diff).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Конвертер */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft size={18} className="text-accent" />
          <h2 className="text-base font-semibold text-white">Конвертер валют</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          {/* From */}
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Из</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              />
              <select
                value={fromCurrency}
                onChange={e => setFromCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              >
                <option value="RUB">🇷🇺 RUB</option>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              const tmp = fromCurrency;
              setFromCurrency(toCurrency);
              setToCurrency(tmp);
            }}
            className="p-3 bg-purple-900/20 hover:bg-purple-900/40 text-accent-soft rounded-xl"
          >
            <ArrowRightLeft size={16} />
          </button>

          {/* To */}
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">В</label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white font-semibold">
                {converted.toFixed(2)}
              </div>
              <select
                value={toCurrency}
                onChange={e => setToCurrency(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              >
                <option value="RUB">🇷🇺 RUB</option>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="text-xs text-text-secondary mt-3 text-center">
          1 {fromCurrency} = {(fromRub / toRub).toFixed(4)} {toCurrency}
        </p>
      </motion.div>

      <p className="text-xs text-text-secondary text-center">
        Данные предоставлены open.er-api.com · обновляются каждые 5 минут
      </p>
    </div>
  );
};

export default RatesPage;
