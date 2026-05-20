import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Bookmark, ChevronDown, X,
  TrendingUp, Package, Zap, ShoppingBag
} from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { categories, savedSearches, topSellers } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface MarketPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

type SortOption = 'default' | 'cheap' | 'expensive' | 'new' | 'old' | 'popular';

const MarketPage: React.FC<MarketPageProps> = ({ onSelectAccount, setCurrentPage, onAddToCart }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeSearches, setActiveSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showGuaranteeOnly, setShowGuaranteeOnly] = useState(false);
  const [showEscrowOnly, setShowEscrowOnly] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

  /* ============ Загрузка товаров из Supabase ============ */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Грузим аккаунты + email продавца
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .or('status.eq.active,status.is.null')   // active или без статуса (старые)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Подтягиваем продавцов одним запросом
        const sellerIds = [...new Set((data || []).map((d: any) => d.seller_id).filter(Boolean))];
        let sellersMap: Record<string, any> = {};
        if (sellerIds.length > 0) {
          const { data: sellers } = await supabase
            .from('users')
            .select('id, username, avatar, rating, sales, verified')
            .in('id', sellerIds);
          sellers?.forEach((s: any) => { sellersMap[s.id] = s; });
        }

        // Маппим в формат Account
        const mapped = (data || []).map((row: any) => {
          const s = sellersMap[row.seller_id];
          return dbToAccount({
            ...row,
            seller_name: s?.username,
            seller_avatar: (s?.username?.[0] || 'P').toUpperCase(),
            seller: s ? {
              id: s.id,
              username: s.username || 'Продавец',
              avatar: (s.username?.[0] || 'P').toUpperCase(),
              rating: Number(s.rating) || 4.8,
              positivePercent: 98,
              totalSales: s.sales || 0,
              registeredAt: row.created_at,
              level: 'silver',
              isVerified: s.verified ?? false,
              isOnline: false,
              reviewsCount: 0,
              responseTime: '~1ч',
            } : undefined
          });
        });

        setAccounts(mapped);
      } catch (e: any) {
        console.warn('Не удалось загрузить аккаунты:', e?.message || e);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel('accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory || a.subcategory === selectedCategory);
    }

    if (minPrice) result = result.filter(a => a.price >= parseInt(minPrice));
    if (maxPrice) result = result.filter(a => a.price <= parseInt(maxPrice));
    if (showGuaranteeOnly) result = result.filter(a => a.guarantee);
    if (showEscrowOnly) result = result.filter(a => a.escrow);
    if (selectedRisk !== 'all') result = result.filter(a => a.riskLevel === selectedRisk);

    switch (sortBy) {
      case 'cheap': result.sort((a, b) => a.price - b.price); break;
      case 'expensive': result.sort((a, b) => b.price - a.price); break;
      case 'new': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'old': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'popular': result.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      default: break;
    }

    return result;
  }, [accounts, selectedCategory, minPrice, maxPrice, showGuaranteeOnly, showEscrowOnly, selectedRisk, sortBy]);

  const toggleSearch = (id: string) => {
    setActiveSearches(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setShowGuaranteeOnly(false);
    setShowEscrowOnly(false);
    setSelectedRisk('all');
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-bg-secondary border border-purple-700/30 rounded-2xl p-6 overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Маркет аккаунтов</h1>
          <p className="text-sm text-text-secondary mb-4">
            Покупайте проверенные аккаунты с гарантией и эскроу-защитой 🌙
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/30 border border-purple-700/30 rounded-full">
              <Package size={12} className="text-accent" />
              <span className="text-white">{accounts.length} аккаунтов</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/30 border border-purple-700/30 rounded-full">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-white">Мгновенная выдача</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-purple-900/30 rounded-xl text-sm text-white hover:border-purple-700/40"
        >
          <SlidersHorizontal size={14} /> Фильтры
        </button>

        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-bg-card border border-purple-900/30 rounded-xl text-sm text-white cursor-pointer"
          >
            <option value="default">По умолчанию</option>
            <option value="cheap">Сначала дешёвые</option>
            <option value="expensive">Сначала дорогие</option>
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
            <option value="popular">По популярности</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>

        <div className="flex-1" />
        <div className="text-sm text-text-secondary">
          Найдено: <span className="text-white font-semibold">{filteredAccounts.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-bg-card border border-purple-900/20 rounded-2xl p-4 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Фильтры</h3>
                <button onClick={resetFilters} className="text-xs text-accent">Сбросить</button>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-2 block">Категория</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-secondary border border-purple-900/30 rounded-lg text-sm text-white"
                >
                  <option value="all">Все категории</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-2 block">Цена, ₽</label>
                <div className="flex gap-2">
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="от" className="w-full px-3 py-2 bg-bg-secondary border border-purple-900/30 rounded-lg text-sm text-white" />
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="до" className="w-full px-3 py-2 bg-bg-secondary border border-purple-900/30 rounded-lg text-sm text-white" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showGuaranteeOnly} onChange={e => setShowGuaranteeOnly(e.target.checked)} className="accent-purple-500" />
                <span className="text-sm text-white">Только с гарантией</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showEscrowOnly} onChange={e => setShowEscrowOnly(e.target.checked)} className="accent-purple-500" />
                <span className="text-sm text-white">Только эскроу</span>
              </label>

              <div>
                <label className="text-xs text-text-secondary mb-2 block">Уровень риска</label>
                <select value={selectedRisk} onChange={e => setSelectedRisk(e.target.value)} className="w-full px-3 py-2 bg-bg-secondary border border-purple-900/30 rounded-lg text-sm text-white">
                  <option value="all">Любой</option>
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div>
          {loading ? (
            <div className="text-center py-20 text-text-secondary">Загрузка аккаунтов...</div>
          ) : filteredAccounts.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center">
              <ShoppingBag size={48} className="mx-auto text-purple-700/50 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {accounts.length === 0 ? 'Пока нет аккаунтов в продаже' : 'Ничего не найдено'}
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                {accounts.length === 0 ? 'Станьте первым продавцом!' : 'Попробуйте изменить фильтры'}
              </p>
              <button
                onClick={() => accounts.length === 0 ? setCurrentPage('sell') : resetFilters()}
                className="px-5 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
              >
                {accounts.length === 0 ? 'Выложить аккаунт' : 'Сбросить фильтры'}
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAccounts.map((account, i) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onSelect={onSelectAccount}
                  setCurrentPage={setCurrentPage}
                  onAddToCart={onAddToCart}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
