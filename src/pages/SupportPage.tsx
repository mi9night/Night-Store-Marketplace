// src/pages/SupportPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headset, Plus, Send
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

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    setMe(u.user);

    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('reporter_id', u.user.id)
      .order('created_at', { ascending: false });

    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (t: Ticket) => {
    if (activeId === t.id) {
      setActiveId(null);
      return;
    }

    setActiveId(t.id);

    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const send = async () => {
    if (!reply.trim() || !activeId) return;

    await supabase.from('ticket_messages').insert({
      ticket_id: activeId,
      sender_id: me.id,
      message: reply,
    });

    setReply('');

    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', activeId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Headset size={24} className="text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Поддержка</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
          {tickets.length}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center">
          <p className="text-text-secondary">Тикетов пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const isOpen = activeId === t.id;

            return (
              <div key={t.id} className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden">

                {/* Верх тикета */}
                <button
                  onClick={() => openTicket(t)}
                  className="w-full p-4 text-left hover:bg-purple-900/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xl">
                      {CATEGORIES.find(c => c.id === t.category)?.icon || '💭'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {t.subject || t.category}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>

                    <span className={`text-[10px] px-3 py-1 rounded-full font-semibold ${
                      t.status === 'closed'
                        ? 'bg-gray-900/40 text-gray-400'
                        : t.status === 'in_progress'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </button>

                {/* Раскрытие */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 space-y-4 bg-[#14121f]">

                        {/* Описание */}
                        <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
                          <p className="text-sm text-white whitespace-pre-wrap">
                            {t.description}
                          </p>
                        </div>

                        {/* Сообщения */}
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                          {messages.length === 0 ? (
                            <p className="text-center text-text-secondary text-sm py-6">
                              Ответов пока нет
                            </p>
                          ) : messages.map(m => {
                            const isMine = m.sender_id === me?.id;
                            return (
                              <div
                                key={m.id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                                    isMine
                                      ? 'bg-accent text-white rounded-tr-sm'
                                      : 'bg-purple-900/20 text-white rounded-tl-sm'
                                  }`}
                                >
                                  {!isMine && (
                                    <p className="text-[10px] text-purple-300 mb-0.5 font-bold">
                                      🛟 Поддержка
                                    </p>
                                  )}
                                  <p className="whitespace-pre-wrap">
                                    {m.message}
                                  </p>
                                  <p className="text-[10px] mt-1 text-text-secondary">
                                    {new Date(m.created_at).toLocaleString('ru-RU')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Ответ */}
                        {t.status !== 'closed' && (
                          <div className="flex gap-2">
                            <input
                              value={reply}
                              onChange={e => setReply(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && send()}
                              placeholder="Ответить..."
                              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm"
                            />
                            <button
                              onClick={send}
                              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportPage;