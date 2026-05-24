// src/components/LiveFeed.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';
import { usePrivacy } from '../lib/usePrivacy';

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
  isDemo?: boolean;
}

const DEMO_NAMES = ['NightDealer', 'ShadowMarket', 'CryptoVault', 'ProAccount', 'DarkPlayer', 'SafeDealer'];
const DEMO_ITEMS = ['Steam Prime + CS2', 'Discord Nitro', 'Epic Games Fortnite', 'Brawl Stars аккаунт', 'Roblox Premium', 'Telegram Premium'];

const ordinalRu = (n: number): string => `${n}-ю`;

const LiveFeed: React.FC = () => {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [queue, setQueue] = useState<LiveEvent[]>([]);
  const { openUser } = useUserNav();
  const { liveFeedEnabled } = usePrivacy();

  // Подписка на реальные покупки
  useEffect(() => {
    if (!liveFeedEnabled) return;
    const channel = supabase
      .channel('live_feed_orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status=eq.completed' },
        async (payload) => {
          const order = payload.new as any;
          const { data } = await supabase
            .from('live_feed').select('*').eq('event_id', order.id).maybeSingle();
          if (data) setQueue(q => [...q, data]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [liveFeedEnabled]);

  // Демо эфир — каждые 15-30 сек добавляем фейк
  useEffect(() => {
    if (!liveFeedEnabled) return;
    const tick = () => {
      const demo: LiveEvent = {
        event_id: 'demo-' + Date.now(),
        created_at: new Date().toISOString(),
        amount: Math.floor(Math.random() * 5000) + 100,
        user_id: 'demo',
        username: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
        user_sales: Math.floor(Math.random() * 100) + 10,
        account_title: DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)],
        isDemo: true,
      };
      setQueue(q => [...q, demo]);
    };
    const initialTimer = setTimeout(tick, 8000);
    const t = setInterval(tick, 20000 + Math.random() * 15000);
    return () => { clearTimeout(initialTimer); clearInterval(t); };
  }, [liveFeedEnabled]);

  // Показ очереди по одному
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

  if (!liveFeedEnabled || !event) return null;

  const isClickable = !event.isDemo && event.user_id !== 'demo';

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
            <button
              onClick={() => isClickable && openUser(event.user_id)}
              disabled={!isClickable}
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
                {event.isDemo && (
                  <span className="text-[8px] text-text-secondary">demo</span>
                )}
              </div>
              <p className="text-sm text-white">
                {isClickable ? (
                  <button
                    onClick={() => openUser(event.user_id)}
                    className="font-semibold hover:text-purple-300 hover:underline"
                  >
                    {event.username}
                  </button>
                ) : (
                  <span className="font-semibold">{event.username}</span>
                )}
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
