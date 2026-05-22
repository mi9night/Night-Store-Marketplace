import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Shield, Bell, Palette, Key, CreditCard, 
  User, Eye, EyeOff, Save, Lock, Mail, Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModerationPanel from '../components/ModerationPanel';

const SettingsPage: React.FC<{ onNavigate?: (p: any) => void }> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hidePrivate, setHidePrivate] = useState(() => localStorage.getItem('hidePrivateInfo') === 'true');

  useEffect(() => {
    localStorage.setItem('hidePrivateInfo', hidePrivate.toString());
  }, [hidePrivate]);

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

  const sections = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    ...(profile?.role === 'admin' || profile?.role === 'moderator' ? [{ id: 'moderation', label: 'Модерация', icon: Shield }] : []),
  ];

  if (loading) return <div className="p-10 text-center text-text-secondary">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

        <div className="lg:col-span-3 bg-bg-card border border-purple-900/20 rounded-3xl p-6 space-y-6">
          {activeSection === 'profile' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">Данные профиля</h3>
                <button onClick={() => setHidePrivate(!hidePrivate)} className="text-xs text-accent-soft flex items-center gap-2">
                  {hidePrivate ? <EyeOff size={14}/> : <Eye size={14}/>} {hidePrivate ? 'Приватность ВКЛ' : 'Скрыть данные'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-2xl border border-purple-900/10">
                   <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center relative overflow-hidden">
                     {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={30} className="text-white"/>}
                     <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera size={18} className="text-white"/></button>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">{profile?.username || 'Пользователь'}</p>
                     <p className="text-xs text-text-secondary">{hidePrivate ? '••••••••' : user?.email}</p>
                   </div>
                </div>

                <div className="bg-bg-secondary p-4 rounded-2xl border border-purple-900/10 space-y-4">
                   <div>
                     <label className="text-xs text-text-secondary block mb-1">Email</label>
                     <div className="flex items-center justify-between text-sm text-white bg-bg-card p-3 rounded-xl border border-purple-900/20">
                       <span>{hidePrivate ? '••••••••' : user?.email}</span>
                       <button className="text-accent-soft font-bold">Изменить</button>
                     </div>
                   </div>
                   <div>
                     <label className="text-xs text-text-secondary block mb-1">Пароль</label>
                     <div className="flex items-center justify-between text-sm text-white bg-bg-card p-3 rounded-xl border border-purple-900/20">
                       <span>••••••••</span>
                       <button className="text-accent-soft font-bold">Сменить пароль</button>
                     </div>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'moderation' && <ModerationPanel onNavigate={onNavigate} />}
          
          {activeSection !== 'profile' && activeSection !== 'moderation' && (
            <div className="py-10 text-center text-text-secondary">Скоро будет доступно...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
