import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, TrendingUp, Plus, Eye, ThumbsUp, Clock, Pin, X, Image as ImageIcon,
  Trash2, ArrowUp, ArrowDown, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserLink } from '../components/UserLink';
import ReportButton from '../components/ReportButton';
import { fetchActivePunishment, formatPunishmentDate } from '../lib/moderation';

interface ForumPageProps {
  filter?: string | null;
  onOpenTopic?: (id: string) => void;
}

interface Topic {
  id: string;
  title: string;
  content?: string;
  category: string;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  author_avatar_url?: string;
  replies?: number;
  views?: number;
  likes?: number;
  created_at: string;
  is_pinned?: boolean;
  is_hot?: boolean;
  is_closed?: boolean;
  closed_at?: string | null;
  pinned_order?: number | null;
  edited_at?: string | null;
}

const categoriesList = ['Все', '🎁 Розыгрыши', 'Гайды', 'Правила', 'Поддержка', 'Обзоры', 'Отзывы', 'Дискуссии', 'Оффтоп'];
const categoryColors: Record<string, string> = {
  'Гайды': 'text-blue-400 bg-blue-900/20 border-blue-800/30',
  'Правила': 'text-red-400 bg-red-900/20 border-red-800/30',
  'Поддержка': 'text-green-400 bg-green-900/20 border-green-800/30',
  'Обзоры': 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  'Отзывы': 'text-purple-400 bg-purple-900/20 border-purple-800/30',
  'Дискуссии': 'text-cyan-400 bg-cyan-900/20 border-cyan-800/30',
  'Оффтоп': 'text-gray-300 bg-gray-900/30 border-gray-700/40',
  '🎁 Розыгрыши': 'text-pink-400 bg-pink-900/20 border-pink-800/30 shadow-[0_0_10px_rgba(236,72,153,0.4)]',
};

