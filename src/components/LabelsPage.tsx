// src/pages/LabelsPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LabelChip from '../components/LabelChip';

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple', 'pink'];
const ICONS  = ['🏷', '⭐', '🔥', '💎', '🎯', '⚡', '🚀', '👑', '🌙', '✨', '🎪', '🛡', '⚠️', '✅', '❌', '🎮', '💰', '📌'];

const LabelsPage: React.FC = () => {
  const [me, setMe] = useState<any>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('purple');
  const [icon, setIcon] = useState('🏷');
  const [isPublic, setIsPublic] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user);

    const { data } = await supabase.from('labels')
      .select('*').eq('owner_id', u.user.id)
      .order('created_at', { ascending: false });
    setLabels(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (label?: any) => {
    if (label) {
      setEditing(label);
      setName(label.name); setColor(label.color); setIcon(label.icon); setIsPublic(label.is_public);
    } else {
      setEditing(null);
      setName(''); setColor('purple'); setIcon('🏷'); setIsPublic(false);
    }
    setShowForm(true);
  };

  const save = async () => {
    if (!name.trim() || !me) return;
    if (editing) {
      await supabase.from('labels').update({ name, color, icon, is_public: isPublic }).eq('id', editing.id);
    } else {
      await supabase.from('labels').insert({
        owner_id: me.id, name, color, icon, is_public: isPublic,
      });
    }
    setShowForm(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Удалить метку?')) return;
    await supabase.from('labels').delete().eq('id', id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag size={24} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Управление метками</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">{labels.length}</span>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
          <Plus size={14} /> Создать метку
        </button>
      </motion.div>

      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4">
        <p className="text-sm text-text-secondary mb-3">
          💡 Создавай свои метки и прикрепляй их к товарам, темам и профилям пользователей
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : labels.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <Tag size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Меток пока нет</h3>
          <p className="text-sm text-text-secondary">Создай первую метку, чтобы организовать контент</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {labels.map(l => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#171425] border border-purple-900/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <LabelChip label={l} />
                {l.is_public && (
                  <p className="text-[10px] text-green-400 mt-1">🌐 Публичная</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openForm(l)} className="p-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => del(l.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Форма */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">{editing ? 'Изменить метку' : 'Новая метка'}</h3>
                <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white"><X size={20} /></button>
              </div>

              <label className="text-xs text-text-secondary mb-1 block">Название</label>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
                placeholder="Например: VIP" autoFocus
                className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

              <label className="text-xs text-text-secondary mb-1 block">Иконка</label>
              <div className="flex gap-1 flex-wrap mb-3">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)}
                    className={`w-9 h-9 rounded-lg text-base flex items-center justify-center ${
                      icon === i ? 'bg-purple-600' : 'bg-bg-secondary border border-purple-900/30 hover:border-purple-700/50'
                    }`}>
                    {i}
                  </button>
                ))}
              </div>

              <label className="text-xs text-text-secondary mb-1 block">Цвет</label>
              <div className="flex gap-1 flex-wrap mb-3">
                {COLORS.map(col => (
                  <button key={col} onClick={() => setColor(col)}
                    className={`w-8 h-8 rounded-lg border-2 ${color === col ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: ({ red:'#ef4444', orange:'#f97316', yellow:'#eab308', green:'#22c55e', blue:'#3b82f6', cyan:'#06b6d4', purple:'#a855f7', pink:'#ec4899' } as any)[col] }} />
                ))}
              </div>

              <label className="flex items-center gap-2 mb-4 cursor-pointer p-2 bg-bg-secondary rounded-lg">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-purple-500" />
                <span className="text-sm text-white">🌐 Публичная (могут использовать другие)</span>
              </label>

              <div className="mb-4 p-3 bg-bg-secondary rounded-xl text-center">
                <p className="text-xs text-text-secondary mb-2">Превью:</p>
                <LabelChip label={{ name: name || 'Метка', color, icon }} />
              </div>

              <button onClick={save} disabled={!name.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {editing ? 'Сохранить' : 'Создать'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabelsPage;
