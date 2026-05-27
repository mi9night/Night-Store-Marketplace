import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  AlertCircle, Send, Trash2, RefreshCw, AlertOctagon, X,
  Image, Paperclip, ZoomIn, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Account } from '../types';
import { Page } from '../types/pages';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/RoleBadge';
import { LevelBadge } from '../components/LevelBadge';
import { UserLink } from '../components/UserLink';
import ReportButton from '../components/ReportButton';
import LabelManager from '../components/LabelManager';
import { useCurrency } from '../lib/CurrencyContext';

interface ProductPageProps {
  account: Account;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

const riskConfig = {
  low:    { label: 'Низкий риск',  className: 'bg-green-900/20 border-green-700/40 text-green-400',   Icon: CheckCircle2,  desc: 'Аккаунт прошёл AI проверку. Минимальный риск блокировки.' },
  medium: { label: 'Средний риск', className: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400', Icon: AlertTriangle, desc: 'Есть некоторые факторы риска. Рекомендуем использовать осторожно.' },
  high:   { label: 'Высокий риск', className: 'bg-red-900/20 border-red-700/40 text-red-400',          Icon: XCircle,       desc: 'Аккаунт имеет признаки возможной блокировки. Покупайте с осторожностью.' },
};

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
};

// ─── Fullscreen Image Viewer ───────────────────────────────────────────────
const ImageViewer: React.FC<{
  images: { url: string; name: string }[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center"
        onClick={onClose}
      >
        {/* Close */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
          onClick={onClose}
        >
          <X size={20} />
        </motion.button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full">
            {idx + 1} / {images.length}
          </div>
        )}

        {/* Image */}
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-[90vw] max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={images[idx].url}
            alt={images[idx].name}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </motion.div>

        {/* Filename */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-xs text-white/50"
        >
          {images[idx].name}
        </motion.p>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-purple-500' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── File Attachment Component ─────────────────────────────────────────────
const FileAttachRow: React.FC<{
  files: File[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  totalSize: number;
}> = ({ files, onAdd, onRemove, totalSize }) => {
  const pct = Math.round((totalSize / MAX_TOTAL_SIZE) * 100);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer group">
          <div className="flex items-center justify-center gap-2 py-2.5 bg-purple-900/20 border border-purple-700/40 rounded-xl text-sm text-purple-300 hover:bg-purple-900/30 group-hover:border-purple-500/60 transition-all">
            <Image size={15} />
            <span>Фото ({files.filter(f => f.type.startsWith('image/')).length}/{MAX_FILES})</span>
          </div>
          <input type="file" multiple accept="image/*" onChange={onAdd} className="hidden" />
        </label>
        <label className="flex-1 cursor-pointer group">
          <div className="flex items-center justify-center gap-2 py-2.5 bg-purple-900/20 border border-purple-700/40 rounded-xl text-sm text-purple-300 hover:bg-purple-900/30 group-hover:border-purple-500/60 transition-all">
            <Paperclip size={15} />
            <span>Файлы ({files.length}/{MAX_FILES})</span>
          </div>
          <input type="file" multiple onChange={onAdd} className="hidden" />
        </label>
      </div>

      {/* Size bar */}
      <div>
        <div className="flex justify-between text-[10px] text-text-secondary mb-1">
          <span>{formatBytes(totalSize)} / 25 МБ</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1 bg-purple-900/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-purple-500'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map((f, i) => (
          <motion.div
            key={`${f.name}-${i}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-[#0B0A12] border border-purple-900/20 px-3 py-2 rounded-lg"
          >
            {f.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Paperclip size={12} className="text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{f.name}</p>
              <p className="text-[10px] text-text-secondary">{formatBytes(f.size)}</p>
            </div>
            <button
              onClick={() => onRemove(i)}
              className="text-text-secondary hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const ProductPage: React.FC<ProductPageProps> = ({ account, setCurrentPage, onAddToCart }) => {
  const [buying, setBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [myRole, setMyRole] = useState<string>('user');
  const [myOrder, setMyOrder] = useState<any>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revPositive, setRevPositive] = useState(true);
  const [revText, setRevText] = useState('');
  const [revSending, setRevSending] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState({ sales: 0, rating: 0, positive: 0, reviewsCount: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'stats' | 'history'>('reviews');
  const [showChat, setShowChat] = useState(false);
  const { convert, symbol, currency } = useCurrency();
  const [chatMsg, setChatMsg] = useState('');
  const [checkingChanges, setCheckingChanges] = useState(false);

  // Dispute modal
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('Проблемы с аккаунтом');
  const [ticketSubject, setTicketSubject] = useState('');
  const [disputeAnswer, setDisputeAnswer] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [modalShake, setModalShake] = useState(false);

  // Image viewer
  const [viewerImages, setViewerImages] = useState<{ url: string; name: string }[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const risk = riskConfig[account.riskLevel as keyof typeof riskConfig] || riskConfig.low;

  const totalAttachSize = attachedFiles.reduce((s, f) => s + f.size, 0);

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);

      if (u.user) {
        const { data: meData } = await supabase.from('users').select('role').eq('id', u.user.id).maybeSingle();
        setMyRole(meData?.role || 'user');

        const { data: f } = await supabase.from('favorites')
          .select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (f) setIsFav(true);

        const { data: ord } = await supabase.from('orders')
          .select('*').eq('buyer_id', u.user.id).eq('account_id', account.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (ord) {
          setMyOrder(ord);
          const { data: rev } = await supabase.from('reviews')
            .select('*').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
          if (rev) setMyReview(rev);
        }
      }

      const sellerId = (account.seller as any)?.id;
      if (sellerId) {
        const { data: s } = await supabase.from('users').select('*').eq('id', sellerId).maybeSingle();
        if (s) {
          const { data: cr } = await supabase.from('user_custom_roles')
            .select('id, label, icon, color, description, has_glow, has_pulse').eq('user_id', sellerId);
          if (cr && cr.length > 0) (s as any).custom_roles = cr;
        }
        setSeller(s);

        const { data: r, count } = await supabase.from('reviews')
          .select('*', { count: 'exact' })
          .eq('target_user_id', sellerId)
          .order('created_at', { ascending: false });
        const reviewsList = r || [];

        const authorIds = [...new Set(reviewsList.map((rv: any) => rv.user_id).filter(Boolean))];
        if (authorIds.length > 0) {
          const { data: authors } = await supabase.from('users')
            .select('id, username, avatar_url, custom_id').in('id', authorIds);
          const aMap: Record<string, any> = {};
          authors?.forEach((a: any) => { aMap[a.id] = a; });
          reviewsList.forEach((rv: any) => { if (aMap[rv.user_id]) rv.author = aMap[rv.user_id]; });
        }

        let rating = Number(s?.rating) || 0;
        if (rating === 0 && reviewsList.length > 0) {
          const withRating = reviewsList.filter((r: any) => r.rating);
          if (withRating.length > 0) {
            rating = withRating.reduce((sum: number, r: any) => sum + r.rating, 0) / withRating.length;
          } else {
            rating = reviewsList.reduce((sum: number, r: any) => sum + (r.positive ? 5 : 1), 0) / reviewsList.length;
          }
        }
        const positive = reviewsList.filter((r: any) => r.positive).length;
        const positivePct = reviewsList.length > 0 ? Math.round(positive / reviewsList.length * 100) : 0;

        setReviews(reviewsList);
        setSellerStats({ sales: s?.sales || 0, rating, positive: positivePct, reviewsCount: count || reviewsList.length });
      }
    };
    load();
  }, [account.id]);

  const handleBuy = async () => {
    setBuyResult(null);
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc('purchase_account', { p_account_id: account.id });
      if (error) throw error;
      if (data?.ok) {
        setBuyResult({ type: 'ok', text: '✅ Куплено! Аккаунт в "Мои покупки"' });
        setTimeout(() => setCurrentPage('purchases'), 1800);
      } else {
        const errMap: Record<string, string> = {
          insufficient_balance: 'Недостаточно средств на балансе',
          account_not_available: 'Аккаунт уже продан',
          account_not_found: 'Аккаунт не найден',
          cannot_buy_own: 'Нельзя купить свой же аккаунт',
          not_authenticated: 'Войдите в систему',
        };
        setBuyResult({ type: 'err', text: errMap[data?.error] || data?.error });
      }
    } catch (e: any) {
      setBuyResult({ type: 'err', text: e.message });
    } finally {
      setBuying(false);
    }
  };

  const handleFav = async () => {
    if (!me) { alert('Войдите в систему'); return; }
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', me.id).eq('account_id', account.id);
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: me.id, account_id: account.id });
      setIsFav(true);
    }
  };

  const sendMessage = async () => {
    if (!chatMsg.trim() || !me || !seller) return;
    await supabase.from('messages').insert({
      sender_id: me.id,
      receiver_id: seller.id,
      text: chatMsg,
      is_read: false,
    });
    setChatMsg('');
    setShowChat(false);
    alert('✅ Сообщение отправлено!');
  };

  const checkAccountChanges = async () => {
    setCheckingChanges(true);
    setTimeout(() => {
      alert(`Проверка изменений аккаунта #${account.id.slice(0, 8)}\n\n(Здесь будет результат проверки почты и пароля)`);
      setCheckingChanges(false);
    }, 700);
  };

  const openDisputeModal = () => {
    if (!me || !myOrder) {
      alert('Открыть спор можно только на купленных аккаунтах');
      return;
    }
    setTicketCategory('Проблемы с аккаунтом');
    setTicketSubject(`Спор по аккаунту: ${account.title}`);
    setDisputeAnswer('');
    setProblemDescription('');
    setAttachedFiles([]);
    setTicketCreated(false);
    setShowTicketModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    let currentTotal = attachedFiles.reduce((s, f) => s + f.size, 0);

    for (const file of files) {
      if (attachedFiles.length + validFiles.length >= MAX_FILES) {
        alert(`Максимум ${MAX_FILES} файла`);
        break;
      }
      if (currentTotal + file.size > MAX_TOTAL_SIZE) {
        alert('Общий размер файлов не должен превышать 25 МБ');
        continue;
      }
      validFiles.push(file);
      currentTotal += file.size;
    }
    setAttachedFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (i: number) => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i));

  const createTicket = async () => {
    if (!me || !myOrder || !ticketSubject.trim()) {
      setModalShake(true);
      setTimeout(() => setModalShake(false), 500);
      return;
    }
    setCreatingTicket(true);

    let filesInfo = '';
    if (attachedFiles.length > 0) {
      filesInfo = '\n\nПрикреплённые файлы:\n' +
        attachedFiles.map(f => `- ${f.name} (${formatBytes(f.size)})`).join('\n');
    }

    const fullDescription =
`Товар: ${account.title}
Цена: ${account.price} ₽

Вопрос: Вели ли вы общение ещё где-то кроме нашего сайта?
Ответ: ${disputeAnswer || '—'}

Опишите проблему:
${problemDescription || '—'}${filesInfo}`;

    try {
      const { error } = await supabase.from('tickets').insert({
        reporter_id: me.id,
        category: ticketCategory,
        subject: ticketSubject,
        description: fullDescription,
        target_type: 'account',
        target_id: account.id,
        accused_id: (account.seller as any)?.id || null,
        status: 'open',
      });

      if (error) {
        alert('Не удалось создать тикет.');
        return;
      }

      setTicketCreated(true);
      setTimeout(() => {
        setShowTicketModal(false);
        setTicketCreated(false);
        setCurrentPage('support');
      }, 2200);
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setCreatingTicket(false);
    }
  };

  const infoItems = [
    { icon: Clock,    label: 'Последний вход',  value: account.lastLogin || '—' },
    { icon: MapPin,   label: 'Страна',          value: account.country || '—' },
    ...(account.gamesCount ? [{ icon: Gamepad2, label: 'Игр', value: `${account.gamesCount}` }] : []),
    { icon: Mail,     label: 'Родная почта',    value: account.hasOriginalEmail ? 'Есть ✅' : 'Нет ❌' },
    { icon: Mail,     label: 'Временная почта', value: account.hasTempEmail ? 'Есть ✅' : 'Нет ❌' },
    { icon: Shield,   label: 'Гарантия',        value: account.guarantee ? `${account.guaranteeHours}ч` : 'Нет' },
    { icon: Lock,     label: 'Escrow',          value: account.escrow ? 'Активна' : 'Нет' },
    { icon: Eye,      label: 'Просмотров',      value: (account.views || 0).toLocaleString('ru-RU') },
  ];

  const isAdmin = ['admin', 'owner', 'moderator'].includes(myRole);

  // Shake animation variant
  const shakeVariant = {
    shake: {
      x: [-8, 8, -6, 6, -4, 4, 0],
      transition: { duration: 0.45 },
    },
    idle: { x: 0 },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        onClick={() => setCurrentPage('market')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-6"
        whileHover={{ x: -2 }}
      >
        <ArrowLeft size={16} /> Назад к маркету
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-full uppercase font-semibold">
                    {account.category}
                  </span>
                  {account.escrow && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 font-semibold">
                      <Shield size={10} /> Escrow
                    </span>
                  )}
                  {account.guarantee && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-green-900/20 border border-green-700/40 text-green-400 font-semibold">
                      <Shield size={10} /> {account.guaranteeHours}ч гарантия
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">{account.title}</h1>
              </div>
              <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={handleFav}>
                <Heart size={22} className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-text-secondary hover:text-red-400'}`} />
              </motion.button>
            </div>

            <div className={`flex items-start gap-3 p-3 rounded-xl border mb-4 ${risk.className}`}>
              <risk.Icon size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">AI Оценка: {risk.label}</p>
                <p className="text-xs opacity-80 mt-0.5">{risk.desc}</p>
              </div>
            </div>

            {account.description && (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{account.description}</p>
            )}

            <div className="mt-3 pt-3 border-t border-purple-900/20">
              <LabelManager targetType="account" targetId={account.id} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={16} className="text-purple-400" /> Параметры аккаунта
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {infoItems.map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-[#0B0A12] rounded-xl p-3 border border-purple-900/20 hover:border-purple-700/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <item.icon size={13} className="text-purple-400 flex-shrink-0" />
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider truncate">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 lg:sticky lg:top-20">
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {convert(account.price).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })}
                </span>
                <span className="text-text-secondary">{symbol}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {myOrder && (
                <div className="text-center p-3 bg-green-900/20 border border-green-700/30 rounded-xl text-sm text-green-400">
                  ✅ Куплено вами
                </div>
              )}

              {buyResult && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center p-3 rounded-xl text-sm ${
                    buyResult.type === 'ok'
                      ? 'bg-green-900/20 border border-green-700/30 text-green-400'
                      : 'bg-red-900/20 border border-red-700/30 text-red-400'
                  }`}
                >
                  {buyResult.text}
                </motion.div>
              )}

              <motion.button onClick={handleBuy} disabled={buying || !!myOrder}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-all">
                <Zap size={18} />
                {buying ? 'Покупка...' : 'Купить сейчас'}
              </motion.button>

              <motion.button onClick={() => onAddToCart(account)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-900/20 border border-purple-800/30 text-white hover:border-purple-500 hover:bg-purple-900/40 transition-all">
                <ShoppingCart size={18} /> В корзину
              </motion.button>

              {myOrder && (
                <motion.button
                  onClick={openDisputeModal}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
                             bg-red-900/20 border border-red-700/40 text-red-400 hover:bg-red-900/30
                             hover:border-red-600/60 transition-all shadow-[0_0_12px_rgba(239,68,68,0.12)]"
                >
                  <AlertOctagon size={18} /> Открыть спор
                </motion.button>
              )}

              {isAdmin && (
                <button
                  onClick={checkAccountChanges}
                  disabled={checkingChanges}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-blue-900/20 border border-blue-700/40 text-blue-400 hover:bg-blue-900/30 disabled:opacity-50 transition-all"
                >
                  <RefreshCw size={16} className={checkingChanges ? 'animate-spin' : ''} />
                  Проверить изменения
                </button>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-purple-900/20">
              {[
                { icon: Shield,       text: `${account.guaranteeHours || 24}ч гарантия`, sub: 'Возврат средств',  color: 'text-green-400'  },
                { icon: Lock,         text: 'Escrow защита',                              sub: 'Безопасная сделка', color: 'text-purple-300' },
                { icon: CheckCircle2, text: 'Проверено AI',                               sub: 'Оценка риска',      color: 'text-blue-400'   },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <item.icon size={16} className={item.color} />
                  <div>
                    <p className="text-xs font-medium text-white">{item.text}</p>
                    <p className="text-xs text-text-secondary">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ DISPUTE MODAL ═══════════════════ */}
      <AnimatePresence>
        {showTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !creatingTicket && setShowTicketModal(false)}
          >
            <motion.div
              variants={shakeVariant}
              animate={modalShake ? 'shake' : 'idle'}
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(139,92,246,0.15)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header top line */}
              <div className="h-0.5 w-full rounded-t-2xl bg-purple-600/40" />

              <div className="p-7">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-700/40 flex items-center justify-center">
                      <AlertOctagon size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Открыть спор</h3>
                      <p className="text-xs text-text-secondary mt-0.5">Опишите проблему как можно подробнее</p>
                    </div>
                  </div>
                  {!creatingTicket && (
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {ticketCreated ? (
                    /* ── Success state ── */
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-10 space-y-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto"
                      >
                        <CheckCircle2 size={40} className="text-green-400" />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <h3 className="text-xl font-bold text-white mb-2">Тикет создан!</h3>
                        <p className="text-text-secondary text-sm">Перенаправляем в раздел Поддержки...</p>
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, delay: 0.3 }}
                        className="h-0.5 bg-purple-600/60 rounded-full mx-auto max-w-xs"
                      />
                    </motion.div>
                  ) : (
                    /* ── Form ── */
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                      {/* Category (disabled) */}
                      <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block uppercase tracking-wider">
                          Категория
                        </label>
                        <div className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-purple-900/20 text-text-secondary text-sm flex items-center gap-2">
                          <Lock size={13} className="text-purple-600" />
                          Проблемы с аккаунтом
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="text-xs font-medium text-text-secondary mb-1.5 block uppercase tracking-wider">
                          Тема
                        </label>
                        <input
                          type="text"
                          value={ticketSubject}
                          onChange={e => setTicketSubject(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                        />
                      </div>

                      {/* Info card */}
                      <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl overflow-hidden">
                        {/* Product info */}
                        <div className="p-4 border-b border-purple-900/20 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Товар</p>
                            <p className="text-sm text-white font-medium truncate">{account.title}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Цена</p>
                            <p className="text-sm text-white font-medium">{account.price} ₽</p>
                          </div>
                        </div>

                        {/* Question */}
                        <div className="p-4 border-b border-purple-900/20">
                          <p className="text-xs text-purple-300 font-medium mb-2">
                            Вели ли вы общение ещё где-то кроме нашего сайта?
                          </p>
                          <textarea
                            value={disputeAnswer}
                            onChange={e => setDisputeAnswer(e.target.value)}
                            placeholder="Ваш ответ..."
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#171425] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all"
                          />
                        </div>

                        {/* Problem */}
                        <div className="p-4 border-b border-purple-900/20">
                          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Опишите проблему</p>
                          <textarea
                            value={problemDescription}
                            onChange={e => setProblemDescription(e.target.value)}
                            placeholder="Опишите ситуацию подробно..."
                            rows={5}
                            className="w-full px-3 py-2.5 rounded-lg bg-[#171425] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all"
                          />
                        </div>

                        {/* Attachments */}
                        <div className="p-4">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-3">
                            Прикрепить файлы
                          </p>
                          <FileAttachRow
                            files={attachedFiles}
                            onAdd={handleFileSelect}
                            onRemove={removeFile}
                            totalSize={totalAttachSize}
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <motion.button
                        onClick={createTicket}
                        disabled={creatingTicket || !ticketSubject.trim()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {creatingTicket ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Создаём тикет...
                          </>
                        ) : (
                          <>
                            <AlertOctagon size={16} />
                            Открыть спор
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image viewer */}
      {viewerImages && (
        <ImageViewer
          images={viewerImages}
          startIndex={viewerIndex}
          onClose={() => setViewerImages(null)}
        />
      )}
    </div>
  );
};

export default ProductPage;