import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, ChevronDown, X, Search,
  Package, Zap, ShoppingBag
, Globe, Gamepad2, Send, Swords, Target, Hexagon, Square, Crown, Box, Shield, Star, MessageCircle, Music, Camera, Brain, Atom, Lock, Hash , Sparkles , Joystick, Pickaxe } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import CategoryFilters from '../components/CategoryFilters';
import { CATEGORY_FILTERS } from '../data/categoryFilters';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface MarketPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

type SortOption = 'default' | 'cheap' | 'expensive' | 'new' | 'old' | 'popular';


const CAT_ICONS: Record<string, { Icon: any; color: string }> = {
  steam:     { Icon: Gamepad2,      color: 'text-blue-400' },
  telegram:  { Icon: Send,          color: 'text-cyan-400' },
  epic:      { Icon: Joystick,      color: 'text-gray-200' },
  fortnite:  { Icon: Pickaxe,       color: 'text-blue-400' },
  ea:        { Icon: Target,        color: 'text-red-500' },
  ubisoft:   { Icon: Hexagon,       color: 'text-blue-500' },
  minecraft: { Icon: Square,        color: 'text-green-500' },
  supercell: { Icon: Crown,         color: 'text-yellow-400' },
  roblox:    { Icon: Box,           color: 'text-red-400' },
  wot:       { Icon: Shield,        color: 'text-gray-400' },
  wr:        { Icon: Zap,           color: 'text-yellow-300' },
  rockstar:  { Icon: Star,          color: 'text-yellow-400' },
  discord:   { Icon: MessageCircle, color: 'text-indigo-400' },
  tiktok:    { Icon: Music,         color: 'text-pink-400' },
  instagram: { Icon: Camera,        color: 'text-pink-500' },
  ai:        { Icon: Brain,         color: 'text-purple-400' },
  neural:    { Icon: Atom,          color: 'text-purple-500' },
  vpn:       { Icon: Lock,          color: 'text-orange-400' },
  mihoyo:    { Icon: Sparkles,      color: 'text-cyan-300' },
};

const CatIcon: React.FC<{ id: string; size?: number }> = ({ id, size = 24 }) => {
  const c = CAT_ICONS[id];
  if (!c) return <span className="text-2xl">📦</span>;
  return <c.Icon size={size} className={c.color} />;
};

