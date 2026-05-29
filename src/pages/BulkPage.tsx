import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Package,
  Zap,
  Info,
  FileText,
  Download,
  AlertTriangle,
  Globe,
  Gamepad2,
  Send,
  Target,
  Hexagon,
  Square,
  Crown,
  Box,
  Shield,
  Star,
  MessageCircle,
  Music,
  Camera,
  Brain,
  Atom,
  Lock,
  Sparkles,
  Joystick,
  Pickaxe,
} from 'lucide-react';
import { categories } from '../data/mockData';

const CAT_ICONS: Record<string, { Icon: React.ElementType; color: string; glow: string }> = {
  steam:     { Icon: Gamepad2,      color: 'text-blue-400',   glow: 'shadow-blue-500/25' },
  telegram:  { Icon: Send,          color: 'text-cyan-400',   glow: 'shadow-cyan-500/25' },
  epic:      { Icon: Joystick,      color: 'text-gray-200',   glow: 'shadow-white/10' },
  fortnite:  { Icon: Pickaxe,       color: 'text-blue-400',   glow: 'shadow-sky-500/25' },
  ea:        { Icon: Target,        color: 'text-red-500',    glow: 'shadow-red-500/25' },
  ubisoft:   { Icon: Hexagon,       color: 'text-blue-500',   glow: 'shadow-blue-500/25' },
  minecraft: { Icon: Square,        color: 'text-green-500',  glow: 'shadow-green-500/25' },
  supercell: { Icon: Crown,         color: 'text-yellow-400', glow: 'shadow-yellow-500/25' },
  roblox:    { Icon: Box,           color: 'text-red-400',    glow: 'shadow-red-400/25' },
  wot:       { Icon: Shield,        color: 'text-gray-400',   glow: 'shadow-gray-400/20' },
  wr:        { Icon: Zap,           color: 'text-yellow-300', glow: 'shadow-yellow-400/25' },
  rockstar:  { Icon: Star,          color: 'text-yellow-400', glow: 'shadow-yellow-500/25' },
  discord:   { Icon: MessageCircle, color: 'text-indigo-400', glow: 'shadow-indigo-500/25' },
  tiktok:    { Icon: Music,         color: 'text-pink-400',   glow: 'shadow-pink-500/25' },
  instagram: { Icon: Camera,        color: 'text-pink-500',   glow: 'shadow-pink-500/25' },
  ai:        { Icon: Brain,         color: 'text-purple-400', glow: 'shadow-purple-500/25' },
  neural:    { Icon: Atom,          color: 'text-purple-500', glow: 'shadow-purple-600/25' },
  vpn:       { Icon: Lock,          color: 'text-orange-400', glow: 'shadow-orange-500/25' },
  mihoyo:    { Icon: Sparkles,      color: 'text-cyan-300',   glow: 'shadow-cyan-400/25' },
};

