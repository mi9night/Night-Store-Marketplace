import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Moon } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!isLogin && password !== repeatPassword) {
      alert('Пароли не совпадают');
      return;
    }

    setLoading(true);

    if (isLogin) {
      await supabase.auth.signInWithPassword({
        email,
        password
      });
    } else {
      await supabase.auth.signUp({
        email,
        password
      });
      alert('Подтвердите email для входа.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">

      {/* Glow background */}
      <div className="absolute w-[600px] h-[600px] bg-purple-700/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[600px] h-[600px] bg-accent/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md bg-bg-card border border-purple-900/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center">
              <Moon size={24} className="text-white" fill="white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
          </h2>

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

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAuth}
            disabled={loading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-accent rounded-xl text-white font-semibold shadow-lg shadow-accent/20 transition-all"
          >
            {loading
              ? 'Загрузка...'
              : isLogin
              ? 'Войти'
              : 'Зарегистрироваться'}
          </motion.button>

          <p
            className="text-sm text-text-secondary text-center mt-6 cursor-pointer hover:text-white transition-colors"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? 'Нет аккаунта? Регистрация'
              : 'Уже есть аккаунт? Вход'}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ================= INPUT COMPONENT ================= */

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
    className="w-full mb-3 p-3 rounded-xl bg-purple-900/10 border border-purple-900/30 text-white outline-none focus:border-accent focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
  />
);

export default AuthPage;