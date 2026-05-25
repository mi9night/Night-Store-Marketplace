import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Award, Clock, Package,
  CheckCircle2, Edit3, Camera, X, Save, MessageSquare,
  Shield, Ban, AlertCircle, Calendar, User
, ThumbsUp, ThumbsDown , Image , Trash2 , Sparkles , Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import { RoleBadge } from '../components/RoleBadge';
import { LevelBadge } from '../components/LevelBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import { UserLink } from '../components/UserLink';
import LabelManager from '../components/LabelManager';
import ReportButton from '../components/ReportButton';

interface UserData {
  id: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  balance?: number;
  level?: number;
  role?: string;
  verified?: boolean;
  sales?: number;
  purchases?: number;
  positive_reviews?: number;
  rating?: number;
  xp?: number;
  forum_activity_xp?: number;
  created_at?: string;
  discord_id?: string;
  discord_username?: string;
  discord_avatar?: string;
  discord_verified?: boolean;
  custom_id?: string;
  hide_balance?: boolean;
  hide_email?: boolean;
}

interface ProfilePageProps {
  setCurrentPage?: (page: any) => void;
  onOpenTopic?: (id: string) => void;
  onOpenAccount?: (id: string) => void;
  viewedProfileId?: string | null;
  onResetView?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentPage, onOpenTopic, onOpenAccount, viewedProfileId, onResetView }) => {
  const isOwnProfile = !viewedProfileId;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wall' | 'products' | 'reviews' | 'themes' | 'integrations' | 'bans'>('wall');
  const [wallComments, setWallComments] = useState<any[]>([]);
  const [wallText, setWallText] = useState('');
  const [sendingWall, setSendingWall] = useState(false);
  const [wallVotes, setWallVotes] = useState<Record<string, number>>({});
  const [wallImages, setWallImages] = useState<File[]>([]);
  const [wallReplyTo, setWallReplyTo] = useState<any>(null);
  const wallImgInput = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);

  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  /* ============ Загрузка профиля и связанных данных ============ */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          setLoading(false);
          return;
        }
        setUser(u.user);

        const targetId = viewedProfileId || u.user.id;
        const { data: p } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (p) {
          // Подгружаем массив кастомных ролей
          const { data: cr } = await supabase.from('user_custom_roles')
            .select('id, label, icon, color, description').eq('user_id', targetId);
          if (cr && cr.length > 0) (p as any).custom_roles = cr;
          setProfile(p);
          setEditBio(p.bio || '');
          setEditUsername(p.username || '');
        } else {
          // fallback из auth.user
          setProfile({
            id: u.user.id,
            email: u.user.email,
            username: u.user.email?.split('@')[0],
          });
        }

        // Параллельно — товары, отзывы, темы, баны
        const [accRes, revRes, topRes, banRes, wallRes, purchRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('seller_id', targetId).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').eq('target_user_id', targetId).order('created_at', { ascending: false }),
          supabase.from('forum_topics').select('*').eq('author_id', targetId).order('created_at', { ascending: false }),
          supabase.from('bans').select('*').eq('user_id', targetId).order('created_at', { ascending: false }),
          supabase.from('profile_comments').select('*').eq('profile_id', targetId).order('created_at', { ascending: false }),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', targetId),
        ]);

        // Реальные покупки (count из orders)
        const realPurchases = (purchRes as any)?.count || 0;
        // Реальный рейтинг — среднее по reviews
        const revList = revRes.data || [];
        let realRating = Number(p?.rating) || 0;
        if (realRating === 0 && revList.length > 0) {
          const withRating = revList.filter((r: any) => r.rating);
          if (withRating.length > 0) {
            realRating = withRating.reduce((s: number, r: any) => s + r.rating, 0) / withRating.length;
          } else {
            realRating = revList.reduce((s: number, r: any) => s + (r.positive ? 5 : 1), 0) / revList.length;
          }
        }
        if (p) {
          (p as any).purchases = realPurchases;
          (p as any).rating = realRating;
        }

        setAccounts(accRes.data || []);
        // Подгружаем авторов отзывов
        const reviewerIds = [...new Set(revList.map((r: any) => r.user_id).filter(Boolean))];
        if (reviewerIds.length > 0) {
          const { data: reviewers } = await supabase.from('users')
            .select('id, username, avatar_url, custom_id').in('id', reviewerIds);
          const rMap: Record<string, any> = {};
          reviewers?.forEach((u: any) => { rMap[u.id] = u; });
          revList.forEach((r: any) => { if (rMap[r.user_id]) r.author = rMap[r.user_id]; });
        }
        setReviews(revList);
        setTopics(topRes.data || []);
        setBans(banRes.data || []);

        // Подгружаем авторов комментариев и голоса
        const wc = wallRes.data || [];
        if (wc.length > 0) {
          const authorIds = [...new Set(wc.map((c: any) => c.author_id).filter(Boolean))];
          const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds);
          const aMap: Record<string, any> = {};
          authors?.forEach((a: any) => { aMap[a.id] = a; });
          setWallComments(wc.map((c: any) => ({ ...c, author: aMap[c.author_id] })));

          // Мои голоса
          const ids = wc.map((c: any) => c.id);
          const { data: votes } = await supabase.from('forum_likes')
            .select('target_id, vote')
            .eq('user_id', u.user.id)
            .eq('target_type', 'profile_comment')
            .in('target_id', ids);
          const vMap: Record<string, number> = {};
          votes?.forEach((v: any) => { vMap[v.target_id] = v.vote; });
          setWallVotes(vMap);
        } else {
          setWallComments([]);
        }
      } catch (e) {
        console.warn('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewedProfileId]);

  // Realtime для wall
  useEffect(() => {
    if (!user?.id) return;
    const targetId = viewedProfileId || user.id;
    const ch = supabase.channel('profile_wall_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profile_comments', filter: `profile_id=eq.${targetId}` },
        async () => {
          const { data } = await supabase.auth.getUser();
          if (!data.user) return;
          const { data: wc } = await supabase.from('profile_comments').select('*').eq('profile_id', targetId).order('created_at', { ascending: false });
          if (wc) {
            const authorIds = [...new Set(wc.map((c: any) => c.author_id).filter(Boolean))];
            const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds);
            const aMap: Record<string, any> = {};
            authors?.forEach((a: any) => { aMap[a.id] = a; });
            setWallComments(wc.map((c: any) => ({ ...c, author: aMap[c.author_id] })));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, viewedProfileId]);

  // Realtime синк профиля (баланс, аватарка обновляются мгновенно)
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase.channel('profile_sync')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        async () => {
          const { data: p } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
          if (p) setProfile(p);
        }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const sendWall = async () => {
    if ((!wallText.trim() && wallImages.length === 0) || !user) return;
    const targetId = viewedProfileId || user.id;
    setSendingWall(true);
    try {
      // Загрузка фото
      const urls: string[] = [];
      for (const f of wallImages) {
        const ext = f.name.split('.').pop() || 'png';
        const path = `${user.id}/wall-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('forum').upload(path, f);
        if (!upErr) {
          const { data } = supabase.storage.from('forum').getPublicUrl(path);
          urls.push(data.publicUrl);
        }
      }
      await supabase.from('profile_comments').insert({
        profile_id: targetId, author_id: user.id, content: wallText.trim(),
        parent_id: wallReplyTo?.id || null,
        images: urls,
      });
      setWallText(''); setWallImages([]); setWallReplyTo(null);

      // Уведомление владельцу стены
      if (targetId !== user.id) {
        const { data: me } = await supabase.from('users').select('username').eq('id', user.id).maybeSingle();
        await supabase.from('notifications').insert({
          user_id: targetId, type: 'message',
          title: '💬 Новое сообщение на стене',
          text: `${me?.username || 'Кто-то'}: ${wallText.trim().slice(0, 60)}`,
          icon: '💬', link_type: 'profile',
        });
      }
    } finally { setSendingWall(false); }
  };

  const voteWall = async (commentId: string, v: 1 | -1) => {
    setWallVotes(p => {
      const c = { ...p };
      if (c[commentId] === v) delete c[commentId]; else c[commentId] = v;
      return c;
    });
    await supabase.rpc('toggle_forum_vote', {
      p_target_type: 'profile_comment', p_target_id: commentId, p_vote: v,
    });
  };

  /* ============ Загрузка аватарки/баннера ============ */
  const handleUpload = async (type: 'avatar' | 'banner', file: File) => {
    if (!user) return;
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
      await supabase.from('users').update({ [updateField]: publicUrl }).eq('id', user.id);

      setProfile(prev => prev ? { ...prev, [updateField]: publicUrl } : prev);
    } catch (e: any) {
      alert('Ошибка загрузки: ' + e.message);
    }
  };

  /* ============ Сохранение редактирования ============ */
  const handleSaveEdit = async () => {
    if (!user) return;
    setEditMsg(null);
    setEditSaving(true);
    try {
      // Bio — обычным update
      await supabase.from('users').update({ bio: editBio }).eq('id', user.id);

      // Username — через RPC (с 7-дневным лимитом), только если изменён
      if (editUsername && editUsername !== profile?.username) {
        const { data, error } = await supabase.rpc('update_username', { new_username: editUsername });
        if (error) throw error;
        if (data === 'too_soon') {
          setEditMsg('⚠️ Никнейм можно менять раз в 7 дней');
          setEditSaving(false);
          return;
        }
      }

      setProfile(prev => prev ? { ...prev, bio: editBio, username: editUsername } : prev);
      setEditMsg('✅ Сохранено');
      setTimeout(() => setShowEdit(false), 1000);
    } catch (e: any) {
      setEditMsg('⚠️ ' + e.message);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-secondary">Загрузка профиля...</div>;
  }

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';
  const registeredDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
    : '—';

  // Расчёт LVL по xp (как в шкале)
  const xpVal = profile?.xp || 0;
  const lvlVal = Math.floor(Math.sqrt(xpVal / 50)) + 1;

  const stats = [
    { label: 'Покупок',  value: profile?.purchases || 0,     icon: ShoppingCart, color: 'text-blue-400' },
    { label: 'Продаж',   value: profile?.sales || 0,         icon: Package,      color: 'text-green-400' },
    { label: 'Рейтинг',  value: (Number(profile?.rating) || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
    { label: 'XP',       value: xpVal,                       icon: Award,        color: 'text-purple-400' },
  ];

  const activeBan = bans.find(b => b.is_active && (!b.ends_at || new Date(b.ends_at) > new Date()));

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {!isOwnProfile && (
        <button onClick={() => onResetView?.()}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
          ← Назад к своему профилю
        </button>
      )}

      {/* === Header профиля === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden"
      >
        {/* Banner */}
        <div
          className="h-32 sm:h-40 relative bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center"
          style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
        >
          <div className="absolute top-3 right-3 flex gap-2">
            {isOwnProfile && (
              <>
                <motion.button
                  onClick={() => bannerInput.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-xs text-white hover:bg-black/70 transition-colors border border-purple-900/40"
                >
                  <Camera size={12} />
                  Сменить баннер
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage ? setCurrentPage('settings') : setShowEdit(true)}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-xs text-white hover:bg-black/70 transition-colors border border-purple-900/40"
                >
                  <Edit3 size={12} />
                  Редактировать
                </motion.button>
              </>
            )}
          </div>
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Аватарка отдельно — наполовину в баннер, наполовину под ним */}
          <div className="-mt-12 mb-3">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center border-4 border-[#171425] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInput.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
                >
                  <Camera size={12} className="text-white" />
                </button>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171425]" />
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload('avatar', e.target.files[0])}
              />
            </div>
          </div>

          {/* Имя + бейджи (слева) + Баланс (справа) — одной строкой */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                {profile?.verified && <VerifiedBadge type="verified" size={18} />}
                {profile?.discord_verified && <VerifiedBadge type="discord" size={18} discordName={profile?.discord_username} />}
                <RoleBadge user={profile} />
                <LevelBadge level={profile?.level || 1} />
                {/* XP-уровень (LVL по xp) */}
                {(() => {
                  const xp = profile?.xp || 0;
                  const lv = Math.floor(Math.sqrt(xp / 50)) + 1;
                  return (
                    <BadgeTooltip text={'✨ LVL ' + lv + '\n' + xp + ' XP · уровень активности'}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border bg-pink-900/30 text-pink-300 border-pink-700/40 shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                        ✨ LVL {lv}
                      </span>
                    </BadgeTooltip>
                  );
                })()}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-text-secondary">
                <span>ID: {profile?.custom_id || profile?.id?.slice(0, 8)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> С {registeredDate}
                </span>
                <span>•</span>
                <span className="text-green-400">Онлайн</span>
              </div>
              {profile?.bio && (
                <p className="text-sm text-text-secondary mt-2 italic line-clamp-2">"{profile.bio}"</p>
              )}
            </div>

            {/* Баланс — только для своего профиля или если не скрыт */}
            {(isOwnProfile || !profile?.hide_balance) && (
              <div className="text-left sm:text-right flex-shrink-0">
                <p className="text-xs text-text-secondary">Баланс</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-300">
                  {(profile?.balance || 0).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            )}

            {/* Кнопка ЛС для чужого профиля */}
            {!isOwnProfile && user && profile && user.id !== profile.id && (
              <button onClick={async () => {
                const msg = prompt('Сообщение для ' + (profile.username || 'пользователя') + ':');
                if (msg && msg.trim()) {
                  await supabase.from('messages').insert({
                    sender_id: user.id, receiver_id: profile.id, text: msg.trim(), is_read: false,
                  });
                  alert('✅ Отправлено!');
                }
              }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex-shrink-0">
                <MessageSquare size={14} /> Написать
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#0B0A12] rounded-xl p-4 border border-purple-900/20 text-center"
              >
                <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* === Шкалы прогресса === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Шкала продаж (уровень продавца) */}
            {(() => {
              const sales = profile?.sales || 0;
              const tiers = [
                { id: 1, label: 'Новичок',   icon: '⭐', min: 0,    max: 50,   color: 'from-gray-500 to-gray-400',   glow: '' },
                { id: 2, label: 'Бронза',    icon: '🥉', min: 50,   max: 200,  color: 'from-amber-700 to-amber-500',  glow: 'shadow-[0_0_15px_rgba(217,119,6,0.4)]' },
                { id: 3, label: 'Серебро',   icon: '🏅', min: 200,  max: 500,  color: 'from-gray-400 to-gray-200',   glow: 'shadow-[0_0_15px_rgba(209,213,219,0.5)]' },
                { id: 4, label: 'Золото',    icon: '🌟', min: 500,  max: 1000, color: 'from-yellow-500 to-yellow-300', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]' },
                { id: 5, label: 'Платина',   icon: '💎', min: 1000, max: 2500, color: 'from-cyan-500 to-cyan-300',    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.65)]' },
                { id: 6, label: 'Бриллиант', icon: '👑', min: 2500, max: 10000, color: 'from-purple-500 to-pink-400',  glow: 'shadow-[0_0_25px_rgba(168,85,247,0.75)]' },
              ];
              const cur = [...tiers].reverse().find(t => sales >= t.min);
              const idx = cur ? tiers.indexOf(cur) : 0;
              const tier = cur || tiers[0];
              const next = tiers[idx + 1];
              const pct = next ? Math.min(100, ((sales - tier.min) / (next.min - tier.min)) * 100) : 100;
              return (
                <div className="bg-[#0B0A12] rounded-xl p-4 border border-purple-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tier.icon}</span>
                      <span className="text-sm font-semibold text-white">Уровень: {tier.label}</span>
                    </div>
                    {next && (
                      <span className="text-xs text-text-secondary">
                        До {next.label}: {next.min - sales}
                      </span>
                    )}
                  </div>
                  <div className="h-2.5 bg-purple-900/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className={`h-full bg-gradient-to-r ${tier.color} ${tier.glow}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-secondary">{tier.label} ({sales} продаж)</span>
                    {next && <span className="text-[10px] text-text-secondary">{next.label} ({next.min}+)</span>}
                  </div>
                </div>
              );
            })()}

            {/* Шкала XP (lvl) */}
            {(() => {
              const xp = profile?.xp || 0;
              // Простая формула: каждый уровень требует level*100 XP
              const lvl = Math.floor(Math.sqrt(xp / 50)) + 1;
              const xpForCurrentLvl = (lvl - 1) * (lvl - 1) * 50;
              const xpForNextLvl = lvl * lvl * 50;
              const pct = Math.min(100, ((xp - xpForCurrentLvl) / (xpForNextLvl - xpForCurrentLvl)) * 100);
              const glow = lvl >= 50 ? 'shadow-[0_0_25px_rgba(236,72,153,0.7)]'
                         : lvl >= 30 ? 'shadow-[0_0_20px_rgba(168,85,247,0.6)]'
                         : lvl >= 15 ? 'shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                         : lvl >= 5  ? 'shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                         : '';
              const lvlIcon = lvl >= 50 ? '🌌' : lvl >= 30 ? '👑' : lvl >= 15 ? '💎' : lvl >= 5 ? '🌟' : '✨';
              const lvlColor = lvl >= 50 ? 'from-pink-500 via-purple-500 to-indigo-500'
                             : lvl >= 30 ? 'from-purple-500 to-pink-400'
                             : lvl >= 15 ? 'from-indigo-500 to-purple-400'
                             : lvl >= 5  ? 'from-green-500 to-emerald-400'
                             : 'from-purple-700 to-purple-500';
              return (
                <div className="bg-[#0B0A12] rounded-xl p-4 border border-purple-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xl ${lvl >= 30 ? 'animate-pulse' : ''}`}>{lvlIcon}</span>
                      <span className="text-sm font-semibold text-white">LVL {lvl}</span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {xp} / {xpForNextLvl} XP
                    </span>
                  </div>
                  <div className="h-2.5 bg-purple-900/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, delay: 0.4 }}
                      className={`h-full bg-gradient-to-r ${lvlColor} ${glow}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-secondary">LVL {lvl}</span>
                    <span className="text-[10px] text-text-secondary">До LVL {lvl + 1}: {xpForNextLvl - xp} XP</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Активный бан — предупреждение */}
          {activeBan && (
            <div className="mt-4 bg-red-900/20 border border-red-800/40 rounded-xl p-4 flex items-start gap-3">
              <Ban size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400">Активная блокировка</p>
                <p className="text-xs text-text-secondary mt-1">
                  Причина: {activeBan.reason}
                  {activeBan.ends_at && ` · до ${new Date(activeBan.ends_at).toLocaleString('ru-RU')}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* === Табы === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden"
      >
        <div className="flex border-b border-purple-900/20 overflow-x-auto">
          {[
            { id: 'wall',     label: 'Стена', icon: MessageSquare, count: wallComments.length },
            { id: 'products', label: 'Товары', icon: Package, count: accounts.length },
            { id: 'reviews',  label: 'Отзывы', icon: Star,    count: reviews.length },
            { id: 'themes',   label: 'Темы',   icon: MessageSquare, count: topics.length },
            { id: 'integrations', label: 'Интеграции', icon: Link2, count: (profile?.discord_id ? 1 : 0) },
            { id: 'bans',     label: 'История блокировок', icon: Shield, count: bans.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/10'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              <span className="text-xs bg-purple-900/30 px-2 py-0.5 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* === Стена / комментарии === */}
          {activeTab === 'wall' && (
            <div className="space-y-3">
              {/* Форма */}
              <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3">
                {wallReplyTo && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-purple-900/20 rounded-lg text-xs">
                    <span className="text-purple-300">↳ Ответ для {wallReplyTo.author?.username || 'Аноним'}</span>
                    <button onClick={() => setWallReplyTo(null)} className="ml-auto text-text-secondary hover:text-white">✕</button>
                  </div>
                )}
                <textarea value={wallText} onChange={e => setWallText(e.target.value)}
                  placeholder={wallReplyTo ? 'Ответ...' : 'Оставьте сообщение на стене...'}
                  rows={2}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[#171425] border border-purple-900/30 text-white text-sm resize-none" />

                {wallImages.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {wallImages.map((f, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-900/30">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setWallImages(wallImages.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 text-[10px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button onClick={() => wallImgInput.current?.click()} disabled={wallImages.length >= 4}
                    className="p-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg disabled:opacity-50"
                    title="Фото (макс 4)">
                    <Image size={14} />
                  </button>
                  <input ref={wallImgInput} type="file" multiple accept="image/*" className="hidden"
                    onChange={e => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 4 - wallImages.length);
                        setWallImages([...wallImages, ...files]);
                      }
                    }} />
                  <span className="text-[10px] text-text-secondary">{wallImages.length}/4</span>
                  <button onClick={sendWall} disabled={sendingWall || (!wallText.trim() && wallImages.length === 0)}
                    className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                    {sendingWall ? 'Отправка...' : (wallReplyTo ? 'Ответить' : 'Опубликовать')}
                  </button>
                </div>
              </div>

              {wallComments.length === 0 ? (
                <div className="text-center py-8 text-text-secondary text-sm">Стена пуста</div>
              ) : wallComments.filter((c: any) => !c.parent_id).map((wc: any) => {
                const replies = wallComments.filter((r: any) => r.parent_id === wc.id);
                const isMine = wc.author_id === user?.id;
                const isOwner = !viewedProfileId;
                const isMod = ['moderator','admin','owner'].includes(profile?.role || '');
                const canDel = isMine || isOwner || isMod;
                const handleDel = async (id: string) => {
                  if (!confirm('Удалить комментарий?')) return;
                  await supabase.from('profile_comments').delete().eq('id', id);
                  setWallComments(prev => prev.filter((c: any) => c.id !== id && c.parent_id !== id));
                };
                return <WallItem key={wc.id} c={{...wc, is_mine: isMine}} replies={replies}
                  myVotes={wallVotes} onVote={voteWall} onReply={setWallReplyTo}
                  onDelete={handleDel} canDelete={canDel} />;
              })}
            </div>
          )}

          {/* === Товары === */}
          {activeTab === 'products' && (
            accounts.length === 0 ? (
              <div className="text-center py-12">
                <Package size={40} className="mx-auto text-purple-700/50 mb-3" />
                <p className="text-text-secondary text-sm">Вы пока ничего не продаёте</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onOpenAccount?.(a.id)}
                    className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 hover:border-purple-700/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full font-semibold">
                        {a.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        a.status === 'sold' ? 'bg-gray-900/40 text-gray-400' :
                        'bg-green-900/40 text-green-400'
                      }`}>
                        {a.status === 'sold' ? 'Продан' : 'Активен'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white line-clamp-2 mb-2">{a.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-300">{a.price?.toLocaleString('ru-RU')} ₽</span>
                      <span className="text-xs text-text-secondary">
                        {new Date(a.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* === Отзывы === */}
          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star size={40} className="mx-auto text-purple-700/50 mb-3" />
                <p className="text-text-secondary text-sm">Пока нет отзывов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => {
                  const isMod = ['moderator','admin','owner'].includes(profile?.role || '');
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`border rounded-xl p-4 ${
                        r.positive
                          ? 'bg-green-900/10 border-green-700/30'
                          : 'bg-red-900/10 border-red-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {r.author?.avatar_url ? (
                            <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{(r.author?.username?.[0] || 'U').toUpperCase()}</span>
                          )}
                        </div>
                        <UserLink userId={r.author?.id || r.user_id} username={r.author?.username || 'Аноним'} className="text-sm font-semibold text-white" />
                        {r.author?.custom_id && (
                          <span className="text-[10px] text-purple-300 font-mono">#{r.author.custom_id}</span>
                        )}
                        <span className="text-xs text-text-secondary ml-auto">
                          {new Date(r.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          r.positive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}>
                          {r.positive ? '👍 Положительный' : '👎 Отрицательный'}
                        </span>
                        {r.rating && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} size={11} className={idx < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                            ))}
                          </div>
                        )}
                      </div>
                      {r.text && <p className="text-sm text-white mb-2">{r.text}</p>}

                      <div className="flex items-center gap-1 pt-2 border-t border-purple-900/20">
                        <ReportButton targetType="comment" targetId={r.id} targetName={'Отзыв: ' + (r.text || '').slice(0, 40)} />
                        {isMod && (
                          <button onClick={async () => {
                            if (!confirm('Удалить отзыв?')) return;
                            await supabase.from('reviews').delete().eq('id', r.id);
                            setReviews(prev => prev.filter(rv => rv.id !== r.id));
                          }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold ml-auto">
                            <Trash2 size={11} /> Удалить
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}

          {/* === Темы форума === */}
          {activeTab === 'themes' && (
            topics.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={40} className="mx-auto text-purple-700/50 mb-3" />
                <p className="text-text-secondary text-sm">Вы пока не создавали тем</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onOpenTopic?.(t.id)}
                    className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-900/40 text-purple-300">
                        {t.category}
                      </span>
                      <span className="text-xs text-text-secondary ml-auto">
                        {new Date(t.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{t.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span>💬 {t.replies || 0}</span>
                      <span>👁 {t.views || 0}</span>
                      <span>👍 {t.likes || 0}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* === История блокировок === */}
          {/* === Интеграции пользователя === */}
          {activeTab === 'integrations' && (
            <div className="space-y-3">
              {profile?.discord_id ? (
                <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {/* Дискорд лого */}
                    <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center text-2xl flex-shrink-0">
                      💬
                    </div>
                    {/* Аватарка из Discord */}
                    {profile.discord_avatar && (
                      <img src={profile.discord_avatar} alt="" className="w-12 h-12 rounded-xl" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {profile.discord_username}
                        </p>
                        <VerifiedBadge type="discord" size={14} discordName={profile.discord_username} />
                      </div>
                      <p className="text-xs text-text-secondary font-mono truncate">@{profile.discord_username}</p>
                      <p className="text-[10px] text-text-secondary">ID: {profile.discord_id}</p>
                    </div>
                    {/* Кнопка написать */}
                    <a href={`https://discord.com/users/${profile.discord_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg text-xs font-semibold whitespace-nowrap">
                      <MessageSquare size={12} /> Написать
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Link2 size={40} className="mx-auto text-purple-700/50 mb-3" />
                  <p className="text-text-secondary text-sm">
                    {isOwnProfile
                      ? 'Вы пока не привязали ни одну интеграцию'
                      : 'У пользователя пока нет привязанных интеграций'}
                  </p>
                  {isOwnProfile && (
                    <button onClick={() => setCurrentPage?.('settings')}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
                      Перейти в Настройки → Интеграции
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bans' && (
            bans.length === 0 ? (
              <div className="text-center py-12">
                <Shield size={40} className="mx-auto text-green-500/50 mb-3" />
                <p className="text-text-secondary text-sm">Чистая история — блокировок нет ✨</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bans.map((b, i) => {
                  const isActive = b.is_active && (!b.ends_at || new Date(b.ends_at) > new Date());
                  const duration = b.duration_hours
                    ? b.duration_hours < 24
                      ? `${b.duration_hours} ч`
                      : `${Math.round(b.duration_hours / 24)} дн`
                    : 'навсегда';

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`border rounded-xl p-4 ${
                        isActive
                          ? 'bg-red-900/10 border-red-800/40'
                          : 'bg-[#0B0A12] border-purple-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {b.type === 'mute' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 font-semibold">🔇 Мут</span>
                          ) : b.type === 'warn' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-400 font-semibold">⚠️ Предупреждение</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-semibold">🚫 Бан</span>
                          )}
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-semibold animate-pulse">
                              АКТИВЕН
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary">
                          {new Date(b.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex gap-2">
                          <span className="text-text-secondary min-w-[80px]">Причина:</span>
                          <span className="text-white">{b.reason}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-text-secondary min-w-[80px]">Срок:</span>
                          <span className="text-white">{duration}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-text-secondary min-w-[80px]">Выдал:</span>
                          <span className="text-white">{b.moderator_name || 'Модератор'}</span>
                        </div>
                        {b.ends_at && (
                          <div className="flex gap-2">
                            <span className="text-text-secondary min-w-[80px]">До:</span>
                            <span className="text-white">{new Date(b.ends_at).toLocaleString('ru-RU')}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* === Модалка редактирования === */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => !editSaving && setShowEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#171425] border border-purple-900/30 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Редактировать профиль</h2>
                <button onClick={() => setShowEdit(false)} className="text-text-secondary hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <label className="text-sm text-text-secondary mb-1.5 block">Никнейм</label>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white mb-1"
              />
              <p className="text-xs text-text-secondary mb-3">💡 Менять можно раз в 7 дней</p>

              <label className="text-sm text-text-secondary mb-1.5 block">О себе</label>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                rows={4}
                placeholder="Расскажите о себе..."
                className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0A12] border border-purple-900/30 text-white resize-none mb-3"
              />

              {editMsg && (
                <div className={`text-sm mb-3 p-2 rounded-lg ${
                  editMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}>
                  {editMsg}
                </div>
              )}

              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {editSaving ? 'Сохранение...' : <><Save size={16} /> Сохранить</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WallItem: React.FC<{
  c: any; replies: any[]; myVotes: Record<string, number>;
  onVote: (id: string, v: 1 | -1) => void; onReply: (c: any) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  depth?: number;
}> = ({ c, replies, myVotes, onVote, onReply, onDelete, canDelete, depth = 0 }) => {
  const v = myVotes[c.id];
  return (
    <div className={`bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 ${depth > 0 ? 'ml-6 border-l-2 border-l-purple-700/40' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
          {c.author?.avatar_url ? (
            <img src={c.author.avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-xs font-bold text-white">{(c.author?.username?.[0] || 'U').toUpperCase()}</span>
          )}
        </div>
        <span className="text-sm font-semibold text-white">{c.author?.username || 'Аноним'}</span>
        <span className="text-xs text-text-secondary ml-auto">{new Date(c.created_at).toLocaleString('ru-RU')}</span>
      </div>
      {c.content && <p className="text-sm text-white whitespace-pre-wrap mb-2">{c.content}</p>}

      {c.images && c.images.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {c.images.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-purple-900/30 hover:border-purple-700/50" />
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => onVote(c.id, 1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            v === 1 ? 'bg-green-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-green-400'
          }`}>
          <ThumbsUp size={11} /> {c.likes || 0}
        </button>
        <button onClick={() => onVote(c.id, -1)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
            v === -1 ? 'bg-red-600 text-white' : 'bg-purple-900/20 text-text-secondary hover:text-red-400'
          }`}>
          <ThumbsDown size={11} /> {c.dislikes || 0}
        </button>
        {depth < 3 && (
          <button onClick={() => onReply(c)}
            className="px-2 py-1 rounded-lg text-xs bg-purple-900/20 text-text-secondary hover:text-purple-300">
            ↳ Ответить
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ReportButton targetType="profile_comment" targetId={c.id} targetName={'Коммент на стене: ' + (c.content || '').slice(0, 40)} />
          {(canDelete || (c.is_mine)) && onDelete && (
            <button onClick={() => onDelete(c.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold">
              <Trash2 size={11} /> Удалить
            </button>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map(r => (
            <WallItem key={r.id} c={r} replies={[]} myVotes={myVotes} onVote={onVote} onReply={onReply}
              onDelete={onDelete} canDelete={canDelete}
              depth={Math.min(depth + 1, 3)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
