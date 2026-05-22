import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Bell, Palette, Key, CreditCard,
  Eye, EyeOff, Save, X, Clock, Check, AlertCircle, Camera, Image, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModerationPanel from '../components/ModerationPanel';

type ActionType = 'username' | 'email' | 'password' | 'custom_id' | null;

interface SettingsPageProps {
  onNavigate?: (page: any, payload?: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Состояние скрытия данных (глобально для сайта через localStorage)
  const [hidePrivateInfo, setHidePrivateInfo] = useState(() => localStorage.getItem('hidePrivateInfo') === 'true');

  useEffect(() => {
    localStorage.setItem('hidePrivateInfo', hidePrivateInfo.toString());
    // Синхронизируем с отдельными настройками в сайдбаре, если нужно
    if (hidePrivateInfo) {
      localStorage.setItem('hideBalance', 'true');
      localStorage.setItem('hideEmail', 'true');
    }
  }, [hidePrivateInfo]);

  // модалка подтверждения паролем
  const [action, setAction] = useState<ActionType>(null);
  const [newValue, setNewValue] = useState('');
  const [newValue2, setNewValue2] = useState(''); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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

  const [notifications, setNotifications] = useState({
    purchases: true, sales: true, messages: true, promo: false, system: true,
  });

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
    { id: 'payments', label: 'Оплата', icon: CreditCard },
    { id: 'api', label: 'API', icon: Key },
    ...(isMod ? [{ id: 'moderation', label: 'Модерация', icon: Shield }] : []),
  ];

  const openAction = (type: ActionType) => {
    setAction(type);
    setNewValue('');
    setNewValue2('');
    setCurrentPassword('');
    setActionMessage(null);
  };

