import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, ChevronDown, X, Search,
  Package, Zap, ShoppingBag
} from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { categories } from '../data/mockData';
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
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showGuaranteeOnly, setShowGuaranteeOnly] = useState(false);
  const [showEscrowOnly, setShowEscrowOnly] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [search, setSearch] = useState('');

  /* ============ Загрузка товаров ============ */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .or('status.eq.active,status.is.null')
          .order('created_at', { ascending: false });

        const sellerIds = [...new Set((data || []).map((d: any) => d.seller_id).filter(Boolean))];
        let sellersMap: Record<string, any> = {};
        if (sellerIds.length > 0) {
          const { data: sellers } = await supabase
            .from('users')
            .select('id, username, avatar_url, rating, sales, verified, role, level')
            .in('id', sellerIds);
          sellers?.forEach((s: any) => { sellersMap[s.id] = s; });
        }

        const mapped = (data || []).map((row: any) => {
          const s = sellersMap[row.seller_id];
          return dbToAccount({
            ...row,
            seller: s ? {
              id: s.id,
              username: s.username || 'Продавец',
              avatar: (s.username?.[0] || 'P').toUpperCase(),
              avatarUrl: s.avatar_url,
              rating: Number(s.rating) || 4.8,
              positivePercent: 98,
              totalSales: s.sales || 0,
              registeredAt: row.created_at,
              level: 'silver',
              isVerified: s.verified ?? false,
              isOnline: false,
              reviewsCount: 0,
              responseTime: '~1ч',
              role: s.role,
              userLevel: s.level || 1,
            } as any : undefined
          });
        });
        setAccounts(mapped);
      } catch (e) {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase.channel('accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory || a.subcategory === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.seller?.username?.toLowerCase().includes(q)
      );
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
    }
    return result;
  }, [accounts, selectedCategory, minPrice, maxPrice, showGuaranteeOnly, showEscrowOnly, selectedRisk, sortBy, search]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setShowGuaranteeOnly(false);
    setShowEscrowOnly(false);
    setSelectedRisk('all');
    setSearch('');
  };

  const activeFiltersCount = [
    selectedCategory !== 'all',
    minPrice || maxPrice,
    showGuaranteeOnly,
    showEscrowOnly,
    selectedRisk !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-bg-secondary border border-purple-700/30 rounded-2xl p-5 overflow-hidden"
      >
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Маркет аккаунтов</h1>
        <p className="text-sm text-text-secondary">
          {accounts.length} аккаунтов · мгновенная выдача · Escrow защита 🌙
        </p>
      </motion.div>

      {/* === Категории-квадратики === */}
      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-3">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
          {/* «Все» */}
          <motion.button
            onClick={() => setSelectedCategory('all')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600/30 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                : 'bg-bg-secondary border-purple-900/20 hover:border-purple-700/50'
            }`}
          >
            <span className="text-2xl">🌐</span>
            <span className={`text-[10px] font-semibold truncate w-full text-center px-1 ${
              selectedCategory === 'all' ? 'text-white' : 'text-text-secondary'
            }`}>Все</span>
          </motion.button>

          {categories.map(cat => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600/30 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                  : 'bg-bg-secondary border-purple-900/20 hover:border-purple-700/50'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className={`text-[10px] font-semibold truncate w-full text-center px-1 ${
                selectedCategory === cat.id ? 'text-white' : 'text-text-secondary'
              }`}>{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* === Поиск + фильтры + сортировка === */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Поиск */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск товаров..."
            className="w-full pl-9 pr-4 py-2.5 bg-bg-card border border-purple-900/30 rounded-xl text-sm text-white placeholder:text-text-secondary"
          />
        </div>

        {/* Фильтры */}
        <button
          onClick={() => setShowFiltersModal(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-purple-900/30 rounded-xl text-sm text-white hover:border-purple-700/40"
        >
          <SlidersHorizontal size={14} />
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Сортировка */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-bg-card border border-purple-900/30 rounded-xl text-sm text-white hover:border-purple-700/40 cursor-pointer"
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

        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="text-xs text-purple-400 hover:underline ml-2">
            Сбросить
          </button>
        )}
      </div>

      <div className="text-sm text-text-secondary">
        Найдено: <span className="text-white font-semibold">{filteredAccounts.length}</span>
      </div>

      {/* === ТОВАРЫ — вертикальные прямоугольники, 3 в ряд === */}
      {loading ? (
        <div className="text-center py-20 text-text-secondary">Загрузка аккаунтов...</div>
      ) : filteredAccounts.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <ShoppingBag size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {accounts.length === 0 ? 'Пока нет аккаунтов в продаже' : 'Ничего не найдено'}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {accounts.length === 0 ? 'Станьте первым продавцом!' : 'Попробуйте изменить фильтры'}
          </p>
          <button
            onClick={() => accounts.length === 0 ? setCurrentPage('sell') : resetFilters()}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold"
          >
            {accounts.length === 0 ? 'Выложить аккаунт' : 'Сбросить фильтры'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* === МОДАЛКА ФИЛЬТРОВ === */}
      <AnimatePresence>
        {showFiltersModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setShowFiltersModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={18} /> Фильтры
                </h2>
                <button onClick={() => setShowFiltersModal(false)} className="text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Цена */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block font-semibold">💰 Цена, ₽</label>
                  <div className="flex gap-2">
                    <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="от"
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-purple-900/30 rounded-xl text-sm text-white" />
                    <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="до"
                      className="w-full px-3 py-2.5 bg-bg-secondary border border-purple-900/30 rounded-xl text-sm text-white" />
                  </div>
                </div>

                {/* Защита */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block font-semibold">🛡️ Защита</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-secondary rounded-xl">
                      <input type="checkbox" checked={showGuaranteeOnly} onChange={e => setShowGuaranteeOnly(e.target.checked)} className="accent-purple-500 w-4 h-4" />
                      <span className="text-sm text-white">Только с гарантией</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-secondary rounded-xl">
                      <input type="checkbox" checked={showEscrowOnly} onChange={e => setShowEscrowOnly(e.target.checked)} className="accent-purple-500 w-4 h-4" />
                      <span className="text-sm text-white">Только эскроу</span>
                    </label>
                  </div>
                </div>

                {/* Риск */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block font-semibold">🚦 Уровень риска</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'all', label: 'Любой', cls: '' },
                      { id: 'low', label: 'Низкий', cls: 'green' },
                      { id: 'medium', label: 'Средний', cls: 'yellow' },
                      { id: 'high', label: 'Высокий', cls: 'red' },
                    ].map(r => (
                      <button key={r.id} onClick={() => setSelectedRisk(r.id)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedRisk === r.id
                            ? r.cls === 'green' ? 'bg-green-900/30 border-green-500 text-green-400' :
                              r.cls === 'yellow' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' :
                              r.cls === 'red' ? 'bg-red-900/30 border-red-500 text-red-400' :
                              'bg-purple-900/30 border-purple-500 text-white'
                            : 'bg-bg-secondary border-purple-900/30 text-text-secondary'
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => { resetFilters(); setShowFiltersModal(false); }}
                  className="flex-1 py-3 bg-purple-900/20 hover:bg-purple-900/40 text-white rounded-xl text-sm font-semibold">
                  Сбросить
                </button>
                <button onClick={() => setShowFiltersModal(false)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
                  Показать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketPage;
