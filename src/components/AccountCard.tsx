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
  low: { label: 'Низкий риск', className: 'risk-low', Icon: CheckCircle2 },
  medium: { label: 'Средний риск', className: 'risk-medium', Icon: AlertTriangle },
  high: { label: 'Высокий риск', className: 'risk-high', Icon: XCircle },
};

const levelConfig = {
  newbie: { label: 'Новичок', color: 'text-gray-400' },
  bronze: { label: 'Бронза', color: 'text-amber-600' },
  silver: { label: 'Серебро', color: 'text-gray-300' },
  gold: { label: 'Золото', color: 'text-yellow-400' },
  platinum: { label: 'Платина', color: 'text-cyan-400' },
  diamond: { label: 'Бриллиант', color: 'text-purple-400' },
};

const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect, setCurrentPage, onAddToCart, index = 0 }) => {
  const [isFav, setIsFav] = useState(account.isFavorite);
  const risk = riskConfig[account.riskLevel];
  const sellerLevel = levelConfig[account.seller.level];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => { onSelect(account); setCurrentPage('product'); }}
      className="card-hover bg-bg-card border border-purple-900/20 rounded-2xl p-4 cursor-pointer relative overflow-hidden group"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-text-secondary bg-purple-900/20 px-2 py-0.5 rounded-full">
              {account.category.toUpperCase()}
            </span>
            {account.escrow && (
              <span className="escrow-badge text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield size={10} />
                Escrow
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-accent-soft transition-colors">
            {account.title}
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

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {account.tags.slice(0, 4).map((tag, i) => (
          <span key={i} className="flex items-center gap-1 text-xs bg-purple-900/20 border border-purple-800/20 text-text-secondary px-2 py-0.5 rounded-lg">
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </span>
        ))}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock size={11} className="text-accent flex-shrink-0" />
          <span className="truncate">{account.lastLogin}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <MapPin size={11} className="text-accent flex-shrink-0" />
          <span className="truncate">{account.country}</span>
        </div>
        {account.gamesCount && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Gamepad2 size={11} className="text-accent flex-shrink-0" />
            <span>{account.gamesCount} игр</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Eye size={11} className="text-accent flex-shrink-0" />
          <span>{account.views.toLocaleString()}</span>
        </div>
      </div>

      {/* Risk AI badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg mb-3 ${risk.className}`}>
        <risk.Icon size={11} />
        <span>AI: {risk.label}</span>
      </div>

      {/* Guarantee */}
      {account.guarantee && (
        <div className="flex items-center gap-1.5 text-xs text-success mb-3">
          <Shield size={11} />
          <span>Гарантия {account.guaranteeHours}ч</span>
        </div>
      )}

      {/* Seller */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-900/20">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{account.seller.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-text-primary truncate">{account.seller.username}</span>
            {account.seller.isVerified && <CheckCircle2 size={10} className="text-accent flex-shrink-0" />}
          </div>
          <span className={`text-xs ${sellerLevel.color}`}>{sellerLevel.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-text-primary">{account.seller.rating}</span>
          <span className="text-xs text-text-secondary">({account.reviewsCount})</span>
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-text-primary">{account.price.toLocaleString()}</span>
            <span className="text-sm text-text-secondary">₽</span>
          </div>
          {account.oldPrice && (
            <span className="text-xs text-text-secondary line-through">{account.oldPrice.toLocaleString()} ₽</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleCart}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-purple-900/30 border border-purple-800/30 rounded-xl text-accent hover:border-accent hover:bg-purple-900/50 transition-all"
          >
            <ShoppingCart size={16} />
          </motion.button>
          <motion.button
            onClick={handleBuy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          >
            <Zap size={13} />
            Купить
          </motion.button>
        </div>
      </div>

      {/* Sale badge */}
      {account.oldPrice && (
        <div className="absolute top-3 left-3">
          <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full font-semibold">
            -{Math.round((1 - account.price / account.oldPrice) * 100)}%
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default AccountCard;
