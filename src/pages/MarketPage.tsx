import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Bookmark, ChevronDown, X, Search,
  TrendingUp, Users, Package, Zap
} from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { accounts, savedSearches, categories, topSellers } from '../data/mockData';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface MarketPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

type SortOption = 'default' | 'cheap' | 'expensive' | 'new' | 'old' | 'popular';

const MarketPage: React.FC<MarketPageProps> = ({ onSelectAccount, setCurrentPage, onAddToCart }) => {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeSearches, setActiveSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showGuaranteeOnly, setShowGuaranteeOnly] = useState(false);
  const [showEscrowOnly, setShowEscrowOnly] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

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
      case 'popular': result.sort((a, b) => b.views - a.views); break;
      default: break;
    }

    return result;
  }, [selectedCategory, minPrice, maxPrice, sortBy, showGuaranteeOnly, showEscrowOnly, selectedRisk]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'По умолчанию' },
    { value: 'cheap', label: 'Сначала дешевые' },
    { value: 'expensive', label: 'Сначала дорогие' },
    { value: 'new', label: 'Сначала новые' },
    { value: 'old', label: 'Сначала старые' },
    { value: 'popular', label: 'Популярные' },
  ];

  const stats = [
    { icon: Package, label: 'Всего товаров', value: '4,152', color: 'text-accent' },
    { icon: Users, label: 'Продавцов', value: '847', color: 'text-blue-400' },
    { icon: TrendingUp, label: 'Сделок сегодня', value: '234', color: 'text-success' },
    { icon: Zap, label: 'Продаж в час', value: '18', color: 'text-yellow-400' },
  ];



  return (
    <div className="space-y-4">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-bg-card to-purple-900/20 border border-purple-900/30 rounded-2xl p-6"
      >
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🌙</span>
            <span className="badge animate-pulse-glow">Live — Рынок открыт</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-1">
            Добро пожаловать в <span className="gradient-text">Night Store</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-xl">
            Безопасный маркетплейс игровых аккаунтов с AI защитой, системой Escrow и рейтингом продавцов
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              onClick={() => setCurrentPage('sell')}
            >
              <Zap size={15} />
              Продать аккаунт
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-900/20 border border-purple-800/30 text-text-primary hover:border-accent transition-all"
              onClick={() => setCurrentPage('topSellers')}
            >
              🏆 Топ продавцы
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-900/20 flex items-center justify-center">
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top sellers teaser */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card border border-purple-900/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Топ продавцы за 30 дней</h3>
          </div>
          <button
            onClick={() => setCurrentPage('topSellers')}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Смотреть всех →
          </button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {topSellers.slice(0, 5).map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 p-3 bg-bg-primary rounded-xl border border-purple-900/20 hover:border-purple-700/40 transition-all cursor-pointer min-w-[80px]"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{seller.avatar}</span>
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
                  {seller.rank}
                </span>
              </div>
              <span className="text-xs font-medium text-text-primary truncate max-w-[72px]">{seller.username}</span>
              <span className="text-xs text-success font-medium">{seller.monthlySales} пр.</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Saved searches */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-secondary">Сохранённые:</span>
        {savedSearches.map(search => (
          <motion.button
            key={search}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSearches(prev =>
                prev.includes(search) ? prev.filter(s => s !== search) : [...prev, search]
              );
            }}
            className={`tag ${activeSearches.includes(search) ? 'tag-active' : ''}`}
          >
            {search}
          </motion.button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`tag ${selectedCategory === 'all' ? 'tag-active' : ''}`}
          >
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
              className={`tag ${selectedCategory === cat.id ? 'tag-active' : ''}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Price filter */}
        <div className="flex items-center gap-2 bg-bg-card border border-purple-900/20 rounded-xl px-3 py-2">
          <span className="text-xs text-text-secondary">Цена:</span>
          <input
            type="number"
            placeholder="от"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            className="w-20 text-sm bg-transparent border-none text-text-primary placeholder:text-text-secondary"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          />
          <span className="text-text-secondary">—</span>
          <input
            type="number"
            placeholder="до"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            className="w-20 text-sm bg-transparent border-none text-text-primary placeholder:text-text-secondary"
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
          />
          <span className="text-xs text-text-secondary">₽</span>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="appearance-none bg-bg-card border border-purple-900/20 rounded-xl px-3 py-2 text-sm text-text-primary pr-8 cursor-pointer"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>

        {/* All filters button */}
        <motion.button
          onClick={() => setShowFilters(!showFilters)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
            showFilters
              ? 'bg-purple-900/40 border-accent text-accent-soft'
              : 'bg-bg-card border-purple-900/20 text-text-secondary hover:border-purple-700/40'
          }`}
        >
          <SlidersHorizontal size={15} />
          Все фильтры
        </motion.button>

        {/* Save search */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-purple-900/20 rounded-xl text-sm text-text-secondary hover:border-purple-700/40 transition-all"
        >
          <Bookmark size={15} />
          Сохранить поиск
        </motion.button>

        {/* Count */}
        <span className="ml-auto text-sm text-text-secondary">
          Найдено: <span className="text-text-primary font-semibold">{filteredAccounts.length}</span>
        </span>
      </div>

      {/* Extended filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-bg-card border border-purple-900/20 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">Гарантия</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowGuaranteeOnly(!showGuaranteeOnly)}
                    className={`w-10 h-5 rounded-full transition-all ${showGuaranteeOnly ? 'bg-accent' : 'bg-purple-900/40'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showGuaranteeOnly ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-text-secondary">Только с гарантией</span>
                </label>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">Escrow защита</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowEscrowOnly(!showEscrowOnly)}
                    className={`w-10 h-5 rounded-full transition-all ${showEscrowOnly ? 'bg-accent' : 'bg-purple-900/40'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showEscrowOnly ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-text-secondary">Только Escrow</span>
                </label>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-2 font-medium">AI Риск</p>
                <div className="flex gap-2">
                  {['all', 'low', 'medium', 'high'].map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedRisk(r)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        selectedRisk === r
                          ? 'border-accent bg-purple-900/30 text-accent-soft'
                          : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                      }`}
                    >
                      {r === 'all' ? 'Все' : r === 'low' ? 'Низкий' : r === 'medium' ? 'Средний' : 'Высокий'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setMinPrice(''); setMaxPrice(''); setShowGuaranteeOnly(false);
                    setShowEscrowOnly(false); setSelectedRisk('all'); setSortBy('default');
                    setSelectedCategory('all');
                  }}
                  className="text-sm text-error hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Сбросить всё
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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

      {filteredAccounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Search size={48} className="text-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">Товары не найдены</p>
          <p className="text-text-secondary text-sm mt-1">Попробуйте изменить фильтры</p>
        </motion.div>
      )}
    </div>
  );
};

export default MarketPage;
