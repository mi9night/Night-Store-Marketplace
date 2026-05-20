import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Shield, Star, Zap, Eye,
  Clock, MapPin, Gamepad2, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface AccountCardProps {
  account: Account;
  onSelect: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
  index?: number;
}

const riskConfig = {
  low: {
    label: 'Низкий риск',
    Icon: CheckCircle2,
    bg: 'bg-green-900/20',
    border: 'border-green-700/40',
    text: 'text-green-400',
  },
  medium: {
    label: 'Средний риск',
    Icon: AlertTriangle,
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700/40',
    text: 'text-yellow-400',
  },
  high: {
    label: 'Высокий риск',
    Icon: XCircle,
    bg: 'bg-red-900/20',
    border: 'border-red-700/40',
    text: 'text-red-400',
  },
};

const levelConfig: Record<string, { label: string; color: string }> = {
  newbie:   { label: 'Новичок',    color: 'text-gray-400' },
  bronze:   { label: 'Бронза',     color: 'text-amber-600' },
  silver:   { label: 'Серебро',    color: 'text-gray-300' },
  gold:     { label: 'Золото',     color: 'text-yellow-400' },
  platinum: { label: 'Платина',    color: 'text-cyan-400' },
  diamond:  { label: 'Бриллиант',  color: 'text-purple-400' },
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

  const handleOpen = () => {
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
      whileHover={{ y: -4 }}
      onClick={handleOpen}
      className="w-full flex flex-col bg-[#171425] border border-purple-900/20 hover:border-purple-700/50 rounded-2xl p-4 cursor-pointer relative overflow-hidden group transition-all hover:shadow-[0_0_30px_rgba(138,43,226,0.2)]"
    >
      {/* фоновое свечение при наведении */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header: категория + escrow + favorite */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full font-semibold">
              {account?.category || 'другое'}
            </span>
            {account?.escrow && (
              <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 font-semibold">
                <Shield size={9} />
                Escrow
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
            {account?.title || 'Без названия'}
          </h3>
        </div>

        <motion.button
          onClick={handleFav}
          whileTap={{ scale: 0.85 }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            isFav ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      {/* Превью / иконка категории */}
      <div className="w-full h-24 rounded-xl bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-purple-900/10 border border-purple-900/30 flex items-center justify-center mb-3 relative overflow-hidden">
        <span className="text-5xl">{categoryIcon(account?.category)}</span>
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}
      </div>

      {/* Риск + гарантия */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 border font-semibold ${risk.bg} ${risk.border} ${risk.text}`}>
          <risk.Icon size={9} />
          {risk.label}
        </span>
        {account?.guarantee && (
          <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1 bg-green-900/20 border border-green-700/40 text-green-400 font-semibold">
            <Shield size={9} />
            {account?.guaranteeHours || 24}ч
          </span>
        )}
      </div>

      {/* Доп. инфа */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
        {account?.country && (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="flex-shrink-0 text-purple-400" />
            <span className="truncate">{account.country}</span>
          </div>
        )}
        {account?.gamesCount != null && account.gamesCount > 0 && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Gamepad2 size={12} className="flex-shrink-0 text-purple-400" />
            <span className="truncate">{account.gamesCount} игр</span>
          </div>
        )}
        {account?.lastLogin && (
          <div className="flex items-center gap-1.5 min-w-0 col-span-2">
            <Clock size={12} className="flex-shrink-0 text-purple-400" />
            <span className="truncate">Вход: {account.lastLogin}</span>
          </div>
        )}
      </div>

      {/* Продавец */}
      {account?.seller && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-900/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">
              {(account.seller.avatar || account.seller.username?.[0] || 'P').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {account.seller.username || 'Продавец'}
            </p>
            <div className="flex items-center gap-1 text-[10px]">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                {(account.seller.rating ?? 4.8).toFixed(1)}
              </span>
              <span className={`ml-1 ${sellerLevel.color}`}>· {sellerLevel.label}</span>
            </div>
          </div>
          {account.seller.isVerified && (
            <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />
          )}
        </div>
      )}

      {/* Цена + кнопки */}
      <div className="mt-auto">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-white">
            {(account?.price ?? 0).toLocaleString('ru-RU')}
          </span>
          <span className="text-sm text-gray-400">₽</span>
          {account?.oldPrice && account.oldPrice > account.price && (
            <span className="text-xs text-gray-500 line-through ml-auto">
              {account.oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            onClick={handleOpen}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <Zap size={12} />
            Купить
          </motion.button>
          <motion.button
            onClick={handleCart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/40 text-purple-300 transition-colors"
          >
            <ShoppingCart size={12} />
            В корзину
          </motion.button>
        </div>

        {account?.views != null && account.views > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 justify-end">
            <Eye size={10} /> {account.views}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AccountCard;
