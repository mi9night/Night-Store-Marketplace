// src/components/IntegrationsSection.tsx — вкладка Интеграции в Настройках
import React, { useEffect, useState } from 'react';
import { Link2, Unlink, CheckCircle2, Send, Gamepad2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DISCORD_CLIENT_ID = '1508528088349409483';
const REDIRECT_URI = `${window.location.origin}/auth/discord/callback`;
const SCOPES = ['identify', 'guilds.join'].join(' ');

const DiscordLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect width="48" height="48" rx="14" fill="url(#discord-bg)" />
    <path
      d="M17.1 16.4C19 15.6 20.5 15.3 22 15.2L22.6 16.5C23.5 16.4 24.5 16.4 25.5 16.5L26.1 15.2C27.7 15.3 29.2 15.6 31 16.4C33.4 20 34.1 23.5 33.8 26.9C31.8 28.4 29.8 29.2 27.9 29.7L26.7 27.8C27.3 27.6 27.9 27.3 28.4 27C25.6 28.3 22.5 28.3 19.7 27C20.2 27.4 20.8 27.6 21.4 27.8L20.2 29.7C18.2 29.2 16.2 28.4 14.2 26.9C13.8 22.9 14.9 19.5 17.1 16.4Z"
      fill="white"
    />
    <path d="M20.8 24.4C21.7 24.4 22.4 23.6 22.4 22.7C22.4 21.7 21.7 21 20.8 21C19.9 21 19.2 21.7 19.2 22.7C19.2 23.6 19.9 24.4 20.8 24.4Z" fill="#5865F2" />
    <path d="M27.2 24.4C28.1 24.4 28.8 23.6 28.8 22.7C28.8 21.7 28.1 21 27.2 21C26.3 21 25.6 21.7 25.6 22.7C25.6 23.6 26.3 24.4 27.2 24.4Z" fill="#5865F2" />
    <defs>
      <linearGradient id="discord-bg" x1="6" y1="4" x2="44" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C8CFF" />
        <stop offset="1" stopColor="#4752C4" />
      </linearGradient>
    </defs>
  </svg>
);

const TelegramLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div className="rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center" style={{ width: size, height: size }}>
    <Send size={Math.round(size * 0.52)} className="text-white" fill="white" />
  </div>
);

const SteamLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <div className="rounded-xl bg-gradient-to-br from-slate-700 to-black border border-white/10 flex items-center justify-center" style={{ width: size, height: size }}>
    <Gamepad2 size={Math.round(size * 0.54)} className="text-white" />
  </div>
);

const IntegrationLogoWrap: React.FC<{ children: React.ReactNode; glow: string }> = ({ children, glow }) => (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_0_22px_var(--tw-shadow-color)] ${glow}`}>
    {children}
  </div>
);

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
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        <Link2 size={18} className="text-accent" /> Интеграции
      </h3>

      <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-3">
          <IntegrationLogoWrap glow="shadow-indigo-500/25">
            <DiscordLogo />
          </IntegrationLogoWrap>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white">Discord</p>
            <p className="text-xs text-text-secondary">
              {linked
                ? 'Привязан · автоматом дана роль на сервере'
                : 'Привяжи аккаунт и получи Discord-верификацию + роль на сервере'}
            </p>
          </div>
          {linked && (
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Привязан
            </span>
          )}
        </div>

        {linked && (
          <div className="relative bg-bg-card rounded-lg p-3 mb-3 flex items-center gap-3 border border-purple-900/20">
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
            className="relative w-full py-2.5 flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-semibold disabled:opacity-50">
            <Unlink size={14} /> {unlinking ? 'Отвязка...' : 'Отвязать'}
          </button>
        ) : (
          <button onClick={link}
            className="relative w-full py-2.5 flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-sm font-semibold shadow-[0_0_22px_rgba(88,101,242,0.22)]">
            <DiscordLogo size={20} /> Подключить Discord
          </button>
        )}
      </div>

      <div className="bg-bg-secondary/50 border border-purple-900/10 rounded-xl p-4 opacity-70">
        <div className="flex items-center gap-3">
          <IntegrationLogoWrap glow="shadow-cyan-500/20">
            <TelegramLogo />
          </IntegrationLogoWrap>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">Telegram</p>
            <p className="text-xs text-text-secondary">Скоро</p>
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary/50 border border-purple-900/10 rounded-xl p-4 opacity-70">
        <div className="flex items-center gap-3">
          <IntegrationLogoWrap glow="shadow-slate-400/15">
            <SteamLogo />
          </IntegrationLogoWrap>
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
