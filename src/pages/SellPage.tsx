import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SellPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!title || !price) {
      alert('Заполните все поля');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1️⃣ Добавляем продажу
    await supabase.from('sales').insert({
      seller_id: user.id,
      price: parseInt(price),
      status: 'completed'
    });

    // 2️⃣ Увеличиваем счётчик продаж
    await supabase.rpc('increment_sales', {
      user_id: user.id
    });

    alert('Объявление опубликовано ✅');
    setTitle('');
    setPrice('');
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-bg-card p-8 rounded-2xl border border-purple-900/20">

      <h1 className="text-2xl font-bold text-white mb-6">
        Продать аккаунт
      </h1>

      <div className="space-y-4">

        <input
          type="text"
          placeholder="Название объявления"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-xl bg-purple-900/10 border border-purple-900/30 text-white"
        />

        <input
          type="number"
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 rounded-xl bg-purple-900/10 border border-purple-900/30 text-white"
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePublish}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold"
        >
          {loading ? 'Публикация...' : 'Опубликовать'}
        </motion.button>

      </div>
    </div>
  );
};

export default SellPage;