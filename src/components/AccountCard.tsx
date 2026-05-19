import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Props {
  account: any;
  onSelect: any;
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
    const loadRating = async () => {
      const { data } = await supabase
        .from('seller_rating')
        .select('*')
        .eq('seller_id', account.seller_id)
        .single();

      if (data) setRating(data);
    };

    loadRating();
  }, [account.seller_id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-bg-card border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all"
    >
      <h3 className="text-white font-semibold mb-2">
        {account.title}
      </h3>

      <p className="text-sm text-text-secondary mb-3">
        {account.price} ₽
      </p>

      {rating && (
        <div className="text-xs text-success mb-2">
          ⭐ {rating.positive_percent}% положительных
          ({rating.total_reviews})
        </div>
      )}

      <button
        onClick={() => onSelect(account)}
        className="w-full py-2 bg-accent rounded-lg text-white text-sm"
      >
        Подробнее
      </button>
    </motion.div>
  );
};

export default AccountCard;