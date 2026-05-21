import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Zap, Shield, ArrowRight, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { Account } from '../types';
import { Page } from '../types/pages';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';

interface CartPageProps {
  cartItems: Account[];
  onRemove: (id: string) => void;
  setCurrentPage: (page: Page) => void;
  onSelectAccount: (account: Account) => void;
  onClearCart?: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ cartItems, onRemove, setCurrentPage, onSelectAccount, onClearCart }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discount = cartItems.reduce((sum, item) => sum + (item.oldPrice ? item.oldPrice - item.price : 0), 0);
  const fee = Math.round(total * 0.03);

  const [buying, setBuying] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const { convert, symbol, currency } = useCurrency();
  const fmt = (n: number) => convert(n).toLocaleString('ru-RU', { maximumFractionDigits: currency === 'RUB' ? 0 : 2 }) + ' ' + symbol;

  const handleCheckout = async () => {
    setResult(null);
    setBuying(true);
    try {
      const successIds: string[] = [];
      const errors: string[] = [];

      // Покупаем по одному (RPC обеспечивает атомарность)
      for (const item of cartItems) {
        const { data, error } = await supabase.rpc('purchase_account', { p_account_id: item.id });
        if (error) {
          errors.push(`${item.title}: ${error.message}`);
        } else if (data?.ok) {
          successIds.push(item.id);
        } else {
          const errMsg = data?.error || 'unknown';
          const human: Record<string, string> = {
            insufficient_balance: 'недостаточно средств',
            account_not_available: 'уже продан',
            account_not_found: 'не найден',
            cannot_buy_own: 'свой аккаунт',
            not_authenticated: 'войдите в систему',
          };
          errors.push(`${item.title}: ${human[errMsg] || errMsg}`);
        }
      }

      // Удаляем купленные из корзины
      successIds.forEach(id => onRemove(id));

      if (errors.length === 0) {
        setResult({ type: 'ok', text: `✅ Куплено ${successIds.length} ${successIds.length === 1 ? 'аккаунт' : 'аккаунтов'}!` });
        setTimeout(() => {
          setCurrentPage('purchases');
        }, 2000);
      } else if (successIds.length > 0) {
        setResult({ type: 'err', text: `Куплено ${successIds.length}, но: ${errors.join('; ')}` });
      } else {
        setResult({ type: 'err', text: errors.join('; ') });
      }
    } catch (e: any) {
      setResult({ type: 'err', text: e.message || 'Ошибка покупки' });
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <ShoppingCart size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Корзина</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-accent-soft">{cartItems.length} товаров</span>
      </motion.div>

      {cartItems.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-text-secondary" />
          </div>
          <p className="text-xl text-text-primary font-semibold mb-2">Корзина пуста</p>
          <p className="text-text-secondary mb-6">Добавьте товары из маркетплейса</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentPage('market')} className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold flex items-center gap-2 mx-auto">
            Перейти на маркет <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {cartItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-bg-card border border-purple-900/20 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">
                      {item.category === 'steam' ? '🎮' : item.category === 'discord' ? '💬' : item.category === 'vpn' ? '🔒' : '📦'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onSelectAccount(item); setCurrentPage('product'); }}>
                    <p className="text-sm font-semibold text-text-primary hover:text-accent-soft transition-colors line-clamp-1">{item.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.seller?.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.guarantee && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-green-900/20 text-green-400">
                          <Shield size={9} /> {item.guaranteeHours}ч
                        </span>
                      )}
                      {item.escrow && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-purple-900/20 text-accent-soft">
                          <Shield size={9} /> Escrow
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-text-primary">{fmt(item.price)}</p>
                    {item.oldPrice && (
                      <p className="text-xs text-text-secondary line-through">{fmt(item.oldPrice)}</p>
                    )}
                  </div>
                  <motion.button onClick={() => onRemove(item.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-text-secondary hover:text-error transition-colors">
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-5 h-fit sticky top-20"
          >
            <h3 className="text-base font-bold text-text-primary mb-4">Итог заказа</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Товары ({cartItems.length})</span>
                <span className="text-text-primary">{fmt(total + discount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Скидка</span>
                  <span className="text-success">-{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Комиссия сервиса (3%)</span>
                <span className="text-text-primary">{fmt(fee)}</span>
              </div>
              <div className="border-t border-purple-900/20 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-primary">К оплате</span>
                  <span className="text-xl font-bold text-accent-soft">
                    {fmt(total + fee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-accent" />
                <span className="text-xs font-semibold text-accent-soft">Escrow защита</span>
              </div>
              <p className="text-xs text-text-secondary">
                Средства списываются мгновенно, аккаунт сразу попадает в «Мои покупки»
              </p>
            </div>

            {result && (
              <div className={`text-sm mb-3 p-3 rounded-lg flex items-start gap-2 ${
                result.type === 'ok' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {result.type === 'ok' ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
                <span>{result.text}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {buying ? 'Покупка...' : <><Zap size={18} /> Оплатить с баланса</>}
            </motion.button>

            <p className="text-xs text-text-secondary text-center mt-3">
              Списание происходит с баланса вашего аккаунта
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
