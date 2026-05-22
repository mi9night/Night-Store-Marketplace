// src/components/LiveFeed.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';

interface LiveEvent {
  event_id: string;
  created_at: string;
  amount: number;
  user_id: string;
  username: string;
  custom_id?: string;
  avatar_url?: string;
  user_sales: number;
  account_title?: string;
}

const ordinalRu = (n: number): string => {
  // Простые окончания для 1, 2, 3, 4...
  if (n % 100 >= 11 && n % 100 <= 14) return `${n}-ю`;
  const last = n % 10;
  if (last === 1) return `${n}-ю`;
  return `${n}-ю`;
};

const LiveFeed: React.FC = () => {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [queue, setQueue] = useState<LiveEvent[]>([]);
  const { openUser } = useUserNav();

  /* ============ Подписка на новые заказы ============ */
  useEffect(() => {
    const channel = supabase
      .channel('live_feed_orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status=eq.completed' },
        async (payload) => {
          const order = payload.new as any;
          // Подтянем данные через view live_feed
          const { data } = await supabase
            .from('live_feed')
            .select('*')
            .eq('event_id', order.id)
            .maybeSingle();
          if (data) setQueue(q => [...q, data]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ============ Показ очереди по одному ============ */
  useEffect(() => {
    if (event || queue.length === 0) return;
    const next = queue[0];
    setEvent(next);
    setVisible(true);
    setQueue(q => q.slice(1));

    const hideTimer = setTimeout(() => setVisible(false), 5500);
    const clearTimer = setTimeout(() => setEvent(null), 6000);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [queue, event]);

  if (!event) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-6 z-[60] bg-[#171425] border border-purple-700/40 rounded-2xl shadow-[0_0_30px_rgba(138,43,226,0.4)] p-3 max-w-xs"
        >
          <div className="flex items-start gap-3">
            {/* Аватар */}
            <button
              onClick={() => openUser(event.user_id)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-transform"
            >
              {event.avatar_url ? (
                <img src={event.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {(event.username?.[0] || 'U').toUpperCase()}
                </span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy size={11} className="text-yellow-400" />
                <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
                  Прямой эфир ✨
                </span>
              </div>
              <p className="text-sm text-white">
                <button
                  onClick={() => openUser(event.user_id)}
                  className="font-semibold hover:text-purple-300 hover:underline"
                >
                  {event.username}
                </button>
                {' '}совершил {ordinalRu(event.user_sales)} продажу!
              </p>
              {event.account_title && (
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  {event.account_title} · {event.amount?.toLocaleString('ru-RU')} ₽
                </p>
              )}
            </div>

            <button
              onClick={() => setVisible(false)}
              className="text-text-secondary hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveFeed;
