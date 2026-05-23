import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Shield, Star, Zap, Eye,
  Clock, MapPin, Gamepad2, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { Account } from '../types';
import type { Page } from '../types/pages';
import { RoleBadge } from './ModerationPanel';

interface AccountCardProps {
  account: Account;
  onSelect: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
  index?: number;
}

const riskConfig = {
  low: {
    label: 'Низкий риск', Icon: CheckCircle2,
    cls: 'bg-green-900/20 border border-green-700/40 text-green-400',
  },
  medium: {
    label: 'Средний риск', Icon: AlertTriangle,
    cls: 'bg-yellow-900/20 border border-yellow-700/40 text-yellow-400',
  },
  high: {
    label: 'Высокий риск', Icon: XCircle,
    cls: 'bg-red-900/20 border border-red-700/40 text-red-400',
  },
};

const levelConfig: Record<string, { label: string; color: string }> = {
  newbie:   { label: 'Новичок',   color: 'text-gray-400' },
  bronze:   { label: 'Бронза',    color: 'text-amber-600' },
  silver:   { label: 'Серебро',   color: 'text-gray-300' },
  gold:     { label: 'Золото',    color: 'text-yellow-400' },
  platinum: { label: 'Платина',   color: 'text-cyan-400' },
  diamond:  { label: 'Бриллиант', color: 'text-purple-400' },
};

const categoryIcon = (cat: string): string => {
  const c = (cat || '').toLowerCase();
  if (c.includes('steam') || c.includes('game') || c.includes('игр')) return '🎮';
  if (c.includes('discord')) return '💬';
  if (c.includes('vpn')) return '🔒';
  if (c.includes('soft') || c.includes('по')) return '💻';
  if (c.includes('social') || c.includes('соц')) return '📱';
  return '📦';
};

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onSelect,
  setCurrentPage,
  onAddToCart,
  index = 0,
}) => {
  const [isFav, setIsFav] = useState<boolean>(account?.isFavorite ?? false);
  const risk = riskConfig[account?.riskLevel as keyof typeof riskConfig] || riskConfig.low;
  const sellerLevel = levelConfig[account?.seller?.level as string] || levelConfig.silver;

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(account);
    setCurrentPage('product');
  };

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(account);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFav(!isFav);
  };

  const discount = account?.oldPrice && account.oldPrice > account.price
    ? Math.round((1 - account.price / account.oldPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      onClick={() => { onSelect(account); setCurrentPage('product'); }}
      className="w-full bg-[#171425] border border-purple-900/20 hover:border-purple-700/50 rounded-2xl cursor-pointer relative overflow-hidden group transition-all hover:shadow-[0_0_30px_rgba(138,43,226,0.2)]"
    >
      <div className="flex flex-col sm:flex-row">

        {/* === ЛЕВАЯ ЧАСТЬ — Превью (картинка / иконка категории) === */}
        <div className="relative w-full sm:w-44 h-40 sm:h-auto bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-purple-900/10 flex items-center justify-center flex-shrink-0 border-b sm:border-b-0 sm:border-r border-purple-900/20">
          <span className="text-6xl">{categoryIcon(account?.category)}</span>

          {/* Скидка */}
          {discount > 0 && (
            <div className="absolute top-2 left-2">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                -{discount}%
              </span>
            </div>
          )}

          {/* Сердечко */}
          <motion.button
            onClick={handleFav}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur rounded-lg"
          >
            <Heart
              size={16}
              className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-white/80'}`}
            />
          </motion.button>
        </div>

        {/* === ПРАВАЯ ЧАСТЬ — Информация === */}
        <div className="flex-1 p-4 flex flex-col min-w-0">

          {/* Шапка */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">
              {account?.category || 'другое'}
            </span>
            {account?.escrow && (
              <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 font-semibold">
                <Shield size={9} /> Escrow
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${risk.cls}`}>
              <risk.Icon size={9} /> {risk.label}
            </span>
          </div>

          {/* Название */}
          <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors mb-2">
            {account?.title || 'Без названия'}
          </h3>

          {/* Инфа */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3 text-xs text-text-secondary">
            {account?.lastLogin && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock size={11} className="text-purple-400 flex-shrink-0" />
                <span className="truncate">{account.lastLogin}</span>
              </div>
            )}
            {account?.country && (
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={11} className="text-purple-400 flex-shrink-0" />
                <span className="truncate">{account.country}</span>
              </div>
            )}
            {account?.gamesCount != null && account.gamesCount > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Gamepad2 size={11} className="text-purple-400 flex-shrink-0" />
                <span>{account.gamesCount} игр</span>
              </div>
            )}
            {account?.guarantee && (
              <div className="flex items-center gap-1.5 text-green-400">
                <Shield size={11} className="flex-shrink-0" />
                <span>Гарантия {account.guaranteeHours || 24}ч</span>
              </div>
            )}
          </div>

          {/* Продавец */}
          {account?.seller && (
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-900/20">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-white">
                  {(account.seller.avatar || account.seller.username?.[0] || 'P').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
                <span className="text-xs font-medium text-white truncate">{account.seller.username}</span>
                {account.seller.isVerified && <CheckCircle2 size={10} className="text-blue-400 flex-shrink-0" />}
                <RoleBadge role={(account.seller as any).role} />
                <span className={`text-[10px] ${sellerLevel.color}`}>· {sellerLevel.label}</span>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-white">{(account.seller.rating ?? 4.8).toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Низ: цена + кнопки */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">{(account?.price ?? 0).toLocaleString('ru-RU')}</span>
                <span className="text-sm text-text-secondary">₽</span>
              </div>
              {account?.oldPrice && account.oldPrice > account.price && (
                <span className="text-xs text-text-secondary line-through">
                  {account.oldPrice.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                onClick={handleCart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-purple-900/30 border border-purple-800/30 rounded-xl text-purple-300 hover:border-purple-500 hover:bg-purple-900/50 transition-all"
              >
                <ShoppingCart size={16} />
              </motion.button>
              <motion.button
                onClick={handleBuy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
              >
                <Zap size={13} /> Купить
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountCard;
