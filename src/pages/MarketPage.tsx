import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AccountCard from '../components/AccountCard';
import type { Page } from '../types/pages';

interface MarketPageProps {
  onSelectAccount: any;
  setCurrentPage: (page: Page) => void;
  onAddToCart: any;
}

type SortOption = 'default' | 'cheap' | 'expensive' | 'new' | 'old' | 'popular';

const MarketPage: React.FC<MarketPageProps> = ({
  onSelectAccount,
  setCurrentPage,
  onAddToCart
}) => {

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showGuaranteeOnly, setShowGuaranteeOnly] = useState(false);
  const [showEscrowOnly, setShowEscrowOnly] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showFilters, setShowFilters] = useState(false);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const loadAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*');

      if (data) setAccounts(data);
      setLoading(false);
    };

    loadAccounts();
  }, []);

  /* ================= FILTERING ================= */

  const filteredAccounts = useMemo(() => {

    let result = [...accounts];

    if (search) {
      result = result.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minPrice)
      result = result.filter(a => a.price >= parseInt(minPrice));

    if (maxPrice)
      result = result.filter(a => a.price <= parseInt(maxPrice));

    if (showGuaranteeOnly)
      result = result.filter(a => a.guarantee);

    if (showEscrowOnly)
      result = result.filter(a => a.escrow);

    if (selectedRisk !== 'all')
      result = result.filter(a => a.risk_level === selectedRisk);

    switch (sortBy) {
      case 'cheap':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'expensive':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
      case 'old':
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;
      case 'popular':
        result.sort((a, b) => b.views - a.views);
        break;
    }

    return result;

  }, [
    accounts,
    search,
    minPrice,
    maxPrice,
    showGuaranteeOnly,
    showEscrowOnly,
    selectedRisk,
    sortBy
  ]);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6">

      {/* Search */}
      <div className="flex items-center gap-3">

        <div className="flex items-center bg-bg-card border border-purple-900/20 rounded-xl px-4 py-2 flex-1">
          <Search size={16} className="text-text-secondary mr-2" />
          <input
            type="text"
            placeholder="Поиск аккаунтов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full text-text-primary"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-900/20 bg-bg-card text-text-secondary"
        >
          <SlidersHorizontal size={16} />
          Фильтры
        </motion.button>

      </div>

      {/* Filters Overlay */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-[420px] bg-bg-card p-6 overflow-y-auto"
            >

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Фильтры
                </h3>
                <button onClick={() => setShowFilters(false)}>
                  <X />
                </button>
              </div>

              {/* Price */}
              <div className="mb-5">
                <p className="text-sm text-text-secondary mb-2">Цена</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="от"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 rounded-xl bg-purple-900/10 border border-purple-900/20 text-white"
                  />
                  <input
                    type="number"
                    placeholder="до"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 rounded-xl bg-purple-900/10 border border-purple-900/20 text-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <Toggle
                label="Только с гарантией"
                value={showGuaranteeOnly}
                setValue={setShowGuaranteeOnly}
              />

              <Toggle
                label="Только Escrow"
                value={showEscrowOnly}
                setValue={setShowEscrowOnly}
              />

              {/* Risk */}
              <div className="mt-5">
                <p className="text-sm text-text-secondary mb-2">
                  Уровень риска
                </p>
                <div className="flex gap-2">
                  {['all', 'low', 'medium', 'high'].map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedRisk(r)}
                      className={`px-3 py-1 rounded-xl text-xs ${
                        selectedRisk === r
                          ? 'bg-accent text-white'
                          : 'bg-purple-900/20 text-text-secondary'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mt-5">
                <p className="text-sm text-text-secondary mb-2">
                  Сортировка
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full p-2 rounded-xl bg-purple-900/10 border border-purple-900/20 text-white"
                >
                  <option value="default">По умолчанию</option>
                  <option value="cheap">Сначала дешевые</option>
                  <option value="expensive">Сначала дорогие</option>
                  <option value="new">Сначала новые</option>
                  <option value="old">Сначала старые</option>
                  <option value="popular">Популярные</option>
                </select>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold"
              >
                Применить
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products */}
      {loading ? (
        <div className="text-white">Загрузка...</div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center text-text-secondary py-20">
          Ничего не найдено
        </div>
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
  );
};

const Toggle = ({
  label,
  value,
  setValue
}: any) => (
  <div className="flex items-center justify-between mt-4">
    <span className="text-sm text-text-primary">{label}</span>
    <div
      onClick={() => setValue(!value)}
      className={`w-10 h-5 rounded-full cursor-pointer relative ${
        value ? 'bg-accent' : 'bg-purple-900/40'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
          value ? 'left-5' : 'left-0.5'
        }`}
      />
    </div>
  </div>
);

export default MarketPage;