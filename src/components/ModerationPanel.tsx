// src/components/ModerationPanel.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Package, Receipt, Ticket, BarChart3,
  Search, ArrowRight, X, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Section = 'tickets' | 'users' | 'operations' | 'products' | 'stats';

interface Props {
  onNavigate?: (page: 'forum' | 'product' | 'profile' | 'topic', payload?: any) => void;
}

const ModerationPanel: React.FC<Props> = ({ onNavigate }) => {
  const [section, setSection] = useState<Section>('tickets');
  const [myRole, setMyRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: u } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        setMyRole(u?.role || 'user');
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Загрузка...</div>;
  }

  if (!['moderator', 'admin', 'owner'].includes(myRole)) {
    return (
      <div className="bg-bg-card border border-red-800/40 rounded-2xl p-8 text-center">
        <Shield size={40} className="mx-auto text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Доступ запрещён</h3>
        <p className="text-sm text-text-secondary">Только для модераторов</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">Панель модерации</h2>
      </div>

      {section === 'tickets' && <TicketsSection onNavigate={onNavigate} />}
    </div>
  );
};
const TicketsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (t: any) => {
    setActive(t);
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;

    const { data: u } = await supabase.auth.getUser();

    await supabase.from('ticket_messages').insert({
      ticket_id: active.id,
      sender_id: u.user?.id,
      message: reply,
    });

    setReply('');
    openTicket(active);
  };

  const extractImages = (text?: string): string[] => {
    if (!text) return [];
    const urls = text.match(/https?:\/\/[^\s]+/g);
    return urls || [];
  };
    if (active) {
    const images = extractImages(active.description);

    return (
      <div className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-purple-900/20 flex items-center gap-3 sticky top-0 bg-bg-card z-10">
          <button
            onClick={() => setActive(null)}
            className="text-text-secondary hover:text-white"
          >
            ←
          </button>
          <h3 className="text-base font-semibold text-white flex-1">
            Тикет #{active.id.slice(0, 8)}
          </h3>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-300">
            {active.status}
          </span>
        </div>

        {/* Description */}
        <div className="p-6 space-y-4 bg-[#14121f]">

          <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
            <p className="text-xs text-text-secondary mb-1">Описание</p>
            <p className="text-sm text-white whitespace-pre-wrap">
              {active.description}
            </p>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Прикреплённые изображения ({images.length})
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <motion.img
                    key={i}
                    src={url}
                    onClick={() => setPreviewImages(images)}
                    whileHover={{ scale: 1.04 }}
                    className="cursor-pointer rounded-xl border border-purple-900/30 object-cover h-32 w-full hover:border-purple-500/50 transition-all"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-6">
                Сообщений нет
              </p>
            ) : (
              messages.map(m => {
                const isMine = m.sender_id === active?.reporter_id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-purple-900/20 text-white rounded-tl-sm'
                          : 'bg-accent text-white rounded-tr-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p className="text-[10px] mt-1 text-text-secondary">
                        {new Date(m.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reply */}
          {active.status !== 'closed' && (
            <div className="flex gap-2 pt-3 border-t border-purple-900/20">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReply()}
                placeholder="Ответ модератора..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm"
              />
              <button
                onClick={sendReply}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {previewImages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center"
              onClick={() => setPreviewImages(null)}
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={previewImages[0]}
                className="max-h-[90vh] max-w-[90vw] rounded-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map(t => (
        <div
          key={t.id}
          onClick={() => openTicket(t)}
          className="bg-bg-card border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                {t.subject || 'Тикет'}
              </p>
              <p className="text-xs text-text-secondary">
                #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-300">
              {t.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModerationPanel;