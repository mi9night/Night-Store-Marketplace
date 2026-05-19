import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertCircle, Plus } from 'lucide-react';

const AutobuyPage: React.FC = () => {
  const [autobuyRules, setAutobuyRules] = useState([
    { id: '1', name: 'Автопокупка золотых аккаунтов', enabled: true, condition: 'Уровень: Золото', action: 'Покупка' },
    { id: '2', name: 'Покупка при скидке > 20%', enabled: true, condition: 'Скидка: > 20%', action: 'Уведомление' },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Zap size={24} className="text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Автопокупки</h1>
          <p className="text-text-secondary">Настройте правила для автоматической покупки аккаунтов при нужных условиях.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
      >
        <div className="bg-bg-primary border border-purple-900/20 rounded-2xl p-4 flex items-start gap-4">
          <AlertCircle size={20} className="text-accent-soft mt-1" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Требуется верификация</p>
            <p className="text-xs text-text-secondary">Для использования автопокупок необходимо пройти верификацию профиля и иметь баланс не менее 1000₽.</p>
          </div>
        </div>

        <div className="space-y-4">
          {autobuyRules.map(rule => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 p-4 bg-bg-primary rounded-2xl border border-purple-900/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{rule.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
                    <span>Условие: {rule.condition}</span>
                    <span>Действие: {rule.action}</span>
                  </div>
                </div>
                <div
                  onClick={() => setAutobuyRules(prev => prev.map(item => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${rule.enabled ? 'bg-accent' : 'bg-purple-900/40'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${rule.enabled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button className="btn-primary px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Plus size={16} />
            Создать новое правило
          </button>
          <button className="btn-primary px-4 py-3 rounded-xl text-sm font-semibold">
            Сохранить изменения
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AutobuyPage;
