import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowLeftRight,
  Package, ShoppingBag, Receipt, Heart, Tag, Zap,
  Settings, Shield, TrendingUp, DollarSign, Code,
  ChevronDown, Plus, MessageSquare, Eye, EyeOff
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';
import type { Page } from '../types/pages';

interface SidebarProps {
  currentPage: Page;
  forumFilter: string | null;
  setCurrentPage: (page: Page, filter?: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  forumFilter,
  setCurrentPage,
  isOpen,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('');
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [hideBalance, setHideBalance] = useState(() => localStorage.getItem('hideBalance') === 'true');
  const [hideEmail, setHideEmail] = useState(() => localStorage.getItem('hideEmail') === 'true');

  const { convert, symbol } = useCurrency();

  useEffect(() => {
    localStorage.setItem('hideBalance', hideBalance.toString());
  }, [hideBalance]);

  useEffect(() => {
    localStorage.setItem('hideEmail', hideEmail.toString());
  }, [hideEmail]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: p } = await supabase.from('users').select('balance').eq('id', data.user.id).maybeSingle();
        if (p) setBalance(p.balance || 0);
      }
    };
    init();
  }, []);

  const navItems = [
    { icon: Package, label: 'Мои аккаунты', page: 'sell' as Page },
    { icon: ShoppingBag, label: 'Мои покупки', page: 'purchases' as Page },
    { icon: Receipt, label: 'Мои операции', page: 'operations' as Page },
    { icon: Heart, label: 'Избранное', page: 'favorites' as Page },
    { icon: Tag, label: 'Управление метками', page: 'labels' as Page },
    { icon: Zap, label: 'Автопокупки', page: 'autobuy' as Page },
    { icon: Settings, label: 'Настройки', page: 'settings' as Page },
    { icon: Shield, label: 'Правила', page: 'forum' as Page, filter: 'Правила' },
    { icon: MessageSquare, label: 'Форум', page: 'forum' as Page, filter: null },
    { icon: TrendingUp, label: 'Топ продавцов', page: 'topSellers' as Page },
    { icon: DollarSign, label: 'Курс валют', page: 'rates' as Page },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col overflow-y-auto bg-bg-secondary">
      {/* Аккуратный баланс */}
      <div className="p-4 border-b border-purple-900/10">
        <div className="bg-bg-card rounded-2xl p-4 border border-purple-900/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Баланс</span>
            <button onClick={() => setHideBalance(!hideBalance)} className="text-text-secondary hover:text-accent transition-colors">
              {hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <div className="text-xl font-bold text-white mb-2">
            {hideBalance ? '••••••' : `${convert(balance).toLocaleString('ru-RU')} ${symbol}`}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-purple-900/5">
             <div className="text-[10px] text-text-secondary truncate max-w-[120px]">
               {hideEmail ? '••••••••••' : (user?.email || 'Гость')}
             </div>
             <button onClick={() => setHideEmail(!hideEmail)} className="text-text-secondary hover:text-accent">
               {hideEmail ? <EyeOff size={10} /> : <Eye size={10} />}
             </button>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="p-3 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={() => { setCurrentPage(item.page, (item as any).filter); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              currentPage === item.page && forumFilter === (item as any).filter
                ? 'bg-purple-600/10 text-accent-soft border border-purple-600/20'
                : 'text-text-secondary hover:text-white hover:bg-purple-900/10'
            }`}
          >
            <item.icon size={16} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Категории */}
      <div className="p-3 border-t border-purple-900/10">
        <p className="text-[10px] text-text-secondary uppercase px-3 mb-2 font-bold opacity-50">Категории</p>
        <div className="grid grid-cols-1 gap-0.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setCurrentPage('market'); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                activeCategory === cat.id ? 'text-accent-soft bg-purple-900/20' : 'text-text-secondary hover:text-white hover:bg-purple-900/10'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 border-r border-purple-900/10 z-40">
        {sidebarContent}
      </aside>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="lg:hidden fixed inset-0 bg-black/60 z-40" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-bg-secondary z-50">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
