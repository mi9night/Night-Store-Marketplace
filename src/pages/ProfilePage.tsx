import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Award, Clock, Package,
  CheckCircle2, Edit3, Camera, X, Save, MessageSquare,
  Shield, Ban, AlertCircle, Calendar, User, Image as ImageIcon, Send, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge } from '../components/RoleBadge';
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

interface ProfilePageProps {
  setCurrentPage?: (page: any) => void;
  onOpenTopic?: (id: string) => void;
  onOpenAccount?: (id: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentPage, onOpenTopic, onOpenAccount }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wall' | 'products' | 'reviews' | 'themes' | 'bans'>('wall');
  const [wallComments, setWallComments] = useState<any[]>([]);
  const [wallText, setWallText] = useState('');
  const [sendingWall, setSendingWall] = useState(false);
  const [wallVotes, setWallVotes] = useState<Record<string, number>>({});
  
  // Photo attachments for wall
  const [attachedPhotos, setAttachedPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) { setLoading(false); return; }
        setUser(u.user);

        const { data: p } = await supabase.from('users').select('*').eq('id', u.user.id).maybeSingle();
        if (p) { setProfile(p); setEditBio(p.bio || ''); setEditUsername(p.username || ''); }
        else { setProfile({ id: u.user.id, email: u.user.email, username: u.user.email?.split('@')[0] }); }

        const [accRes, revRes, topRes, banRes, wallRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('seller_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').eq('target_user_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('forum_topics').select('*').eq('author_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('bans').select('*').eq('user_id', u.user.id).order('created_at', { ascending: false }),
          supabase.from('profile_comments').select('*').eq('profile_id', u.user.id).order('created_at', { ascending: false }),
        ]);

        setAccounts(accRes.data || []);
        setReviews(revRes.data || []);
        setTopics(topRes.data || []);
        setBans(banRes.data || []);