  const handleConfirm = async () => {
    if (!user) return;
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
    if (action !== 'custom_id' && !currentPassword) {
      setActionMessage({ type: 'err', text: 'Введите текущий пароль' });
      return;
    }

    setActionLoading(true);
    try {
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

      if (action === 'custom_id') {
        const { data, error } = await supabase.rpc('buy_custom_id', { p_new_id: newValue });
        if (error) throw error;
        if (!data?.ok) {
          setActionMessage({ type: 'err', text: data?.error || 'Ошибка' });
          setActionLoading(false);
          return;
        }
        setProfile((p: any) => p ? { ...p, custom_id: newValue } : p);
        setActionMessage({ type: 'ok', text: '✅ ID изменён!' });
        setTimeout(() => setAction(null), 1500);
        return;
      }

      if (action === 'username') {
        const { data: result, error } = await supabase.rpc('update_username', { new_username: newValue });
        if (error) throw error;
        setProfile({ ...profile, username: newValue, username_changed_at: new Date().toISOString() });
      }

      if (action === 'email') {
        const { error } = await supabase.auth.updateUser({ email: newValue });
        if (error) throw error;
        setActionMessage({ type: 'ok', text: 'На новый email отправлено письмо' });
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

  if (loading) return <div className="text-text-secondary p-10 text-center">Загрузка...</div>;

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

        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
        >
          {activeSection === 'profile' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Данные профиля</h3>
                <button
                  onClick={() => setHidePrivateInfo(!hidePrivateInfo)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    hidePrivateInfo ? 'bg-accent/20 text-accent' : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {hidePrivateInfo ? <EyeOff size={14} /> : <Eye size={14} />}
                  {hidePrivateInfo ? 'Приватность включена' : 'Скрыть личные данные'}
                </button>
              </div>

              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <div className="h-24 rounded-xl mb-3 relative overflow-hidden bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center"
                  style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}>
                  <button onClick={() => bannerInput.current?.click()} className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg text-xs text-white hover:bg-black/80">
                    <Image size={12} /> Загрузить баннер
                  </button>
                  <input ref={bannerInput} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
                </div>
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
                    <button onClick={() => avatarInput.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center border-2 border-bg-card">
                      <Camera size={12} className="text-white" />
                    </button>
                    <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleUpload('avatar', e.target.files[0])} />
                  </div>
                  <div>
                    <p className="text-sm text-white">Нажмите на 📷 чтобы сменить аватарку</p>
                    <p className="text-xs text-text-secondary mt-0.5">PNG / JPG / GIF, до 2 МБ</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <label className="text-sm text-text-secondary mb-2 block">Никнейм</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white">
                    {profile?.username || user?.email?.split('@')[0]}
                  </div>
                  <button onClick={() => openAction('username')} disabled={!canChangeUsername}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold disabled:opacity-40">
                    Изменить
                  </button>
                </div>
              </div>

              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                <label className="text-sm text-text-secondary mb-2 block">Email</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-card border border-purple-900/30 text-white">
                    {hidePrivateInfo ? '••••••••••••••••' : user?.email}
                  </div>
                  <button onClick={() => openAction('email')} className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold">
                    Изменить
                  </button>
                </div>

                {/* Строчка "Поменять пароль" под почтой */}
                <div className="mt-4 pt-4 border-t border-purple-900/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-text-secondary" />
                    <span className="text-sm text-white">Пароль</span>
                    <span className="text-[10px] text-text-secondary bg-bg-card px-1.5 py-0.5 rounded border border-purple-900/20">
                      ••••••••
                    </span>
                  </div>
                  <button
                    onClick={() => openAction('password')}
                    className="text-sm text-accent-soft hover:text-accent font-medium transition-colors"
                  >
                    Поменять пароль
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">О себе</label>
                <textarea rows={3} defaultValue={profile?.bio || ''} className="w-full px-4 py-3 rounded-xl text-sm resize-none bg-bg-secondary border border-purple-900/30 text-white"
                  onBlur={async (e) => user && await supabase.from('users').upsert({ id: user.id, bio: e.target.value })} />
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <h3 className="text-base font-semibold text-white">Безопасность</h3>
              <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Пароль</p>
                  <p className="text-xs text-text-secondary mt-1">Обеспечьте защиту своего аккаунта</p>
                </div>
                <button onClick={() => openAction('password')} className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold">
                  Изменить пароль
                </button>
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <h3 className="text-base font-semibold text-white">Уведомления</h3>
              {['purchases', 'sales', 'messages', 'system', 'promo'].map(key => (
                <div key={key} className="flex items-center justify-between p-3 bg-bg-secondary border border-purple-900/20 rounded-xl">
                  <span className="text-sm text-white capitalize">{key}</span>
                  <button onClick={() => setNotifications({ ...notifications, [key]: !(notifications as any)[key] })}
                    className={`w-11 h-6 rounded-full transition-all relative ${ (notifications as any)[key] ? 'bg-accent' : 'bg-purple-900/30' }`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${ (notifications as any)[key] ? 'left-5' : 'left-0.5' }`} />
                  </button>
                </div>
              ))}
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {action && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => !actionLoading && setAction(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-bg-card border border-purple-900/30 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-white mb-4">
                {action === 'username' ? 'Изменить никнейм' : action === 'email' ? 'Изменить email' : 'Изменить пароль'}
              </h2>
              {action === 'password' && (
                <>
                  <input type={showPassword ? 'text' : 'password'} value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Новый пароль" className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-purple-900/30 text-white mb-3" />
                  <input type={showPassword ? 'text' : 'password'} value={newValue2} onChange={e => setNewValue2(e.target.value)} placeholder="Повторите пароль" className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-purple-900/30 text-white mb-3" />
                </>
              )}
              {action !== 'custom_id' && (
                <div className="relative mb-3">
                  <input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Текущий пароль" className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-purple-900/30 text-white" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              )}
              {actionMessage && <div className={`text-sm mb-3 p-2 rounded-lg ${actionMessage.type === 'ok' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>{actionMessage.text}</div>}
              <button onClick={handleConfirm} disabled={actionLoading} className="w-full py-3 bg-accent text-white rounded-xl font-semibold">{actionLoading ? 'Сохранение...' : 'Подтвердить'}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
