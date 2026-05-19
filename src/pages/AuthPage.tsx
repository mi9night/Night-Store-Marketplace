import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Moon } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

const AuthPage: React.FC = () => {

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockTimer, setLockTimer] = useState<number | null>(null);

  /* ================= LOCK TIMER ================= */

  useEffect(() => {
    if (!lockTimer) return;

    const interval = setInterval(() => {
      setLockTimer(prev => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockTimer]);

  /* ================= LOGIN ================= */

  const handleLogin = async () => {

    setLoading(true);
    setError('');

    // Проверяем профиль по email
    const { data: authData } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authData.error) {

      // Ищем пользователя вручную
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('id',
          authData.data?.user?.id
        )
        .single();

      // Если профиль не найден — просто ошибка
      if (!users) {
        setError('Неверный email или пароль');
        triggerShake();
        setLoading(false);
        return;
      }

      // Проверка блокировки
      if (users.lock_until && new Date(users.lock_until) > new Date()) {

        const secondsLeft =
          Math.floor(
            (new Date(users.lock_until).getTime() - Date.now()) / 1000
          );

        setLockTimer(secondsLeft);
        setError('Аккаунт временно заблокирован');
        triggerShake();
        setLoading(false);
        return;
      }

      const attempts = (users.failed_login_attempts || 0) + 1;
      const remaining = MAX_ATTEMPTS - attempts;

      if (attempts >= MAX_ATTEMPTS) {

        const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60000);

        await supabase
          .from('users')
          .update({
            failed_login_attempts: 0,
            lock_until: lockUntil
          })
          .eq('id', users.id);

        setLockTimer(LOCK_TIME_MINUTES * 60);
        setError(`Слишком много попыток. Блокировка ${LOCK_TIME_MINUTES} минут.`);
      } else {

        await supabase
          .from('users')
          .update({
            failed_login_attempts: attempts
          })
          .eq('id', users.id);

        setAttemptsLeft(remaining);
        setError(`Неверный пароль. Осталось ${remaining} попытки.`);
      }

      triggerShake();
      setLoading(false);
      return;
    }

    // Успешный вход — сбрасываем попытки
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        lock_until: null
      })
      .eq('id', authData.data.user?.id);

    setLoading(false);
  };

  /* ================= REGISTER ================= */

  const handleRegister = async () => {

    if (password !== repeatPassword) {
      setError('Пароли не совпадают');
      triggerShake();
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setError(error.message);
      triggerShake();
    } else {
      setError('Письмо подтверждения отправлено ✅');
    }

    setLoading(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">

      <div className="absolute w-[600px] h-[600px] bg-purple-700/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[600px] h-[600px] bg-accent/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-bg-card border border-purple-900/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
            <Moon size={24} className="text-white" fill="white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLogin ? 'Вход' : 'Регистрация'}
        </h2>

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
          <p className="text-error text-sm mt-2 text-center">
            {error}
          </p>
        )}

        {lockTimer && (
          <p className="text-accent text-sm mt-2 text-center">
            Повтор через {formatTime(lockTimer)}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={isLogin ? handleLogin : handleRegister}
          disabled={loading || !!lockTimer}
          className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold"
        >
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Создать аккаунт'}
        </motion.button>

        <p
          className="text-sm text-text-secondary text-center mt-6 cursor-pointer hover:text-white"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setAttemptsLeft(null);
          }}
        >
          {isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
        </p>

      </motion.div>
    </div>
  );
};

/* ================= INPUT ================= */

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
  type = 'text'
}) => (
  <motion.input
    whileFocus={{ scale: 1.02 }}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full mb-3 p-3 rounded-xl bg-purple-900/10 border border-purple-900/30 text-white outline-none focus:border-accent focus:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
  />
);

export default AuthPage;