import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Search, ShoppingCart, Bell, ChevronDown, MessageSquare, LifeBuoy,
  User, Settings, LogOut, Star, Package,
  Wallet, Menu, X, Trash2, ArrowRight
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import type { Page } from '../types/pages';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';
import { useCurrency } from '../lib/CurrencyContext';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page, filter?: string | null) => void;
  cartCount: number;
  cartItems?: Account[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  onOpenAccount?: (accountId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage, setCurrentPage, cartCount, cartItems = [],
  onRemoveFromCart, onMenuToggle, isMobileMenuOpen, onOpenAccount,
  searchQuery, setSearchQuery
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { convert, symbol } = useCurrency();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: p } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
        if (p) {
          setMyProfile(p);
          setBalance(p.balance || 0);
        }
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('is_read', false);
        setUnreadCount(count || 0);
      }
    };
    init();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-purple-900/20 bg-bg-secondary/80 backdrop-blur">
      <div className="flex items-center h-16 px-4 gap-4">
        <button onClick={onMenuToggle} className="lg:hidden text-text-secondary p-1">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('market')}>
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
            <Moon size={20} className="text-white" fill="white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl px-3 py-1.5">
            <Search size={16} className="text-text-secondary mr-2" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); if(currentPage !== 'market') setCurrentPage('market'); }}
              placeholder="Поиск по маркету..." 
              className="bg-transparent text-sm text-white outline-none w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Баланс */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-900/20 rounded-xl border border-purple-800/30">
            <Wallet size={14} className="text-accent" />
            <span className="text-sm font-bold">{convert(balance).toLocaleString('ru-RU')} {symbol}</span>
          </div>

          {/* Сообщения */}
          <button onClick={() => setCurrentPage('messages' as any)} className="p-2 text-text-secondary hover:text-white transition-colors">
            <MessageSquare size={20} />
          </button>

          {/* Поддержка */}
          <button onClick={() => setCurrentPage('support' as any)} className="p-2 text-text-secondary hover:text-white transition-colors">
            <LifeBuoy size={20} />
          </button>

          {/* Корзина */}
          <div className="relative">
            <button onClick={() => setShowCartDropdown(!showCartDropdown)} className="p-2 text-text-secondary hover:text-white relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
            </button>
          </div>

          {/* Уведомления */}
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-text-secondary hover:text-white relative">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
          </button>

          {/* Профиль */}
          <div className="relative ml-2">
            <button onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center overflow-hidden">
              {myProfile?.avatar_url ? <img src={myProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
