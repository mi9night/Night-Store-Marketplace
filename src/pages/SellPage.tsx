import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Shield, Zap, CheckCircle2, AlertCircle, ArrowLeft,
  Mail, Key, Eye, EyeOff, Lock, Plus, Trash2,
  Package, Gamepad2, Send, Target, Hexagon, Square, Crown, Box,
  Star, MessageCircle, Music, Camera, Brain, Atom, Sparkles,
  Joystick, Pickaxe
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// Category field configs — what each category asks from seller
// ═══════════════════════════════════════════════════════════════════════════

interface CategoryField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'email_pair';
  placeholder?: string;
  required?: boolean;
  botField?: string;   // maps to data key the bot reads (e.g. 'steam_id')
  hint?: string;
  options?: { value: string; label: string }[];
  group?: 'bot' | 'info' | 'account'; // bot=for validation, info=display, account=credentials
}

const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  // ── Gaming ────────────────────────────────────────────────────────────
  steam: [
    { id: 'steam_id',    label: 'Steam ID / Ссылка на профиль',  type: 'text',   placeholder: '76561198... или ссылка на профиль', required: true, botField: 'steam_id', hint: 'Профиль → ПКМ → «Копировать URL»', group: 'bot' },
    { id: 'games_count', label: 'Количество игр',                type: 'number', placeholder: '0',                                group: 'info' },
    { id: 'hours',       label: 'Всего часов',                   type: 'number', placeholder: '0',                                group: 'info' },
    { id: 'prime',       label: 'Prime статус',                  type: 'toggle',                                                   group: 'info' },
    { id: 'rank',        label: 'Ранг (CS2 / Dota и т.д.)',      type: 'text',   placeholder: 'Global Elite / Divine 5...',        group: 'info' },
  ],

  epic: [
    { id: 'epic_email',   label: 'Email от Epic Games',  type: 'text',   placeholder: 'email@example.com', required: true, botField: 'epic_email', group: 'bot' },
    { id: 'games_count',  label: 'Количество игр',       type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'skins_count',  label: 'Количество скинов',    type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'vbucks',       label: 'V-Bucks на аккаунте',  type: 'number', placeholder: '0',                  group: 'info' },
  ],

  fortnite: [
    { id: 'epic_email',     label: 'Email от Epic Games', type: 'text',   placeholder: 'email@example.com', required: true, botField: 'epic_email', group: 'bot' },
    { id: 'skins_count',    label: 'Количество скинов',   type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'og_skins',       label: 'OG скины',            type: 'text',   placeholder: 'Renegade Raider, Skull Trooper...', group: 'info' },
    { id: 'battle_pass',    label: 'Battle Pass сезон',   type: 'text',   placeholder: 'Сезон 1, 2...',      group: 'info' },
    { id: 'vbucks',         label: 'V-Bucks',             type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'level',          label: 'Уровень аккаунта',    type: 'number', placeholder: '0',                  group: 'info' },
  ],

  ea: [
    { id: 'ea_email',     label: 'Email от EA',            type: 'text',   placeholder: 'email@example.com', required: true, botField: 'ea_email', group: 'bot' },
    { id: 'games_count',  label: 'Количество игр',         type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'ea_play',      label: 'EA Play подписка',       type: 'toggle',                                    group: 'info' },
    { id: 'apex_level',   label: 'Уровень Apex Legends',   type: 'number', placeholder: '0',                  group: 'info' },
  ],

  ubisoft: [
    { id: 'ubi_email',    label: 'Email от Ubisoft',       type: 'text',   placeholder: 'email@example.com', required: true, botField: 'ubi_email', group: 'bot' },
    { id: 'games_count',  label: 'Количество игр',         type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'r6_rank',      label: 'Ранг Rainbow Six',       type: 'text',   placeholder: 'Champion / Diamond...', group: 'info' },
  ],

  minecraft: [
    { id: 'mc_username', label: 'Ник в Minecraft',        type: 'text',   placeholder: 'Steve', required: true, botField: 'minecraft_username', hint: 'Java Edition ник', group: 'bot' },
    { id: 'edition',     label: 'Издание',                type: 'select', options: [{ value: 'java', label: 'Java' }, { value: 'bedrock', label: 'Bedrock' }, { value: 'java+bedrock', label: 'Java + Bedrock' }], group: 'info' },
    { id: 'cape',        label: 'Плащ (Cape)',            type: 'toggle',                                    group: 'info' },
    { id: 'optifine',    label: 'OptiFine Cape',          type: 'toggle',                                    group: 'info' },
  ],

  supercell: [
    { id: 'sc_tag',       label: 'Тег игрока (#ABC123)',  type: 'text',   placeholder: '#ABC123', required: true, botField: 'supercell_tag', group: 'bot' },
    { id: 'sc_game',      label: 'Игра',                  type: 'select', options: [{ value: 'cr', label: 'Clash Royale' }, { value: 'coc', label: 'Clash of Clans' }, { value: 'bs', label: 'Brawl Stars' }], group: 'info' },
    { id: 'level',        label: 'Уровень',               type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'trophies',     label: 'Трофеи / кубки',        type: 'number', placeholder: '0',                  group: 'info' },
  ],

  roblox: [
    { id: 'roblox_user', label: 'Ник в Roblox',           type: 'text',   placeholder: 'Username', required: true, botField: 'roblox_username', group: 'bot' },
    { id: 'robux',       label: 'Robux на счету',         type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'premium',     label: 'Roblox Premium',         type: 'toggle',                                    group: 'info' },
    { id: 'limiteds',    label: 'Количество Limiteds',    type: 'number', placeholder: '0',                  group: 'info' },
  ],

  wot: [
    { id: 'wot_nick',     label: 'Никнейм WoT',          type: 'text',   placeholder: 'PlayerName', required: true, botField: 'wot_nickname', group: 'bot' },
    { id: 'wot_server',   label: 'Сервер',                type: 'select', options: [{ value: 'ru', label: 'RU' }, { value: 'eu', label: 'EU' }, { value: 'na', label: 'NA' }, { value: 'asia', label: 'ASIA' }], group: 'info' },
    { id: 'battles',      label: 'Количество боёв',       type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'winrate',      label: 'Винрейт %',             type: 'number', placeholder: '50',                 group: 'info' },
    { id: 'max_tier',     label: 'Макс. уровень танка',   type: 'number', placeholder: '10',                 group: 'info' },
  ],

  wr: [
    { id: 'wg_nick',     label: 'Никнейм Wargaming',     type: 'text',   placeholder: 'PlayerName', required: true, botField: 'wg_nickname', group: 'bot' },
    { id: 'battles',     label: 'Количество боёв',        type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'winrate',     label: 'Винрейт %',              type: 'number', placeholder: '50',                 group: 'info' },
  ],

  rockstar: [
    { id: 'rsc_email',   label: 'Email Rockstar',         type: 'text',   placeholder: 'email@example.com', required: true, botField: 'rockstar_email', group: 'bot' },
    { id: 'gta_level',   label: 'Уровень GTA Online',     type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'gta_money',   label: 'Деньги GTA$',            type: 'text',   placeholder: '10 000 000',         group: 'info' },
    { id: 'rdr_level',   label: 'Уровень RDR2 Online',    type: 'number', placeholder: '0',                  group: 'info' },
  ],

  mihoyo: [
    { id: 'mihoyo_uid',  label: 'UID (Genshin / HSR)',    type: 'text',   placeholder: '800123456', required: true, botField: 'mihoyo_uid', hint: 'Внутриигровой UID', group: 'bot' },
    { id: 'mhy_game',    label: 'Игра',                   type: 'select', options: [{ value: 'genshin', label: 'Genshin Impact' }, { value: 'hsr', label: 'Honkai Star Rail' }, { value: 'hi3', label: 'Honkai Impact 3' }, { value: 'zzz', label: 'Zenless Zone Zero' }], group: 'info' },
    { id: 'ar_level',    label: 'Adventure Rank / Уровень', type: 'number', placeholder: '0',                group: 'info' },
    { id: 'five_star',   label: '5★ персонажей',          type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'primogems',   label: 'Примогемы',              type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'server',      label: 'Сервер',                 type: 'select', options: [{ value: 'eu', label: 'Europe' }, { value: 'na', label: 'America' }, { value: 'asia', label: 'Asia' }, { value: 'tw', label: 'TW/HK/MO' }], group: 'info' },
  ],

  // ── Social ────────────────────────────────────────────────────────────
  discord: [
    { id: 'discord_id',  label: 'Discord User ID',        type: 'text',   placeholder: '123456789012345678', required: true, botField: 'discord_id', hint: 'Настройки → Расширенные → Режим разработчика → ПКМ на профиль → Копировать ID', group: 'bot' },
    { id: 'nitro',       label: 'Nitro',                  type: 'select', options: [{ value: 'none', label: 'Нет' }, { value: 'basic', label: 'Nitro Basic' }, { value: 'full', label: 'Nitro Full' }], group: 'info' },
    { id: 'nitro_until', label: 'Nitro до (дата)',        type: 'text',   placeholder: '2026-12-31',         group: 'info' },
    { id: 'badges',      label: 'Бейджи',                 type: 'text',   placeholder: 'Early Supporter, Nitro...', group: 'info' },
    { id: 'servers',     label: 'Количество серверов',     type: 'number', placeholder: '0',                  group: 'info' },
  ],

  tiktok: [
    { id: 'tiktok_user', label: 'Имя пользователя TikTok', type: 'text',  placeholder: '@username', required: true, botField: 'tiktok_username', group: 'bot' },
    { id: 'followers',   label: 'Подписчики',              type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'likes',       label: 'Лайки',                   type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'videos',      label: 'Количество видео',        type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'verified',    label: 'Верификация ✓',           type: 'toggle',                                    group: 'info' },
    { id: 'monetization',label: 'Монетизация',             type: 'toggle',                                    group: 'info' },
  ],

  instagram: [
    { id: 'ig_user',     label: 'Имя пользователя Instagram', type: 'text',  placeholder: '@username', required: true, botField: 'instagram_username', group: 'bot' },
    { id: 'followers',   label: 'Подписчики',              type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'following',   label: 'Подписки',                type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'posts',       label: 'Количество постов',       type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'verified',    label: 'Верификация ✓',           type: 'toggle',                                    group: 'info' },
  ],

  telegram: [
    { id: 'tg_user',     label: 'Username / ID канала',    type: 'text',   placeholder: '@username или -100...', required: true, botField: 'telegram_username', hint: 'Для каналов: @channel или -100XXXXXXXXXX', group: 'bot' },
    { id: 'tg_type',     label: 'Тип',                     type: 'select', options: [{ value: 'account', label: 'Аккаунт' }, { value: 'channel', label: 'Канал' }, { value: 'group', label: 'Группа' }, { value: 'bot', label: 'Бот' }], group: 'info' },
    { id: 'subscribers',  label: 'Подписчики / участники', type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'tg_premium',  label: 'Telegram Premium',        type: 'toggle',                                    group: 'info' },
    { id: 'tg_stars',    label: 'Telegram Stars',          type: 'number', placeholder: '0',                  group: 'info' },
    { id: 'tg_theme',    label: 'Тематика канала',         type: 'text',   placeholder: 'Крипто, Новости, Юмор...', group: 'info' },
  ],

  // ── Services ──────────────────────────────────────────────────────────
  ai: [
    { id: 'ai_service',  label: 'Сервис',                  type: 'select', options: [{ value: 'chatgpt', label: 'ChatGPT' }, { value: 'claude', label: 'Claude' }, { value: 'midjourney', label: 'Midjourney' }, { value: 'gemini', label: 'Gemini' }, { value: 'other', label: 'Другой' }], required: true, group: 'info' },
    { id: 'plan_type',   label: 'Тип подписки',            type: 'select', options: [{ value: 'free', label: 'Бесплатный' }, { value: 'plus', label: 'Plus' }, { value: 'pro', label: 'Pro' }, { value: 'team', label: 'Team' }, { value: 'enterprise', label: 'Enterprise' }], group: 'info' },
    { id: 'expires',     label: 'Подписка до (дата)',      type: 'text',   placeholder: '2026-12-31', botField: 'subscription_expires', group: 'info' },
    { id: 'api_access',  label: 'Доступ к API',            type: 'toggle',                                    group: 'info' },
  ],

  neural: [
    { id: 'nn_service',  label: 'Нейросеть',               type: 'text',   placeholder: 'Stable Diffusion, RunwayML...', required: true, group: 'info' },
    { id: 'plan_type',   label: 'Тип подписки',            type: 'select', options: [{ value: 'free', label: 'Бесплатный' }, { value: 'basic', label: 'Basic' }, { value: 'standard', label: 'Standard' }, { value: 'pro', label: 'Pro' }], group: 'info' },
    { id: 'expires',     label: 'Подписка до (дата)',      type: 'text',   placeholder: '2026-12-31', botField: 'subscription_expires', group: 'info' },
    { id: 'credits',     label: 'Кредиты / токены',        type: 'number', placeholder: '0',                  group: 'info' },
  ],

  vpn: [
    { id: 'vpn_provider', label: 'Провайдер',             type: 'select', options: [{ value: 'nord', label: 'NordVPN' }, { value: 'express', label: 'ExpressVPN' }, { value: 'surfshark', label: 'Surfshark' }, { value: 'proton', label: 'ProtonVPN' }, { value: 'other', label: 'Другой' }], required: true, group: 'info' },
    { id: 'plan_type',   label: 'Тип плана',              type: 'select', options: [{ value: '1m', label: '1 месяц' }, { value: '6m', label: '6 месяцев' }, { value: '1y', label: '1 год' }, { value: '2y', label: '2 года' }, { value: '3y', label: '3 года' }], group: 'info' },
    { id: 'expires',     label: 'Подписка до (дата)',     type: 'text',   placeholder: '2028-01-01', botField: 'subscription_expires', group: 'info' },
    { id: 'devices',     label: 'Макс. устройств',        type: 'number', placeholder: '6',                  group: 'info' },
    { id: 'simultaneous',label: 'Одновременных подключений', type: 'number', placeholder: '6',               group: 'info' },
  ],
};

