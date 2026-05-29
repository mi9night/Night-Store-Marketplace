// src/pages/PurchasesPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Clock, CheckCircle2, Package, Shield,
  Download, Copy, Eye, EyeOff, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface Props {
  onSelectAccount: (a: Account) => void;
  setCurrentPage: (p: Page) => void;
}

interface Order {
  id: string;
  account_id: string;
  amount: number;
  status: string;
  created_at: string;
  account?: any;
}

const PurchasesPage: React.FC<Props> = ({ onSelectAccount, setCurrentPage }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());
  const [revealedData, setRevealedData] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [checkResults, setCheckResults] = useState<Record<string, any>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', u.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const accountIds = (data || []).map(o => o.account_id).filter(Boolean);
        let accMap: Record<string, any> = {};
        if (accountIds.length > 0) {
          const { data: accs } = await supabase
            .from('accounts').select('*').in('id', accountIds);
          accs?.forEach(a => { accMap[a.id] = a; });
        }
        const withAccounts = (data || []).map(o => ({ ...o, account: accMap[o.account_id] }));
        setOrders(withAccounts);

        // Check if we should highlight a specific purchase
        const hlId = localStorage.getItem('highlight_purchase_account');
        if (hlId) {
          localStorage.removeItem('highlight_purchase_account');
          setHighlightId(hlId);
          const matchOrder = withAccounts.find((o: any) => o.account_id === hlId);
          if (matchOrder) {
            setRevealedData(prev => ({ ...prev, [matchOrder.id]: true }));
          }
          setTimeout(() => setHighlightId(null), 5000);
        }
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Тикаем каждую секунду для шкалы гарантии
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Скопировано');
    } catch {}
  };

  // Расчёт гарантии
  const guaranteeInfo = (order: Order) => {
    const hours = order.account?.guarantee_hours || 24;
    if (!order.account?.guarantee) return null;
    const start = new Date(order.created_at).getTime();
    const end = start + hours * 3600 * 1000;
    const total = end - start;
    const elapsed = now - start;
    const left = end - now;
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    const isActive = left > 0;
    if (!isActive) return { active: false, pct: 100, left: 0, hours };
    const days = Math.floor(left / 86400000);
    const hh = Math.floor((left % 86400000) / 3600000);
    const mm = Math.floor((left % 3600000) / 60000);
    const ss = Math.floor((left % 60000) / 1000);
    const text = days > 0 ? `${days}д ${hh}ч ${mm}м` : hh > 0 ? `${hh}ч ${mm}м ${ss}с` : `${mm}м ${ss}с`;
    return { active: true, pct, left, hours, text };
  };

  // Check account changes via bot
  const checkChanges = async (order: Order) => {
    if (!order.account_id) return;
    setChecking(prev => ({ ...prev, [order.id]: true }));

    try {
      // Trigger recheck
      await supabase.from('accounts').update({
        validation_status: 'recheck_pending',
      }).eq('id', order.account_id);

      // Poll for result
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: val } = await supabase
          .from('account_validations')
          .select('*')
          .eq('account_id', order.account_id)
          .maybeSingle();

        if (val && val.checked_at && new Date(val.checked_at).getTime() > Date.now() - 60000) {
          clearInterval(poll);
          setChecking(prev => ({ ...prev, [order.id]: false }));

          // Get latest history with changes
          const { data: hist } = await supabase
            .from('validation_history')
            .select('*')
            .eq('account_id', order.account_id)
            .order('checked_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          setCheckResults(prev => ({
            ...prev,
            [order.id]: {
              status: val.status,
              checked_at: val.checked_at,
              has_changes: hist?.has_changes || false,
              changes: hist?.changes || [],
              severity: hist?.changes_severity || 'none',
              vac_ban: val.vac_ban,
              trade_ban: val.trade_ban,
              level: val.level,
              hours_played: val.hours_played,
              games_count: val.games_count,
            },
          }));
        }

        if (attempts > 30) {
          clearInterval(poll);
          setChecking(prev => ({ ...prev, [order.id]: false }));
          setCheckResults(prev => ({
            ...prev,
            [order.id]: { status: 'timeout', has_changes: false, changes: [] },
          }));
        }
      }, 2000);
    } catch {
      setChecking(prev => ({ ...prev, [order.id]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <ShoppingBag size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Мои покупки</h1>
        {orders.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">{orders.length}</span>
        )}
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Покупок пока нет</h3>
          <p className="text-sm text-text-secondary mb-6">Загляни в маркет — там много интересного 🌙</p>
          <button onClick={() => setCurrentPage('market')}
            className="px-5 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold">
            Перейти в маркет
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const guar = guaranteeInfo(o);
            const showData = revealedData[o.id];
            const accData = o.account?.data || {};
            const hasData = accData && Object.keys(accData).length > 0;

            return (
              <motion.div key={o.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`bg-bg-card border rounded-2xl p-4 transition-all duration-700 ${
                  highlightId && o.account_id === highlightId
                    ? 'border-green-500/60 shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-1 ring-green-500/30'
                    : 'border-purple-900/20'
                }`}>

                {/* New purchase badge */}
                <AnimatePresence>
                  {highlightId && o.account_id === highlightId && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/30 rounded-xl"
                    >
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-xs font-semibold text-green-400">🎉 Новая покупка!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Шапка */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (o.account) {
                        onSelectAccount(dbToAccount(o.account));
                        setCurrentPage('product');
                      }
                    }}>
                    <p className="text-sm font-semibold text-white truncate hover:text-purple-300 transition-colors">
                      {o.account?.title || 'Аккаунт удалён'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-white">{o.amount?.toLocaleString('ru-RU')} ₽</p>
                    <div className="flex items-center gap-1 justify-end text-xs text-green-400">
                      <CheckCircle2 size={10} />
                      {o.status === 'completed' ? 'Получено' : o.status}
                    </div>
                  </div>
                </div>

                {/* Шкала гарантии */}
                {guar && guar.active && (
                  <div className="mt-3 p-3 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400">Гарантия активна</span>
                      </div>
                      <span className="text-xs text-blue-300 font-mono">⏱ {guar.text}</span>
                    </div>
                    <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - guar.pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Срок: {guar.hours}ч · если что-то не так — открой спор
                    </p>
                  </div>
                )}
                {guar && !guar.active && (
                  <div className="mt-3 p-2 bg-bg-secondary border border-purple-900/20 rounded-xl flex items-center gap-2">
                    <Shield size={12} className="text-text-secondary" />
                    <span className="text-xs text-text-secondary">Гарантия истекла ({guar.hours}ч)</span>
                  </div>
                )}

                {/* Check changes button */}
                <div className="mt-3 flex gap-2">
                  <motion.button
                    onClick={() => checkChanges(o)}
                    disabled={!!checking[o.id]}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800/30 text-purple-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={checking[o.id] ? 'animate-spin' : ''} />
                    {checking[o.id] ? 'Проверяем...' : 'Проверить изменения'}
                  </motion.button>
                </div>

                {/* Check results */}
                <AnimatePresence>
                  {checkResults[o.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`mt-3 p-3 rounded-xl border ${
                        checkResults[o.id].status === 'timeout'
                          ? 'bg-yellow-900/10 border-yellow-700/30'
                          : checkResults[o.id].has_changes
                            ? checkResults[o.id].severity === 'critical'
                              ? 'bg-red-900/10 border-red-700/30'
                              : 'bg-yellow-900/10 border-yellow-700/30'
                            : 'bg-green-900/10 border-green-700/30'
                      }`}>
                        {checkResults[o.id].status === 'timeout' ? (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">Проверка занимает больше времени. Результат появится позже.</span>
                          </div>
                        ) : checkResults[o.id].has_changes ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle size={14} className={checkResults[o.id].severity === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
                              <span className={`text-xs font-semibold ${checkResults[o.id].severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {checkResults[o.id].severity === 'critical' ? '⛔ Критические изменения!' : '⚠️ Обнаружены изменения'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {(checkResults[o.id].changes || []).map((ch: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                  <span className="text-text-secondary">{ch.field}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-400 line-through">{String(ch.old ?? '—')}</span>
                                    <span className="text-text-secondary">→</span>
                                    <span className="text-green-400">{String(ch.new ?? '—')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-xs text-green-400">✅ Всё в порядке — изменений не обнаружено</span>
                          </div>
                        )}
                        {checkResults[o.id].checked_at && (
                          <p className="text-[10px] text-text-secondary mt-1.5">
                            Проверено: {new Date(checkResults[o.id].checked_at).toLocaleString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Кнопка получить данные */}
                <button
                  onClick={() => setRevealedData(p => ({ ...p, [o.id]: !p[o.id] }))}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800/30 text-white rounded-xl text-sm font-semibold transition-colors">
                  {showData ? <><EyeOff size={14} /> Скрыть данные аккаунта</> : <><Download size={14} /> Получить данные аккаунта</>}
                </button>

                {/* Раскрытые данные */}
                <AnimatePresence>
                  {showData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <div className="mt-3 p-3 bg-[#0B0A12] border border-purple-700/40 rounded-xl">
                        <p className="text-[10px] text-text-secondary uppercase mb-2 flex items-center gap-1">
                          🔐 Данные для входа
                        </p>
                        {hasData ? (
                          <div className="space-y-2">
                            {Object.entries(accData).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-2 bg-bg-card rounded-lg p-2">
                                <span className="text-[10px] text-text-secondary uppercase min-w-[60px]">{k}:</span>
                                <span className="text-xs text-white flex-1 font-mono truncate">{String(v)}</span>
                                <button onClick={() => copyText(String(v))}
                                  className="p-1 text-purple-300 hover:text-white" title="Копировать">
                                  <Copy size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-bg-card rounded-lg p-3 text-center">
                            <p className="text-xs text-text-secondary mb-2">
                              💬 Продавец не загрузил автоматические данные
                            </p>
                            <p className="text-[10px] text-text-secondary">
                              Свяжитесь с продавцом для получения логина / пароля
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-text-secondary mt-2 flex items-center gap-1">
                          ⚠️ Никому не передавайте эти данные
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;
