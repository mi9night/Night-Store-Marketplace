// src/components/UserProfileModal.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, ShoppingCart, Package, Award, MessageSquare,
  CheckCircle2, Calendar, Send, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';
import { RoleBadge } from './RoleBadge';
import { LevelBadge } from './LevelBadge';

const UserProfileModal: React.FC = () => {
  const { viewedUserId, closeUser, goToFullProfile } = useUserNav();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ accounts: 0, topics: 0, reviews: 0 });
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

      const [p, aCnt, tCnt, rCnt] = await Promise.all([
        supabase.from('users').select('*').eq('id', viewedUserId).maybeSingle(),
        supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('seller_id', viewedUserId),
        supabase.from('forum_topics').select('id', { count: 'exact', head: true }).eq('author_id', viewedUserId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('target_user_id', viewedUserId),
      ]);

      setProfile(p.data);
      setStats({
        accounts: aCnt.count || 0,
        topics:   tCnt.count || 0,
        reviews:  rCnt.count || 0,
      });
      setLoading(false);
    };
    load();
  }, [viewedUserId]);

  const sendMessage = async () => {
    if (!chatMsg.trim() || !me || !profile) return;
    await supabase.from('messages').insert({
      sender_id: me.id, receiver_id: profile.id, text: chatMsg, is_read: false,
    });
    setChatMsg('');
    setShowChat(false);
    alert('✅ Сообщение отправлено!');
  };

  if (!viewedUserId) return null;

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';
  const showBalance = profile && !profile.hide_balance;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4"
        onClick={closeUser}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#171425] border border-purple-900/30 rounded-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header / Banner */}
          <div
            className="h-20 relative bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center"
            style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
          >
            <button onClick={closeUser} className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-black/70">
              <X size={16} />
            </button>
          </div>

          <div className="px-4 pb-4">
            {/* Avatar overlap */}
            <div className="-mt-8 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center border-4 border-[#171425] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-6 text-text-secondary text-sm">Загрузка...</div>
            ) : !profile ? (
              <div className="text-center py-6 text-text-secondary text-sm">Пользователь не найден</div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <h2 className="text-lg font-bold text-white">{displayName}</h2>
                  {profile.verified && <CheckCircle2 size={14} className="text-blue-400" />}
                  <RoleBadge user={profile} />
                  <LevelBadge level={profile.level || 1} compact />
                </div>

                <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap mb-3">
                  <span className="font-mono text-purple-300">#{profile.custom_id || profile.id?.slice(0, 8)}</span>
                  {profile.created_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar size={10} /> {new Date(profile.created_at).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-xs text-text-secondary italic mb-3 line-clamp-2">"{profile.bio}"</p>
                )}

                {/* Компактные статы */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[
                    { label: 'Продаж',   value: profile.sales || 0,                 icon: Package },
                    { label: 'Товаров',  value: stats.accounts,                     icon: ShoppingCart },
                    { label: 'Тем',      value: stats.topics,                       icon: MessageSquare },
                    { label: 'Рейтинг',  value: (Number(profile.rating) || 0).toFixed(1), icon: Star },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0B0A12] rounded-lg p-2 text-center border border-purple-900/20">
                      <s.icon size={11} className="text-purple-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-white">{s.value}</p>
                      <p className="text-[9px] text-text-secondary">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Кнопки */}
                <div className="flex gap-2 mb-2">
                  <button onClick={() => goToFullProfile(profile.id)}
                    className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold">
                    <ExternalLink size={12} /> Открыть профиль
                  </button>
                  {me && me.id !== profile.id && (
                    <button onClick={() => setShowChat(true)}
                      className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-white rounded-xl text-xs font-semibold">
                      <MessageSquare size={12} /> Написать
                    </button>
                  )}
                </div>

                {showChat && (
                  <div className="mt-2 bg-[#0B0A12] border border-purple-900/30 rounded-xl p-2">
                    <textarea value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                      placeholder="Сообщение..." rows={2}
                      className="w-full px-2 py-1.5 mb-1.5 rounded-md text-xs bg-[#171425] border border-purple-900/30 text-white resize-none" />
                    <div className="flex gap-1.5">
                      <button onClick={() => setShowChat(false)} className="flex-1 py-1.5 bg-purple-900/20 text-white rounded-md text-[11px]">Отмена</button>
                      <button onClick={sendMessage} disabled={!chatMsg.trim()}
                        className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[11px] flex items-center justify-center gap-1 disabled:opacity-50">
                        <Send size={10} /> Отправить
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
