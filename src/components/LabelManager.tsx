// src/components/LabelManager.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LabelChip from './LabelChip';

interface Props {
  targetType: 'profile' | 'account' | 'topic';
  targetId: string;
  small?: boolean;
}

const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'cyan', 'purple', 'pink'];
const ICONS  = ['🏷', '⭐', '🔥', '💎', '🎯', '⚡', '🚀', '👑', '🌙', '✨', '🎪', '🛡', '⚠️', '✅', '❌'];

const LabelManager: React.FC<Props> = ({ targetType, targetId, small }) => {
  const [me, setMe] = useState<any>(null);
  const [assigned, setAssigned] = useState<any[]>([]);   // что прицеплено
  const [myLabels, setMyLabels] = useState<any[]>([]);   // мои метки
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Форма новой метки
  const [name, setName] = useState('');
  const [color, setColor] = useState('purple');
  const [icon, setIcon] = useState('🏷');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
  }, []);

  const loadAssigned = async () => {
    const { data } = await supabase
      .from('label_assignments')
      .select('id, user_id, label:labels(id, name, color, icon, owner_id)')
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    setAssigned(data || []);
  };

  const loadMyLabels = async () => {
    if (!me) return;
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('owner_id', me.id)
      .order('created_at', { ascending: false });
    setMyLabels(data || []);
  };

  useEffect(() => { loadAssigned(); }, [targetType, targetId]);
  useEffect(() => { if (me) loadMyLabels(); }, [me]);

  const attach = async (labelId: string) => {
    if (!me) return;
    await supabase.from('label_assignments').insert({
      label_id: labelId, user_id: me.id, target_type: targetType, target_id: targetId,
    });
    loadAssigned();
  };

  const detach = async (assignmentId: string) => {
    await supabase.from('label_assignments').delete().eq('id', assignmentId);
    loadAssigned();
  };

  const createLabel = async () => {
    if (!name.trim() || !me) return;
    await supabase.from('labels').insert({
      owner_id: me.id, name: name.trim(), color, icon, is_public: false,
    });
    setName(''); setShowCreate(false);
    loadMyLabels();
  };

  const myAssignments = assigned.filter((a: any) => a.user_id === me?.id);
  const otherAssignments = assigned.filter((a: any) => a.user_id !== me?.id);

  return (
    <div className="space-y-2">
      {/* Все метки */}
      {assigned.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {assigned.map((a: any) => a.label && (
            <LabelChip
              key={a.id}
              label={a.label}
              onRemove={a.user_id === me?.id ? () => detach(a.id) : undefined}
            />
          ))}
        </div>
      )}

      {me && (
        <button onClick={() => setOpen(true)}
          className={`flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 ${small ? '' : 'px-2 py-1 bg-purple-900/10 hover:bg-purple-900/20 rounded-lg'}`}>
          <Tag size={11} /> {assigned.length > 0 ? 'Метки' : 'Добавить метку'}
        </button>
      )}

      {/* Дропдаун выбора метки */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag size={16} className="text-purple-400" /> Управление метками
                </h3>
                <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-white"><X size={18} /></button>
              </div>

              {!showCreate ? (
                <>
                  <p className="text-xs text-text-secondary mb-2 font-semibold">Мои метки:</p>
                  {myLabels.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-3">У вас нет меток</p>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-y-auto mb-3">
                      {myLabels.map(l => {
                        const isAttached = myAssignments.some((a: any) => a.label?.id === l.id);
                        return (
                          <div key={l.id} className="flex items-center justify-between bg-bg-secondary p-2 rounded-lg">
                            <LabelChip label={l} />
                            {isAttached ? (
                              <button onClick={() => {
                                const ass = myAssignments.find((a: any) => a.label?.id === l.id);
                                if (ass) detach(ass.id);
                              }} className="text-xs text-red-400 hover:underline">Открепить</button>
                            ) : (
                              <button onClick={() => attach(l.id)} className="text-xs text-green-400 hover:underline">Прицепить</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => setShowCreate(true)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                    <Plus size={14} /> Создать новую метку
                  </button>
                </>
              ) : (
                <>
                  <label className="text-xs text-text-secondary mb-1 block">Название</label>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={20}
                    placeholder="Например: VIP" autoFocus
                    className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

                  <label className="text-xs text-text-secondary mb-1 block">Иконка</label>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {ICONS.map(i => (
                      <button key={i} onClick={() => setIcon(i)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${
                          icon === i ? 'bg-purple-600' : 'bg-bg-secondary border border-purple-900/30'
                        }`}>
                        {i}
                      </button>
                    ))}
                  </div>

                  <label className="text-xs text-text-secondary mb-1 block">Цвет</label>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {COLORS.map(col => (
                      <button key={col} onClick={() => setColor(col)}
                        className={`w-7 h-7 rounded-lg border-2 ${color === col ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: ({ red:'#ef4444', orange:'#f97316', yellow:'#eab308', green:'#22c55e', blue:'#3b82f6', cyan:'#06b6d4', purple:'#a855f7', pink:'#ec4899' } as any)[col] }} />
                    ))}
                  </div>

                  <div className="mb-3 p-3 bg-bg-secondary rounded-xl text-center">
                    <p className="text-xs text-text-secondary mb-2">Превью:</p>
                    <LabelChip label={{ name: name || 'Метка', color, icon }} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setShowCreate(false)}
                      className="flex-1 py-2 bg-purple-900/20 text-white rounded-xl text-sm">Назад</button>
                    <button onClick={createLabel} disabled={!name.trim()}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                      Создать
                    </button>
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

export default LabelManager;
