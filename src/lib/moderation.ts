import { supabase } from './supabase';

export type PunishmentType = 'ban' | 'mute' | 'warn';

export interface Punishment {
  id: string;
  user_id: string;
  type: PunishmentType;
  reason?: string | null;
  duration_hours?: number | null;
  ends_at?: string | null;
  created_at?: string;
  moderator_id?: string | null;
  moderator_name?: string | null;
  is_active?: boolean;
}

export const isPunishmentActive = (p?: Punishment | null) => {
  if (!p || !p.is_active) return false;
  if (!p.ends_at) return true;
  return new Date(p.ends_at).getTime() > Date.now();
};

export const fetchActivePunishments = async (userId: string, type?: PunishmentType) => {
  let q = supabase
    .from('bans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type) q = q.eq('type', type);

  const { data, error } = await q;
  if (error) return [];
  return (data || []).filter(isPunishmentActive) as Punishment[];
};

export const fetchActivePunishment = async (userId: string, type: PunishmentType) => {
  const list = await fetchActivePunishments(userId, type);
  return list[0] || null;
};

export const formatPunishmentDate = (value?: string | null) => {
  if (!value) return 'навсегда';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPunishmentTitle = (type: PunishmentType) => {
  if (type === 'ban') return 'Бан';
  if (type === 'mute') return 'Мут';
  return 'Предупреждение';
};

export const getPunishmentDescription = (type: PunishmentType) => {
  if (type === 'ban') return 'Пользователь временно не может пользоваться сайтом';
  if (type === 'mute') return 'Пользователь не может писать темы, комментарии и выкладывать товары';
  return 'Официальное предупреждение от модерации';
};
