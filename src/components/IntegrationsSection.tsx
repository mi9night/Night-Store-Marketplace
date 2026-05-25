// src/components/IntegrationsSection.tsx — вкладка Интеграции в Настройках
import React, { useEffect, useState } from 'react';
import { Link2, Unlink, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DISCORD_CLIENT_ID = '1508528088349409483';
const REDIRECT_URI = `${window.location.origin}/auth/discord/callback`;
const SCOPES = ['identify', 'guilds.join'].join(' ');

const IntegrationsSection: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    setUser(u.user);
    if (u.user) {
      const { data: p } = await supabase.from('users')
        .select('discord_id, discord_username, discord_avatar, discord_verified, discord_linked_at')
        .eq('id', u.user.id).maybeSingle();
      setProfile(p);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const link = () => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = url;
  };

  const unlink = async () => {
    if (!confirm('Отвязать Discord? Роль на сервере будет снята.')) return;
    setUnlinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${(supabase as any).supabaseUrl}/functions/v1/discord-oauth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unlink', supabase_jwt: session.access_token }),
        },
      );
      const data = await res.json();
      if (data.ok) load();
      else alert(data.error || 'Ошибка');
    } finally { setUnlinking(false); }
  };

  if (loading) return <div className="text-center py-6 text-text-secondary text-sm">Загрузка...</div>;

  const linked = !!profile?.discord_id;

  return (
    <>
      <h3 className="text-base font-semibold text-white">🔗 Интеграции</h3>

      {/* Discord */}
      <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center text-2xl">
            💬
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">Discord</p>
            <p className="text-xs text-text-secondary">
              {linked
                ? 'Привязан · автоматом дана роль на сервере'
                : 'Привяжи аккаунт и получи 🔴 верификацию + роль на сервере'}
            </p>
          </div>
          {linked && (
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Привязан
            </span>
          )}
        </div>

        {linked && (
          <div className="bg-bg-card rounded-lg p-3 mb-3 flex items-center gap-3">
            {profile.discord_avatar && (
              <img src={profile.discord_avatar} className="w-10 h-10 rounded-full" alt="" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.discord_username}</p>
              <p className="text-xs text-text-secondary">ID: {profile.discord_id}</p>
              {profile.discord_linked_at && (
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Привязан: {new Date(profile.discord_linked_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </div>
        )}

        {linked ? (
          <button onClick={unlink} disabled={unlinking}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-semibold disabled:opacity-50">
            <Unlink size={14} /> {unlinking ? 'Отвязка...' : 'Отвязать'}
          </button>
        ) : (
          <button onClick={link}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-sm font-semibold">
            <Link2 size={14} /> Подключить Discord
          </button>
        )}
      </div>

      {/* Заглушки для будущих */}
      <div className="bg-bg-secondary/50 border border-purple-900/10 rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-2xl">✈️</div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">Telegram</p>
            <p className="text-xs text-text-secondary">Скоро</p>
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary/50 border border-purple-900/10 rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-2xl">🎮</div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">Steam</p>
            <p className="text-xs text-text-secondary">Скоро</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntegrationsSection;
