import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Search as SearchIcon, ArrowLeft,
  Image, Paperclip, X, ChevronLeft, ChevronRight, ZoomIn, FileText, Edit3, Trash2, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;
const BUCKET = 'chat-attachments';

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1024 / 1024).toFixed(2)} МБ`;

const isImageUrl = (url: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(url);

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
  attachments?: string; // JSON: string[]
  is_read: boolean;
  created_at: string;
  edited_at?: string | null;
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
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[300] flex flex-col items-center justify-center"
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

      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="relative"
      >
        {!loaded && (
          <div className="w-64 h-48 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-purple-500 border-t-white rounded-full"
            />
          </div>
        )}
        <img
          src={images[idx]}
          onLoad={() => setLoaded(true)}
          className={`max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </motion.div>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((src, i) => (
              <button key={i} onClick={() => { setLoaded(false); setIdx(i); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx ? 'border-purple-500 scale-110' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}>
                <img src={src} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

/* ─── Message Attachments ──────────────────────────────────────────────── */
const MessageAttachments: React.FC<{
  urls: string[];
  onOpenViewer: (urls: string[], idx: number) => void;
}> = ({ urls, onOpenViewer }) => {
  const images = urls.filter(isImageUrl);
  const files  = urls.filter(u => !isImageUrl(u));

  return (
    <div className="space-y-1.5 mt-1">
      {/* Image grid */}
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((url, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenViewer(images, i)}
              className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/60 transition-all"
              style={{ aspectRatio: images.length === 1 ? '16/10' : '1/1' }}
            >
              <img
                src={url}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* File links */}
      {files.map((url, i) => {
        const name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Файл');
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs text-white/80 transition-all">
            <FileText size={13} className="text-purple-300 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      })}
    </div>
  );
};

/* ─── File Attach Preview ──────────────────────────────────────────────── */
const AttachPreview: React.FC<{
  files: File[];
  previews: Map<string, string>;
  onRemove: (i: number) => void;
  onOpenViewer: (urls: string[], idx: number) => void;
}> = ({ files, previews, onRemove, onOpenViewer }) => {
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const pct = Math.round((totalSize / MAX_TOTAL_SIZE) * 100);
  const imgFiles  = files.filter(f => f.type.startsWith('image/'));
  const otherFiles = files.filter(f => !f.type.startsWith('image/'));

  return (
    <div className="px-3 pb-2 space-y-2">
      {/* Image previews */}
      {imgFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {imgFiles.map((f, i) => {
              const url = previews.get(f.name + f.size) || '';
              const allUrls = imgFiles.map(rf => previews.get(rf.name + rf.size) || '');
              return (
                <motion.div key={`${f.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <motion.img
                    src={url}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onOpenViewer(allUrls, i)}
                    className="w-16 h-16 object-cover rounded-xl border border-purple-700/30 cursor-pointer hover:border-purple-500 transition-all"
                  />
                  <button
                    onClick={() => onRemove(files.indexOf(f))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <X size={10} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-xl text-[9px] text-white/70 px-1 py-0.5 text-center truncate">
                    {formatBytes(f.size)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Other files */}
      {otherFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {otherFiles.map((f, i) => (
              <motion.div key={`${f.name}-${i}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-1 text-xs text-purple-300"
              >
                <Paperclip size={11} />
                <span className="max-w-[100px] truncate">{f.name}</span>
                <span className="text-text-secondary">({formatBytes(f.size)})</span>
                <button onClick={() => onRemove(files.indexOf(f))} className="hover:text-red-400 transition-colors">
                  <X size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Size bar */}
      <div>
        <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-purple-600'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-[10px] text-text-secondary mt-0.5 text-right">
          {formatBytes(totalSize)} / 25 МБ · {files.length}/{MAX_FILES}
        </p>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────────────────── */
const MessagesPage: React.FC = () => {
  const [user, setUser]                   = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive]               = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [newMsg, setNewMsg]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState('');
  const [attachFiles, setAttachFiles]     = useState<File[]>([]);
  const [previews, setPreviews]           = useState<Map<string, string>>(new Map());
  const [viewer, setViewer]               = useState<{ urls: string[]; idx: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const { openUser } = useUserNav();

  const totalSize = attachFiles.reduce((s, f) => s + f.size, 0);

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
          const lastText = m.attachments
            ? (m.text ? m.text : '📎 Вложение')
            : m.text;
          map.set(partnerId, {
            partner_id: partnerId,
            partner_name: '',
            last_message: (m.sender_id === user.id ? 'Вы: ' : '') + lastText,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadConversations();
        if (active) loadMessages(active.partner_id);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, active?.partner_id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* File handling */
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
      if (f.type.startsWith('image/')) {
        newMap.set(f.name + f.size, URL.createObjectURL(f));
      }
    });
    setPreviews(newMap);
    setAttachFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeFile = (i: number) => setAttachFiles(prev => prev.filter((_, j) => j !== i));

  /* Upload file to Supabase Storage */
  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    const ext  = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) { console.error('Upload error:', error); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  /* Send */
  const handleSend = async () => {
    if (!newMsg.trim() && attachFiles.length === 0) return;
    if (!active || !user || sending) return;
    setSending(true);
    setUploadProgress(0);

    try {
      let attachmentUrls: string[] = [];

      if (attachFiles.length > 0) {
        const total = attachFiles.length;
        for (let i = 0; i < attachFiles.length; i++) {
          const url = await uploadFile(attachFiles[i], user.id);
          if (url) attachmentUrls.push(url);
          setUploadProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      await supabase.from('messages').insert({
        sender_id:   user.id,
        receiver_id: active.partner_id,
        text:        newMsg.trim(),
        attachments: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null,
        is_read:     false,
      });

      setNewMsg('');
      setAttachFiles([]);
      setPreviews(new Map());
      setUploadProgress(0);
      loadMessages(active.partner_id);
    } finally {
      setSending(false);
    }
  };

  const getAttachments = (m: Message): string[] => {
    if (!m.attachments) return [];
    try { return JSON.parse(m.attachments); } catch { return []; }
  };

  const startEditMessage = (m: Message) => {
    setEditingId(m.id);
    setEditingText(m.text || '');
  };

  const saveEditMessage = async (id: string) => {
    if (!editingText.trim()) return;
    const { data, error } = await supabase.rpc('edit_own_message', {
      p_message_id: id,
      p_text: editingText.trim(),
    });
    if (error) {
      alert('Не удалось изменить сообщение. Выполните SQL supabase/message_comment_editing.sql. Ошибка: ' + error.message);
      return;
    }
    if (data?.ok === false) {
      const errMap: Record<string, string> = {
        not_authenticated: 'Войдите в систему',
        empty_text: 'Сообщение не может быть пустым',
        message_not_found_or_forbidden: 'Можно редактировать только свои сообщения',
      };
      alert(errMap[data.error] || data.error || 'Не удалось изменить сообщение');
      return;
    }
    setEditingId(null);
    setEditingText('');
    if (active) loadMessages(active.partner_id);
    loadConversations();
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Удалить сообщение?')) return;
    const { data, error } = await supabase.rpc('delete_own_message', { p_message_id: id });
    if (error) {
      alert('Не удалось удалить сообщение. Выполните SQL supabase/message_comment_editing.sql. Ошибка: ' + error.message);
      return;
    }
    if (data?.ok === false) {
      const errMap: Record<string, string> = {
        not_authenticated: 'Войдите в систему',
        message_not_found_or_forbidden: 'Можно удалять только свои сообщения',
      };
      alert(errMap[data.error] || data.error || 'Не удалось удалить сообщение');
      return;
    }
    if (active) loadMessages(active.partner_id);
    loadConversations();
  };

  const filtered = search.trim()
    ? conversations.filter(c => c.partner_name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
          <MessageSquare size={24} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Сообщения</h1>
          {conversations.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
              {conversations.length} диалогов
            </span>
          )}
        </motion.div>

        <div className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden h-[70vh] flex">
          {/* Conversations list */}
          <div className={`${active ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-purple-900/20 flex-col`}>
            <div className="p-3 border-b border-purple-900/20">
              <div className="relative">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск диалогов..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0A12] border border-purple-900/30 rounded-lg text-sm text-white focus:border-purple-500/60 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-purple-700 border-t-purple-400 rounded-full" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-sm">
                  {search ? 'Ничего не найдено' : 'Сообщений пока нет'}
                </div>
              ) : (
                filtered.map(c => (
                  <motion.button key={c.partner_id} onClick={() => setActive(c)}
                    whileHover={{ backgroundColor: 'rgba(139,92,246,0.08)' }}
                    className={`w-full p-3 flex items-center gap-3 border-b border-purple-900/10 transition-colors ${
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
                      <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          {active ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="p-3 border-b border-purple-900/20 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-text-secondary hover:text-white">
                  <ArrowLeft size={20} />
                </button>
                <button onClick={() => openUser(active.partner_id)}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden hover:scale-105 transition-all flex-shrink-0">
                  {active.partner_avatar_url
                    ? <img src={active.partner_avatar_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xs font-bold text-white">{active.partner_avatar}</span>}
                </button>
                <button onClick={() => openUser(active.partner_id)} className="flex-1 text-left hover:text-purple-300 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{active.partner_name}</p>
                  <p className="text-[10px] text-text-secondary">Открыть профиль →</p>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-text-secondary text-sm py-8">Начните разговор 👋</div>
                ) : (
                  messages.map((m, mi) => {
                    const isMine  = m.sender_id === user?.id;
                    const atts    = getAttachments(m);
                    const images  = atts.filter(isImageUrl);
                    const hasText = m.text.trim().length > 0;

                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(mi * 0.02, 0.3) }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[78%] rounded-2xl text-sm overflow-hidden ${
                          isMine
                            ? 'bg-purple-700 text-white rounded-tr-sm'
                            : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                        }`}>
                          {/* Text */}
                          {editingId === m.id ? (
                            <div className="p-2 space-y-2">
                              <textarea value={editingText} onChange={e => setEditingText(e.target.value)} rows={2}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none" />
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => { setEditingId(null); setEditingText(''); }} className="px-2 py-1 rounded-md bg-white/10 text-xs text-white">Отмена</button>
                                <button onClick={() => saveEditMessage(m.id)} className="px-2 py-1 rounded-md bg-green-600 text-xs text-white flex items-center gap-1"><Check size={11} />Сохранить</button>
                              </div>
                            </div>
                          ) : hasText && (
                            <p className="px-3 pt-2.5 pb-1 whitespace-pre-wrap break-words">{m.text}</p>
                          )}

                          {/* Attachments */}
                          {atts.length > 0 && (
                            <div className={`${hasText ? 'px-2 pb-2' : 'p-2'}`}>
                              <MessageAttachments
                                urls={atts}
                                onOpenViewer={(urls, idx) => setViewer({ urls, idx })}
                              />
                            </div>
                          )}

                          {/* Time / actions */}
                          <div className={`px-3 pb-2 pt-0.5 flex items-center gap-2 ${isMine ? 'justify-end text-purple-200/70' : 'justify-start text-text-secondary'}`}>
                            {isMine && editingId !== m.id && (
                              <>
                                <button onClick={() => startEditMessage(m)} className="text-[10px] hover:text-white flex items-center gap-1"><Edit3 size={10} />Изм.</button>
                                <button onClick={() => deleteMessage(m.id)} className="text-[10px] hover:text-red-300 flex items-center gap-1"><Trash2 size={10} />Удал.</button>
                              </>
                            )}
                            <span className="text-[10px]">
                              {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              {m.edited_at && ' · изменено'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Attach preview */}
              <AnimatePresence>
                {attachFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-purple-900/20 pt-2 bg-[#120F1E]"
                  >
                    <AttachPreview
                      files={attachFiles}
                      previews={previews}
                      onRemove={removeFile}
                      onOpenViewer={(urls, idx) => setViewer({ urls, idx })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload progress */}
              <AnimatePresence>
                {sending && uploadProgress > 0 && uploadProgress < 100 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 pb-1"
                  >
                    <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-purple-500 rounded-full"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary mt-0.5 text-right">
                      Загрузка {uploadProgress}%
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className="p-3 border-t border-purple-900/20 flex gap-2 items-end">
                {/* Photo */}
                <label className="cursor-pointer flex-shrink-0">
                  <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                    <Image size={16} />
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleFileAdd} className="hidden" />
                </label>

                {/* File */}
                <label className="cursor-pointer flex-shrink-0">
                  <div className="p-2.5 rounded-xl bg-purple-900/20 border border-purple-700/30 text-purple-400 hover:bg-purple-900/30 transition-all">
                    <Paperclip size={16} />
                  </div>
                  <input type="file" multiple onChange={handleFileAdd} className="hidden" />
                </label>

                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white focus:border-purple-500/60 focus:outline-none transition-all"
                />

                <motion.button
                  onClick={handleSend}
                  disabled={sending || (!newMsg.trim() && attachFiles.length === 0)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] flex-shrink-0"
                >
                  {sending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <Send size={16} />
                  )}
                </motion.button>
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

      {/* Image Viewer */}
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

export default MessagesPage;