        const wc = wallRes.data || [];
        if (wc.length > 0) {
          const authorIds = [...new Set(wc.map((c: any) => c.author_id).filter(Boolean))];
          const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds);
          const aMap: Record<string, any> = {};
          authors?.forEach((a: any) => { aMap[a.id] = a; });
          setWallComments(wc.map((c: any) => ({ ...c, author: aMap[c.author_id] })));
        } else { setWallComments([]); }
      } catch (e) { console.warn(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachedPhotos.length + files.length > 4) {
      alert('Можно добавить не более 4 фотографий');
      return;
    }
    setAttachedPhotos([...attachedPhotos, ...files]);
  };

  const removePhoto = (index: number) => {
    setAttachedPhotos(attachedPhotos.filter((_, i) => i !== index));
  };

  const sendWall = async () => {
    if ((!wallText.trim() && attachedPhotos.length === 0) || !user) return;
    setSendingWall(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload photos if any
      for (const file of attachedPhotos) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/comment-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: upData, error: upErr } = await supabase.storage.from('comments').upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('comments').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      await supabase.from('profile_comments').insert({
        profile_id: user.id,
        author_id: user.id,
        content: wallText.trim(),
        attachments: imageUrls.length > 0 ? imageUrls : null
      });
      setWallText('');
      setAttachedPhotos([]);
    } finally { setSendingWall(false); }
  };

  const handleUpload = async (type: 'avatar' | 'banner', file: File) => {
    if (!user) return;
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${type}-${Date.now()}.${ext}`;
      await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
      await supabase.from('users').update({ [field]: publicUrl }).eq('id', user.id);
      setProfile(prev => prev ? { ...prev, [field]: publicUrl } : prev);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="text-center py-20 text-text-secondary">Загрузка профиля...</div>;

  const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-40 relative bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-purple-900/60 bg-cover bg-center" style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}>
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => bannerInput.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-white hover:bg-black/60 border border-white/5 transition-all"><Camera size={12} /> БАННЕР</button>
            <button onClick={() => setCurrentPage?.('settings')} className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-white hover:bg-black/60 border border-white/5 transition-all"><Edit3 size={12} /> ИЗМЕНИТЬ</button>
          </div>
          <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('banner', e.target.files[0])} />
        </div>

        <div className="px-8 pb-8">
          <div className="-mt-12 mb-6 flex items-end justify-between">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-purple-600 border-[6px] border-[#171425] overflow-hidden shadow-2xl">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-white flex h-full items-center justify-center">{displayName[0].toUpperCase()}</span>}
              </div>
              <button onClick={() => avatarInput.current?.click()} className="absolute bottom-1 right-1 w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center border-4 border-[#171425] hover:bg-purple-500 transition-colors shadow-lg"><Camera size={14} className="text-white" /></button>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('avatar', e.target.files[0])} />
            </div>
            <div className="text-right">
               <p className="text-[10px] text-text-secondary font-black uppercase opacity-40 mb-1">Ваш баланс</p>
               <p className="text-3xl font-black text-white tracking-tighter">{(profile?.balance || 0).toLocaleString('ru-RU')} <span className="text-accent-soft">₽</span></p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{displayName}</h2>
              {profile?.verified && <CheckCircle2 size={20} className="text-blue-400" />}
              <RoleBadge role={profile?.role} />
            </div>
            <p className="text-xs text-text-secondary font-bold opacity-60 flex items-center gap-2 uppercase tracking-widest"><Calendar size={12}/> НА САЙТЕ С {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[ {label:'Покупок', val:profile?.purchases||0, icon:ShoppingCart, col:'text-blue-400'}, {label:'Продаж', val:profile?.sales||0, icon:Package, col:'text-green-400'}, {label:'Рейтинг', val:profile?.rating||0, icon:Star, col:'text-yellow-400'}, {label:'XP', val:profile?.xp||0, icon:Award, col:'text-purple-400'} ].map(s=>(
               <div key={s.label} className="bg-[#0B0A12]/60 p-4 rounded-2xl border border-purple-900/10">
                  <s.icon size={16} className={`${s.col} mb-2`}/>
                  <p className="text-lg font-black text-white">{s.val}</p>
                  <p className="text-[10px] text-text-secondary uppercase font-bold opacity-40">{s.label}</p>
               </div>
             ))}
          </div>
        </div>
      </motion.div>

      <div className="bg-[#171425] border border-purple-900/20 rounded-2xl overflow-hidden">
        <div className="flex border-b border-purple-900/10 bg-purple-900/5">
          {['wall','products','reviews','themes'].map(id=>(
            <button key={id} onClick={()=>setActiveTab(id as any)} className={`px-6 py-4 text-xs font-black uppercase transition-all border-b-2 ${activeTab===id?'border-accent text-accent-soft bg-purple-900/10':'border-transparent text-text-secondary hover:text-white'}`}>{id}</button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'wall' && (
            <div className="space-y-6">
              <div className="bg-[#0B0A12]/40 border border-purple-900/20 rounded-2xl p-5 shadow-inner">
                <textarea value={wallText} onChange={e=>setWallText(e.target.value)} placeholder="Напишите комментарий..." rows={3} className="w-full bg-transparent text-sm text-white outline-none resize-none mb-4" />
                
                {attachedPhotos.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {attachedPhotos.map((file, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-900/30 group">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        <button onClick={()=>removePhoto(i)} className="absolute top-1 right-1 bg-red-600 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="text-white"/></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-purple-900/10">
                   <div className="flex items-center gap-3">
                      <button onClick={()=>photoInputRef.current?.click()} className="p-2.5 bg-purple-900/20 text-purple-400 rounded-xl hover:bg-purple-900/40 transition-all border border-purple-900/20"><ImageIcon size={18}/></button>
                      <span className="text-[10px] font-black text-text-secondary opacity-40">{attachedPhotos.length} / 4</span>
                      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                   </div>
                   <button onClick={sendWall} disabled={sendingWall||(!wallText.trim()&&attachedPhotos.length===0)} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 uppercase tracking-tighter"><Send size={14}/> ОТПРАВИТЬ</button>
                </div>
              </div>

              <div className="space-y-4">
                {wallComments.map(wc => (
                  <div key={wc.id} className="bg-bg-card/30 border border-purple-900/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center overflow-hidden border border-purple-900/20">
                        {wc.author?.avatar_url ? <img src={wc.author.avatar_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-xs">{wc.author?.username?.[0].toUpperCase()}</span>}
                      </div>
                      <span className="font-bold text-sm text-white">{wc.author?.username}</span>
                      <span className="text-[10px] text-text-secondary opacity-30 ml-auto">{new Date(wc.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4">{wc.content}</p>
                    {wc.attachments && wc.attachments.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {wc.attachments.map((url: string, idx: number) => (
                          <div key={idx} className="w-32 h-32 rounded-xl overflow-hidden border border-purple-900/20"><img src={url} className="w-full h-full object-cover" /></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
