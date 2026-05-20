import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
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

type SortOption =
  | 'default'
  | 'cheap'
  | 'expensive'
  | 'new'
  | 'old'
  | 'popular';

const MarketPage: React.FC<MarketPageProps> = ({
  onSelectAccount,
  setCurrentPage,
  onAddToCart
}) => {

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*');

        if (error) {
          console.error('Supabase error:', error);
          setError('Ошибка загрузки данных');
          setAccounts([]);
        } else {
          setAccounts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Критическая ошибка загрузки');
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  /* ================= FILTERING ================= */

  const filteredAccounts = useMemo(() => {

    if (!Array.isArray(accounts)) return [];

    let result = [...accounts];

    if (search) {
      result = result.filter(a =>
        a?.title?.toLowerCase()?.includes(search.toLowerCase())
      );
    }

    if (minPrice)
      result = result.filter(a => a?.price >= parseInt(minPrice));

    if (maxPrice)
      result = result.filter(a => a?.price <= parseInt(maxPrice));

    if (showGuaranteeOnly)
      result = result.filter(a => a?.guarantee);

    if (showEscrowOnly)
      result = result.filter(a => a?.escrow);

    if (selectedRisk !== 'all')
      result = result.filter(a => a?.risk_level === selectedRisk);

    switch (sortBy) {
      case 'cheap':
        result.sort((a, b) => (a?.price || 0) - (b?.price || 0));
        break;
      case 'expensive':
        result.sort((a, b) => (b?.price || 0) - (a?.price || 0));
        break;
      case 'new':
        result.sort(
          (a, b) =>
            new Date(b?.created_at || 0).getTime() -
            new Date(a?.created_at || 0).getTime()
        );
        break;
      case 'old':
        result.sort(
          (a, b) =>
            new Date(a?.created_at || 0).getTime() -
            new Date(b?.created_at || 0).getTime()
        );
        break;
      case 'popular':
        result.sort((a, b) => (b?.views || 0) - (a?.views || 0));
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

  if (loading) {
    return <div className="text-white">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-20">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">

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
          className="px-4 py-2 rounded-xl border border-purple-900/20 bg-bg-card text-text-secondary"
        >
          <SlidersHorizontal size={16} />
        </motion.button>

      </div>

      {filteredAccounts.length === 0 ? (
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

export default MarketPage;