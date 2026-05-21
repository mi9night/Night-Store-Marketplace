// src/components/BalanceMenu.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, X, Plus, ArrowDownLeft, ArrowLeftRight,
  ArrowRightLeft, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
}

type Action = 'deposit' | 'withdraw' | 'transfer' | null;

const CURRENCIES = [
  { code: 'RUB', name: 'Рубль', flag: '🇷🇺' },
  { code: 'USD', name: 'Доллар', flag: '🇺🇸' },
  { code: 'EUR', name: 'Евро',   flag: '🇪🇺' },
  { code: 'UAH', name: 'Гривна', flag: '🇺🇦' },
  { code: 'KZT', name: 'Тенге',  flag: '🇰🇿' },
];

const BalanceMenu: React.FC<Props> = ({ isOpen, onClose, balance }) => {
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [currency, setCurrency] = useState('RUB');
  const [rates, setRates] = useState<Record<string, number>>({ RUB: 1 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* ============ Курсы валют ============ */
  useEffect(() => {
    if (!isOpen) return;
    fetch('https://open.er-api.com/v6/latest/RUB')
      .then(r => r.json())
      .then(d => {
        if (d.result === 'success') setRates({ RUB: 1, ...d.rates });
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (action) {
      setAmount('');
      setRecipient('');
      setResult(null);
    }
  }, [action]);

  const balanceInCurrency = currency === 'RUB'
    ? balance
    : rates[currency]
      ? balance * rates[currency]
      : 0;

  const submit = async () => {
    setResult(null);
    const num = parseFloat(amount);
    if (!num || num <= 0) { setResult({ type: 'err', text: 'Введите сумму' }); return; }

    setLoading(true);
    try {
      const errMap: Record<string, string> = {
        not_authenticated: 'Войдите в систему',
        invalid_amount: 'Неверная сумма',
        insufficient_balance: 'Недостаточно средств',
        recipient_not_found: 'Получатель не найден',
        cannot_transfer_to_self: 'Нельзя переводить самому себе',
      };

      if (action === 'deposit') {
        const { data, error } = await supabase.rpc('demo_deposit', { p_amount: num });
        if (error) throw error;
        if (!data?.ok) { setResult({ type: 'err', text: errMap[data?.error] || data?.error }); return; }
        setResult({ type: 'ok', text: `✅ Баланс пополнен на ${num} ₽` });

      } else if (action === 'transfer') {
        if (!recipient.trim()) { setResult({ type: 'err', text: 'Укажите получателя' }); return; }
        const { data, error } = await supabase.rpc('transfer_to_user', { p_recipient: recipient, p_amount: num });
        if (error) throw error;
        if (!data?.ok) { setResult({ type: 'err', text: errMap[data?.error] || data?.error }); return; }
        setResult({ type: 'ok', text: '✅ Перевод выполнен' });

      } else if (action === 'withdraw') {
        if (num > balance) { setResult({ type: 'err', text: 'Недостаточно средств' }); return; }
        const { data: u } = await supabase.auth.getUser();
        await supabase.from('operations').insert({
          user_id: u.user?.id, type: 'withdraw', amount: num, status: 'pending',
        });
        setResult({ type: 'ok', text: '✅ Заявка на вывод создана. Появится в "Мои операции"' });
      }

      setTimeout(() => { setAction(null); }, 1500);
    } catch (e: any) {
      setResult({ type: 'err', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[100] flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-purple-900/20 flex items-center gap-3">
            <Wallet size={20} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white flex-1">Баланс</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Текущий баланс с конвертером валют */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-2xl p-5">
              <div className="text-xs text-purple-300 uppercase tracking-wider mb-1">Доступно</div>
              <div className="text-3xl font-bold text-white mb-3">
                {balanceInCurrency.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {currency === 'RUB' ? '₽' : currency}
              </div>
              {currency !== 'RUB' && (
                <div className="text-xs text-text-secondary mb-3">
                  ≈ {balance.toLocaleString('ru-RU')} ₽
                </div>
              )}

              {/* Валюты */}
              <div className="flex gap-1.5 flex-wrap">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      currency === c.code
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-purple-900/30 border-purple-800/30 text-text-secondary hover:text-white'
                    }`}
                  >
                    {c.flag} {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопки действий */}
            {!action && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'deposit',  label: 'Пополнить', icon: Plus,            color: 'text-green-400' },
                  { id: 'withdraw', label: 'Вывести',   icon: ArrowDownLeft,   color: 'text-red-400' },
                  { id: 'transfer', label: 'Перевести', icon: ArrowLeftRight,  color: 'text-purple-300' },
                ].map(b => (
                  <motion.button
                    key={b.id}
                    onClick={() => setAction(b.id as Action)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 p-4 bg-bg-card rounded-xl border border-purple-900/20 hover:border-purple-700/50 transition-all"
                  >
                    <b.icon size={20} className={b.color} />
                    <span className="text-xs text-white font-semibold">{b.label}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Форма действия */}
            {action && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-purple-900/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    {action === 'deposit' && '➕ Пополнить'}
                    {action === 'withdraw' && '➖ Вывести'}
                    {action === 'transfer' && '↔️ Перевести'}
                  </h3>
                  <button onClick={() => setAction(null)} className="text-text-secondary hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <label className="text-xs text-text-secondary mb-1 block">Сумма (₽)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white mb-3"
                />

                {action === 'transfer' && (
                  <>
                    <label className="text-xs text-text-secondary mb-1 block">Получатель (email, ник или ID)</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      placeholder="user@mail.com"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white mb-3"
                    />
                  </>
                )}

                {result && (
                  <div className={`text-sm mb-3 p-2 rounded-lg flex items-start gap-2 ${
                    result.type === 'ok' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                  }`}>
                    {result.type === 'ok' ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />}
                    <span>{result.text}</span>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  {loading ? 'Обработка...' : action === 'deposit' ? 'Пополнить' : action === 'withdraw' ? 'Создать заявку' : 'Перевести'}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BalanceMenu;