const ForumPage: React.FC<ForumPageProps> = ({ filter, onOpenTopic }) => {
  const [me, setMe] = useState<any>(null);
  const [myRole, setMyRole] = useState<string>('user');

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);
      if (u.user) {
        const { data } = await supabase.from('users').select('role').eq('id', u.user.id).maybeSingle();
        setMyRole(data?.role || 'user');
      }
    })();
  }, []);

  const isAdmin = ['admin', 'owner'].includes(myRole);

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Удалить тему?')) return;
    await supabase.from('forum_topics').delete().eq('id', id);
    loadTopics();
  };

  const handleTogglePin = async (topic: Topic) => {
    if (!isAdmin) return;
    const { error } = await supabase
      .from('forum_topics')
      .update({ is_pinned: !topic.is_pinned })
      .eq('id', topic.id);
    if (error) {
      alert(error.message);
      return;
    }
    loadTopics();
  };

  const handleToggleClose = async (topic: Topic) => {
    if (!['moderator', 'admin', 'owner'].includes(myRole)) return;
    const payload = topic.is_closed
      ? { is_closed: false, closed_at: null, closed_by: null }
      : { is_closed: true, closed_at: new Date().toISOString(), closed_by: me?.id };
    const { error } = await supabase.from('forum_topics').update(payload).eq('id', topic.id);
    if (error) {
      alert('Для закрытия тем выполните SQL forum_topic_closing_rules.sql: ' + error.message);
      return;
    }
    loadTopics();
  };

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Все');
  const [showCreate, setShowCreate] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Дискуссии');
  const [newPinned, setNewPinned] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const newImgInput = useRef<HTMLInputElement>(null);
  const [gwPrize, setGwPrize] = useState('');
  const [gwDays, setGwDays] = useState('3');
  const [gwHours, setGwHours] = useState('0');
  const [gwMinutes, setGwMinutes] = useState('0');

  useEffect(() => {
    if (filter && categoriesList.includes(filter)) setActiveCategory(filter);
    else if (!filter) setActiveCategory('Все');
  }, [filter]);

  /* ============ Загрузка тем из Supabase ============ */
  const loadTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Подтянем актуальные аватарки
      const ids = [...new Set((data || []).map((t: any) => t.author_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: users } = await supabase.from('users')
          .select('id, username, avatar_url').in('id', ids);
        const map: Record<string, any> = {};
        users?.forEach((u: any) => { map[u.id] = u; });
        (data || []).forEach((t: any) => {
          if (map[t.author_id]) {
            t.author_avatar_url = map[t.author_id].avatar_url;
            t.author_name = map[t.author_id].username || t.author_name;
          }
        });
      }

      const sorted = [...(data || [])].sort((a: any, b: any) => {
        if (!!a.is_pinned !== !!b.is_pinned) return a.is_pinned ? -1 : 1;
        if (a.is_pinned && b.is_pinned) {
          const ao = a.pinned_order ?? 999999;
          const bo = b.pinned_order ?? 999999;
          if (ao !== bo) return ao - bo;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTopics(sorted);
    } catch (e) {
      console.warn('Не удалось загрузить темы:', e);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();

    const channel = supabase
      .channel('forum_topics_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'forum_topics' },
        () => loadTopics()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ============ Создание темы ============ */
  const handleCreate = async () => {
    setCreateError(null);

    if (!newTitle.trim()) {
      setCreateError('Введите заголовок');
      return;
    }
    if (newTitle.length < 5) {
      setCreateError('Заголовок минимум 5 символов');
      return;
    }
    if (newCategory === 'Правила' && !isAdmin) {
      setCreateError('Темы в разделе «Правила» могут создавать только администраторы');
      return;
    }

    setCreating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setCreateError('Войдите в систему');
        return;
      }

      const mute = await fetchActivePunishment(u.user.id, 'mute');
      if (mute) {
        setCreateError(`У вас мут до ${formatPunishmentDate(mute.ends_at)}. Создание тем временно недоступно.`);
        return;
      }

      // Загружаем фото если есть
      const imgUrls: string[] = [];
      for (const f of newImages) {
        const ext = f.name.split('.').pop() || 'png';
        const path = `${u.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('forum').upload(path, f);
        if (!upErr) {
          const { data } = supabase.storage.from('forum').getPublicUrl(path);
          imgUrls.push(data.publicUrl);
        }
      }

      const { data: insertedTopic, error } = await supabase.from('forum_topics').insert({
        title: newTitle,
        content: newContent,
        category: newCategory,
        author_id: u.user.id,
        author_name: u.user.email?.split('@')[0] || 'User',
        author_avatar: (u.user.email?.[0] || 'U').toUpperCase(),
        replies: 0,
        views: 0,
        likes: 0,
        is_pinned: isAdmin && newPinned,
        is_hot: false,
        images: imgUrls,
      }).select().single();

      if (error) throw error;

      // Если категория Розыгрыши — создаём giveaway
      if (newCategory?.includes('Розыгрыш') && insertedTopic && gwPrize.trim()) {
        const endsAt = new Date();
        const totalMs = (parseInt(gwDays || '0') * 86400 + parseInt(gwHours || '0') * 3600 + parseInt(gwMinutes || '0') * 60) * 1000;
        endsAt.setTime(endsAt.getTime() + (totalMs > 0 ? totalMs : 3 * 86400000));
        await supabase.from('giveaways').insert({
          author_id: u.user.id,
          topic_id: insertedTopic.id,
          title: newTitle,
          prize: gwPrize.trim(),
          description: newContent,
          ends_at: endsAt.toISOString(),
          status: 'active',
        });
      }

      setNewTitle('');
      setNewContent('');
      setNewPinned(false);
      setNewImages([]);
      setGwPrize('');
      setGwDays('3'); setGwHours('0'); setGwMinutes('0');
      setShowCreate(false);
      loadTopics();
    } catch (e: any) {
      setCreateError(e.message || 'Ошибка создания темы. Проверьте таблицу forum_topics.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = activeCategory === 'Все'
    ? topics
    : topics.filter(t => t.category === activeCategory);

  const pinned = filtered.filter(t => t.is_pinned);
  const regular = filtered.filter(t => !t.is_pinned);

  const movePinnedTopic = async (topicId: string, direction: 'up' | 'down', list: Topic[]) => {
    if (!isAdmin) return;
    const current = [...list];
    const idx = current.findIndex(t => t.id === topicId);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    const updates = current.map((t, order) =>
      supabase.from('forum_topics').update({ pinned_order: order }).eq('id', t.id)
    );
    const result = await Promise.all(updates);
    const err = result.find(r => r.error)?.error;
    if (err) {
      alert('Для изменения порядка закрепов выполните SQL forum_topic_editing_order.sql: ' + err.message);
      return;
    }
    loadTopics();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Форум</h1>
          <p className="text-sm text-text-secondary">Обсуждения, гайды и поддержка сообщества</p>
        </div>
        <motion.button
          onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          Создать тему
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MessageSquare, label: 'Тем', value: topics.length.toString(), color: 'text-accent' },
          { icon: Eye, label: 'Просмотров', value: topics.reduce((s, t) => s + (t.views || 0), 0).toString(), color: 'text-blue-400' },
          { icon: ThumbsUp, label: 'Лайков', value: topics.reduce((s, t) => s + (t.likes || 0), 0).toString(), color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-4 text-center"
          >
            <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categoriesList.map(cat => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              activeCategory === cat
                ? 'bg-accent text-white border-accent'
                : 'bg-bg-card text-text-secondary border-purple-900/30'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Состояние загрузки / пусто */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка тем...</div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bg-card border border-purple-900/20 rounded-2xl p-12 text-center"
        >
          <MessageSquare size={48} className="mx-auto text-purple-700/50 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {topics.length === 0 ? 'На форуме пока нет тем' : 'В этой категории пусто'}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Создайте первую — обсудите что-нибудь интересное!
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
          >
            Создать тему
          </button>
        </motion.div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin size={14} className="text-accent" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Закреплённые</span>
              </div>
              <div className="space-y-2">
                {pinned.map((topic, i) => (
                  <TopicRow key={topic.id} topic={topic} index={i} pinned onOpen={onOpenTopic} canDelete={me?.id === topic.author_id || ['moderator','admin','owner'].includes(myRole)} onDelete={handleDeleteTopic} canPin={isAdmin} onTogglePin={handleTogglePin} canOrder={isAdmin} canMoveUp={i > 0} canMoveDown={i < pinned.length - 1} onMovePinned={(direction) => movePinnedTopic(topic.id, direction, pinned)} canClose={['moderator','admin','owner'].includes(myRole)} onToggleClose={handleToggleClose} />
                ))}
              </div>
            </div>
          )}

          <div>
            {pinned.length > 0 && regular.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-accent" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Обсуждения</span>
              </div>
            )}
            <div className="space-y-2">
              {regular.map((topic, i) => (
                <TopicRow key={topic.id} topic={topic} index={i} onOpen={onOpenTopic} canDelete={me?.id === topic.author_id || ['moderator','admin','owner'].includes(myRole)} onDelete={handleDeleteTopic} canPin={isAdmin} onTogglePin={handleTogglePin} canClose={['moderator','admin','owner'].includes(myRole)} onToggleClose={handleToggleClose} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* === Модалка создания темы === */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-card border border-purple-900/30 rounded-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Создать тему</h2>
                <button onClick={() => setShowCreate(false)} className="text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <label className="text-sm text-text-secondary mb-1.5 block">Категория</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
              >
                {categoriesList.filter(c => c !== 'Все' && (isAdmin || c !== 'Правила')).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {isAdmin && (
                <label className="mb-3 flex items-center justify-between rounded-xl border border-purple-900/20 bg-bg-secondary p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Pin size={14} className="text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-white">Закрепить тему</p>
                      <p className="text-[10px] text-text-secondary">Доступно только администраторам</p>
                    </div>
                  </div>
                  <div onClick={() => setNewPinned(!newPinned)}
                    className={`w-10 h-5 rounded-full transition-all relative ${newPinned ? 'bg-accent' : 'bg-purple-900/40'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${newPinned ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </label>
              )}

              <label className="text-sm text-text-secondary mb-1.5 block">Заголовок</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="О чём ваша тема?"
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white mb-3"
              />

              <label className="text-sm text-text-secondary mb-1.5 block">Текст</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Подробности..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white resize-none mb-3"
              />

              {newCategory?.includes('Розыгрыш') && (
                <div className="mb-3 p-3 bg-pink-900/20 border border-pink-700/30 rounded-xl space-y-2">
                  <p className="text-xs text-pink-300 font-semibold">🎁 Параметры розыгрыша</p>
                  <input value={gwPrize} onChange={e => setGwPrize(e.target.value)}
                    placeholder="Приз (например: Steam аккаунт)"
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-text-secondary block mb-1">Дней</label>
                      <input type="number" min="0" max="365" value={gwDays}
                        onChange={e => setGwDays(e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-text-secondary block mb-1">Часов</label>
                      <input type="number" min="0" max="23" value={gwHours}
                        onChange={e => setGwHours(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-text-secondary block mb-1">Минут</label>
                      <input type="number" min="0" max="59" value={gwMinutes}
                        onChange={e => setGwMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { l: '5м', d: 0, h: 0, m: 5 },
                      { l: '1ч', d: 0, h: 1, m: 0 },
                      { l: '6ч', d: 0, h: 6, m: 0 },
                      { l: '1д', d: 1, h: 0, m: 0 },
                      { l: '3д', d: 3, h: 0, m: 0 },
                      { l: '7д', d: 7, h: 0, m: 0 },
                      { l: '30д', d: 30, h: 0, m: 0 },
                    ].map(p => (
                      <button key={p.l} onClick={() => { setGwDays(String(p.d)); setGwHours(String(p.h)); setGwMinutes(String(p.m)); }}
                        className="px-2 py-1 text-[10px] bg-pink-900/30 text-pink-300 rounded-md hover:bg-pink-900/50">
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Фото */}
              <div className="mb-3">
                <label className="text-sm text-text-secondary mb-1.5 block">Фото (до 4)</label>
                <div className="flex gap-2 items-center flex-wrap">
                  {newImages.map((f, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-900/30">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {newImages.length < 4 && (
                    <button onClick={() => newImgInput.current?.click()}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-purple-700/40 hover:border-purple-500 flex items-center justify-center text-purple-400">
                      <ImageIcon size={20} />
                    </button>
                  )}
                  <input ref={newImgInput} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 4 - newImages.length);
                        setNewImages([...newImages, ...files]);
                      }
                    }} />
                </div>
              </div>

              {createError && (
                <div className="text-sm mb-3 p-2 rounded-lg bg-error/10 text-error">
                  ⚠️ {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {creating ? 'Создание...' : 'Опубликовать'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TopicRow: React.FC<{ topic: Topic; index: number; pinned?: boolean; onOpen?: (id: string) => void; canDelete?: boolean; onDelete?: (id: string) => void; canPin?: boolean; onTogglePin?: (topic: Topic) => void; canOrder?: boolean; canMoveUp?: boolean; canMoveDown?: boolean; onMovePinned?: (direction: 'up' | 'down') => void; canClose?: boolean; onToggleClose?: (topic: Topic) => void; }> = ({ topic, index, pinned, onOpen, canDelete, onDelete, canPin, onTogglePin, canOrder, canMoveUp, canMoveDown, onMovePinned, canClose, onToggleClose }) => {
  const categoryColor = categoryColors[topic.category] || 'text-text-secondary bg-purple-900/20 border-purple-800/30';
  const dateStr = new Date(topic.created_at).toLocaleDateString('ru-RU');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onOpen?.(topic.id)}
      className={`bg-bg-card border rounded-xl p-4 hover:border-purple-700/40 transition-all cursor-pointer ${
        pinned ? 'border-accent/30' : 'border-purple-900/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {topic.author_avatar_url ? (
            <img src={topic.author_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{topic.author_avatar || 'U'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {pinned && <Pin size={12} className="text-accent" />}
            {topic.is_hot && <span className="text-xs text-orange-400 bg-orange-900/20 border border-orange-800/30 px-1.5 py-0.5 rounded-full">🔥 Горячее</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}>{topic.category}</span>
            {topic.is_closed && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900/40 text-gray-300 border border-gray-700/40 inline-flex items-center gap-1"><Lock size={10} /> Закрыта</span>}
          </div>
          <h3 className="text-sm font-semibold text-text-primary hover:text-accent-soft transition-colors line-clamp-1">
            {topic.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-text-secondary mt-1.5 flex-wrap">
            <UserLink userId={topic.author_id} username={topic.author_name || 'Аноним'} className="text-text-secondary" />
            <span>•</span>
            <div className="flex items-center gap-1"><Clock size={11} />{dateStr}</div>
            {topic.edited_at && <span className="text-yellow-400">изменено</span>}
            <span>•</span>
            <div className="flex items-center gap-1"><MessageSquare size={11} />{topic.replies || 0}</div>
            <div className="flex items-center gap-1"><Eye size={11} />{topic.views || 0}</div>
            <div className="flex items-center gap-1"><ThumbsUp size={11} />{topic.likes || 0}</div>
            <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              <ReportButton targetType="topic" targetId={topic.id} targetName={topic.title} small />
              {canOrder && topic.is_pinned && (
                <>
                  <button disabled={!canMoveUp} onClick={(e) => { e.stopPropagation(); onMovePinned?.('up'); }}
                    className="text-text-secondary hover:text-purple-300 disabled:opacity-30 p-1" title="Выше">
                    <ArrowUp size={11} />
                  </button>
                  <button disabled={!canMoveDown} onClick={(e) => { e.stopPropagation(); onMovePinned?.('down'); }}
                    className="text-text-secondary hover:text-purple-300 disabled:opacity-30 p-1" title="Ниже">
                    <ArrowDown size={11} />
                  </button>
                </>
              )}
              {canPin && (
                <button onClick={(e) => { e.stopPropagation(); onTogglePin?.(topic); }}
                  className={`p-1 ${topic.is_pinned ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}
                  title={topic.is_pinned ? 'Открепить тему' : 'Закрепить тему'}>
                  <Pin size={11} />
                </button>
              )}
              {canClose && (
                <button onClick={(e) => { e.stopPropagation(); onToggleClose?.(topic); }}
                  className={`p-1 ${topic.is_closed ? 'text-green-400' : 'text-text-secondary hover:text-gray-200'}`}
                  title={topic.is_closed ? 'Открыть тему' : 'Закрыть тему'}>
                  {topic.is_closed ? <Unlock size={11} /> : <Lock size={11} />}
                </button>
              )}
              {canDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(topic.id); }}
                  className="text-text-secondary hover:text-red-400 p-1"
                  title="Удалить тему">
                  <Trash2 size={11} />
                </button>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ForumPage;
