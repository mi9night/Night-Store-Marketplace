// src/pages/DiscordCallback.tsx — обрабатывает редирект от Discord после OAuth
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DiscordCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'err'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      setStatus('err');
      setMessage('Авторизация отменена');
      return;
    }
    if (!code) {
      setStatus('err');
      setMessage('Нет кода авторизации');
      return;
    }

    const process = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('err');
          setMessage('Нужно войти в систему');
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl}/functions/v1/discord-oauth`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, supabase_jwt: session.access_token }),
          },
        );

        const data = await res.json();
        if (data.ok) {
          setStatus('ok');
          setMessage(`Привязан Discord: ${data.discord_username}`);
          setTimeout(() => {
            window.location.href = '/?section=settings';
          }, 2000);
        } else {
          setStatus('err');
          const errMap: Record<string, string> = {
            not_authenticated: 'Войдите в систему',
            discord_already_linked: 'Этот Discord уже привязан к другому аккаунту',
            token_failed: 'Discord не подтвердил авторизацию',
          };
          setMessage(errMap[data.error] || data.error || 'Ошибка');
        }
      } catch (e: any) {
        setStatus('err');
        setMessage(e.message);
      }
    };

    process();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="bg-bg-card border border-purple-900/30 rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader size={48} className="mx-auto text-purple-400 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Подключение Discord...</h2>
            <p className="text-sm text-text-secondary">Выдаём роль на сервере</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">✅ Discord привязан!</h2>
            <p className="text-sm text-text-secondary">{message}</p>
            <p className="text-xs text-text-secondary mt-4">Перенаправление...</p>
          </>
        )}
        {status === 'err' && (
          <>
            <XCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Ошибка привязки</h2>
            <p className="text-sm text-text-secondary mb-4">{message}</p>
            <button onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
              На главную
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscordCallback;
