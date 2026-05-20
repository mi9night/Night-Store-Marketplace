import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Bell, Palette, Key, CreditCard,
  Eye, EyeOff, Save, X, Clock, Check, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ActionType = 'username' | 'email' | 'password' | null;

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
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
          .from('profiles')
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

  const sections = [
    { id: 'profile', label: 'Профиль', icon: Settings },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'payments', label: 'Оплата', icon: CreditCard },
    { id: 'api', label: 'API', icon: Key },
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
    if (!currentPassword) {
      setActionMessage({ type: 'err', text: 'Введите текущий пароль' });
      return;
    }

    setActionLoading(true);
    try {
      // 1. Проверка текущего пароля через signIn
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      if (signInError) {
        setActionMessage({ type: 'err', text: 'Неверный текущий пароль' });
        setActionLoading(false);
        return;
      }

      // 2. Выполняем действие
      if (action === 'username') {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: newValue,
            username_changed_at: new Date().toISOString()
          });
        if (error) throw error;
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

              {/* Email */}
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <label className="text-sm text-text-secondary mb-2 block">Email</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => openAction('email')}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
                  >
                    Изменить
                  </button>
                </div>
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
                      await supabase.from('profiles').upsert({ id: user.id, bio: e.target.value });
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

              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Пароль</p>
                    <p className="text-xs text-text-secondary mt-1">Последнее изменение давно</p>
                  </div>
                  <button
                    onClick={() => openAction('password')}
                    className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
                  >
                    Изменить пароль
                  </button>
                </div>
              </div>

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
              <p className="text-sm text-text-secondary">Скоро здесь появятся темы оформления 🌙</p>
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
                  {action === 'username' && 'Изменить никнейм'}
                  {action === 'email' && 'Изменить email'}
                  {action === 'password' && 'Изменить пароль'}
                </h2>
                <button onClick={() => setAction(null)} className="text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Новое значение */}
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

              {/* Текущий пароль */}
              <label className="text-sm text-text-secondary mb-1.5 block flex items-center gap-2">
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
              </div>

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
