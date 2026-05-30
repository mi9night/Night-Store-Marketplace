import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const EmailConfirmedPage = () => {

  useEffect(() => {
    // 🎉 Confetti
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });

    // ⏳ Авто редирект через 3 секунды
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">

      <div className="absolute w-[600px] h-[600px] bg-purple-700/20 blur-3xl rounded-full top-[-200px] left-[-200px]" />
      <div className="absolute w-[600px] h-[600px] bg-accent/20 blur-3xl rounded-full bottom-[-200px] right-[-200px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-bg-card border border-purple-900/30 rounded-3xl p-10 text-center shadow-[0_0_60px_rgba(168,85,247,0.2)]"
      >
        <CheckCircle size={64} className="text-accent mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-white mb-3">
          Почта подтверждена 🎉
        </h2>

        <p className="text-text-secondary mb-6">
          Сейчас вы будете перенаправлены на страницу входа.
        </p>

        <div className="text-xs text-purple-400">
          Переход через 3 секунды...
        </div>
      </motion.div>
    </div>
  );
};

export default EmailConfirmedPage;