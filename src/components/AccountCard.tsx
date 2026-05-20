import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Props {
  account: any;
  onSelect: (account: any) => void;
  setCurrentPage: any;
  onAddToCart: any;
  index: number;
}

const AccountCard: React.FC<Props> = ({
  account,
  onSelect,
  onAddToCart,
  index
}) => {

  const [rating, setRating] = useState<any>(null);

  useEffect(() => {

    // ✅ защита от undefined
    if (!account?.seller?.id) return;

    const loadRating = async () => {
      try {
        const { data, error } = await supabase
          .from('seller_rating')
          .select('*')
          .eq('seller_id', account.seller.id)
          .maybeSingle(); // ✅ безопаснее чем single()

        if (!error && data) {
          setRating(data);
        }
      } catch (err) {
        console.log('Rating load skipped (mock mode)');
      }
    };

    loadRating();

  }, [account?.seller?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-bg-card border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all"
    >

      {/* Title */}
      <h3 className="text-white font-semibold mb-2 line-clamp-2">
        {account.title}
      </h3>

      {/* Price */}
      <p className="text-sm text-text-secondary mb-3">
        {account.price?.toLocaleString?.('ru-RU')} ₽
      </p>

      {/* Rating block */}
      {rating && (
        <div className="text-xs text-success mb-2">
          ⭐ {rating.positive_percent ?? 0}% положительных
          ({rating.total_reviews ?? 0})
        </div>
      )}

      {/* Seller fallback (если нет rating) */}
      {!rating && account?.seller && (
        <div className="text-xs text-text-secondary mb-2">
          Продавец: {account.seller.username}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSelect(account)}
          className="flex-1 py-2 bg-accent rounded-lg text-white text-sm hover:opacity-90 transition"
        >
          Подробнее
        </button>

        <button
          onClick={() => onAddToCart(account)}
          className="px-3 py-2 bg-purple-600/20 border border-purple-700 rounded-lg text-white text-sm hover:bg-purple-600/30 transition"
        >
          +
        </button>
      </div>

    </motion.div>
  );
};

export default AccountCard;