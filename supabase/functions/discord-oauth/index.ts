// supabase/functions/discord-oauth/index.ts
// Edge Function для обработки Discord OAuth и выдачи роли
//
// ⚙️ Перед деплоем установить SECRETS в Supabase:
//   supabase secrets set DISCORD_CLIENT_ID=1508528088349409483
//   supabase secrets set DISCORD_CLIENT_SECRET=JmUCP4B-afx7v-FfxeTtfCOhwziN4V9G
//   supabase secrets set DISCORD_BOT_TOKEN=MTUwODUyODA4ODM0OTQwOTQ4Mw....
//   supabase secrets set DISCORD_GUILD_ID=1344589458678349845
//   supabase secrets set DISCORD_ROLE_ID=1508530728298876948
//   supabase secrets set DISCORD_REDIRECT_URI=https://night-store-market.vercel.app/auth/discord/callback
//
// 🚀 Деплой:
//   supabase functions deploy discord-oauth --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code, action, supabase_jwt } = await req.json();

    // Авторизация
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${supabase_jwt}` } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return json({ ok: false, error: 'not_authenticated' }, 401);
    }

    const CLIENT_ID     = Deno.env.get('DISCORD_CLIENT_ID')!;
    const CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!;
    const BOT_TOKEN     = Deno.env.get('DISCORD_BOT_TOKEN')!;
    const GUILD_ID      = Deno.env.get('DISCORD_GUILD_ID')!;
    const ROLE_ID       = Deno.env.get('DISCORD_ROLE_ID')!;
    const REDIRECT_URI  = Deno.env.get('DISCORD_REDIRECT_URI')!;

    // ===== ОТВЯЗКА =====
    if (action === 'unlink') {
      const { data: u } = await supabase.from('users')
        .select('discord_id').eq('id', user.id).maybeSingle();

      if (u?.discord_id) {
        // Снять роль с Discord
        await fetch(
          `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${u.discord_id}/roles/${ROLE_ID}`,
          { method: 'DELETE', headers: { Authorization: `Bot ${BOT_TOKEN}` } },
        ).catch(() => {});
      }

      await supabase.from('users').update({
        discord_id: null,
        discord_username: null,
        discord_avatar: null,
        discord_verified: false,
        discord_linked_at: null,
      }).eq('id', user.id);

      return json({ ok: true });
    }

    // ===== ПРИВЯЗКА (OAuth callback) =====
    if (!code) return json({ ok: false, error: 'no_code' }, 400);

    // 1. Обмен кода на токен
    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return json({ ok: false, error: 'token_failed', detail: err }, 400);
    }
    const tokens = await tokenRes.json();

    // 2. Получить инфу о пользователе Discord
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return json({ ok: false, error: 'user_failed' }, 400);
    const dcUser = await userRes.json();

    // 3. Проверить — этот discord_id уже привязан к другому юзеру?
    const { data: existing } = await supabase.from('users')
      .select('id').eq('discord_id', dcUser.id).neq('id', user.id).maybeSingle();
    if (existing) {
      return json({ ok: false, error: 'discord_already_linked' }, 400);
    }

    // 4. Проверить — состоит ли уже в гильдии. Если нет — добавить (нужен scope guilds.join)
    const memberCheck = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${dcUser.id}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } },
    );

    if (memberCheck.status === 404) {
      // Не в гильдии — добавим
      await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${dcUser.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: tokens.access_token,
            roles: [ROLE_ID],
          }),
        },
      );
    } else {
      // Уже в гильдии — выдаём роль
      const roleRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${dcUser.id}/roles/${ROLE_ID}`,
        { method: 'PUT', headers: { Authorization: `Bot ${BOT_TOKEN}` } },
      );
      if (!roleRes.ok && roleRes.status !== 204) {
        const err = await roleRes.text();
        console.warn('Role assign failed:', err);
        // Не падаем — привязка всё равно сохраняется, роль можно выдать позже
      }
    }

    // 5. Сохранить в users
    const avatar = dcUser.avatar
      ? `https://cdn.discordapp.com/avatars/${dcUser.id}/${dcUser.avatar}.png`
      : null;

    await supabase.from('users').update({
      discord_id: dcUser.id,
      discord_username: dcUser.username,
      discord_avatar: avatar,
      discord_verified: true,
      discord_linked_at: new Date().toISOString(),
    }).eq('id', user.id);

    // 6. Уведомление пользователю
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: '✅ Discord привязан',
      text: `Аккаунт ${dcUser.username} успешно привязан, роль выдана!`,
      icon: '🎮',
    });

    return json({
      ok: true,
      discord_id: dcUser.id,
      discord_username: dcUser.username,
      discord_avatar: avatar,
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
