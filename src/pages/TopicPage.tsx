// src/pages/TopicPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageSquare, Eye, ThumbsUp, ThumbsDown,
  Send, Trash2, Pin, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/ModerationPanel';
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

const TopicPage: React.FC<Props> = ({ topicId, setCurrentPage }) => {
  const [topic, setTopic] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  /* ============ Загрузка темы и комментариев ============ */
  const load = async () => {
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    setMe(u.user);

    if (u.user) {
      const { data: p } = await supabase
        .from('users').select('username, role, avatar_url, email')
        .eq('id', u.user.id).maybeSingle();
      setMyProfile(p);
    }

    const { data: t } = await supabase.from('forum_topics').select('*').eq('id', topicId).maybeSingle();
    setTopic(t);

    const { data: c } = await supabase.from('forum_comments')
      .select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
    setComments(c || []);

    // Мои голоса
    if (u.user) {
      const ids = [topicId, ...((c || []).map(x => x.id))];
      const { data: votes } = await supabase
        .from('forum_likes')
        .select('target_type, target_id, vote')
        .eq('user_id', u.user.id)
        .in('target_id', ids);
      const map: Record<string, number> = {};
      votes?.forEach(v => { map[`${v.target_type}:${v.target_id}`] = v.vote; });
      setMyVotes(map);
    }

    setLoading(false);

    // +1 просмотр
    await supabase.rpc('bump_topic_view', { p_topic_id: topicId });
  };

  useEffect(() => {
    load();

    const ch = supabase
      .channel('topic_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'forum_comments', filter: `topic_id=eq.${topicId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [topicId]);

  /* ============ Голосование ============ */
  const vote = async (targetType: 'topic' | 'comment', targetId: string, v: 1 | -1) => {
    if (!me) { alert('Войдите в систему'); return; }
    const key = `${targetType}:${targetId}`;
    const prev = myVotes[key];
    // Оптимистичное обновление
    setMyVotes(p => {
      const c = { ...p };
      if (prev === v) delete c[key]; else c[key] = v;
      return c;
    });
    await supabase.rpc('toggle_forum_vote', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_vote: v,
    });
    load();
  };

  /* ============ Отправить комментарий ============ */
  const sendComment = async () => {
    if (!newComment.trim() || !me) return;
    setSending(true);
    try {
      const name = myProfile?.username || me.email?.split('@')[0] || 'User';
      await supabase.from('forum_comments').insert({
        topic_id: topicId,
        author_id: me.id,
        author_name: name,
        author_avatar: name[0]?.toUpperCase(),
        content: newComment.trim(),
      });
      setNewComment('');

      // Уведомление автору темы
      if (topic && topic.author_id && topic.author_id !== me.id) {
        await supabase.from('notifications').insert({
          user_id: topic.author_id,
          type: 'message',
          title: '💬 Новый комментарий',
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

  /* ============ Удалить комментарий ============ */
  const delComment = async (id: string) => {
    if (!confirm('Удалить комментарий?')) return;
    await supabase.from('forum_comments').delete().eq('id', id);
    load();
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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => setCurrentPage('forum')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-white"
      >
        <ArrowLeft size={16} /> Назад к форуму
      </button>

      {/* Тема */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {topic.is_pinned && <Pin size={12} className="text-purple-400" />}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${catColor}`}>{topic.category}</span>
          {topic.is_hot && (
            <span className="text-xs text-orange-400 bg-orange-900/20 border border-orange-800/30 px-1.5 py-0.5 rounded-full">
              🔥 Горячее
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">{topic.title}</h1>

        <div className="flex items-center gap-3 mb-4 text-xs text-text-secondary">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{topic.author_avatar || 'U'}</span>
          </div>
          <span className="font-medium text-white">{topic.author_name || 'Аноним'}</span>
          <span>•</span>
          <div className="flex items-center gap-1"><Clock size={11} />{new Date(topic.created_at).toLocaleString('ru-RU')}</div>
        </div>

        {topic.content && (
          <div className="text-sm text-white whitespace-pre-wrap leading-relaxed mb-5 p-4 bg-[#0B0A12] rounded-xl border border-purple-900/20">
            {topic.content}
          </div>
        )}

        {/* Действия */}
        <div className="flex items-center gap-3 pt-3 border-t border-purple-900/20">
          <button
            onClick={() => vote('topic', topic.id, 1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              topicVote === 1 ? 'bg-green-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:bg-green-900/30 hover:text-green-400'
            }`}
          >
            <ThumbsUp size={14} /> {topic.likes || 0}
          </button>
          <button
            onClick={() => vote('topic', topic.id, -1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              topicVote === -1 ? 'bg-red-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:bg-red-900/30 hover:text-red-400'
            }`}
          >
            <ThumbsDown size={14} /> {topic.dislikes || 0}
          </button>
          <div className="flex items-center gap-1 text-xs text-text-secondary ml-auto">
            <Eye size={12} /> {topic.views || 0}
            <span className="mx-1">·</span>
            <MessageSquare size={12} /> {comments.length}
          </div>
        </div>
      </motion.div>

      {/* Комментарии */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-white">Комментарии ({comments.length})</h3>

        {comments.length === 0 ? (
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-8 text-center text-sm text-text-secondary">
            Пока нет комментариев. Будь первым!
          </div>
        ) : (
          comments.map((c, i) => {
            const v = myVotes[`comment:${c.id}`];
            const canDelete = me && (me.id === c.author_id || ['moderator', 'admin', 'owner'].includes(myProfile?.role));
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#171425] border border-purple-900/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{c.author_avatar || 'U'}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{c.author_name}</span>
                  <span className="text-xs text-text-secondary ml-auto">
                    {new Date(c.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                <p className="text-sm text-white whitespace-pre-wrap mb-3">{c.content}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => vote('comment', c.id, 1)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                      v === 1 ? 'bg-green-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-green-400'
                    }`}
                  >
                    <ThumbsUp size={11} /> {c.likes || 0}
                  </button>
                  <button
                    onClick={() => vote('comment', c.id, -1)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                      v === -1 ? 'bg-red-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-red-400'
                    }`}
                  >
                    <ThumbsDown size={11} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => delComment(c.id)}
                      className="ml-auto text-text-secondary hover:text-red-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Форма комментария */}
        {me ? (
          <div className="bg-[#171425] border border-purple-900/20 rounded-2xl p-4">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Напишите комментарий..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none mb-2"
            />
            <button
              onClick={sendComment}
              disabled={sending || !newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 ml-auto"
            >
              <Send size={14} /> {sending ? 'Отправка...' : 'Отправить'}
            </button>
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

export default TopicPage;
