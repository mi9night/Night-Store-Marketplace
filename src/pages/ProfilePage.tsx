import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Award, Clock, Package,
  CheckCircle2, Edit3, Camera, X, Save, MessageSquare,
  Shield, Ban, AlertCircle, Calendar, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbToAccount } from '../lib/db';
import { RoleBadge } from '../components/ModerationPanel';
import { LevelBadge } from '../components/LevelBadge';

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
}

interface ProfilePageProps { setCurrentPage?: (page: any) => void; }

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentPage }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'themes' | 'bans'>('products');

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

        const { data: p } = await supabase
          .from('users')
          .select('*')
          .eq('id', u.user.id)
          .maybeSingle();

        if (p) {
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
        const [accRes, revRes, topRes, banRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('seller_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').eq('target_user_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('forum_topics').select('*').eq('author_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('bans').select('*').eq('user_id', u.user.id).order('created_at', { ascending: false }),
        ]);

        setAccounts(accRes.data || []);
        setReviews(revRes.data || []);
        setTopics(topRes.data || []);
        setBans(banRes.data || []);
      } catch (e) {
        console.warn('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const stats = [
    { label: 'Покупок',  value: profile?.purchases || 0,     icon: ShoppingCart, color: 'text-blue-400' },
    { label: 'Продаж',   value: profile?.sales || 0,         icon: Package,      color: 'text-green-400' },
    { label: 'Рейтинг',  value: (Number(profile?.rating) || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
    { label: 'XP',       value: profile?.xp || 0,            icon: Award,        color: 'text-purple-400' },
  ];

  const activeBan = bans.find(b => b.is_active && (!b.ends_at || new Date(b.ends_at) > new Date()));

  return (
    <div className="max-w-4xl mx-auto space-y-5">

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
          <div className="-mt-12 mb-3 flex items-end justify-between gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center border-4 border-[#171425] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
              <button
                onClick={() => avatarInput.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
              >
                <Camera size={12} className="text-white" />
              </button>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171425]" />
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload('avatar', e.target.files[0])}
              />
            </div>

            {/* Баланс справа от аватарки */}
            <div className="text-right">
              <p className="text-xs text-text-secondary">Баланс</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-300">
                {(profile?.balance || 0).toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>

          {/* Имя + инфа — отдельным блоком ПОД аватаром */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              {profile?.verified && <CheckCircle2 size={18} className="text-blue-400" />}
              <RoleBadge role={profile?.role} />
              <LevelBadge level={profile?.level || 1} />
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
            { id: 'products', label: 'Товары', icon: Package, count: accounts.length },
            { id: 'reviews',  label: 'Отзывы', icon: Star,    count: reviews.length },
            { id: 'themes',   label: 'Темы',   icon: MessageSquare, count: topics.length },
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
                    className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-3 hover:border-purple-700/40 transition-all"
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
                {reviews.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4"
                  >
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
                      <span className="text-xs text-text-secondary ml-auto">
                        {new Date(r.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {r.text && <p className="text-sm text-white">{r.text}</p>}
                  </motion.div>
                ))}
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

export default ProfilePage;
