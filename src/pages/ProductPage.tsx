import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Flag, X } from 'lucide-react';

interface ProductPageProps {
  account: any;
}

const ProductPage: React.FC<ProductPageProps> = ({ account }) => {

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('fraud');
  const [reportMessage, setReportMessage] = useState('');
  const [sending, setSending] = useState(false);

  /* ================= LOAD REVIEWS ================= */

  useEffect(() => {
    const loadReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', account.seller_id);

      if (data) setReviews(data);
    };

    loadReviews();
  }, [account.seller_id]);

  /* ================= SUBMIT REPORT ================= */

  const submitReport = async () => {

    if (!reportMessage.trim()) {
      alert('Опишите проблему');
      return;
    }

    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('tickets').insert({
      reporter_id: user.id,
      target_type: 'account',
      target_id: account.id,
      category: reportCategory,
      message: reportMessage,
      status: 'open'
    });

    setSending(false);
    setShowReportModal(false);
    setReportMessage('');

    alert('Жалоба отправлена ✅');
  };

  return (
    <div className="space-y-6">

      {/* ================= PRODUCT INFO ================= */}

      <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-6">

        <div className="flex items-start justify-between">

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {account.title}
            </h1>

            <p className="text-text-secondary mb-4">
              {account.description}
            </p>

            <div className="text-lg text-accent font-semibold">
              {account.price} ₽
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-error/20 text-error rounded-xl border border-error/30 hover:bg-error/30 transition-all text-sm"
          >
            <Flag size={14} />
            Пожаловаться
          </motion.button>

        </div>

      </div>

      {/* ================= REVIEWS ================= */}

      <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Отзывы
        </h3>

        {reviews.length === 0 && (
          <p className="text-text-secondary text-sm">
            Пока нет отзывов
          </p>
        )}

        {reviews.map((review, i) => (
          <div key={i} className="mb-2 text-sm">
            {review.positive ? '✅ Положительный' : '❌ Отрицательный'}
          </div>
        ))}

      </div>

      {/* ================= REPORT MODAL ================= */}

      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-card border border-purple-900/30 rounded-2xl p-6 w-full max-w-md relative"
            >

              <button
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-semibold text-white mb-4">
                Создать жалобу
              </h3>

              <div className="mb-4">
                <label className="text-sm text-text-secondary mb-1 block">
                  Категория
                </label>

                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full p-2 rounded-xl bg-purple-900/10 border border-purple-900/20 text-white"
                >
                  <option value="fraud">Мошенничество</option>
                  <option value="spam">Спам</option>
                  <option value="abuse">Оскорбление</option>
                  <option value="incorrect_info">Неверная информация</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm text-text-secondary mb-1 block">
                  Описание проблемы
                </label>

                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  rows={4}
                  placeholder="Подробно опишите проблему..."
                  className="w-full p-2 rounded-xl bg-purple-900/10 border border-purple-900/20 text-white resize-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={submitReport}
                disabled={sending}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold"
              >
                {sending ? 'Отправка...' : 'Отправить жалобу'}
              </motion.button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductPage;