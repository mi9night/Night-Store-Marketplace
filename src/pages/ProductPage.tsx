import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  CheckCircle2 as CC2, AlertCircle, Send
} from 'lucide-react';
import { Account } from '../types';
import { Page } from '../types/pages';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/ModerationPanel';
import { LevelBadge } from '../components/LevelBadge';
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

      // Я ли в избранном?
      if (u.user) {
        const { data: f } = await supabase.from('favorites')
          .select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (f) setIsFav(true);
      }

      // Продавец
      const sellerId = (account.seller as any)?.id;
      if (sellerId) {
        const { data: s } = await supabase.from('users')
          .select('*').eq('id', sellerId).maybeSingle();
        setSeller(s);
        setSellerStats({
          sales: s?.sales || 0,
          rating: Number(s?.rating) || 0,
          positive: s?.positive_reviews || 0,
          reviewsCount: 0,
        });

        // Отзывы о продавце
        const { data: r, count } = await supabase.from('reviews')
          .select('*', { count: 'exact' })
          .eq('target_user_id', sellerId)
          .order('created_at', { ascending: false });
        setReviews(r || []);
        setSellerStats(prev => ({ ...prev, reviewsCount: count || 0 }));
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
                    {reviews.map(r => (
                      <div key={r.id} className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
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
                          <span className="text-xs text-text-secondary ml-auto">
                            {new Date(r.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        {r.text && <p className="text-sm text-white">{r.text}</p>}
                      </div>
                    ))}
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
              <motion.button onClick={handleBuy} disabled={buying}
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
                  <span className="font-semibold text-white truncate">{seller?.username || account.seller?.username}</span>
                  {seller?.verified && <CheckCircle2 size={14} className="text-blue-400" />}
                  <RoleBadge role={seller?.role} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <LevelBadge level={seller?.level || 1} />
                </div>
                {seller?.custom_id && (
                  <p className="text-[10px] text-text-secondary mt-1 font-mono">#{seller.custom_id}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Рейтинг',  value: sellerStats.rating > 0 ? `${sellerStats.rating.toFixed(1)}/5` : '—',  icon: Star },
                { label: 'Отзывы',   value: sellerStats.reviewsCount, icon: CheckCircle2 },
                { label: 'Продаж',   value: sellerStats.sales,  icon: ShoppingCart },
                { label: 'Положит.', value: sellerStats.positive, icon: MessageSquare },
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
