import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, ShoppingCart, Award, Clock, TrendingUp,
  Shield, MessageSquare, Package,
  CheckCircle2, Edit3, Camera
} from 'lucide-react';
import { currentUser, reviews, topSellers } from '../data/mockData';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'themes' | 'history' | 'bans'>('reviews');

  const stats = [
    { label: 'Покупок', value: currentUser.totalPurchases, icon: ShoppingCart, color: 'text-blue-400' },
    { label: 'Продаж', value: currentUser.totalSales, icon: Package, color: 'text-green-400' },
    { label: 'Рейтинг', value: currentUser.rating, icon: Star, color: 'text-yellow-400' },
    { label: 'На сайте', value: '1г 9м', icon: Clock, color: 'text-purple-400' },
  ];

  const sellerStats = topSellers[0];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden"
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 relative">
          <div className="absolute inset-0 shimmer" />
          <div className="absolute top-3 right-3 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card/80 backdrop-blur rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors border border-purple-900/30"
            >
              <Edit3 size={13} />
              Редактировать
            </motion.button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center avatar-ring border-4 border-bg-card">
                <span className="text-2xl font-bold text-white">{currentUser.avatar}</span>
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <Camera size={12} className="text-white" />
              </button>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-bg-card" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-text-primary">{currentUser.username}</h2>
                <span className="badge">Gold 👑</span>
                <CheckCircle2 size={18} className="text-accent" />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm text-text-secondary">ID: {currentUser.id}</span>
                <span className="text-sm text-text-secondary">•</span>
                <span className="text-sm text-text-secondary">С {currentUser.registeredAt}</span>
                <span className="text-sm text-text-secondary">•</span>
                <span className="text-sm text-success">Онлайн</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Баланс</p>
              <p className="text-2xl font-bold gradient-text">{currentUser.balance.toLocaleString()} ₽</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="bg-bg-primary rounded-xl p-4 border border-purple-900/20 text-center"
              >
                <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Level progress */}
          <div className="bg-bg-primary rounded-xl p-4 border border-purple-900/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-text-primary">Уровень Gold</span>
              </div>
              <span className="text-xs text-text-secondary">До Platinum: 376 продаж</span>
            </div>
            <div className="h-2 bg-purple-900/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '67%' }}
                transition={{ duration: 1, delay: 0.3 }}
                className="progress-bar h-full"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-text-secondary">Gold (124 продажи)</span>
              <span className="text-xs text-text-secondary">Platinum (500 продаж)</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seller stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Продаж за месяц', value: sellerStats.monthlySales, change: '+12%', color: 'text-success' },
          { label: 'Выручка за месяц', value: `${(sellerStats.monthlyRevenue / 1000).toFixed(0)}к ₽`, change: '+8%', color: 'text-success' },
          { label: 'Средняя оценка', value: '4.9 ⭐', change: '+0.1', color: 'text-success' },
          { label: 'Время ответа', value: '< 5 мин', change: 'Отлично', color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07 + 0.1 }}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-4"
          >
            <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className={`text-xs ${stat.color} mt-0.5`}>{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden"
      >
        <div className="flex border-b border-purple-900/20">
          {[
            { id: 'reviews', label: 'Отзывы', icon: Star },
            { id: 'themes', label: 'Темы', icon: MessageSquare },
            { id: 'history', label: 'История блокировок', icon: Shield },
            { id: 'bans', label: 'Активность', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-accent text-accent-soft bg-purple-900/10'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Положительных', value: '97.1%', color: 'text-success' },
                  { label: 'Нейтральных', value: '2.1%', color: 'text-yellow-400' },
                  { label: 'Негативных', value: '0.8%', color: 'text-error' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 bg-bg-primary rounded-xl border border-purple-900/10">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-text-secondary">{stat.label}</p>
                  </div>
                ))}
              </div>
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-bg-primary rounded-xl p-4 border border-purple-900/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{review.authorAvatar}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">{review.author}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">{review.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-secondary">{review.accountTitle}</span>
                        <span className="text-xs text-text-secondary">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-3">
              {['Обмен аккаунтами CS2', 'Вопрос по гарантии', 'Поиск аккаунта Dota 2', 'Проблема с активацией'].map((topic, i) => (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl border border-purple-900/10 hover:border-purple-700/30 transition-all cursor-pointer"
                >
                  <MessageSquare size={16} className="text-accent flex-shrink-0" />
                  <span className="text-sm text-text-primary flex-1">{topic}</span>
                  <span className="text-xs text-text-secondary">{i + 1} дня назад</span>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-8">
              <Shield size={40} className="text-success mx-auto mb-3 opacity-70" />
              <p className="text-text-primary font-semibold">История чистая!</p>
              <p className="text-sm text-text-secondary mt-1">Нет ни одной блокировки или предупреждения</p>
            </div>
          )}

          {activeTab === 'bans' && (
            <div className="space-y-3">
              {[
                { action: 'Продан аккаунт', detail: 'Steam Prime CS2', amount: '+1,850 ₽', time: '2 часа назад', icon: '💰' },
                { action: 'Куплен аккаунт', detail: 'Discord Nitro', amount: '-890 ₽', time: '1 день назад', icon: '🛒' },
                { action: 'Пополнение баланса', detail: 'Банковская карта', amount: '+5,000 ₽', time: '3 дня назад', icon: '💳' },
                { action: 'Продан аккаунт', detail: 'VPN NordVPN', amount: '+2,100 ₽', time: '5 дней назад', icon: '💰' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl border border-purple-900/10"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.action}</p>
                    <p className="text-xs text-text-secondary">{item.detail} • {item.time}</p>
                  </div>
                  <span className={`text-sm font-semibold ${item.amount.startsWith('+') ? 'text-success' : 'text-error'}`}>
                    {item.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
