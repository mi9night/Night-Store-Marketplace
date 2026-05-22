// src/pages/SupportPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy, Plus, X, Send, Clock, CheckCircle2, AlertCircle, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Ticket {
  id: string;
  category: string;
  subject?: string;
  description?: string;
  status: string;
  resolution?: string;
  created_at: string;
}

interface TMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'support',  label: 'Техническая поддержка', icon: '🛠' },
  { id: 'payment',  label: 'Вопросы по оплате',     icon: '💳' },
  { id: 'account',  label: 'Проблемы с аккаунтом',  icon: '👤' },
  { id: 'dispute',  label: 'Спор по сделке',        icon: '⚖️' },
  { id: 'other',    label: 'Другое',                icon: '💭' },
];

const SupportPage: React.FC = () => {
  const [me, setMe] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('support');
  const [creating, setCreating] = useState(false);

  const [active, setActive] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    setMe(u.user);

    const { data } = await supabase.from('tickets').select('*')
      .eq('reporter_id', u.user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime
  useEffect(() => {
    if (!me?.id) return;
    const ch = supabase.channel('support_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `reporter_id=eq.${me.id}` },
        () => load()
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me?.id]);

  const openTicket = async (t: Ticket) => {
    setActive(t);
    const { data } = await supabase.from('ticket_messages')
      .select('*').eq('ticket_id', t.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const create = async () => {
    if (!subject.trim()) { alert('Введите тему'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_support_ticket', {
        p_subject: subject, p_description: description, p_category: category,
      });
      if (error) throw error;
      if (data?.ok) {
        setShowCreate(false);
        setSubject(''); setDescription('');
        load();
      }
    } catch (e: any) {
      alert(e.message);
    } finally { setCreating(false); }
  };

  const send = async () => {
    if (!reply.trim() || !active) return;
    await supabase.from('ticket_messages').insert({
      ticket_id: active.id, sender_id: me.id, message: reply,
    });
    setReply('');
    openTicket(active);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy size={24} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Поддержка</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">{tickets.length}</span>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
          <Plus size={14} /> Создать тикет
        </button>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <LifeBuoy size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Тикетов нет</h3>
          <p className="text-sm text-text-secondary">Есть вопрос? Создай тикет — модераторы ответят</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => openTicket(t)}
              className="bg-[#171425] border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="text-xl">{CATEGORIES.find(c => c.id === t.category)?.icon || '💭'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.subject || t.category}</p>
                  <p className="text-xs text-text-secondary truncate">{t.description || 'Без описания'}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    t.status === 'closed' ? 'bg-gray-900/40 text-gray-400' :
                    t.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-blue-900/30 text-blue-400'
                  }`}>{t.status}</span>
                  {t.resolution && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      t.resolution === 'resolved' ? 'bg-green-900/30 text-green-400' :
                      t.resolution === 'not_resolved' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>{t.resolution}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модалка создания */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-5 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Новый тикет</h3>
                <button onClick={() => setShowCreate(false)} className="text-text-secondary hover:text-white"><X size={20} /></button>
              </div>

              <label className="text-xs text-text-secondary mb-1 block">Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 mb-3 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>

              <label className="text-xs text-text-secondary mb-1 block">Тема</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Кратко опишите проблему"
                className="w-full px-3 py-2.5 mb-3 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm" />

              <label className="text-xs text-text-secondary mb-1 block">Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Подробности..." rows={4}
                className="w-full px-3 py-2.5 mb-3 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none" />

              <button onClick={create} disabled={creating}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {creating ? 'Создание...' : 'Создать тикет'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Просмотр тикета */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={() => setActive(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="p-4 border-b border-purple-900/20 flex items-center gap-2">
                <LifeBuoy size={18} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white flex-1">{active.subject || 'Тикет'}</h3>
                <button onClick={() => setActive(null)} className="text-text-secondary hover:text-white"><X size={18} /></button>
              </div>
              <div className="p-4 border-b border-purple-900/20">
                <p className="text-sm text-white mb-2">{active.description}</p>
                <p className="text-xs text-text-secondary">#{active.id.slice(0, 8)} · статус: {active.status}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-text-secondary text-sm py-4">Ответов пока нет</p>
                ) : messages.map(m => {
                  const isMine = m.sender_id === me?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        isMine ? 'bg-accent text-white' : 'bg-purple-900/20 text-white'
                      }`}>
                        {!isMine && <p className="text-[10px] text-purple-300 mb-0.5 font-bold">🛟 Поддержка</p>}
                        <p className="whitespace-pre-wrap">{m.message}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-purple-200' : 'text-text-secondary'}`}>
                          {new Date(m.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {active.status !== 'closed' && (
                <div className="p-3 border-t border-purple-900/20 flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Ответить..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0B0A12] border border-purple-900/30 text-white text-sm" />
                  <button onClick={send} className="px-3 py-2 bg-purple-600 text-white rounded-lg">
                    <Send size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportPage;
