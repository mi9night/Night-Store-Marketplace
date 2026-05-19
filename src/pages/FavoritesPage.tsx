import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import { accounts } from '../data/mockData';
import { Account } from '../types';
import { Page } from '../types/pages';

interface FavoritesPageProps {
  onSelectAccount: (account: Account) => void;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ onSelectAccount, setCurrentPage, onAddToCart }) => {
  const favorites = accounts.filter((_, i) => i % 2 === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Heart size={24} className="text-red-500" />
        <h1 className="text-2xl font-bold text-text-primary">Избранное</h1>
        <span className="badge">{favorites.length} товаров</span>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Heart size={48} className="text-text-secondary mx-auto mb-4 opacity-30" />
          <p className="text-text-secondary">Нет избранных товаров</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((account, i) => (
            <AccountCard
              key={account.id}
              account={{ ...account, isFavorite: true }}
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
