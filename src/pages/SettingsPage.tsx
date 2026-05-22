import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Bell, Palette, Key, CreditCard,
  Eye, EyeOff, Save, X, Clock, Check, AlertCircle, Camera, Image, Lock, User, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModerationPanel from '../components/ModerationPanel';

type ActionType = 'username' | 'email' | 'password' | null;

interface SettingsPageProps {
  onNavigate?: (page: any, payload?: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [hidePrivateInfo, setHidePrivateInfo] = useState(() => localStorage.getItem('hidePrivateInfo') === 'true');

  useEffect(() => {
    localStorage.setItem('hidePrivateInfo', hidePrivateInfo.toString());
  }, [hidePrivateInfo]);

  const [action, setAction] = useState<ActionType>(null);
  const [newValue, setNewValue] = useState('');
  const [newValue2, setNewValue2] = useState(''); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: p } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
        setProfile(p);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isMod = ['moderator', 'admin', 'owner'].includes(profile?.role || '');

  const sections = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'payments', label: 'Оплата', icon: CreditCard },
    { id: 'api', label: 'API', icon: Key },
    ...(isMod ? [{ id: 'moderation', label: 'Модерация', icon: Shield }] : []),
  ];

  const handleConfirm = async () => {
    if (!user || !currentPassword) {
      setActionMessage({ type: 'err', text: 'Введите текущий пароль' });
      return;
    }
    setActionLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInError) throw new Error('Неверный текущий пароль');

      if (action === 'username') {
         await supabase.from('users').update({ username: newValue }).eq('id', user.id);
         setProfile({ ...profile, username: newValue });
      } else if (action === 'email') {
         await supabase.auth.updateUser({ email: newValue });
      } else if (action === 'password') {
         if (newValue !== newValue2) throw new Error('Пароли не совпадают');
         await supabase.auth.updateUser({ password: newValue });
      }

      setActionMessage({ type: 'ok', text: '✅ Успешно обновлено' });
      setTimeout(() => setAction(null), 1500);
    } catch (e: any) {
      setActionMessage({ type: 'err', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center p-20 text-text-secondary">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-accent" size={24} />
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === s.id ? 'bg-purple-600/10 text-accent-soft border border-purple-600/20' : 'text-text-secondary hover:text-white hover:bg-purple-900/10'
              }`}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-bg-card border border-purple-900/20 rounded-3xl p-6">
          {activeSection === 'profile' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="font-bold text-white text-lg">Данные профиля</h3>
                 <button onClick={() => setHidePrivateInfo(!hidePrivateInfo)} className="flex items-center gap-2 text-xs text-accent-soft">
                   {hidePrivateInfo ? <EyeOff size={14}/> : <Eye size={14}/>} {hidePrivateInfo ? 'Приватность включена' : 'Скрыть данные'}
                 </button>
               </div>
               
               <div className="bg-bg-secondary p-4 rounded-2xl border border-purple-900/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center relative overflow-hidden">
                       {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={32} className="text-white"/>}
                       <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera size={18} className="text-white"/></button>
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">{profile?.username || 'Пользователь'}</p>
                       <p className="text-xs text-text-secondary">На Night Store с {new Date(profile?.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Никнейм</label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-bg-card p-3 rounded-xl border border-purple-900/20 text-sm text-white">{profile?.username}</div>
                        <button onClick={() => {setAction('username'); setNewValue(profile?.username || '');}} className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors">Изм.</button>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1.5 opacity-60">💡 Никнейм можно менять раз в 7 дней</p>
                    </div>
                  </div>
               </div>

               <div>
                <label className="text-sm text-text-secondary mb-1.5 block">О себе</label>
                <textarea
                  rows={3}
                  defaultValue={profile?.bio || ''}
                  placeholder="Расскажите о себе..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none bg-bg-secondary border border-purple-900/30 text-white"
                  onBlur={async (e) => {
                    if (user) {
                      await supabase.from('users').update({ bio: e.target.value }).eq('id', user.id);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h3 className="font-bold text-white text-lg">Безопасность</h3>
              
              <div className="bg-bg-secondary p-4 rounded-2xl border border-purple-900/10 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-text-secondary">
                    <Mail size={14} />
                    <label className="text-xs font-semibold uppercase tracking-wider">Электронная почта</label>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-bg-card p-3 rounded-xl border border-purple-900/20 text-sm text-white font-medium">
                      {hidePrivateInfo ? '••••••••••••••••' : user?.email}
                    </div>
                    <button onClick={() => {setAction('email'); setNewValue(user?.email || '');}} className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors">Изм.</button>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-900/5">
                  <div className="flex items-center gap-2 mb-2 text-text-secondary">
                    <Lock size={14} />
                    <label className="text-xs font-semibold uppercase tracking-wider">Пароль</label>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white bg-bg-card p-3 rounded-xl border border-purple-900/20">
                    <span className="font-mono tracking-widest opacity-50">••••••••</span>
                    <button onClick={() => setAction('password')} className="text-accent-soft hover:text-accent font-bold transition-colors text-xs">Сменить пароль</button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-900/10 border border-purple-700/20 rounded-2xl p-4 flex items-start gap-3">
                <Shield size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Двухфакторная аутентификация</p>
                  <p className="text-xs text-text-secondary mt-1">Дополнительный уровень защиты для вашего аккаунта. (В разработке)</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'moderation' && <ModerationPanel onNavigate={onNavigate} />}
          
          {['notifications', 'appearance', 'payments', 'api'].includes(activeSection) && (
            <div className="py-20 text-center space-y-3">
               <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto"><Clock size={32} className="text-purple-400"/></div>
               <p className="text-text-secondary text-sm">Раздел «{sections.find(s=>s.id===activeSection)?.label}» в разработке</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {action && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-bg-card border border-purple-900/30 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">{action === 'username' ? 'Смена ника' : action === 'email' ? 'Смена Email' : 'Смена пароля'}</h2>
                <button onClick={() => setAction(null)} className="text-text-secondary hover:text-white"><X size={20}/></button>
              </div>

              <div className="space-y-3">
                <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Новое значение" className="w-full bg-bg-secondary border border-purple-900/20 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-600 transition-colors" />
                {action === 'password' && <input type="password" value={newValue2} onChange={e => setNewValue2(e.target.value)} placeholder="Повторите пароль" className="w-full bg-bg-secondary border border-purple-900/20 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-600 transition-colors" />}
                
                <div className="relative pt-2">
                  <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Текущий пароль для подтверждения</label>
                  <input type={showPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Введите пароль..." className="w-full bg-bg-secondary border border-purple-900/20 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-600 transition-colors pr-10" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 bottom-3 text-text-secondary hover:text-white">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>

                {actionMessage && <div className={`text-xs p-3 rounded-xl flex items-center gap-2 ${actionMessage.type==='ok'?'bg-green-900/20 text-green-400 border border-green-900/30':'bg-red-900/20 text-red-400 border border-red-900/30'}`}>
                  {actionMessage.type === 'ok' ? <Check size={14}/> : <AlertCircle size={14}/>}
                  {actionMessage.text}
                </div>}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setAction(null)} className="flex-1 py-3 bg-purple-900/20 hover:bg-purple-900/30 text-white rounded-xl font-bold transition-all">Отмена</button>
                  <button onClick={handleConfirm} disabled={actionLoading} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all">
                    {actionLoading ? 'Обновление...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
