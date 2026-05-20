import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Search, ShoppingCart, Bell, ChevronDown, MessageSquare,
  User, Settings, LogOut, Star, Package,
  Wallet, Menu, X, Trash2, ArrowRight
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import MessagesModal from './MessagesModal';
import { RoleBadge } from './ModerationPanel';
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
  onOpenAccount?: (accountId: string) => void;
}

interface Notif {
  id: string;
  type: string;
  title: string;
  text: string;
  link_type?: 'account' | 'forum' | 'profile' | 'order' | null;
  link_id?: string | null;
  is_read: boolean;
  created_at: string;
  icon?: string;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  cartCount,
  cartItems = [],
  onRemoveFromCart,
  onMenuToggle,
  isMobileMenuOpen,
  onOpenAccount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('Все');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  /* ============ USER + Профиль + Уведомления ============ */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        // Профиль с балансом
        const { data: profile } = await supabase
          .from('users')
          .select('balance, role, verified, username')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile?.balance != null) setBalance(profile.balance);
        if (profile) setMyProfile(profile);

        // Уведомления
        loadNotifications(data.user.id);

        // Непрочитанные сообщения
        loadUnreadMessages(data.user.id);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadNotifications(session.user.id);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadUnreadMessages = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
      setUnreadMessages(count || 0);
    } catch { setUnreadMessages(0); }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data || []);
    } catch (e) {
      setNotifications([]);
    }
  };

  /* ============ Real-time подписка на новые уведомления ============ */
  useEffect(() => {
    if (!user?.id) return;

    const notifChannel = supabase
      .channel('notifications_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadNotifications(user.id)
      )
      .subscribe();

    const msgChannel = supabase
      .channel('messages_unread')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadUnreadMessages(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user?.id]);

  /* ============ Клик вне (закрываем дропдауны) ============ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) setShowCartDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ============ Клик по уведомлению ============ */
  const handleNotificationClick = async (notif: Notif) => {
    // Помечаем как прочитанное в БД
    if (!notif.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);

      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    }

    // Переход в зависимости от типа
    if (notif.link_type === 'account' && notif.link_id && onOpenAccount) {
      onOpenAccount(notif.link_id);
    } else if (notif.link_type === 'forum') {
      setCurrentPage('forum');
    } else if (notif.link_type === 'order') {
      setCurrentPage('purchases');
    } else if (notif.link_type === 'profile') {
      setCurrentPage('profile');
    }

    setShowNotifications(false);
  };

  const cartTotal = (cartItems ?? []).reduce((s, i) => s + (i?.price ?? 0), 0);

  const navItems: { label: string; page: Page }[] = [
    { label: 'Форум', page: 'forum' },
    { label: 'Маркет', page: 'market' },
    { label: 'Продать', page: 'sell' },
    { label: 'Залив', page: 'bulk' },
  ];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн назад`;
  };

  const notifIcon = (type: string): string => {
    if (type === 'purchase') return '🛒';
    if (type === 'sale') return '💰';
    if (type === 'message') return '💬';
    if (type === 'system') return '⚙️';
    if (type === 'promo') return '🎁';
    return '🔔';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-900/20">
      <div className="flex items-center h-16 px-4 gap-4">
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
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </motion.div>

        {/* Nav */}
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

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl overflow-hidden hover:border-purple-700/50 transition-all">
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="flex items-center gap-1 px-3 py-2 text-xs text-text-secondary hover:text-text-primary border-r border-purple-900/30 whitespace-nowrap"
              >
                {searchCategory} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showCategoryFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-1 bg-bg-card border border-purple-900/30 rounded-xl w-40 z-50 shadow-xl overflow-hidden"
                  >
                    {['Все', ...categories.map(c => c.name)].map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSearchCategory(cat); setShowCategoryFilter(false); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          searchCategory === cat ? 'text-accent-soft bg-purple-900/20' : 'text-text-secondary hover:bg-purple-900/10'
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
              {balance.toLocaleString('ru-RU')} ₽
            </span>
          </motion.button>

          {/* Cart */}
          <div className="relative" ref={cartRef}>
            <motion.button
              onClick={() => setShowCartDropdown(!showCartDropdown)}
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

            <AnimatePresence>
              {showCartDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-purple-900/20">
                    <h3 className="text-sm font-semibold text-white">Корзина ({cartCount})</h3>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">Корзина пуста</div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto">
                        {cartItems.map((item) => (
                          <div key={item.id} className="p-3 flex items-center justify-between border-b border-purple-900/10">
                            <span className="text-sm text-white truncate">{item.title}</span>
                            <button onClick={() => onRemoveFromCart?.(item.id)} className="text-error">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between mb-3 text-sm">
                          <span className="text-text-secondary">Итого:</span>
                          <span className="font-bold text-white">{cartTotal} ₽</span>
                        </div>
                        <button
                          onClick={() => { setCurrentPage('cart'); setShowCartDropdown(false); }}
                          className="w-full py-2 bg-accent text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
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

          {/* Messages */}
          <motion.button
            onClick={() => setShowMessages(true)}
            className="hidden sm:flex relative p-2 text-text-secondary hover:text-text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageSquare size={20} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-success text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadMessages}
              </span>
            )}
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
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
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
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary">Уведомления</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-soft">
                          {unreadCount} новых
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-text-secondary text-sm">
                        Уведомлений пока нет
                      </div>
                    ) : (
                      notifications.map((notif, i) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 border-b border-purple-900/10 hover:bg-purple-900/10 transition-colors cursor-pointer ${
                            !notif.is_read ? 'border-l-2 border-l-accent bg-purple-900/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{notif.icon || notifIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{notif.title}</p>
                              <p className="text-xs text-text-secondary truncate">{notif.text}</p>
                              <p className="text-xs text-purple-600 mt-0.5">{timeAgo(notif.created_at)}</p>
                            </div>
                            {!notif.is_read && <div className="w-2 h-2 bg-accent rounded-full mt-1 flex-shrink-0" />}
                          </div>
                        </motion.div>
                      ))
                    )}
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <ChevronDown size={14} className="hidden sm:block text-text-secondary" />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary text-sm truncate flex items-center gap-1.5">
                          {myProfile?.username || user?.email?.split('@')[0] || 'User'}
                          <RoleBadge role={myProfile?.role} />
                        </p>
                        <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Баланс</span>
                      <span className="text-sm font-bold text-accent-soft">{balance.toLocaleString('ru-RU')} ₽</span>
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
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-900/10 transition-colors"
                    >
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

      {/* Модалка сообщений */}
      <MessagesModal isOpen={showMessages} onClose={() => setShowMessages(false)} />
    </header>
  );
};

export default Header;
