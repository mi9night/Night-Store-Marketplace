import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  CheckCircle2 as CC2, AlertCircle, Send, Loader2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Account } from '../types';
import { Page } from '../types/pages';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/RoleBadge';
import { LevelBadge } from '../components/LevelBadge';
import { UserLink } from '../components/UserLink';
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

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'loading' | 'success'>('loading');

  const [myOrder, setMyOrder] = useState<any>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revPositive, setRevPositive] = useState(true);
  const [revText, setRevText] = useState('');
  const [revSending, setRevSending] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const { convert, symbol } = useCurrency();

  const risk = riskConfig[account.riskLevel as keyof typeof riskConfig] || riskConfig.low;

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);
      if (u.user) {
        const { data: f } = await supabase.from('favorites').select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (f) setIsFav(true);
        const { data: ord } = await supabase.from('orders').select('*').eq('buyer_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (ord) {
           setMyOrder(ord);
           const { data: rev } = await supabase.from('reviews').select('*').eq('account_id', account.id).eq('user_id', u.user.id).maybeSingle();
           if (rev) setMyReview(rev);
        }
      }
      const sellerId = (account.seller as any)?.id;
      if (sellerId) {
        const { data: s } = await supabase.from('users').select('*').eq('id', sellerId).maybeSingle();
        setSeller(s);
        const { data: r } = await supabase.from('reviews').select('*').eq('target_user_id', sellerId).order('created_at', { ascending: false });
        setReviews(r || []);
      }
    };
    load();
  }, [account.id]);

  const startVerification = () => {
    setShowVerifyModal(true);
    setVerifyStep('loading');
    setTimeout(() => setVerifyStep('success'), 5000);
  };

  const handleBuy = async () => {
    setShowVerifyModal(false);
    setBuyResult(null);
    setBuying(true);
    try {
      const { data, error } = await supabase.rpc('purchase_account', { p_account_id: account.id });
      if (error) throw error;
      if (data?.ok) {
        setBuyResult({ type: 'ok', text: '✅ Успешно куплено!' });
        setTimeout(() => setCurrentPage('purchases'), 1500);
      } else {
        setBuyResult({ type: 'err', text: data?.error || 'Ошибка' });
      }
    } catch (e: any) {
      setBuyResult({ type: 'err', text: e.message });
    } finally {
      setBuying(false);
    }
  };

  const submitReview = async () => {
    if (!myOrder) return;
    setRevMsg(null); setRevSending(true);
    try {
      const { data, error } = await supabase.rpc('leave_review', {
        p_order_id: myOrder.id, p_rating: revRating, p_positive: revPositive, p_text: revText,
      });
      if (error) throw error;
      if (data?.ok) {
        setRevMsg('✅ Отзыв опубликован!');
        setMyReview({ rating: revRating, positive: revPositive, text: revText, created_at: new Date().toISOString() });
        setTimeout(() => setShowReviewForm(false), 1500);
      } else {
        setRevMsg('⚠️ ' + data?.error);
      }
    } catch (e: any) { setRevMsg('⚠️ ' + e.message); } finally { setRevSending(false); }
  };

  const infoItems = [
    { icon: Clock,    label: 'Вход',  value: account.lastLogin || '—' },
    { icon: MapPin,   label: 'Страна', value: account.country || '—' },
    { icon: Mail,     label: 'Почта',  value: account.hasOriginalEmail ? 'Есть ✅' : 'Нет ❌' },
    { icon: Shield,   label: 'Гарант', value: account.guarantee ? `${account.guaranteeHours}ч` : 'Нет' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-2">
      <motion.button onClick={() => setCurrentPage('market')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-6">
        <ArrowLeft size={16} /> Назад
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
               <span className="text-[10px] px-2 py-0.5 bg-purple-600/20 text-accent-soft rounded border border-purple-600/20 font-black uppercase tracking-tighter">{account.category}</span>
               {account.guarantee && <span className="text-[10px] px-2 py-0.5 bg-green-900/20 text-green-400 rounded border border-green-500/20 font-black uppercase tracking-tighter">Гарантия {account.guaranteeHours}ч</span>}
            </div>
            <h1 className="text-2xl font-bold text-white mb-4 leading-tight">{account.title}</h1>
            <div className={`p-4 rounded-xl border mb-6 ${risk.className}`}>
              <div className="flex items-center gap-2 font-bold mb-1"><risk.Icon size={18}/> AI ОЦЕНКА: {risk.label}</div>
              <p className="text-[11px] opacity-70 leading-relaxed">{risk.desc}</p>
            </div>
            <div className="bg-[#0B0A12]/40 p-4 rounded-2xl border border-purple-900/10">
               <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{account.description || 'Описание отсутствует.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {infoItems.map(item => (
              <div key={item.label} className="bg-[#171425] p-4 rounded-2xl border border-purple-900/20 group hover:border-purple-600/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 opacity-40"><item.icon size={12} className="text-purple-400"/><span className="text-[10px] text-text-secondary uppercase font-black">{item.label}</span></div>
                <div className="text-sm font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Отзыв о товаре (если куплен) */}
          {myOrder && (
            <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6">
               <div className="flex items-center gap-2 mb-4"><Star size={18} className="text-yellow-400"/><h3 className="font-bold text-white">Вы купили этот аккаунт</h3></div>
               
               {myReview ? (
                 <div className="bg-bg-secondary p-4 rounded-2xl border border-purple-900/10">
                    <div className="flex items-center gap-2 mb-2"><span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${myReview.positive?'bg-green-900/30 text-green-400':'bg-red-900/30 text-red-400'}`}>{myReview.positive?'Положительный':'Отрицательный'}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(n=><Star key={n} size={10} className={n<=myReview.rating?'text-yellow-400 fill-yellow-400':'text-text-secondary'}/>)}</div></div>
                    <p className="text-sm text-white">{myReview.text}</p>
                 </div>
               ) : (
                 !showReviewForm ? (
                    <button onClick={()=>setShowReviewForm(true)} className="w-full py-3 bg-purple-600 rounded-xl font-bold text-sm text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">ОСТАВИТЬ ОТЗЫВ</button>
                 ) : (
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`p-5 rounded-2xl border transition-all duration-500 ${revPositive ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                       <div className="flex gap-2 mb-4">
                          <button onClick={()=>setRevPositive(true)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${revPositive?'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20':'bg-bg-secondary border-purple-900/10 text-text-secondary'}`}><ThumbsUp size={14} className="inline mr-2"/> ХОРОШО</button>
                          <button onClick={()=>setRevPositive(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${!revPositive?'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20':'bg-bg-secondary border-purple-900/10 text-text-secondary'}`}><ThumbsDown size={14} className="inline mr-2"/> ПЛОХО</button>
                       </div>
                       <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRevRating(n)}><Star size={24} className={n<=revRating?'text-yellow-400 fill-yellow-400':'text-text-secondary opacity-30'}/></button>)}</div>
                       <textarea value={revText} onChange={e=>setRevText(e.target.value)} placeholder="Напишите пару слов об аккаунте..." className="w-full bg-bg-card border border-purple-900/10 rounded-xl p-4 text-sm text-white outline-none focus:border-purple-600 mb-4" rows={3} />
                       {revMsg && <p className="text-xs mb-4 font-bold text-center">{revMsg}</p>}
                       <div className="flex gap-2">
                          <button onClick={()=>setShowReviewForm(false)} className="px-5 bg-bg-secondary text-text-secondary font-bold text-xs rounded-xl">ОТМЕНА</button>
                          <button onClick={submitReview} disabled={revSending} className="flex-1 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl">{revSending?'ОТПРАВКА...':'ОПУБЛИКОВАТЬ'}</button>
                       </div>
                    </motion.div>
                 )
               )}
            </div>
          )}

          {/* Вкладки: Отзывы */}
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden">
             <div className="flex border-b border-purple-900/10">
                <button className="px-6 py-4 text-xs font-black uppercase text-accent-soft border-b-2 border-accent">Отзывы о продавце ({reviews.length})</button>
             </div>
             <div className="p-6">
                {reviews.length === 0 ? <p className="text-center opacity-30 text-xs py-10">У продавца пока нет отзывов.</p> :
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-[#0B0A12]/40 p-4 rounded-2xl border border-purple-900/5">
                         <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${r.positive?'bg-green-900/20 text-green-400 border-green-500/20':'bg-red-900/20 text-red-400 border-red-500/20'}`}>{r.positive?'Good':'Bad'}</span>
                            <div className="flex gap-0.5">{[1,2,3,4,5].map(n=><Star key={n} size={8} className={n<=r.rating?'text-yellow-400 fill-yellow-400':'text-text-secondary opacity-20'}/>)}</div>
                            <span className="text-[10px] text-text-secondary opacity-30 ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                         </div>
                         <p className="text-xs text-text-secondary leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                }
             </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6 lg:sticky lg:top-20 shadow-2xl">
            <div className="text-[10px] text-text-secondary uppercase font-black mb-1 opacity-40 tracking-widest text-center">ЦЕНА ТОВАРА</div>
            <div className="text-4xl font-black text-white mb-8 text-center tabular-nums">
              {convert(account.price).toLocaleString('ru-RU')} <span className="text-xl text-accent-soft font-bold">{symbol}</span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={startVerification} 
                disabled={buying || !!myOrder}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-purple-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
              >
                <Zap size={20} fill="white" /> {buying ? 'ПОКУПКА...' : 'Купить'}
              </button>
              <button onClick={() => onAddToCart(account)} className="w-full py-4 bg-purple-900/20 border border-purple-800/30 text-white rounded-2xl font-bold text-sm hover:bg-purple-900/40 transition-all uppercase tracking-tighter">
                В корзину
              </button>
            </div>
            
            {buyResult && (
              <div className={`mt-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border shadow-inner ${buyResult.type === 'ok' ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-red-900/20 text-red-400 border-red-500/20'}`}>
                {buyResult.type === 'ok' ? <CC2 size={18}/> : <AlertCircle size={18}/>}
                {buyResult.text}
              </div>
            )}

            <div className="mt-8 space-y-4 pt-6 border-t border-purple-900/10">
               <div className="flex items-start gap-3"><Shield size={16} className="text-green-400 flex-shrink-0 mt-0.5"/><div className="min-w-0"><p className="text-[11px] font-bold text-white uppercase tracking-tighter">Гарантия возврата</p><p className="text-[10px] text-text-secondary leading-tight mt-0.5">Полное страхование средств во время сделки.</p></div></div>
               <div className="flex items-start gap-3"><Lock size={16} className="text-purple-400 flex-shrink-0 mt-0.5"/><div className="min-w-0"><p className="text-[11px] font-bold text-white uppercase tracking-tighter">Система Escrow</p><p className="text-[10px] text-text-secondary leading-tight mt-0.5">Продавец получит деньги только после проверки.</p></div></div>
            </div>
          </div>
          
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5 group hover:border-purple-600/40 transition-all">
             <p className="text-[10px] text-text-secondary uppercase font-black opacity-30 mb-4 tracking-widest">Продавец</p>
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white shadow-lg overflow-hidden border border-purple-900/20">
                   {seller?.avatar_url ? <img src={seller.avatar_url} className="w-full h-full object-cover" /> : (seller?.username?.[0] || 'P').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-white truncate">{seller?.username || 'Night Dealer'}</p>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-900/20 text-yellow-400 rounded text-[9px] font-black border border-yellow-500/10"><Star size={8} fill="currentColor"/> {seller?.rating || '4.9'}</div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded text-[9px] font-black border border-blue-500/10">LVL {seller?.level || '1'}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, y: 20, rotateX: 10 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.8, y: 20 }} className="bg-bg-card border border-purple-900/30 rounded-[2.5rem] p-10 w-full max-w-md text-center shadow-[0_0_50px_rgba(138,43,226,0.3)]">
              {verifyStep === 'loading' ? (
                <>
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <Loader2 size={96} className="text-purple-500 animate-spin opacity-20" strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="flex gap-1.5">
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                       </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">ПРОВЕРКА АККАУНТА</h3>
                  <p className="text-sm text-text-secondary leading-relaxed opacity-60">Синхронизация с серверами авторизации... Пожалуйста, подождите, мы проверяем валидность данных.</p>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">АККАУНТ ВАЛИДЕН</h3>
                  <p className="text-sm text-text-secondary mb-10 leading-relaxed opacity-60">Проверка завершена успешно. Аккаунт готов к мгновенной передаче вам. Хотите продолжить покупку?</p>
                  <div className="flex gap-4">
                    <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-4 bg-bg-secondary text-text-secondary rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all border border-purple-900/10">ОТКАЗАТЬСЯ</button>
                    <button onClick={handleBuy} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-600/30 transition-all">КУПИТЬ</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductPage;
