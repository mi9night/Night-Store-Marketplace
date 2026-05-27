import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headset, Send, ChevronDown, Paperclip, Image, X,
  ChevronLeft, ChevronRight, FileText, ZoomIn, Plus,
  AlertCircle, CheckCircle2, Clock, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const BUCKET = 'chat-attachments';
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 4;

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} КБ` : `${(b / 1024 / 1024).toFixed(2)} МБ`;

const isImageUrl = (url: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/i.test(url);

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  open:        { label: 'Открыт',   cls: 'bg-blue-900/30 text-blue-400 border border-blue-700/30',     icon: <Clock size={10} /> },
  in_progress: { label: 'В работе', cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30', icon: <AlertCircle size={10} /> },
  closed:      { label: 'Закрыт',   cls: 'bg-gray-900/40 text-gray-400 border border-gray-700/30',       icon: <Lock size={10} /> },
};

interface Ticket {
  id: string;
  category: string;
  category_id?: string;
  subject?: string;
  description?: string;
  fields_data?: string;
  attachments?: string;
  status: string;
  resolution?: string;
  created_at: string;
}

interface TMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments?: string;
  created_at: string;
}

interface CategoryField {
  id: string;
  label: string;
  field_type: 'input' | 'textarea' | 'user_select';
  placeholder?: string;
  required: boolean;
  sort_order: number;
}

interface TicketCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  fields: CategoryField[];
}

/* ─── Upload ────────────────────────────────────────────────────────────── */
const uploadFile = async (file: File, userId: string): Promise<string | null> => {
  const ext  = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) { console.error('Upload error:', error); return null; }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

/* ─── Image Viewer ──────────────────────────────────────────────────────── */
const ImageViewer: React.FC<{ images: string[]; startIndex: number; onClose: () => void }> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx]     = useState(startIndex);
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[500] flex flex-col items-center justify-center"
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
      <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()} className="relative">
        {!loaded && (
          <div className="w-64 h-48 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-purple-500 border-t-white rounded-full" />
          </div>
        )}
        <img src={images[idx]} onLoad={() => setLoaded(true)}
          className={`max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
      </motion.div>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronLeft size={24} />
          </button>
          <button onClick={e => { e.stopPropagation(); setLoaded(false); setIdx(i => (i + 1) % images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 flex gap-2" onClick={e => e.stopPropagation()}>
            {images.map((src, i) => (
              <button key={i} onClick={() => { setLoaded(false); setIdx(i); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-purple-500 scale-110' : 'border-white/20 opacity-50'}`}>
                <img src={src} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

/* ─── Attachments renderer ──────────────────────────────────────────────── */
const AttachmentsView: React.FC<{ urls: string[]; onOpen: (urls: string[], idx: number) => void }> = ({ urls, onOpen }) => {
  const images = urls.filter(isImageUrl);
  const files  = urls.filter(u => !isImageUrl(u));
  return (
    <div className="space-y-2 mt-2">
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((url, i) => (
            <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(images, i)}
              className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/60 transition-all"
              style={{ aspectRatio: images.length === 1 ? '16/9' : '1/1' }}>
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
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs text-white/80 transition-all">
            <FileText size={12} className="text-purple-300 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        );
      })}
    </div>
  );
};

/* ─── File Attach Area ──────────────────────────────────────────────────── */
const FileAttachArea: React.FC<{
  files: File[];
  previews: Map<string, string>;
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  onOpenViewer: (urls: string[], idx: number) => void;
}> = ({ files, previews, onAdd, onRemove, onOpenViewer }) => {
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const pct = Math.round((totalSize / MAX_TOTAL_SIZE) * 100);
  const imgFiles   = files.filter(f => f.type.startsWith('image/'));
  const otherFiles = files.filter(f => !f.type.startsWith('image/'));

  if (files.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="space-y-2 p-3 bg-[#0B0A12] border border-purple-900/20 rounded-xl">
      {imgFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {imgFiles.map((f, i) => {
              const url     = previews.get(f.name + f.size) || '';
              const allUrls = imgFiles.map(rf => previews.get(rf.name + rf.size) || '');
              return (
                <motion.div key={`${f.name}-${i}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative group">
                  <img src={url} onClick={() => onOpenViewer(allUrls, i)}
                    className="w-16 h-16 object-cover rounded-xl border border-purple-700/30 cursor-pointer hover:border-purple-500 transition-all" />
                  <button onClick={() => onRemove(files.indexOf(f))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
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
      {otherFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {otherFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-1 text-xs text-purple-300">
              <Paperclip size={11} />
              <span className="max-w-[100px] truncate">{f.name}</span>
              <span className="text-text-secondary">({formatBytes(f.size)})</span>
              <button onClick={() => onRemove(files.indexOf(f))} className="hover:text-red-400"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
      <div>
        <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-purple-600'}`}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[10px] text-text-secondary mt-0.5 text-right">{formatBytes(totalSize)} / 25 МБ · {files.length}/{MAX_FILES}</p>
      </div>
    </motion.div>
  );
};

/* ─── Create Ticket Modal ───────────────────────────────────────────────── */
const CreateTicketModal: React.FC<{
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}> = ({ userId, onClose, onCreated }) => {
  const [step, setStep]               = useState<'category' | 'form'>('category');
  const [categories, setCategories]   = useState<TicketCategory[]>([]);
  const [selected, setSelected]       = useState<TicketCategory | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [files, setFiles]             = useState<File[]>([]);
  const [previews, setPreviews]       = useState<Map<string, string>>(new Map());
  const [viewer, setViewer]           = useState<{ urls: string[]; idx: number } | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [uploadPct, setUploadPct]     = useState(0);
  const [loadingCats, setLoadingCats] = useState(true);

  // Дефолтные категории (если нет кастомных)
  const DEFAULT_CATS: TicketCategory[] = [
    { id: 'support',  name: 'Техническая поддержка', icon: '🛠', description: 'Проблемы с сайтом или функциями', fields: [
      { id: 'desc', label: 'Опишите проблему', field_type: 'textarea', placeholder: 'Подробно опишите проблему...', required: true, sort_order: 0 },
    ]},
    { id: 'payment',  name: 'Вопросы по оплате',     icon: '💳', description: 'Пополнение баланса, выплаты', fields: [
      { id: 'amount', label: 'Сумма',         field_type: 'input',    placeholder: 'Например: 1000 ₽',    required: true,  sort_order: 0 },
      { id: 'desc',   label: 'Описание',      field_type: 'textarea', placeholder: 'Опишите ситуацию...', required: true,  sort_order: 1 },
    ]},
    { id: 'account',  name: 'Проблемы с аккаунтом',  icon: '👤', description: 'Вход, настройки, безопасность', fields: [
      { id: 'desc', label: 'Опишите проблему', field_type: 'textarea', placeholder: 'Что случилось с аккаунтом?', required: true, sort_order: 0 },
    ]},
    { id: 'dispute',  name: 'Спор по сделке',         icon: '⚖️', description: 'Претензии по купленному товару', fields: [
      { id: 'product',      label: 'Название товара',            field_type: 'input',    placeholder: 'Укажите товар',               required: true,  sort_order: 0 },
      { id: 'seller',       label: 'Никнейм продавца',           field_type: 'input',    placeholder: 'Например: @username',         required: true,  sort_order: 1 },
      { id: 'out_of_site',  label: 'Вели ли вы общение вне сайта?', field_type: 'input', placeholder: 'Да/Нет, если да — где',      required: false, sort_order: 2 },
      { id: 'desc',         label: 'Опишите проблему',           field_type: 'textarea', placeholder: 'Подробно опишите ситуацию...', required: true, sort_order: 3 },
    ]},
    { id: 'report',   name: 'Жалоба на пользователя', icon: '🚨', description: 'Мошенничество, нарушение правил', fields: [
      { id: 'target',  label: 'На кого жалоба (никнейм)', field_type: 'input',    placeholder: 'Никнейм пользователя',       required: true, sort_order: 0 },
      { id: 'reason',  label: 'Причина жалобы',           field_type: 'input',    placeholder: 'Мошенничество / спам / ...',  required: true, sort_order: 1 },
      { id: 'desc',    label: 'Подробное описание',        field_type: 'textarea', placeholder: 'Опишите ситуацию подробно...', required: true, sort_order: 2 },
    ]},
    { id: 'other',    name: 'Другое',                   icon: '💭', description: 'Любой другой вопрос', fields: [
      { id: 'subject', label: 'Тема',    field_type: 'input',    placeholder: 'Кратко о чём',      required: true, sort_order: 0 },
      { id: 'desc',    label: 'Детали', field_type: 'textarea', placeholder: 'Расскажите подробнее...', required: true, sort_order: 1 },
    ]},
  ];

  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      const { data: cats } = await supabase.from('ticket_categories').select('*').eq('is_active', true).order('sort_order');
      if (cats && cats.length > 0) {
        const withFields = await Promise.all(cats.map(async (c: any) => {
          const { data: fields } = await supabase.from('ticket_category_fields').select('*').eq('category_id', c.id).order('sort_order');
          return { ...c, fields: fields || [] };
        }));
        setCategories(withFields);
      } else {
        setCategories(DEFAULT_CATS);
      }
      setLoadingCats(false);
    })();
  }, []);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    const cur = files.reduce((s, f) => s + f.size, 0);
    let running = cur;
    const valid: File[] = [];
    for (const f of incoming) {
      if (files.length + valid.length >= MAX_FILES) break;
      if (running + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f); running += f.size;
    }
    const newMap = new Map(previews);
    valid.forEach(f => { if (f.type.startsWith('image/')) newMap.set(f.name + f.size, URL.createObjectURL(f)); });
    setPreviews(newMap);
    setFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!selected) return;
    // Проверка обязательных полей
    for (const field of selected.fields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        alert(`Заполните обязательное поле: ${field.label}`);
        return;
      }
    }
    setSubmitting(true);
    setUploadPct(0);

    try {
      // Загружаем файлы
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], userId);
        if (url) uploadedUrls.push(url);
        setUploadPct(Math.round(((i + 1) / files.length) * 100));
      }

      // Формируем subject и description
      const subjectField = fieldValues['subject'] || fieldValues['product'] || fieldValues['reason'] || selected.name;
      const descLines = selected.fields
        .filter(f => f.id !== 'subject')
        .map(f => `${f.label}:\n${fieldValues[f.id] || '—'}`)
        .join('\n\n');

      await supabase.from('tickets').insert({
        reporter_id:  userId,
        category:     selected.name,
        category_id:  selected.id,
        subject:      `${selected.icon} ${subjectField}`,
        description:  descLines,
        fields_data:  JSON.stringify(fieldValues),
        attachments:  uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null,
        status:       'open',
      });

      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            {/* Modal header */}
            <div className="p-5 border-b border-purple-900/20 flex items-center gap-3 flex-shrink-0">
              {step === 'form' && (
                <motion.button onClick={() => setStep('category')} whileHover={{ x: -2 }}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all">
                  <ChevronLeft size={18} />
                </motion.button>
              )}
              <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                <Headset size={16} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {step === 'category' ? 'Создать тикет' : selected?.name}
                </h3>
                <p className="text-xs text-text-secondary">
                  {step === 'category' ? 'Выберите категорию обращения' : selected?.description}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 'category' ? (
                  /* ── Step 1: Category picker ── */
                  <motion.div key="cat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="p-5">
                    {loadingCats ? (
                      <div className="flex justify-center py-12">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-6 h-6 border-2 border-purple-700 border-t-purple-400 rounded-full" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {categories.map((cat, i) => (
                          <motion.button key={cat.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => { setSelected(cat); setFieldValues({}); setStep('form'); }}
                            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                            className="group relative p-4 bg-[#120F1E] border border-purple-900/20 hover:border-purple-600/50 rounded-xl text-left transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-2xl mb-2">{cat.icon}</div>
                            <p className="text-sm font-semibold text-white leading-tight">{cat.name}</p>
                            {cat.description && (
                              <p className="text-[11px] text-text-secondary mt-1 leading-tight">{cat.description}</p>
                            )}
                            <div className="mt-3 flex items-center gap-1 text-purple-400 opacity-0 group-hover:opacity-100 transition-all">
                              <span className="text-[10px] font-semibold">Выбрать</span>
                              <ChevronLeft size={10} className="rotate-180" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* ── Step 2: Form ── */
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="p-5 space-y-4">

                    {/* Dynamic fields */}
                    {selected?.fields.sort((a, b) => a.sort_order - b.sort_order).map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-white mb-1.5">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.field_type === 'textarea' ? (
                          <textarea
                            value={fieldValues[field.id] || ''}
                            onChange={e => setFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                            placeholder={field.placeholder || ''}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm resize-none focus:border-purple-500/60 focus:outline-none transition-all placeholder:text-text-secondary"
                          />
                        ) : (
                          <input
                            type="text"
                            value={fieldValues[field.id] || ''}
                            onChange={e => setFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                            placeholder={field.placeholder || ''}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all placeholder:text-text-secondary"
                          />
                        )}
                      </div>
                    ))}

                    {/* File attachments */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-1.5">
                        Прикреплённые файлы
                        <span className="text-text-secondary font-normal ml-2">до {MAX_FILES} файлов, 25 МБ</span>
                      </label>

                      <AnimatePresence>
                        {files.length > 0 && (
                          <div className="mb-3">
                            <FileAttachArea files={files} previews={previews}
                              onAdd={handleFileAdd} onRemove={i => setFiles(p => p.filter((_, j) => j !== i))}
                              onOpenViewer={(urls, idx) => setViewer({ urls, idx })} />
                          </div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                        <label className="cursor-pointer flex-1">
                          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-900/10 border border-purple-700/20 border-dashed hover:bg-purple-900/20 hover:border-purple-600/40 text-purple-400 text-sm transition-all">
                            <Image size={15} />
                            <span>Фото</span>
                          </div>
                          <input type="file" multiple accept="image/*" onChange={handleFileAdd} className="hidden" />
                        </label>
                        <label className="cursor-pointer flex-1">
                          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-900/10 border border-purple-700/20 border-dashed hover:bg-purple-900/20 hover:border-purple-600/40 text-purple-400 text-sm transition-all">
                            <Paperclip size={15} />
                            <span>Файл</span>
                          </div>
                          <input type="file" multiple onChange={handleFileAdd} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Upload progress */}
                    <AnimatePresence>
                      {submitting && uploadPct > 0 && uploadPct < 100 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="h-1 bg-purple-900/20 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500 rounded-full"
                              animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }} />
                          </div>
                          <p className="text-[10px] text-text-secondary mt-1 text-right">Загрузка {uploadPct}%</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {step === 'form' && (
              <div className="p-5 border-t border-purple-900/20 flex-shrink-0">
                <motion.button onClick={handleSubmit} disabled={submitting}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      {files.length > 0 ? 'Загрузка файлов...' : 'Отправка...'}
                    </>
                  ) : (
                    <><Send size={15} /> Отправить обращение</>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {viewer && <ImageViewer images={viewer.urls} startIndex={viewer.idx} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </>
  );
};

/* ─── Ticket Item ─────────────────────────────────────────────────────────── */
const TicketItem: React.FC<{ ticket: Ticket; me: any }> = ({ ticket, me }) => {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState<TMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply]             = useState('');
  const [sending, setSending]         = useState(false);
  const [replyFiles, setReplyFiles]   = useState<File[]>([]);
  const [previews, setPreviews]       = useState<Map<string, string>>(new Map());
  const [viewer, setViewer]           = useState<{ urls: string[]; idx: number } | null>(null);
  const [uploadPct, setUploadPct]     = useState(0);
  const messagesEndRef                = useRef<HTMLDivElement>(null);

  const totalSize = replyFiles.reduce((s, f) => s + f.size, 0);

  const fetchMessages = async () => {
    setLoadingMsgs(true);
    const { data } = await supabase.from('ticket_messages').select('*')
      .eq('ticket_id', ticket.id).order('created_at', { ascending: true });
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

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    let cur = totalSize; const valid: File[] = [];
    for (const f of incoming) {
      if (replyFiles.length + valid.length >= MAX_FILES) break;
      if (cur + f.size > MAX_TOTAL_SIZE) continue;
      valid.push(f); cur += f.size;
    }
    const newMap = new Map(previews);
    valid.forEach(f => { if (f.type.startsWith('image/')) newMap.set(f.name + f.size, URL.createObjectURL(f)); });
    setPreviews(newMap);
    setReplyFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const send = async () => {
    if (!reply.trim() && replyFiles.length === 0) return;
    setSending(true); setUploadPct(0);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < replyFiles.length; i++) {
        const url = await uploadFile(replyFiles[i], me.id);
        if (url) uploadedUrls.push(url);
        setUploadPct(Math.round(((i + 1) / replyFiles.length) * 100));
      }
      await supabase.from('ticket_messages').insert({
        ticket_id:   ticket.id,
        sender_id:   me.id,
        message:     reply.trim(),
        attachments: uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null,
      });
      setReply(''); setReplyFiles([]); setPreviews(new Map()); setUploadPct(0);
      await fetchMessages();
    } finally { setSending(false); }
  };

  const getAtts = (m: TMessage): string[] => {
    if (!m.attachments) return [];
    try { return JSON.parse(m.attachments); } catch { return []; }
  };

  const ticketAtts = (): string[] => {
    if (!ticket.attachments) return [];
    try { return JSON.parse(ticket.attachments); } catch { return []; }
  };

  const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['open'];

  return (
    <>
      <motion.div layout className={`bg-[#171425] border rounded-2xl overflow-hidden transition-all duration-200 ${
        open ? 'border-purple-700/50 shadow-[0_0_24px_rgba(139,92,246,0.1)]' : 'border-purple-900/20 hover:border-purple-700/30'
      }`}>
        {/* Header */}
        <button onClick={toggle} className="w-full p-4 text-left hover:bg-purple-900/5 transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${open ? 'bg-purple-700/30' : 'bg-purple-900/20'}`}>
              {ticket.subject?.split(' ')[0] || '💭'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {ticket.subject?.replace(/^[\S]+\s/, '') || ticket.category}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                #{ticket.id.slice(0, 8)} · {new Date(ticket.created_at).toLocaleString('ru-RU')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>
                {st.icon}{st.label}
              </span>
              <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-text-secondary">
                <ChevronDown size={16} />
              </motion.div>
            </div>
          </div>
        </button>

        {/* Body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 bg-[#120F1E] space-y-4 border-t border-purple-900/20">

                {/* Description */}
                <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Описание</p>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

                  {/* Ticket attachments */}
                  {ticketAtts().length > 0 && (
                    <div className="pt-2 border-t border-purple-900/20">
                      <p className="text-xs text-text-secondary mb-2">📎 Прикреплённые файлы ({ticketAtts().length})</p>
                      <AttachmentsView urls={ticketAtts()} onOpen={(urls, idx) => setViewer({ urls, idx })} />
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {loadingMsgs ? (
                    <div className="text-center py-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-purple-700 border-t-purple-400 rounded-full mx-auto" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-text-secondary text-sm py-8">Ответов пока нет</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5">
                      <AnimatePresence>
                        {messages.map((m, i) => {
                          const isMine = m.sender_id === me?.id;
                          const atts   = getAtts(m);
                          const hasText = m.message?.trim().length > 0;
                          return (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl text-sm overflow-hidden ${
                                isMine ? 'bg-purple-700 text-white rounded-tr-sm' : 'bg-[#1E1A30] border border-purple-900/30 text-white rounded-tl-sm'
                              }`}>
                                {!isMine && <p className="px-3 pt-2 text-[10px] text-purple-300 font-bold">🛟 Поддержка</p>}
                                {hasText && <p className="px-3 py-2 whitespace-pre-wrap break-words">{m.message}</p>}
                                {atts.length > 0 && (
                                  <div className={`${hasText ? 'px-2 pb-2' : 'p-2'}`}>
                                    <AttachmentsView urls={atts} onOpen={(urls, idx) => setViewer({ urls, idx })} />
                                  </div>
                                )}
                                <p className={`px-3 pb-2 text-[10px] ${isMine ? 'text-purple-200/70' : 'text-text-secondary'}`}>
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
                    <AnimatePresence>
                      {replyFiles.length > 0 && (
                        <FileAttachArea files={replyFiles} previews={previews}
                          onAdd={handleFileAdd}
                          onRemove={i => setReplyFiles(p => p.filter((_, j) => j !== i))}
                          onOpenViewer={(urls, idx) => setViewer({ urls, idx })} />
                      )}
                    </AnimatePresence>

                    {/* Upload progress */}
                    <AnimatePresence>
                      {sending && uploadPct > 0 && uploadPct < 100 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="h-0.5 bg-purple-900/20 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500 rounded-full"
                              animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }} />
                          </div>
                          <p className="text-[10px] text-text-secondary mt-0.5 text-right">Загрузка {uploadPct}%</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

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
                      <input value={reply} onChange={e => setReply(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                        placeholder="Ответить..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B0A12] border border-purple-900/30 text-white text-sm focus:border-purple-500/60 focus:outline-none transition-all" />
                      <motion.button onClick={send} disabled={sending || (!reply.trim() && replyFiles.length === 0)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] flex-shrink-0">
                        {sending
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          : <Send size={16} />}
                      </motion.button>
                    </div>
                  </div>
                )}

                {ticket.status === 'closed' && (
                  <div className="flex items-center gap-2 p-3 bg-gray-900/30 border border-gray-700/20 rounded-xl">
                    <Lock size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-400">Тикет закрыт</p>
                    {ticket.resolution && (
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                        ticket.resolution === 'resolved' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {ticket.resolution === 'resolved' ? '✅ Решено' : '❌ Не решено'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {viewer && <ImageViewer images={viewer.urls} startIndex={viewer.idx} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const SupportPage: React.FC = () => {
  const [me, setMe]               = useState<any>(null);
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (userId: string) => {
    const { data } = await supabase.from('tickets').select('*')
      .eq('reporter_id', userId).order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      setMe(u.user);
      await load(u.user.id);
      setLoading(false);
    })();
  }, []);

  const openCount = tickets.filter(t => t.status !== 'closed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center">
          <Headset size={18} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Поддержка</h1>
        {openCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="text-xs px-2.5 py-1 rounded-full bg-purple-700/30 border border-purple-600/30 text-purple-300 font-semibold">
            {openCount}
          </motion.span>
        )}
        <motion.button onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_16px_rgba(139,92,246,0.3)]">
          <Plus size={15} />
          Создать тикет
        </motion.button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-purple-700 border-t-purple-400 rounded-full" />
        </div>
      ) : tickets.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#171425] border border-purple-900/20 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
            <Headset size={28} className="text-purple-600" />
          </div>
          <p className="text-white font-semibold mb-1">Тикетов пока нет</p>
          <p className="text-text-secondary text-sm mb-6">Здесь появятся ваши обращения в поддержку</p>
          <motion.button onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_16px_rgba(139,92,246,0.3)]">
            <Plus size={15} /> Создать первый тикет
          </motion.button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-3">
          {tickets.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <TicketItem ticket={t} me={me} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && me && (
          <CreateTicketModal
            userId={me.id}
            onClose={() => setShowCreate(false)}
            onCreated={() => { if (me) load(me.id); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportPage;