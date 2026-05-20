import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, ArrowDownLeft, ArrowLeftRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Op {
  id: string;
  type: string;
  amount: number;
  status: string;
  recipient?: string;
  created_at: string;
}

const OperationsPage: React.FC = () => {
  const [ops, setOps] = useState<Op[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;

        const { data, error } = await supabase
          .from('operations')
          .select('*')
          .eq('user_id', u.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOps(data || []);
      } catch (e) {
        setOps([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const typeConfig: Record<string, { icon: any; label: string; color: string; sign: string }> = {
    deposit:  { icon: Plus,           label: 'Пополнение', color: 'text-success',     sign: '+' },
    withdraw: { icon: ArrowDownLeft,  label: 'Вывод',      color: 'text-error',       sign: '−' },
    transfer: { icon: ArrowLeftRight, label: 'Перевод',    color: 'text-accent-soft', sign: '→' },
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending:   { label: 'В обработке', color: 'text-orange-400', icon: Clock },
    completed: { label: 'Выполнено',   color: 'text-success',    icon: CheckCircle2 },
    failed:    { label: 'Отменено',    color: 'text-error',      icon: XCircle },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Receipt size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-white">Мои операции</h1>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : ops.length === 0 ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center">
          <Receipt size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Операций пока нет</h3>
          <p className="text-sm text-text-secondary">
            Пополни баланс или сделай перевод — операции появятся здесь
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ops.map((op, i) => {
            const t = typeConfig[op.type] || typeConfig.deposit;
            const s = statusConfig[op.status] || statusConfig.pending;
            return (
              <motion.div
                key={op.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-bg-card border border-purple-900/20 rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center ${t.color}`}>
                  <t.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{t.label}</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(op.created_at).toLocaleString('ru-RU')}
                    {op.recipient && ` · → ${op.recipient}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${t.color}`}>
                    {t.sign}{op.amount.toLocaleString('ru-RU')} ₽
                  </p>
                  <div className={`flex items-center gap-1 justify-end text-xs ${s.color}`}>
                    <s.icon size={10} /> {s.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperationsPage;