const CategoryLogo: React.FC<{ id: string; size?: number; compact?: boolean }> = ({ id, size = 18, compact }) => {
  const item = CAT_ICONS[id] || { Icon: Package, color: 'text-purple-300', glow: 'shadow-purple-500/20' };
  const Icon = item.Icon;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-purple-900/20 border border-purple-700/25 shadow-[0_0_16px_var(--tw-shadow-color)] ${item.glow} ${compact ? 'w-7 h-7' : 'w-9 h-9'}`}
    >
      <Icon size={size} className={item.color} strokeWidth={1.9} />
    </span>
  );
};

const exampleRows = [
  { category: 'steam', login: 'login1@mail.ru', password: 'password123', mail: 'original@mail.ru', price: '1500' },
  { category: 'discord', login: 'user2#1234', password: 'pass456', mail: 'temp@mail.ru', price: '890' },
  { category: 'vpn', login: 'account3', password: 'pass789', mail: '—', price: '2100' },
];

const BulkPage: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<null | { success: number; failed: number; total: number }>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
      simulateProcessing();
    }
  };

  const simulateProcessing = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setResults({ success: 47, failed: 3, total: 50 });
    }, 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#171425] border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/25 via-transparent to-bg-primary pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center shadow-[0_0_22px_rgba(168,85,247,0.16)]">
            <Upload size={24} className="text-accent-soft" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Массовый залив аккаунтов</h1>
            <p className="text-text-secondary text-sm">Загрузите CSV или TXT файл с данными аккаунтов для массового добавления</p>
          </div>
        </div>
      </motion.div>

      {/* Category logos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Категории для залива</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025 }}
              whileHover={{ y: -2, scale: 1.04 }}
              className="group aspect-square rounded-xl bg-bg-primary border border-purple-900/20 hover:border-purple-700/50 flex flex-col items-center justify-center gap-1.5 transition-all"
              title={cat.name}
            >
              <CategoryLogo id={cat.id} />
              <span className="text-[10px] font-semibold text-text-secondary group-hover:text-white truncate w-full text-center px-1">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-text-secondary mt-3">
          💡 В CSV указывайте ID категории так же, как в первом столбце: steam, discord, vpn, telegram и т.д.
        </p>
      </motion.div>

      {/* Format info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Формат файла</h3>
        </div>

        <div className="bg-bg-primary rounded-xl p-4 text-xs text-text-secondary border border-purple-900/10 overflow-hidden">
          <p className="text-accent mb-3 font-mono"># Формат CSV: категория,логин,пароль,почта,цена</p>
          <div className="space-y-2">
            {exampleRows.map(row => (
              <div key={row.category} className="grid grid-cols-[auto_74px_1fr_auto] sm:grid-cols-[auto_90px_1fr_1fr_auto] gap-2 items-center font-mono bg-purple-900/10 border border-purple-900/10 rounded-lg px-2.5 py-2">
                <CategoryLogo id={row.category} size={14} compact />
                <span className="text-accent-soft font-semibold">{row.category}</span>
                <span className="truncate">{row.login}</span>
                <span className="hidden sm:block truncate">{row.mail}</span>
                <span className="text-white font-semibold">{row.price}₽</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <Download size={13} />
            Скачать шаблон CSV
          </motion.button>
          <span className="text-text-secondary">•</span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <FileText size={13} />
            Инструкция
          </motion.button>
        </div>
      </motion.div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          isDragging
            ? 'border-accent bg-purple-900/20 shadow-[0_0_30px_rgba(168,85,247,0.18)]'
            : 'border-purple-900/30 hover:border-purple-700/50'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-bg-primary/20 pointer-events-none" />
        <div className="relative z-10">
          {uploadedFile ? (
            <div>
              <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-700/25 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-accent" />
              </div>
              <p className="text-text-primary font-semibold mb-1">{uploadedFile}</p>
              {isProcessing ? (
                <div className="mt-4">
                  <div className="h-2 bg-purple-900/30 rounded-full overflow-hidden w-64 mx-auto">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: 'linear' }}
                      className="progress-bar h-full"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-2">Обрабатываем аккаунты по категориям...</p>
                </div>
              ) : results ? (
                <div className="mt-4 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  <div className="text-center p-2 bg-purple-900/20 rounded-xl">
                    <p className="text-lg font-bold text-text-primary">{results.total}</p>
                    <p className="text-xs text-text-secondary">Всего</p>
                  </div>
                  <div className="text-center p-2 bg-green-900/20 rounded-xl">
                    <p className="text-lg font-bold text-success">{results.success}</p>
                    <p className="text-xs text-text-secondary">Успешно</p>
                  </div>
                  <div className="text-center p-2 bg-red-900/20 rounded-xl">
                    <p className="text-lg font-bold text-error">{results.failed}</p>
                    <p className="text-xs text-text-secondary">Ошибок</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                {['steam', 'telegram', 'discord', 'vpn', 'mihoyo'].map((id, i) => (
                  <motion.div
                    key={id}
                    animate={{ y: isDragging ? [-2, 2, -2] : [0, -4, 0] }}
                    transition={{ duration: 2 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <CategoryLogo id={id} />
                  </motion.div>
                ))}
              </div>
              <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-700/25 flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className={isDragging ? 'text-accent' : 'text-text-secondary'} />
              </div>
              <p className="text-text-primary font-semibold mb-2">
                {isDragging ? 'Отпустите файл' : 'Перетащите файл сюда'}
              </p>
              <p className="text-text-secondary text-sm mb-4">или нажмите для выбора файла</p>
              <motion.label
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              >
                <Upload size={16} />
                Выбрать файл
                <input type="file" accept=".csv,.txt" className="hidden" onChange={e => {
                  if (e.target.files?.[0]) {
                    setUploadedFile(e.target.files[0].name);
                    simulateProcessing();
                  }
                }} />
              </motion.label>
              <p className="text-xs text-text-secondary mt-3">Поддерживаемые форматы: CSV, TXT • Максимум 10,000 аккаунтов</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4">Настройки массовой загрузки</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Автоматическая публикация', desc: 'Публиковать после проверки', default: true },
            { label: 'AI проверка риска', desc: 'Оценить каждый аккаунт', default: true },
            { label: 'Автоматическая гарантия', desc: 'Добавить 24ч гарантию', default: false },
            { label: 'Escrow по умолчанию', desc: 'Включить для всех', default: true },
          ].map((setting) => (
            <ToggleItem key={setting.label} {...setting} defaultVal={setting.default} />
          ))}
        </div>
      </motion.div>

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-3 p-4 bg-yellow-900/10 border border-yellow-800/20 rounded-xl"
      >
        <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-200/70">
          Убедитесь, что все аккаунты соответствуют правилам сервиса. Аккаунты с нарушениями будут автоматически отклонены AI системой проверки.
        </p>
      </motion.div>

      {/* Submit */}
      {uploadedFile && results && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
          >
            <Zap size={18} />
            Опубликовать {results.success} аккаунтов
          </motion.button>
          <motion.button
            onClick={() => { setUploadedFile(null); setResults(null); }}
            whileHover={{ scale: 1.02 }}
            className="px-5 py-3 rounded-xl border border-purple-900/20 text-text-secondary hover:text-text-primary transition-all"
          >
            Сбросить
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

const ToggleItem: React.FC<{ label: string; desc: string; defaultVal: boolean }> = ({ label, desc, defaultVal }) => {
  const [val, setVal] = useState(defaultVal);
  return (
    <div className="flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-purple-900/10">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      <div
        onClick={() => setVal(!val)}
        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative flex-shrink-0 ml-3 ${val ? 'bg-accent' : 'bg-purple-900/40'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-5' : 'left-0.5'}`} />
      </div>
    </div>
  );
};

export default BulkPage;
