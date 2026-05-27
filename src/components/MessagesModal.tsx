import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, MessageSquare, ArrowLeft,
  Image, Paperclip, ChevronLeft, ChevronRight, ZoomIn, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;
const BUCKET = 'chat-attachments';

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1024 / 1024).toFixed(2)} МБ`;

const isImageUrl = (url: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(url);

interface Props { isOpen: boolean; onClose: () => void; }

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
  attachments?: string;
  is_read: boolean;
  created_at: string;
}

/* ─── Image Viewer ─────────────────────────────────────────────────────── */
const ImageViewer: React.FC<{
  images: string[];
  startIndex: number;
  onClose: () => void;
}> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[400] flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10" onClick={onClose}>
        <X size={20} />
      </button>
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full">
          {idx + 1} / {images.length}
        </div>
      )}
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="relative"
      >
        {!loaded && (
          <div className="w-48 h-36 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-7 h-7 border-2 border-purple-500 border-t-white rounded-full" />
          </div>
        )}
        <img src={images[idx]} onLoad={() => setLoaded(true)}
          className={`max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
      </motion.div>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronLeft size={22} />
          </button>
          <button onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-4 flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((src, i) => (
              <button key={i} onClick={() => { setLoaded(false); setIdx(i); }}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-purple-500 scale-110' : 'border-white/20 opacity-50'}`}>
                <img src={src} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

/* ─── Attachments renderer ─────────────────────────────────────────────── */
const MessageAttachments: React.FC<{
  urls: string[];
  onOpen: (urls: string[], idx: number) => void;
}> = ({ urls, onOpen }) => {
  const images = urls.filter(isImageUrl);
  const files  = urls.filter(u => !isImageUrl(u));

  return (
    <div className="space-y-1.5 mt-1">
      {images.length > 0 && (
        <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((url, i) => (
            <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(images, i)}
              className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/60 transition-all"
              style={{ aspectRatio: images.length === 1 ? '16/9' : '1/1' }}
            >
              <img src={url} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
      {files.map((url, i) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Файл');
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5 text-xs text-white/80 transition-all">
            <FileText size={12} className="text-purple-300 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      })}
    </div>
  );
};

/* ─── Main Modal ───────────────────────────────────────────────────────── */
const MessagesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [user, setUser]                   = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat]       = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [newMsg, setNewMsg]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [sending, setSending]             = useState(false);
  const [attachFiles, setAttachFiles]     = useState<File[]>([]);
  const [previews, setPreviews]           = useState<Map<string, string>>(new Map());
  const [viewer, setViewer]               = useState<{ urls: string[]; idx: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalSize = attachFiles.reduce((s, f) => s + f.size, 0);

  useEffect(() => {
    if (!isOpen) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [isOpen]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: msgs } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (!msgs) { setConversations([]); return; }

      const map = new Map<string, Conversation>();
      for (const m of msgs) {
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!map.has(partnerId)) {
          const lastText = m.attachments ? (m.text || '📎 Вложение') : m.text;
          map.set(partnerId, {
            partner_id: partnerId, partner_name: '', partner_avatar: '',
            last_message: lastText, last_at: m.created_at, unread: 0,
          });
        }
        const conv = map.get(partnerId)!;
        if (m.receiver_id === user.id && !m.is_read) conv.unread += 1;
      }

      const partnerIds = Array.from(map.keys());
      if (partnerIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, username, email').in('id', partnerIds);
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
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen && user) loadConversations(); }, [isOpen, user]);

  const loadMessages = async (partnerId: string) => {
    if (!user) return;
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase.from('messages').update({ is_read: true })
      .eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false);
  };

  useEffect(() => { if (activeChat) loadMessages(activeChat.partner_id); }, [activeChat]);

  useEffect(() => {
    if (!user || !isOpen) return;
    const ch = supabase.channel('messages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadConversations();
        if (activeChat) loadMessages(activeChat.partner_id);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, isOpen, activeChat?.partner_id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let cur = totalSize;
    const valid: File[] = [];
    for (const f of files) {
      if (attachFiles.length + valid.length >= MAX_FILES) break;
      if (cur + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f);
      cur += f.size;
    }
    const newMap = new Map(previews);
    valid.forEach(f => {
      if (f.type.startsWith('image/')) newMap.set(f.name + f.size, URL.createObjectURL(f));
    });
    setPreviews(newMap);
    setAttachFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeFile = (i: number) => setAttachFiles(prev => prev.filter((_, j) => j !== i));

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    const ext  = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleSend = async () => {
    if (!newMsg.trim() && attachFiles.length === 0) return;
    if (!activeChat || !user || sending) return;
    setSending(true);
    setUploadProgress(0);
    try {
      let urls: string[] = [];
      for (let i = 0; i < attachFiles.length; i++) {
        const url = await uploadFile(attachFiles[i], user.id);
        if (url) urls.push(url);
        setUploadProgress(Math.round(((i + 1) / attachFiles.length) * 100));
      }
      await supabase.from('messages').insert({
        sender_id: user.id, receiver_id: activeChat.partner_id,
        text: newMsg.trim(),
        attachments: urls.length > 0 ? JSON.stringify(urls) : null,
        is_read: false,
      });
      setNewMsg(''); setAttachFiles([]); setPreviews(new Map()); setUploadProgress(0);
      loadMessages(activeChat.partner_id);
    } finally { setSending(false); }
  };

  const getAtts = (m: Message): string[] => {
    if (!m.attachments) return [];
    try { return JSON.parse(m.attachments); } catch { return []; }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-purple-900/20 flex items-center gap-3">
              {activeChat && (
                <button onClick={() => setActiveChat(null)} className="text-text-secondary hover:text-white lg:hidden">
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                <MessageSquare size={16} className="text-purple-400" />
              </div>
              <h2 className="text-base font-bold text-white flex-1">
                {activeChat ? activeChat.partner_name : 'Сообщения'}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Conversations */}
              {(!activeChat || window.innerWidth >= 1024) && (
                <div className={`${activeChat ? 'hidden lg:block' : 'block'} w-full lg:w-64 border-r border-purple-900/20 overflow-y-auto flex-shrink-0`}>
                  {loading ? (
                    <div className="flex justify-center p-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-purple-700 border-t-purple-400 rounded-full" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">Сообщений пока нет</div>
                  ) : conversations.map(c => (
                    <button key={c.partner_id} onClick={() => setActiveChat(c)}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-purple-900/10 border-b border-purple-900/10 transition-colors ${
                        activeChat?.partner_id === c.partner_id ? 'bg-purple-900/20' : ''
                      }`}>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{c.partner_avatar || 'U'}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-white truncate">{c.partner_name || 'User'}</p>
                        <p className="text-xs text-text-secondary truncate">{c.last_message}</p>
                      </div>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat */}
              {activeChat && (
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {messages.length === 0 ? (
                      <div className="text-center text-text-secondary text-sm py-8">Начните разговор 👋</div>
                    ) : messages.map((m, mi) => {
                      const isMine  = m.sender_id === user?.id;
                      const atts    = getAtts(m);
                      const hasText = m.text.trim().length > 0;

                      return (
                        <motion.div key={m.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(mi * 0.02, 0.2) }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[78%] rounded-2xl text-sm overflow-hidden ${
                            isMine
                              ? 'bg-purple-700 text-white rounded-tr-sm'
                              : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                          }`}>
                            {hasText && (
                              <p className="px-3 pt-2.5 pb-1 whitespace-pre-wrap break-words">{m.text}</p>
                            )}
                            {atts.length > 0 && (
                              <div className={`${hasText ? 'px-2 pb-2' : 'p-2'}`}>
                                <MessageAttachments urls={atts} onOpen={(urls, idx) => setViewer({ urls, idx })} />
                              </div>
                            )}
                            <p className={`px-3 pb-2 text-[10px] ${isMine ? 'text-purple-200/70' : 'text-text-secondary'}`}>
                              {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Attach preview */}
                  <AnimatePresence>
                    {attachFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-purple-900/20 pt-2 pb-1 px-2 bg-[#120F1E] space-y-1.5"
                      >
                        {/* Image previews */}
                        {attachFiles.filter(f => f.type.startsWith('image/')).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            <AnimatePresence>
                              {attachFiles.filter(f => f.type.startsWith('image/')).map((f, i) => {
                                const url = previews.get(f.name + f.size) || '';
                                return (
                                  <motion.div key={`${f.name}-${i}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative group"
                                  >
                                    <img src={url} className="w-14 h-14 object-cover rounded-lg border border-purple-700/30 cursor-pointer hover:border-purple-500 transition-all"
                                      onClick={() => {
                                        const allUrls = attachFiles.filter(rf => rf.type.startsWith('image/')).map(rf => previews.get(rf.name + rf.size) || '');
                                        setViewer({ urls: allUrls, idx: i });
                                      }} />
                                    <button onClick={() => removeFile(attachFiles.indexOf(f))}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                                      <X size={9} />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Other files */}
                        {attachFiles.filter(f => !f.type.startsWith('image/')).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {attachFiles.filter(f => !f.type.startsWith('image/')).map((f, i) => (
                              <div key={`${f.name}-${i}`}
                                className="flex items-center gap-1 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-0.5 text-[11px] text-purple-300">
                                <Paperclip size={10} />
                                <span className="max-w-[80px] truncate">{f.name}</span>
                                <button onClick={() => removeFile(attachFiles.indexOf(f))} className="hover:text-red-400">
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Size bar */}
                        <div>
                          <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${totalSize / MAX_TOTAL_SIZE > 0.9 ? 'bg-red-500' : 'bg-purple-600'}`}
                              animate={{ width: `${Math.round(totalSize / MAX_TOTAL_SIZE * 100)}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-[10px] text-text-secondary mt-0.5 text-right">
                            {formatBytes(totalSize)} / 25 МБ
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upload progress */}
                  <AnimatePresence>
                    {sending && uploadProgress > 0 && uploadProgress < 100 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3">
                        <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-purple-500 rounded-full"
                            animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <div className="p-3 border-t border-purple-900/20 flex gap-2 items-center">
                    <label className="cursor-pointer flex-shrink-0">
                      <div className="p-2 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                        <Image size={15} />
                      </div>
                      <input type="file" multiple accept="image/*" onChange={handleFileAdd} className="hidden" />
                    </label>
                    <label className="cursor-pointer flex-shrink-0">
                      <div className="p-2 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                        <Paperclip size={15} />
                      </div>
                      <input type="file" multiple onChange={handleFileAdd} className="hidden" />
                    </label>
                    <input
                      value={newMsg} onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Напишите сообщение..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white focus:border-purple-500/60 focus:outline-none transition-all"
                    />
                    <motion.button onClick={handleSend}
                      disabled={sending || (!newMsg.trim() && attachFiles.length === 0)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)] flex-shrink-0"
                    >
                      {sending ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : <Send size={15} />}
                    </motion.button>
                  </div>
                </div>
              )}

              {!activeChat && conversations.length > 0 && (
                <div className="hidden lg:flex flex-1 items-center justify-center text-text-secondary text-sm">
                  Выберите диалог
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Image Viewer — поверх модалки */}
      <AnimatePresence>
        {viewer && (
          <ImageViewer images={viewer.urls} startIndex={viewer.idx} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MessagesModal;