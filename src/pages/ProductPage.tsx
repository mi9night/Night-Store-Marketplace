import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  CheckCircle2 as CC2, AlertCircle, Send, Trash2, RefreshCw, AlertOctagon
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
  low:    { label: 'Низкий риск',  className: 'bg-green-900/20 border-green-700/40 text-green-400',  Icon: CheckCircle2,    desc: 'Аккаунт прошёл AI проверку. Минимальный риск блокировки.' },
  medium: { label: 'Средний риск', className: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400', Icon: AlertTriangle,  desc: 'Есть некоторые факторы риска. Рекомендуем использовать осторожно.' },
  high:   { label: 'Высокий риск', className: 'bg-red-900/20 border-red-700/40 text-red-400',          Icon: XCircle,        desc: 'Аккаунт имеет признаки возможной блокировки. Покупайте с осторожностью.' },
};

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
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [disputeSending, setDisputeSending] = useState(false);

  const risk = riskConfig[account.riskLevel as keyof typeof riskConfig] || riskConfig.low;

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
          reviewsList.forEach((rv: any) => {
            if (aMap[rv.user_id]) rv.author = aMap[rv.user_id];
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
        setSellerStats({
          sales: s?.sales || 0,
          rating: rating,
          positive: positivePct,
          reviewsCount: count || reviewsList.length,
        });
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
        setBuyResult({ type: 'ok', text: '✅ Куплено! Аккаунт в \"Мои покупки\"' });
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

  // === Проверка изменений (только для админов) ===
  const checkAccountChanges = async () => {
    setCheckingChanges(true);
    setTimeout(() => {
      alert(`Проверка изменений аккаунта #${account.id.slice(0, 8)}\n\n(Здесь будет результат проверки почты и пароля)`);
      setCheckingChanges(false);
    }, 700);
  };

  // === Открыть спор ===
  const openDispute = async () => {
    if (!me || !disputeText.trim()) return;
    
    setDisputeSending(true);
    try {
      await supabase.from('tickets').insert({
        user_id: me.id,
        category: 'Спор',
        subject: `Спор об аккаунте: ${account.title}`,
        description: `Товар: ${account.title}\nСсылка: ${window.location.href}\nЦена: ${account.price} ₽\n\nВопрос: Вели ли вы общение ещё где-то кроме нашего сайта?\n\n${disputeText}`,
        target_type: 'account',
        target_id: account.id,
        status: 'open',
      });
      alert('✅ Спор открыт! Тикет создан.');
      setShowDispute(false);
      setDisputeText('');
    } catch (e: any) {
      alert('Ошибка при создании спора: ' + e.message);
    } finally {
      setDisputeSending(false);
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
        {/* ЛЕВАЯ КОЛОНКА */}
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

          {/* Информация об аккаунте */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={16} className="text-purple-400" /> Параметры аккаунта
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {infoItems.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
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

          {/* Кнопка "Открыть спор" */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDispute(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-semibold border border-red-700/30"
            >
              <AlertOctagon size={16} /> Открыть спор
            </button>
          </div>

          {/* Модалка спора */}
          {showDispute && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-[#171425] border border-purple-900/30 rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-white mb-4">Открыть спор по аккаунту</h3>
                
                <div className="text-sm text-text-secondary mb-4 space-y-1">
                  <p><b>Товар:</b> {account.title}</p>
                  <p><b>Цена:</b> {account.price} ₽</p>
                  <p><b>Вопрос:</b> Вели ли вы общение ещё где-то кроме нашего сайта?</p>
                </div>

                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  placeholder="Опишите ситуацию подробно..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none mb-4"
                />

                <div className="flex gap-3">
                  <button onClick={() => setShowDispute(false)} className="flex-1 py-2.5 bg-purple-900/20 text-white rounded-xl text-sm">
                    Отмена
                  </button>
                  <button 
                    onClick={openDispute} 
                    disabled={!disputeText.trim() || disputeSending}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {disputeSending ? 'Отправка...' : 'Открыть спор'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
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
              {myOrder ? (
                <div className="text-center p-3 bg-green-900/20 border border-green-700/30 rounded-xl text-sm text-green-400">
                  ✅ Куплено вами
                </div>
              ) : null}

              <motion.button onClick={handleBuy} disabled={buying || !!myOrder}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50">
                <Zap size={18} />
                {buying ? 'Покупка...' : 'Купить сейчас'}
              </motion.button>

              <motion.button onClick={() => onAddToCart(account)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-900/20 border border-purple-800/30 text-white hover:border-purple-500 hover:bg-purple-900/40 transition-all">
                <ShoppingCart size={18} /> В корзину
              </motion.button>

              {/* Кнопка проверки изменений (только для админов) */}
              {isAdmin && (
                <button
                  onClick={checkAccountChanges}
                  disabled={checkingChanges}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-blue-900/20 border border-blue-700/40 text-blue-400 hover:bg-blue-900/30 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={checkingChanges ? 'animate-spin' : ''} />
                  Проверить изменения
                </button>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-purple-900/20">
              {[
                { icon: Shield, text: `${account.guaranteeHours || 24}ч гарантия`, sub: 'Возврат средств', color: 'text-green-400' },
                { icon: Lock, text: 'Escrow защита', sub: 'Безопасная сделка', color: 'text-purple-300' },
                { icon: CheckCircle2, text: 'Проверено AI', sub: 'Оценка риска', color: 'text-blue-400' },
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
    </div>
  );
};

export default ProductPage;
