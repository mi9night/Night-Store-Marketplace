// src/components/ReportButton.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  targetType: 'topic' | 'comment' | 'account' | 'user';
  targetId: string;
  targetName?: string;        // что отображать в подсказке
  small?: boolean;
}

const CATEGORIES = [
  { id: 'spam',    label: 'Спам / реклама',           icon: '📢' },
  { id: 'scam',    label: 'Мошенничество / обман',    icon: '⚠️' },
  { id: 'abuse',   label: 'Оскорбления / токсичность', icon: '😡' },
  { id: 'nsfw',    label: '18+ контент',              icon: '🔞' },
  { id: 'fake',    label: 'Дезинформация / фейк',     icon: '🎭' },
  { id: 'other',   label: 'Другое',                   icon: '💭' },
];

const ReportButton: React.FC<Props> = ({ targetType, targetId, targetName, small }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('report_content', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_category: category,
        p_description: description,
      });
      if (error) throw error;
      if (data?.ok) {
        setDone(true);
        setTimeout(() => { setOpen(false); setDone(false); setDescription(''); }, 1500);
      } else {
        alert(data?.error || 'Ошибка');
      }
    } catch (e: any) {
      alert(e.message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Пожаловаться"
        className={`text-text-secondary hover:text-red-400 transition-colors ${small ? 'p-1' : 'flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-purple-900/10 hover:bg-red-900/20'}`}>
        <Flag size={small ? 11 : 12} />
        {!small && 'Жалоба'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md">

              {done ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                    <Flag size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Жалоба отправлена</h3>
                  <p className="text-sm text-text-secondary">Модераторы рассмотрят в ближайшее время</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Flag size={18} className="text-red-400" />
                      Пожаловаться
                    </h3>
                    <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  {targetName && (
                    <div className="mb-3 p-2 bg-purple-900/10 border border-purple-900/20 rounded-lg text-xs text-text-secondary">
                      Жалоба на: <span className="text-white">{targetName}</span>
                    </div>
                  )}

                  <label className="text-xs text-text-secondary mb-2 block font-semibold">Категория</label>
                  <div className="space-y-1 mb-3">
                    {CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => setCategory(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          category === c.id ? 'bg-purple-600/30 text-white border border-purple-500' : 'bg-bg-secondary text-text-secondary border border-purple-900/20 hover:border-purple-700/40'
                        }`}>
                        <span className="text-base">{c.icon}</span>
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <label className="text-xs text-text-secondary mb-1 block">Опишите проблему (необязательно)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Подробности нарушения..." rows={3}
                    className="w-full px-3 py-2 mb-3 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none" />

                  <button onClick={submit} disabled={loading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                    {loading ? 'Отправка...' : 'Отправить жалобу'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReportButton;
