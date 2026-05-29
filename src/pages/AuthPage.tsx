import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Moon } from 'lucide-react';
import { STARTUP_NOTICE_EVENT, STARTUP_NOTICE_TRIGGER_KEY } from '../components/StartupNotice';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    try {
      setError('');

      if (!email || !password) {
        setError('Заполните все поля');
        return;
      }

      if (!isLogin) {
        if (!username) {
          setError('Введите логин');
          return;
        }

        if (password !== repeatPassword) {
          setError('Пароли не совпадают');
          return;
        }
      }

      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        localStorage.setItem(STARTUP_NOTICE_TRIGGER_KEY, '1');
        sessionStorage.setItem(STARTUP_NOTICE_TRIGGER_KEY, '1');
        window.dispatchEvent(new Event(STARTUP_NOTICE_EVENT));

        setError('Письмо подтверждения отправлено ✅');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden p-4">
      <div className="absolute w-[600px] h-[600px] bg-purple-700/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[600px] h-[600px] bg-accent/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-bg-card border border-purple-900/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.22)]">
            <Moon size={24} className="text-white" fill="white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 rounded-2xl bg-bg-primary border border-purple-900/20 p-1">
          {[
            { id: 'login', label: 'Вход' },
            { id: 'register', label: 'Регистрация' },
          ].map(item => {
            const active = item.id === 'login' ? isLogin : !isLogin;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsLogin(item.id === 'login');
                  setError('');
                }}
                className={`relative rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  active ? 'text-white' : 'text-text-secondary hover:text-white'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                  color: 'var(--accent-contrast, #fff)',
                  boxShadow: '0 0 18px rgba(var(--accent-rgb), 0.22)',
                } : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLogin ? 'Вход' : 'Регистрация'}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleAuth();
          }}
        >
          {!isLogin && (
            <Input
              placeholder="Логин"
              value={username}
              onChange={setUsername}
            />
          )}

          <Input
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
          />

          <Input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={setPassword}
          />

          {!isLogin && (
            <Input
              placeholder="Повтор пароля"
              type="password"
              value={repeatPassword}
              onChange={setRepeatPassword}
            />
          )}

          {error && (
            <p className={`text-sm text-center mt-2 ${error.includes('✅') ? 'text-green-400' : 'text-error'}`}>
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-semibold disabled:opacity-70 transition-all border"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              color: 'var(--accent-contrast, #fff)',
              borderColor: 'var(--accent-solid-border, rgba(255,255,255,.12))',
              boxShadow: '0 0 24px rgba(var(--accent-rgb), 0.25)',
            }}
          >
            {loading
              ? 'Загрузка...'
              : isLogin
                ? 'Войти'
                : 'Создать аккаунт'}
          </motion.button>
        </form>

        <div className="text-sm text-text-secondary text-center mt-6">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            type="button"
            className="font-semibold text-accent-soft hover:text-accent transition-colors underline underline-offset-4"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Регистрация' : 'Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface InputProps {
  placeholder: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
}) => (
  <motion.input
    whileFocus={{ scale: 1.02 }}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full mb-3 p-3 rounded-xl bg-bg-secondary border border-purple-900/30 text-white outline-none focus:border-accent transition-all"
    style={{ boxShadow: '0 0 0 0 rgba(var(--accent-rgb), 0)' }}
  />
);

export default AuthPage;
