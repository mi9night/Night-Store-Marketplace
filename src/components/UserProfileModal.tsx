// src/components/UserProfileModal.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, ShoppingCart, Package, Award, MessageSquare,
  CheckCircle2, Calendar, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';

const UserProfileModal: React.FC = () => {
  const { viewedUserId, closeUser } = useUserNav();
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (!viewedUserId) return;
    const load = async () => {
      setLoading(true);
      setShowChat(false);
      setChatMsg('');

      const { data: u } = await supabase.auth.getUser();
      setMe(u.user);

      const [p, a, t, r] = await Promise.all([
        supabase.from('users').select('*').eq('id', viewedUserId).maybeSingle(),
        supabase.from('accounts').select('id, title, price, category, status, created_at').eq('seller_id', viewedUserId).order('created_at', { ascending: false }).limit(10),
        supabase.from('forum_topics').select('id, title, category, views, likes, replies, created_at').eq('author_id', viewedUserId).order('created_at', { ascending: false }).limit(10),
        supabase.from('reviews').select('*').eq('target_user_id', viewedUserId).order('created_at', { ascending: false }).limit(10),
      ]);

      setProfile(p.data);
      setAccounts(a.data || []);
      setTopics(t.data || []);
      setReviews(r.data || []);
      setLoading(false);
    };
    load();
  }, [viewedUserId]);

  const sendMessage = async () => {
    if (!chatMsg.trim() || !me || !profile) return;
    await supabase.from('messages').insert({
      sender_id: me.id,
      receiver_id: profile.id,
      text: chatMsg,
      is_read: false,
    });
    setChatMsg('');
    setShowChat(false);
    alert('✅ Сообщение отправлено!');
  };

  if (!viewedUserId) return null;

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[110] flex items-start justify-center p-4 pt-10 overflow-y-auto"
        onClick={closeUser}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header / Banner */}
          <div
            className="h-28 relative bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center"
            style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
          >
            <button onClick={closeUser} className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-black/70">
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center border-4 border-[#171425] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-text-secondary">Загрузка профиля...</div>
            ) : !profile ? (
              <div className="text-center py-8 text-text-secondary">Пользователь не найден</div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white">{displayName}</h2>
                      {profile.verified && <CheckCircle2 size={16} className="text-blue-400" />}
                      <RoleBadge role={profile.role} />
                      <LevelBadge level={profile.level || 1} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary flex-wrap">
                      <span className="font-mono text-purple-300">#{profile.custom_id || profile.id?.slice(0, 8)}</span>
                      {profile.created_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> С {new Date(profile.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-text-secondary italic mb-3">"{profile.bio}"</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Продаж',   value: profile.sales || 0,    icon: Package,      color: 'text-green-400' },
                    { label: 'Рейтинг',  value: (Number(profile.rating) || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
                    { label: 'Отзывов',  value: profile.positive_reviews || 0, icon: ShoppingCart, color: 'text-blue-400' },
                    { label: 'XP',       value: profile.xp || 0,       icon: Award,        color: 'text-purple-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0B0A12] rounded-xl p-2.5 border border-purple-900/20 text-center">
                      <s.icon size={14} className={`${s.color} mx-auto mb-1`} />
                      <p className="text-sm font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-text-secondary">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Кнопка сообщения */}
                {me && me.id !== profile.id && (
                  !showChat ? (
                    <button onClick={() => setShowChat(true)}
                      className="w-full py-2.5 mb-4 flex items-center justify-center gap-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-white rounded-xl text-sm font-medium">
                      <MessageSquare size={14} /> Написать
                    </button>
                  ) : (
                    <div className="mb-4 bg-[#0B0A12] border border-purple-900/30 rounded-xl p-3">
                      <textarea value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                        placeholder="Сообщение..."
                        rows={2}
                        className="w-full px-3 py-2 mb-2 rounded-lg text-sm bg-[#171425] border border-purple-900/30 text-white resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowChat(false)} className="flex-1 py-2 bg-purple-900/20 text-white rounded-lg text-xs">Отмена</button>
                        <button onClick={sendMessage} disabled={!chatMsg.trim()}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                          <Send size={11} /> Отправить
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Товары + Темы + Отзывы (компактно) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Товары */}
                  <div className="bg-[#0B0A12] rounded-xl p-3 border border-purple-900/20">
                    <h4 className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                      <Package size={11} /> Товары ({accounts.length})
                    </h4>
                    {accounts.length === 0 ? (
                      <p className="text-[10px] text-text-secondary">Нет</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {accounts.slice(0, 5).map(a => (
                          <div key={a.id} className="text-[11px]">
                            <p className="text-white truncate">{a.title}</p>
                            <p className="text-purple-300 font-semibold">{a.price?.toLocaleString('ru-RU')} ₽</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Темы */}
                  <div className="bg-[#0B0A12] rounded-xl p-3 border border-purple-900/20">
                    <h4 className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                      <MessageSquare size={11} /> Темы ({topics.length})
                    </h4>
                    {topics.length === 0 ? (
                      <p className="text-[10px] text-text-secondary">Нет</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {topics.slice(0, 5).map(t => (
                          <div key={t.id} className="text-[11px]">
                            <p className="text-white truncate">{t.title}</p>
                            <p className="text-text-secondary">👁 {t.views || 0} 👍 {t.likes || 0}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Отзывы */}
                  <div className="bg-[#0B0A12] rounded-xl p-3 border border-purple-900/20">
                    <h4 className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1">
                      <Star size={11} /> Отзывы ({reviews.length})
                    </h4>
                    {reviews.length === 0 ? (
                      <p className="text-[10px] text-text-secondary">Нет</p>
                    ) : (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {reviews.slice(0, 5).map(r => (
                          <div key={r.id} className="text-[11px]">
                            <span className={r.positive ? 'text-green-400' : 'text-red-400'}>
                              {r.positive ? '👍' : '👎'}
                            </span>
                            <span className="text-white ml-1 truncate">{r.text || '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
