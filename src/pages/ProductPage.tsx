import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  CheckCircle2 as CC2, AlertCircle, Send
, Trash2 } from 'lucide-react';
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

  // Заказ покупателя (если этот товар был куплен мной)
  const [myOrder, setMyOrder] = useState<any>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revPositive, setRevPositive] = useState(true);
  const [revText, setRevText] = useState('');
  const [revSending, setRevSending] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  // Реальный продавец из БД
  const [seller, setSeller] = useState<any>(null);
  const [sellerStats, setSellerStats] = useState({ sales: 0, rating: 0, positive: 0, reviewsCount: 0 });

  // Реальные отзывы о продавце
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'stats' | 'history'>('reviews');

  // Чат с продавцом
  const [showChat, setShowChat] = useState(false);
  const { convert, symbol, currency } = useCurrency();
  const [chatMsg, setChatMsg] = useState('');

  const risk = riskConfig[account.riskLevel as keyof typeof riskConfig] || riskConfig.low;

  /* ============ Загрузка продавца + отзывов + избранного ============ */
  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);

      if (u.user) {
        const { data: meData } = await supabase.from('users').select('role').eq('id', u.user.id).maybeSingle();
        setMyRole(meData?.role || 'user');
      }

      // Я ли в избранном?
      if (u.user) {
        const { data: f } = await supabase.from('favorites')
          .select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (f) setIsFav(true);

        // Мой заказ?
        const { data: ord } = await supabase.from('orders')
          .select('*').eq('buyer_id', u.user.id).eq('account_id', account.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (ord) {
          setMyOrder(ord);
          // Отзыв уже есть?
          const { data: rev } = await supabase.from('reviews')
            .select('*').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
          if (rev) setMyReview(rev);
        }
      }

      // Продавец
      const sellerId = (account.seller as any)?.id;
      if (sellerId) {
        const { data: s } = await supabase.from('users')
          .select('*').eq('id', sellerId).maybeSingle();
        if (s) {
          const { data: cr } = await supabase.from('user_custom_roles')
            .select('id, label, icon, color').eq('user_id', sellerId);
          if (cr && cr.length > 0) (s as any).custom_roles = cr;
        }
        setSeller(s);

        // Отзывы о продавце
        const { data: r, count } = await supabase.from('reviews')
          .select('*', { count: 'exact' })
          .eq('target_user_id', sellerId)
          .order('created_at', { ascending: false });
        const reviewsList = r || [];

        // Авторы отзывов
        const authorIds = [...new Set(reviewsList.map((rv: any) => rv.user_id).filter(Boolean))];
        if (authorIds.length > 0) {
          const { data: authors } = await supabase.from('users')
            .select('id, username, avatar_url, custom_id').in('id', authorIds);
          const aMap: Record<string, any> = {};
          authors?.forEach((a: any) => { aMap[a.id] = a; });
          reviewsList.forEach((rv: any) => {
            if (aMap[rv.user_id]) {
              rv.author = aMap[rv.user_id];
            }
          });
        }

        // Считаем рейтинг
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

  const deleteReview = async (id: string) => {
    if (!confirm('Удалить отзыв?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    // Перезагрузить отзывы
    if (account.seller && (account.seller as any).id) {
      const { data: r } = await supabase.from('reviews')
        .select('*').eq('target_user_id', (account.seller as any).id)
        .order('created_at', { ascending: false });
      const reviewsList = r || [];
      const ids = [...new Set(reviewsList.map((rv: any) => rv.user_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: authors } = await supabase.from('users').select('id, username, avatar_url, custom_id').in('id', ids);
        const aMap: Record<string, any> = {};
        authors?.forEach((a: any) => { aMap[a.id] = a; });
        reviewsList.forEach((rv: any) => { if (aMap[rv.user_id]) rv.author = aMap[rv.user_id]; });
      }
      setReviews(reviewsList);
    }
  };

  const submitReview = async () => {
    if (!myOrder) return;
    setRevMsg(null); setRevSending(true);
    try {
      const { data, error } = await supabase.rpc('leave_review', {
        p_order_id: myOrder.id,
        p_rating: revRating,
        p_positive: revPositive,
        p_text: revText,
      });
      if (error) throw error;
      if (data?.ok) {
        setRevMsg('✅ Отзыв отправлен!');
        setMyReview({ rating: revRating, positive: revPositive, text: revText });
        setTimeout(() => setShowReview(false), 1500);
      } else {
        const errMap: Record<string, string> = {
          already_reviewed: 'Вы уже оставляли отзыв на эту покупку',
          not_your_order: 'Это не ваш заказ',
        };
        setRevMsg('⚠️ ' + (errMap[data?.error] || data?.error));
      }
    } catch (e: any) {
      setRevMsg('⚠️ ' + e.message);
    } finally { setRevSending(false); }
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

  // ⭐ Полная карточка инфы об аккаунте (тут проблема была — слипалось)
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

        {/* ========= ЛЕВАЯ КОЛОНКА ========= */}
        <div className="lg:col-span-2 space-y-5">

          {/* Заголовок + теги */}
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
                <Heart size={22}
                  className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-text-secondary hover:text-red-400'}`} />
              </motion.button>
            </div>

            {/* AI Risk */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border mb-4 ${risk.className}`}>
              <risk.Icon size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">AI Оценка: {risk.label}</p>
                <p className="text-xs opacity-80 mt-0.5">{risk.desc}</p>
              </div>
            </div>

            {/* Описание */}
            {account.description && (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{account.description}</p>
            )}

            {/* Метки */}
            <div className="mt-3 pt-3 border-t border-purple-900/20">
              <LabelManager targetType="account" targetId={account.id} />
            </div>
          </motion.div>

          {/* ⭐ ИНФОРМАЦИЯ ОБ АККАУНТЕ (красивая) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={16} className="text-purple-400" />
              Параметры аккаунта
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {infoItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#0B0A12] rounded-xl p-3 border border-purple-900/20 hover:border-purple-700/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <item.icon size={13} className="text-purple-400 flex-shrink-0" />
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider truncate">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* === Блок отзыва (если я купил) === */}
          {myOrder && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className={`rounded-2xl p-5 border transition-colors ${
                showReview && !revPositive
                  ? 'bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-700/40'
                  : 'bg-gradient-to-br from-green-900/20 to-purple-900/10 border-green-700/30'
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
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
                    ⭐ Оставить отзыв о продавце
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Оценка</label>
                      <div className="flex gap-2">
                        <button onClick={() => setRevPositive(true)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                            revPositive ? 'bg-green-600 text-white' : 'bg-bg-secondary text-text-secondary'
                          }`}>
                          👍 Положительный
                        </button>
                        <button onClick={() => setRevPositive(false)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
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
                      className="w-full px-3 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none" />

                    {revMsg && (
                      <div className={`text-xs p-2 rounded-lg ${revMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                        {revMsg}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setShowReview(false)}
                        className="flex-1 py-2 bg-purple-900/20 text-white rounded-xl text-sm">Отмена</button>
                      <button onClick={submitReview} disabled={revSending}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                        {revSending ? 'Отправка...' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* === Табы: Отзывы / Статистика / История === */}
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
              {activeTab === 'reviews' && (
                reviews.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    Пока нет отзывов о продавце
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(r => {
                      const canDel = ['moderator','admin','owner'].includes(myRole);
                      return (
                        <div key={r.id}
                          className={`border rounded-xl p-3 ${
                            r.positive
                              ? 'bg-green-900/10 border-green-700/30'
                              : 'bg-red-900/10 border-red-700/30'
                          }`}>
                          {/* Автор */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {r.author?.avatar_url ? (
                                <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white">{(r.author?.username?.[0] || 'U').toUpperCase()}</span>
                              )}
                            </div>
                            <UserLink userId={r.author?.id || r.user_id} username={r.author?.username || 'Аноним'} className="text-sm font-semibold text-white" />
                            {r.author?.custom_id && (
                              <span className="text-[10px] text-purple-300 font-mono">#{r.author.custom_id}</span>
                            )}
                            <span className="text-xs text-text-secondary ml-auto">
                              {new Date(r.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>

                          {/* Бейдж + звёзды */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              r.positive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                            }`}>
                              {r.positive ? '👍 Положительный' : '👎 Отрицательный'}
                            </span>
                            {r.rating && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star key={idx} size={11}
                                    className={idx < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                                ))}
                              </div>
                            )}
                          </div>

                          {r.text && <p className="text-sm text-white mb-2">{r.text}</p>}

                          {/* Действия */}
                          <div className="flex items-center gap-1 pt-2 border-t border-purple-900/20">
                            <ReportButton targetType="comment" targetId={r.id} targetName={'Отзыв: ' + (r.text || '').slice(0, 40)} />
                            {canDel && (
                              <button onClick={() => deleteReview(r.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold ml-auto">
                                <Trash2 size={11} /> Удалить
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {activeTab === 'stats' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Просмотров', value: (account.views || 0).toLocaleString('ru-RU'), icon: Eye },
                    { label: 'Продавец онлайн', value: '~1ч назад', icon: Clock },
                    { label: 'Цена в среднем', value: `${convert(account.price).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} ${symbol}`, icon: Tag },
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

        {/* ========= ПРАВАЯ КОЛОНКА ========= */}
        <div className="space-y-5">

          {/* Цена + кнопки */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 lg:sticky lg:top-20">
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {convert(account.price).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })}
                </span>
                <span className="text-text-secondary">{symbol}</span>
                {account.oldPrice && (
                  <span className="text-sm text-text-secondary line-through">
                    {convert(account.oldPrice).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 })} {symbol}
                  </span>
                )}
              </div>
              {account.oldPrice && account.oldPrice > account.price && (
                <span className="inline-block mt-1 text-xs bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                  Скидка {Math.round((1 - account.price / account.oldPrice) * 100)}%
                </span>
              )}
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

              {buyResult && (
                <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                  buyResult.type === 'ok' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}>
                  {buyResult.type === 'ok' ? <CC2 size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
                  <span>{buyResult.text}</span>
                </div>
              )}

              <motion.button onClick={() => onAddToCart(account)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-900/20 border border-purple-800/30 text-white hover:border-purple-500 hover:bg-purple-900/40 transition-all">
                <ShoppingCart size={18} /> В корзину
              </motion.button>
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

          {/* === Продавец === */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> Продавец
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                {seller?.avatar_url ? (
                  <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-white">
                    {(seller?.username?.[0] || account.seller?.username?.[0] || 'P').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <UserLink userId={seller?.id} username={seller?.username || account.seller?.username} className="font-semibold text-white truncate" />
                  {seller?.verified && <CheckCircle2 size={14} className="text-blue-400" />}
                  <RoleBadge user={seller} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <LevelBadge level={seller?.level || 1} />
                </div>
                {seller?.custom_id && (
                  <p className="text-[10px] text-purple-300 mt-1 font-mono">#{seller.custom_id || seller.id?.slice(0, 8)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Рейтинг',  value: sellerStats.rating > 0 ? `${sellerStats.rating.toFixed(1)}/5` : '—',  icon: Star },
                { label: 'Отзывы',   value: sellerStats.reviewsCount, icon: CheckCircle2 },
                { label: 'Продаж',   value: sellerStats.sales,  icon: ShoppingCart },
                { label: 'Положит.', value: sellerStats.positive + '%', icon: MessageSquare },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0B0A12] rounded-xl p-2.5 border border-purple-900/20">
                  <stat.icon size={12} className="text-purple-400 mb-1" />
                  <p className="text-sm font-semibold text-white">{stat.value}</p>
                  <p className="text-[10px] text-text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>

            {seller?.created_at && (
              <div className="text-xs text-text-secondary mb-4">
                На сайте с {new Date(seller.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </div>
            )}

            {/* Чат с продавцом */}
            {!showChat ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowChat(true)}
                disabled={!me || (seller?.id === me?.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-purple-900/20 border border-purple-800/30 text-white hover:border-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <MessageSquare size={16} /> {seller?.id === me?.id ? 'Это вы' : 'Написать продавцу'}
              </motion.button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  rows={3}
                  placeholder="Сообщение продавцу..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowChat(false)} className="flex-1 py-2 bg-purple-900/20 text-white rounded-xl text-sm">
                    Отмена
                  </button>
                  <button onClick={sendMessage} disabled={!chatMsg.trim()}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                    <Send size={12} /> Отправить
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
