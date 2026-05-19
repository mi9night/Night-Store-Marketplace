import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, CheckCircle2, Award, Zap, ThumbsUp, ShoppingCart, Shield, CheckSquare, Sparkles, LogIn } from 'lucide-react';
import { topSellers } from '../data/mockData';

const levelColors = {
  newbie: 'text-gray-400', bronze: 'text-amber-600', silver: 'text-gray-300',
  gold: 'text-yellow-400', platinum: 'text-cyan-400', diamond: 'text-purple-400',
};
const levelLabels = {
  newbie: 'Новичок', bronze: 'Бронза', silver: 'Серебро',
  gold: 'Золото', platinum: 'Платина', diamond: 'Бриллиант',
};

const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-text-secondary', 'text-text-secondary'];
const rankBg = ['bg-yellow-400/10 border-yellow-400/30', 'bg-gray-300/10 border-gray-300/30', 'bg-amber-600/10 border-amber-600/30', 'bg-purple-900/20 border-purple-900/20', 'bg-purple-900/20 border-purple-900/20'];

const TopSellersPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy size={32} className="text-yellow-400" />
          <h1 className="text-3xl font-bold gradient-text">Топ продавцы</h1>
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <p className="text-text-secondary">Лучшие продавцы платформы за последние 30 дней</p>
      </motion.div>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-end justify-center gap-4 mb-8"
      >
        {[topSellers[1], topSellers[0], topSellers[2]].map((seller, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          const heights = ['h-28', 'h-36', 'h-24'];
          return (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`flex flex-col items-center gap-3 flex-1 max-w-[160px]`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center ${actualRank === 1 ? 'avatar-ring' : 'border-2 border-purple-800/40'}`}>
                    <span className="text-base font-bold text-white">{seller.avatar}</span>
                  </div>
                  {actualRank <= 3 && (
                    <span className="absolute -top-2 -right-2 text-base">
                      {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-text-primary text-center truncate max-w-[140px]">{seller.username}</span>
                <span className="text-xs text-success font-medium">{seller.monthlySales} продаж</span>
              </div>
              <div className={`w-full ${heights[i]} bg-gradient-to-t from-purple-900/40 to-purple-800/20 border ${rankBg[actualRank - 1].split(' ')[1]} rounded-t-xl flex items-center justify-center`}>
                <span className={`text-2xl font-black ${rankColors[actualRank - 1]}`}>#{actualRank}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Full list */}
      <div className="space-y-3">
        {topSellers.map((seller, i) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.3 }}
            className={`bg-bg-card border rounded-2xl p-4 ${rankBg[i]} hover:border-purple-700/40 transition-all cursor-pointer card-hover`}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${rankColors[i]}`}>
                {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : `#${seller.rank}`}
              </div>

              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center avatar-ring">
                  <span className="text-base font-bold text-white">{seller.avatar}</span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-card ${seller.isOnline ? 'bg-success' : 'bg-gray-500'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{seller.username}</span>
                  {seller.isVerified && <CheckCircle2 size={14} className="text-accent" />}
                  <span className={`text-xs ${levelColors[seller.level]}`}>
                    [{levelLabels[seller.level]}]
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-text-primary">{seller.rating}</span>
                  </div>
                  <span className="text-xs text-text-secondary">{seller.positivePercent}% положит.</span>
                  <span className="text-xs text-text-secondary">С {seller.registeredAt}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-base font-bold text-text-primary">{seller.monthlySales}</p>
                  <p className="text-xs text-text-secondary">Продаж/мес</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-success">{(seller.monthlyRevenue / 1000).toFixed(0)}к ₽</p>
                  <p className="text-xs text-text-secondary">Выручка</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-text-primary">{seller.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary">Всего продаж</p>
                </div>
              </div>

              {/* Action */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex btn-primary items-center gap-2 px-4 py-2 rounded-xl text-sm"
              >
                <Zap size={14} />
                Смотреть
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Levels info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-text-primary">Как начисляется опыт (XP)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: ThumbsUp, label: 'Положительный отзыв', xp: '+50 XP', color: 'text-success' },
            { icon: ShoppingCart, label: 'Успешная продажа', xp: '+100 XP', color: 'text-accent-soft' },
            { icon: Shield, label: 'Завершение гарантии', xp: '+25 XP', color: 'text-blue-400' },
            { icon: CheckSquare, label: 'Верификация профиля', xp: '+200 XP', color: 'text-yellow-400' },
            { icon: Award, label: 'Участие в промо', xp: '+150 XP', color: 'text-purple-400' },
            { icon: LogIn, label: 'Ежедневный вход', xp: '+5 XP', color: 'text-cyan-400' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.5 }}
              className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl border border-purple-900/10 hover:border-purple-700/40 transition-all"
            >
              <div className="flex-shrink-0">
                <item.icon size={20} className={item.color} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-text-secondary">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.xp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Levels info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} className="text-accent" />
          <h3 className="text-base font-semibold text-text-primary">Система уровней продавцов</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(levelLabels).map(([key, label], index) => {
            const sales = key === 'newbie' ? '0-50' : key === 'bronze' ? '50-200' : key === 'silver' ? '200-500' : key === 'gold' ? '500-1000' : key === 'platinum' ? '1000-2500' : '2500+';
            const levelColorBg = key === 'newbie' ? 'bg-gray-500/10 border-gray-500/30' : key === 'bronze' ? 'bg-amber-600/10 border-amber-600/30' : key === 'silver' ? 'bg-gray-300/10 border-gray-300/30' : key === 'gold' ? 'bg-yellow-400/10 border-yellow-400/30' : key === 'platinum' ? 'bg-cyan-400/10 border-cyan-400/30' : 'bg-purple-400/10 border-purple-400/30';
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`flex items-center justify-between p-4 bg-bg-primary rounded-xl border ${levelColorBg} hover:border-purple-700/40 transition-all card-hover`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-black ${levelColors[key as keyof typeof levelColors]}`}>
                    {key === 'newbie' ? '⭐' : key === 'bronze' ? '🥉' : key === 'silver' ? '🏅' : key === 'gold' ? '🌟' : key === 'platinum' ? '💎' : '👑'}
                  </div>
                  <div>
                    <p className={`text-base font-bold ${levelColors[key as keyof typeof levelColors]} mb-0.5`}>{label}</p>
                    <p className="text-xs text-text-secondary">{sales} продаж</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary">Преимущества:</span>
                  {key === 'newbie' && <span className="text-xs text-text-secondary">Базовые возможности</span>}
                  {key === 'bronze' && <span className="text-xs text-text-secondary">Доступ к API</span>}
                  {key === 'silver' && <span className="text-xs text-text-secondary">Приоритет поддержки</span>}
                  {key === 'gold' && <span className="text-xs text-text-secondary">Премиум значок</span>}
                  {key === 'platinum' && <span className="text-xs text-text-secondary">Консьерж сервис</span>}
                  {key === 'diamond' && <span className="text-xs text-text-secondary">ВИП статус</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default TopSellersPage;