// Fallback for unknown categories
const DEFAULT_FIELDS: CategoryField[] = [
  { id: 'account_info', label: 'Информация об аккаунте', type: 'text', placeholder: 'Опишите что входит...', group: 'info' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Auto risk calculation
// ═══════════════════════════════════════════════════════════════════════════
function calcRiskLevel(form: any, catFields: CategoryField[]): { level: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (!form.guarantee) { score += 3; reasons.push('Без гарантии'); }
  if (!form.hasOriginalEmail) { score += 2; reasons.push('Нет родной почты'); }
  if (!form.hasTempEmail && !form.hasOriginalEmail) { score += 1; reasons.push('Нет привязанной почты'); }
  if (!form.description || form.description.length < 20) { score += 1; reasons.push('Короткое описание'); }
  if (form.price && parseInt(form.price) < 100) { score += 1; reasons.push('Очень низкая цена'); }
  if (form.guarantee && form.guaranteeHours === '12') { score += 1; reasons.push('Минимальная гарантия'); }
  if (!form.accountData || form.accountData.filter((f: any) => f.key && f.value).length === 0) { score += 2; reasons.push('Нет данных аккаунта'); }

  // Check required bot fields
  const requiredBot = catFields.filter(f => f.required && f.botField);
  const missingBot = requiredBot.filter(f => !form.categoryFields?.[f.id]);
  if (missingBot.length > 0) { score += 2; reasons.push('Нет данных для проверки ботом'); }

  if (score >= 5) return { level: 'high', reasons };
  if (score >= 2) return { level: 'medium', reasons };
  return { level: 'low', reasons };
}

const RISK_CONFIG = {
  low:    { label: 'Низкий',  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/30',  desc: 'Проверенный аккаунт' },
  medium: { label: 'Средний', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/30', desc: 'Есть нюансы' },
  high:   { label: 'Высокий', color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/30',       desc: 'Повышенный риск' },
};

type CategoryVisual = {
  Icon: React.ElementType;
  color: string;
  glow: string;
  bg: string;
};

// Те же Lucide-логотипы категорий, что в MarketPage и карточках товаров.
const SELL_CATEGORY_ICONS: Record<string, CategoryVisual> = {
  steam:     { Icon: Gamepad2,      color: 'text-blue-400',   glow: 'shadow-blue-500/25',   bg: 'from-blue-500/20 to-purple-500/5' },
  telegram:  { Icon: Send,          color: 'text-cyan-400',   glow: 'shadow-cyan-500/25',   bg: 'from-cyan-500/20 to-purple-500/5' },
  epic:      { Icon: Joystick,      color: 'text-gray-200',   glow: 'shadow-white/10',      bg: 'from-white/15 to-purple-500/5' },
  fortnite:  { Icon: Pickaxe,       color: 'text-blue-400',   glow: 'shadow-sky-500/25',    bg: 'from-sky-500/20 to-purple-500/5' },
  ea:        { Icon: Target,        color: 'text-red-500',    glow: 'shadow-red-500/25',    bg: 'from-red-500/20 to-purple-500/5' },
  ubisoft:   { Icon: Hexagon,       color: 'text-blue-500',   glow: 'shadow-blue-500/25',   bg: 'from-blue-600/20 to-purple-500/5' },
  minecraft: { Icon: Square,        color: 'text-green-500',  glow: 'shadow-green-500/25',  bg: 'from-green-500/20 to-purple-500/5' },
  supercell: { Icon: Crown,         color: 'text-yellow-400', glow: 'shadow-yellow-500/25', bg: 'from-yellow-500/20 to-purple-500/5' },
  roblox:    { Icon: Box,           color: 'text-red-400',    glow: 'shadow-red-400/25',    bg: 'from-red-400/20 to-purple-500/5' },
  wot:       { Icon: Shield,        color: 'text-gray-400',   glow: 'shadow-gray-400/20',   bg: 'from-gray-400/20 to-purple-500/5' },
  wr:        { Icon: Zap,           color: 'text-yellow-300', glow: 'shadow-yellow-400/25', bg: 'from-yellow-400/20 to-purple-500/5' },
  rockstar:  { Icon: Star,          color: 'text-yellow-400', glow: 'shadow-yellow-500/25', bg: 'from-yellow-500/20 to-purple-500/5' },
  discord:   { Icon: MessageCircle, color: 'text-indigo-400', glow: 'shadow-indigo-500/25', bg: 'from-indigo-500/20 to-purple-500/5' },
  tiktok:    { Icon: Music,         color: 'text-pink-400',   glow: 'shadow-pink-500/25',   bg: 'from-pink-500/20 to-purple-500/5' },
  instagram: { Icon: Camera,        color: 'text-pink-500',   glow: 'shadow-pink-500/25',   bg: 'from-pink-500/20 to-purple-500/5' },
  ai:        { Icon: Brain,         color: 'text-purple-400', glow: 'shadow-purple-500/25', bg: 'from-purple-500/25 to-fuchsia-500/5' },
  neural:    { Icon: Atom,          color: 'text-purple-500', glow: 'shadow-purple-600/25', bg: 'from-purple-600/25 to-fuchsia-500/5' },
  vpn:       { Icon: Lock,          color: 'text-orange-400', glow: 'shadow-orange-500/25', bg: 'from-orange-500/20 to-purple-500/5' },
  mihoyo:    { Icon: Sparkles,      color: 'text-cyan-300',   glow: 'shadow-cyan-400/25',   bg: 'from-cyan-400/20 to-purple-500/5' },
};

const getSellCategoryVisual = (id?: string): CategoryVisual => (
  id && SELL_CATEGORY_ICONS[id]
    ? SELL_CATEGORY_ICONS[id]
    : { Icon: Package, color: 'text-purple-300', glow: 'shadow-purple-500/20', bg: 'from-purple-500/20 to-purple-500/5' }
);

const SellCategoryLogo: React.FC<{ id?: string; active?: boolean; size?: number }> = ({ id, active, size = 22 }) => {
  const visual = getSellCategoryVisual(id);
  const Icon = visual.Icon;

  return (
    <motion.span
      whileHover={{ scale: 1.08, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`relative inline-flex items-center justify-center rounded-2xl border bg-gradient-to-br ${visual.bg} ${active ? 'w-11 h-11 border-accent shadow-[0_0_22px_var(--tw-shadow-color)]' : 'w-10 h-10 border-purple-700/25 shadow-[0_0_16px_var(--tw-shadow-color)]'} ${visual.glow}`}
    >
      <Icon size={size} className={visual.color} strokeWidth={1.9} />
      {active && <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(168,85,247,0.8)]" />}
    </motion.span>
  );
};

interface AccountDataField { key: string; value: string; }

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════
const SellPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    price: '',
    hasOriginalEmail: false,
    hasTempEmail: false,
    originalEmail: '',
    originalEmailPassword: '',
    tempEmail: '',
    tempEmailPassword: '',
    guarantee: true,
    guaranteeHours: '24',
    categoryFields: {} as Record<string, any>,
    accountData: [
      { key: 'Логин', value: '' },
      { key: 'Пароль', value: '' },
    ] as AccountDataField[],
  });

  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const steps = ['Категория', 'Информация', 'Цена и гарантия', 'Публикация'];

  const catFields = useMemo(() =>
    CATEGORY_FIELDS[formData.category] || DEFAULT_FIELDS,
    [formData.category]
  );

  const risk = calcRiskLevel(formData, catFields);
  const riskCfg = RISK_CONFIG[risk.level];

  const setCatField = (id: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      categoryFields: { ...prev.categoryFields, [id]: value },
    }));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !formData.category) { setError('Выберите категорию'); return; }
    if (step === 2 && (!formData.title || !formData.description)) { setError('Заполните название и описание'); return; }
    if (step === 3 && !formData.price) { setError('Укажите цену'); return; }
    if (step < 4) setStep(step + 1);
  };
  const handleBack = () => { setError(null); if (step > 1) setStep(step - 1); };

  const handlePublish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setError('Войдите в систему'); setSubmitting(false); return; }

      const dataObj: Record<string, any> = {};

      // Account data (login/password)
      formData.accountData.forEach(f => {
        if (f.key.trim() && f.value.trim()) dataObj[f.key.trim()] = f.value.trim();
      });

      // Category-specific fields → save into data for bot + display
      catFields.forEach(f => {
        const val = formData.categoryFields[f.id];
        if (val !== undefined && val !== '' && val !== false) {
          const key = f.botField || f.id;
          dataObj[key] = val;
        }
      });

      // Emails
      if (formData.hasOriginalEmail && formData.originalEmail) {
        dataObj['Родная почта'] = formData.originalEmail;
        if (formData.originalEmailPassword) dataObj['Пароль от почты'] = formData.originalEmailPassword;
      }
      if (formData.hasTempEmail && formData.tempEmail) {
        dataObj['Временная почта'] = formData.tempEmail;
        if (formData.tempEmailPassword) dataObj['Пароль от врем. почты'] = formData.tempEmailPassword;
      }

      // Extract games_count from category fields if present
      const gamesCount = formData.categoryFields['games_count'] ? parseInt(formData.categoryFields['games_count']) : null;

      const { error: insertError } = await supabase.from('accounts').insert({
        seller_id: u.user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        price: parseInt(formData.price),
        games_count: gamesCount,
        has_original_email: formData.hasOriginalEmail,
        has_temp_email: formData.hasTempEmail,
        guarantee: formData.guarantee,
        guarantee_hours: parseInt(formData.guaranteeHours),
        escrow: true,
        risk_level: risk.level,
        status: 'active',
        data: Object.keys(dataObj).length > 0 ? dataObj : null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({
          category: '', subcategory: '', title: '', description: '', price: '',
          hasOriginalEmail: false, hasTempEmail: false,
          originalEmail: '', originalEmailPassword: '', tempEmail: '', tempEmailPassword: '',
          guarantee: true, guaranteeHours: '24',
          categoryFields: {},
          accountData: [{ key: 'Логин', value: '' }, { key: 'Пароль', value: '' }],
        });
      }, 2500);
    } catch (e: any) {
      setError(e.message || 'Ошибка публикации');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = categories.find(c => c.id === formData.category);
  const addDataField = () => setFormData({ ...formData, accountData: [...formData.accountData, { key: '', value: '' }] });
  const removeDataField = (idx: number) => setFormData({ ...formData, accountData: formData.accountData.filter((_, i) => i !== idx) });
  const updateDataField = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...formData.accountData];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData({ ...formData, accountData: updated });
  };

  // ─── Render a category field ──────────────────────────────────────────
  const renderCatField = (f: CategoryField) => {
    const val = formData.categoryFields[f.id] ?? (f.type === 'toggle' ? false : '');

    if (f.type === 'toggle') {
      return (
        <div key={f.id} className="flex items-center justify-between py-1">
          <span className="text-sm text-text-secondary">{f.label}</span>
          <div
            onClick={() => setCatField(f.id, !val)}
            className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${val ? 'bg-accent' : 'bg-purple-900/40'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-5' : 'left-0.5'}`} />
          </div>
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div key={f.id}>
          <label className="text-sm text-text-secondary mb-1.5 block">{f.label} {f.required && '*'}</label>
          <div className="flex flex-wrap gap-2">
            {f.options?.map(opt => (
              <button key={opt.value} onClick={() => setCatField(f.id, opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                  val === opt.value
                    ? 'border-accent bg-purple-900/30 text-accent-soft'
                    : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={f.id}>
        <label className="text-sm text-text-secondary mb-1.5 block">{f.label} {f.required && '*'}</label>
        <input
          type={f.type === 'number' ? 'number' : 'text'}
          value={val}
          onChange={e => setCatField(f.id, e.target.value)}
          placeholder={f.placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
        />
        {f.hint && <p className="text-[10px] text-text-secondary mt-1">{f.hint}</p>}
      </div>
    );
  };

  /* ============ Success ============ */
  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-bg-card border border-success/30 rounded-2xl p-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={48} className="text-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Аккаунт опубликован! 🎉</h2>
        <p className="text-text-secondary">Бот-валидатор проверит его автоматически</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Продать аккаунт</h1>
        <p className="text-text-secondary text-sm">Заполните информацию для размещения на маркетплейсе</p>
      </motion.div>

      {/* Steps */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <motion.div animate={{ scale: i + 1 === step ? 1.1 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < step ? 'bg-success text-white' :
                  i + 1 === step ? 'bg-accent text-white shadow-[0_0_20px_rgba(138,43,226,0.5)]' :
                  'bg-purple-900/20 text-text-secondary'
                }`}>
                {i + 1 < step ? <CheckCircle2 size={16} /> : i + 1}
              </motion.div>
              <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-accent-soft' : 'text-text-secondary'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 rounded transition-all ${i + 1 < step ? 'bg-accent' : 'bg-purple-900/20'}`} />
            )}
          </React.Fragment>
        ))}
      </motion.div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }} className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Выберите категорию</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <motion.button key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id, subcategory: '', categoryFields: {} })}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      formData.category === cat.id
                        ? 'border-accent bg-purple-900/30 text-accent-soft'
                        : 'border-purple-900/20 bg-bg-secondary text-text-secondary hover:border-purple-700/40'
                    }`}>
                    <div className="mb-3">
                      <SellCategoryLogo id={cat.id} active={formData.category === cat.id} />
                    </div>
                    <span className="text-sm font-medium block">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
              {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                  <label className="text-sm text-text-secondary mb-2 block">Подкатегория</label>
                  <div className="flex flex-wrap gap-2">
                    {currentCategory.subcategories.map(sub => (
                      <button key={sub}
                        onClick={() => setFormData({ ...formData, subcategory: formData.subcategory === sub ? '' : sub })}
                        className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                          formData.subcategory === sub ? 'border-accent bg-purple-900/30 text-accent-soft' : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                        }`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* STEP 2: Info + category-specific fields */}
          {step === 2 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Информация об аккаунте</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Название объявления *</label>
                  <input type="text" value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Steam Prime | CS2 | 2000 часов"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Описание *</label>
                  <textarea value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Подробно опишите аккаунт..." rows={4}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white resize-none focus:border-accent focus:outline-none transition-colors" />
                </div>

                {/* Category-specific fields */}
                {catFields.length > 0 && (
                  <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <SellCategoryLogo id={currentCategory?.id} size={16} active />
                      <span className="text-xs font-semibold text-accent-soft uppercase tracking-wider">
                        Параметры {currentCategory?.name || 'аккаунта'}
                      </span>
                    </div>
                    {catFields.filter(f => f.group !== 'account').map(renderCatField)}
                  </div>
                )}

                {/* Emails */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Родная почта</label>
                    <div className="flex items-center gap-3">
                      <div onClick={() => setFormData({ ...formData, hasOriginalEmail: !formData.hasOriginalEmail, originalEmail: '', originalEmailPassword: '' })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasOriginalEmail ? 'bg-accent' : 'bg-purple-900/40'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasOriginalEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${formData.hasOriginalEmail ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.hasOriginalEmail ? 'Есть' : 'Нет'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Временная почта</label>
                    <div className="flex items-center gap-3">
                      <div onClick={() => setFormData({ ...formData, hasTempEmail: !formData.hasTempEmail, tempEmail: '', tempEmailPassword: '' })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasTempEmail ? 'bg-accent' : 'bg-purple-900/40'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasTempEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${formData.hasTempEmail ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.hasTempEmail ? 'Есть' : 'Нет'}
                      </span>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {formData.hasOriginalEmail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1"><Mail size={14} className="text-green-400" /><span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Родная почта</span></div>
                        <input type="email" value={formData.originalEmail} onChange={e => setFormData({ ...formData, originalEmail: e.target.value })} placeholder="email@example.com"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                        <input type="password" value={formData.originalEmailPassword} onChange={e => setFormData({ ...formData, originalEmailPassword: e.target.value })} placeholder="Пароль от почты"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {formData.hasTempEmail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1"><Mail size={14} className="text-yellow-400" /><span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Временная почта</span></div>
                        <input type="email" value={formData.tempEmail} onChange={e => setFormData({ ...formData, tempEmail: e.target.value })} placeholder="temp@mail.com"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                        <input type="password" value={formData.tempEmailPassword} onChange={e => setFormData({ ...formData, tempEmailPassword: e.target.value })} placeholder="Пароль от почты"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* STEP 3: Price + Guarantee + Account data */}
          {step === 3 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Цена и гарантия</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Цена (₽) *</label>
                  <div className="relative">
                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0"
                      className="w-full px-4 py-3 rounded-xl text-sm pr-10 bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">₽</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Гарантия возврата</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div onClick={() => setFormData({ ...formData, guarantee: !formData.guarantee })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.guarantee ? 'bg-accent' : 'bg-purple-900/40'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.guarantee ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm text-text-secondary">Предоставить гарантию</span>
                  </div>
                  <AnimatePresence mode="wait">
                    {formData.guarantee ? (
                      <motion.div key="hours" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                        {['12', '24', '48', '72'].map(h => (
                          <button key={h} onClick={() => setFormData({ ...formData, guaranteeHours: h })}
                            className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                              formData.guaranteeHours === h ? 'border-accent bg-purple-900/30 text-accent-soft' : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                            }`}>{h}ч</button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key="no-g" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-400">Гарантия действует только на момент покупки. После получения данных претензии не принимаются.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Account credentials */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Данные аккаунта для покупателя</label>
                  <div className="space-y-2">
                    {formData.accountData.map((field, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="text" value={field.key} onChange={e => updateDataField(idx, 'key', e.target.value)} placeholder="Название"
                          className="w-1/3 px-3 py-2.5 rounded-lg text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                        <div className="flex-1 relative">
                          <input type={showPasswords[idx] ? 'text' : 'password'} value={field.value} onChange={e => updateDataField(idx, 'value', e.target.value)} placeholder="Значение"
                            className="w-full px-3 py-2.5 pr-9 rounded-lg text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors" />
                          <button onClick={() => setShowPasswords(p => ({ ...p, [idx]: !p[idx] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors">
                            {showPasswords[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {formData.accountData.length > 1 && (
                          <button onClick={() => removeDataField(idx)} className="p-2 text-text-secondary hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={addDataField}
                      className="w-full py-2 rounded-lg text-xs font-medium bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1.5">
                      <Plus size={12} /> Добавить поле
                    </button>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2 flex items-center gap-1">
                    <Lock size={10} /> Данные зашифрованы и будут доступны покупателю после оплаты
                  </p>
                </div>

                {/* Auto risk */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Уровень риска (автоматически)</label>
                  <div className={`p-3 rounded-xl border ${riskCfg.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className={riskCfg.color} />
                      <span className={`text-sm font-semibold ${riskCfg.color}`}>{riskCfg.label} риск</span>
                    </div>
                    {risk.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {risk.reasons.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-text-secondary">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Готово к публикации!</h3>
              <div className="space-y-1">
                {[
                  { label: 'Категория', value: currentCategory?.name || '—' },
                  formData.subcategory ? { label: 'Подкатегория', value: formData.subcategory } : null,
                  { label: 'Название', value: formData.title || '—' },
                  { label: 'Цена', value: formData.price ? `${parseInt(formData.price).toLocaleString()} ₽` : '—' },
                  { label: 'Гарантия', value: formData.guarantee ? `${formData.guaranteeHours}ч` : 'Только на момент покупки' },
                  { label: 'Escrow', value: 'Активна ✅' },
                  { label: 'Уровень риска', value: riskCfg.label },
                  { label: 'Данные аккаунта', value: `${formData.accountData.filter(f => f.key && f.value).length} полей` },
                  ...catFields.filter(f => formData.categoryFields[f.id]).map(f => ({
                    label: f.label,
                    value: f.type === 'toggle'
                      ? (formData.categoryFields[f.id] ? 'Да' : 'Нет')
                      : f.options
                        ? f.options.find(o => o.value === formData.categoryFields[f.id])?.label || formData.categoryFields[f.id]
                        : formData.categoryFields[f.id],
                  })),
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-purple-900/10">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <span className="text-sm font-medium text-text-primary text-right max-w-[60%] truncate">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-accent" />
                  <span className="text-sm font-semibold text-text-primary">AI проверка</span>
                </div>
                <p className="text-xs text-text-secondary">После публикации бот-валидатор автоматически проверит аккаунт по API.</p>
              </div>
            </>
          )}

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center justify-between mt-5">
        <motion.button onClick={handleBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={step === 1}
          className={`px-5 py-2.5 rounded-xl text-sm border border-purple-900/20 text-text-secondary hover:text-text-primary hover:border-purple-700/40 transition-all flex items-center gap-2 ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <ArrowLeft size={14} /> Назад
        </motion.button>
        <motion.button onClick={step === 4 ? handlePublish : handleNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-accent hover:bg-accent-hover text-white disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.3)]">
          {step === 4 ? (submitting ? 'Публикация...' : <><Zap size={16} /> Опубликовать</>) : <>Далее <ChevronDown size={16} className="-rotate-90" /></>}
        </motion.button>
      </div>
    </div>
  );
};

export default SellPage;
