import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Shield,
  Save,
  Smartphone,
  LogOut,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SettingsPage: React.FC = () => {

  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  /* ================= LOAD USER ================= */

  useEffect(() => {
    const loadData = async () => {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email ?? null);

      // Загружаем 2FA
      const { data } = await supabase
        .from('users')
        .select('two_factor_enabled')
        .eq('id', user.id)
        .single();

      if (data) {
        setTwoFactor(data.two_factor_enabled);
      }

      // Загружаем активные сессии
      const { data: sessionData } = await supabase.rpc('get_user_sessions');
      if (sessionData) {
        setSessions(sessionData);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  /* ================= TOGGLE 2FA ================= */

  const toggleTwoFactor = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    await supabase
      .from('users')
      .update({ two_factor_enabled: !twoFactor })
      .eq('id', user.id);

    setTwoFactor(!twoFactor);
    setSaving(false);
  };

  /* ================= CHANGE PASSWORD ================= */

  const changePassword = async () => {
    const newPassword = prompt('Введите новый пароль');
    if (!newPassword) return;

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (!error) {
      alert('Пароль успешно изменён ✅');
    } else {
      alert(error.message);
    }
  };

  /* ================= TERMINATE SESSION ================= */

  const terminateSession = async (sessionId: string) => {
    await supabase.auth.admin?.signOut(sessionId);
    alert('Сессия завершена');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Загрузка настроек...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Settings size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">
          Настройки
        </h1>
      </motion.div>

      <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-8">

        {/* EMAIL */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-2">
            Аккаунт
          </h3>
          <div className="p-4 bg-bg-primary rounded-xl border border-purple-900/20">
            <p className="text-sm text-text-secondary mb-1">
              Email
            </p>
            <p className="text-text-primary font-medium">
              {userEmail}
            </p>
          </div>
        </div>

        {/* 2FA */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Smartphone size={16} className="text-accent" />
            Двухэтапная авторизация
          </h3>

          <div className="flex items-center justify-between p-4 bg-bg-primary rounded-xl border border-purple-900/20">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Подтверждение входа по email
              </p>
              <p className="text-xs text-text-secondary">
                После ввода пароля потребуется код из письма
              </p>
            </div>

            <motion.div
              whileTap={{ scale: 0.9 }}
              onClick={toggleTwoFactor}
              className={`w-12 h-6 rounded-full cursor-pointer relative transition-all ${
                twoFactor ? 'bg-accent' : 'bg-purple-900/40'
              }`}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                style={{
                  left: twoFactor ? '26px' : '4px'
                }}
              />
            </motion.div>
          </div>

          {twoFactor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-accent"
            >
              ✅ Двухэтапная защита включена
            </motion.div>
          )}
        </div>

        {/* CHANGE PASSWORD */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Key size={16} className="text-accent" />
            Пароль
          </h3>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={changePassword}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold"
          >
            Сменить пароль
          </motion.button>
        </div>

        {/* ACTIVE SESSIONS */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3">
            Активные сессии
          </h3>

          {sessions.length === 0 && (
            <p className="text-text-secondary text-sm">
              Нет активных сессий
            </p>
          )}

          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-bg-primary rounded-xl border border-purple-900/20 flex justify-between items-center mb-3"
            >
              <div>
                <p className="text-sm text-text-primary">
                  IP: {session.ip}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(session.created_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => terminateSession(session.id)}
                className="text-error text-sm hover:text-red-400 flex items-center gap-1"
              >
                <LogOut size={14} />
                Завершить
              </button>
            </div>
          ))}
        </div>

        {/* SAVE */}
        <div className="border-t border-purple-900/20 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Save size={16} />
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </motion.button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;