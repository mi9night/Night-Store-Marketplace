import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bug,
  MessageSquare,
  Users,
  HeartHandshake,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

const NOTICE_ENABLED = true;
const NOTICE_VERSION = 'v1';
const STORAGE_KEY = `night_store_startup_notice_hidden_${NOTICE_VERSION}`;
const SESSION_KEY = `night_store_startup_notice_seen_${NOTICE_VERSION}`;
const COUNTDOWN_SECONDS = 10;

// Если когда-нибудь захочешь автоматически отключить плашку по дате — укажи ISO-дату.
// Например: const NOTICE_EXPIRES_AT = '2026-12-31T23:59:59+03:00';
const NOTICE_EXPIRES_AT: string | null = null;

const StartupNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const isExpired = useMemo(() => {
    if (!NOTICE_EXPIRES_AT) return false;
    return Date.now() > new Date(NOTICE_EXPIRES_AT).getTime();
  }, []);

  useEffect(() => {
    if (!NOTICE_ENABLED || isExpired) return;
    if (typeof window === 'undefined') return;

    const hiddenForever = localStorage.getItem(STORAGE_KEY) === '1';
    const hiddenThisSession = sessionStorage.getItem(SESSION_KEY) === '1';

    if (!hiddenForever && !hiddenThisSession) {
      const t = window.setTimeout(() => setVisible(true), 350);
      return () => window.clearTimeout(t);
    }
  }, [isExpired]);

  useEffect(() => {
    if (!visible || secondsLeft <= 0) return;
    const t = window.setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [visible, secondsLeft]);

  const close = () => {
    if (secondsLeft > 0) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    if (dontShowAgain) localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!NOTICE_ENABLED || isExpired) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-purple-700/30 bg-[#171425] shadow-[0_0_80px_rgba(139,92,246,0.22)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/45 via-transparent to-[#0B0A12] pointer-events-none" />
            <motion.div
              aria-hidden="true"
              animate={{ opacity: [0.25, 0.62, 0.25], scale: [1, 1.12, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl"
            />
            <motion.div
              aria-hidden="true"
              animate={{ x: ['-30%', '30%', '-30%'], opacity: [0.15, 0.55, 0.15] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-10 right-10 top-8 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
            />

            <button
              type="button"
              onClick={close}
              disabled={secondsLeft > 0}
              className="absolute right-4 top-4 z-10 rounded-xl p-2 text-text-secondary transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              title={secondsLeft > 0 ? `Можно закрыть через ${secondsLeft} сек.` : 'Закрыть'}
            >
              <X size={18} />
            </button>

            <div className="relative z-10 p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-900/30 shadow-[0_0_28px_rgba(168,85,247,0.24)]">
                  <Sparkles size={28} className="text-purple-300" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-purple-400 shadow-[0_0_14px_rgba(192,132,252,0.9)]" />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-purple-700/30 bg-purple-900/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    <HeartHandshake size={12} /> Night Store развивается
                  </div>
                  <h2 className="text-xl font-black text-white sm:text-2xl">Мы недавно открылись</h2>
                </div>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
                <p>
                  Сайт сейчас активно развивается: мы улучшаем маркет, оплату, тикеты, интеграции и безопасность сделок.
                </p>
                <p>
                  Будем очень рады вашей поддержке: пишите в тикеты или на наш Discord-сервер о багах, которые сможете найти, и рассказывайте о Night Store друзьям 💜
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { icon: Bug, title: 'Баги', text: 'Сообщайте об ошибках' },
                  { icon: MessageSquare, title: 'Тикеты', text: 'Помогают чинить быстрее' },
                  { icon: Users, title: 'Друзья', text: 'Расскажите о сайте' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                    className="rounded-2xl border border-purple-900/20 bg-[#0B0A12]/70 p-3"
                  >
                    <item.icon size={17} className="mb-2 text-purple-300" />
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-text-secondary">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-purple-900/20 bg-[#0B0A12]/65 p-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                  dontShowAgain
                    ? 'border-purple-400 bg-purple-600 text-white'
                    : 'border-purple-700/40 bg-purple-900/10 text-transparent'
                }`}>
                  <CheckCircle2 size={14} />
                </span>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={e => setDontShowAgain(e.target.checked)}
                  className="hidden"
                />
                <span className="text-xs text-text-secondary">Больше не показывать это сообщение</span>
              </label>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Clock size={14} className="text-purple-300" />
                  {secondsLeft > 0
                    ? <>Кнопка станет доступна через <span className="font-bold text-white">{secondsLeft}</span> сек.</>
                    : <span className="text-green-400">Можно закрыть</span>}
                </div>

                <motion.button
                  type="button"
                  onClick={close}
                  disabled={secondsLeft > 0}
                  whileHover={secondsLeft > 0 ? undefined : { scale: 1.03 }}
                  whileTap={secondsLeft > 0 ? undefined : { scale: 0.97 }}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.25)] transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {secondsLeft > 0 ? `ОК через ${secondsLeft}` : 'ОК'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartupNotice;
