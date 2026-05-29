// src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowLeft, Copy, CheckCircle2, AlertCircle,
  CreditCard, Smartphone, Globe, Bitcoin, ExternalLink, Headset,
  ChevronRight, Info, Shield, X, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';

// ═══════════════════════════════════════════════════════════════════════════
// Payment methods config
// ═══════════════════════════════════════════════════════════════════════════

interface PaymentMethod {
  id: string;
  name: string;
  fee: number;       // percent
  minAmount: number;
  maxAmount?: number;
  icon: string;      // emoji or URL
  color: string;     // border/accent color
  type: 'deposit' | 'withdraw' | 'both';
  region?: string;
  popular?: boolean;
  link?: string;     // payment link (will be configured)
}

const DEPOSIT_METHODS: PaymentMethod[] = [
  { id: 'donatx',       name: 'DonatX',             fee: 8,    minAmount: 100,   icon: '💜', color: 'border-purple-500/40',   type: 'deposit', popular: true },
  { id: 'donationalerts',name: 'DonationAlerts',    fee: 12,   minAmount: 10,    icon: '🔔', color: 'border-orange-500/40',   type: 'deposit' },
  { id: 'card_ru',      name: 'Карта РФ',           fee: 6,    minAmount: 10,    icon: '💳', color: 'border-green-500/40',    type: 'deposit', region: 'RU' },
  { id: 'card_world',   name: 'Карта мира',         fee: 12,   minAmount: 1000,  icon: '🌍', color: 'border-cyan-500/40',     type: 'deposit' },
];

