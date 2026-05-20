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
    label: 'Низкий риск',
    Icon: CheckCircle2,
    cls: 'bg-green-900/20 border border-green-700/40 text-green-400',
  },
  medium: {
    label: 'Средний риск',
    Icon: AlertTriangle,
    cls: 'bg-yellow-900/20 border border-yellow-700/40 text-yellow-400',
  },
  high: {
    label: 'Высокий риск',
    Icon: XCircle,
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
      className="w-full bg-[#171425] border border-purple-900/20 hover:border-purple-700/50 rounded-2xl p-4 cursor-pointer relative overflow-hidden group transition-all hover:shadow-[0_0_30px_rgba(138,43,226,0.2)]"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Скидка */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs px-2 py-0.5 rounded-full font-semibold">
            -{discount}%
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">
              {account?.category || 'другое'}
            </span>
            {account?.escrow && (
              <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 font-semibold">
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
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="ml-2 flex-shrink-0"
        >
          <Heart
            size={18}
            className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-text-secondary hover:text-red-400'}`}
          />
        </motion.button>
      </div>

      {/* Теги */}
      {account?.tags && account.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {account.tags.slice(0, 4).map((tag, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-purple-900/20 border border-purple-800/30 text-text-secondary px-2 py-0.5 rounded-lg">
              {tag.icon && <span>{tag.icon}</span>}
              <span>{tag.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
        {account?.lastLogin && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Clock size={11} className="text-purple-400 flex-shrink-0" />
            <span className="truncate">{account.lastLogin}</span>
          </div>
        )}
        {account?.country && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={11} className="text-purple-400 flex-shrink-0" />
            <span className="truncate">{account.country}</span>
          </div>
        )}
        {account?.gamesCount != null && account.gamesCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Gamepad2 size={11} className="text-purple-400 flex-shrink-0" />
            <span>{account.gamesCount} игр</span>
          </div>
        )}
        {account?.views != null && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Eye size={11} className="text-purple-400 flex-shrink-0" />
            <span>{account.views.toLocaleString('ru-RU')}</span>
          </div>
        )}
      </div>

      {/* Risk AI badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg mb-3 ${risk.cls}`}>
        <risk.Icon size={11} />
        <span>AI: {risk.label}</span>
      </div>

      {/* Guarantee */}
      {account?.guarantee && (
        <div className="flex items-center gap-1.5 text-xs text-green-400 mb-3">
          <Shield size={11} />
          <span>Гарантия {account.guaranteeHours || 24}ч</span>
        </div>
      )}

      {/* Seller */}
      {account?.seller && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-900/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {(account.seller.avatar || account.seller.username?.[0] || 'P').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium text-white truncate">{account.seller.username || 'Продавец'}</span>
              {account.seller.isVerified && <CheckCircle2 size={10} className="text-blue-400 flex-shrink-0" />}
              <RoleBadge role={(account.seller as any).role} />
            </div>
            <span className={`text-xs ${sellerLevel.color}`}>{sellerLevel.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-white">{(account.seller.rating ?? 4.8).toFixed(1)}</span>
            {account?.reviewsCount > 0 && (
              <span className="text-xs text-text-secondary">({account.reviewsCount})</span>
            )}
          </div>
        </div>
      )}

      {/* Price & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{(account?.price ?? 0).toLocaleString('ru-RU')}</span>
            <span className="text-sm text-text-secondary">₽</span>
          </div>
          {account?.oldPrice && account.oldPrice > account.price && (
            <span className="text-xs text-text-secondary line-through">{account.oldPrice.toLocaleString('ru-RU')} ₽</span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            <Zap size={13} />
            Купить
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountCard;
