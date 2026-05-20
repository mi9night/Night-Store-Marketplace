import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, CheckCircle2, ShoppingCart, Award, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Seller {
  id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  sales?: number;
  rating?: number;
  positive_reviews?: number;
  verified?: boolean;
  level?: number;
}

const levelLabels: Record<number, string> = {
  1: 'Новичок', 2: 'Бронза', 3: 'Серебро', 4: 'Золото', 5: 'Платина', 6: 'Бриллиант',
};
const levelColors: Record<number, string> = {
  1: 'text-gray-400', 2: 'text-amber-600', 3: 'text-gray-300',
  4: 'text-yellow-400', 5: 'text-cyan-400', 6: 'text-purple-400',
};

const TopSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Берём топ по продажам
        const { data, error } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, sales, rating, positive_reviews, verified, level')
          .gt('sales', 0)
          .order('sales', { ascending: false })
          .limit(20);

        if (error) throw error;
        setSellers(data || []);
      } catch (e) {
        console.warn('Top sellers error:', e);
        setSellers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-text-secondary">Загрузка...</div>;
  }

  const top3 = sellers.slice(0, 3);
  const rest = sellers.slice(3);

  const getDisplayName = (s: Seller) => s.username || s.email?.split('@')[0] || 'User';
  const getAvatarLetter = (s: Seller) => (getDisplayName(s)[0] || 'U').toUpperCase();

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

      {sellers.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <Trophy size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Пока нет продавцов</h3>
          <p className="text-sm text-text-secondary">
            Топ появится, когда кто-то совершит первую продажу
          </p>
        </div>
      ) : (
        <>
          {/* Подиум — топ 3 */}
          {top3.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-end justify-center gap-3 sm:gap-4 mb-8"
            >
              {/* #2, #1, #3 */}
              {[top3[1], top3[0], top3[2]].map((seller, i) => {
                if (!seller) return null;
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ['h-24', 'h-36', 'h-20'];
                const medals = ['🥈', '🥇', '🥉'];
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
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden ${
                          actualRank === 1 ? 'shadow-[0_0_30px_rgba(250,204,21,0.5)] border-2 border-yellow-400' : 'border-2 border-purple-800/40'
                        }`}>
                          {seller.avatar_url ? (
                            <img src={seller.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-white">{getAvatarLetter(seller)}</span>
                          )}
                        </div>
                        <span className="absolute -top-3 -right-2 text-2xl">{medals[i]}</span>
                      </div>
                      <span className="text-sm font-semibold text-white text-center truncate max-w-[140px]">
                        {getDisplayName(seller)}
                      </span>
                      <span className="text-xs text-green-400 font-medium">{seller.sales || 0} продаж</span>
                    </div>
                    <div className={`w-full ${heights[i]} bg-gradient-to-t from-purple-900/40 to-purple-800/20 border ${
                      actualRank === 1 ? 'border-yellow-400/40' : actualRank === 2 ? 'border-gray-300/30' : 'border-amber-600/30'
                    } rounded-t-xl flex items-center justify-center`}>
                      <span className={`text-2xl sm:text-3xl font-black ${
                        actualRank === 1 ? 'text-yellow-400' : actualRank === 2 ? 'text-gray-300' : 'text-amber-600'
                      }`}>#{actualRank}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Полный список */}
          <div className="space-y-3">
            {sellers.map((seller, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-[#171425] border rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-purple-700/40 ${
                    isTop3 ? 'border-purple-700/40' : 'border-purple-900/20'
                  }`}
                >
                  {/* Ранг */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    rank === 1 ? 'bg-yellow-400/20 text-yellow-400' :
                    rank === 2 ? 'bg-gray-300/20 text-gray-300' :
                    rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                    'bg-purple-900/30 text-text-secondary'
                  }`}>
                    #{rank}
                  </div>

                  {/* Аватар */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{getAvatarLetter(seller)}</span>
                    )}
                  </div>

                  {/* Имя + уровень */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">{getDisplayName(seller)}</p>
                      {seller.verified && <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <Award size={11} className={levelColors[seller.level || 1] || 'text-gray-400'} />
                      <span className={levelColors[seller.level || 1] || 'text-gray-400'}>
                        {levelLabels[seller.level || 1] || 'Новичок'}
                      </span>
                    </div>
                  </div>

                  {/* Статы */}
                  <div className="hidden sm:flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star size={11} className="fill-yellow-400" />
                        <span className="font-bold">{(Number(seller.rating) || 0).toFixed(1)}</span>
                      </div>
                      <p className="text-text-secondary text-[10px] mt-0.5">Рейтинг</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-400">
                        <ThumbsUp size={11} />
                        <span className="font-bold">{seller.positive_reviews || 0}</span>
                      </div>
                      <p className="text-text-secondary text-[10px] mt-0.5">Отзывы</p>
                    </div>
                  </div>

                  {/* Продажи */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <ShoppingCart size={13} className="text-purple-400" />
                      <span className="text-lg font-bold text-white">{seller.sales || 0}</span>
                    </div>
                    <p className="text-text-secondary text-[10px]">продаж</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TopSellersPage;
