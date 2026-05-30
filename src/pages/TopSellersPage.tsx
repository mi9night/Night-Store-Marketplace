import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Star, CheckCircle2, Award, ThumbsUp,
  ShoppingCart, Shield, CheckSquare, Sparkles, Gift, Send, Crown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/RoleBadge';
import { LevelBadge } from '../components/LevelBadge';
import { UserLink } from '../components/UserLink';

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
  role?: string;
  created_at?: string;
  xp?: number;
  custom_roles?: any[];
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

const rankStyles: Record<number, { text: string; border: string; glow: string; gradient: string; icon: string }> = {
  1: {
    text: 'text-yellow-300', border: 'border-yellow-400/50', glow: 'shadow-[0_0_32px_rgba(250,204,21,0.26)]',
    gradient: 'from-yellow-500/28 via-amber-500/14 to-[#171425]', icon: '🥇',
  },
  2: {
    text: 'text-gray-200', border: 'border-gray-300/40', glow: 'shadow-[0_0_28px_rgba(209,213,219,0.14)]',
    gradient: 'from-gray-300/22 via-slate-400/10 to-[#171425]', icon: '🥈',
  },
  3: {
    text: 'text-amber-500', border: 'border-amber-600/45', glow: 'shadow-[0_0_28px_rgba(217,119,6,0.16)]',
    gradient: 'from-amber-700/24 via-orange-500/10 to-[#171425]', icon: '🥉',
  },
};

const xpLevel = (xp = 0) => Math.floor(Math.sqrt(xp / 50)) + 1;

const TopSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, sales, rating, positive_reviews, verified, level, role, created_at, xp, custom_role_label, custom_role_icon, custom_role_color')
          .gt('sales', 0)
          .order('sales', { ascending: false })
          .limit(20);

        if (data && data.length > 0) {
          const ids = data.map((u: any) => u.id);
          const [crRes, revRes] = await Promise.all([
            supabase.from('user_custom_roles').select('user_id, id, label, icon, color, description, has_glow, has_pulse').in('user_id', ids),
            supabase.from('reviews').select('target_user_id, rating, positive').in('target_user_id', ids),
          ]);

          const crMap: Record<string, any[]> = {};
          crRes.data?.forEach((cr: any) => {
            if (!crMap[cr.user_id]) crMap[cr.user_id] = [];
            crMap[cr.user_id].push({ id: cr.id, label: cr.label, icon: cr.icon, color: cr.color, description: cr.description, has_glow: cr.has_glow, has_pulse: cr.has_pulse });
          });

          const revBy: Record<string, any[]> = {};
          revRes.data?.forEach((r: any) => {
            if (!revBy[r.target_user_id]) revBy[r.target_user_id] = [];
            revBy[r.target_user_id].push(r);
          });

          data.forEach((u: any) => {
            u.custom_roles = crMap[u.id] || [];
            const revs = revBy[u.id] || [];
            let realRating = Number(u.rating) || 0;
            if (realRating === 0 && revs.length > 0) {
              const withRating = revs.filter(r => r.rating);
              realRating = withRating.length > 0
                ? withRating.reduce((sum, r) => sum + r.rating, 0) / withRating.length
                : revs.reduce((sum, r) => sum + (r.positive ? 5 : 1), 0) / revs.length;
            }
            u.rating = realRating;
            u.positive_reviews = revs.filter(r => r.positive).length;
          });
        }

        setSellers(data || []);
      } catch {
        setSellers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const podium = useMemo(() => {
    if (sellers.length === 1) return [{ seller: sellers[0], rank: 1, height: 'h-36' }];
    if (sellers.length === 2) return [
      { seller: sellers[1], rank: 2, height: 'h-28' },
      { seller: sellers[0], rank: 1, height: 'h-36' },
    ];
    return [
      { seller: sellers[1], rank: 2, height: 'h-28' },
      { seller: sellers[0], rank: 1, height: 'h-40' },
      { seller: sellers[2], rank: 3, height: 'h-24' },
    ].filter(item => item.seller);
  }, [sellers]);

  const getName = (s: Seller) => s.username || s.email?.split('@')[0] || 'User';
  const getAvatarLetter = (s: Seller) => (getName(s)[0] || 'U').toUpperCase();
  const getLevelKey = (s: Seller) => levelKeyByNum[s.level || 1] || 'newbie';
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : '';

  const PodiumCard: React.FC<{ seller: Seller; rank: number; height: string; index: number }> = ({ seller, rank, height, index }) => {
    const style = rankStyles[rank];
    const name = getName(seller);
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 + 0.15 }}
        className="flex flex-col items-center gap-3 flex-1 min-w-0 max-w-[190px]"
      >
        <div className="relative flex flex-col items-center gap-2 w-full">
          <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden border-2 ${style.border} ${style.glow}`}>
            {seller.avatar_url ? (
              <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-black text-white">{getAvatarLetter(seller)}</span>
            )}
            {rank === 1 && <Crown size={17} className="absolute -top-0.5 -right-0.5 text-yellow-300 fill-yellow-300" />}
          </div>
          <span className="absolute top-10 right-[calc(50%-42px)] text-base drop-shadow-lg">{style.icon}</span>
          <UserLink userId={seller.id} username={name} className="text-sm font-semibold text-white text-center truncate max-w-full" />
          <span className="text-xs text-green-400 font-semibold">{seller.sales || 0} продаж</span>
        </div>

        <div className={`relative w-full ${height} rounded-t-2xl border ${style.border} bg-gradient-to-t ${style.gradient} flex items-center justify-center overflow-hidden ${style.glow}`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <span className={`text-3xl font-black ${style.text}`}>#{rank}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#171425] border border-purple-900/20 rounded-2xl p-6 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/25 via-transparent to-bg-primary" />
        <div className="relative z-10 flex items-center justify-center gap-3 mb-3">
          <Trophy size={30} className="text-yellow-400 fill-yellow-400" />
          <h1
            className="text-3xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FDE047, #A855F7, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Топ продавцы
          </h1>
          <Trophy size={30} className="text-yellow-400 fill-yellow-400" />
        </div>
        <p className="relative z-10 text-text-secondary">Лучшие продавцы платформы Night Store</p>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 overflow-hidden"
          >
            <div className={`flex items-end ${podium.length === 1 ? 'justify-center' : 'justify-center'} gap-4 sm:gap-6 min-h-[260px]`}>
              {podium.map((item, i) => (
                <PodiumCard key={item.seller.id} seller={item.seller} rank={item.rank} height={item.height} index={i} />
              ))}
            </div>
          </motion.div>

          <div className="space-y-3">
            {sellers.map((seller, i) => {
              const levelKey = getLevelKey(seller);
              const rank = i + 1;
              const rankStyle = rankStyles[rank] || {
                text: 'text-text-secondary', border: 'border-purple-900/20', glow: '', gradient: 'from-purple-900/20 to-[#171425]', icon: `#${rank}`,
              };
              return (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 + 0.18 }}
                  className={`bg-[#171425] border ${rankStyle.border} rounded-2xl p-4 hover:border-purple-700/40 transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${rankStyle.text} bg-[#0B0A12] border ${rankStyle.border}`}>
                      {i < 3 ? rankStyle.icon : `#${rank}`}
                    </div>

                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden border border-purple-900/30">
                        {seller.avatar_url ? (
                          <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-bold text-white">{getAvatarLetter(seller)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UserLink userId={seller.id} username={getName(seller)} className="font-semibold text-white truncate" />
                        {seller.verified && <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />}
                        <RoleBadge user={seller} />
                        <LevelBadge level={seller.level || 1} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-white">{(Number(seller.rating) || 0).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-text-secondary">{seller.positive_reviews || 0} полож. отзывов</span>
                        <span className={`text-xs ${levelColors[levelKey]}`}>{levelLabels[levelKey]}</span>
                        {seller.created_at && <span className="text-xs text-text-secondary">С {formatDate(seller.created_at)}</span>}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-base font-bold text-white">{seller.sales || 0}</p>
                        <p className="text-xs text-text-secondary">Продаж</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-green-400">{seller.xp || 0}</p>
                        <p className="text-xs text-text-secondary">XP · LVL {xpLevel(seller.xp || 0)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

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
            { icon: ThumbsUp,     label: 'Положительный отзыв',   xp: '+50 XP',  color: 'text-green-400' },
            { icon: ShoppingCart, label: 'Успешная продажа',      xp: '+100 XP', color: 'text-purple-300' },
            { icon: Shield,       label: 'Завершение гарантии',   xp: '+25 XP',  color: 'text-blue-400' },
            { icon: CheckSquare,  label: 'Верификация профиля',   xp: '+200 XP', color: 'text-yellow-400' },
            { icon: Gift,         label: 'Розыгрыш',              xp: '+150 XP', color: 'text-pink-400' },
            { icon: Send,         label: 'Сообщения и комменты',  xp: '+1–10 XP', color: 'text-cyan-400' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.5 }}
              className="flex items-center gap-3 p-3 bg-[#0B0A12] rounded-xl border border-purple-900/10 hover:border-purple-700/40 transition-all"
            >
              <item.icon size={20} className={item.color} />
              <div className="flex-1">
                <p className="text-xs font-medium text-text-secondary">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.xp}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

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
              newbie: 'Базовые возможности', bronze: 'Доступ к API', silver: 'Приоритет поддержки',
              gold: 'Премиум значок', platinum: 'Консьерж сервис', diamond: 'VIP статус',
            };
            const icons: Record<string, React.ReactNode> = {
              newbie: <Star size={21} />,
              bronze: <Award size={21} />,
              silver: (
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8 3h8l-1.5 5h-5L8 3Z" fill="#CBD5E1" stroke="#F8FAFC" strokeWidth="1.2" />
                  <circle cx="12" cy="14" r="6" fill="url(#silver-medal)" stroke="#F8FAFC" strokeWidth="1.4" />
                  <path d="M9.8 14.2l1.4 1.4 3.2-3.4" stroke="#475569" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="silver-medal" x1="7" y1="8" x2="18" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F8FAFC" />
                      <stop offset="0.5" stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                  </defs>
                </svg>
              ),
              gold: <Trophy size={21} />,
              platinum: (
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6.5 4.5h11L21 9l-9 11L3 9l3.5-4.5Z" fill="url(#platinum-gem)" stroke="#67E8F9" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M3 9h18M8 4.5 12 20l4-15.5M6.5 4.5 8 9l4-4.5L16 9l1.5-4.5" stroke="#E0F7FF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                  <defs>
                    <linearGradient id="platinum-gem" x1="5" y1="4" x2="19" y2="19" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E0F7FF" />
                      <stop offset="0.45" stopColor="#22D3EE" />
                      <stop offset="1" stopColor="#2563EB" />
                    </linearGradient>
                  </defs>
                </svg>
              ),
              diamond: <Crown size={21} />,
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
                  <div className={`w-10 h-10 rounded-xl bg-[#171425] border border-purple-900/20 flex items-center justify-center ${levelColors[key]}`}>{icons[key]}</div>
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
