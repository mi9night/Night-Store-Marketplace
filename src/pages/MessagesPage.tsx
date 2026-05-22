// src/pages/MessagesPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  partner_avatar_url?: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

const MessagesPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const { openUser } = useUserNav();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: msgs } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) { setConversations([]); return; }

      const map = new Map<string, Conversation>();
      for (const m of msgs) {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!map.has(partnerId)) {
          map.set(partnerId, {
            partner_id: partnerId,
            partner_name: '',
            last_message: (m.sender_id === user.id ? 'Вы: ' : '') + m.text,
            last_at: m.created_at,
            unread: 0,
          });
        }
        const conv = map.get(partnerId)!;
        if (m.receiver_id === user.id && !m.is_read) conv.unread += 1;
      }

      const partnerIds = Array.from(map.keys());
      if (partnerIds.length > 0) {
        const { data: users } = await supabase.from('users')
          .select('id, username, email, avatar_url').in('id', partnerIds);
        users?.forEach(u => {
          const conv = map.get(u.id);
          if (conv) {
            const name = u.username || u.email?.split('@')[0] || 'User';
            conv.partner_name = name;
            conv.partner_avatar = name[0].toUpperCase();
            conv.partner_avatar_url = u.avatar_url;
          }
        });
      }
      setConversations(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadConversations(); }, [user]);

  const loadMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase.from('messages').update({ is_read: true })
      .eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false);
  };

  useEffect(() => { if (active) loadMessages(active.partner_id); }, [active]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('msg_page_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
        () => { loadConversations(); if (active) loadMessages(active.partner_id); }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, active?.partner_id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !active || !user || sending) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        sender_id: user.id, receiver_id: active.partner_id, text: newMsg.trim(), is_read: false,
      });
      setNewMsg('');
      loadMessages(active.partner_id);
    } finally { setSending(false); }
  };

  const filtered = search.trim()
    ? conversations.filter(c => c.partner_name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <MessageSquare size={24} className="text-purple-400" />
        <h1 className="text-2xl font-bold text-white">Сообщения</h1>
        {conversations.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">{conversations.length} диалогов</span>
        )}
      </motion.div>

      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden h-[70vh] flex">
        {/* Список диалогов */}
        <div className={`${active ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-purple-900/20 flex-col`}>
          <div className="p-3 border-b border-purple-900/20">
            <div className="relative">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск диалогов..."
                className="w-full pl-9 pr-3 py-2 bg-[#0B0A12] border border-purple-900/30 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-text-secondary text-sm">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-sm">
                {search ? 'Ничего не найдено' : 'Сообщений пока нет'}
              </div>
            ) : (
              filtered.map(c => (
                <button key={c.partner_id} onClick={() => setActive(c)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-purple-900/10 border-b border-purple-900/10 transition-colors ${
                    active?.partner_id === c.partner_id ? 'bg-purple-900/20' : ''
                  }`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.partner_avatar_url
                      ? <img src={c.partner_avatar_url} className="w-full h-full object-cover" alt="" />
                      : <span className="text-sm font-bold text-white">{c.partner_avatar || 'U'}</span>}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-white truncate">{c.partner_name || 'User'}</p>
                    <p className="text-xs text-text-secondary truncate">{c.last_message}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Чат */}
        {active ? (
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-purple-900/20 flex items-center gap-3">
              <button onClick={() => setActive(null)} className="md:hidden text-text-secondary hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <button onClick={() => openUser(active.partner_id)}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden hover:scale-105">
                {active.partner_avatar_url
                  ? <img src={active.partner_avatar_url} className="w-full h-full object-cover" alt="" />
                  : <span className="text-xs font-bold text-white">{active.partner_avatar}</span>}
              </button>
              <button onClick={() => openUser(active.partner_id)} className="flex-1 text-left hover:text-purple-300">
                <p className="text-sm font-semibold text-white">{active.partner_name}</p>
                <p className="text-[10px] text-text-secondary">Открыть профиль →</p>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-8">Начните разговор 👋</div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        isMine ? 'bg-accent text-white rounded-tr-sm' : 'bg-purple-900/20 text-white rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-purple-200' : 'text-text-secondary'}`}>
                          {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-purple-900/20 flex gap-2">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Сообщение..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white" />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center text-text-secondary">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p>Выберите диалог</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
