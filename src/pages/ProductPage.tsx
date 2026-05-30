import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  AlertCircle, Send, Trash2, RefreshCw, AlertOctagon, X,
  Image, Paperclip, ZoomIn, ChevronLeft, ChevronRight, Crown,
  ThumbsUp, ThumbsDown, Award, ShoppingBag, Copy, KeyRound, Inbox, ExternalLink, ShieldOff
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

const getCredentialGroups = (data: Record<string, any>) => {
  const entries = Object.entries(data || {});
  const normalize = (key: string) => key.toLowerCase().trim();
  const emailKeyEntry = entries.find(([key]) => /@/.test(key));

  const findValue = (pred: (key: string) => boolean) => {
    const hit = entries.find(([key]) => pred(normalize(key)));
    return hit ? String(hit[1]) : '';
  };

  const accountLogin =
    findValue(k => ['почта', 'логин', 'email', 'login'].includes(k)) ||
    (emailKeyEntry ? String(emailKeyEntry[0]) : '');

  const accountPassword =
    findValue(k => k === 'пароль' || k === 'password') ||
    (emailKeyEntry ? String(emailKeyEntry[1]) : '');

  const mailEmail =
    findValue(k => k.includes('родная почта') || k.includes('временная почта') || k.includes('почта от почты') || k.includes('mail email')) ||
    accountLogin;

  const mailPassword =
    findValue(k => k.includes('пароль от почты') || k.includes('пароль от врем') || k.includes('mail password') || k.includes('email password')) ||
    accountPassword;

  const used = new Set<string>();
  entries.forEach(([key]) => {
    const k = normalize(key);
    if (
      key === accountLogin ||
      ['почта', 'логин', 'email', 'login', 'пароль', 'password'].includes(k) ||
      k.includes('родная почта') || k.includes('временная почта') || k.includes('почта от почты') ||
      k.includes('пароль от почты') || k.includes('пароль от врем') ||
      k.includes('mail password') || k.includes('email password') ||
      k.includes('mail email') || k.includes('код') || k.includes('code') || k.includes('письм') || k.includes('letter')
    ) used.add(key);
  });

  const additional = entries.filter(([key]) => !used.has(key));
  return { accountLogin, accountPassword, mailEmail, mailPassword, additional };
};

const getMailLoginUrl = (emailOrDomain?: string) => {
  const domain = (emailOrDomain?.match(/@([^@\s]+)$/)?.[1] || emailOrDomain || '').toLowerCase();
  if (!domain) return 'https://mail.google.com/';
  if (domain.includes('gmail')) return 'https://mail.google.com/';
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live.com')) return 'https://outlook.live.com/mail/';
  if (domain.includes('mail.ru') || domain.includes('bk.ru') || domain.includes('inbox.ru') || domain.includes('list.ru')) return 'https://e.mail.ru/login';
  if (domain.includes('yandex')) return 'https://mail.yandex.ru/';
  if (domain.includes('rambler')) return 'https://mail.rambler.ru/';
  if (domain.includes('proton')) return 'https://mail.proton.me/';
  if (domain.includes('icloud')) return 'https://www.icloud.com/mail';
  if (domain.includes('yahoo')) return 'https://mail.yahoo.com/';
  return `https://${domain}`;
};

