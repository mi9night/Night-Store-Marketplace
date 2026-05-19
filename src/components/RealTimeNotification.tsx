import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';

interface LiveNotification {
  id: string;
  text: string;
  icon: string;
  time: number;
}

const liveEvents = [
  { text: 'Пользователь купил Steam Prime CS2', icon: '🛒' },
  { text: 'Новый аккаунт GTA Online добавлен', icon: '🎮' },
  { text: 'NightDealer совершил 50-ю продажу!', icon: '🏆' },
  { text: 'Discord Nitro продан за 890₽', icon: '💜' },
  { text: 'Новый продавец зарегистрировался', icon: '👤' },
  { text: 'VPN NordVPN добавлен на маркет', icon: '🔒' },
  { text: 'Акция: -20% на Steam аккаунты!', icon: '🎁' },
  { text: 'Пользователь оставил отзыв 5⭐', icon: '⭐' },
];

const RealTimeNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  useEffect(() => {
    const addNotification = () => {
      const event = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      const notif: LiveNotification = {
        id: Math.random().toString(36).slice(2),
        text: event.text,
        icon: event.icon,
        time: Date.now(),
      };

      setNotifications(prev => [...prev.slice(-2), notif]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notif.id));
      }, 4000);
    };

    const interval = setInterval(addNotification, 8000);
    const firstTimeout = setTimeout(addNotification, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(firstTimeout);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-xs">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="glass border border-purple-900/30 rounded-xl px-4 py-3 flex items-center gap-3 glow-purple cursor-pointer hover:border-accent/40 transition-colors"
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          >
            <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center flex-shrink-0">
              <span>{notif.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="text-xs text-accent font-semibold">Прямой эфир</span>
                <Zap size={10} className="text-accent" />
              </div>
              <p className="text-xs text-text-primary truncate">{notif.text}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== notif.id)); }}
              className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeNotification;
