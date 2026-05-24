// src/components/GiveawayCard.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock, Users, Trophy, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  topicId: string;
}

const GiveawayCard: React.FC<Props> = ({ topicId }) => {
  const [giveaway, setGiveaway] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [participants, setParticipants] = useState<number>(0);
  const [iAmIn, setIAmIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [winner, setWinner] = useState<any>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    setMe(u.user);

    const { data: g } = await supabase
      .from('giveaways').select('*').eq('topic_id', topicId).maybeSingle();
    setGiveaway(g);

    if (g) {
      const { count } = await supabase
        .from('giveaway_participants')
        .select('*', { count: 'exact', head: true })
        .eq('giveaway_id', g.id);
      setParticipants(count || 0);

      if (u.user) {
        const { data: my } = await supabase
          .from('giveaway_participants')
          .select('user_id').eq('giveaway_id', g.id).eq('user_id', u.user.id).maybeSingle();
        setIAmIn(!!my);
      }

      if (g.winner_id) {
        const { data: w } = await supabase.from('users')
          .select('username, avatar_url, custom_id').eq('id', g.winner_id).maybeSingle();
        setWinner(w);
      }
    }
  };

  useEffect(() => { load(); }, [topicId]);

  // Таймер
  useEffect(() => {
    if (!giveaway?.ends_at) return;
    const tick = () => {
      const end = new Date(giveaway.ends_at).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Завершён');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}д ${h}ч ${m}м` : h > 0 ? `${h}ч ${m}м ${s}с` : `${m}м ${s}с`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [giveaway?.ends_at]);

  const join = async () => {
    if (!me || !giveaway) return;
    await supabase.from('giveaway_participants').insert({
      giveaway_id: giveaway.id, user_id: me.id,
    });
    load();
  };

  const leave = async () => {
    if (!me || !giveaway) return;
    await supabase.from('giveaway_participants')
      .delete().eq('giveaway_id', giveaway.id).eq('user_id', me.id);
    load();
  };

  // Выбор победителя (для автора или модера)
  const pickWinner = async () => {
    if (!giveaway || !confirm('Выбрать случайного победителя?')) return;
    const { data: ps } = await supabase.from('giveaway_participants')
      .select('user_id').eq('giveaway_id', giveaway.id);
    if (!ps || ps.length === 0) { alert('Нет участников'); return; }
    const w = ps[Math.floor(Math.random() * ps.length)];
    await supabase.from('giveaways').update({
      winner_id: w.user_id, status: 'finished'
    }).eq('id', giveaway.id);

    // Уведомление победителю
    await supabase.from('notifications').insert({
      user_id: w.user_id, type: 'system',
      title: '🎉 Вы выиграли розыгрыш!',
      text: `Приз: ${giveaway.prize}`, icon: '🎉',
      link_type: 'forum', link_id: topicId,
    });
    load();
  };

  if (!giveaway) return null;

  const isFinished = giveaway.status === 'finished' || new Date(giveaway.ends_at) <= new Date();
  const isAuthor = me?.id === giveaway.author_id;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-pink-900/30 via-purple-900/20 to-pink-900/10 border-2 border-pink-500/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(236,72,153,0.3)]">

      <div className="flex items-center gap-2 mb-3">
        <Gift size={20} className="text-pink-400" />
        <h3 className="text-lg font-bold text-white">🎁 РОЗЫГРЫШ</h3>
        {!isFinished && <Sparkles size={16} className="text-yellow-400 animate-pulse" />}
      </div>

      <div className="bg-[#0B0A12] rounded-xl p-4 mb-3">
        <p className="text-xs text-text-secondary mb-1">Приз</p>
        <p className="text-xl font-bold text-pink-300">{giveaway.prize}</p>
        {giveaway.description && (
          <p className="text-sm text-text-secondary mt-2">{giveaway.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0B0A12] rounded-xl p-3 text-center">
          <Clock size={14} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-text-secondary">До окончания</p>
          <p className="text-sm font-bold text-white">{timeLeft}</p>
        </div>
        <div className="bg-[#0B0A12] rounded-xl p-3 text-center">
          <Users size={14} className="text-green-400 mx-auto mb-1" />
          <p className="text-xs text-text-secondary">Участников</p>
          <p className="text-sm font-bold text-white">{participants}</p>
        </div>
      </div>

      {winner ? (
        <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-4 text-center">
          <Trophy size={28} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-xs text-text-secondary mb-1">Победитель</p>
          <p className="text-lg font-bold text-white">{winner.username}</p>
          {winner.custom_id && <p className="text-xs text-purple-300 font-mono">#{winner.custom_id}</p>}
        </div>
      ) : isFinished ? (
        isAuthor ? (
          <button onClick={pickWinner}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold">
            🎲 Выбрать победителя
          </button>
        ) : (
          <div className="text-center py-3 text-text-secondary">Розыгрыш завершён, ждём победителя</div>
        )
      ) : me ? (
        iAmIn ? (
          <button onClick={leave}
            className="w-full py-3 bg-purple-900/30 hover:bg-red-900/30 text-purple-300 hover:text-red-400 rounded-xl font-semibold border border-purple-700/40">
            ✓ Вы участвуете · Отказаться
          </button>
        ) : (
          <button onClick={join}
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-semibold animate-pulse">
            🎁 Участвовать
          </button>
        )
      ) : (
        <div className="text-center py-3 text-text-secondary">Войдите, чтобы участвовать</div>
      )}
    </motion.div>
  );
};

export default GiveawayCard;
