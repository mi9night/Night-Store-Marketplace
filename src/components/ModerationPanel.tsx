import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Package, Receipt, Ticket, BarChart3,
  Search, Ban, CheckCircle2, Trash2, Edit3, ArrowRight, X,
  Crown, Settings as SettingsIcon, Megaphone, Send,
  Image, Paperclip, ChevronLeft, ChevronRight, FileText, ZoomIn,
  ScanSearch, RefreshCw, AlertTriangle, Star, Moon, Flame, Rocket, Target, Trophy, Gamepad2, Music, Palette, Skull, Sparkles, Gift, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge as RB } from './RoleBadge';
import { UserLink } from './UserLink';

type Section = 'tickets' | 'users' | 'operations' | 'products' | 'stats' | 'broadcast' | 'validation';

interface Props {
  onNavigate?: (page: 'forum' | 'product' | 'profile' | 'topic', payload?: any) => void;
}

const MOD_ICON_OPTIONS = [
  { id: 'star', Icon: Star, label: 'Звезда' },
  { id: 'moon', Icon: Moon, label: 'Луна' },
  { id: 'flame', Icon: Flame, label: 'Огонь' },
  { id: 'diamond', Icon: Sparkles, label: 'Бриллиант' },
  { id: 'crown', Icon: Crown, label: 'Корона' },
  { id: 'shield', Icon: Shield, label: 'Щит' },
  { id: 'zap', Icon: Zap, label: 'Молния' },
  { id: 'rocket', Icon: Rocket, label: 'Ракета' },
  { id: 'target', Icon: Target, label: 'Цель' },
  { id: 'trophy', Icon: Trophy, label: 'Кубок' },
  { id: 'gamepad', Icon: Gamepad2, label: 'Gamepad' },
  { id: 'award', Icon: CheckCircle2, label: 'Награда' },
  { id: 'palette', Icon: Palette, label: 'Палитра' },
  { id: 'music', Icon: Music, label: 'Музыка' },
  { id: 'skull', Icon: Skull, label: 'Череп' },
  { id: 'sparkles', Icon: Sparkles, label: 'Искры' },
];

const LIVE_ICON_OPTIONS = [
  { id: 'megaphone', Icon: Megaphone, label: 'Анонс' },
  { id: 'alert', Icon: AlertTriangle, label: 'Важно' },
  { id: 'party', Icon: Sparkles, label: 'Праздник' },
  { id: 'gift', Icon: Gift, label: 'Подарок' },
  { id: 'flame', Icon: Flame, label: 'Огонь' },
  { id: 'diamond', Icon: Sparkles, label: 'Ценность' },
  { id: 'rocket', Icon: Rocket, label: 'Запуск' },
  { id: 'star', Icon: Star, label: 'Звезда' },
  { id: 'moon', Icon: Moon, label: 'Night' },
  { id: 'send', Icon: Send, label: 'Сообщение' },
];

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1024 / 1024).toFixed(2)} МБ`;

const isImageFile = (name: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\s|\(|$)/i.test(name);

const parseAttachedLines = (desc: string) => {
  const lines = desc.split('\n');
  const idx = lines.findIndex(l => l.startsWith('Прикреплённые файлы:'));
  if (idx === -1) return [];
  return lines.slice(idx + 1).filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
};

// Извлекает имя файла и размер из строки типа "photo.png (4.16 МБ)"
const parseFileName = (line: string): { name: string; size: string } => {
  const match = line.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) return { name: match[1].trim(), size: match[2].trim() };
  return { name: line, size: '' };
};

/* ─── Image Viewer ─────────────────────────────────────────────────────── */
const ImageViewer: React.FC<{
  images: { src: string; name: string }[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[300] flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-all"
        onClick={onClose}
      >
        <X size={20} />
      </motion.button>

      {/* Counter */}
      {images.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full"
        >
          {idx + 1} / {images.length}
        </motion.div>
      )}

      {/* Image */}
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-purple-500 border-t-white rounded-full"
            />
          </div>
        )}
        <img
          src={images[idx].src}
          alt={images[idx].name}
          onLoad={() => setLoaded(true)}
          className={`max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>

      {/* Filename */}
      {loaded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-white/40 max-w-xs truncate text-center"
        >
          {images[idx].name}
        </motion.p>
      )}

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ChevronRight size={24} />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-4 flex gap-2 flex-wrap justify-center max-w-sm" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setLoaded(false); setIdx(i); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-purple-500 scale-110' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

/* ─── File Badge — кликабельный для картинок ───────────────────────────── */
const FileBadge: React.FC<{
  line: string;
  index: number;
  allImages: { src: string; name: string }[];
  imageIndex: number;
  onOpenImage: (allImages: { src: string; name: string }[], startIdx: number) => void;
  fileObjects?: Map<string, string>; // name -> objectURL
}> = ({ line, index, allImages, imageIndex, onOpenImage, fileObjects }) => {
  const { name, size } = parseFileName(line);
  const isImg = isImageFile(name);
  const objUrl = fileObjects?.get(name);

  if (isImg && objUrl) {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onOpenImage(allImages, imageIndex)}
        className="group relative overflow-hidden rounded-xl border border-purple-700/30 hover:border-purple-500/60 transition-all shadow-[0_0_8px_rgba(139,92,246,0.1)] hover:shadow-[0_0_16px_rgba(139,92,246,0.25)]"
      >
        <img
          src={objUrl}
          alt={name}
          className="w-28 h-20 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
        </div>
        {size && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white/70 px-1.5 py-0.5 text-center truncate">
            {size}
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2.5 py-1.5 text-xs text-purple-300">
      {isImg ? <Image size={12} /> : <FileText size={12} />}
      <span className="max-w-[160px] truncate">{name}</span>
      {size && <span className="text-text-secondary shrink-0">({size})</span>}
    </div>
  );
};

