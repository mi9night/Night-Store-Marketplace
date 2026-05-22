import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowLeftRight,
  Package, ShoppingBag, Receipt, Heart, Tag, Zap,
  Settings, Shield, TrendingUp, DollarSign, Code,
  ChevronDown, Plus, MessageSquare, X, Eye, EyeOff, TrendingDown
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useCurrency, CURRENCIES } from '../lib/CurrencyContext';
import type { Page } from '../types/pages';

interface SidebarProps {
  currentPage: Page;
  forumFilter: string | null;
  setCurrentPage: (page: Page, filter?: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

type BalanceAction = 'deposit' | 'withdraw' | 'transfer' | null;

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
  const [action, setAction] = useState<BalanceAction>(null);

  // Скрытие баланса и почты
  const [hideBalance, setHideBalance] = useState(() => localStorage.getItem('hideBalance') === 'true');
  const [hideEmail, setHideEmail] = useState(() => localStorage.getItem('hideEmail') === 'true');
  const [showCurrencySelect, setShowCurrencySelect] = useState(false);

  const { convert, symbol, currency, setCurrency } = useCurrency();

  useEffect(() => {
    localStorage.setItem('hideBalance', hideBalance.toString());
  }, [hideBalance]);

  useEffect(() => {
    localStorage.setItem('hideEmail', hideEmail.toString());
  }, [hideEmail]);

  /* ============ загрузка пользователя и баланса ============ */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('balance')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profile?.balance != null) setBalance(profile.balance);
      }
    };
    init();
  }, []);

  // Realtime синк баланса
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase.channel('sidebar_balance_sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        async () => {
          const { data: p } = await supabase.from('users')
            .select('balance').eq('id', user.id).maybeSingle();
          if (p?.balance != null) setBalance(p.balance);
        }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const navItems = [
    { icon: Package, label: 'Мои аккаунты', page: 'sell' as Page },
    { icon: ShoppingBag, label: 'Мои покупки', page: 'purchases' as Page },
    { icon: Receipt, label: 'Мои операции', page: 'operations' as Page },
    { icon: Heart, label: 'Избранное', page: 'favorites' as Page },
    { icon: Tag, label: 'Управление метками', page: 'labels' as Page },
    { icon: Zap, label: 'Автопокупки', page: 'autobuy' as Page },
    { icon: Settings, label: 'Настройки', page: 'settings' as Page },
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

      {/* Balance + Actions */}
      <div className="p-4 border-b border-purple-900/20">
        <div className="bg-bg-card rounded-xl p-4 border border-purple-900/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Баланс</span>
              <button 
                onClick={() => setHideBalance(!hideBalance)}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                {hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCurrencySelect(!showCurrencySelect)}
                className="flex items-center gap-1 text-[10px] bg-purple-600/10 text-accent-soft px-1.5 py-0.5 rounded border border-purple-900/30 hover:border-purple-600/50 transition-all"
              >
                {currency} <ChevronDown size={10} />
              </button>
              
              <AnimatePresence>
                {showCurrencySelect && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1 bg-bg-card border border-purple-900/30 rounded-lg shadow-xl z-50 py-1 min-w-[80px]"
                  >
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code);
                          setShowCurrencySelect(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-600/20 transition-colors ${
                          currency === c.code ? 'text-accent-soft' : 'text-text-secondary'
                        }`}
                      >
                        {c.flag} {c.code}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-text-primary tracking-tight">
              {hideBalance ? '••••••••' : (
                <>
                  {convert(balance).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} 
                  <span className="text-base font-medium text-text-secondary ml-1">{symbol}</span>
                </>
              )}
            </p>
          </div>

          {/* Mini Graph + Percentage */}
          {!hideBalance && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-[10px] font-medium text-success">
                <TrendingUp size={10} className="mr-0.5" />
                +2.4%
              </div>
              <div className="h-6 w-16 opacity-50">
                <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                  <path
                    d="M0 35 L10 30 L25 32 L40 20 L60 25 L80 10 L100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-success"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-900/10">
            {user?.email && (
              <p className="text-xs text-text-secondary truncate max-w-[140px]">
                {hideEmail ? '••••••••••••••••' : user.email}
              </p>
            )}
            <button 
              onClick={() => setHideEmail(!hideEmail)}
              className="text-text-secondary hover:text-accent transition-colors"
            >
              {hideEmail ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </div>

        {/* Пополнить / Вывести / Перевести */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { icon: Plus, label: 'Пополнить', color: 'text-success', act: 'deposit' as BalanceAction },
            { icon: ArrowDownLeft, label: 'Вывести', color: 'text-error', act: 'withdraw' as BalanceAction },
            { icon: ArrowLeftRight, label: 'Перевести', color: 'text-accent-soft', act: 'transfer' as BalanceAction },
          ].map(item => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAction(item.act)}
              className="flex flex-col items-center gap-1.5 p-2 bg-bg-card rounded-xl border border-purple-900/20 hover:border-purple-700/40 transition-all"
            >
              <item.icon size={14} className={item.color} />
              <span className="text-[10px] text-text-secondary">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3">
        <p className="text-xs text-text-secondary uppercase px-2 mb-2">Навигация</p>

        {navItems.map(item => {
          const active = isItemActive(item);
          return (
            <motion.button
              key={item.label + ((item as any).filter ?? '')}
              onClick={() => {
                setCurrentPage(item.page, (item as any).filter ?? null);
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
              <span className="text-base">{cat.icon}</span> 
              <span className="ml-1">{cat.name}</span>
              {cat.subcategories && (
                <ChevronDown size={14} className={`ml-auto transition-transform ${
                  expandedCategory === cat.id ? 'rotate-180' : ''
                }`} />
              )}
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

      {/* Модалка для Пополнить / Вывести / Перевести */}
      <BalanceActionModal
        action={action}
        onClose={() => setAction(null)}
        currentBalance={balance}
      />
    </>
  );
};

/* =================== МОДАЛКА действий с балансом =================== */
const BalanceActionModal: React.FC<{
  action: BalanceAction;
  onClose: () => void;
  currentBalance: number;
}> = ({ action, onClose, currentBalance }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (action) {
      setAmount('');
      setRecipient('');
      setMessage(null);
    }
  }, [action]);

  if (!action) return null;

  const titles: Record<Exclude<BalanceAction, null>, string> = {
    deposit: 'Пополнить баланс',
    withdraw: 'Вывести средства',
    transfer: 'Перевести пользователю'
  };

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setMessage('Введите корректную сумму');
      return;
    }
    if (action !== 'deposit' && num > currentBalance) {
      setMessage('Недостаточно средств на балансе');
      return;
    }
    if (action === 'transfer' && !recipient.trim()) {
      setMessage('Укажите получателя');
      return;
    }

    setLoading(true);
    try {
      if ((action === 'withdraw' || action === 'transfer') && num > currentBalance) {
        setMessage('⚠️ Недостаточно средств');
        setLoading(false);
        return;
      }
      if (action === 'transfer' && !recipient.trim()) {
        setMessage('⚠️ Укажите получателя');
        setLoading(false);
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from('operations').insert({
        user_id: u.user?.id,
        type: action,
        amount: num,
        recipient: action === 'transfer' ? recipient : null,
        status: 'pending',
      });
      if (insErr) throw insErr;

      setMessage('✅ Заявка отправлена модерации. Появится в "Мои операции"');

      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      setMessage('⚠️ ' + (e.message || 'Ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-bg-card border border-purple-900/30 rounded-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{titles[action]}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="text-xs text-text-secondary mb-4">
            Текущий баланс: <span className="text-accent-soft font-semibold">{currentBalance.toLocaleString('ru-RU')} ₽</span>
          </div>

          <label className="text-sm text-text-secondary mb-1.5 block">Сумма (₽)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
          />

          {action === 'transfer' && (
            <>
              <label className="text-sm text-text-secondary mb-1.5 block">Получатель (email или ID)</label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
              />
            </>
          )}

          {message && (
            <div className={`text-sm mb-3 p-2 rounded-lg ${
              message.startsWith('✅') ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Обработка...' : titles[action]}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Sidebar;