const MarketPage: React.FC<MarketPageProps> = ({ onSelectAccount, setCurrentPage, onAddToCart }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => localStorage.getItem('market_category') || 'all');
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});

  // Слушаем смену категории из Sidebar
  useEffect(() => {
    const onChange = () => {
      const cat = localStorage.getItem('market_category');
      const sub = localStorage.getItem('market_subcategory');
      if (cat) setSelectedCategory(cat);
      if (sub) {
        setSearch(sub);
        localStorage.removeItem('market_subcategory');
      }
    };
    window.addEventListener('market-filter-changed', onChange);
    return () => window.removeEventListener('market-filter-changed', onChange);
  }, []);
  const [extraFilters, setExtraFilters] = useState<Record<string, any>>({});
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
            .select('id, username, avatar_url, rating, sales, verified, role, level, custom_role_label, custom_role_icon, custom_role_color')
            .in('id', sellerIds);
          // Подгружаем custom_roles массив
          const { data: crs } = await supabase.from('user_custom_roles')
            .select('user_id, id, label, icon, color, description, has_glow, has_pulse').in('user_id', sellerIds);
          const crMap: Record<string, any[]> = {};
          crs?.forEach((cr: any) => {
            if (!crMap[cr.user_id]) crMap[cr.user_id] = [];
            crMap[cr.user_id].push({ id: cr.id, label: cr.label, icon: cr.icon, color: cr.color, description: cr.description, has_glow: cr.has_glow, has_pulse: cr.has_pulse });
          });
          sellers?.forEach((s: any) => { s.custom_roles = crMap[s.id] || []; sellersMap[s.id] = s; });
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
              custom_role_label: s.custom_role_label, custom_role_icon: s.custom_role_icon, custom_role_color: s.custom_role_color, custom_roles: s.custom_roles,
            } as any : undefined
          });
        });
        setAccounts(mapped);
        // считаем count по категориям
        const counts: Record<string, number> = {};
        for (const a of mapped) {
          counts[a.category] = (counts[a.category] || 0) + 1;
        }
        setCatCounts(counts);
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
    setExtraFilters({});
  };

  const activeFiltersCount = [
    minPrice || maxPrice,
    showGuaranteeOnly,
    showEscrowOnly,
    selectedRisk !== 'all',
    ...Object.values(extraFilters).filter(v => v),
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#171425] border border-purple-900/30 rounded-2xl p-5 overflow-hidden shadow-[0_0_28px_rgba(139,92,246,0.08)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/25 via-transparent to-bg-primary pointer-events-none" />
        <div className="relative z-10">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Маркет аккаунтов</h1>
        <p className="text-sm text-text-secondary">
          {accounts.length} аккаунтов · мгновенная выдача · Escrow защита 🌙
        </p>
        </div>
      </motion.div>

      {/* === Категории-квадратики === */}
      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-3">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2">
          {/* «Все» */}
          <motion.button
            onClick={() => { setSelectedCategory('all'); setExtraFilters({}); }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600/30 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                : 'bg-bg-secondary border-purple-900/20 hover:border-purple-700/50'
            }`}
          >
            <Globe size={24} className="text-purple-300" />
            <span className={`text-[10px] font-semibold truncate w-full text-center px-1 ${
              selectedCategory === 'all' ? 'text-white' : 'text-text-secondary'
            }`}>Все</span>
          </motion.button>

          {categories.map(cat => {
            const cnt = catCounts[cat.id] || 0;
            return (
              <motion.button
                key={cat.id}
                onClick={() => { setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id); setExtraFilters({}); }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600/30 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                    : 'bg-bg-secondary border-purple-900/20 hover:border-purple-700/50'
                }`}
              >
                <CatIcon id={cat.id} />
                <span className={`text-[10px] font-semibold truncate w-full text-center px-1 ${
                  selectedCategory === cat.id ? 'text-white' : 'text-text-secondary'
                }`}>{cat.name}</span>

              </motion.button>
            );
          })}
        </div>
      </div>

      {/* === Подкатегории выбранной категории === */}
      {selectedCategory !== 'all' && (() => {
        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat?.subcategories || cat.subcategories.length === 0) return null;
        return (
          <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-2 flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-text-secondary px-2">Подкатегории:</span>
            {cat.subcategories.map(sub => (
              <button key={sub}
                onClick={() => setSearch(search.includes(sub) ? '' : sub)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  search === sub
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-bg-secondary border-purple-900/30 text-text-secondary hover:border-purple-700/50'
                }`}>
                {sub}
              </button>
            ))}
          </div>
        );
      })()}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4 flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-green-900/20 border border-green-700/30 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-green-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Автоматическая проверка товаров</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Автоматическая проверка сейчас доступна только для категорий: Steam, Telegram и Discord. Проверка остальных категорий находится в разработке, поэтому ответственность за корректность товара несёт пользователь, а спорные случаи разбираются через поддержку.
          </p>
        </div>
      </motion.div>

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
              className="bg-[#171425] border border-purple-900/30 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-6xl max-h-[92vh] flex flex-col"
            >
              {/* Header модалки */}
              <div className="flex items-center justify-between p-5 border-b border-purple-900/20 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={20} /> Все фильтры
                </h2>
                <button onClick={() => setShowFiltersModal(false)} className="text-text-secondary hover:text-white p-1">
                  <X size={22} />
                </button>
              </div>

              {/* Контент с прокруткой */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Верхний ряд: ЦЕНА · ЗАЩИТА · РИСК — на всю ширину */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">💰 ЦЕНА</p>
                    <div className="flex gap-2">
                      <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="от ₽"
                        className="flex-1 px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                      <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="до ₽"
                        className="flex-1 px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                    </div>
                  </div>

                  <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">🛡️ ЗАЩИТА</p>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-bg-card rounded-md">
                      <input type="checkbox" checked={showGuaranteeOnly} onChange={e => setShowGuaranteeOnly(e.target.checked)} className="accent-purple-500 w-4 h-4" />
                      <span className="text-xs text-white">Только с гарантией</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-bg-card rounded-md">
                      <input type="checkbox" checked={showEscrowOnly} onChange={e => setShowEscrowOnly(e.target.checked)} className="accent-purple-500 w-4 h-4" />
                      <span className="text-xs text-white">Только эскроу</span>
                    </label>
                  </div>

                  <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">🚦 УРОВЕНЬ РИСКА</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'all', label: 'Любой' },
                        { id: 'low', label: 'Низкий', cls: 'green' },
                        { id: 'medium', label: 'Средний', cls: 'yellow' },
                        { id: 'high', label: 'Высокий', cls: 'red' },
                      ].map(r => (
                        <button key={r.id} onClick={() => setSelectedRisk(r.id)}
                          className={`py-1.5 rounded-md text-xs font-semibold border transition-all ${
                            selectedRisk === r.id
                              ? r.cls === 'green' ? 'bg-green-900/30 border-green-500 text-green-400'
                                : r.cls === 'yellow' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400'
                                : r.cls === 'red' ? 'bg-red-900/30 border-red-500 text-red-400'
                                : 'bg-purple-900/30 border-purple-500 text-white'
                              : 'bg-bg-card border-purple-900/30 text-text-secondary'
                          }`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* === Категория-специфичные фильтры по 3 колонкам === */}
                {(() => {
                  if (selectedCategory === 'all') return null;
                  const cat = categories.find(cc => cc.id === selectedCategory);
                  if (!cat) return null;
                  const groups = CATEGORY_FILTERS[selectedCategory];
                  if (!groups) return (
                    <div className="bg-purple-900/10 border border-purple-700/20 rounded-xl p-3 text-xs text-text-secondary">
                      💡 Для категории <b className="text-white">{cat.name}</b> используются базовые фильтры
                    </div>
                  );

                  // Распределение групп по колонкам по их title
                  const LEFT  = ['АККАУНТ'];
                  const MID   = ['РЕГИОН И АКТИВНОСТЬ', 'STEAM · ОГРАНИЧЕНИЯ', 'КАРТОЧКИ И КЛЮЧИ', 'ГИФТЫ',
                                  'РЕГИОН И DC', 'TELEGRAM PREMIUM', 'СТАТИСТИКА', 'ВОЗРАСТ ВЛАДЕЛЬЦА'];
                  const RIGHT = ['БАЛАНС И ИНВЕНТАРЬ', 'CS2', 'DOTA 2', 'RUST', 'СВОЯ ИГРА',
                                  'БЕЗОПАСНОСТЬ', 'ПОДАРКИ', 'БОТЫ'];

                  const byCol = (cols: string[]) =>
                    groups.filter(g => g.title && cols.includes(g.title));
                  const restGroups = groups.filter(g =>
                    !g.title || (!LEFT.includes(g.title) && !MID.includes(g.title) && !RIGHT.includes(g.title))
                  );

                  const Col: React.FC<{ items: any[] }> = ({ items }) => (
                    <div className="space-y-3">
                      {items.map((g: any, gi: number) => (
                        <div key={gi} className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{g.title}</p>
                          <CategoryFilters groups={[{ fields: g.fields }]} values={extraFilters} onChange={setExtraFilters} />
                        </div>
                      ))}
                    </div>
                  );

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Col items={byCol(LEFT)} />
                        <Col items={byCol(MID)} />
                        <Col items={byCol(RIGHT)} />
                      </div>
                      {restGroups.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          {restGroups.map((g: any, gi: number) => (
                            <div key={gi} className="bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2">
                              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{g.title || 'Прочее'}</p>
                              <CategoryFilters groups={[{ fields: g.fields }]} values={extraFilters} onChange={setExtraFilters} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Фиксированный нижний бар */}
              <div className="flex items-center justify-between p-4 border-t border-purple-900/20 flex-shrink-0 gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setShowFiltersModal(false)}
                    className="px-4 py-2.5 bg-purple-900/20 hover:bg-purple-900/40 text-white rounded-xl text-sm font-semibold">
                    Закрыть
                  </button>
                  <button onClick={resetFilters}
                    className="px-4 py-2.5 bg-purple-900/20 hover:bg-purple-900/40 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5">
                    <X size={14} /> Сбросить фильтры
                  </button>
                </div>
                <div className="text-xs text-text-secondary">
                  Показано: <span className="text-white font-bold">{filteredAccounts.length}</span> · в каталоге: <span className="text-white font-bold">{accounts.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketPage;
