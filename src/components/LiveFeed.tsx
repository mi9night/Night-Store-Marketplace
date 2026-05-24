// src/components/LiveFeed.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, MessageSquare, ShoppingBag, Gift, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';
import { usePrivacy } from '../lib/usePrivacy';

interface LiveEvent {
  id: string;
  event_type: string;
  user_id?: string;
  username?: string;
  avatar_url?: string;
  title: string;
  subtitle?: string;
  link_type?: string;
  link_id?: string;
  icon?: string;
  created_at: string;
}

const typeConfig: Record<string, { label: string; Icon: any; animate?: boolean }> = {
  sale:        { label: 'ПРОДАЖА',    Icon: Trophy },
  new_topic:   { label: 'ТЕМА',       Icon: MessageSquare },
  new_product: { label: 'ТОВАР',      Icon: ShoppingBag },
  giveaway:    { label: 'РОЗЫГРЫШ',   Icon: Gift, animate: true },
  custom:      { label: 'ОБЪЯВЛЕНИЕ', Icon: Megaphone },
};

const LiveFeed: React.FC = () => {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [queue, setQueue] = useState<LiveEvent[]>([]);
  const { openUser } = useUserNav();
  const { liveFeedEnabled } = usePrivacy();

  // Подписка на live_events
  useEffect(() => {
    if (!liveFeedEnabled) return;

    const channel = supabase
      .channel('live_events_rt')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_events' },
        (payload) => {
          setQueue(q => [...q, payload.new as LiveEvent]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveFeedEnabled]);

  // Показ очереди по одному — 3 секунды
  useEffect(() => {
    if (event || queue.length === 0) return;
    const next = queue[0];
    setEvent(next);
    setVisible(true);
    setQueue(q => q.slice(1));

    const hideTimer = setTimeout(() => setVisible(false), 2700);
    const clearTimer = setTimeout(() => setEvent(null), 3000);
    return () => { clearTimeout(hideTimer); clearTimeout(clearTimer); };
  }, [queue, event]);

  if (!liveFeedEnabled || !event) return null;

  const cfg = typeConfig[event.event_type] || typeConfig.sale;
  const isClickable = !!(event.user_id && event.user_id !== 'demo');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          style={{
            borderColor: 'var(--color-accent, #8A2BE2)',
            boxShadow: '0 0 30px color-mix(in srgb, var(--color-accent, #8A2BE2) 40%, transparent)',
          }}
          className={`fixed bottom-6 right-6 z-[60] bg-[#171425] border rounded-2xl p-3 max-w-xs ${cfg.animate ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => isClickable && event.user_id && openUser(event.user_id)}
              disabled={!isClickable}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-transform"
            >
              {event.avatar_url ? (
                <img src={event.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {(event.username?.[0] || event.icon || 'L').toUpperCase()}
                </span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <cfg.Icon size={11} style={{ color: 'var(--color-accent, #8A2BE2)' }} />
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-accent-soft, #B57CFF)' }}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm text-white truncate">{event.title}</p>
              {event.subtitle && (
                <p className="text-[11px] text-text-secondary truncate mt-0.5">{event.subtitle}</p>
              )}
            </div>

            <button
              onClick={() => setVisible(false)}
              className="text-text-secondary hover:text-white p-1 flex-shrink-0"
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
