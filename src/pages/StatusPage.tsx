import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  MessageCircle,
  Star,
  ShieldCheck,
  Trophy,
  ShoppingCart
} from 'lucide-react';

/* ================= XP НАСТРОЙКИ ================= */

const BASE_XP = 1000;
const XP_INCREMENT = 200;

function getRequiredXp(level: number) {
  return BASE_XP + (level - 1) * XP_INCREMENT;
}

function calculateLevel(totalXp: number) {
  let level = 1;
  let xpNeeded = getRequiredXp(level);

  while (totalXp >= xpNeeded) {
    totalXp -= xpNeeded;
    level++;
    xpNeeded = getRequiredXp(level);
  }

  return {
    level,
    currentXp: totalXp,
    requiredXp: xpNeeded
  };
}

/* ================= ИНТЕРФЕЙС ДАННЫХ ИЗ БАЗЫ ================= */

interface RealStats {
  sales: number;
  positive_reviews: number;
  completed_guarantees: number;
  verified: boolean;
  giveaways: number;
  forum_activity_xp: number;
}

/* ================= СТРАНИЦА ================= */

const StatusPage: React.FC = () => {
  const [stats, setStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ===== ЗАГРУЗКА ИЗ SUPABASE ===== */

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('sales, positive_reviews, completed_guarantees, verified, giveaways, forum_activity_xp')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setStats(data);
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-white p-10">Загрузка...</div>;
  }

  if (!stats) {
    return <div className="text-white p-10">Нет данных пользователя</div>;
  }

  /* ===== РАСЧЁТ XP ===== */

  const totalXp = useMemo(() => {
    return (
      stats.sales * 100 +
      stats.positive_reviews * 50 +
      stats.completed_guarantees * 25 +
      (stats.verified ? 200 : 0) +
      stats.giveaways * 150 +
      stats.forum_activity_xp
    );
  }, [stats]);

  const { level, currentXp, requiredXp } = calculateLevel(totalXp);
  const progress = (currentXp / requiredXp) * 100;

  /* ===== LEVEL UP АНИМАЦИЯ ===== */

  const [prevLevel, setPrevLevel] = useState(level);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  return (
    <div className="space-y-8">

      {/* ================= LEVEL UP OVERLAY ================= */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
          >
            <div className="bg-gradient-to-br from-purple-700 to-accent p-10 rounded-3xl text-white text-center shadow-[0_0_40px_rgba(168,85,247,0.8)]">
              <h2 className="text-3xl font-bold mb-2">🎉 LEVEL UP!</h2>
              <p className="text-lg">Вы достигли {level} уровня</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= XP УРОВЕНЬ ================= */}
      <div className="bg-bg-card p-6 rounded-2xl border border-purple-900/20">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-text-primary">
            {level} LVL
          </h2>
          <span className="text-sm text-text-secondary">
            {currentXp} XP / {requiredXp}
          </span>
        </div>

        <div className="h-3 bg-purple-900/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r from-purple-500 to-accent ${
              showLevelUp ? 'shadow-[0_0_25px_rgba(168,85,247,0.9)]' : ''
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        <p className="text-xs text-text-secondary mt-2">
          До {level + 1} уровня нужно {requiredXp - currentXp} XP
        </p>
      </div>

      {/* ================= УРОВЕНЬ ПРОДАЖ ================= */}
      <div className="bg-bg-card p-6 rounded-2xl border border-purple-900/20">
        <h3 className="font-bold text-text-primary mb-3">
          Уровень продаж
        </h3>
        <p className="text-text-secondary text-sm">
          Продаж: {stats.sales}
        </p>
      </div>

      {/* ================= КАК НАЧИСЛЯЕТСЯ XP ================= */}
      <div className="bg-bg-card p-6 rounded-2xl border border-purple-900/20">
        <h3 className="font-bold text-text-primary mb-4">
          Как начисляется опыт (XP)
        </h3>

        <div className="grid md:grid-cols-2 gap-4">

          <XPItem icon={<Star size={18} />} title="Положительный отзыв" xp="+50 XP" />
          <XPItem icon={<ShoppingCart size={18} />} title="Успешная продажа" xp="+100 XP" />
          <XPItem icon={<ShieldCheck size={18} />} title="Завершение гарантии" xp="+25 XP" />
          <XPItem icon={<Trophy size={18} />} title="Верификация профиля" xp="+200 XP" />
          <XPItem icon={<TrendingUp size={18} />} title="Участие в розыгрыше" xp="+150 XP" />
          <XPItem icon={<MessageCircle size={18} />} title="Общение в темах" xp="+15–35 XP" />

        </div>
      </div>

    </div>
  );
};

/* ================= XP CARD ================= */

interface XPItemProps {
  icon: React.ReactNode;
  title: string;
  xp: string;
}

const XPItem: React.FC<XPItemProps> = ({ icon, title, xp }) => (
  <div className="flex items-center justify-between p-4 bg-purple-900/10 rounded-xl border border-purple-900/20 hover:border-purple-500/40 transition-all">
    <div className="flex items-center gap-3 text-text-primary">
      {icon}
      <span className="text-sm">{title}</span>
    </div>
    <span className="text-accent-soft font-bold text-sm">{xp}</span>
  </div>
);

export default StatusPage;