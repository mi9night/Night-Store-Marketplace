import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headset, Send, ChevronDown, Paperclip, Image, X,
  ChevronLeft, ChevronRight, ZoomIn, FileText
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
  attachments?: string;
}

const CATEGORIES = [
  { id: 'support', label: 'Техническая поддержка', icon: '🛠' },
  { id: 'payment', label: 'Вопросы по оплате',     icon: '💳' },
  { id: 'account', label: 'Проблемы с аккаунтом',  icon: '👤' },
  { id: 'dispute', label: 'Спор по сделке',        icon: '⚖️' },
  { id: 'other',   label: 'Другое',                icon: '💭' },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Открыт',      cls: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
  in_progress: { label: 'В работе',    cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30' },
  closed:      { label: 'Закрыт',      cls: 'bg-gray-900/40 text-gray-400 border border-gray-700/30' },
};

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} КБ` : `${(bytes / 1024 / 1024).toFixed(2)} МБ`;

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
        initial={{ opacity: 0, scale: 0.92 }}
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
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-purple-500' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

// ─── Parse files from description ─────────────────────────────────────────
const parseAttachedFiles = (desc: string) => {
  const lines = desc.split('\n');
  const startIdx = lines.findIndex(l => l.startsWith('Прикреплённые файлы:'));
  if (startIdx === -1) return [];
  return lines.slice(startIdx + 1)
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim());
};

const isImageName = (name: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\s|\(|$)/i.test(name);

// ─── Ticket Accordion Item ─────────────────────────────────────────────────
const TicketItem: React.FC<{
  ticket: Ticket;
  me: any;
}> = ({ ticket, me }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [viewer, setViewer] = useState<{ urls: string[]; idx: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoadingMsgs(true);
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMsgs(false);
  };

  const toggle = async () => {
    if (!open && messages.length === 0) await fetchMessages();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const totalReplySize = replyFiles.reduce((s, f) => s + f.size, 0);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let currentTotal = totalReplySize;
    const valid: File[] = [];
    for (const f of files) {
      if (replyFiles.length + valid.length >= MAX_FILES) break;
      if (currentTotal + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f);
      currentTotal += f.size;
    }
    setReplyFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const send = async () => {
    if (!reply.trim() && replyFiles.length === 0) return;
    setSending(true);

    let filesInfo = '';
    if (replyFiles.length > 0) {
      filesInfo = '\n\n[Файлы]: ' + replyFiles.map(f => f.name).join(', ');
    }

    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: me.id,
      message: reply + filesInfo,
    });

    setReply('');
    setReplyFiles([]);
    await fetchMessages();
    setSending(false);
  };

  const st = STATUS_LABELS[ticket.status] || STATUS_LABELS['open'];
  const catIcon = CATEGORIES.find(c => c.id === ticket.category)?.icon || '💭';

  // Parse images from description
  const descLines = ticket.description?.split('\n') || [];
  const fileLines = parseAttachedFiles(ticket.description || '');
  const descWithoutFiles = ticket.description
    ? ticket.description.replace(/\n\nПрикреплённые файлы:[\s\S]*$/, '')
    : '';

  // Image urls from file list (text-based, not real URLs — show as filename badges)
  const hasFiles = fileLines.length > 0;

  return (
    <>
      <motion.div
        layout
        className={`bg-[#171425] border rounded-2xl overflow-hidden transition-all duration-200 ${
          open ? 'border-purple-700/50 shadow-[0_0_24px_rgba(139,92,246,0.1)]' : 'border-purple-900/20 hover:border-purple-700/30'
        }`}
      >
        {/* ── Header ── */}
        <button
          onClick={toggle}
          className="w-full p-4 text-left hover:bg-purple-900/5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all ${
              open ? 'bg-purple-700/30' : 'bg-purple-900/20'
            }`}>
              {catIcon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {ticket.subject || ticket.category}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                #{ticket.id.slice(0, 8)} · {new Date(ticket.created_at).toLocaleString('ru-RU')}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>
                {st.label}
              </span>
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-text-secondary"
              >
                <ChevronDown size={16} />
              </motion.div>
            </div>
          </div>
        </button>

        {/* ── Body ── */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 bg-[#120F1E] space-y-4 border-t border-purple-900/20">

                {/* Description block */}
                <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Описание</p>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
                    {descWithoutFiles}
                  </p>

                  {/* Attached file badges */}
                  {hasFiles && (
                    <div className="pt-2 border-t border-purple-900/20">
                      <p className="text-xs text-text-secondary mb-2">
                        📎 Прикреплённые файлы ({fileLines.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fileLines.map((line, i) => {
                          const isImg = isImageName(line);
                          return (
                            <div
                              key={i}
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
                <div className="space-y-3">
                  {loadingMsgs ? (
                    <div className="text-center py-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-purple-700 border-t-purple-400 rounded-full mx-auto"
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-text-secondary text-sm py-8"
                    >
                      Ответов пока нет
                    </motion.p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5 scroll-smooth">
                      <AnimatePresence>
                        {messages.map((m, i) => {
                          const isMine = m.sender_id === me?.id;
                          return (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                isMine
                                  ? 'bg-purple-700 text-white rounded-tr-sm'
                                  : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                              }`}>
                                {!isMine && (
                                  <p className="text-[10px] text-purple-300 mb-1 font-bold">🛟 Поддержка</p>
                                )}
                                <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                                <p className="text-[10px] mt-1.5 text-white/40">
                                  {new Date(m.created_at).toLocaleString('ru-RU')}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Reply box */}
                {ticket.status !== 'closed' && (
                  <div className="space-y-3 pt-2 border-t border-purple-900/20">
                    {/* File attachments for reply */}
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
                              <button onClick={() => setReplyFiles(p => p.filter((_, j) => j !== i))}
                                className="hover:text-red-400 transition-colors ml-0.5">
                                <X size={11} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {/* Size bar */}
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
                      {/* Attach buttons */}
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
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                        placeholder="Ответить..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all"
                      />
                      <motion.button
                        onClick={send}
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
          )}
        </AnimatePresence>
      </motion.div>

      {/* Image viewer */}
      <AnimatePresence>
        {viewer && (
          <ImageViewer
            images={viewer.urls}
            startIndex={viewer.idx}
            onClose={() => setViewer(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const SupportPage: React.FC = () => {
  const [me, setMe] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const openCount = tickets.filter(t => t.status !== 'closed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center">
          <Headset size={18} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Поддержка</h1>
        {openCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs px-2.5 py-1 rounded-full bg-purple-700/30 border border-purple-600/30 text-purple-300 font-semibold"
          >
            {openCount}
          </motion.span>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-purple-700 border-t-purple-400 rounded-full"
          />
        </div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#171425] border border-purple-900/20 rounded-2xl p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
            <Headset size={28} className="text-purple-600" />
          </div>
          <p className="text-white font-semibold mb-1">Тикетов пока нет</p>
          <p className="text-text-secondary text-sm">Здесь появятся ваши обращения в поддержку</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {tickets.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TicketItem ticket={t} me={me} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default SupportPage;