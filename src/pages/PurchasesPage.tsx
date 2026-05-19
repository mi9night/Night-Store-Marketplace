import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Download, Star, MessageSquare, Shield, CheckCircle2, Clock } from 'lucide-react';
import { accounts } from '../data/mockData';
import { Account } from '../types';
import { Page } from '../types/pages';

interface PurchasesPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
}

const PurchasesPage: React.FC<PurchasesPageProps> = ({ onSelectAccount, setCurrentPage }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'disputed'>('active');

  const purchases = [
    { ...accounts[0], purchasedAt: '2 часа назад', status: 'active' as const, orderId: '#NS-10847' },
    { ...accounts[2], purchasedAt: '3 дня назад', status: 'completed' as const, orderId: '#NS-10821' },
    { ...accounts[3], purchasedAt: '1 неделю назад', status: 'completed' as const, orderId: '#NS-10798' },
    { ...accounts[1], purchasedAt: '2 недели назад', status: 'disputed' as const, orderId: '#NS-10756' },
  ];

  const filtered = purchases.filter(p =>
    activeTab === 'active' ? p.status === 'active' :
    activeTab === 'completed' ? p.status === 'completed' :
    p.status === 'disputed'
  );

  const statusConfig = {
    active: { label: 'Активен', className: 'risk-low', icon: CheckCircle2 },
    completed: { label: 'Завершён', className: 'badge', icon: CheckCircle2 },
    disputed: { label: 'Спор', className: 'risk-medium', icon: Shield },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <ShoppingBag size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Мои покупки</h1>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всего покупок', value: 47, color: 'text-accent' },
          { label: 'Активных', value: 1, color: 'text-success' },
          { label: 'Потрачено', value: '84,230 ₽', color: 'text-yellow-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-4 text-center"
          >
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900/20">
        {[
          { id: 'active', label: 'Активные', count: 1 },
          { id: 'completed', label: 'Завершённые', count: 2 },
          { id: 'disputed', label: 'Споры', count: 1 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent-soft'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            <span className="badge">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Purchases list */}
      <div className="space-y-3">
        {filtered.map((purchase, i) => {
          const sc = statusConfig[purchase.status];
          return (
            <motion.div
              key={purchase.orderId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">
                    {purchase.category === 'steam' ? '🎮' : purchase.category === 'discord' ? '💬' : purchase.category === 'vpn' ? '🔒' : '📦'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className="text-sm font-semibold text-text-primary hover:text-accent-soft cursor-pointer transition-colors line-clamp-1"
                        onClick={() => { onSelectAccount(purchase); setCurrentPage('product'); }}
                      >
                        {purchase.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">{purchase.orderId} • {purchase.purchasedAt}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sc.className} whitespace-nowrap`}>
                      {sc.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-base font-bold text-text-primary">{purchase.price.toLocaleString()} ₽</span>
                    <span className="text-xs text-text-secondary">Продавец: {purchase.seller.username}</span>
                  </div>

                  {purchase.status === 'active' && (
                    <div className="mt-3 p-3 bg-blue-900/10 border border-blue-800/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={13} className="text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">Гарантийный период активен: {purchase.guaranteeHours}ч</span>
                      </div>
                      <div className="h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '30%' }}
                          transition={{ duration: 1 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-900/20 border border-purple-800/30 rounded-lg text-text-secondary hover:text-text-primary transition-all"
                    >
                      <Download size={12} />
                      Данные
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-900/20 border border-purple-800/30 rounded-lg text-text-secondary hover:text-text-primary transition-all"
                    >
                      <MessageSquare size={12} />
                      Написать
                    </motion.button>
                    {purchase.status === 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-yellow-900/20 border border-yellow-800/30 rounded-lg text-yellow-400 hover:bg-yellow-900/30 transition-all"
                      >
                        <Star size={12} />
                        Отзыв
                      </motion.button>
                    )}
                    {purchase.status === 'active' && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-900/20 border border-red-800/30 rounded-lg text-error hover:bg-red-900/30 transition-all"
                      >
                        <Shield size={12} />
                        Открыть спор
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchasesPage;
