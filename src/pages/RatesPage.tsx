import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, RefreshCcw } from 'lucide-react';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';
import { exchangeRates } from '../data/mockData';

const RatesPage: React.FC = () => {
  const { currency, setCurrency, symbol } = useCurrency();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Курсы валют и настройки</h1>
      </div>

      {/* Выбор основной валюты */}
      <div className="bg-bg-card border border-purple-900/20 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Основная валюта сайта</h3>
        <p className="text-sm text-text-secondary mb-6">Выберите валюту, в которой будут отображаться все цены на маркете и ваш баланс.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                currency === c.code 
                  ? 'bg-purple-600/20 border-purple-500 text-accent-soft shadow-[0_0_15px_rgba(138,43,226,0.2)]' 
                  : 'bg-bg-secondary border-purple-900/10 text-text-secondary hover:border-purple-700/40'
              }`}
            >
              <span className="text-2xl">{c.flag}</span>
              <span className="text-sm font-bold">{c.code}</span>
              <span className="text-[10px] opacity-60">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Текущие курсы */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exchangeRates.map(rate => (
          <div key={rate.currency} className="bg-bg-card border border-purple-900/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{rate.flag}</span>
              <div>
                <p className="text-sm font-bold text-white">{rate.currency}</p>
                <p className="text-xs text-text-secondary">К рублю (RUB)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white">{rate.rate.toLocaleString('ru-RU')} ₽</p>
              <p className={`text-[10px] font-bold ${rate.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {rate.change >= 0 ? '+' : ''}{rate.change}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-900/10 border border-purple-700/20 rounded-2xl p-4 flex items-center gap-3">
        <RefreshCcw size={16} className="text-purple-400 animate-spin-slow" />
        <p className="text-xs text-purple-300">Курсы обновляются автоматически каждые 5 минут из мировых бирж.</p>
      </div>
    </div>
  );
};

export default RatesPage;
