import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Bell, Palette, Key, CreditCard,
  Eye, EyeOff, Save, X, Clock, Check, AlertCircle, Camera, Image,
  Link2, Moon, Crown, Flower2, Waves, TreePine, Droplet,
  Flame, Heart, Circle, Sun, Leaf, CircleDot, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';
import { usePrivacy, THEMES, ThemeKey, FULL_THEMES, FullThemeKey } from '../lib/usePrivacy';
import { LevelBadge } from '../components/LevelBadge';
import { RoleBadge } from '../components/RoleBadge';
import IntegrationsSection from '../components/IntegrationsSection';
import ModerationPanel from '../components/ModerationPanel';

type ActionType = 'username' | 'email' | 'password' | 'custom_id' | null;

interface SettingsPageProps {
  onNavigate?: (page: any, payload?: any) => void;
}

const THEME_ICONS: Record<FullThemeKey, React.ElementType> = {
  night: Moon,
  midnight: Sparkles,
  royal: Crown,
  sakura: Flower2,
  ocean: Waves,
  forest: TreePine,
  crimson: Droplet,
  amber: Flame,
  emerald: Heart,
  amoled: CircleDot,
  graphite: Circle,
  navy: Waves,
  mint: Leaf,
  light: Sun,
};

const ThemeLogo: React.FC<{ themeKey: FullThemeKey; color: string; active?: boolean }> = ({ themeKey, color, active }) => {
  const Icon = THEME_ICONS[themeKey] || Palette;
  return (
    <span
      className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${active ? 'scale-105' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${color}26, ${color}10)`,
        borderColor: `${color}66`,
        boxShadow: active ? `0 0 18px ${color}55` : `0 0 12px ${color}22`,
      }}
    >
      <Icon size={16} style={{ color }} strokeWidth={2.2} />
    </span>
  );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('mod_open_user_id') ? 'moderation' : 'profile';
  });
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // модалка подтверждения паролем
  const [action, setAction] = useState<ActionType>(null);
  const [newValue, setNewValue] = useState('');
  const [newValue2, setNewValue2] = useState(''); // для пароля — подтверждение
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showEmailLocal, setShowEmailLocal] = useState(false);
  const { glowEnabled, setGlowEnabled, liveFeedEnabled, setLiveFeedEnabled, theme, setTheme, fullTheme, setFullTheme } = usePrivacy();

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const handleUpload = async (type: 'avatar' | 'banner', file: File) => {
    if (!user) return;
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
      await supabase.from('users').update({ [field]: urlData.publicUrl }).eq('id', user.id);
      setProfile((p: any) => p ? { ...p, [field]: urlData.publicUrl } : p);
    } catch (e: any) {
      alert('Ошибка загрузки: ' + e.message);
    }
  };

  // Уведомления
  const [notifications, setNotifications] = useState({
    purchases: true, sales: true, messages: true, promo: false, system: true,
  });

  /* ============ Загрузка пользователя и профиля ============ */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: p } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        setProfile(p);
      }
      setLoading(false);
    };
    load();
  }, []);

  /* ============ Проверка — можно ли менять ник ============ */
  const lastNameChange: Date | null = profile?.username_changed_at
    ? new Date(profile.username_changed_at)
    : null;

  const daysUntilCanChange = (() => {
    if (!lastNameChange) return 0;
    const diff = Date.now() - lastNameChange.getTime();
    const daysPassed = diff / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(7 - daysPassed));
  })();

  const canChangeUsername = daysUntilCanChange === 0;

  const isMod = ['moderator', 'admin', 'owner'].includes(profile?.role || '');

  const sections = [
    { id: 'profile', label: 'Профиль', icon: Settings },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'integrations', label: 'Интеграции', icon: Link2 },
    { id: 'payments', label: 'Оплата', icon: CreditCard },
    { id: 'api', label: 'API', icon: Key },
    ...(isMod ? [{ id: 'moderation', label: 'Модерация', icon: Shield }] : []),
  ];

  /* ============ Открыть модалку ============ */
  const openAction = (type: ActionType) => {
    setAction(type);
    setNewValue('');
    setNewValue2('');
    setCurrentPassword('');
    setActionMessage(null);
  };

  /* ============ Подтверждение действия ============ */
  const handleConfirm = async () => {
    if (!user) return;

    // Валидация
    if (action === 'username') {
      if (!newValue.trim() || newValue.length < 3) {
        setActionMessage({ type: 'err', text: 'Ник должен быть от 3 символов' });
        return;
      }
    }
    if (action === 'custom_id') {
      const clean = newValue.toLowerCase().trim();
      if (!/^[a-z0-9_.]{3,15}$/.test(clean)) {
        setActionMessage({ type: 'err', text: 'ID: 3-15 символов (a-z, 0-9, _ .)' });
        return;
      }
      if (/^[0-9]+$/.test(clean) && clean.length < 8) {
        setActionMessage({ type: 'err', text: 'Чисто цифровой ID должен быть от 8 цифр' });
        return;
      }
    }
    if (action === 'email') {
      if (!newValue.includes('@')) {
        setActionMessage({ type: 'err', text: 'Введите корректный email' });
        return;
      }
    }
    if (action === 'password') {
      if (newValue.length < 6) {
        setActionMessage({ type: 'err', text: 'Пароль минимум 6 символов' });
        return;
      }
      if (newValue !== newValue2) {
        setActionMessage({ type: 'err', text: 'Пароли не совпадают' });
        return;
      }
    }
    // Для custom_id пароль не нужен (это просто покупка)
    if (action !== 'custom_id' && !currentPassword) {
      setActionMessage({ type: 'err', text: 'Введите текущий пароль' });
      return;
    }

    setActionLoading(true);
    try {
      // 1. Проверка текущего пароля через signIn (только если он нужен)
      if (action !== 'custom_id') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });
        if (signInError) {
          setActionMessage({ type: 'err', text: 'Неверный текущий пароль' });
          setActionLoading(false);
          return;
        }
      }

      // Custom ID — отдельная логика (через buy_custom_id RPC, баланс уже проверяется внутри)
      if (action === 'custom_id') {
        const { data, error } = await supabase.rpc('buy_custom_id', { p_new_id: newValue });
        if (error) throw error;
        if (!data?.ok) {
          const errMap: Record<string, string> = {
            invalid_format: 'Можно: a-z, 0-9, _ . (3-15 символов)',
            numeric_too_short: 'Чисто цифровой ID должен быть от 8 цифр',
            id_taken: 'Этот ID уже занят',
            reserved: 'Это зарезервированный ID',
            insufficient_balance: 'Недостаточно средств (нужно 350₽)',
          };
          setActionMessage({ type: 'err', text: errMap[data?.error] || data?.error || 'Ошибка' });
          setActionLoading(false);
          return;
        }
        setProfile((p: any) => p ? { ...p, custom_id: newValue } : p);
        setActionMessage({ type: 'ok', text: '✅ ID изменён! С баланса списано 350₽' });
        setTimeout(() => setAction(null), 1500);
        return;
      }

      // 2. Выполняем действие
      if (action === 'username') {
        // Используем RPC — серверная проверка лимита 7 дней
        const { data: result, error } = await supabase.rpc('update_username', { new_username: newValue });
        if (error) throw error;
        if (result === 'too_soon') {
          setActionMessage({ type: 'err', text: 'Никнейм можно менять раз в 7 дней' });
          setActionLoading(false);
          return;
        }
        setProfile({ ...profile, username: newValue, username_changed_at: new Date().toISOString() });
      }

      if (action === 'email') {
        const { error } = await supabase.auth.updateUser({ email: newValue });
        if (error) throw error;
        setActionMessage({ type: 'ok', text: 'На новый email отправлено письмо для подтверждения' });
        setActionLoading(false);
        return;
      }

      if (action === 'password') {
        const { error } = await supabase.auth.updateUser({ password: newValue });
        if (error) throw error;
      }

      setActionMessage({ type: 'ok', text: '✅ Изменения сохранены' });
      setTimeout(() => setAction(null), 1500);
    } catch (e: any) {
      setActionMessage({ type: 'err', text: e.message || 'Ошибка' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-text-secondary p-10 text-center">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Settings size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Настройки</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-bg-card border border-purple-900/20 rounded-2xl p-3 h-fit"
        >
          {sections.map(section => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-purple-600/20 text-accent-soft'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
        >

          {/* === ПРОФИЛЬ === */}
          {activeSection === 'profile' && (
            <>
              <h3 className="text-base font-semibold text-white">Данные профиля</h3>

              {/* Аватар и баннер */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <label className="text-sm text-text-secondary mb-3 block">Аватарка и баннер</label>

                {/* Баннер превью */}
                <div
                  className="h-24 rounded-xl mb-3 relative overflow-hidden bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center"
                  style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
                >
                  <button
                    onClick={() => bannerInput.current?.click()}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg text-xs text-white hover:bg-black/80"
                  >
                    <Image size={12} /> Загрузить баннер
                  </button>
                  <input ref={bannerInput} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
                </div>

                {/* Аватар */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden border-2 border-purple-900/40">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {(profile?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => avatarInput.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center border-2 border-bg-card"
                    >
                      <Camera size={12} className="text-white" />
                    </button>
                    <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleUpload('avatar', e.target.files[0])} />
                  </div>
                  <div>
                    <p className="text-sm text-white">Нажмите на иконку 📷 чтобы сменить аватарку</p>
                    <p className="text-xs text-text-secondary mt-0.5">PNG / JPG / GIF, до 2 МБ</p>
                  </div>
                </div>
              </div>

              {/* Никнейм */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-text-secondary">Никнейм</label>
                  {!canChangeUsername && (
                    <div className="flex items-center gap-1 text-xs text-orange-400">
                      <Clock size={12} />
                      Доступно через {daysUntilCanChange} дн.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white">
                    {profile?.username || user?.email?.split('@')[0] || 'Не задано'}
                  </div>
                  <button
                    onClick={() => openAction('username')}
                    disabled={!canChangeUsername}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Изменить
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  💡 Никнейм можно менять раз в 7 дней
                </p>
              </div>

              {/* Кастомный ID */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-text-secondary">ID профиля</label>
                  <span className="text-[10px] text-text-secondary">💎 350₽ за смену</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white font-mono">
                    #{profile?.custom_id || '—'}
                  </div>
                  <button
                    onClick={() => openAction('custom_id')}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
                  >
                    Изменить
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  💡 Хочешь короткий красивый ID? Можно купить за 350₽
                </p>
              </div>

              {/* О себе */}
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">О себе</label>
                <textarea
                  rows={3}
                  defaultValue={profile?.bio || ''}
                  placeholder="Расскажите о себе..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none bg-bg-secondary border border-purple-900/30 text-white"
                  onBlur={async (e) => {
                    if (user) {
                      await supabase.from('users').upsert({ id: user.id, bio: e.target.value });
                    }
                  }}
                />
              </div>
            </>
          )}

          {/* === БЕЗОПАСНОСТЬ === */}
          {activeSection === 'security' && (
            <>
              <h3 className="text-base font-semibold text-white">Безопасность</h3>

              {/* Email (перенесён сюда) */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <label className="text-sm text-text-secondary mb-2 block">Email</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white font-mono">
                    {showEmailLocal ? user?.email : '••••••••@' + (user?.email?.split('@')[1] || '••••')}
                  </div>
                  <button
                    onClick={() => setShowEmailLocal(!showEmailLocal)}
                    title={showEmailLocal ? 'Скрыть' : 'Показать'}
                    className="p-3 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-xl">
                    {showEmailLocal ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => openAction('email')}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
                  >
                    Изменить
                  </button>
                </div>
              </div>

              {/* Пароль */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Пароль</p>
                    <p className="text-xs text-text-secondary mt-1">Регулярно меняйте для безопасности</p>
                  </div>
                  <button
                    onClick={() => openAction('password')}
                    className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
                  >
                    Изменить пароль
                  </button>
                </div>
              </div>

              {/* Приватность */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-white">🔒 Приватность</p>

                <label className="flex items-center justify-between p-3 bg-bg-card rounded-xl cursor-pointer">
                  <div>
                    <p className="text-sm text-white">Скрыть email от других</p>
                    <p className="text-xs text-text-secondary">В профиле и поиске</p>
                  </div>
                  <button
                    onClick={async () => {
                      const v = !profile?.hide_email;
                      await supabase.from('users').update({ hide_email: v }).eq('id', user.id);
                      setProfile({ ...profile, hide_email: v });
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative ${profile?.hide_email ? 'bg-accent' : 'bg-purple-900/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${profile?.hide_email ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-bg-card rounded-xl cursor-pointer">
                  <div>
                    <p className="text-sm text-white">Скрыть баланс от других</p>
                    <p className="text-xs text-text-secondary">Чужие профили не увидят сумму</p>
                  </div>
                  <button
                    onClick={async () => {
                      const v = !profile?.hide_balance;
                      await supabase.from('users').update({ hide_balance: v }).eq('id', user.id);
                      setProfile({ ...profile, hide_balance: v });
                    }}
                    className={`w-11 h-6 rounded-full transition-all relative ${profile?.hide_balance ? 'bg-accent' : 'bg-purple-900/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${profile?.hide_balance ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </label>
              </div>

              {/* 2FA */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Двухфакторная авторизация</p>
                    <p className="text-xs text-text-secondary mt-1">Дополнительная защита аккаунта</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-900/20 text-orange-400 text-xs rounded-full">Скоро</span>
                </div>
              </div>
            </>
          )}

          {/* === УВЕДОМЛЕНИЯ === */}
          {activeSection === 'notifications' && (
            <>
              <h3 className="text-base font-semibold text-white">Уведомления</h3>
              {[
                { key: 'purchases', label: 'О покупках', desc: 'Уведомлять о новых заказах' },
                { key: 'sales', label: 'О продажах', desc: 'Уведомлять о продажах ваших аккаунтов' },
                { key: 'messages', label: 'Сообщения', desc: 'Личные сообщения от пользователей' },
                { key: 'system', label: 'Системные', desc: 'Важные уведомления от платформы' },
                { key: 'promo', label: 'Акции', desc: 'Промо-акции и скидки' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-bg-secondary border border-purple-900/20 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-text-secondary">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !(notifications as any)[item.key] })}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      (notifications as any)[item.key] ? 'bg-accent' : 'bg-purple-900/30'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      (notifications as any)[item.key] ? 'left-5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* === ВНЕШНИЙ ВИД === */}
          {activeSection === 'appearance' && (
            <>
              <h3 className="text-base font-semibold text-white">Внешний вид</h3>

              {/* === ПОЛНАЯ ТЕМА (фон) === */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-accent" />
                  <p className="text-sm font-medium text-white">Полное оформление сайта</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(FULL_THEMES) as FullThemeKey[]).map(k => {
                    const ft = FULL_THEMES[k];
                    const isActive = fullTheme === k;
                    return (
                      <motion.button
                        key={k}
                        onClick={() => setFullTheme(k)}
                        whileHover={{ y: -2, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative p-3 rounded-xl border-2 transition-all text-left overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${ft.bg} 0%, ${ft.bg2} 52%, ${ft.bg3} 100%)`,
                          borderColor: isActive ? ft.accent : `${ft.accent}55`,
                          boxShadow: isActive ? `0 0 0 1px ${ft.accent}, 0 0 24px ${ft.accent}44` : `0 0 14px ${ft.accent}18`,
                          color: ft.text,
                        }}
                      >
                        <span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ background: `radial-gradient(circle at 20% 0%, ${ft.accent}22, transparent 46%)` }}
                        />
                        <div className="relative flex items-center gap-2 min-w-0">
                          <ThemeLogo themeKey={k} color={ft.accent} active={isActive} />
                          <span className="text-xs font-semibold truncate" style={{ color: ft.text }}>{ft.label}</span>
                        </div>
                        <div className="relative flex items-center gap-1.5 mt-3">
                          {[ft.bg, ft.bg2, ft.bg3, ft.accent].map((c, i) => (
                            <span
                              key={`${k}-${c}-${i}`}
                              className="h-2.5 flex-1 rounded-full border border-white/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        {isActive && (
                          <span className="absolute right-2 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: ft.accent, boxShadow: `0 0 12px ${ft.accent}` }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-secondary mt-3">💡 Меняет фон, цвет карточек, текст, бордеры и акцент по всему сайту</p>
              </div>

              {/* === Тема оформления === */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-accent" />
                  <p className="text-sm font-medium text-white">Тема акцентного цвета</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map(k => {
                    const t = THEMES[k];
                    const isActive = theme === k;
                    return (
                      <motion.button
                        key={k}
                        onClick={() => setTheme(k)}
                        whileHover={{ y: -2, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative p-3 rounded-xl border-2 transition-all text-left overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${t.accent}22, ${t.soft}10)`,
                          borderColor: isActive ? t.accent : `${t.accent}55`,
                          boxShadow: isActive ? `0 0 0 1px ${t.accent}, 0 0 24px ${t.accent}44` : `0 0 14px ${t.accent}16`,
                        }}
                      >
                        <span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ background: `radial-gradient(circle at 20% 0%, ${t.accent}24, transparent 48%)` }}
                        />
                        <div className="relative flex items-center gap-2 min-w-0">
                          <ThemeLogo themeKey={k as FullThemeKey} color={t.accent} active={isActive} />
                          <span className="text-xs font-semibold text-white truncate">{t.label}</span>
                        </div>
                        <div className="relative flex items-center gap-1.5 mt-3">
                          {[t.accent, t.hover, t.soft].map((c, i) => (
                            <span
                              key={`${k}-${c}-${i}`}
                              className="h-2.5 flex-1 rounded-full border border-white/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        {isActive && (
                          <span className="absolute right-2 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: t.accent, boxShadow: `0 0 12px ${t.accent}` }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-text-secondary mt-3">💡 Меняет акцентные кнопки, подсветки, hover, бордеры и градиенты</p>
              </div>

              {/* === Свечение === */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">✨ Свечение значков</p>
                    <p className="text-xs text-text-secondary mt-0.5">Glow-эффект на бейджах ролей и уровней</p>
                  </div>
                  <button onClick={() => setGlowEnabled(!glowEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${glowEnabled ? 'bg-accent' : 'bg-purple-900/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${glowEnabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="bg-bg-card rounded-lg p-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-secondary">Превью:</span>
                  <RoleBadge user={{ role: 'owner' }} />
                  <RoleBadge user={{ role: 'admin' }} />
                  <RoleBadge user={{ role: 'moderator' }} />
                  <LevelBadge level={1} />
                  <LevelBadge level={4} />
                  <LevelBadge level={6} />
                </div>
              </div>

              {/* === Прямой эфир === */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">📺 Прямой эфир</p>
                    <p className="text-xs text-text-secondary mt-0.5">Показ плашек о покупках в левом углу</p>
                  </div>
                  <button onClick={() => setLiveFeedEnabled(!liveFeedEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${liveFeedEnabled ? 'bg-accent' : 'bg-purple-900/30'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${liveFeedEnabled ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* === ОПЛАТА === */}
          {activeSection === 'payments' && (
            <>
              <h3 className="text-base font-semibold text-white">Способы оплаты</h3>
              <p className="text-sm text-text-secondary">Скоро здесь можно будет добавить карты и кошельки 💳</p>
            </>
          )}

          {/* === API === */}
          {activeSection === 'api' && (
            <>
              <h3 className="text-base font-semibold text-white">API-ключи</h3>
              <p className="text-sm text-text-secondary">Скоро можно будет создавать API-токены для автоматизации 🔑</p>
            </>
          )}

          {/* === ИНТЕГРАЦИИ === */}
          {activeSection === 'integrations' && <IntegrationsSection />}

          {/* === МОДЕРАЦИЯ === */}
          {activeSection === 'moderation' && isMod && <ModerationPanel onNavigate={onNavigate} />}
        </motion.div>
      </div>

      {/* ============ МОДАЛКА подтверждения паролем ============ */}
      <AnimatePresence>
        {action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => !actionLoading && setAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-card border border-purple-900/30 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  {action === 'custom_id' && 'Купить кастомный ID'}
                  {action === 'username' && 'Изменить никнейм'}
                  {action === 'email' && 'Изменить email'}
                  {action === 'password' && 'Изменить пароль'}
                </h2>
                <button onClick={() => setAction(null)} className="text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Новое значение */}
              {action === 'custom_id' && (
                <>
                  <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-3 mb-3 text-xs text-purple-300">
                    💎 Смена ID стоит <b>350 ₽</b> · спишется с баланса
                  </div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Новый ID</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="midnight"
                    maxLength={15}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-1 font-mono"
                  />
                  <p className="text-[11px] text-text-secondary mb-3">
                    💡 От 3 до 15 символов: буквы (a-z), цифры (0-9), <code className="text-purple-300">_</code> и <code className="text-purple-300">.</code><br/>
                    🔢 Чисто цифровой — минимум 8 цифр (короткие зарезервированы)
                  </p>
                </>
              )}

              {action === 'username' && (
                <>
                  <label className="text-sm text-text-secondary mb-1.5 block">Новый никнейм</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="cool_nickname"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
                  />
                </>
              )}

              {action === 'email' && (
                <>
                  <label className="text-sm text-text-secondary mb-1.5 block">Новый email</label>
                  <input
                    type="email"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="new@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
                  />
                </>
              )}

              {action === 'password' && (
                <>
                  <label className="text-sm text-text-secondary mb-1.5 block">Новый пароль</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
                  />

                  <label className="text-sm text-text-secondary mb-1.5 block">Подтвердите пароль</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newValue2}
                    onChange={e => setNewValue2(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
                  />
                </>
              )}

              {/* Текущий пароль (не нужен для custom_id) */}
              {action !== 'custom_id' && (
              <><label className="text-sm text-text-secondary mb-1.5 block flex items-center gap-2">
                <Shield size={12} /> Текущий пароль (для подтверждения)
              </label>
              <div className="relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div></>)}

              {actionMessage && (
                <div className={`text-sm mb-3 p-2 rounded-lg flex items-center gap-2 ${
                  actionMessage.type === 'ok' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {actionMessage.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {actionMessage.text}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? 'Сохранение...' : <><Save size={16} /> Подтвердить</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
