import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Shield,
  Star,
  Zap,
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Send,
  Target,
  Hexagon,
  Square,
  Crown,
  Box,
  MessageCircle,
  Music,
  Camera,
  Brain,
  Atom,
  Lock,
  Sparkles,
  Joystick,
  Pickaxe,
} from 'lucide-react';
import { Account } from '../types';
import type { Page } from '../types/pages';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';
import { UserLink } from './UserLink';
import LabelManager from './LabelManager';
import { useCurrency } from '../lib/CurrencyContext';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';

interface AccountCardProps {
  account: Account;
  onSelect: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
  index?: number;
}

const riskConfig = {
  low: { label: 'Низкий', Icon: CheckCircle2, cls: 'bg-green-900/30 border border-green-700/40 text-green-400' },
  medium: { label: 'Средний', Icon: AlertTriangle, cls: 'bg-yellow-900/30 border border-yellow-700/40 text-yellow-400' },
  high: { label: 'Высокий', Icon: XCircle, cls: 'bg-red-900/30 border border-red-700/40 text-red-400' },
};

type CategoryVisual = {
  Icon: React.ElementType;
  color: string;
  glow: string;
  ring: string;
};

// Lucide-иконки категорий синхронизированы с MarketPage.
const CAT_ICONS: Record<string, CategoryVisual> = {
  steam:     { Icon: Gamepad2,      color: 'text-blue-400',   glow: 'from-blue-500/25 via-purple-500/10 to-transparent',    ring: 'border-blue-400/30 shadow-[0_0_26px_rgba(96,165,250,0.22)]' },
  telegram:  { Icon: Send,          color: 'text-cyan-400',   glow: 'from-cyan-500/25 via-purple-500/10 to-transparent',    ring: 'border-cyan-400/30 shadow-[0_0_26px_rgba(34,211,238,0.22)]' },
  epic:      { Icon: Joystick,      color: 'text-gray-200',   glow: 'from-white/15 via-purple-500/10 to-transparent',       ring: 'border-white/20 shadow-[0_0_26px_rgba(255,255,255,0.12)]' },
  fortnite:  { Icon: Pickaxe,       color: 'text-blue-400',   glow: 'from-sky-500/25 via-purple-500/10 to-transparent',     ring: 'border-sky-400/30 shadow-[0_0_26px_rgba(56,189,248,0.20)]' },
  ea:        { Icon: Target,        color: 'text-red-500',    glow: 'from-red-500/25 via-purple-500/10 to-transparent',     ring: 'border-red-400/30 shadow-[0_0_26px_rgba(239,68,68,0.20)]' },
  ubisoft:   { Icon: Hexagon,       color: 'text-blue-500',   glow: 'from-blue-600/25 via-purple-500/10 to-transparent',    ring: 'border-blue-500/30 shadow-[0_0_26px_rgba(59,130,246,0.20)]' },
  minecraft: { Icon: Square,        color: 'text-green-500',  glow: 'from-green-500/25 via-purple-500/10 to-transparent',   ring: 'border-green-400/30 shadow-[0_0_26px_rgba(34,197,94,0.18)]' },
  supercell: { Icon: Crown,         color: 'text-yellow-400', glow: 'from-yellow-500/25 via-purple-500/10 to-transparent',  ring: 'border-yellow-400/30 shadow-[0_0_26px_rgba(250,204,21,0.20)]' },
  roblox:    { Icon: Box,           color: 'text-red-400',    glow: 'from-red-400/25 via-purple-500/10 to-transparent',     ring: 'border-red-400/30 shadow-[0_0_26px_rgba(248,113,113,0.18)]' },
  wot:       { Icon: Shield,        color: 'text-gray-400',   glow: 'from-gray-400/20 via-purple-500/10 to-transparent',    ring: 'border-gray-400/25 shadow-[0_0_26px_rgba(156,163,175,0.14)]' },
  wr:        { Icon: Zap,           color: 'text-yellow-300', glow: 'from-yellow-400/25 via-purple-500/10 to-transparent',  ring: 'border-yellow-300/30 shadow-[0_0_26px_rgba(253,224,71,0.18)]' },
  rockstar:  { Icon: Star,          color: 'text-yellow-400', glow: 'from-yellow-500/25 via-purple-500/10 to-transparent',  ring: 'border-yellow-400/30 shadow-[0_0_26px_rgba(250,204,21,0.20)]' },
  discord:   { Icon: MessageCircle, color: 'text-indigo-400', glow: 'from-indigo-500/25 via-purple-500/10 to-transparent',  ring: 'border-indigo-400/30 shadow-[0_0_26px_rgba(129,140,248,0.20)]' },
  tiktok:    { Icon: Music,         color: 'text-pink-400',   glow: 'from-pink-500/25 via-purple-500/10 to-transparent',    ring: 'border-pink-400/30 shadow-[0_0_26px_rgba(244,114,182,0.20)]' },
  instagram: { Icon: Camera,        color: 'text-pink-500',   glow: 'from-pink-500/25 via-purple-500/10 to-transparent',    ring: 'border-pink-500/30 shadow-[0_0_26px_rgba(236,72,153,0.20)]' },
  ai:        { Icon: Brain,         color: 'text-purple-400', glow: 'from-purple-500/30 via-fuchsia-500/10 to-transparent', ring: 'border-purple-400/30 shadow-[0_0_26px_rgba(168,85,247,0.24)]' },
  neural:    { Icon: Atom,          color: 'text-purple-500', glow: 'from-purple-600/30 via-fuchsia-500/10 to-transparent', ring: 'border-purple-500/30 shadow-[0_0_26px_rgba(147,51,234,0.24)]' },
  vpn:       { Icon: Lock,          color: 'text-orange-400', glow: 'from-orange-500/25 via-purple-500/10 to-transparent',  ring: 'border-orange-400/30 shadow-[0_0_26px_rgba(251,146,60,0.18)]' },
  mihoyo:    { Icon: Sparkles,      color: 'text-cyan-300',   glow: 'from-cyan-400/25 via-purple-500/10 to-transparent',    ring: 'border-cyan-300/30 shadow-[0_0_26px_rgba(103,232,249,0.20)]' },
};

