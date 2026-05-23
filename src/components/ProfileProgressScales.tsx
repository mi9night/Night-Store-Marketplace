import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';

interface Props {
  sales?: number;
  level?: number;
  xp?: number;
}

const SALES_TIERS = [
  { key: 'newbie', label: 'Новичок', min: 0, max: 50, icon: '⭐', tone: 'text-gray-300', pill: 'bg-gray-500/15 border-gray-500/30 text-gray-300' },
  { key: 'bronze', label: 'Бронза', min: 50, max: 200, icon: '🥉', tone: 'text-amber-400', pill: 'bg-amber-600/15 border-amber-600/30 text-amber-400' },
  { key: 'silver', label: 'Серебро', min: 200, max: 500, icon: '🏅', tone: 'text-slate-200', pill: 'bg-slate-300/15 border-slate-300/30 text-slate-200' },
  { key: 'gold', label: 'Золото', min: 500, max: 1000, icon: '🌟', tone: 'text-yellow-400', pill: 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400' },
  { key: 'platinum', label: 'Платина', min: 1000, max: 2500, icon: '💎', tone: 'text-cyan-300', pill: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300' },
  { key: 'diamond', label: 'Бриллиант', min: 2500, max: Infinity, icon: '👑', tone: 'text-purple-300', pill: 'bg-purple-400/15 border-purple-400/30 text-purple-300' },
] as const;

const LEVEL_VISUALS: Record<number, { tone: string; pill: string; glow: string; bar: string; dot: string }> = {
  1: {
    tone: 'text-gray-300',
    pill: 'bg-gray-500/15 border-gray-500/30 text-gray-300',
    glow: '',
    bar: 'from-gray-400 to-slate-400',
    dot: 'bg-gray-400',
  },
  2: {
    tone: 'text-amber-400',
    pill: 'bg-amber-600/15 border-amber-600/30 text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    bar: 'from-amber-500 to-orange-400',
    dot: 'bg-amber-400',
  },
  3: {
    tone: 'text-slate-200',
    pill: 'bg-slate-300/15 border-slate-300/30 text-slate-200',
    glow: 'shadow-[0_0_14px_rgba(226,232,240,0.35)]',
    bar: 'from-slate-300 to-slate-100',
    dot: 'bg-slate-200',
  },
  4: {
    tone: 'text-yellow-400',
    pill: 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400',
    glow: 'shadow-[0_0_16px_rgba(250,204,21,0.45)]',
    bar: 'from-yellow-500 to-amber-300',
    dot: 'bg-yellow-400',
  },
  5: {
    tone: 'text-cyan-300',
    pill: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300',
    glow: 'shadow-[0_0_18px_rgba(34,211,238,0.55)]',
    bar: 'from-cyan-400 to-sky-300',
    dot: 'bg-cyan-300',
  },
  6: {
    tone: 'text-purple-300',
    pill: 'bg-purple-400/15 border-purple-400/30 text-purple-300',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.7)] animate-pulse',
    bar: 'from-purple-400 to-pink-400',
    dot: 'bg-purple-300',
  },
};

const MAX_SALES_PROGRESS = 2500;
const BASE_XP = 1000;
const XP_INCREMENT = 200;

const getRequiredXp = (level: number) => BASE_XP + (level - 1) * XP_INCREMENT;

const getLevelStartXp = (level: number) => {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += getRequiredXp(current);
  }
  return total;
};

const ProfileProgressScales: React.FC<Props> = ({ sales = 0, level = 1, xp = 0 }) => {
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 1));
  const safeSales = Math.max(0, Number(sales) || 0);
  const safeXp = Math.max(0, Number(xp) || 0);

  const currentSalesTier = SALES_TIERS.filter(tier => safeSales >= tier.min).slice(-1)[0] || SALES_TIERS[0];
  const nextSalesTier = SALES_TIERS.find(tier => safeSales < tier.min) || null;
  const salesProgress = Math.min(100, (Math.min(safeSales, MAX_SALES_PROGRESS) / MAX_SALES_PROGRESS) * 100);

  const currentLevelStyle = LEVEL_VISUALS[safeLevel] || LEVEL_VISUALS[1];
  const levelRequiredXp = getRequiredXp(safeLevel);
  const levelStartXp = getLevelStartXp(safeLevel);
  const xpInCurrentLevel = safeLevel >= 6
    ? levelRequiredXp
    : Math.max(0, Math.min(levelRequiredXp, safeXp - levelStartXp));
  const levelProgress = safeLevel >= 6 ? 100 : Math.min(100, (xpInCurrentLevel / levelRequiredXp) * 100);
  const nextLevel = safeLevel < 6 ? safeLevel + 1 : null;
  const xpLeft = nextLevel ? Math.max(0, levelRequiredXp - xpInCurrentLevel) : 0;

  return (
    <div className="space-y-3 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B0A12] rounded-2xl p-4 border border-purple-900/20"
      >
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Рейтинг по продажам</h3>
            </div>
            <p className="text-xs text-text-secondary">Текущий ранг продавца по числу продаж</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${currentSalesTier.pill}`}>
            <span>{currentSalesTier.icon}</span>
            <span>{currentSalesTier.label}</span>
          </span>
        </div>

        <div className="h-3 bg-purple-900/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${salesProgress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-300"
          />
        </div>

        <div className="grid grid-cols-6 gap-1 mt-2">
          {SALES_TIERS.map(tier => (
            <div key={tier.key} className="text-center">
              <p className={`text-[10px] font-semibold ${safeSales >= tier.min ? tier.tone : 'text-text-secondary'}`}>
                {tier.icon} {tier.min}+
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white font-semibold">Продаж: {safeSales.toLocaleString('ru-RU')}</span>
          {nextSalesTier ? (
            <span className="text-text-secondary">До ранга «{nextSalesTier.label}» осталось {Math.max(0, nextSalesTier.min - safeSales)} продаж</span>
          ) : (
            <span className="text-purple-300">Максимальный ранг по продажам достигнут</span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#0B0A12] rounded-2xl p-4 border border-purple-900/20"
      >
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Шкала уровня</h3>
            </div>
            <p className="text-xs text-text-secondary">Чем выше уровень — тем ярче цвет и сильнее свечение</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${currentLevelStyle.pill} ${currentLevelStyle.glow}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${currentLevelStyle.dot}`} />
            <span>LVL {safeLevel}</span>
          </span>
        </div>

        <div className="h-3 bg-purple-900/20 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full bg-gradient-to-r ${currentLevelStyle.bar} ${currentLevelStyle.glow}`}
          />
        </div>

        <div className="grid grid-cols-6 gap-1 mb-3">
          {Array.from({ length: 6 }).map((_, idx) => {
            const lvl = idx + 1;
            const style = LEVEL_VISUALS[lvl];
            const active = lvl <= safeLevel;

            return (
              <div key={lvl} className="flex justify-center">
                <span className={`inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-lg border text-[10px] font-bold ${active ? `${style.pill} ${lvl === safeLevel ? style.glow : ''}` : 'bg-purple-900/10 border-purple-900/20 text-text-secondary'}`}>
                  LVL {lvl}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`font-semibold ${currentLevelStyle.tone}`}>{xpInCurrentLevel.toLocaleString('ru-RU')} / {levelRequiredXp.toLocaleString('ru-RU')} XP</span>
          {nextLevel ? (
            <span className="text-text-secondary">До LVL {nextLevel} осталось {xpLeft.toLocaleString('ru-RU')} XP</span>
          ) : (
            <span className="text-purple-300">Максимальный визуальный уровень достигнут</span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileProgressScales;
