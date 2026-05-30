import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { MailCheck, Moon, Send } from 'lucide-react';
import { STARTUP_NOTICE_EVENT, STARTUP_NOTICE_TRIGGER_KEY } from '../components/StartupNotice';

const EMAIL_CONFIRMED_REDIRECT = `${window.location.origin}/email-confirmed`;

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showConfirmNotice, setShowConfirmNotice] = useState(false);

  const translateAuthError = (message?: string) => {
    const m = (message || '').toLowerCase();
    if (m.includes('email not confirmed')) return 'Подтвердите почту: мы отправили письмо со ссылкой подтверждения.';
    if (m.includes('invalid login credentials')) return 'Неверный email или пароль';
    if (m.includes('user already registered') || m.includes('already registered')) return 'Этот email уже зарегистрирован';
    return message || 'Ошибка авторизации';
  };

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const confirmed = !!(data.user?.email_confirmed_at || (data.user as any)?.confirmed_at);
        if (!confirmed) {
          await supabase.auth.signOut();
          setRegisteredEmail(email);
          setShowConfirmNotice(true);
          setError('Подтвердите почту перед входом в аккаунт');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: EMAIL_CONFIRMED_REDIRECT,
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        // Если в Supabase выключено обязательное подтверждение и сессия создалась сразу,
        // всё равно не пускаем дальше без подтверждённой почты.
        if (data.session && data.user && !(data.user.email_confirmed_at || (data.user as any).confirmed_at)) {
          await supabase.auth.signOut();
        }

        localStorage.setItem(STARTUP_NOTICE_TRIGGER_KEY, '1');
        sessionStorage.setItem(STARTUP_NOTICE_TRIGGER_KEY, '1');
        window.dispatchEvent(new Event(STARTUP_NOTICE_EVENT));

        setRegisteredEmail(email);
        setShowConfirmNotice(true);
        setError('Письмо подтверждения отправлено ✅');
      }
    } catch (err: any) {
      setError(translateAuthError(err.message));
      if ((err.message || '').toLowerCase().includes('email not confirmed')) {
        setRegisteredEmail(email);
        setShowConfirmNotice(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    const targetEmail = registeredEmail || email;
    if (!targetEmail) {
      setError('Введите email, чтобы отправить письмо повторно');
      return;
    }

    setResending(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: EMAIL_CONFIRMED_REDIRECT,
        },
      });

      if (error) throw error;
      setError('Письмо подтверждения отправлено повторно ✅');
      setShowConfirmNotice(true);
    } catch (err: any) {
      setError(translateAuthError(err.message));
    } finally {
      setResending(false);
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
                  setShowConfirmNotice(false);
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

        {showConfirmNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-green-700/30 bg-green-900/10 p-4"
          >
            <div className="flex items-start gap-3">
              <MailCheck size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Подтвердите почту</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Мы отправили письмо на <span className="text-green-400 font-mono">{registeredEmail || email}</span>. Перейдите по ссылке в письме, после подтверждения вы сможете войти на сайт.
                </p>
                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={resending}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-purple-300 text-xs font-semibold disabled:opacity-50"
                >
                  <Send size={12} /> {resending ? 'Отправляем...' : 'Отправить письмо ещё раз'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
              setShowConfirmNotice(false);
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