const CredentialRow: React.FC<{ label: string; value?: string; onCopy: (value: string) => void }> = ({ label, value, onCopy }) => (
  <div className="flex items-center gap-2 bg-bg-card rounded-lg p-2">
    <span className="text-[10px] text-text-secondary uppercase min-w-[92px]">{label}:</span>
    <span className="text-xs text-white flex-1 font-mono truncate">{value || '—'}</span>
    {value && <button onClick={() => onCopy(value)} className="p-1 text-purple-300 hover:text-white" title="Копировать"><Copy size={12} /></button>}
  </div>
);

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
  const [productMailModal, setProductMailModal] = useState<null | { type: 'code' | 'letter'; accepted: boolean }>(null);
  const [productGuaranteeVoided, setProductGuaranteeVoided] = useState(false);
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

  // Purchase success modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Validation data
  const [validation, setValidation] = useState<any>(null);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);

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

        // Load account info for each review (title + price)
        const reviewAccountIds = [...new Set(reviewsList.map((rv: any) => rv.account_id).filter(Boolean))];
        if (reviewAccountIds.length > 0) {
          const { data: accs } = await supabase.from('accounts')
            .select('id, title, price, category').in('id', reviewAccountIds);
          const accMap: Record<string, any> = {};
          accs?.forEach((a: any) => { accMap[a.id] = a; });
          reviewsList.forEach((rv: any) => {
            if (rv.account_id && accMap[rv.account_id]) {
              rv.account_title = accMap[rv.account_id].title;
              rv.account_price = accMap[rv.account_id].price;
              rv.account_category = accMap[rv.account_id].category;
            }
          });
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

      // Load validation data
      const { data: val } = await supabase
        .from('account_validations')
        .select('*')
        .eq('account_id', account.id)
        .maybeSingle();
      if (val) setValidation(val);

      const { data: valHist } = await supabase
        .from('validation_history')
        .select('*')
        .eq('account_id', account.id)
        .order('checked_at', { ascending: false })
        .limit(5);
      if (valHist) setValidationHistory(valHist);
    };
    load();
  }, [account.id]);

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); alert('✅ Скопировано'); } catch {}
  };

  const extractMailCode = () => {
    const data = (account as any).accountData || {};
    const hit = Object.entries(data).find(([k]) => /код|code|2fa|otp/i.test(k));
    if (hit) return String(hit[1]);
    return String(account.id).replace(/\D/g, '').slice(0, 6).padEnd(6, '0');
  };

  const extractMailLetter = () => {
    const data = (account as any).accountData || {};
    const hit = Object.entries(data).find(([k]) => /письм|letter|mail text/i.test(k));
    if (hit) return String(hit[1]);
    return 'Последнее письмо будет отображено здесь после подключения почтового бота. Если письмо не появляется — откройте почту вручную или обратитесь в поддержку.';
  };

  const handleBuy = async () => {
    setBuyResult(null);
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc('purchase_account', { p_account_id: account.id });
      if (error) throw error;
      if (data?.ok) {
        setShowPurchaseModal(true);
        setMyOrder({ id: data.order_id || 'new', account_id: account.id });
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
    try {
      // Trigger recheck by setting status
      await supabase.from('accounts').update({
        validation_status: 'recheck_pending',
      }).eq('id', account.id);

      // Poll for result (bot will pick it up via realtime)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: val } = await supabase
          .from('account_validations')
          .select('*')
          .eq('account_id', account.id)
          .maybeSingle();

        if (val && val.checked_at && new Date(val.checked_at).getTime() > Date.now() - 30000) {
          clearInterval(poll);
          setValidation(val);
          setCheckingChanges(false);

          // Reload history
          const { data: hist } = await supabase
            .from('validation_history')
            .select('*')
            .eq('account_id', account.id)
            .order('checked_at', { ascending: false })
            .limit(5);
          if (hist) setValidationHistory(hist);
        }

        if (attempts > 20) {
          clearInterval(poll);
          setCheckingChanges(false);
        }
      }, 1500);
    } catch {
      setCheckingChanges(false);
    }
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

  // ─── Hidden fields (never show to buyers) ──────────────────────────────
  const HIDDEN_FIELDS = new Set([
    'steam_id', 'steamid', 'steamId', 'discord_id', 'discordId',
    'minecraft_username', 'roblox_username', 'telegram_username',
    'epic_email', 'ea_email', 'ubi_email', 'rockstar_email',
    'mihoyo_uid', 'wot_nickname', 'wg_nickname',
    'tiktok_username', 'instagram_username',
    'supercell_tag', 'Логин', 'Пароль', 'login', 'password',
    'Родная почта', 'Временная почта', 'Пароль от почты',
    'Пароль от врем. почты', 'original_email_error', 'temp_email_error',
    'original_email_server', 'epic_email_provided', 'ea_email_provided',
    'ubi_email_provided', 'rockstar_email_provided',
    'steam_id_resolved', 'uuid', 'skin_url',
    '_note', '_checker', '_verified_by_api',
    '_error', '_bans_error', 'persona_name', 'profile_url', 'avatar_url',
    'steam_id', 'account_created', 'profile_state',
  ]);

  // ─── Label mapping for display ────────────────────────────────────────
  const FIELD_LABELS: Record<string, { label: string; icon: any }> = {
    games_count:     { label: 'Игры',              icon: Gamepad2 },
    hours_played:    { label: 'Часов',             icon: Clock },
    hours:           { label: 'Часов',             icon: Clock },
    level:           { label: 'Уровень',           icon: Star },
    rank:            { label: 'Ранг',              icon: Shield },
    prime:           { label: 'Prime',             icon: CheckCircle2 },
    skins_count:     { label: 'Скинов',            icon: Package },
    og_skins:        { label: 'OG Скины',          icon: Star },
    vbucks:          { label: 'V-Bucks',           icon: Zap },
    battle_pass:     { label: 'Battle Pass',       icon: Shield },
    robux:           { label: 'Robux',             icon: Zap },
    premium:         { label: 'Premium',           icon: Crown },
    tg_premium:      { label: 'TG Premium',        icon: Crown },
    limiteds:        { label: 'Limiteds',          icon: Star },
    nitro:           { label: 'Nitro',             icon: Zap },
    nitro_until:     { label: 'Nitro до',          icon: Clock },
    badges:          { label: 'Бейджи',            icon: Star },
    servers:         { label: 'Серверов',           icon: Users },
    followers:       { label: 'Подписчики',        icon: Users },
    following:       { label: 'Подписки',          icon: Users },
    likes:           { label: 'Лайки',             icon: Heart },
    posts:           { label: 'Постов',            icon: MessageSquare },
    videos:          { label: 'Видео',             icon: Eye },
    verified:        { label: 'Верификация',       icon: CheckCircle2 },
    monetization:    { label: 'Монетизация',       icon: Zap },
    subscribers:     { label: 'Подписчики',        icon: Users },
    tg_stars:        { label: 'TG Stars',          icon: Star },
    tg_type:         { label: 'Тип',               icon: Tag },
    tg_theme:        { label: 'Тематика',          icon: Tag },
    ai_service:      { label: 'Сервис',            icon: Zap },
    nn_service:      { label: 'Нейросеть',         icon: Zap },
    plan_type:       { label: 'Подписка',          icon: Shield },
    expires:         { label: 'Действует до',       icon: Clock },
    subscription_expires: { label: 'Действует до', icon: Clock },
    subscription_active:  { label: 'Подписка',     icon: CheckCircle2 },
    api_access:      { label: 'Доступ к API',      icon: Lock },
    credits:         { label: 'Кредиты',           icon: Zap },
    vpn_provider:    { label: 'Провайдер',         icon: Shield },
    devices:         { label: 'Устройств',         icon: Users },
    simultaneous:    { label: 'Подключений',       icon: Users },
    battles:         { label: 'Боёв',              icon: Shield },
    winrate:         { label: 'Винрейт',           icon: Star },
    max_tier:        { label: 'Макс. тир',         icon: Shield },
    trophies:        { label: 'Трофеи',            icon: Star },
    sc_game:         { label: 'Игра',              icon: Gamepad2 },
    edition:         { label: 'Издание',           icon: Package },
    cape:            { label: 'Плащ',              icon: Star },
    optifine:        { label: 'OptiFine',          icon: Star },
    gta_level:       { label: 'Уровень GTA',       icon: Star },
    gta_money:       { label: 'Деньги GTA',        icon: Zap },
    rdr_level:       { label: 'Уровень RDR2',      icon: Star },
    ea_play:         { label: 'EA Play',            icon: Zap },
    apex_level:      { label: 'Уровень Apex',      icon: Star },
    r6_rank:         { label: 'Ранг R6',            icon: Shield },
    ar_level:        { label: 'AR / Уровень',       icon: Star },
    five_star:       { label: '5★ персонажей',     icon: Star },
    primogems:       { label: 'Примогемы',         icon: Zap },
    server:          { label: 'Сервер',            icon: MapPin },
    mhy_game:        { label: 'Игра',              icon: Gamepad2 },
    wot_server:      { label: 'Сервер',            icon: MapPin },
    region:          { label: 'Регион',            icon: MapPin },
    account_age_days:{ label: 'Возраст акк.',      icon: Clock },
    days_remaining:  { label: 'Осталось дней',     icon: Clock },
    friends_count:   { label: 'Друзей',            icon: Users },
    original_email_verified: { label: 'Родная почта',   icon: Mail },
    temp_email_verified:     { label: 'Врем. почта',    icon: Mail },

    // ── Bot auto-filled fields (Steam) ──────────────────────────
    vac_bans_count:  { label: 'VAC банов',         icon: Shield },
    game_bans_count: { label: 'Game банов',        icon: Shield },
    days_since_last_ban: { label: 'Дней с бана',   icon: Clock },
    cs2_hours_total: { label: 'CS2 часов',         icon: Gamepad2 },
    cs2_hours_2weeks:{ label: 'CS2 за 2 нед.',     icon: Clock },

    // ── Bot auto-filled (Roblox) ────────────────────────────────
    display_name:    { label: 'Имя Roblox',        icon: Users },
    followers_count: { label: 'Подписчиков',       icon: Users },

    // ── Bot auto-filled (Discord) ───────────────────────────────
    global_name:     { label: 'Имя',               icon: Users },
    nitro_status:    { label: 'Nitro',             icon: Zap },
    banner:          { label: 'Баннер',            icon: Star },

    // ── Bot auto-filled (Minecraft) ─────────────────────────────
    current_name:    { label: 'Ник MC',            icon: Users },

    // ── Bot auto-filled (Telegram) ──────────────────────────────
    members_count:   { label: 'Участников',        icon: Users },
    account_active:  { label: 'Аккаунт активен',   icon: CheckCircle2 },
    tg_title:        { label: 'Название',          icon: Tag },
    type:            { label: 'Тип',               icon: Tag },

    // ── Subscription / VPN ──────────────────────────────────────
    devices_count:   { label: 'Устройств',         icon: Users },

    // ── WoT / Wargaming ─────────────────────────────────────────
    max_tier_tank:   { label: 'Макс. тир',         icon: Shield },
  };

  // ─── Format value for display ─────────────────────────────────────────
  const formatFieldValue = (key: string, val: any): string => {
    if (val === true) return 'Есть ✅';
    if (val === false) return 'Нет ❌';
    if (val === null || val === undefined || val === '') return '—';
    if (key === 'account_age_days' && typeof val === 'number') return `${val} дн.`;
    if (key === 'days_remaining' && typeof val === 'number') return `${val} дн.`;
    if (key === 'winrate') return `${val}%`;
    if (typeof val === 'number') return val.toLocaleString('ru-RU');
    return String(val);
  };

  // ─── Build dynamic info items ─────────────────────────────────────────
  const accountData = (account as any).accountData || {};
  const validationData = validation?.checked_data || {};

  // Merge: validation data takes priority (it's verified), then account seller data
  const mergedData = { ...accountData, ...validationData };

  const dynamicItems: { icon: any; label: string; value: string }[] = [];

  // Always show these base fields
  if (account.gamesCount || mergedData.games_count) {
    dynamicItems.push({ icon: Gamepad2, label: 'Игры', value: String(mergedData.games_count || account.gamesCount || '—') });
  }
  dynamicItems.push({ icon: Mail, label: 'Родная почта', value: account.hasOriginalEmail ? 'Есть ✅' : 'Нет ❌' });
  dynamicItems.push({ icon: Mail, label: 'Временная почта', value: account.hasTempEmail ? 'Есть ✅' : 'Нет ❌' });
  dynamicItems.push({ icon: Shield, label: 'Гарантия', value: account.guarantee ? `${account.guaranteeHours}ч` : 'Только при покупке' });
  dynamicItems.push({ icon: Lock, label: 'Escrow', value: account.escrow ? 'Активна' : 'Нет' });
  dynamicItems.push({ icon: Eye, label: 'Просмотров', value: (account.views || 0).toLocaleString('ru-RU') });

  // Add category-specific fields from data (filter hidden)
  Object.entries(mergedData).forEach(([key, val]) => {
    if (HIDDEN_FIELDS.has(key)) return;
    if (key.startsWith('_')) return;
    if (val === null || val === undefined || val === '') return;

    // Skip already added
    if (key === 'games_count' && (account.gamesCount || dynamicItems.some(d => d.label === 'Игры'))) return;

    const fieldInfo = FIELD_LABELS[key];
    if (fieldInfo) {
      dynamicItems.push({
        icon: fieldInfo.icon,
        label: fieldInfo.label,
        value: formatFieldValue(key, val),
      });
    }
  });

  // Deduplicate by label
  const seenLabels = new Set<string>();
  const infoItems = dynamicItems.filter(item => {
    if (seenLabels.has(item.label)) return false;
    seenLabels.add(item.label);
    return true;
  });

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

          {myOrder && (() => {
            const data = (account as any).accountData || {};
            const groups = getCredentialGroups(data);
            const hasMailInfo = !!groups.mailEmail;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-[#171425] border border-green-800/30 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-green-400" /> Данные купленного аккаунта</h3>
                <div className="space-y-3">
                  <div><p className="text-[10px] text-text-secondary uppercase mb-2">Данные аккаунта</p><div className="space-y-2"><CredentialRow label="Почта / логин" value={groups.accountLogin} onCopy={copyText} /><CredentialRow label="Пароль" value={groups.accountPassword} onCopy={copyText} /></div></div>
                  <div className="pt-3 border-t border-purple-900/20"><p className="text-[10px] text-text-secondary uppercase mb-2 flex items-center gap-1"><Mail size={11} /> Почта от аккаунта</p><div className="space-y-2"><CredentialRow label="Почта" value={groups.mailEmail} onCopy={copyText} /><CredentialRow label="Пароль почты" value={groups.mailPassword} onCopy={copyText} /></div></div>
                  {hasMailInfo && <div className="pt-3 border-t border-purple-900/20"><p className="text-[10px] text-text-secondary uppercase mb-2 flex items-center gap-1"><Mail size={11} /> Действия с почтой</p><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onClick={() => setProductMailModal({ type: 'code', accepted: false })} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-purple-300 rounded-lg text-xs font-semibold"><KeyRound size={12} /> Получить код</button><button onClick={() => setProductMailModal({ type: 'letter', accepted: false })} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-purple-300 rounded-lg text-xs font-semibold"><Inbox size={12} /> Получить письмо</button><button onClick={() => window.open(getMailLoginUrl(groups.mailEmail), '_blank', 'noopener,noreferrer')} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-900/20 hover:bg-green-900/40 border border-green-700/30 text-green-400 rounded-lg text-xs font-semibold"><ExternalLink size={12} /> Войти в почту</button></div></div>}
                </div>
              </motion.div>
            );
          })()}

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

          {/* === Review block (if purchased) === */}
          {myOrder && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className={`rounded-2xl p-5 border transition-colors ${
                (myReview && !myReview.positive) || (showReview && !revPositive)
                  ? 'bg-red-900/10 border-red-700/30'
                  : 'bg-green-900/10 border-green-700/30'
              }`}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Вы купили этот аккаунт</h3>
              </div>

              {myReview ? (
                <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      myReview.positive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {myReview.positive ? '👍 Положительный' : '👎 Отрицательный'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < myReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                  </div>
                  {myReview.text && <p className="text-sm text-white">{myReview.text}</p>}
                  <p className="text-xs text-text-secondary mt-2">✅ Ваш отзыв опубликован</p>
                </div>
              ) : (
                !showReview ? (
                  <button onClick={() => setShowReview(true)}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all">
                    ⭐ Оставить отзыв о продавце
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Оценка</label>
                      <div className="flex gap-2">
                        <button onClick={() => setRevPositive(true)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            revPositive ? 'bg-green-600 text-white' : 'bg-bg-secondary text-text-secondary'
                          }`}>
                          👍 Положительный
                        </button>
                        <button onClick={() => setRevPositive(false)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            !revPositive ? 'bg-red-600 text-white' : 'bg-bg-secondary text-text-secondary'
                          }`}>
                          👎 Отрицательный
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Звёзды</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setRevRating(n)}>
                            <Star size={20} className={n <= revRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={revText} onChange={e => setRevText(e.target.value)}
                      placeholder="Опишите ваш опыт..." rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all" />

                    {revMsg && (
                      <div className={`text-xs p-2 rounded-lg ${revMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                        {revMsg}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setShowReview(false)}
                        className="flex-1 py-2 bg-purple-900/20 text-white rounded-xl text-sm transition-all">Отмена</button>
                      <motion.button
                        onClick={async () => {
                          if (!me || !seller || !revText.trim()) return;
                          setRevSending(true);
                          setRevMsg(null);
                          try {
                            const { data, error } = await supabase.rpc('leave_review', {
                              p_account_id: account.id, p_rating: revRating, p_positive: revPositive, p_text: revText,
                            });
                            if (error) throw error;
                            if (data?.ok) {
                              setRevMsg('✅ Отзыв отправлен!');
                              setMyReview({ rating: revRating, positive: revPositive, text: revText });
                              setShowReview(false);
                            } else {
                              const errMap: Record<string, string> = {
                                not_authenticated: 'Войдите в систему',
                                no_order: 'Вы не покупали этот товар',
                                already_reviewed: 'Вы уже оставляли отзыв на эту покупку',
                              };
                              setRevMsg('❌ ' + (errMap[data?.error] || data?.error));
                            }
                          } catch (e: any) {
                            setRevMsg('❌ ' + e.message);
                          } finally {
                            setRevSending(false);
                          }
                        }}
                        disabled={revSending}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
                        {revSending ? 'Отправка...' : 'Отправить'}
                      </motion.button>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* === Tabs: Reviews / Stats / History === */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden">
            <div className="flex border-b border-purple-900/20">
              {[
                { id: 'reviews', label: 'Отзывы о продавце', count: reviews.length },
                { id: 'stats',   label: 'Статистика', count: null },
                { id: 'history', label: 'История', count: null },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs sm:text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-300 bg-purple-900/10'
                      : 'border-transparent text-text-secondary hover:text-white'
                  }`}>
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== null && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded-full">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'reviews' && (() => {
                // Rating distribution
                const dist = [0, 0, 0, 0, 0];
                reviews.forEach((r: any) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
                const maxDist = Math.max(...dist, 1);
                const avgRating = reviews.length > 0
                  ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
                  : 0;

                return reviews.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    Пока нет отзывов о продавце
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Rating bar chart */}
                    <div className="flex gap-6 items-start">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <span className="text-4xl font-bold text-white">{avgRating.toFixed(1)}</span>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={13} className={s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-text-secondary mt-1">{reviews.length} отзывов</span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5,4,3,2,1].map(star => {
                          const count = dist[star - 1];
                          const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-text-secondary w-3 text-right">{star}</span>
                              <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                              <div className="flex-1 h-2 bg-[#0B0A12] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, delay: (5 - star) * 0.08 }}
                                  className="h-full bg-purple-500 rounded-full"
                                />
                              </div>
                              <span className="text-[10px] text-text-secondary w-8 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reviews list */}
                    <div className="space-y-3 pt-3 border-t border-purple-900/20">
                      {reviews.map((r: any) => {
                        const canDel = ['moderator','admin','owner'].includes(myRole);
                        return (
                          <motion.div key={r.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-xl p-3 ${
                              r.positive
                                ? 'bg-green-900/10 border-green-700/30'
                                : 'bg-red-900/10 border-red-700/30'
                            }`}>
                            {/* Author row */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {r.author?.avatar_url ? (
                                  <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-white">{(r.author?.username?.[0] || 'U').toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <UserLink userId={r.author?.id || r.user_id} username={r.author?.username || 'Аноним'} className="text-sm font-semibold text-white" />
                                  {r.rating && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star key={idx} size={10}
                                          className={idx < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-text-secondary flex-shrink-0">
                                {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Review text */}
                            {(r.text || r.comment) && <p className="text-sm text-white mb-2">{r.text || r.comment}</p>}

                            {/* Product name + price */}
                            <div className="flex items-center gap-2 pt-2 border-t border-purple-900/20">
                              {(r.account_title || r.account_id) && (
                                <span className="text-[10px] text-text-secondary truncate max-w-[60%]">
                                  📦 {r.account_title || 'Аккаунт'}{r.account_price ? ` · ${Number(r.account_price).toLocaleString('ru-RU')} ₽` : ''}
                                </span>
                              )}
                              <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                <ReportButton targetType="comment" targetId={r.id} targetName={'Отзыв: ' + ((r.text || r.comment || '').slice(0, 40))} />
                                {canDel && (
                                  <button onClick={async () => {
                                    await supabase.from('reviews').delete().eq('id', r.id);
                                    setReviews(prev => prev.filter((rv: any) => rv.id !== r.id));
                                  }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold transition-all">
                                    <Trash2 size={11} /> Удалить
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'stats' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Просмотров', value: (account.views || 0).toLocaleString('ru-RU'), icon: Eye },
                    { label: 'Продавец онлайн', value: '~1ч назад', icon: Clock },
                    { label: 'Средняя цена', value: `${convert(account.price).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} ${symbol}`, icon: Tag },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
                      <s.icon size={14} className="text-purple-400 mb-2" />
                      <p className="text-sm font-bold text-white">{s.value}</p>
                      <p className="text-xs text-text-secondary">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="text-center py-8 text-text-secondary text-sm">
                  История изменений товара появится скоро
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 lg:sticky lg:top-20 relative z-10 overflow-hidden">
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

          {/* === Seller === */}
          {seller && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 overflow-hidden">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Продавец
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {(seller.username?.[0] || account.seller?.username?.[0] || 'P').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
                    <UserLink userId={seller.id} username={seller.username || account.seller?.username} className="font-semibold text-white truncate" />
                    {seller.verified && <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0" />}
                    <RoleBadge user={seller} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`flex items-center gap-1 text-[10px] font-medium ${
                      seller.last_seen_at && (Date.now() - new Date(seller.last_seen_at).getTime()) < 5 * 60 * 1000
                        ? 'text-green-400' : 'text-text-secondary'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        seller.last_seen_at && (Date.now() - new Date(seller.last_seen_at).getTime()) < 5 * 60 * 1000
                          ? 'bg-green-400' : 'bg-gray-500'
                      }`} />
                      {seller.last_seen_at && (Date.now() - new Date(seller.last_seen_at).getTime()) < 5 * 60 * 1000
                        ? 'Онлайн' : 'Оффлайн'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  { label: 'Рейтинг',  value: sellerStats.rating > 0 ? `${sellerStats.rating.toFixed(1)}/5` : '—', Icon: Star },
                  { label: 'Положит.', value: sellerStats.positive + '%', Icon: CheckCircle2 },
                  { label: 'Продаж',   value: String(sellerStats.sales),  Icon: ShoppingCart },
                  { label: 'Ответ',    value: '~1ч',                      Icon: MessageSquare },
                ] as const).map(stat => (
                  <div key={stat.label} className="bg-[#0B0A12] rounded-xl p-2.5 border border-purple-900/20 text-center">
                    <stat.Icon size={16} className="mx-auto mb-1 text-accent-soft" />
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-text-secondary">{stat.label}</p>
                  </div>
                ))}
              </div>

              {seller.created_at && (
                <p className="text-[10px] text-text-secondary mb-4">
                  На сайте с {new Date(seller.created_at).toISOString().slice(0, 19).replace('T', 'T')}
                </p>
              )}

              {/* Chat with seller */}
              {!showChat ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowChat(true)}
                  disabled={!me || (seller.id === me?.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-purple-900/20 border border-purple-800/30 text-white hover:border-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <MessageSquare size={16} /> {seller.id === me?.id ? 'Это вы' : 'Написать продавцу'}
                </motion.button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    rows={3}
                    placeholder="Сообщение продавцу..."
                    className="w-full px-3 py-2 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none focus:border-purple-500/60 focus:outline-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowChat(false)} className="flex-1 py-2 bg-purple-900/20 text-white rounded-xl text-sm transition-all">
                      Отмена
                    </button>
                    <button onClick={sendMessage} disabled={!chatMsg.trim()}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50 transition-all">
                      <Send size={12} /> Отправить
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* === Validation Status === */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 overflow-hidden">

            {/* Header + status */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield size={16} className="text-purple-400" /> Проверка аккаунта
              </h3>
              {validation && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  validation.status === 'valid'   ? 'bg-green-900/30 text-green-400 border border-green-700/30' :
                  validation.status === 'changed' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' :
                  validation.status === 'error'   ? 'bg-red-900/30 text-red-400 border border-red-700/30' :
                                                     'bg-purple-900/30 text-purple-300 border border-purple-700/30'
                }`}>
                  {validation.status === 'valid' ? '✅ Проверен' :
                   validation.status === 'changed' ? '⚠️ Изменён' :
                   validation.status === 'error' ? '❌ Ошибка' : '⏳ Ожидание'}
                </span>
              )}
            </div>

            {/* Ban checks */}
            <div className="space-y-1.5 mb-3">
              {[
                { label: 'VAC бан',       value: validation?.vac_ban },
                { label: 'Trade ban',     value: validation?.trade_ban },
                { label: 'Community ban', value: validation?.community_ban },
                { label: 'Game ban',      value: validation?.game_ban },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${
                    item.value ? 'text-red-400' : 'text-green-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.value ? 'bg-red-400' : 'bg-green-400'}`} />
                    {item.value ? 'Да' : 'Нет'}
                  </span>
                </div>
              ))}
            </div>

            {/* Extra info from validation */}
            {validation?.checked_data && (
              <div className="space-y-1.5 mb-3 pt-2 border-t border-purple-900/20">
                {validation.level != null && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-secondary">Уровень</span>
                    <span className="text-xs font-semibold text-white">{validation.level}</span>
                  </div>
                )}
                {validation.hours_played != null && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-secondary">Часов</span>
                    <span className="text-xs font-semibold text-white">{validation.hours_played.toLocaleString('ru-RU')}</span>
                  </div>
                )}
                {validation.games_count != null && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-secondary">Игр</span>
                    <span className="text-xs font-semibold text-white">{validation.games_count}</span>
                  </div>
                )}
              </div>
            )}

            {/* Changes diff */}
            {validationHistory.length > 0 && validationHistory[0].has_changes && (
              <div className="mb-3 p-2.5 bg-yellow-900/10 border border-yellow-700/30 rounded-xl">
                <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider mb-1.5">⚠️ Обнаружены изменения</p>
                {(validationHistory[0].changes || []).map((ch: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px] text-text-secondary">{ch.field}</span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-red-400 line-through">{String(ch.old ?? '—')}</span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-green-400">{String(ch.new ?? '—')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Last checked */}
            {validation?.checked_at && (
              <p className="text-[10px] text-text-secondary mb-3">
                Проверен: {new Date(validation.checked_at).toLocaleString('ru-RU')}
                {validation.check_duration_ms && ` · ${validation.check_duration_ms}мс`}
              </p>
            )}

            {!validation && (
              <p className="text-[10px] text-text-secondary mb-3">Ещё не проверен ботом</p>
            )}

            {/* Admin: manual recheck button */}
            {isAdmin && (
              <motion.button
                onClick={checkAccountChanges}
                disabled={checkingChanges}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500/50 disabled:opacity-50 transition-all"
              >
                <RefreshCw size={13} className={checkingChanges ? 'animate-spin' : ''} />
                {checkingChanges ? 'Проверка...' : 'Перепроверить'}
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ PURCHASE SUCCESS MODAL ═══════════════════ */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={modalShake ? "shake" : { opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 18, stiffness: 250 }}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-8 w-full max-w-md text-center shadow-[0_0_80px_rgba(139,92,246,0.2)]"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
                className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-600/50 flex items-center justify-center mx-auto mb-5"
              >
                <Award size={40} className="text-green-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                🎉 Поздравляем с покупкой!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-text-secondary mb-2"
              >
                Вы успешно приобрели
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 mb-5"
              >
                <p className="text-sm font-semibold text-white truncate">{account.title}</p>
                <p className="text-xs text-purple-300 mt-0.5">{convert(account.price).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} {symbol}</p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-xs text-text-secondary mb-5"
              >
                Перенаправляем в «Мои покупки»...
              </motion.p>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, delay: 0.6, ease: 'linear' }}
                className="h-1 bg-purple-600 rounded-full mx-auto max-w-xs mb-5"
                onAnimationComplete={() => {
                  localStorage.setItem('highlight_purchase_account', account.id);
                  setShowPurchaseModal(false);
                  setCurrentPage('purchases');
                }}
              />

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={() => {
                  localStorage.setItem('highlight_purchase_account', account.id);
                  setShowPurchaseModal(false);
                  setCurrentPage('purchases');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> Перейти в мои покупки
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={modalShake ? "shake" : { opacity: 1, scale: 1, y: 0 }}
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

      <AnimatePresence>
        {productMailModal && (() => {
          const activeGuarantee = !!account.guarantee && !productGuaranteeVoided;
          const content = productMailModal.type === 'code' ? extractMailCode() : extractMailLetter();
          const title = productMailModal.type === 'code' ? 'Код из почты' : 'Письмо из почты';
          const groups = getCredentialGroups((account as any).accountData || {});
          const needsConfirm = activeGuarantee && !productMailModal.accepted;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/75 z-[140] flex items-center justify-center p-4" onClick={() => setProductMailModal(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} onClick={e => e.stopPropagation()} className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md shadow-[0_0_60px_rgba(139,92,246,0.18)]">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white flex items-center gap-2">{productMailModal.type === 'code' ? <KeyRound size={18} className="text-purple-300" /> : <Inbox size={18} className="text-purple-300" />}{title}</h2><button onClick={() => setProductMailModal(null)} className="text-text-secondary hover:text-white"><X size={20} /></button></div>
                {needsConfirm ? <div className="space-y-4"><div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4 flex gap-3"><ShieldOff size={18} className="text-yellow-400 mt-0.5" /><p className="text-xs text-yellow-200/80 leading-relaxed">Если вы используете код или письмо для смены почты, пароля или других данных аккаунта, гарантия по покупке будет потеряна.</p></div><label className="flex items-center gap-2 cursor-pointer bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3"><input type="checkbox" checked={productMailModal.accepted} onChange={e => setProductMailModal({ ...productMailModal, accepted: e.target.checked })} className="accent-purple-500 w-4 h-4" /><span className="text-xs text-white">Я понимаю, что при смене данных гарантия пропадёт</span></label><button disabled={!productMailModal.accepted} onClick={() => { setProductGuaranteeVoided(true); setProductMailModal({ ...productMailModal, accepted: true }); }} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">ОК, показать {productMailModal.type === 'code' ? 'код' : 'письмо'}</button></div> : <div className="space-y-3"><div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4"><p className="text-[10px] text-text-secondary uppercase mb-2">Почта</p><p className="text-sm text-white font-mono break-all">{groups.mailEmail || '—'}</p></div><div className="bg-purple-900/10 border border-purple-700/30 rounded-xl p-4"><p className="text-[10px] text-text-secondary uppercase mb-2">{title}</p><p className="text-sm text-white font-mono whitespace-pre-wrap break-words">{content}</p></div><button onClick={() => copyText(content)} className="w-full py-2.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-purple-300 rounded-xl text-sm font-semibold"><Copy size={14} className="inline mr-1" /> Скопировать</button></div>}
              </motion.div>
            </motion.div>
          );
        })()}
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