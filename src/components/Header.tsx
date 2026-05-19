import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Search, ShoppingCart, Bell, ChevronDown, MessageSquare,
  User, Settings, LogOut, Star, Package,
  Wallet, Menu, X
} from 'lucide-react';
import { currentUser, notifications, categories } from '../data/mockData';
import type { Page } from '../types/pages';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  cartCount: number;
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, cartCount, onMenuToggle, isMobileMenuOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('Все');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { label: string; page: Page }[] = [
    { label: 'Форум', page: 'forum' },
    { label: 'Маркет', page: 'market' },
    { label: 'Продать', page: 'sell' },
    { label: 'Залив', page: 'bulk' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-900/20">
      <div className="flex items-center h-16 px-4 gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-text-secondary hover:text-text-primary transition-colors p-1"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => setCurrentPage('market')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center glow-purple">
              <Moon size={20} className="text-white" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-glow" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </motion.div>

        {/* Nav items - desktop */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map(item => (
            <motion.button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-purple-900/40 text-accent-soft'
                  : 'text-text-secondary hover:text-text-primary hover:bg-purple-900/20'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Search bar */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl overflow-hidden hover:border-purple-700/50 transition-all focus-within:border-purple-600/60 focus-within:shadow-[0_0_0_2px_rgba(138,43,226,0.15)]">
            <div className="relative" ref={undefined}>
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="flex items-center gap-1 px-3 py-2 text-xs text-text-secondary hover:text-text-primary border-r border-purple-900/30 whitespace-nowrap transition-colors"
              >
                {searchCategory} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showCategoryFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-1 dropdown w-40 z-50"
                  >
                    {['Все', ...categories.map(c => c.name)].map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSearchCategory(cat); setShowCategoryFilter(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          searchCategory === cat ? 'text-accent-soft bg-purple-900/20' : 'text-text-secondary hover:text-text-primary hover:bg-purple-900/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск аккаунтов..."
              className="flex-1 px-3 py-2 bg-transparent border-none text-sm text-text-primary placeholder:text-text-secondary min-w-0"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
            />
            <button className="p-2 text-text-secondary hover:text-accent transition-colors">
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Balance */}
          <motion.button
            onClick={() => setCurrentPage('profile')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-900/20 border border-purple-800/30 rounded-xl hover:border-purple-600/50 transition-all"
            whileHover={{ scale: 1.03 }}
          >
            <Wallet size={14} className="text-accent" />
            <span className="text-sm font-semibold text-text-primary">
              {currentUser.balance.toLocaleString('ru-RU')} ₽
            </span>
          </motion.button>

          {/* Cart */}
          <motion.button
            onClick={() => setCurrentPage('cart')}
            className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>

          {/* Messages */}
          <motion.button
            className="hidden sm:flex relative p-2 text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageSquare size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full" />
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse-glow">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 notif-panel z-50"
                >
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary">Уведомления</h3>
                      <span className="badge">{unreadCount} новых</span>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif, i) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors cursor-pointer ${
                          !notif.isRead ? 'border-l-2 border-l-accent' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{notif.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{notif.title}</p>
                            <p className="text-xs text-text-secondary truncate">{notif.text}</p>
                            <p className="text-xs text-purple-600 mt-0.5">{notif.time}</p>
                          </div>
                          {!notif.isRead && <div className="w-2 h-2 bg-accent rounded-full mt-1 flex-shrink-0" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-3 text-center">
                    <button className="text-sm text-accent hover:text-accent-hover transition-colors">
                      Все уведомления
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center avatar-ring">
                <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
              </div>
              <ChevronDown size={14} className="hidden sm:block text-text-secondary" />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 dropdown z-50"
                >
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center avatar-ring">
                        <span className="text-sm font-bold text-white">{currentUser.avatar}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{currentUser.username}</p>
                        <p className="text-xs text-text-secondary">{currentUser.level} уровень</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Баланс</span>
                      <span className="text-sm font-bold text-accent-soft">{currentUser.balance.toLocaleString()} ₽</span>
                    </div>
                  </div>
                  {[
                    { icon: User, label: 'Профиль', page: 'profile' as Page },
                    { icon: Package, label: 'Мои покупки', page: 'purchases' as Page },
                    { icon: Star, label: 'Избранное', page: 'favorites' as Page },
                    { icon: Settings, label: 'Настройки', page: 'settings' as Page },
                  ].map(item => (
                    <button
                      key={item.page}
                      onClick={() => { setCurrentPage(item.page); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-purple-900/10 transition-colors"
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-purple-900/20 mt-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-900/10 transition-colors">
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
