import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Shield, Star, Zap,
  CheckCircle2, AlertTriangle, XCircle
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

// Get category icon + name from mockData categories
const getCategoryInfo = (cat: string) => {
  const found = categories.find(c => c.id === cat);
  return { icon: found?.icon || '📦', name: found?.name || cat || 'Другое' };
};

const AccountCard: React.FC<AccountCardProps> = ({
  account, onSelect, setCurrentPage, onAddToCart, index = 0,
}) => {
  const [isFav, setIsFav] = useState<boolean>(account?.isFavorite ?? false);
  const [me, setMe] = useState<string | null>(null);
  const { convert, symbol, currency } = useCurrency();
  const risk = riskConfig[account?.riskLevel as keyof typeof riskConfig] || riskConfig.low;
  const catInfo = getCategoryInfo(account?.category);

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
      {/* === Banner with category icon === */}
      <div className="relative w-full h-32 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-purple-900/10 flex items-center justify-center flex-shrink-0 border-b border-purple-900/20">
        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{catInfo.icon}</span>

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
          className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-lg"
        >
          <Heart size={16} className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
        </motion.button>

        <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-wider font-bold text-white bg-black/50 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
          <span className="text-xs">{catInfo.icon}</span>
          {catInfo.name}
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
          {account?.gamesCount != null && account.gamesCount > 0 && <div>{catInfo.icon} {account.gamesCount} игр</div>}
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
