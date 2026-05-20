import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Search,
  ShoppingCart,
  Bell,
  ChevronDown,
  Menu,
  X,
  Trash2,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page, filter?: string | null) => void;
  cartCount: number;
  cartItems?: Account[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  cartCount,
  cartItems = [],
  onRemoveFromCart,
  onClearCart,
  onMenuToggle,
  isMobileMenuOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);

  const [user, setUser] = useState<any>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  /* ================= USER ================= */

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ================= CLICK OUTSIDE ================= */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      )
        setShowProfile(false);

      if (
        cartRef.current &&
        !cartRef.current.contains(e.target as Node)
      )
        setShowCartDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartTotal = useMemo(
    () => (cartItems ?? []).reduce((sum, item) => sum + (item?.price ?? 0), 0),
    [cartItems]
  );

  const navItems: { label: string; page: Page }[] = [
    { label: 'Форум', page: 'forum' },
    { label: 'Маркет', page: 'market' },
    { label: 'Продать', page: 'sell' },
    { label: 'Залив', page: 'bulk' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-900/20">
      <div className="flex items-center h-16 px-4 gap-4">

        {/* Mobile toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-text-secondary p-1"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentPage('market')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
            <Moon size={20} className="text-white" fill="white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </motion.div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-purple-900/40 text-accent-soft'
                  : 'text-text-secondary hover:bg-purple-900/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CART */}
        <div className="relative" ref={cartRef}>
          <motion.button
            onClick={() =>
              setShowCartDropdown(!showCartDropdown)
            }
            className="relative p-2 text-text-secondary"
            whileHover={{ scale: 1.1 }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showCartDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl"
              >
                <div className="p-4 border-b border-purple-900/20">
                  <h3 className="text-sm font-semibold text-white">
                    Корзина ({cartCount})
                  </h3>
                </div>

                {cartItems.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary">
                    Корзина пуста
                  </div>
                ) : (
                  <>
                    <div className="max-h-60 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 flex items-center justify-between border-b border-purple-900/10"
                        >
                          <span className="text-sm text-white truncate">
                            {item.title}
                          </span>
                          <button
                            onClick={() =>
                              onRemoveFromCart?.(item.id)
                            }
                            className="text-error"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between mb-3">
                        <span>Итого:</span>
                        <span className="font-bold">
                          {cartTotal} ₽
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentPage('cart');
                          setShowCartDropdown(false);
                        }}
                        className="w-full py-2 bg-accent text-white rounded-xl flex items-center justify-center gap-2"
                      >
                        Перейти в корзину <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-4 border-b border-purple-900/20">
                  <p className="text-sm text-white truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-text-secondary hover:bg-purple-900/20"
                >
                  Профиль
                </button>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-error hover:bg-purple-900/20 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};

export default Header;