const WITHDRAW_METHODS: PaymentMethod[] = [
  { id: 'card_ru_out',   name: 'Карта РФ',          fee: 10,   minAmount: 500,   icon: '💳', color: 'border-green-500/40',   type: 'withdraw', region: 'RU' },
  { id: 'card_world_out',name: 'Зарубежная карта',  fee: 15,   minAmount: 1000,  icon: '🌍', color: 'border-cyan-500/40',    type: 'withdraw' },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

type Mode = 'select' | 'deposit' | 'withdraw';
type Step = 'method' | 'amount' | 'pay' | 'done' | 'error';

interface Props {
  initialMode?: 'deposit' | 'withdraw';
  setCurrentPage?: (page: string) => void;
}

const PaymentPage: React.FC<Props> = ({ initialMode, setCurrentPage }) => {
  const [mode, setMode] = useState<Mode>(initialMode || 'select');
  
  // If initialMode changes (from sidebar buttons), update mode
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [userDisplay, setUserDisplay] = useState('');
  const [fullUserId, setFullUserId] = useState('');

  // Withdraw fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [bankName, setBankName] = useState('');

  const { convert, symbol } = useCurrency();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        setUser(u.user);
        const { data: profile } = await supabase.from('users')
          .select('balance, custom_id, username')
          .eq('id', u.user.id).maybeSingle();
        if (profile) {
          setBalance(profile.balance || 0);
          setUserDisplay(profile.custom_id || profile.username || u.user.id.slice(0, 8));
          setFullUserId(profile.custom_id || u.user.id);
        }
      }
    })();
  }, []);

  const numAmount = parseInt(amount) || 0;
  const fee = selectedMethod ? Math.round(numAmount * selectedMethod.fee / 100) : 0;
  const total = mode === 'deposit' ? numAmount + fee : numAmount;
  const receive = mode === 'withdraw' ? numAmount - fee : numAmount;


  const copyUserId = () => {
    navigator.clipboard.writeText(fullUserId || user?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = async () => {
    if (!user || numAmount <= 0 || !selectedMethod) return;
    setSubmitting(true);

    try {
      // Create pending transaction in DB
      const { data: tx, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        method: selectedMethod.id,
        method_name: selectedMethod.name,
        amount: numAmount,
        fee,
        total: total,
        status: 'pending',
        meta: { fee_percent: selectedMethod.fee },
      }).select().single();

      if (error) throw error;
      setTxId(tx.id);
      setStep('pay');
    } catch (e: any) {
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWithdraw = async () => {
    if (!user || numAmount <= 0 || !selectedMethod || !cardNumber) return;
    if (numAmount > balance) { alert('Недостаточно средств'); return; }
    setSubmitting(true);

    try {
      const { data: tx, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdraw',
        method: selectedMethod.id,
        method_name: selectedMethod.name,
        amount: numAmount,
        fee,
        total: receive,
        status: 'pending',
        meta: {
          fee_percent: selectedMethod.fee,
          card_number: cardNumber.replace(/\s/g, '').slice(-4), // only last 4 digits
          card_holder: cardHolder,
          bank_name: bankName,
          full_card: cardNumber.replace(/\s/g, ''), // admin sees full
        },
      }).select().single();

      if (error) throw error;
      setTxId(tx.id);
      setStep('done');
    } catch (e: any) {
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPaid = async () => {
    if (!txId) return;
    await supabase.from('transactions').update({
      status: 'awaiting_confirmation',
    }).eq('id', txId);
    setStep('done');
  };

  const reset = () => {
    setMode('select');
    setStep('method');
    setSelectedMethod(null);
    setAmount('');
    setTxId(null);
    setCardNumber('');
    setCardHolder('');
    setBankName('');
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Wallet size={48} className="mx-auto text-purple-600 mb-4" />
        <p className="text-white text-lg font-semibold">Войдите в систему для пополнения</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        {mode !== 'select' && (
          <motion.button onClick={step === 'method' ? reset : () => setStep('method')}
            whileHover={{ x: -2 }}
            className="p-2 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/40 transition-all">
            <ArrowLeft size={18} />
          </motion.button>
        )}
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center">
          <Wallet size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'select' ? 'Финансы' : mode === 'deposit' ? 'Пополнение' : 'Вывод средств'}
          </h1>
          <p className="text-xs text-text-secondary">
            Баланс: <span className="text-white font-semibold">{balance.toLocaleString('ru-RU')} ₽</span>
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ═══════════════════ MODE SELECT ═══════════════════ */}
        {mode === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'deposit',  label: 'Пополнить баланс',  desc: 'Выберите способ и сумму', icon: Wallet,       color: 'text-green-400',  border: 'hover:border-green-500/50' },
              { id: 'withdraw', label: 'Вывести средства',  desc: 'На карту или кошелёк',     icon: ArrowDownLeft, color: 'text-purple-400', border: 'hover:border-purple-500/50' },
            ].map(item => (
              <motion.button key={item.id}
                onClick={() => { setMode(item.id as Mode); setStep('method'); }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-[#171425] border border-purple-900/20 ${item.border} rounded-2xl p-6 text-left transition-all group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} className={item.color} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.label}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ═══════════════════ STEP 1: METHOD ═══════════════════ */}
        {mode !== 'select' && step === 'method' && (
          <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <h2 className="text-base font-semibold text-white">Выберите способ {mode === 'deposit' ? 'пополнения' : 'вывода'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(mode === 'deposit' ? DEPOSIT_METHODS : WITHDRAW_METHODS).map((m, i) => (
                <motion.button key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setSelectedMethod(m); setStep('amount'); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-[#171425] border ${m.color} rounded-xl p-4 text-left transition-all hover:bg-purple-900/10 relative overflow-hidden`}
                >
                  {m.popular && (
                    <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-bold">
                      Популярное
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-[10px] text-text-secondary">
                        Комиссия {m.fee}% · от {m.minAmount.toLocaleString('ru-RU')} ₽
                        {m.maxAmount && ` · до ${m.maxAmount.toLocaleString('ru-RU')} ₽`}
                      </p>
                    </div>
                  </div>
                  {m.region && (
                    <span className="mt-2 inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/30">
                      {m.region}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════ STEP 2: AMOUNT ═══════════════════ */}
        {step === 'amount' && selectedMethod && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6 space-y-5">

            {/* Selected method */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedMethod.color} bg-purple-900/10`}>
              <span className="text-2xl">{selectedMethod.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{selectedMethod.name}</p>
                <p className="text-[10px] text-text-secondary">
                  Комиссия {selectedMethod.fee}% · от {selectedMethod.minAmount.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>

            {/* User ID (for deposit) */}
            {mode === 'deposit' && (
              <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4">
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">Ваш ID для оплаты</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-[#171425] border border-purple-900/30 text-white font-mono text-sm truncate">
                    {fullUserId || user?.id || '—'}
                  </code>
                  <motion.button onClick={copyUserId}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className={`p-2.5 rounded-lg transition-all flex-shrink-0 ${
                      copied
                        ? 'bg-green-900/30 border border-green-700/30 text-green-400'
                        : 'bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/40'
                    }`}>
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </motion.button>
                </div>
                <div className="mt-2 flex items-start gap-2 bg-yellow-900/10 border border-yellow-700/30 rounded-lg p-2.5">
                  <AlertCircle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-yellow-400">
                    Обязательно укажите этот ID в комментарии к платежу. Без него оплата не будет зачислена!
                  </p>
                </div>
              </div>
            )}

            {/* Withdraw card fields */}
            {mode === 'withdraw' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block">Номер карты *</label>
                  <input type="text" value={cardNumber}
                    onChange={e => setCardNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 19))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white font-mono focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">Имя владельца</label>
                    <input type="text" value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                      placeholder="IVAN IVANOV"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">Банк</label>
                    <input type="text" value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="Т-Банк, Сбер..."
                      className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                {mode === 'withdraw' && numAmount > balance && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-900/10 border border-red-700/30 rounded-lg">
                    <AlertCircle size={13} className="text-red-400" />
                    <span className="text-[10px] text-red-400">Недостаточно средств на балансе</span>
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-sm text-text-secondary mb-2 block">
                {mode === 'deposit' ? 'Сумма пополнения' : 'Сумма вывода'}
              </label>
              <div className="relative">
                <input type="number" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`от ${selectedMethod.minAmount}`}
                  min={selectedMethod.minAmount}
                  className="w-full px-4 py-3.5 rounded-xl text-sm pr-10 bg-[#0B0A12] border border-purple-900/30 text-white text-lg font-semibold focus:border-accent focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₽</span>
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_AMOUNTS.filter(a => a >= selectedMethod.minAmount).map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      amount === String(a)
                        ? 'border-accent bg-purple-900/30 text-accent-soft'
                        : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                    }`}>
                    {a.toLocaleString('ru-RU')} ₽
                  </button>
                ))}
              </div>
            </div>

            {/* Fee calculation */}
            {numAmount > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Сумма</span>
                  <span className="text-white font-medium">{numAmount.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Комиссия ({selectedMethod.fee}%)</span>
                  <span className="text-yellow-400 font-medium">{fee.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="h-px bg-purple-900/20" />
                <div className="flex justify-between text-sm">
                  <span className="text-white font-semibold">
                    {mode === 'deposit' ? 'Итого к оплате' : 'Вы получите'}
                  </span>
                  <span className="text-white font-bold text-lg">
                    {mode === 'deposit'
                      ? total.toLocaleString('ru-RU')
                      : receive.toLocaleString('ru-RU')
                    } ₽
                  </span>
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              onClick={mode === 'deposit' ? handleSubmitDeposit : handleSubmitWithdraw}
              disabled={
                submitting ||
                numAmount < (selectedMethod?.minAmount || 0) ||
                (mode === 'withdraw' && (!cardNumber || numAmount > balance))
              }
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  {mode === 'deposit' ? <Wallet size={16} /> : <ArrowDownLeft size={16} />}
                  {mode === 'deposit' ? 'Перейти к оплате' : 'Отправить заявку на вывод'}
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* ═══════════════════ STEP 3: PAY (deposit only) ═══════════════════ */}
        {step === 'pay' && selectedMethod && (
          <motion.div key="pay" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-[#171425] border border-purple-900/20 rounded-2xl p-6 space-y-5">

            <div className="text-center">
              <span className="text-4xl mb-3 block">{selectedMethod.icon}</span>
              <h2 className="text-lg font-bold text-white">Оплата через {selectedMethod.name}</h2>
              <p className="text-sm text-text-secondary mt-1">
                Переведите <span className="text-white font-bold">{total.toLocaleString('ru-RU')} ₽</span> и нажмите «Я оплатил»
              </p>
            </div>

            {/* User ID reminder */}
            <div className="bg-[#0B0A12] border border-yellow-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Укажите в комментарии к платежу:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[#171425] border border-purple-900/30 text-white font-mono text-sm truncate">
                  {fullUserId || user?.id}
                </code>
                <motion.button onClick={copyUserId}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-900/30 text-green-400' : 'bg-purple-900/20 text-purple-300'}`}>
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </motion.button>
              </div>
            </div>

            {/* Payment details */}
            <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-2">
              {[
                { label: 'Сумма', value: `${numAmount.toLocaleString('ru-RU')} ₽` },
                { label: 'Комиссия', value: `${fee.toLocaleString('ru-RU')} ₽ (${selectedMethod.fee}%)` },
                { label: 'Итого к оплате', value: `${total.toLocaleString('ru-RU')} ₽`, bold: true },
                { label: 'Способ', value: selectedMethod.name },
                { label: 'Номер заявки', value: `#${txId?.slice(0, 8) || '—'}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{r.label}</span>
                  <span className={`${r.bold ? 'text-white font-bold' : 'text-white'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button onClick={confirmPaid}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all">
                <CheckCircle2 size={16} /> Я оплатил
              </motion.button>
              <motion.button onClick={() => setStep('error')}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="py-3 px-4 bg-red-900/20 border border-red-700/30 text-red-400 rounded-xl font-semibold text-sm transition-all">
                Проблема
              </motion.button>
            </div>

            <p className="text-[10px] text-text-secondary text-center">
              Обычно зачисление происходит в течение 5-30 минут. Если деньги не поступили — нажмите «Проблема»
            </p>
          </motion.div>
        )}

        {/* ═══════════════════ DONE ═══════════════════ */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#171425] border border-green-700/30 rounded-2xl p-8 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-600/50 flex items-center justify-center mx-auto">
              {mode === 'deposit' ? <Clock size={40} className="text-green-400" /> : <CheckCircle2 size={40} className="text-green-400" />}
            </motion.div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'deposit' ? 'Заявка отправлена!' : 'Заявка на вывод создана!'}
            </h2>
            <p className="text-sm text-text-secondary">
              {mode === 'deposit'
                ? 'Ожидайте зачисления на баланс. Обычно до 30 минут.'
                : `Вывод ${receive.toLocaleString('ru-RU')} ₽ на карту. Обработка до 24 часов.`
              }
            </p>
            <p className="text-[10px] text-text-secondary">
              Заявка #{txId?.slice(0, 8)}
            </p>
            <div className="flex gap-3 pt-2">
              <motion.button onClick={reset}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all">
                Вернуться
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════ ERROR ═══════════════════ */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#171425] border border-red-700/30 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Возникла проблема?</h2>
            <p className="text-sm text-text-secondary">
              Если платёж не зачислился или возникла ошибка — создайте тикет в поддержку
            </p>
            {txId && (
              <p className="text-[10px] text-text-secondary">
                Укажите номер заявки: <span className="text-white font-mono">#{txId.slice(0, 8)}</span>
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={() => setCurrentPage?.('support')}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                <Headset size={16} /> Написать в поддержку
              </motion.button>
              <motion.button onClick={reset}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="py-3 px-5 bg-purple-900/20 border border-purple-700/30 text-purple-300 rounded-xl text-sm transition-all">
                Назад
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
