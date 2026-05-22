import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, Eye, MessageSquare, Lock, Tag, Users, Package,
  CheckCircle2 as CC2, AlertCircle, Send, Loader2
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

  // Состояния для демо-проверки
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState<'loading' | 'success'>('loading');

  const [myOrder, setMyOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const { convert, symbol, currency } = useCurrency();

  const risk = riskConfig[account.riskLevel as keyof typeof riskConfig] || riskConfig.low;

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);
      if (u.user) {
        const { data: f } = await supabase.from('favorites').select('account_id').eq('user_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (f) setIsFav(true);
        const { data: ord } = await supabase.from('orders').select('*').eq('buyer_id', u.user.id).eq('account_id', account.id).maybeSingle();
        if (ord) setMyOrder(ord);
      }
      const sellerId = (account.seller as any)?.id;
      if (sellerId) {
        const { data: s } = await supabase.from('users').select('*').eq('id', sellerId).maybeSingle();
        setSeller(s);
      }
    };
    load();
  }, [account.id]);

  const startVerification = () => {
    setShowVerifyModal(true);
    setVerifyStep('loading');
    setTimeout(() => {
      setVerifyStep('success');
    }, 5000);
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
            <h1 className="text-2xl font-bold text-white mb-4">{account.title}</h1>
            <div className={`p-4 rounded-xl border mb-6 ${risk.className}`}>
              <div className="flex items-center gap-2 font-bold mb-1"><risk.Icon size={18}/> {risk.label}</div>
              <p className="text-xs opacity-80">{risk.desc}</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{account.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {infoItems.map(item => (
              <div key={item.label} className="bg-[#171425] p-4 rounded-2xl border border-purple-900/20">
                <div className="text-[10px] text-text-secondary uppercase mb-1">{item.label}</div>
                <div className="text-sm font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6 lg:sticky lg:top-20">
            <div className="text-3xl font-bold text-white mb-6">
              {convert(account.price).toLocaleString('ru-RU')} <span className="text-lg text-text-secondary">{symbol}</span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={startVerification} 
                disabled={buying || !!myOrder}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={18} /> {buying ? 'Покупка...' : 'Купить'}
              </button>
              <button onClick={() => onAddToCart(account)} className="w-full py-4 bg-purple-900/20 border border-purple-800/30 text-white rounded-2xl font-bold hover:bg-purple-900/40">
                В корзину
              </button>
            </div>
            
            {buyResult && (
              <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${buyResult.type === 'ok' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                {buyResult.type === 'ok' ? <CC2 size={16}/> : <AlertCircle size={16}/>}
                {buyResult.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-bg-card border border-purple-900/30 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl">
              {verifyStep === 'loading' ? (
                <>
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <Loader2 size={80} className="text-purple-500 animate-spin opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                       </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Проверка аккаунта</h3>
                  <p className="text-sm text-text-secondary">Подключаемся к серверам для верификации данных...</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Аккаунт проверен</h3>
                  <p className="text-sm text-text-secondary mb-8">Данные верны, аккаунт готов к передаче и работает исправно.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 bg-purple-900/20 text-white rounded-xl font-semibold">Отказаться</button>
                    <button onClick={handleBuy} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-600/20">Купить</button>
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