const DEFAULT_CATEGORY: CategoryVisual = {
  Icon: Package,
  color: 'text-purple-300',
  glow: 'from-purple-500/25 via-purple-500/10 to-transparent',
  ring: 'border-purple-400/30 shadow-[0_0_26px_rgba(168,85,247,0.20)]',
};

const getCategoryInfo = (cat?: string) => {
  const key = (cat || '').toLowerCase();
  const found = categories.find(c => c.id === key);
  return {
    ...(CAT_ICONS[key] || DEFAULT_CATEGORY),
    name: found?.name || cat || 'Другое',
  };
};

const AccountCard: React.FC<AccountCardProps> = ({
  account, onSelect, setCurrentPage, onAddToCart, index = 0,
}) => {
  const [isFav, setIsFav] = useState<boolean>(account?.isFavorite ?? false);
  const [me, setMe] = useState<string | null>(null);
  const { convert, symbol, currency } = useCurrency();
  const risk = riskConfig[account?.riskLevel as keyof typeof riskConfig] || riskConfig.low;
  const catInfo = getCategoryInfo(account?.category);
  const CategoryIcon = catInfo.Icon;

  useEffect(() => {
    const init = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setMe(u.user.id);
      const { data } = await supabase.from('favorites')
        .select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
      if (data) setIsFav(true);
    };
    init();
  }, [account.id]);

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(account);
    setCurrentPage('product');
  };
  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(account);
  };
  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!me) { alert('Войдите в систему'); return; }
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', me).eq('account_id', account.id);
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: me, account_id: account.id });
      setIsFav(true);
    }
  };

  const discount = account?.oldPrice && account.oldPrice > account.price
    ? Math.round((1 - account.price / account.oldPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      onClick={() => { onSelect(account); setCurrentPage('product'); }}
      className="w-full h-full flex flex-col bg-[#171425] border border-purple-900/20 hover:border-purple-700/50 rounded-2xl cursor-pointer relative overflow-hidden group transition-all hover:shadow-[0_0_30px_rgba(138,43,226,0.2)]"
    >
      {/* === Banner with category Lucide icon from MarketPage === */}
      <div className="relative w-full h-32 bg-gradient-to-br from-purple-950/70 via-[#171425] to-[#0B0A12] flex items-center justify-center flex-shrink-0 border-b border-purple-900/20 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${catInfo.glow}`} />
        <motion.div
          aria-hidden="true"
          animate={{ rotate: [0, 4, -3, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -right-8 -bottom-10 ${catInfo.color} opacity-[0.08]`}
        >
          <CategoryIcon size={138} strokeWidth={1.25} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.2, 0.65, 0.2], x: ['-30%', '30%', '-30%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-5 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />

        <motion.div
          whileHover={{ scale: 1.08, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`relative w-[72px] h-[72px] rounded-3xl bg-black/25 backdrop-blur border ${catInfo.ring} flex items-center justify-center`}
        >
          <CategoryIcon size={40} strokeWidth={1.8} className={`${catInfo.color} drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]`} />
          <span className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-70" />
        </motion.div>

        {discount > 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              -{discount}%
            </span>
          </div>
        )}

        <motion.button
          onClick={handleFav}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-lg border border-white/10"
        >
          <Heart size={16} className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
        </motion.button>

        <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] text-[10px] uppercase tracking-wider font-bold text-white bg-black/50 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
          <CategoryIcon size={12} className={`${catInfo.color} flex-shrink-0`} />
          <span className="truncate">{catInfo.name}</span>
        </span>
      </div>

      {/* === Content === */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {account?.escrow && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-purple-900/40 border border-purple-700/40 text-purple-300 font-semibold">
              <Shield size={9} /> Escrow
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${risk.cls}`}>
            <risk.Icon size={9} /> {risk.label}
          </span>
          {account?.guarantee && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-900/20 border border-green-700/40 text-green-400 font-semibold flex items-center gap-1">
              <Shield size={9} /> {account.guaranteeHours || 24}ч
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors mb-2 min-h-[2.5rem]">
          {account?.title || 'Без названия'}
        </h3>

        <div onClick={(e) => e.stopPropagation()} className="mb-2">
          <LabelManager targetType="account" targetId={account.id} small />
        </div>

        {/* Extra info */}
        <div className="text-xs text-text-secondary mb-2 space-y-0.5">
          {account?.country && <div>📍 {account.country}</div>}
          {account?.gamesCount != null && account.gamesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <CategoryIcon size={11} className={catInfo.color} />
              <span>{account.gamesCount} игр</span>
            </div>
          )}
        </div>

        {/* Seller */}
        {account?.seller && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-purple-900/20">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {(account.seller as any).avatarUrl ? (
                <img src={(account.seller as any).avatarUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-[9px] font-bold text-white">
                  {(account.seller.avatar || account.seller.username?.[0] || 'P').toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 min-w-0 flex-1 flex-wrap">
              <UserLink userId={(account.seller as any).id} username={account.seller.username} className="text-xs font-medium text-white truncate" />
              {account.seller.isVerified && <CheckCircle2 size={9} className="text-blue-400 flex-shrink-0" />}
              <RoleBadge user={account.seller as any} />
              <LevelBadge level={(account.seller as any).userLevel} compact />
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-white">{(account.seller.rating ?? 4.8).toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Price + buttons */}
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">
                {convert(account?.price ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })}
              </span>
              <span className="text-xs text-text-secondary">{symbol}</span>
            </div>
            {account?.oldPrice && account.oldPrice > account.price && (
              <span className="text-[10px] text-text-secondary line-through">
                {convert(account.oldPrice).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} {symbol}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <motion.button onClick={handleCart} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-1.5 bg-purple-900/30 border border-purple-800/30 rounded-lg text-purple-300 hover:bg-purple-900/50">
              <ShoppingCart size={14} />
            </motion.button>
            <motion.button onClick={handleBuy} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white">
              <Zap size={11} /> Купить
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountCard;
