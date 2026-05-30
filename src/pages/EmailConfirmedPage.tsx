import { motion } from 'framer-motion';
import { CheckCircle, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

const EmailConfirmedPage = () => {
  const [message, setMessage] = useState('Проверяем подтверждение...');

  useEffect(() => {
    const run = async () => {
      // Supabase сам подхватывает токены из URL/hash, но getSession помогает дождаться обработки.
      await supabase.auth.getSession();
      setMessage('Почта подтверждена. Теперь вы можете войти в аккаунт.');

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });

      const timer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 3000);

      return () => clearTimeout(timer);
    };

    run();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden p-4">
      <div className="absolute w-[600px] h-[600px] bg-purple-700/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[600px] h-[600px] bg-accent/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-bg-card border border-purple-900/30 rounded-3xl p-10 text-center shadow-[0_0_60px_rgba(168,85,247,0.2)] max-w-md w-full"
      >
        <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-white mb-3">
          Почта подтверждена 🎉
        </h2>

        <p className="text-text-secondary mb-6">
          {message}
        </p>

        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm"
        >
          <LogIn size={16} /> Перейти ко входу
        </button>

        <div className="text-xs text-purple-400 mt-4">
          Автоматический переход через 3 секунды...
        </div>
      </motion.div>
    </div>
  );
};

export default EmailConfirmedPage;
