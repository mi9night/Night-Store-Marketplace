import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowLeftRight,
  Package, ShoppingBag, Receipt, Heart, Tag, Zap,
  Settings, Shield, TrendingUp, DollarSign, Code,
  ChevronDown, ChevronRight, Plus, MessageSquare
} from 'lucide-react';
import { currentUser, categories } from '../data/mockData';
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

  const navItems = [
    { icon: Package, label: 'Мои аккаунты', page: 'sell' as Page },
    { icon: ShoppingBag, label: 'Мои покупки', page: 'purchases' as Page },
    { icon: Receipt, label: 'Мои операции', page: 'operations' as Page },
    { icon: Heart, label: 'Избранное', page: 'favorites' as Page },
    { icon: Tag, label: 'Управление метками', page: 'labels' as Page },
    { icon: Zap, label: 'Автопокупки', page: 'autobuy' as Page },
    { icon: Settings, label: 'Настройки', page: 'settings' as Page },

    // ✅ Фильтр форума
    { icon: Shield, label: 'Правила и гарантии', page: 'forum' as Page, filter: 'Правила' },
    { icon: MessageSquare, label: 'Форум', page: 'forum' as Page, filter: null },

    { icon: TrendingUp, label: 'Повышение статуса', page: 'topSellers' as Page },
    { icon: DollarSign, label: 'Курсы валют', page: 'rates' as Page },
    { icon: Code, label: 'API', page: 'api' as Page },
  ];

  const isItemActive = (item: any) => {
    if (item.page === 'forum') {
      return currentPage === 'forum' && forumFilter === item.filter;
    }
    return currentPage === item.page;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col overflow-y-auto">

      {/* Balance */}
      <div className="p-4 border-b border-purple-900/20">
        <div className="bg-bg-card rounded-xl p-4 border border-purple-900/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">Баланс</span>
            <Wallet size={14} className="text-accent" />
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {currentUser.balance.toLocaleString('ru-RU')} ₽
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <p className="text-xs text-text-secondary uppercase px-2 mb-2">Навигация</p>

        {navItems.map(item => {
          const active = isItemActive(item);

          return (
            <motion.button
              key={item.label + (item.filter ?? '')}
              onClick={() => {
                setCurrentPage(item.page, item.filter ?? null);
                onClose();
              }}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${
                active
                  ? 'bg-purple-600/20 text-accent-soft'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </motion.button>
          );
        })}
      </div>

      {/* Categories */}
      <div className="p-3 border-t border-purple-900/20">
        <p className="text-xs text-text-secondary uppercase px-2 mb-2">Категории</p>

        {categories.map(cat => (
          <div key={cat.id}>
            <motion.button
              onClick={() => {
                setActiveCategory(cat.id);
                if (cat.subcategories) {
                  setExpandedCategory(expandedCategory === cat.id ? '' : cat.id);
                }
                setCurrentPage('market');
                onClose();
              }}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm ${
                activeCategory === cat.id
                  ? 'bg-purple-600/20 text-accent-soft'
                  : 'text-text-secondary'
              }`}
            >
              {cat.icon} {cat.name}
            </motion.button>

            <AnimatePresence>
              {cat.subcategories && expandedCategory === cat.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="ml-4 overflow-hidden"
                >
                  {cat.subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => {
                        setCurrentPage('market');
                        onClose();
                      }}
                      className="block w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-white"
                    >
                      {sub}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 bg-bg-secondary border-r border-purple-900/20 z-40">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-bg-secondary border-r border-purple-900/20 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;