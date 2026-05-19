import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { exchangeRates } from '../data/mockData';

const ExchangeRates: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-purple-900/20 rounded-2xl p-4"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        💱 Курсы валют
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {exchangeRates.map((rate, i) => (
          <motion.div
            key={rate.currency}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-bg-primary rounded-xl p-3 border border-purple-900/10 text-center"
          >
            <span className="text-lg">{rate.flag}</span>
            <p className="text-sm font-bold text-text-primary mt-1">{rate.currency}</p>
            <p className="text-xs text-text-secondary">
              {rate.currency === 'BTC' ? `${(rate.rate / 1000000).toFixed(2)}M` : rate.rate.toLocaleString()} ₽
            </p>
            <div className={`flex items-center justify-center gap-0.5 mt-1 text-xs ${rate.change > 0 ? 'text-success' : 'text-error'}`}>
              {rate.change > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {rate.change > 0 ? '+' : ''}{rate.change}%
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ExchangeRates;
