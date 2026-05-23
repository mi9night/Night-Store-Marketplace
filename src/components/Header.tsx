import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Search, ShoppingCart, Bell, ChevronDown, MessageSquare, LifeBuoy,
  User, Settings, LogOut, Star, Package,
  Wallet, Menu, X, Trash2, ArrowRight, Plus, ArrowDownLeft, ArrowLeftRight, CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import type { Page } from '../types/pages';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';
import { maskEmail, readSensitiveHidden, subscribeSensitiveHidden, writeSensitiveHidden } from '../utils/sensitiveVisibility';

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
  currentPage, setCurrentPage, cartCount, cartItems = [],
  onRemoveFromCart, onMenuToggle, isMobileMenuOpen, onOpenAccount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('Все');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);

  const { currency, setCurrency, convert, symbol } = useCurrency();

  // Balance menu state
  const [balAction, setBalAction] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [balAmount, setBalAmount] = useState('');
  const [balRecipient, setBalRecipient] = useState('');
  const [balLoading, setBalLoading] = useState(false);
  const [balResult, setBalResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [hideSensitiveInfo, setHideSensitiveInfo] = useState(() => readSensitiveHidden(true));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  /* ============ USER + Профиль + Уведомления ============ */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('balance, role, verified, username, level, custom_id, avatar_url')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile?.balance != null) setBalance(profile.balance);
        if (profile) setMyProfile(profile);

        loadNotifications(data.user.id);
        loadUnreadMessages(data.user.id);
        loadRecentChats(data.user.id);
      }
    };
    init();

    const unsubscribeSensitive = subscribeSensitiveHidden(setHideSensitiveInfo);

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadNotifications(session.user.id);
      }
    );
    return () => {
      unsubscribeSensitive();
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadUnreadMessages = async (userId: string) => {
    try {
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId).eq('is_read', false);
      setUnreadMessages(count || 0);
    } catch { setUnreadMessages(0); }
  };

  const loadRecentChats = async (userId: string) => {
    try {
      const { data: msgs } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false }).limit(50);
      if (!msgs) return;
      const map = new Map<string, any>();
      for (const m of msgs) {
        const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (!map.has(partnerId)) {
          map.set(partnerId, {
            partner_id: partnerId, last_message: m.text, last_at: m.created_at,
            unread: 0, is_mine: m.sender_id === userId,
          });
        }
        const c = map.get(partnerId);
        if (m.receiver_id === userId && !m.is_read) c.unread += 1;
      }
      const list = Array.from(map.values()).slice(0, 5);
      const pIds = list.map(c => c.partner_id);
      if (pIds.length > 0) {
        const { data: users } = await supabase.from('users')
          .select('id, username, email, avatar_url').in('id', pIds);
        users?.forEach(u => {
          const c = map.get(u.id);
          if (c) {
            c.partner_name = u.username || u.email?.split('@')[0] || 'User';
            c.partner_avatar_url = u.avatar_url;
            c.partner_avatar = (c.partner_name?.[0] || 'U').toUpperCase();
          }
        });
      }
      setRecentChats(list);
    } catch { setRecentChats([]); }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const { data } = await supabase.from('notifications')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(20);
      setNotifications(data || []);
    } catch { setNotifications([]); }
  };

  /* ============ Realtime ============ */
  useEffect(() => {
    if (!user?.id) return;
    const notifChannel = supabase.channel('notifications_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadNotifications(user.id)
      ).subscribe();

    const msgChannel = supabase.channel('messages_unread')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { loadUnreadMessages(user.id); loadRecentChats(user.id); }
      ).subscribe();

    const profileChannel = supabase.channel('my_profile_sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        async () => {
          const { data: p } = await supabase.from('users')
            .select('balance, role, verified, username, level, custom_id, avatar_url')
            .eq('id', user.id).maybeSingle();
          if (p) {
            setMyProfile(p);
            if (p.balance != null) setBalance(p.balance);
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id]);

  /* ============ Клик вне ============ */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) setShowCartDropdown(false);
      if (balanceRef.current && !balanceRef.current.contains(e.target as Node)) setShowBalance(false);
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setShowMsgDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ============ Уведомление — клик ============ */
  const handleNotificationClick = async (notif: Notif) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link_type === 'account' && notif.link_id && onOpenAccount) {
      onOpenAccount(notif.link_id);
    } else if (notif.link_type === 'forum') setCurrentPage('forum');
    else if (notif.link_type === 'order') setCurrentPage('purchases');
    else if (notif.link_type === 'profile') setCurrentPage('profile');
    setShowNotifications(false);
  };

  /* ============ Баланс операции ============ */
  const balanceInCurrency = convert(balance);
  const toggleSensitiveInfo = () => writeSensitiveHidden(!hideSensitiveInfo);
  const visibleBalanceText = hideSensitiveInfo
    ? '••••••'
    : `${convert(balance).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} ${symbol}`;

  const submitBalance = async () => {
    setBalResult(null);
    const num = parseFloat(balAmount);
    if (!num || num <= 0) { setBalResult({ type: 'err', text: 'Введите сумму' }); return; }
    setBalLoading(true);
    try {
      const errMap: Record<string, string> = {
        not_authenticated: 'Войдите', invalid_amount: 'Неверная сумма',
        insufficient_balance: 'Недостаточно средств',
        recipient_not_found: 'Получатель не найден',
        cannot_transfer_to_self: 'Нельзя самому себе',
      };
      // Все операции уходят в pending → ждут одобрения модерации
      if (balAction === 'transfer' && !balRecipient.trim()) {
        setBalResult({ type: 'err', text: 'Укажите получателя' });
        return;
      }
      if ((balAction === 'withdraw' || balAction === 'transfer') && num > balance) {
        setBalResult({ type: 'err', text: 'Недостаточно средств' });
        return;
      }

      const { error: insertErr } = await supabase.from('operations').insert({
        user_id: user?.id,
        type: balAction,
        amount: num,
        recipient: balAction === 'transfer' ? balRecipient : null,
        status: 'pending',
      });
      if (insertErr) throw insertErr;

      setBalResult({
        type: 'ok',
        text: '✅ Заявка отправлена модерации. Появится в "Мои операции"',
      });
      setTimeout(() => {
        setBalAction(null); setBalAmount(''); setBalRecipient('');
      }, 1500);
    } catch (e: any) {
      setBalResult({ type: 'err', text: e.message });
    } finally {
      setBalLoading(false);
    }
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
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    return `${Math.floor(h / 24)} дн назад`;
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
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-900/20 bg-bg-secondary/80 backdrop-blur">
      <div className="flex items-center h-16 px-4 gap-4">
        <button onClick={onMenuToggle} className="lg:hidden text-text-secondary hover:text-text-primary p-1">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <motion.div className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => setCurrentPage('market')}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
              <Moon size={20} className="text-white" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </motion.div>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map(item => (
            <motion.button key={item.page} onClick={() => setCurrentPage(item.page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.page ? 'bg-purple-900/40 text-accent-soft'
                  : 'text-text-secondary hover:text-text-primary hover:bg-purple-900/20'
              }`}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl overflow-hidden hover:border-purple-700/50">
            <div className="relative">
              <button onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="flex items-center gap-1 px-3 py-2 text-xs text-text-secondary border-r border-purple-900/30 whitespace-nowrap">
                {searchCategory} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showCategoryFilter && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-1 bg-bg-card border border-purple-900/30 rounded-xl w-40 z-50 shadow-xl overflow-hidden">
                    {['Все', ...categories.map(c => c.name)].map(cat => (
                      <button key={cat} onClick={() => { setSearchCategory(cat); setShowCategoryFilter(false); }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          searchCategory === cat ? 'text-accent-soft bg-purple-900/20' : 'text-text-secondary hover:bg-purple-900/10'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск аккаунтов..."
              className="flex-1 px-3 py-2 bg-transparent border-none text-sm text-text-primary placeholder:text-text-secondary min-w-0"
              style={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
            <button className="p-2 text-text-secondary hover:text-accent">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ===== BALANCE (выезжающий дропдаун) ===== */}
          <div className="relative flex items-center gap-2" ref={balanceRef}>
            <motion.button onClick={() => setShowBalance(!showBalance)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-900/20 border border-purple-800/30 rounded-xl hover:border-purple-600/50"
              whileHover={{ scale: 1.03 }}>
              <Wallet size={14} className="text-accent" />
              <span className="text-sm font-semibold text-text-primary">
                {visibleBalanceText}
              </span>
            </motion.button>
            <button
              type="button"
              onClick={toggleSensitiveInfo}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-purple-900/20 border border-purple-800/30 text-text-secondary hover:text-white hover:border-purple-600/50"
              title={hideSensitiveInfo ? 'Показать баланс и email' : 'Скрыть баланс и email'}
            >
              {hideSensitiveInfo ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <AnimatePresence>
              {showBalance && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-purple-900/20 flex items-center gap-2">
                    <Wallet size={16} className="text-purple-400" />
                    <h3 className="text-sm font-semibold text-white flex-1">Баланс</h3>
                    <button
                      type="button"
                      onClick={toggleSensitiveInfo}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-900/20 border border-purple-800/30 text-text-secondary hover:text-white hover:border-purple-600/50"
                      title={hideSensitiveInfo ? 'Показать баланс и email' : 'Скрыть баланс и email'}
                    >
                      {hideSensitiveInfo ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Сумма + валюты */}
                    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-xl p-4">
                      <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">Доступно</div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {hideSensitiveInfo ? `•••••• ${symbol}` : `${balanceInCurrency.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${symbol}`}
                      </div>
                      {currency !== 'RUB' && (
                        <div className="text-[10px] text-text-secondary mb-2">
                          {hideSensitiveInfo ? '≈ •••••• ₽ · валюта применится ко всему сайту' : `≈ ${balance.toLocaleString('ru-RU')} ₽ · валюта применится ко всему сайту`}
                        </div>
                      )}
                      {user?.email && (
                        <div className="text-xs text-text-secondary mb-3 break-all">
                          {hideSensitiveInfo ? maskEmail(user.email) : user.email}
                        </div>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {CURRENCIES.map(c => (
                          <button key={c.code} onClick={() => setCurrency(c.code)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              currency === c.code ? 'bg-purple-600 border-purple-400 text-white'
                                : 'bg-purple-900/30 border-purple-800/30 text-text-secondary'
                            }`}>
                            {c.flag} {c.code}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!balAction ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'deposit',  label: 'Пополнить', icon: Plus,            color: 'text-green-400' },
                          { id: 'withdraw', label: 'Вывести',   icon: ArrowDownLeft,   color: 'text-red-400' },
                          { id: 'transfer', label: 'Перевести', icon: ArrowLeftRight,  color: 'text-purple-300' },
                        ].map(b => (
                          <button key={b.id} onClick={() => { setBalAction(b.id as any); setBalResult(null); setBalAmount(''); }}
                            className="flex flex-col items-center gap-1.5 p-3 bg-bg-secondary rounded-xl border border-purple-900/20 hover:border-purple-700/50">
                            <b.icon size={16} className={b.color} />
                            <span className="text-[10px] text-white font-semibold">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-white">
                            {balAction === 'deposit' && '➕ Пополнить'}
                            {balAction === 'withdraw' && '➖ Вывести'}
                            {balAction === 'transfer' && '↔️ Перевести'}
                          </h4>
                          <button onClick={() => setBalAction(null)} className="text-text-secondary hover:text-white">
                            <X size={14} />
                          </button>
                        </div>
                        <input type="number" value={balAmount} onChange={e => setBalAmount(e.target.value)}
                          placeholder="Сумма ₽"
                          className="w-full px-3 py-2 mb-2 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white" />
                        {balAction === 'transfer' && (
                          <>
                            <label className="text-[11px] text-text-secondary mb-1 block">Получатель (email, ник или ID)</label>
                            <input type="text" value={balRecipient} onChange={e => setBalRecipient(e.target.value)}
                              placeholder="nickname / user@example.com / ID"
                              className="w-full px-3 py-2 mb-1 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white" />
                            <p className="text-[10px] text-text-secondary mb-2">Можно переводить по нику, email или ID.</p>
                          </>
                        )}
                        {balResult && (
                          <div className={`text-xs mb-2 p-2 rounded-lg flex items-start gap-2 ${
                            balResult.type === 'ok' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {balResult.type === 'ok' ? <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />}
                            <span>{balResult.text}</span>
                          </div>
                        )}
                        <button onClick={submitBalance} disabled={balLoading}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                          {balLoading ? 'Обработка...' : 'Подтвердить'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <div className="relative" ref={cartRef}>
            <motion.button onClick={() => setShowCartDropdown(!showCartDropdown)}
              className="relative p-2 text-text-secondary hover:text-text-primary"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
            <AnimatePresence>
              {showCartDropdown && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-purple-900/20">
                    <h3 className="text-sm font-semibold text-white">Корзина ({cartCount})</h3>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">Корзина пуста</div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto">
                        {cartItems.map(item => (
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
                        <button onClick={() => { setCurrentPage('cart'); setShowCartDropdown(false); }}
                          className="w-full py-2 bg-accent text-white rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
                          В корзину <ArrowRight size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages dropdown */}
          <div className="relative hidden sm:block" ref={msgRef}>
            <motion.button onClick={() => setShowMsgDropdown(!showMsgDropdown)}
              className="relative p-2 text-text-secondary hover:text-text-primary"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MessageSquare size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadMessages}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {showMsgDropdown && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-purple-900/20 flex items-center justify-between">
                    <h3 className="font-semibold text-text-primary">Сообщения</h3>
                    {unreadMessages > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-soft">{unreadMessages} новых</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentChats.length === 0 ? (
                      <div className="p-6 text-center text-text-secondary text-sm">Сообщений нет</div>
                    ) : (
                      recentChats.map(c => (
                        <button key={c.partner_id}
                          onClick={() => { setCurrentPage('messages' as Page); setShowMsgDropdown(false); }}
                          className={`w-full p-3 flex items-center gap-3 hover:bg-purple-900/10 border-b border-purple-900/10 text-left ${
                            c.unread > 0 ? 'border-l-2 border-l-accent bg-purple-900/5' : ''
                          }`}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {c.partner_avatar_url
                              ? <img src={c.partner_avatar_url} className="w-full h-full object-cover" alt="" />
                              : <span className="text-sm font-bold text-white">{c.partner_avatar || 'U'}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{c.partner_name || 'User'}</p>
                            <p className="text-xs text-text-secondary truncate">
                              {c.is_mine ? 'Вы: ' : ''}{c.last_message}
                            </p>
                          </div>
                          {c.unread > 0 && (
                            <span className="w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">{c.unread}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => { setCurrentPage('messages' as Page); setShowMsgDropdown(false); }}
                    className="w-full p-3 text-sm text-purple-300 hover:bg-purple-900/10 font-semibold border-t border-purple-900/20"
                  >
                    Все сообщения →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Support — отдельная кнопка */}
          <motion.button onClick={() => setCurrentPage('support' as Page)}
            className={`relative p-2 transition-colors ${
              currentPage === 'support' ? 'text-purple-300' : 'text-text-secondary hover:text-text-primary'
            }`}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            title="Поддержка">
            <LifeBuoy size={20} />
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-text-secondary hover:text-text-primary"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </motion.button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary">Уведомления</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-soft">{unreadCount} новых</span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-text-secondary text-sm">Уведомлений пока нет</div>
                    ) : (
                      notifications.map((notif, i) => (
                        <motion.div key={notif.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 border-b border-purple-900/10 hover:bg-purple-900/10 cursor-pointer ${
                            !notif.is_read ? 'border-l-2 border-l-accent bg-purple-900/5' : ''
                          }`}>
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
            <motion.button onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2" whileHover={{ scale: 1.03 }}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
                {myProfile?.avatar_url ? (
                  <img src={myProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <ChevronDown size={14} className="hidden sm:block text-text-secondary" />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-purple-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
                        {myProfile?.avatar_url ? (
                          <img src={myProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary text-sm truncate flex items-center gap-1.5 flex-wrap">
                          {myProfile?.username || user?.email?.split('@')[0] || 'User'}
                          <RoleBadge role={myProfile?.role} />
                          <LevelBadge level={myProfile?.level || 1} compact />
                        </p>
                        {myProfile?.custom_id && (
                          <p className="text-[10px] text-purple-300 font-mono mt-0.5">#{myProfile.custom_id}</p>
                        )}
                        <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  {[
                    { icon: User, label: 'Профиль', page: 'profile' as Page },
                    { icon: Package, label: 'Мои покупки', page: 'purchases' as Page },
                    { icon: Star, label: 'Избранное', page: 'favorites' as Page },
                    { icon: Settings, label: 'Настройки', page: 'settings' as Page },
                  ].map(item => (
                    <button key={item.page} onClick={() => { setCurrentPage(item.page); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-purple-900/10">
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-purple-900/20 mt-1">
                    <button onClick={async () => { await supabase.auth.signOut(); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-red-900/10">
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
