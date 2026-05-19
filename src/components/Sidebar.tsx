import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowLeftRight,
  Package, ShoppingBag, Receipt, Heart, Tag, Zap,
  Settings, Shield, TrendingUp, DollarSign, Code,
  ChevronDown, ChevronRight, Plus
} from 'lucide-react';
import { currentUser, categories } from '../data/mockData';
import type { Page } from '../types/pages';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('');

  const navItems = [
    { icon: Package, label: 'Мои аккаунты', page: 'sell' as Page },
    { icon: ShoppingBag, label: 'Мои покупки', page: 'purchases' as Page },
    { icon: Receipt, label: 'Мои операции', page: 'settings' as Page },
    { icon: Heart, label: 'Избранное', page: 'favorites' as Page },
    { icon: Tag, label: 'Управление метками', page: 'labels' as Page },
    { icon: Zap, label: 'Автопокупки', page: 'autobuy' as Page },
    { icon: Settings, label: 'Настройки', page: 'settings' as Page },
    { icon: Shield, label: 'Правила и гарантии', page: 'forum' as Page },
    { icon: TrendingUp, label: 'Повышение статуса', page: 'topSellers' as Page },
    { icon: DollarSign, label: 'Курсы валют', page: 'market' as Page },
    { icon: Code, label: 'API', page: 'settings' as Page },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Balance block */}
      <div className="p-4 border-b border-purple-900/20">
        <div className="bg-bg-card rounded-xl p-4 border border-purple-900/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">Баланс</span>
            <Wallet size={14} className="text-accent" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{currentUser.balance.toLocaleString('ru-RU')} <span className="text-base text-text-secondary">₽</span></p>
          <p className="text-xs text-text-secondary mt-1">ID: {currentUser.id}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { icon: Plus, label: 'Пополнить', color: 'text-success' },
            { icon: ArrowDownLeft, label: 'Вывести', color: 'text-error' },
            { icon: ArrowLeftRight, label: 'Перевести', color: 'text-accent-soft' },
          ].map(item => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1.5 p-2 bg-bg-card rounded-xl border border-purple-900/20 hover:border-purple-700/40 transition-all"
            >
              <item.icon size={16} className={item.color} />
              <span className="text-xs text-text-secondary leading-tight text-center">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider px-2 mb-2">Навигация</p>
        {navItems.map(item => (
          <motion.button
            key={item.label}
            onClick={() => { setCurrentPage(item.page); onClose(); }}
            whileHover={{ x: 2 }}
            className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm ${
              currentPage === item.page ? 'sidebar-item-active' : 'text-text-secondary'
            }`}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Categories */}
      <div className="p-3 border-t border-purple-900/20">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider px-2 mb-2">Категории</p>
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
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm ${
                activeCategory === cat.id ? 'sidebar-item-active' : 'text-text-secondary'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="flex-1 text-left">{cat.name}</span>
              <span className="text-xs text-text-secondary bg-purple-900/20 px-2 py-0.5 rounded-full">
                {cat.count}
              </span>
              {cat.subcategories && (
                <ChevronDown
                  size={14}
                  className={`transition-transform ${expandedCategory === cat.id ? 'rotate-180' : ''}`}
                />
              )}
            </motion.button>
            <AnimatePresence>
              {cat.subcategories && expandedCategory === cat.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-6"
                >
                  {cat.subcategories.map(sub => (
                    <motion.button
                      key={sub}
                      whileHover={{ x: 2 }}
                      onClick={() => { setCurrentPage('market'); onClose(); }}
                      className="sidebar-item w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-xs text-text-secondary"
                    >
                      <ChevronRight size={12} />
                      {sub}
                    </motion.button>
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 bg-bg-secondary border-r border-purple-900/20 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
