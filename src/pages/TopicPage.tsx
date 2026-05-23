// src/pages/TopicPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageSquare, Eye, ThumbsUp, ThumbsDown,
  Send, Trash2, Pin, Clock, Image as ImageIcon, X, Reply
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/RoleBadge';
import { UserLink } from '../components/UserLink';
import ReportButton from '../components/ReportButton';
import LabelManager from '../components/LabelManager';
import type { Page } from '../types/pages';

interface Props {
  topicId: string;
  setCurrentPage: (page: Page, filter?: string | null) => void;
}

const categoryColors: Record<string, string> = {
  'Гайды':     'text-blue-400 bg-blue-900/20 border-blue-800/30',
  'Правила':   'text-red-400 bg-red-900/20 border-red-800/30',
  'Поддержка': 'text-green-400 bg-green-900/20 border-green-800/30',
  'Обзоры':    'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  'Отзывы':    'text-purple-400 bg-purple-900/20 border-purple-800/30',
  'Дискуссии': 'text-cyan-400 bg-cyan-900/20 border-cyan-800/30',
};

interface Comment {
  id: string;
  topic_id: string;
  parent_id?: string | null;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  content: string;
  images?: string[];
  likes: number;
  dislikes?: number;
  created_at: string;
}

const TopicPage: React.FC<Props> = ({ topicId, setCurrentPage }) => {
  const [topic, setTopic] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /* ============ Загрузка ============ */
  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    setMe(u.user);
    if (u.user) {
      const { data: p } = await supabase
        .from('users').select('username, role, avatar_url, email').eq('id', u.user.id).maybeSingle();
      setMyProfile(p);
    }
    const { data: t } = await supabase.from('forum_topics').select('*').eq('id', topicId).maybeSingle();
    setTopic(t);
    const { data: c } = await supabase.from('forum_comments')
      .select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
    setComments(c || []);

    if (u.user) {
      const ids = [topicId, ...((c || []).map(x => x.id))];
      const { data: votes } = await supabase
        .from('forum_likes').select('target_type, target_id, vote')
        .eq('user_id', u.user.id).in('target_id', ids);
      const map: Record<string, number> = {};
      votes?.forEach(v => { map[`${v.target_type}:${v.target_id}`] = v.vote; });
      setMyVotes(map);
    }
    setLoading(false);
    await supabase.rpc('bump_topic_view', { p_topic_id: topicId });
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('topic_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'forum_comments', filter: `topic_id=eq.${topicId}` },
        () => load()
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [topicId]);

  const vote = async (targetType: 'topic' | 'comment', targetId: string, v: 1 | -1) => {
    if (!me) { alert('Войдите в систему'); return; }
    const key = `${targetType}:${targetId}`;
    setMyVotes(p => {
      const c = { ...p };
      if (c[key] === v) delete c[key]; else c[key] = v;
      return c;
    });
    await supabase.rpc('toggle_forum_vote', {
      p_target_type: targetType, p_target_id: targetId, p_vote: v,
    });
    load();
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!me) return [];
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split('.').pop() || 'png';
      const path = `${me.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('forum').upload(path, f);
      if (!error) {
        const { data } = supabase.storage.from('forum').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const sendComment = async () => {
    if ((!newComment.trim() && commentImages.length === 0) || !me) return;
    setSending(true);
    try {
      const imgUrls = commentImages.length > 0 ? await uploadImages(commentImages) : [];
      const name = myProfile?.username || me.email?.split('@')[0] || 'User';
      await supabase.from('forum_comments').insert({
        topic_id: topicId,
        author_id: me.id,
        author_name: name,
        author_avatar: name[0]?.toUpperCase(),
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
        images: imgUrls,
      });
      setNewComment('');
      setCommentImages([]);
      setReplyTo(null);

      // Уведомление
      const recipient = replyTo?.author_id || topic.author_id;
      if (recipient && recipient !== me.id) {
        await supabase.from('notifications').insert({
          user_id: recipient,
          type: 'message',
          title: replyTo ? '💬 Ответ на комментарий' : '💬 Новый комментарий',
          text: `${name}: ${newComment.trim().slice(0, 60)}`,
          icon: '💬',
          link_type: 'forum',
        });
      }
    } finally {
      setSending(false);
      load();
    }
  };

  const delComment = async (id: string) => {
    if (!confirm('Удалить комментарий?')) return;
    await supabase.from('forum_comments').delete().eq('id', id);
    load();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 4 - commentImages.length);
    setCommentImages([...commentImages, ...files]);
  };

  if (loading) return <div className="text-center py-12 text-text-secondary">Загрузка...</div>;
  if (!topic) return (
    <div className="text-center py-12 text-text-secondary">
      Тема не найдена
      <button onClick={() => setCurrentPage('forum')} className="block mx-auto mt-4 text-purple-400 hover:underline">
        ← Назад в форум
      </button>
    </div>
  );

  const topicVote = myVotes[`topic:${topic.id}`];
  const catColor = categoryColors[topic.category] || 'text-text-secondary bg-purple-900/20 border-purple-800/30';

  // Группируем комменты по parent_id
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesOf = (id: string) => comments.filter(c => c.parent_id === id);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => setCurrentPage('forum')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-white">
        <ArrowLeft size={16} /> Назад к форуму
      </button>

      {/* Тема */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {topic.is_pinned && <Pin size={12} className="text-purple-400" />}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${catColor}`}>{topic.category}</span>
          {topic.subcategory && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/20 text-purple-300">{topic.subcategory}</span>
          )}
          {topic.is_hot && (
            <span className="text-xs text-orange-400 bg-orange-900/20 border border-orange-800/30 px-1.5 py-0.5 rounded-full">🔥 Горячее</span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">{topic.title}</h1>
        <div className="mb-3">
          <LabelManager targetType="topic" targetId={topic.id} />
        </div>

        <div className="flex items-center gap-3 mb-4 text-xs text-text-secondary">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{topic.author_avatar || 'U'}</span>
          </div>
          <UserLink userId={topic.author_id} username={topic.author_name || 'Аноним'} className="font-medium text-white" />
          <span>•</span>
          <div className="flex items-center gap-1"><Clock size={11} />{new Date(topic.created_at).toLocaleString('ru-RU')}</div>
        </div>

        {topic.content && (
          <div className="text-sm text-white whitespace-pre-wrap leading-relaxed mb-4 p-4 bg-[#0B0A12] rounded-xl border border-purple-900/20">
            {topic.content}
          </div>
        )}

        {/* Фото темы */}
        {topic.images && topic.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {topic.images.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="w-full h-40 object-cover rounded-xl border border-purple-900/20 hover:border-purple-700/50 transition-colors" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-purple-900/20">
          <button onClick={() => vote('topic', topic.id, 1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              topicVote === 1 ? 'bg-green-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:bg-green-900/30 hover:text-green-400'
            }`}>
            <ThumbsUp size={14} /> {topic.likes || 0}
          </button>
          <button onClick={() => vote('topic', topic.id, -1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              topicVote === -1 ? 'bg-red-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:bg-red-900/30 hover:text-red-400'
            }`}>
            <ThumbsDown size={14} /> {topic.dislikes || 0}
          </button>
          <div className="flex items-center gap-2 text-xs text-text-secondary ml-auto">
            <span className="flex items-center gap-1"><Eye size={12} /> {topic.views || 0}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} /> {comments.length}</span>
            <ReportButton targetType="topic" targetId={topic.id} targetName={topic.title} />
          </div>
        </div>
      </motion.div>

      {/* Комментарии */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-white">Комментарии ({comments.length})</h3>

        {topLevel.length === 0 ? (
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-8 text-center text-sm text-text-secondary">
            Пока нет комментариев. Будь первым!
          </div>
        ) : (
          topLevel.map((c, i) => (
            <CommentItem
              key={c.id}
              comment={c}
              allComments={comments}
              myVotes={myVotes}
              me={me}
              myRole={myProfile?.role}
              onVote={vote}
              onReply={setReplyTo}
              onDelete={delComment}
              index={i}
            />
          ))
        )}

        {/* Форма комментария */}
        {me ? (
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-purple-900/10 rounded-lg text-xs">
                <Reply size={12} className="text-purple-400" />
                <span className="text-text-secondary">Ответ для</span>
                <span className="text-purple-300 font-semibold">{replyTo.author_name}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto text-text-secondary hover:text-white">
                  <X size={12} />
                </button>
              </div>
            )}
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder={replyTo ? `Ответ для ${replyTo.author_name}...` : 'Напишите комментарий...'}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none mb-2" />

            {/* Превью фоток */}
            {commentImages.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {commentImages.map((f, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-purple-900/30">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setCommentImages(commentImages.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={() => fileInput.current?.click()}
                disabled={commentImages.length >= 4}
                className="p-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg disabled:opacity-50"
                title="Добавить фото (макс 4)">
                <ImageIcon size={16} />
              </button>
              <input ref={fileInput} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
              <span className="text-xs text-text-secondary">{commentImages.length}/4</span>
              <button onClick={sendComment} disabled={sending || (!newComment.trim() && commentImages.length === 0)}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                <Send size={14} /> {sending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4 text-center text-sm text-text-secondary">
            Войдите, чтобы комментировать
          </div>
        )}
      </div>
    </div>
  );
};

/* ============ Компонент одного комментария ============ */
const CommentItem: React.FC<{
  comment: Comment;
  allComments: Comment[];
  myVotes: Record<string, number>;
  me: any;
  myRole?: string;
  onVote: (t: 'comment', id: string, v: 1 | -1) => void;
  onReply: (c: Comment) => void;
  onDelete: (id: string) => void;
  index: number;
  depth?: number;
}> = ({ comment: c, allComments, myVotes, me, myRole, onVote, onReply, onDelete, index, depth = 0 }) => {
  const replies = allComments.filter(x => x.parent_id === c.id);
  const v = myVotes[`comment:${c.id}`];
  const canDelete = me && (me.id === c.author_id || ['moderator', 'admin', 'owner'].includes(myRole || ''));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-[#171425] border border-purple-900/20 rounded-xl p-4 ${depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-l-purple-700/40' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{c.author_avatar || 'U'}</span>
        </div>
        <UserLink userId={c.author_id} username={c.author_name} className="text-sm font-semibold text-white" />
        <span className="text-xs text-text-secondary ml-auto">{new Date(c.created_at).toLocaleString('ru-RU')}</span>
      </div>
      <p className="text-sm text-white whitespace-pre-wrap mb-2">{c.content}</p>

      {/* Фото в комменте */}
      {c.images && c.images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {c.images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-purple-900/30 hover:border-purple-700/50" />
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => onVote('comment', c.id, 1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            v === 1 ? 'bg-green-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-green-400'
          }`}>
          <ThumbsUp size={11} /> {c.likes || 0}
        </button>
        <button onClick={() => onVote('comment', c.id, -1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            v === -1 ? 'bg-red-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-red-400'
          }`}>
          <ThumbsDown size={11} /> {c.dislikes || 0}
        </button>
        {me && (
          <button onClick={() => onReply(c)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-purple-900/20 text-text-secondary hover:text-purple-300">
            <Reply size={11} /> Ответить
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ReportButton targetType="comment" targetId={c.id} targetName={'Комментарий: ' + c.content.slice(0, 40)} small />
          {canDelete && (
            <button onClick={() => onDelete(c.id)} className="text-text-secondary hover:text-red-400 p-1">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Ответы */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {replies.map((r, i) => (
            <CommentItem
              key={r.id}
              comment={r}
              allComments={allComments}
              myVotes={myVotes}
              me={me}
              myRole={myRole}
              onVote={onVote}
              onReply={onReply}
              onDelete={onDelete}
              index={i}
              depth={Math.min(depth + 1, 5)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TopicPage;