/* ─── Reply with files ─────────────────────────────────────────────────── */
const ReplyBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  files: File[];
  onAddFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (i: number) => void;
  onOpenImage: (images: { src: string; name: string }[], idx: number) => void;
  sending: boolean;
  placeholder?: string;
}> = ({ value, onChange, onSend, files, onAddFiles, onRemoveFile, onOpenImage, sending, placeholder }) => {
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const pct = Math.round((totalSize / MAX_TOTAL_SIZE) * 100);
  const imageFiles = files.filter(f => f.type.startsWith('image/'));

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Image previews grid */}
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageFiles.map((f, fi) => {
                  const url = URL.createObjectURL(f);
                  const allImgs = imageFiles.map(img => ({
                    src: URL.createObjectURL(img),
                    name: img.name,
                  }));
                  return (
                    <motion.div
                      key={`img-${f.name}-${fi}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="relative group"
                    >
                      <motion.img
                        src={url}
                        alt={f.name}
                        whileHover={{ scale: 1.04 }}
                        onClick={() => onOpenImage(allImgs, fi)}
                        className="w-20 h-16 object-cover rounded-xl border border-purple-700/30 cursor-pointer hover:border-purple-500/60 transition-all"
                      />
                      <button
                        onClick={() => onRemoveFile(files.indexOf(f))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-xl text-[9px] text-white/70 px-1 py-0.5 text-center truncate">
                        {formatBytes(f.size)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Non-image files */}
            <div className="flex flex-wrap gap-1.5">
              {files.filter(f => !f.type.startsWith('image/')).map((f, i) => (
                <motion.div
                  key={`file-${f.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-1 text-xs text-purple-300"
                >
                  <Paperclip size={11} />
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <span className="text-text-secondary">({formatBytes(f.size)})</span>
                  <button
                    onClick={() => onRemoveFile(files.indexOf(f))}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Size bar */}
            <div>
              <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-purple-600'}`}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-0.5 text-right">
                {formatBytes(totalSize)} / 25 МБ · {files.length}/{MAX_FILES} файлов
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 items-end">
        <label className="cursor-pointer flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
            <Image size={15} />
          </div>
          <input type="file" multiple accept="image/*" onChange={onAddFiles} className="hidden" />
        </label>
        <label className="cursor-pointer flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
            <Paperclip size={15} />
          </div>
          <input type="file" multiple onChange={onAddFiles} className="hidden" />
        </label>

        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder={placeholder || 'Ответить...'}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all"
        />
        <motion.button
          onClick={onSend}
          disabled={sending || (!value.trim() && files.length === 0)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] flex-shrink-0"
        >
          {sending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <Send size={15} />
          )}
        </motion.button>
      </div>
    </div>
  );
};

/* ─── Modal ────────────────────────────────────────────────────────────── */
const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-[0_0_40px_rgba(139,92,246,0.15)]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PANEL
══════════════════════════════════════════════════════════════════════════ */
const ModerationPanel: React.FC<Props> = ({ onNavigate }) => {
  const [section, setSection] = useState<Section>(() =>
    localStorage.getItem('mod_open_user_id') ? 'users' : 'tickets'
  );
  const [myRole, setMyRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: u } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
        setMyRole(u?.role || 'user');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-700 border-t-purple-400 rounded-full"
        />
      </div>
    );
  }

  if (!['moderator', 'admin', 'owner'].includes(myRole)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#171425] border border-red-800/40 rounded-2xl p-12 text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Доступ запрещён</h3>
        <p className="text-sm text-text-secondary">Эта секция доступна только модераторам</p>
      </motion.div>
    );
  }

  const sections = [
    { id: 'tickets',    label: 'Тикеты',       icon: Ticket },
    { id: 'users',      label: 'Пользователи', icon: Users },
    { id: 'operations', label: 'Финансы',      icon: Receipt },
    { id: 'products',   label: 'Товары',       icon: Package },
    { id: 'broadcast',  label: 'Рассылка',     icon: Megaphone },
    { id: 'stats',      label: 'Статистика',   icon: BarChart3 },
    { id: 'validation', label: 'Валидация',   icon: ScanSearch },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center">
          <Shield size={18} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Панель модерации</h2>
        <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
          myRole === 'owner' ? 'bg-red-900/30 text-red-400 border border-red-800/30' :
          myRole === 'admin' ? 'bg-orange-900/30 text-orange-400 border border-orange-800/30' :
          'bg-blue-900/30 text-blue-400 border border-blue-800/30'
        }`}>
          {myRole === 'owner' ? '👑 OWNER' : myRole === 'admin' ? '🛡 ADMIN' : '⚖️ MOD'}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto bg-[#171425] border border-purple-900/20 rounded-xl p-1.5">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id as Section)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              section === s.id ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {section === s.id && (
              <motion.div
                layoutId="mod-tab-bg"
                className="absolute inset-0 bg-purple-600/30 rounded-lg border border-purple-600/40"
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
            <s.icon size={14} className="relative z-10" />
            <span className="relative z-10">{s.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {section === 'tickets'    && <TicketsSection onNavigate={onNavigate} />}
          {section === 'users'      && <UsersSection myRole={myRole} />}
          {section === 'operations' && <OperationsSection />}
          {section === 'products'   && <ProductsSection onNavigate={onNavigate} />}
          {section === 'stats'      && <StatsSection />}
          {section === 'validation' && <ValidationSection />}
          {section === 'broadcast'  && <BroadcastSection />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   1. TICKETS
══════════════════════════════════════════════════════════════════════════ */
const TicketsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [tickets, setTickets]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<string>('all');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages]         = useState<any[]>([]);
  const [reply, setReply]               = useState('');
  const [sending, setSending]           = useState(false);
  const [replyFiles, setReplyFiles]     = useState<File[]>([]);
  const [viewer, setViewer]             = useState<{ images: { src: string; name: string }[]; idx: number } | null>(null);
  const messagesEndRef                  = useRef<HTMLDivElement>(null);
  const [reporterInfo, setReporterInfo] = useState<{ id: string; username: string } | null>(null);
  const [accusedInfo, setAccusedInfo]   = useState<{ id: string; username: string } | null>(null);

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    open:        { label: 'Открыт',   cls: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
    in_progress: { label: 'В работе', cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
    closed:      { label: 'Закрыт',   cls: 'bg-gray-900/40 text-gray-400 border border-gray-700/30' },
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages').select('*')
      .eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const openTicket = async (t: any) => {
    setActiveTicket(t);
    setReply('');
    setReplyFiles([]);
    setReporterInfo(null);
    setAccusedInfo(null);
    await loadMessages(t.id);

    // Load reporter info
    if (t.reporter_id) {
      const { data: rp } = await supabase.from('users')
        .select('id, username, custom_id').eq('id', t.reporter_id).maybeSingle();
      if (rp) setReporterInfo({ id: rp.id, username: rp.username || rp.custom_id || rp.id.slice(0, 8) });
    }

    // Load accused user info (target of the dispute)
    if (t.accused_id) {
      const { data: ac } = await supabase.from('users')
        .select('id, username, custom_id').eq('id', t.accused_id).maybeSingle();
      if (ac) setAccusedInfo({ id: ac.id, username: ac.username || ac.custom_id || ac.id.slice(0, 8) });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateStatus = async (status: string, resolution?: string) => {
    if (!activeTicket) return;
    const upd: any = { status, updated_at: new Date().toISOString() };
    if (resolution) upd.resolution = resolution;
    if (status === 'closed') upd.closed_at = new Date().toISOString();
    await supabase.from('tickets').update(upd).eq('id', activeTicket.id);
    setActiveTicket({ ...activeTicket, ...upd });
    load();
  };

  const totalReplySize = replyFiles.reduce((s, f) => s + f.size, 0);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let cur = totalReplySize;
    const valid: File[] = [];
    for (const f of files) {
      if (replyFiles.length + valid.length >= MAX_FILES) break;
      if (cur + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f);
      cur += f.size;
    }
    setReplyFiles(p => [...p, ...valid]);
    e.target.value = '';
  };

  const sendReply = async () => {
    if (!reply.trim() && replyFiles.length === 0) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();

    let filesInfo = '';
    if (replyFiles.length > 0) {
      filesInfo = '\n\nПрикреплённые файлы:\n' +
        replyFiles.map(f => `- ${f.name} (${formatBytes(f.size)})`).join('\n');
    }

    await supabase.from('ticket_messages').insert({
      ticket_id: activeTicket.id,
      sender_id: u.user?.id,
      message: reply + filesInfo,
    });

    // Send notification to the other party about new reply
    const senderId = u.user?.id;
    const recipientId = senderId === activeTicket.reporter_id
      ? activeTicket.accused_id
      : activeTicket.reporter_id;

    if (recipientId && recipientId !== senderId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'dispute_reply',
        title: 'Новый ответ в споре',
        text: `Получен ответ по тикету: ${activeTicket.subject || 'Спор'}`,
        link_type: 'support',
        link_id: activeTicket.id,
        is_read: false,
        icon: '⚖️',
      }).then(() => {}).catch(() => {});
    }

    setReply('');
    setReplyFiles([]);
    await loadMessages(activeTicket.id);
    setSending(false);
  };

  const goToSource = () => {
    if (!activeTicket || !onNavigate) return;
    const tt = activeTicket.target_type;
    if (tt === 'topic') onNavigate('topic', { id: activeTicket.target_id });
    else if (tt === 'forum') onNavigate('forum');
    else if (tt === 'account') onNavigate('product', { id: activeTicket.target_id });
    else if (tt === 'user') onNavigate('profile', { id: activeTicket.target_id });
  };

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(t =>
        filter === 'not_resolved'
          ? t.resolution === 'not_resolved'
          : t.status === filter || t.resolution === filter
      );

  // Строит список изображений из строк описания для просмотра
  // Поскольку реальных URL нет — показываем placeholder с именем файла
  const buildImageList = (fileLines: string[]): { src: string; name: string }[] => {
    return fileLines
      .filter(line => isImageFile(line))
      .map(line => {
        const { name } = parseFileName(line);
        // Placeholder — серый квадрат с именем (реальный URL будет после внедрения Storage)
        return {
          src: `https://placehold.co/800x500/1a1625/a855f7?text=${encodeURIComponent(name)}`,
          name,
        };
      });
  };

  /* ── Active ticket ── */
  if (activeTicket) {
    const fileLines      = parseAttachedLines(activeTicket.description || '');
    const descClean      = (activeTicket.description || '').replace(/\n\nПрикреплённые файлы:[\s\S]*$/, '');
    const st             = STATUS_MAP[activeTicket.status] || STATUS_MAP['open'];
    const imageList      = buildImageList(fileLines);

    return (
      <>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-900/20 flex items-center gap-3 sticky top-0 bg-[#171425] z-10">
            <motion.button onClick={() => setActiveTicket(null)} whileHover={{ x: -2 }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all">
              <ChevronLeft size={18} />
            </motion.button>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                {activeTicket.subject || `Тикет #${activeTicket.id.slice(0, 8)}`}
              </h3>
              <p className="text-xs text-text-secondary">
                #{activeTicket.id.slice(0, 8)} · {new Date(activeTicket.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
          </div>

          {/* Info */}
          <div className="p-4 border-b border-purple-900/20 bg-[#120F1E]">
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Категория</span>
                <p className="text-white mt-0.5">{activeTicket.category || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Цель жалобы</span>
                <p className="text-white mt-0.5">{activeTicket.target_type || '—'}</p>
              </div>
              {reporterInfo && (
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Отправитель</span>
                  <div className="mt-0.5">
                    <UserLink userId={reporterInfo.id} username={reporterInfo.username} className="text-sm text-purple-300 font-medium" />
                  </div>
                </div>
              )}
              {accusedInfo && (
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Ответчик</span>
                  <div className="mt-0.5">
                    <UserLink userId={accusedInfo.id} username={accusedInfo.username} className="text-sm text-red-400 font-medium" />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
              <p className="text-xs text-text-secondary uppercase tracking-wider">Описание</p>
              <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{descClean}</p>

              {/* Attached files */}
              {fileLines.length > 0 && (
                <div className="pt-2 border-t border-purple-900/20">
                  <p className="text-xs text-text-secondary mb-2">
                    📎 Прикреплённые файлы ({fileLines.length})
                  </p>

                  {/* Image previews */}
                  {imageList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {imageList.map((img, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setViewer({ images: imageList, idx: i })}
                          className="group relative w-28 h-20 rounded-xl overflow-hidden border border-purple-700/30 hover:border-purple-500/60 transition-all shadow-[0_0_8px_rgba(139,92,246,0.1)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                          <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Non-image file badges */}
                  <div className="flex flex-wrap gap-2">
                    {fileLines.filter(l => !isImageFile(l)).map((line, i) => {
                      const { name, size } = parseFileName(line);
                      return (
                        <div key={i}
                          className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2.5 py-1.5 text-xs text-purple-300">
                          <FileText size={12} />
                          <span className="max-w-[160px] truncate">{name}</span>
                          {size && <span className="text-text-secondary shrink-0">({size})</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {activeTicket.target_id && (
              <button onClick={goToSource}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-xl text-sm transition-all">
                <ArrowRight size={14} /> Перейти к источнику жалобы
              </button>
            )}
          </div>

          {/* Status actions */}
          <div className="p-4 border-b border-purple-900/20 flex gap-2 flex-wrap bg-[#120F1E]">
            {[
              { label: '⏳ В работе',  fn: () => updateStatus('in_progress', 'in_progress'), cls: 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400' },
              { label: '✅ Решено',    fn: () => updateStatus('open', 'resolved'),            cls: 'bg-green-900/20 hover:bg-green-900/40 text-green-400' },
              { label: '❌ Не решено', fn: () => updateStatus('open', 'not_resolved'),        cls: 'bg-red-900/20 hover:bg-red-900/40 text-red-400' },
              { label: '🔒 Закрыть',  fn: () => updateStatus('closed', activeTicket.resolution || 'closed'), cls: 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 ml-auto' },
            ].map(btn => (
              <motion.button key={btn.label} onClick={btn.fn}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${btn.cls}`}>
                {btn.label}
              </motion.button>
            ))}
          </div>

          {/* Validate account button */}
          {activeTicket.target_type === 'account' && activeTicket.target_id && (
            <div className="px-4 pb-2">
              <motion.button
                onClick={async () => {
                  await supabase.from('accounts').update({
                    validation_status: 'recheck_pending',
                  }).eq('id', activeTicket.target_id);
                  alert('\u{1f504} Проверка запущена! Бот перепроверит аккаунт.');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-blue-900/20 border border-blue-700/30 text-blue-400 hover:bg-blue-900/40 transition-all"
              >
                <Shield size={13} />
                Проверить аккаунт ботом
              </motion.button>
            </div>
          )}

          {/* Messages */}
          <div className="p-5 bg-[#120F1E] space-y-4">
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5 scroll-smooth">
              {messages.length === 0 ? (
                <p className="text-center text-text-secondary text-sm py-8">Сообщений нет</p>
              ) : (
                <AnimatePresence>
                  {messages.map((m, i) => {
                    const isMod = m.sender_id !== activeTicket.reporter_id;
                    // Парсим файлы из сообщения
                    const msgFileLines = parseAttachedLines(m.message || '');
                    const msgClean     = (m.message || '').replace(/\n\nПрикреплённые файлы:[\s\S]*$/, '');
                    const msgImages    = buildImageList(msgFileLines);

                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex ${isMod ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMod
                            ? 'bg-purple-700 text-white rounded-tr-sm'
                            : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                        }`}>
                          <p className={`text-[10px] mb-1 font-bold ${isMod ? 'text-purple-200' : 'text-purple-300'}`}>
                            {isMod ? '🛡 Модератор' : '👤 Пользователь'}
                          </p>

                          {msgClean && <p className="whitespace-pre-wrap mb-2">{msgClean}</p>}

                          {/* Image previews in message */}
                          {msgImages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {msgImages.map((img, ii) => (
                                <motion.button
                                  key={ii}
                                  whileHover={{ scale: 1.04 }}
                                  onClick={() => setViewer({ images: msgImages, idx: ii })}
                                  className="group relative w-24 h-16 rounded-lg overflow-hidden border border-purple-500/30 hover:border-purple-400/60 transition-all"
                                >
                                  <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          )}

                          {/* Non-image files in message */}
                          {msgFileLines.filter(l => !isImageFile(l)).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {msgFileLines.filter(l => !isImageFile(l)).map((line, li) => {
                                const { name, size } = parseFileName(line);
                                return (
                                  <div key={li}
                                    className="flex items-center gap-1 bg-white/10 rounded-md px-1.5 py-0.5 text-[10px] text-white/70">
                                    <FileText size={9} />
                                    <span className="max-w-[80px] truncate">{name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <p className="text-[10px] mt-1 text-white/40">
                            {new Date(m.created_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply */}
            {activeTicket.status !== 'closed' && (
              <div className="pt-3 border-t border-purple-900/20">
                <ReplyBox
                  value={reply}
                  onChange={setReply}
                  onSend={sendReply}
                  files={replyFiles}
                  onAddFiles={handleFileAdd}
                  onRemoveFile={i => setReplyFiles(p => p.filter((_, j) => j !== i))}
                  onOpenImage={(imgs, idx) => setViewer({ images: imgs, idx })}
                  sending={sending}
                  placeholder="Ответ модератора..."
                />
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {viewer && (
            <ImageViewer
              images={viewer.images}
              startIndex={viewer.idx}
              onClose={() => setViewer(null)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ── Ticket list ── */
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all',          label: 'Все' },
          { id: 'open',         label: '🆕 Открытые' },
          { id: 'in_progress',  label: '⏳ В работе' },
          { id: 'resolved',     label: '✅ Решено' },
          { id: 'not_resolved', label: '❌ Не решено' },
          { id: 'closed',       label: '🔒 Закрытые' },
        ].map(f => (
          <motion.button key={f.id} onClick={() => setFilter(f.id)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.id
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                : 'bg-[#171425] text-text-secondary border border-purple-900/20 hover:border-purple-700/40'
            }`}>
            {f.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-10 text-center text-text-secondary">
          Тикетов нет
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t, i) => {
            const ST: Record<string, { label: string; cls: string }> = {
              open:        { label: 'Открыт',   cls: 'bg-blue-900/30 text-blue-400' },
              in_progress: { label: 'В работе', cls: 'bg-yellow-900/30 text-yellow-400' },
              closed:      { label: 'Закрыт',   cls: 'bg-gray-900/40 text-gray-400' },
            };
            const st = ST[t.status] || { label: t.status, cls: 'bg-purple-900/30 text-purple-300' };
            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openTicket(t)}
                whileHover={{ scale: 1.005 }}
                className="bg-[#171425] border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(139,92,246,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <Ticket size={16} className="text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {t.subject || t.category || 'Тикет'}
                      </span>
                      {t.target_type && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">
                          {t.target_type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                    {t.resolution && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        t.resolution === 'resolved'     ? 'bg-green-900/30 text-green-400' :
                        t.resolution === 'not_resolved' ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>{t.resolution}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   2. USERS  (без изменений — полная копия из твоего файла)
══════════════════════════════════════════════════════════════════════════ */
const UsersSection: React.FC<{ myRole: string }> = ({ myRole }) => {
  const [query, setQuery]               = useState('');
  const [users, setUsers]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [active, setActive]             = useState<any>(null);
  const [bans, setBans]                 = useState<any[]>([]);
  const [modal, setModal]               = useState<null | 'punish' | 'stat' | 'role'>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [customRolesList, setCustomRolesList] = useState<any[]>([]);
  const [pType, setPType]     = useState<'ban' | 'mute' | 'warn'>('mute');
  const [pReason, setPReason] = useState('');
  const [pHours, setPHours]   = useState('24');
  const [statField, setStatField] = useState('balance');
  const [statValue, setStatValue] = useState('');
  const [crLabel, setCrLabel]   = useState('');
  const [crIcon, setCrIcon]     = useState('star');
  const [crColor, setCrColor]   = useState('purple');
  const [crDesc, setCrDesc]     = useState('');
  const [crGlow, setCrGlow]     = useState(true);
  const [crPulse, setCrPulse]   = useState(false);

  const search = async () => {
    setLoading(true);
    const q = supabase.from('users').select('*').limit(50);
    if (query.trim()) {
      q.or(`username.ilike.%${query}%,email.ilike.%${query}%,id.eq.${
        query.match(/^[a-f0-9-]{36}$/i) ? query : '00000000-0000-0000-0000-000000000000'
      }`);
    }
    const { data } = await q.order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const pendingId = localStorage.getItem('mod_open_user_id');
      if (pendingId) {
        localStorage.removeItem('mod_open_user_id');
        const { data } = await supabase.from('users').select('*').eq('id', pendingId).maybeSingle();
        if (data) { openUser(data); return; }
      }
      search();
    })();
  }, []);

  const loadCustomRoles = async (userId: string) => {
    const { data } = await supabase.from('user_custom_roles').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    setCustomRolesList(data || []);
    setActive((prev: any) => prev ? { ...prev, custom_roles: data || [] } : prev);
  };

  const openUser = async (u: any) => {
    setActive(u);
    const { data: b } = await supabase.from('bans').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
    setBans(b || []);
    const { data: a } = await supabase.from('accounts').select('*').eq('seller_id', u.id).order('created_at', { ascending: false });
    setUserAccounts(a || []);
    await loadCustomRoles(u.id);
  };

  const quickStat = async (field: string, value: any) => {
    if (!active) return;
    const { data, error } = await supabase.rpc('moderate_set_stat', { p_user_id: active.id, p_field: field, p_value: String(value) });
    if (error || !data?.ok) { alert(data?.error || error?.message || 'Ошибка'); return; }
    const { data: r } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    if (r) setActive(r);
  };

  const applyRole = async (preset: string) => {
    if (!active) return;
    if (preset === 'custom') {
      if (!crLabel.trim()) { alert('Введите название роли'); return; }
      const granter = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase.from('user_custom_roles').insert({
        user_id: active.id, label: crLabel, icon: crIcon, color: crColor,
        description: crDesc || null, has_glow: crGlow, has_pulse: crPulse, granted_by: granter,
      });
      if (error) {
        const { error: e2 } = await supabase.from('user_custom_roles').insert({
          user_id: active.id, label: crLabel, icon: crIcon, color: crColor, description: crDesc || null, granted_by: granter,
        });
        if (e2) { alert('Ошибка: ' + e2.message); return; }
      }
      setCrLabel(''); setCrDesc(''); setCrGlow(true); setCrPulse(false);
      await loadCustomRoles(active.id);
      setModal(null);
      return;
    }
    await supabase.from('users').update({ role: preset }).eq('id', active.id);
    const { data: r } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    if (r) setActive(r);
    setModal(null);
  };

  const deleteCustomRole = async (id: string) => {
    await supabase.from('user_custom_roles').delete().eq('id', id);
    if (active) await loadCustomRoles(active.id);
  };

  const punish = async () => {
    if (!active) return;
    const { error } = await supabase.rpc('moderate_punish', {
      p_user_id: active.id, p_type: pType, p_reason: pReason,
      p_duration_hours: pHours ? parseInt(pHours) : null,
    });
    if (error) { alert(error.message); return; }
    setModal(null); setPReason('');
    openUser(active);
  };

  const unpunish = async (banId: string) => {
    await supabase.rpc('moderate_unpunish', { p_ban_id: banId });
    openUser(active);
  };

  const deletePunishmentHistory = async (banId: string) => {
    if (myRole !== 'owner' || !active) return;
    if (!confirm('Удалить запись из истории блокировок? Это действие нельзя отменить.')) return;

    const { data, error } = await supabase.rpc('moderate_delete_punishment_history', { p_ban_id: banId });
    if (error) {
      alert('Не удалось удалить историю. Выполните SQL supabase/delete_punishment_history.sql. Ошибка: ' + error.message);
      return;
    }
    if (data?.ok === false) {
      const errMap: Record<string, string> = {
        forbidden: 'Удалять историю блокировок может только владелец',
        not_found: 'Запись уже удалена или не найдена',
      };
      alert(errMap[data.error] || data.error || 'Не удалось удалить историю');
      return;
    }

    setBans(prev => prev.filter(b => b.id !== banId));
    openUser(active);
  };

  const setStat = async () => {
    if (!active) return;
    const { data, error } = await supabase.rpc('moderate_set_stat', { p_user_id: active.id, p_field: statField, p_value: statValue });
    if (error) { alert(error.message); return; }
    if (!data?.ok) { alert(data?.error); return; }
    setModal(null); setStatValue('');
    const { data: r } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    setActive(r);
  };

  if (active) return (
    <div className="space-y-3">
      <motion.button onClick={() => setActive(null)} whileHover={{ x: -2 }}
        className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-all">
        <ChevronLeft size={16} /> Назад к поиску
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-purple-700/30">
            {active.avatar_url ? <img src={active.avatar_url} className="w-full h-full object-cover" /> :
              <span className="text-xl font-bold text-white">{(active.username?.[0] || 'U').toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white">{active.username || active.email}</h3>
              {active.verified && <CheckCircle2 size={16} className="text-blue-400" />}
              <RB user={active} />
            </div>
            <p className="text-sm text-text-secondary">{active.email}</p>
            <p className="text-xs text-text-secondary font-mono mt-0.5">#{active.custom_id || active.id?.slice(0, 8)}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { label: '💰 Баланс', field: 'balance', value: active.balance || 0, steps: [10, 100, 1000, 10000], suffix: ' ₽' },
            { label: '⚡ XP',     field: 'xp',      value: active.xp || 0,     steps: [10, 50, 100, 500],    suffix: '' },
            { label: '📈 Уровень',field: 'level',   value: active.level || 1,  steps: [1],                   suffix: '' },
            { label: '🛍 Продажи',field: 'sales',   value: active.sales || 0,  steps: [1, 10],               suffix: '' },
          ].map(s => (
            <div key={s.field} className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary">{s.label}</p>
                <p className="text-sm font-bold text-white">{s.value}{s.suffix}</p>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {s.steps.map(step => (
                  <React.Fragment key={step}>
                    <button onClick={() => quickStat(s.field, s.value - step)}
                      className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md text-[10px] font-bold transition-colors">
                      −{step >= 1000 ? step / 1000 + 'k' : step}
                    </button>
                    <button onClick={() => quickStat(s.field, s.value + step)}
                      className="px-2 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded-md text-[10px] font-bold transition-colors">
                      +{step >= 1000 ? step / 1000 + 'k' : step}
                    </button>
                  </React.Fragment>
                ))}
                <button onClick={() => {
                  const v = prompt(`Точное значение ${s.label}:`, String(s.value));
                  if (v !== null && !isNaN(Number(v))) quickStat(s.field, Number(v));
                }} className="px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-md text-[10px] font-bold transition-colors">
                  ✏️ точно
                </button>
                {s.field === 'sales' && (
                  <button onClick={() => setShowAccounts(true)}
                    className="ml-auto px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-md text-[10px] transition-colors">
                    📦 товары
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <motion.button onClick={() => quickStat('verified', !active.verified)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active.verified ? 'bg-blue-600 text-white' : 'bg-blue-900/20 text-blue-400 border border-blue-800/30'
            }`}>
            <CheckCircle2 size={14} /> {active.verified ? 'Снять верификацию' : 'Верифицировать'}
          </motion.button>
          <motion.button onClick={() => setModal('role')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-xl text-sm font-semibold border border-purple-800/30 transition-all">
            <Crown size={14} /> Сменить роль
          </motion.button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.button onClick={() => setModal('punish')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl text-sm border border-red-800/20 transition-all">
            <Ban size={14} /> Наказание
          </motion.button>
          <motion.button onClick={() => setModal('stat')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-xl text-sm border border-purple-800/20 transition-all">
            <SettingsIcon size={14} /> Произвольное поле
          </motion.button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4">
        <h4 className="text-sm font-semibold text-white mb-3">История наказаний ({bans.length})</h4>
        {bans.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-4">Наказаний нет</p>
        ) : (
          <div className="space-y-2">
            {bans.map(b => {
              const isActive = b.is_active && (!b.ends_at || new Date(b.ends_at) > new Date());
              return (
                <div key={b.id} className={`border rounded-xl p-3 ${isActive ? 'bg-red-900/10 border-red-800/40' : 'bg-[#0B0A12] border-purple-900/20'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      b.type === 'ban' ? 'bg-red-900/30 text-red-400' :
                      b.type === 'mute' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-orange-900/30 text-orange-400'
                    }`}>{b.type}</span>
                    {isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded animate-pulse">АКТИВЕН</span>}
                    <span className="text-xs text-text-secondary ml-auto">{new Date(b.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                  <p className="text-sm text-white"><b>Причина:</b> {b.reason}</p>
                  <p className="text-xs text-text-secondary">
                    <b>Выдал:</b> {b.moderator_name} · <b>Срок:</b> {b.duration_hours ? `${b.duration_hours} ч` : 'навсегда'}
                    {b.ends_at && ` · до ${new Date(b.ends_at).toLocaleString('ru-RU')}`}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {isActive && (
                      <button onClick={() => unpunish(b.id)} className="text-xs text-green-400 hover:underline">
                        ✓ Снять наказание
                      </button>
                    )}
                    {myRole === 'owner' && (
                      <button onClick={() => deletePunishmentHistory(b.id)} className="text-xs text-red-400 hover:underline">
                        <Trash2 size={11} className="inline mr-1" />Удалить из истории
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {modal === 'punish' && (
        <Modal onClose={() => setModal(null)} title="Выдать наказание">
          <label className="text-xs text-text-secondary mb-1 block">Тип</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{ id: 'warn', label: '⚠️ Предупр.' }, { id: 'mute', label: '🔇 Мут' }, { id: 'ban', label: '🚫 Бан' }].map(t => (
              <button key={t.id} onClick={() => setPType(t.id as any)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  pType === t.id ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                }`}>{t.label}</button>
            ))}
          </div>
          <label className="text-xs text-text-secondary mb-1 block">Причина</label>
          <textarea value={pReason} onChange={e => setPReason(e.target.value)} rows={2}
            className="w-full px-3 py-2 mb-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all" />
          <label className="text-xs text-text-secondary mb-1 block">Срок (0 = навсегда)</label>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['1', '24', '72', '168', '720', '0'].map(h => (
              <button key={h} onClick={() => setPHours(h)}
                className={`flex-1 py-2 rounded-lg text-xs border transition-all ${
                  pHours === h ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-purple-900/20 text-text-secondary'
                }`}>
                {h === '0' ? '∞' : h === '24' ? '1д' : h === '72' ? '3д' : h === '168' ? '7д' : h === '720' ? '30д' : h + 'ч'}
              </button>
            ))}
          </div>
          <input value={pHours} onChange={e => setPHours(e.target.value)} type="number" placeholder="Своё значение"
            className="w-full px-3 py-2 mb-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
          <motion.button onClick={punish} disabled={!pReason} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
            Выдать наказание
          </motion.button>
        </Modal>
      )}

      {modal === 'role' && (
        <Modal onClose={() => setModal(null)} title="Сменить роль пользователя">
          <div className="space-y-2 mb-4">
            {[
              { id: 'user',      label: 'Обычный пользователь',  Icon: Users,      cls: 'bg-gray-700/20 text-gray-300 hover:bg-gray-700/40' },
              { id: 'support',   label: 'Support (поддержка)',   Icon: Send,       cls: 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50' },
              { id: 'moderator', label: 'Moderator (модератор)', Icon: ScanSearch, cls: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' },
              { id: 'admin',     label: 'Admin (администратор)', Icon: Shield,     cls: 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' },
              ...(myRole === 'owner' ? [{ id: 'owner', label: 'Owner (владелец)', Icon: Crown, cls: 'bg-red-900/30 text-red-400 hover:bg-red-900/50' }] : []),
            ].map(r => (
              <motion.button key={r.id} onClick={() => applyRole(r.id)}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${r.cls}`}>
                <span className="w-7 h-7 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <r.Icon size={15} />
                </span>
                {r.label}
              </motion.button>
            ))}
          </div>
          <div className="border-t border-purple-900/20 pt-3">
            <p className="text-xs text-text-secondary mb-2 font-semibold">⭐ Кастомная роль</p>
            <input value={crLabel} onChange={e => setCrLabel(e.target.value)} placeholder="Название (напр. SPONSOR)" maxLength={15}
              className="w-full px-3 py-2 mb-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
            <input value={crDesc} onChange={e => setCrDesc(e.target.value)} placeholder="Описание роли (для тултипа)" maxLength={120}
              className="w-full px-3 py-2 mb-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-xs focus:border-purple-500/60 focus:outline-none transition-all" />
            <div className="flex gap-2 mb-3">
              {[{ key: 'crGlow', checked: crGlow, set: setCrGlow, label: '✨ Свечение' }, { key: 'crPulse', checked: crPulse, set: setCrPulse, label: '💫 Загасание' }].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer flex-1 p-2 bg-[#0B0A12] border border-purple-900/20 rounded-lg">
                  <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)} className="accent-purple-500" />
                  <span className="text-xs text-white">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary uppercase mb-1.5">Иконка</p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {MOD_ICON_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setCrIcon(opt.id)} title={opt.label}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    crIcon === opt.id ? 'bg-purple-600 ring-2 ring-purple-400 text-white' : 'bg-[#0B0A12] border border-purple-900/30 text-purple-300 hover:border-purple-700/40'
                  }`}>
                  <opt.Icon size={17} />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary uppercase mb-1.5">Цвет</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['red','orange','yellow','green','blue','cyan','purple','pink'].map(col => (
                <button key={col} onClick={() => setCrColor(col)}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${crColor === col ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: ({ red:'#ef4444',orange:'#f97316',yellow:'#eab308',green:'#22c55e',blue:'#3b82f6',cyan:'#06b6d4',purple:'#a855f7',pink:'#ec4899' } as any)[col] }} />
              ))}
            </div>
            <motion.button onClick={() => applyRole('custom')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all">
              Применить кастомную
            </motion.button>
            {customRolesList.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-900/20">
                <p className="text-[10px] text-text-secondary mb-2 uppercase">Текущие роли ({customRolesList.length})</p>
                <div className="space-y-1">
                  {customRolesList.map((cr: any) => (
                    <div key={cr.id} className="flex items-center justify-between bg-[#0B0A12] border border-purple-900/20 rounded-lg p-2">
                      <span className="text-xs text-white">{cr.icon} {cr.label}</span>
                      <button onClick={() => deleteCustomRole(cr.id)} className="text-[10px] text-red-400 hover:underline">Удалить</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showAccounts && (
        <Modal onClose={() => setShowAccounts(false)} title={`Товары ${active.username || 'пользователя'} (${userAccounts.length})`}>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {userAccounts.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-4">Нет товаров</p>
            ) : userAccounts.map(a => (
              <div key={a.id} className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">{a.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.status === 'sold' ? 'bg-gray-900/40 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                    {a.status || 'active'}
                  </span>
                  <span className="text-[10px] text-text-secondary ml-auto">{new Date(a.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <p className="text-sm text-white font-semibold truncate">{a.title}</p>
                <p className="text-sm text-purple-300">{a.price?.toLocaleString('ru-RU')} ₽</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'stat' && (
        <Modal onClose={() => setModal(null)} title="Изменить статистику">
          <label className="text-xs text-text-secondary mb-1 block">Поле</label>
          <select value={statField} onChange={e => setStatField(e.target.value)}
            className="w-full px-3 py-2 mb-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all">
            <option value="balance">Баланс</option>
            <option value="xp">XP</option>
            <option value="level">Уровень</option>
            <option value="sales">Продажи</option>
            <option value="positive_reviews">Положительные отзывы</option>
            <option value="verified">Верификация (true/false)</option>
          </select>
          <label className="text-xs text-text-secondary mb-1 block">Новое значение</label>
          <input value={statValue} onChange={e => setStatValue(e.target.value)}
            className="w-full px-3 py-2 mb-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
          <motion.button onClick={setStat} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all">
            Применить
          </motion.button>
        </Modal>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Поиск по никнейму, email или ID..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#171425] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
        <motion.button onClick={search} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm transition-all">
          <Search size={16} />
        </motion.button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => openUser(u)} whileHover={{ scale: 1.005 }}
              className="bg-[#171425] border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-3 cursor-pointer transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> :
                    <span className="text-xs font-bold text-white">{(u.username?.[0] || 'U').toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{u.username || u.email}</p>
                    <RB user={u} />
                    {u.custom_id && <span className="text-[10px] text-purple-300 font-mono">#{u.custom_id}</span>}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-text-secondary">Баланс</p>
                  <p className="text-sm font-bold text-white">{(u.balance || 0).toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   3. OPERATIONS
══════════════════════════════════════════════════════════════════════════ */
const OperationsSection: React.FC = () => {
  const [ops, setOps]           = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');
  const [note, setNote]         = useState('');
  const [opening, setOpening]   = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase.from('operations').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOps(data || []);
    const ids = [...new Set((data || []).map((o: any) => o.user_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data: users } = await supabase.from('users').select('id, username, email, custom_id, balance').in('id', ids);
      const map: Record<string, any> = {};
      users?.forEach(u => { map[u.id] = u; });
      setUsersMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const getMeta = (o: any) => {
    if (!o?.meta) return {};
    if (typeof o.meta === 'string') {
      try { return JSON.parse(o.meta); } catch { return {}; }
    }
    return o.meta || {};
  };

  const maskCard = (card?: string) => {
    const clean = String(card || '').replace(/\D/g, '');
    if (!clean) return '—';
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const action = async (opId: string, act: 'approve' | 'reject' | 'rollback') => {
    const { data, error } = await supabase.rpc('moderate_operation', { p_op_id: opId, p_action: act, p_note: note || null });
    if (error) {
      alert(error.message);
      return;
    }
    if (data && data.ok === false) {
      const errMap: Record<string, string> = {
        insufficient_balance: 'Недостаточно средств на балансе пользователя для вывода',
        operation_not_pending: 'Операция уже обработана',
        operation_not_found: 'Операция не найдена',
        recipient_not_found: 'Получатель не найден',
        cannot_transfer_to_self: 'Нельзя перевести самому себе',
        operation_cannot_rollback: 'Операцию нельзя откатить',
        insufficient_balance_for_rollback: 'Недостаточно средств для отката пополнения',
        recipient_has_insufficient_balance: 'У получателя недостаточно средств для отката',
      };
      alert(errMap[data.error] || data.error || 'Ошибка операции');
      return;
    }
    setNote(''); setOpening(null); load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[{ id: 'pending', label: '⏳ Ожидает' }, { id: 'completed', label: '✅ Выполнено' }, { id: 'failed', label: '❌ Отклонено' }, { id: 'all', label: 'Все' }].map(f => (
          <motion.button key={f.id} onClick={() => setFilter(f.id as any)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.id ? 'bg-purple-600 text-white' : 'bg-[#171425] text-text-secondary border border-purple-900/20 hover:border-purple-700/40'
            }`}>{f.label}</motion.button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : ops.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-10 text-center text-text-secondary">Операций нет</div>
      ) : (
        <div className="space-y-2">
          {ops.map((o, i) => {
            const meta = getMeta(o);
            const user = usersMap[o.user_id] || {};
            const isWithdraw = o.type === 'withdraw';
            const payout = meta.payout_amount ?? meta.total;
            return (
            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#171425] border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                  o.type === 'deposit' ? 'bg-green-900/20 text-green-400' : o.type === 'withdraw' ? 'bg-red-900/20 text-red-400' : 'bg-purple-900/20 text-purple-300'
                }`}>
                  {o.type === 'deposit' ? '+' : o.type === 'withdraw' ? '−' : '→'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{o.type} · {Number(o.amount).toLocaleString('ru-RU')} ₽</p>
                  <p className="text-xs text-text-secondary">
                    {usersMap[o.user_id]?.custom_id ? '#' + usersMap[o.user_id].custom_id : (usersMap[o.user_id]?.username || o.user_id?.slice(0, 8))}
                    {' · '}{new Date(o.created_at).toLocaleString('ru-RU')}{o.recipient && ` · → ${o.recipient}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                  o.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : o.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>{o.status}{o.rolled_back && ' · откат'}</span>
              </div>

              {isWithdraw && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary">Пользователь</p>
                    <p className="text-white font-mono break-all">ID: {o.user_id}</p>
                    <p className="text-text-secondary">
                      {user.custom_id ? `#${user.custom_id}` : user.username || 'Без ника'}{user.email ? ` · ${user.email}` : ''}
                    </p>
                    <p className="text-text-secondary">Баланс: <span className="text-white font-semibold">{Number(user.balance || 0).toLocaleString('ru-RU')} ₽</span></p>
                  </div>
                  <div className="bg-[#0B0A12] border border-red-900/20 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary">Данные карты</p>
                    <p className="text-white font-mono">{maskCard(meta.full_card)}</p>
                    <p className="text-text-secondary">Владелец: <span className="text-white">{meta.card_holder || '—'}</span></p>
                    <p className="text-text-secondary">Банк: <span className="text-white">{meta.bank_name || '—'}</span></p>
                    <p className="text-text-secondary">К выплате после комиссии: <span className="text-green-400 font-semibold">{Number(payout || Math.max(0, Number(o.amount || 0))).toLocaleString('ru-RU')} ₽</span></p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {opening === o.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Комментарий (необязательно)"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
                    <div className="flex gap-2">
                      {o.status === 'pending' && (
                        <>
                          <motion.button onClick={() => action(o.id, 'approve')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-all">✅ Одобрить</motion.button>
                          <motion.button onClick={() => action(o.id, 'reject')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all">❌ Отклонить</motion.button>
                        </>
                      )}
                      {o.status === 'completed' && !o.rolled_back && (
                        <motion.button onClick={() => action(o.id, 'rollback')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold transition-all">↩️ Откатить</motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {opening !== o.id && (o.status === 'pending' || (o.status === 'completed' && !o.rolled_back)) && (
                <button onClick={() => setOpening(o.id)} className="mt-2 text-xs text-purple-400 hover:underline">Действия →</button>
              )}
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   4. PRODUCTS
══════════════════════════════════════════════════════════════════════════ */
const ProductsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading]   = useState(true);
  const [editMsg, setEditMsg]   = useState<{ id: string; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('accounts').select('*').limit(100).order('created_at', { ascending: false });
    if (query.trim()) q = q.ilike('title', `%${query}%`);
    if (category.trim()) q = q.eq('category', category);
    const { data } = await q;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const delProduct = async (id: string) => {
    const reason = prompt('Причина удаления:');
    if (!reason) return;
    await supabase.rpc('moderate_delete_account', { p_account_id: id, p_reason: reason });
    load();
  };

  const requestEdit = async (id: string) => {
    if (!editMsg) return;
    await supabase.rpc('moderate_request_edit', { p_account_id: id, p_message: editMsg.text });
    setEditMsg(null);
    alert('Запрос отправлен продавцу');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Поиск по названию..."
          className="flex-1 px-3 py-2.5 rounded-xl bg-[#171425] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
        <input value={category} onChange={e => setCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Категория"
          className="w-32 px-3 py-2.5 rounded-xl bg-[#171425] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
        <motion.button onClick={load} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm transition-all">
          <Search size={16} />
        </motion.button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#171425] border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/20 flex items-center justify-center">
                  <Package size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">{p.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.status === 'sold' ? 'bg-gray-900/40 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                      {p.status || 'active'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-xs text-text-secondary">{p.price?.toLocaleString('ru-RU')} ₽ · {p.seller_id?.slice(0, 8)}</p>
                </div>
                <div className="flex gap-1">
                  {onNavigate && (
                    <motion.button onClick={() => onNavigate('product', { id: p.id })} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="p-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg transition-all">
                      <ArrowRight size={14} />
                    </motion.button>
                  )}
                  <motion.button onClick={() => setEditMsg({ id: p.id, text: '' })} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="p-2 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 rounded-lg transition-all">
                    <Edit3 size={14} />
                  </motion.button>
                  <motion.button onClick={() => delProduct(p.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
              <AnimatePresence>
                {editMsg?.id === p.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                    <textarea value={editMsg.text} onChange={e => setEditMsg({ ...editMsg, text: e.target.value })} placeholder="Что нужно исправить?" rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all" />
                    <div className="flex gap-2">
                      <motion.button onClick={() => requestEdit(p.id)} disabled={!editMsg.text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all">
                        Отправить запрос
                      </motion.button>
                      <button onClick={() => setEditMsg(null)} className="px-4 py-2 bg-purple-900/20 text-white rounded-xl text-xs transition-all">Отмена</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   5. STATS
══════════════════════════════════════════════════════════════════════════ */
const StatsSection: React.FC = () => {
  const [stats, setStats]         = useState({ users: 0, accounts: 0, sold: 0, pending_ops: 0, open_tickets: 0, total_revenue: 0 });
  const [logs, setLogs]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [modsMap, setModsMap]     = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const [u, a, s, p, t, o, ml] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('accounts').select('id', { count: 'exact', head: true }),
          supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
          supabase.from('operations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('orders').select('amount'),
          supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(20),
        ]);
        const total = (o.data || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
        setStats({ users: u.count || 0, accounts: a.count || 0, sold: s.count || 0, pending_ops: p.count || 0, open_tickets: t.count || 0, total_revenue: total });
        setLogs(ml.data || []);
        const modIds = [...new Set((ml.data || []).map((l: any) => l.moderator_id).filter(Boolean))];
        if (modIds.length > 0) {
          const { data: mods } = await supabase.from('users').select('id, username').in('id', modIds);
          const map: Record<string, any> = {};
          mods?.forEach((m: any) => { map[m.id] = m; });
          setModsMap(map);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const filterMatches: Record<string, string[]> = {
    balance: ['set_balance', 'op_approve', 'op_reject', 'op_rollback'],
    punish:  ['ban', 'mute', 'warn', 'unpunish'],
    product: ['delete_account', 'request_edit'],
    roles:   ['set_role', 'set_verified'],
  };
  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => (filterMatches[logFilter] || []).some(m => (l.action || '').includes(m)));

  if (loading) return (
    <div className="flex justify-center py-12">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Пользователей',   value: stats.users,                                        color: 'text-blue-400',   bg: 'bg-blue-900/10 border-blue-800/20' },
          { label: 'Товаров',         value: stats.accounts,                                     color: 'text-purple-400', bg: 'bg-purple-900/10 border-purple-800/20' },
          { label: 'Продано',         value: stats.sold,                                         color: 'text-green-400',  bg: 'bg-green-900/10 border-green-800/20' },
          { label: 'Оборот',          value: stats.total_revenue.toLocaleString('ru-RU') + ' ₽', color: 'text-yellow-400', bg: 'bg-yellow-900/10 border-yellow-800/20' },
          { label: 'Ожидают оплаты',  value: stats.pending_ops,                                  color: 'text-orange-400', bg: 'bg-orange-900/10 border-orange-800/20' },
          { label: 'Откр. тикеты',    value: stats.open_tickets,                                 color: 'text-red-400',    bg: 'bg-red-900/10 border-red-800/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`border rounded-2xl p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4">
        <h4 className="text-sm font-semibold text-white mb-3">📋 Журнал действий модераторов</h4>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {[{ id: 'all', label: '📜 Все' }, { id: 'balance', label: '💰 Балансы' }, { id: 'punish', label: '🚫 Наказания' }, { id: 'product', label: '📦 Товары' }, { id: 'roles', label: '👑 Роли' }].map(f => (
            <motion.button key={f.id} onClick={() => setLogFilter(f.id)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                logFilter === f.id ? 'bg-purple-600 text-white' : 'bg-[#0B0A12] text-text-secondary border border-purple-900/20 hover:border-purple-700/40'
              }`}>{f.label}</motion.button>
          ))}
        </div>
        {filteredLogs.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-4">Действий нет</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-2.5 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-purple-300">{l.action}</span>
                  <span className="text-text-secondary">{new Date(l.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <p className="text-white">{l.details}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Mod: {modsMap[l.moderator_id]?.username || l.moderator_id?.slice(0, 8)} · {l.target_type || '—'}/{l.target_id?.slice(0, 8) || '—'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   6. BROADCAST
══════════════════════════════════════════════════════════════════════════ */
const BroadcastSection: React.FC = () => {
  const [mode, setMode]             = useState<'live' | 'notif'>('live');
  const [liveTitle, setLiveTitle]   = useState('');
  const [liveSub, setLiveSub]       = useState('');
  const [liveIcon, setLiveIcon]     = useState('megaphone');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifText, setNotifText]   = useState('');
  const [notifIcon, setNotifIcon]   = useState('📢');
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState<string | null>(null);
  const notifIcons = ['📢','⚠️','🎉','🎁','🔥','💎','🚀','⭐','🌙','📨'];

  const sendLive = async () => {
    if (!liveTitle.trim()) return;
    setSending(true); setResult(null);
    const { data: u } = await supabase.auth.getUser();
    const { data: me } = await supabase.from('users').select('username, avatar_url').eq('id', u.user!.id).maybeSingle();
    const { error } = await supabase.from('live_events').insert({
      event_type: 'custom', user_id: u.user?.id, username: me?.username, avatar_url: me?.avatar_url,
      title: liveTitle, subtitle: liveSub || null, icon: liveIcon,
    });
    setSending(false);
    if (error) { setResult('⚠️ ' + error.message); return; }
    setResult('✅ Эфир показан всем!'); setLiveTitle(''); setLiveSub('');
    setTimeout(() => setResult(null), 3000);
  };

  const sendNotif = async () => {
    if (!notifTitle.trim()) return;
    setSending(true); setResult(null);
    const { data, error } = await supabase.rpc('broadcast_notification', { p_title: notifTitle, p_text: notifText, p_icon: notifIcon });
    setSending(false);
    if (error) { setResult('⚠️ ' + error.message); return; }
    if (data?.ok) {
      setResult(`✅ Уведомление отправлено ${data.sent} пользователям!`); setNotifTitle(''); setNotifText('');
      setTimeout(() => setResult(null), 3000);
    } else { setResult('⚠️ ' + (data?.error || 'Ошибка')); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[{ id: 'live', label: '📺 Прямой эфир' }, { id: 'notif', label: '🔔 Уведомление всем' }].map(m => (
          <motion.button key={m.id} onClick={() => setMode(m.id as any)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              mode === m.id ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)]' : 'bg-[#171425] border border-purple-900/20 text-text-secondary hover:border-purple-700/40'
            }`}>{m.label}</motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {mode === 'live' ? (
          <motion.div key="live" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white mb-1">📺 Кастомный прямой эфир</p>
              <p className="text-xs text-text-secondary">Появится в правом нижнем углу у всех онлайн-пользователей</p>
            </div>
            <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} maxLength={80} placeholder="Заголовок (например: Новое обновление!)"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
            <input value={liveSub} onChange={e => setLiveSub(e.target.value)} maxLength={100} placeholder="Подзаголовок (необязательно)"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Иконка</p>
              <div className="flex gap-1.5 flex-wrap">
                {LIVE_ICON_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => setLiveIcon(opt.id)} title={opt.label}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      liveIcon === opt.id ? 'bg-purple-600 ring-2 ring-purple-400 text-white' : 'bg-[#0B0A12] border border-purple-900/30 text-purple-300 hover:border-purple-700/40'
                    }`}>
                    <opt.Icon size={17} />
                  </button>
                ))}
              </div>
            </div>
            <motion.button onClick={sendLive} disabled={sending || !liveTitle.trim()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {sending ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={14} />}
              {sending ? 'Отправка...' : 'Показать в эфире'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="notif" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white mb-1">🔔 Массовая рассылка</p>
              <p className="text-xs text-text-secondary">Будет отправлено ВСЕМ зарегистрированным пользователям</p>
            </div>
            <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} maxLength={100} placeholder="Заголовок уведомления"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
            <textarea value={notifText} onChange={e => setNotifText(e.target.value)} maxLength={300} rows={3} placeholder="Текст сообщения"
              className="w-full px-3 py-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all" />
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Иконка</p>
              <div className="flex gap-1.5 flex-wrap">
                {notifIcons.map(i => (
                  <button key={i} onClick={() => setNotifIcon(i)}
                    className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${
                      notifIcon === i ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-[#0B0A12] border border-purple-900/30 hover:border-purple-700/40'
                    }`}>{i}</button>
                ))}
              </div>
            </div>
            <motion.button onClick={sendNotif} disabled={sending || !notifTitle.trim()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {sending ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={14} />}
              {sending ? 'Рассылка...' : 'Отправить всем'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-xl text-sm text-center ${
              result.startsWith('✅') ? 'bg-green-900/20 border border-green-700/30 text-green-400' : 'bg-red-900/20 border border-red-700/30 text-red-400'
            }`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   7. VALIDATION
══════════════════════════════════════════════════════════════════════════ */
const ValidationSection: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [validating, setValidating] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [stats, setStats] = useState({ total: 0, valid: 0, changed: 0, error: 0, unchecked: 0 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('accounts')
      .select('id, title, category, status, validation_status, last_validated_at, validation_severity, validation_changes')
      .order('last_validated_at', { ascending: true, nullsFirst: true })
      .limit(100);

    const list = data || [];
    setAccounts(list);

    setStats({
      total: list.length,
      valid: list.filter(a => a.validation_status === 'valid').length,
      changed: list.filter(a => a.validation_status === 'changed').length,
      error: list.filter(a => a.validation_status === 'error').length,
      unchecked: list.filter(a => !a.validation_status || a.validation_status === 'unchecked').length,
    });

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const triggerRecheck = async (accountId: string) => {
    setValidating(accountId);
    await supabase.from('accounts').update({
      validation_status: 'recheck_pending',
    }).eq('id', accountId);

    // Poll for completion
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const { data: acc } = await supabase
        .from('accounts')
        .select('validation_status')
        .eq('id', accountId)
        .maybeSingle();

      if (acc && acc.validation_status !== 'recheck_pending') {
        clearInterval(poll);
        setValidating(null);
        load();
      }
      if (attempts > 20) {
        clearInterval(poll);
        setValidating(null);
        load();
      }
    }, 1500);
  };

  const bulkValidateAll = async () => {
    setBulkRunning(true);
    const unchecked = accounts.filter(a => !a.validation_status || a.validation_status === 'unchecked');
    for (const acc of unchecked.slice(0, 20)) {
      await supabase.from('accounts').update({
        validation_status: 'recheck_pending',
      }).eq('id', acc.id);
    }
    setTimeout(() => {
      setBulkRunning(false);
      load();
    }, 5000);
  };

  const filtered = filter === 'all'
    ? accounts
    : accounts.filter(a =>
        filter === 'unchecked'
          ? (!a.validation_status || a.validation_status === 'unchecked')
          : a.validation_status === filter
      );

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    valid:           { label: '✅ Проверен',  cls: 'bg-green-900/30 text-green-400 border border-green-700/30' },
    changed:         { label: '⚠️ Изменён',  cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
    error:           { label: '❌ Ошибка',    cls: 'bg-red-900/30 text-red-400 border border-red-700/30' },
    recheck_pending: { label: '🔄 Проверка',  cls: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
    unchecked:       { label: '⏳ Ожидание',  cls: 'bg-gray-900/30 text-gray-400 border border-gray-700/30' },
    no_config:       { label: '⚙️ Нет API',   cls: 'bg-purple-900/30 text-purple-300 border border-purple-700/30' },
  };

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Всего',      value: stats.total,     color: 'text-white' },
          { label: 'Проверены',  value: stats.valid,     color: 'text-green-400' },
          { label: 'Изменены',   value: stats.changed,   color: 'text-yellow-400' },
          { label: 'Ошибки',     value: stats.error,     color: 'text-red-400' },
          { label: 'Ожидают',    value: stats.unchecked,  color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold \${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + bulk action */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { id: 'all',       label: 'Все' },
          { id: 'valid',     label: '✅ Проверены' },
          { id: 'changed',   label: '⚠️ Изменены' },
          { id: 'error',     label: '❌ Ошибки' },
          { id: 'unchecked', label: '⏳ Ожидают' },
        ].map(f => (
          <motion.button key={f.id} onClick={() => setFilter(f.id)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all \${
              filter === f.id
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                : 'bg-[#171425] text-text-secondary border border-purple-900/20 hover:border-purple-700/40'
            }`}>{f.label}</motion.button>
        ))}

        <motion.button onClick={bulkValidateAll} disabled={bulkRunning || stats.unchecked === 0}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 flex items-center gap-1.5 transition-all">
          <RefreshCw size={12} className={bulkRunning ? 'animate-spin' : ''} />
          {bulkRunning ? 'Проверка...' : `Проверить все (\${stats.unchecked})`}
        </motion.button>
      </div>

      {/* Account list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-text-secondary text-sm py-8">Нет аккаунтов</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((acc, i) => {
            const st = STATUS_BADGE[acc.validation_status || 'unchecked'] || STATUS_BADGE['unchecked'];
            const severity = acc.validation_severity;
            const changes = acc.validation_changes || [];
            const isChecking = validating === acc.id || acc.validation_status === 'recheck_pending';

            return (
              <motion.div key={acc.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={`bg-[#171425] border rounded-xl p-3 transition-all \${
                  severity === 'critical'
                    ? 'border-red-700/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                    : 'border-purple-900/20 hover:border-purple-700/40'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{acc.title}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap \${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                      <span className="bg-purple-900/20 px-1.5 py-0.5 rounded text-purple-300">{acc.category}</span>
                      {acc.last_validated_at && (
                        <span>{new Date(acc.last_validated_at).toLocaleString('ru-RU')}</span>
                      )}
                      {changes.length > 0 && (
                        <span className="text-yellow-400 flex items-center gap-0.5">
                          <AlertTriangle size={9} /> {changes.length} изм.
                        </span>
                      )}
                    </div>
                  </div>

                  <motion.button
                    onClick={() => triggerRecheck(acc.id)}
                    disabled={isChecking}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/40 disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
                  </motion.button>
                </div>

                {/* Show changes if any */}
                {changes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-purple-900/20 flex flex-wrap gap-1.5">
                    {changes.map((ch: any, ci: number) => (
                      <span key={ci} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium \${
                        ch.severity === 'critical'
                          ? 'bg-red-900/30 text-red-400 border border-red-700/30'
                          : ch.severity === 'warning'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30'
                            : 'bg-blue-900/30 text-blue-400 border border-blue-700/30'
                      }`}>
                        {ch.field}: {String(ch.old ?? '—')} → {String(ch.new ?? '—')}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModerationPanel;