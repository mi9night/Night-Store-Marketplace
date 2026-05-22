import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Search, ShoppingCart, Bell, ChevronDown, MessageSquare, LifeBuoy,
  User, Settings, LogOut, Star, Package,
  Wallet, Menu, X, Trash2, ArrowRight, Plus, ArrowDownLeft, ArrowLeftRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { Account } from '../types';
import type { Page } from '../types/pages';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';

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
  onRemoveFromCart, onMenuToggle, isMobileMenuOpen, onOpenAccount,
  searchQuery, setSearchQuery
}) => {
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

  const [balAction, setBalAction] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [balAmount, setBalAmount] = useState('');
  const [balRecipient, setBalRecipient] = useState('');
  const [balLoading, setBalLoading] = useState(false);
  const [balResult, setBalResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
        if (profile) {
          setMyProfile(profile);
          if (profile.balance != null) setBalance(profile.balance);
        }
        loadNotifications(data.user.id);
        loadUnreadMessages(data.user.id);
        loadRecentChats(data.user.id);
      }
    };
    init();
  }, []);

  const loadUnreadMessages = async (userId: string) => {
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('is_read', false);
    setUnreadMessages(count || 0);
  };

  const loadRecentChats = async (userId: string) => {
    const { data: msgs } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).limit(50);
    if (!msgs) return;
    const map = new Map();
    msgs.forEach(m => {
      const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (!map.has(partnerId)) map.set(partnerId, { partner_id: partnerId, last_message: m.text, last_at: m.created_at, unread: 0, is_mine: m.sender_id === userId });
      if (m.receiver_id === userId && !m.is_read) map.get(partnerId).unread += 1;
    });
    setRecentChats(Array.from(map.values()).slice(0, 5));
  };

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    setNotifications(data || []);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif: Notif) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link_type === 'account' && notif.link_id && onOpenAccount) onOpenAccount(notif.link_id);
    else if (notif.link_type === 'forum') setCurrentPage('forum');
    setShowNotifications(false);
  };

  const submitBalance = async () => {
    setBalResult(null);
    const num = parseFloat(balAmount);
    if (!num || num <= 0) return;
    setBalLoading(true);
    try {
      await supabase.from('operations').insert({ user_id: user?.id, type: balAction, amount: num, recipient: balAction === 'transfer' ? balRecipient : null, status: 'pending' });
      setBalResult({ type: 'ok', text: '✅ Заявка отправлена' });
      setTimeout(() => { setBalAction(null); setBalAmount(''); }, 1500);
    } catch (e: any) { setBalResult({ type: 'err', text: e.message }); } finally { setBalLoading(false); }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-900/20 bg-bg-secondary/80 backdrop-blur">
      <div className="flex items-center h-16 px-4 gap-4">
        <button onClick={onMenuToggle} className="lg:hidden text-text-secondary p-1">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <motion.div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => setCurrentPage('market')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
            <Moon size={20} className="text-white" fill="white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold gradient-text">Night</span>
            <span className="text-lg font-bold text-text-primary">Store</span>
          </div>
        </motion.div>

        <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl overflow-hidden">
            <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if(currentPage !== 'market') setCurrentPage('market'); }}
              placeholder="Поиск по сайту..." className="flex-1 px-4 py-2 bg-transparent text-sm text-text-primary outline-none" />
            <button className="p-2 text-text-secondary"><Search size={16} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Balance */}
          <div className="relative" ref={balanceRef}>
            <button onClick={() => setShowBalance(!showBalance)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-900/20 border border-purple-800/30 rounded-xl">
              <Wallet size={14} className="text-accent" />
              <span className="text-sm font-semibold">{convert(balance).toLocaleString('ru-RU')} {symbol}</span>
            </button>
            <AnimatePresence>
              {showBalance && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-72 bg-bg-card border border-purple-900/20 rounded-2xl p-4 shadow-xl z-50">
                   <div className="text-xs text-text-secondary mb-1">Баланс</div>
                   <div className="text-xl font-bold mb-3">{convert(balance).toLocaleString('ru-RU')} {symbol}</div>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setBalAction('deposit')} className="py-2 bg-purple-600 rounded-lg text-xs font-semibold">Пополнить</button>
                     <button onClick={() => setBalAction('withdraw')} className="py-2 bg-purple-900/40 rounded-lg text-xs font-semibold">Вывести</button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-text-secondary">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-80 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-purple-900/20 flex items-center justify-between">
                    <span className="font-semibold text-sm">Уведомления</span>
                    <button onClick={markAllAsRead} className="text-[10px] text-accent hover:underline">Прочитать все</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? <div className="p-8 text-center text-xs text-text-secondary">Нет уведомлений</div> : 
                      notifications.map(n => (
                        <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-purple-900/10 hover:bg-purple-900/5 cursor-pointer ${!n.is_read ? 'bg-purple-900/10' : ''}`}>
                          <div className="text-xs font-semibold">{n.title}</div>
                          <div className="text-[10px] text-text-secondary truncate">{n.text}</div>
                        </div>
                      ))
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center overflow-hidden">
              {myProfile?.avatar_url ? <img src={myProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="text-white" />}
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-bg-card border border-purple-900/20 rounded-2xl shadow-xl z-50 py-2">
                  <button onClick={() => {setCurrentPage('settings'); setShowProfile(false);}} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-purple-900/20 flex items-center gap-2"><Settings size={14}/> Настройки</button>
                  <button onClick={() => supabase.auth.signOut()} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-900/10 flex items-center gap-2"><LogOut size={14}/> Выход</button>
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
