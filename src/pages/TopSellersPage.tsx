import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Star, CheckCircle2, Award, Zap, ThumbsUp,
  ShoppingCart, Shield, CheckSquare, Sparkles, LogIn
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/ModerationPanel';

interface Seller {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  avatar_url?: string;
  sales?: number;
  rating?: number;
  positive_reviews?: number;
  verified?: boolean;
  level?: number;
  role?: string;
  created_at?: string;
  xp?: number;
}

const levelKeyByNum: Record<number, string> = {
  1: 'newbie', 2: 'bronze', 3: 'silver', 4: 'gold', 5: 'platinum', 6: 'diamond',
};

const levelColors: Record<string, string> = {
  newbie: 'text-gray-400', bronze: 'text-amber-600', silver: 'text-gray-300',
  gold: 'text-yellow-400', platinum: 'text-cyan-400', diamond: 'text-purple-400',
};
const levelLabels: Record<string, string> = {
  newbie: 'Новичок', bronze: 'Бронза', silver: 'Серебро',
  gold: 'Золото', platinum: 'Платина', diamond: 'Бриллиант',
};

const rankColors = [
  'text-yellow-400', 'text-gray-300', 'text-amber-600',
  'text-text-secondary', 'text-text-secondary',
];
const rankBg = [
  'bg-yellow-400/10 border-yellow-400/30',
  'bg-gray-300/10 border-gray-300/30',
  'bg-amber-600/10 border-amber-600/30',
  'bg-purple-900/20 border-purple-900/20',
  'bg-purple-900/20 border-purple-900/20',
];

const TopSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, sales, rating, positive_reviews, verified, level, role, created_at, xp')
          .gt('sales', 0)
          .order('sales', { ascending: false })
          .limit(20);
        setSellers(data || []);
      } catch (e) {
        setSellers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getName = (s: Seller) => s.username || s.email?.split('@')[0] || 'User';
  const getAvatarLetter = (s: Seller) => (getName(s)[0] || 'U').toUpperCase();
  const getLevelKey = (s: Seller) => levelKeyByNum[s.level || 1] || 'newbie';
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : '';

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Топ продавцы
          </h1>
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <p className="text-text-secondary">Лучшие продавцы платформы</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : sellers.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <Trophy size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Пока нет продавцов</h3>
          <p className="text-sm text-text-secondary">Топ появится, когда кто-то совершит первую продажу</p>
        </div>
      ) : (
        <>
          {/* Подиум — топ 3 */}
          {sellers.length >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-3 sm:gap-4 mb-8"
            >
              {[sellers[1], sellers[0], sellers[2]].map((seller, i) => {
                if (!seller) return <div key={i} className="flex-1 max-w-[160px]" />;
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ['h-28', 'h-36', 'h-24'];
                return (
                  <motion.div
                    key={seller.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex flex-col items-center gap-3 flex-1 max-w-[160px]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden ${
                          actualRank === 1
                            ? 'shadow-[0_0_30px_rgba(250,204,21,0.5)] border-2 border-yellow-400'
                            : 'border-2 border-purple-800/40'
                        }`}>
                          {seller.avatar_url ? (
                            <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-white">{getAvatarLetter(seller)}</span>
                          )}
                        </div>
                        <span className="absolute -top-2 -right-2 text-base">
                          {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white text-center truncate max-w-[140px]">
                        {getName(seller)}
                      </span>
                      <span className="text-xs text-green-400 font-medium">
                        {seller.sales || 0} продаж
                      </span>
                    </div>
                    <div className={`w-full ${heights[i]} bg-gradient-to-t from-purple-900/40 to-purple-800/20 border ${rankBg[actualRank - 1].split(' ')[1]} rounded-t-xl flex items-center justify-center`}>
                      <span className={`text-2xl font-black ${rankColors[actualRank - 1]}`}>
                        #{actualRank}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Полный список */}
          <div className="space-y-3">
            {sellers.map((seller, i) => {
              const levelKey = getLevelKey(seller);
              return (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.3 }}
                  className={`bg-[#171425] border rounded-2xl p-4 ${rankBg[Math.min(i, 4)]} hover:border-purple-700/40 transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${rankColors[Math.min(i, 4)]}`}>
                      {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : `#${i + 1}`}
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
                        {seller.avatar_url ? (
                          <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-bold text-white">{getAvatarLetter(seller)}</span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white truncate">{getName(seller)}</span>
                        {seller.verified && <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />}
                        <RoleBadge role={seller.role} />
                        <span className={`text-xs ${levelColors[levelKey]}`}>
                          [{levelLabels[levelKey]}]
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-white">{(Number(seller.rating) || 0).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {seller.positive_reviews || 0} полож. отзывов
                        </span>
                        {seller.created_at && (
                          <span className="text-xs text-text-secondary">С {formatDate(seller.created_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-base font-bold text-white">{seller.sales || 0}</p>
                        <p className="text-xs text-text-secondary">Продаж</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-green-400">{seller.xp || 0}</p>
                        <p className="text-xs text-text-secondary">XP</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Как начисляется XP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-purple-400" />
          <h3 className="text-base font-semibold text-white">Как начисляется опыт (XP)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: ThumbsUp,    label: 'Положительный отзыв',  xp: '+50 XP',  color: 'text-green-400' },
            { icon: ShoppingCart, label: 'Успешная продажа',     xp: '+100 XP', color: 'text-purple-300' },
            { icon: Shield,      label: 'Завершение гарантии',  xp: '+25 XP',  color: 'text-blue-400' },
            { icon: CheckSquare, label: 'Верификация профиля', xp: '+200 XP', color: 'text-yellow-400' },
            { icon: Award,       label: 'Участие в промо',     xp: '+150 XP', color: 'text-purple-400' },
            { icon: LogIn,       label: 'Ежедневный вход',     xp: '+5 XP',   color: 'text-cyan-400' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.5 }}
              className="flex items-center gap-3 p-3 bg-[#0B0A12] rounded-xl border border-purple-900/10 hover:border-purple-700/40 transition-all"
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

      {/* Система уровней */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} className="text-purple-400" />
          <h3 className="text-base font-semibold text-white">Система уровней продавцов</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(levelLabels).map(([key, label], index) => {
            const sales =
              key === 'newbie' ? '0-50' :
              key === 'bronze' ? '50-200' :
              key === 'silver' ? '200-500' :
              key === 'gold' ? '500-1000' :
              key === 'platinum' ? '1000-2500' : '2500+';

            const levelColorBg =
              key === 'newbie' ? 'bg-gray-500/10 border-gray-500/30' :
              key === 'bronze' ? 'bg-amber-600/10 border-amber-600/30' :
              key === 'silver' ? 'bg-gray-300/10 border-gray-300/30' :
              key === 'gold' ? 'bg-yellow-400/10 border-yellow-400/30' :
              key === 'platinum' ? 'bg-cyan-400/10 border-cyan-400/30' :
              'bg-purple-400/10 border-purple-400/30';

            const benefits: Record<string, string> = {
              newbie: 'Базовые возможности',
              bronze: 'Доступ к API',
              silver: 'Приоритет поддержки',
              gold: 'Премиум значок',
              platinum: 'Консьерж сервис',
              diamond: 'VIP статус',
            };

            const icons: Record<string, string> = {
              newbie: '⭐', bronze: '🥉', silver: '🏅',
              gold: '🌟', platinum: '💎', diamond: '👑',
            };

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`flex items-center justify-between p-4 bg-[#0B0A12] rounded-xl border ${levelColorBg} hover:border-purple-700/40 transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-black ${levelColors[key]}`}>{icons[key]}</div>
                  <div>
                    <p className={`text-base font-bold ${levelColors[key]} mb-0.5`}>{label}</p>
                    <p className="text-xs text-text-secondary">{sales} продаж</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary">Преимущество:</span>
                  <span className="text-xs text-white">{benefits[key]}</span>
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
