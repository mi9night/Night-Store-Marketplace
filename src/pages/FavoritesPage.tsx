import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import { Account } from '../types';
import { Page } from '../types/pages';

interface FavoritesPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ onSelectAccount, setCurrentPage, onAddToCart }) => {
  const [favorites, setFavorites] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        const { data } = await supabase
          .from('favorites')
          .select('account_id, accounts(*)')
          .eq('user_id', u.user.id);
        const mapped = (data || [])
          .map((f: any) => f.accounts ? dbToAccount({ ...f.accounts, isFavorite: true }) : null)
          .filter(Boolean) as Account[];
        setFavorites(mapped);
      } catch (e) {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Heart size={24} className="text-red-500" />
        <h1 className="text-2xl font-bold text-text-primary">Избранное</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">{favorites.length} товаров</span>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : favorites.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Heart size={48} className="text-text-secondary mx-auto mb-4 opacity-30" />
          <p className="text-text-secondary">Нет избранных товаров</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {favorites.map((a, i) => (
            <AccountCard
              key={a.id}
              account={a}
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

export default FavoritesPage;
