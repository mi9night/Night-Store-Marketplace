import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Clock, CheckCircle2, Package } from 'lucide-react';
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

        // Подгружаем аккаунты
        const accountIds = (data || []).map(o => o.account_id).filter(Boolean);
        let accMap: Record<string, any> = {};
        if (accountIds.length > 0) {
          const { data: accs } = await supabase
            .from('accounts')
            .select('*')
            .in('id', accountIds);
          accs?.forEach(a => { accMap[a.id] = a; });
        }

        const withAccounts = (data || []).map(o => ({
          ...o,
          account: accMap[o.account_id],
        }));
        setOrders(withAccounts);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <ShoppingBag size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Мои покупки</h1>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center">
          <Package size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Покупок пока нет</h3>
          <p className="text-sm text-text-secondary mb-6">Загляни в маркет — там много интересного 🌙</p>
          <button onClick={() => setCurrentPage('market')} className="px-5 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold">
            Перейти в маркет
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-bg-card border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all cursor-pointer"
              onClick={() => {
                if (o.account) {
                  onSelectAccount(dbToAccount(o.account));
                  setCurrentPage('product');
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {o.account?.title || 'Аккаунт удалён'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(o.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">{o.amount?.toLocaleString('ru-RU')} ₽</p>
                  <div className="flex items-center gap-1 justify-end text-xs text-success">
                    <CheckCircle2 size={10} />
                    {o.status === 'completed' ? 'Получено' : o.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;
