import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Send, X, Image, Paperclip,
  ChevronLeft, ChevronRight, FileText, ZoomIn
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Section = 'tickets' | 'users' | 'operations' | 'products' | 'stats';

interface Props {
  onNavigate?: (page: 'forum' | 'product' | 'profile' | 'topic', payload?: any) => void;
}

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1024 / 1024).toFixed(2)} МБ`;

const isImageName = (name: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\s|\(|$)/i.test(name);

const parseAttachedLines = (desc: string) => {
  const lines = desc.split('\n');
  const idx = lines.findIndex(l => l.startsWith('Прикреплённые файлы:'));
  if (idx === -1) return [];
  return lines.slice(idx + 1).filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
};

// ─── Image Viewer ──────────────────────────────────────────────────────────
const ImageViewer: React.FC<{
  images: string[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}
      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        src={images[idx]}
        onClick={e => e.stopPropagation()}
        className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((src, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-purple-500' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

// ─── Tickets Section ───────────────────────────────────────────────────────
const TicketsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [viewer, setViewer] = useState<{ urls: string[]; idx: number } | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    open:        { label: 'Открыт',   cls: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
    in_progress: { label: 'В работе', cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
    closed:      { label: 'Закрыт',   cls: 'bg-gray-900/40 text-gray-400 border border-gray-700/30' },
  };

  const load = async () => {
    setLoadingTickets(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoadingTickets(false);
  };

  useEffect(() => { load(); }, []);

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const openTicket = async (t: any) => {
    setActive(t);
    setReply('');
    setReplyFiles([]);
    await fetchMessages(t.id);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalReplySize = replyFiles.reduce((s, f) => s + f.size, 0);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let cur = totalReplySize;
    const valid: File[] = [];
    for (const f of files) {
      if (replyFiles.length + valid.length >= MAX_FILES) break;
      if (cur + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f);
      cur += f.size;
    }
    setReplyFiles(p => [...p, ...valid]);
    e.target.value = '';
  };

  const sendReply = async () => {
    if (!reply.trim() && replyFiles.length === 0) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();

    let filesInfo = '';
    if (replyFiles.length > 0) {
      filesInfo = '\n\n[Файлы]: ' + replyFiles.map(f => f.name).join(', ');
    }

    await supabase.from('ticket_messages').insert({
      ticket_id: active.id,
      sender_id: u.user?.id,
      message: reply + filesInfo,
    });

    setReply('');
    setReplyFiles([]);
    await fetchMessages(active.id);
    setSending(false);
  };

  // ── Ticket open view ──
  if (active) {
    const fileLines = parseAttachedLines(active.description || '');
    const descWithoutFiles = (active.description || '').replace(
      /\n\nПрикреплённые файлы:[\s\S]*$/, ''
    );
    const st = STATUS_MAP[active.status] || STATUS_MAP['open'];

    return (
      <>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-900/20 flex items-center gap-3 bg-[#171425] sticky top-0 z-10">
            <motion.button
              onClick={() => setActive(null)}
              whileHover={{ x: -2 }}
              className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                {active.subject || `Тикет #${active.id.slice(0, 8)}`}
              </h3>
              <p className="text-xs text-text-secondary">
                #{active.id.slice(0, 8)} · {new Date(active.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>
              {st.label}
            </span>
          </div>

          <div className="p-5 bg-[#120F1E] space-y-4">
            {/* Description */}
            <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
              <p className="text-xs text-text-secondary uppercase tracking-wider">Описание</p>
              <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                {descWithoutFiles}
              </p>

              {/* File badges */}
              {fileLines.length > 0 && (
                <div className="pt-2 border-t border-purple-900/20">
                  <p className="text-xs text-text-secondary mb-2">
                    📎 Прикреплённые файлы ({fileLines.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fileLines.map((line, i) => {
                      const isImg = isImageName(line);
                      return (
                        <div key={i}
                          className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2.5 py-1.5 text-xs text-purple-300"
                        >
                          {isImg ? <Image size={12} /> : <FileText size={12} />}
                          <span className="max-w-[160px] truncate">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5 scroll-smooth">
              {messages.length === 0 ? (
                <p className="text-center text-text-secondary text-sm py-8">Сообщений нет</p>
              ) : (
                <AnimatePresence>
                  {messages.map((m, i) => {
                    const isMod = m.sender_id !== active.reporter_id;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex ${isMod ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMod
                            ? 'bg-purple-700 text-white rounded-tr-sm'
                            : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                        }`}>
                          {!isMod && (
                            <p className="text-[10px] text-purple-300 mb-1">👤 Пользователь</p>
                          )}
                          {isMod && (
                            <p className="text-[10px] text-purple-200 mb-1">🛡 Модератор</p>
                          )}
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          <p className="text-[10px] mt-1.5 text-white/40">
                            {new Date(m.created_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply */}
            {active.status !== 'closed' && (
              <div className="space-y-3 pt-3 border-t border-purple-900/20">
                {/* Attached reply files */}
                {replyFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {replyFiles.map((f, i) => (
                        <motion.div
                          key={`${f.name}-${i}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-1 text-xs text-purple-300"
                        >
                          {f.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(f)} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <Paperclip size={11} />
                          )}
                          <span className="max-w-[100px] truncate">{f.name}</span>
                          <span className="text-text-secondary">({formatBytes(f.size)})</span>
                          <button
                            onClick={() => setReplyFiles(p => p.filter((_, j) => j !== i))}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div className="w-full">
                      <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-600 rounded-full"
                          animate={{ width: `${Math.round(totalReplySize / MAX_TOTAL_SIZE * 100)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5 text-right">
                        {formatBytes(totalReplySize)} / 25 МБ
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <label className="cursor-pointer flex-shrink-0">
                    <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                      <Image size={16} />
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleFileAdd} className="hidden" />
                  </label>
                  <label className="cursor-pointer flex-shrink-0">
                    <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                      <Paperclip size={16} />
                    </div>
                    <input type="file" multiple onChange={handleFileAdd} className="hidden" />
                  </label>

                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Ответ модератора..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all"
                  />
                  <motion.button
                    onClick={sendReply}
                    disabled={sending || (!reply.trim() && replyFiles.length === 0)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] flex-shrink-0"
                  >
                    {sending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <Send size={16} />
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {viewer && (
            <ImageViewer images={viewer.urls} startIndex={viewer.idx} onClose={() => setViewer(null)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── Ticket list ──
  return (
    <div className="space-y-3">
      {loadingTickets ? (
        <div className="flex justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-7 h-7 border-2 border-purple-700 border-t-purple-400 rounded-full"
          />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-12 text-center">
          <p className="text-text-secondary">Тикетов нет</p>
        </div>
      ) : (
        tickets.map((t, i) => {
          const st = { open: { label: 'Открыт', cls: 'bg-blue-900/30 text-blue-400' }, in_progress: { label: 'В работе', cls: 'bg-yellow-900/30 text-yellow-400' }, closed: { label: 'Закрыт', cls: 'bg-gray-900/40 text-gray-400' } }[t.status as string] || { label: t.status, cls: 'bg-purple-900/30 text-purple-300' };
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openTicket(t)}
              whileHover={{ scale: 1.005 }}
              className="bg-[#171425] border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-4 cursor-pointer transition-all hover:shadow-[0_0_16px_rgba(139,92,246,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {t.subject || 'Тикет'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${st.cls}`}>
                  {st.label}
                </span>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const ModerationPanel: React.FC<Props> = ({ onNavigate }) => {
  const [myRole, setMyRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: u } = await supabase
          .from('users').select('role').eq('id', data.user.id).maybeSingle();
        setMyRole(u?.role || 'user');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-purple-700 border-t-purple-400 rounded-full"
        />
      </div>
    );
  }

  if (!['moderator', 'admin', 'owner'].includes(myRole)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#171425] border border-red-800/40 rounded-2xl p-12 text-center"
      >
        <div className="w-14 h-14 rounded-xl bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Доступ запрещён</h3>
        <p className="text-sm text-text-secondary">Только для модераторов и администраторов</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center">
          <Shield size={18} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Панель модерации</h2>
      </div>

      <TicketsSection onNavigate={onNavigate} />
    </motion.div>
  );
};

export default ModerationPanel;