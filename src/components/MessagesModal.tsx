// src/components/MessagesModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string;
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

const MessagesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ============ Получить юзера ============ */
  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [isOpen]);

  /* ============ Загрузка списка диалогов ============ */
  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Берём ВСЕ сообщения где я отправитель или получатель
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!msgs) {
        setConversations([]);
        return;
      }

      // Группируем по собеседнику
      const map = new Map<string, Conversation>();
      for (const m of msgs) {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!map.has(partnerId)) {
          map.set(partnerId, {
            partner_id: partnerId,
            partner_name: '',
            partner_avatar: '',
            last_message: m.text,
            last_at: m.created_at,
            unread: 0,
          });
        }
        const conv = map.get(partnerId)!;
        if (m.receiver_id === user.id && !m.is_read) conv.unread += 1;
      }

      // Подтягиваем имена собеседников
      const partnerIds = Array.from(map.keys());
      if (partnerIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', partnerIds);
        users?.forEach(u => {
          const conv = map.get(u.id);
          if (conv) {
            const name = u.username || u.email?.split('@')[0] || 'User';
            conv.partner_name = name;
            conv.partner_avatar = name[0].toUpperCase();
          }
        });
      }

      setConversations(Array.from(map.values()));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) loadConversations();
  }, [isOpen, user]);

  /* ============ Загрузка сообщений конкретного диалога ============ */
  const loadMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages(data || []);

    // Пометить полученные как прочитанные
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  };

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.partner_id);
    }
  }, [activeChat]);

  /* ============ Realtime подписка ============ */
  useEffect(() => {
    if (!user || !isOpen) return;
    const channel = supabase
      .channel('messages_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadConversations();
          if (activeChat) loadMessages(activeChat.partner_id);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isOpen, activeChat?.partner_id]);

  /* ============ Автоскролл ============ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ============ Отправка ============ */
  const handleSend = async () => {
    if (!newMsg.trim() || !activeChat || !user || sending) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: activeChat.partner_id,
        text: newMsg.trim(),
        is_read: false,
      });
      setNewMsg('');
      loadMessages(activeChat.partner_id);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-bg-card border border-purple-900/30 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-900/20 flex items-center gap-3">
            {activeChat && (
              <button onClick={() => setActiveChat(null)} className="text-text-secondary hover:text-white lg:hidden">
                <ArrowLeft size={20} />
              </button>
            )}
            <MessageSquare size={20} className="text-accent" />
            <h2 className="text-lg font-bold text-white flex-1">
              {activeChat ? activeChat.partner_name : 'Сообщения'}
            </h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">

            {/* Список диалогов */}
            {(!activeChat || window.innerWidth >= 1024) && (
              <div className={`${activeChat ? 'hidden lg:block' : 'block'} w-full lg:w-72 border-r border-purple-900/20 overflow-y-auto`}>
                {loading ? (
                  <div className="p-6 text-center text-text-secondary text-sm">Загрузка...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-sm">
                    Сообщений пока нет
                  </div>
                ) : (
                  conversations.map(c => (
                    <button
                      key={c.partner_id}
                      onClick={() => setActiveChat(c)}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-purple-900/10 border-b border-purple-900/10 transition-colors ${
                        activeChat?.partner_id === c.partner_id ? 'bg-purple-900/20' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{c.partner_avatar || 'U'}</span>
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
            )}

            {/* Чат */}
            {activeChat && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-text-secondary text-sm py-8">
                      Начните разговор 👋
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-accent text-white rounded-tr-sm'
                              : 'bg-purple-900/20 text-white rounded-tl-sm'
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
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-purple-900/20 flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMsg.trim()}
                    className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Пустое состояние когда нет активного чата (desktop) */}
            {!activeChat && conversations.length > 0 && (
              <div className="hidden lg:flex flex-1 items-center justify-center text-text-secondary text-sm">
                Выберите диалог
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MessagesModal;
