import React from 'react';
import { motion } from 'framer-motion';
import { Code, Clock, Sparkles, ShieldCheck, Webhook, KeyRound } from 'lucide-react';

const plannedFeatures = [
  { icon: KeyRound, title: 'API-ключи', desc: 'Безопасное создание и отзыв токенов доступа' },
  { icon: Webhook, title: 'Webhooks', desc: 'Уведомления о заказах, продажах и сообщениях' },
  { icon: ShieldCheck, title: 'Лимиты и защита', desc: 'Rate limits, права доступа и журнал действий' },
];

const ApiPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#171425] border border-purple-900/20 rounded-2xl p-8 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-bg-primary pointer-events-none" />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.2, 0.55, 0.2], scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(168,85,247,0.18)]">
            <Code size={30} className="text-accent-soft" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/20 border border-purple-700/30 text-purple-300 text-xs font-semibold mb-3">
            <Clock size={13} /> Скоро будет
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">API доступ</h1>
          <p className="text-sm text-text-secondary max-w-xl">
            Раздел API находится в разработке. Здесь появятся ключи, webhooks и инструменты автоматизации для продавцов Night Store.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plannedFeatures.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4 hover:border-purple-700/40 transition-all"
          >
            <item.icon size={20} className="text-accent-soft mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-purple-900/10 border border-purple-700/25 rounded-2xl p-4 flex items-start gap-3"
      >
        <Sparkles size={18} className="text-accent-soft mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-secondary">
          Когда API будет готов, здесь появится документация и генератор ключей. Сейчас раздел закрыт, чтобы не показывать неработающие эндпоинты.
        </p>
      </motion.div>
    </div>
  );
};

export default ApiPage;
