// src/components/ModerationPanel.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Package, Receipt, Ticket, BarChart3,
  Search, Ban, VolumeX, AlertTriangle, CheckCircle2, XCircle,
  Trash2, Edit3, MessageSquare, RotateCcw, ArrowRight, X,
  Crown, Settings as SettingsIcon, Megaphone, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RoleBadge as RB } from './RoleBadge';

type Section = 'tickets' | 'users' | 'operations' | 'products' | 'stats' | 'broadcast';

interface Props {
  // Колбек, чтобы из модерации можно было перейти на тему / товар
  onNavigate?: (page: 'forum' | 'product' | 'profile' | 'topic', payload?: any) => void;
}

const ModerationPanel: React.FC<Props> = ({ onNavigate }) => {
  const [section, setSection] = useState<Section>(() => {
    return localStorage.getItem('mod_open_user_id') ? 'users' : 'tickets';
  });
  const [myRole, setMyRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: u } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
        setMyRole(u?.role || 'user');
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Загрузка...</div>;
  }

  if (!['moderator', 'admin', 'owner'].includes(myRole)) {
    return (
      <div className="bg-bg-card border border-red-800/40 rounded-2xl p-8 text-center">
        <Shield size={40} className="mx-auto text-red-400 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Доступ запрещён</h3>
        <p className="text-sm text-text-secondary">Эта секция доступна только модераторам</p>
      </div>
    );
  }

  const sections = [
    { id: 'tickets',    label: 'Тикеты',       icon: Ticket },
    { id: 'users',      label: 'Пользователи', icon: Users },
    { id: 'operations', label: 'Финансы',      icon: Receipt },
    { id: 'products',   label: 'Товары',       icon: Package },
    { id: 'broadcast',  label: 'Рассылка',     icon: Megaphone },
    { id: 'stats',      label: 'Статистика',   icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">Панель модерации</h2>
        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
          myRole === 'owner' ? 'bg-red-900/30 text-red-400' :
          myRole === 'admin' ? 'bg-orange-900/30 text-orange-400' :
          'bg-blue-900/30 text-blue-400'
        }`}>
          {myRole === 'owner' ? '👑 OWNER' : myRole === 'admin' ? '🛡 ADMIN' : '⚖️ MOD'}
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto bg-bg-card border border-purple-900/20 rounded-xl p-1">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id as Section)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              section === s.id
                ? 'bg-purple-600/30 text-purple-300'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {section === 'tickets' && <TicketsSection onNavigate={onNavigate} />}
          {section === 'users' && <UsersSection myRole={myRole} />}
          {section === 'operations' && <OperationsSection />}
          {section === 'products' && <ProductsSection onNavigate={onNavigate} />}
          {section === 'stats' && <StatsSection />}
          {section === 'broadcast' && <BroadcastSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


/* =================== 1. ТИКЕТЫ =================== */
const TicketsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'not_resolved'>('all');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const openTicket = async (t: any) => {
    setActiveTicket(t);
    loadMessages(t.id);
  };

  const updateStatus = async (status: string, resolution?: string) => {
    if (!activeTicket) return;
    const upd: any = { status, updated_at: new Date().toISOString() };
    if (resolution) upd.resolution = resolution;
    if (status === 'closed') upd.closed_at = new Date().toISOString();
    await supabase.from('tickets').update(upd).eq('id', activeTicket.id);
    setActiveTicket({ ...activeTicket, ...upd });
    load();
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('ticket_messages').insert({
      ticket_id: activeTicket.id,
      sender_id: u.user?.id,
      message: reply,
    });
    setReply('');
    loadMessages(activeTicket.id);
  };

  const goToSource = () => {
    if (!activeTicket || !onNavigate) return;
    if (activeTicket.target_type === 'topic') {
      onNavigate('topic', { id: activeTicket.target_id });
    } else if (activeTicket.target_type === 'forum') {
      onNavigate('forum');
    } else if (activeTicket.target_type === 'account') {
      onNavigate('product', { id: activeTicket.target_id });
    } else if (activeTicket.target_type === 'user') {
      onNavigate('profile', { id: activeTicket.target_id });
    }
  };

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(t => filter === 'not_resolved' ? t.resolution === 'not_resolved' : (t.status === filter || t.resolution === filter));

  if (activeTicket) {
    return (
      <div className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-purple-900/20 flex items-center gap-2">
          <button onClick={() => setActiveTicket(null)} className="text-text-secondary hover:text-white p-1">
            <ArrowRight size={18} className="rotate-180" />
          </button>
          <h3 className="text-base font-semibold text-white flex-1">
            Тикет #{activeTicket.id.slice(0, 8)}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            activeTicket.status === 'closed' ? 'bg-gray-900/40 text-gray-400' :
            activeTicket.status === 'open' ? 'bg-blue-900/30 text-blue-400' :
            'bg-yellow-900/30 text-yellow-400'
          }`}>
            {activeTicket.status}
          </span>
        </div>

        <div className="p-4 border-b border-purple-900/20">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-secondary text-xs">Категория</span>
              <p className="text-white">{activeTicket.category || '—'}</p>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Цель жалобы</span>
              <p className="text-white">{activeTicket.target_type || '—'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-text-secondary text-xs">Тема</span>
              <p className="text-white">{activeTicket.subject || '—'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-text-secondary text-xs">Описание</span>
              <p className="text-white">{activeTicket.description || '—'}</p>
            </div>
          </div>

          {activeTicket.target_id && (
            <button
              onClick={goToSource}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg text-sm"
            >
              <ArrowRight size={14} /> Перейти к источнику жалобы
            </button>
          )}
        </div>

        {/* Метки решения */}
        <div className="p-4 border-b border-purple-900/20 flex gap-2 flex-wrap">
          <button
            onClick={() => updateStatus('in_progress', 'in_progress')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 rounded-lg text-xs font-semibold"
          >
            ⏳ Решается
          </button>
          <button
            onClick={() => updateStatus('open', 'resolved')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 hover:bg-green-900/40 text-green-400 rounded-lg text-xs font-semibold"
          >
            ✅ Решено
          </button>
          <button
            onClick={() => updateStatus('open', 'not_resolved')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-xs font-semibold"
          >
            ❌ Не решено
          </button>
          <button
            onClick={() => updateStatus('closed', activeTicket.resolution || 'closed')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 rounded-lg text-xs font-semibold ml-auto"
          >
            🔒 Закрыть тикет
          </button>
        </div>

        {/* Сообщения */}
        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-6">Сообщений нет</p>
          ) : messages.map(m => (
            <div key={m.id} className="bg-bg-secondary border border-purple-900/20 rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-1">{new Date(m.created_at).toLocaleString('ru-RU')}</p>
              <p className="text-sm text-white">{m.message}</p>
            </div>
          ))}
        </div>

        {/* Ответ */}
        <div className="p-3 border-t border-purple-900/20 flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendReply()}
            placeholder="Ответ от модератора..."
            className="flex-1 px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm"
          />
          <button onClick={sendReply} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
            Отправить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Все' },
          { id: 'open', label: '🆕 Открытые' },
          { id: 'in_progress', label: '⏳ Решается' },
          { id: 'resolved', label: '✅ Решено' },
          { id: 'not_resolved', label: '❌ Не решено' },
          { id: 'closed', label: '🔒 Закрытые' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === f.id ? 'bg-purple-600 text-white' : 'bg-bg-card text-text-secondary border border-purple-900/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-secondary">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-8 text-center text-text-secondary">
          Тикетов нет
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => openTicket(t)}
              className="bg-bg-card border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-3 cursor-pointer flex items-center gap-3"
            >
              <Ticket size={18} className="text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{t.subject || t.category || 'Тикет'}</span>
                  {t.target_type && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">{t.target_type}</span>
                  )}
                </div>
                <p className="text-xs text-text-secondary truncate">{t.description || 'Без описания'}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  t.status === 'closed' ? 'bg-gray-900/40 text-gray-400' :
                  t.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>{t.status}</span>
                {t.resolution && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.resolution === 'resolved' ? 'bg-green-900/30 text-green-400' :
                    t.resolution === 'not_resolved' ? 'bg-red-900/30 text-red-400' :
                    'bg-yellow-900/30 text-yellow-400'
                  }`}>{t.resolution}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


/* =================== 2. ПОЛЬЗОВАТЕЛИ =================== */
const UsersSection: React.FC<{ myRole: string }> = ({ myRole }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [bans, setBans] = useState<any[]>([]);
  const [modal, setModal] = useState<null | 'punish' | 'stat' | 'role'>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);

  // Punish form
  const [pType, setPType] = useState<'ban' | 'mute' | 'warn'>('mute');
  const [pReason, setPReason] = useState('');
  const [pHours, setPHours] = useState<string>('24');

  // Stat form
  const [statField, setStatField] = useState('balance');
  const [statValue, setStatValue] = useState('');

  const search = async () => {
    setLoading(true);
    const q = supabase.from('users').select('*').limit(50);
    if (query.trim()) {
      q.or(`username.ilike.%${query}%,email.ilike.%${query}%,id.eq.${query.match(/^[a-f0-9-]{36}$/i) ? query : '00000000-0000-0000-0000-000000000000'}`);
    }
    const { data } = await q.order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const pendingId = localStorage.getItem('mod_open_user_id');
      if (pendingId) {
        localStorage.removeItem('mod_open_user_id');
        const { data } = await supabase.from('users').select('*').eq('id', pendingId).maybeSingle();
        if (data) {
          openUser(data);
          return;
        }
      }
      search();
    };
    init();
  }, []);

  const openUser = async (u: any) => {
    setActive(u);
    const { data } = await supabase.from('bans').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
    setBans(data || []);
    const { data: accs } = await supabase.from('accounts').select('*').eq('seller_id', u.id).order('created_at', { ascending: false });
    setUserAccounts(accs || []);
    await loadCustomRoles(u.id);
  };

  const [customRolesList, setCustomRolesList] = useState<any[]>([]);
  const loadCustomRoles = async (userId: string) => {
    const { data } = await supabase.from('user_custom_roles').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    setCustomRolesList(data || []);
    // подмешиваем в active.custom_roles, чтобы RoleBadge отрисовал
    setActive((prev: any) => prev ? { ...prev, custom_roles: data || [] } : prev);
  };

  // Быстрая смена стата
  const quickStat = async (field: string, value: any) => {
    if (!active) return;
    const v = typeof value === 'boolean' ? String(value) : String(value);
    const { data, error } = await supabase.rpc('moderate_set_stat', {
      p_user_id: active.id, p_field: field, p_value: v,
    });
    if (error || !data?.ok) {
      alert((data?.error || error?.message) || 'Ошибка');
      return;
    }
    const { data: refreshed } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    if (refreshed) setActive(refreshed);
  };

  // Кастомная роль
  const [crLabel, setCrLabel] = useState('');
  const [crIcon, setCrIcon] = useState('⭐');
  const [crColor, setCrColor] = useState('purple');

  const applyRole = async (preset: string) => {
    if (!active) return;
    if (preset === 'custom') {
      if (!crLabel.trim()) { alert('Введите название роли'); return; }
      // Добавляем НОВУЮ кастомную роль (можно много)
      await supabase.from('user_custom_roles').insert({
        user_id: active.id,
        label: crLabel,
        icon: crIcon,
        color: crColor,
        granted_by: (await supabase.auth.getUser()).data.user?.id,
      });
      setCrLabel('');
      await loadCustomRoles(active.id);
      setModal(null);
      return;
    } else {
      // Меняем только основную роль, кастомную не трогаем
      await supabase.from('users').update({
        role: preset,
      }).eq('id', active.id);
    }
    const { data: refreshed } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    if (refreshed) setActive(refreshed);
    setModal(null);
  };

  // Удалить кастомную роль по id
  const deleteCustomRole = async (id: string) => {
    if (!active) return;
    await supabase.from('user_custom_roles').delete().eq('id', id);
    await loadCustomRoles(active.id);
  };

  // Очистить старую (deprecated, оставлено для совместимости)
  const clearCustomRole = async () => {
    if (!active) return;
    await supabase.from('users').update({
      custom_role_label: null, custom_role_icon: null, custom_role_color: null,
    }).eq('id', active.id);
    const { data: refreshed } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    if (refreshed) setActive(refreshed);
  };

  const punish = async () => {
    if (!active) return;
    const { error } = await supabase.rpc('moderate_punish', {
      p_user_id: active.id,
      p_type: pType,
      p_reason: pReason,
      p_duration_hours: pHours ? parseInt(pHours) : null,
    });
    if (error) { alert(error.message); return; }
    setModal(null);
    setPReason('');
    openUser(active);
  };

  const unpunish = async (banId: string) => {
    await supabase.rpc('moderate_unpunish', { p_ban_id: banId });
    openUser(active);
  };

  const setStat = async () => {
    if (!active) return;
    const { data, error } = await supabase.rpc('moderate_set_stat', {
      p_user_id: active.id,
      p_field: statField,
      p_value: statValue,
    });
    if (error) { alert(error.message); return; }
    if (!data?.ok) { alert(data?.error); return; }
    setModal(null);
    setStatValue('');
    const { data: refreshed } = await supabase.from('users').select('*').eq('id', active.id).maybeSingle();
    setActive(refreshed);
  };

  if (active) {
    return (
      <div className="space-y-3">
        <button onClick={() => setActive(null)} className="text-sm text-purple-400 flex items-center gap-1">
          ← Назад к поиску
        </button>

        {/* Карточка пользователя */}
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
              {active.avatar_url ? <img src={active.avatar_url} className="w-full h-full object-cover" /> :
                <span className="text-xl font-bold text-white">{(active.username?.[0] || 'U').toUpperCase()}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{active.username || active.email}</h3>
                {active.verified && <CheckCircle2 size={16} className="text-blue-400" />}
                <RB user={active} />
              </div>
              <p className="text-sm text-text-secondary">{active.email}</p>
              <p className="text-xs text-text-secondary font-mono">#{active.custom_id || active.id?.slice(0, 8)}</p>
            </div>
          </div>

          {/* Статы с точными значениями */}
          <div className="space-y-2 mb-4">
            {[
              { label: '💰 Баланс',  field: 'balance', value: active.balance || 0,  steps: [10, 100, 1000, 10000], suffix: ' ₽' },
              { label: '⚡ XP',       field: 'xp',      value: active.xp || 0,       steps: [10, 50, 100, 500],   suffix: ''     },
              { label: '📈 Уровень',  field: 'level',   value: active.level || 1,    steps: [1],                  suffix: ''     },
              { label: '🛍 Продажи',  field: 'sales',   value: active.sales || 0,    steps: [1, 10],              suffix: ''     },
            ].map(s => (
              <div key={s.field} className="bg-bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-text-secondary">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.value}{s.suffix}</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {s.steps.map(step => (
                    <React.Fragment key={step}>
                      <button onClick={() => quickStat(s.field, s.value - step)}
                        className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md text-[10px] font-bold">−{step >= 1000 ? step/1000 + 'k' : step}</button>
                      <button onClick={() => quickStat(s.field, s.value + step)}
                        className="px-2 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded-md text-[10px] font-bold">+{step >= 1000 ? step/1000 + 'k' : step}</button>
                    </React.Fragment>
                  ))}
                  <button onClick={() => {
                    const v = prompt(`Точное значение ${s.label}:`, String(s.value));
                    if (v !== null && !isNaN(Number(v))) quickStat(s.field, Number(v));
                  }}
                    className="px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-md text-[10px] font-bold">✏️ точно</button>
                  {s.field === 'sales' && (
                    <button onClick={() => setShowAccounts(true)} title="Товары"
                      className="ml-auto px-2 py-1 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-md text-[10px]">📦 товары</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Верификация и Роль */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <button onClick={() => quickStat('verified', !active.verified)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                active.verified ? 'bg-blue-600 text-white' : 'bg-blue-900/20 text-blue-400'
              }`}>
              <CheckCircle2 size={14} /> {active.verified ? 'Снять верификацию' : 'Верифицировать'}
            </button>
            <button onClick={() => setModal('role')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded-lg text-sm font-semibold">
              <Crown size={14} /> Сменить роль
            </button>
          </div>

          {/* Наказания и расш. статы */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModal('punish')} className="flex items-center gap-1.5 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-sm">
              <Ban size={14} /> Наказание
            </button>
            <button onClick={() => setModal('stat')} className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg text-sm">
              <SettingsIcon size={14} /> Произвольное поле
            </button>
          </div>
        </div>

        {/* История наказаний */}
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-white mb-3">История наказаний ({bans.length})</h4>
          {bans.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-4">Наказаний нет</p>
          ) : (
            <div className="space-y-2">
              {bans.map(b => {
                const isActive = b.is_active && (!b.ends_at || new Date(b.ends_at) > new Date());
                return (
                  <div key={b.id} className={`border rounded-lg p-3 ${isActive ? 'bg-red-900/10 border-red-800/40' : 'bg-bg-secondary border-purple-900/20'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        b.type === 'ban' ? 'bg-red-900/30 text-red-400' :
                        b.type === 'mute' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-orange-900/30 text-orange-400'
                      }`}>{b.type}</span>
                      {isActive && <span className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded animate-pulse">АКТИВЕН</span>}
                      <span className="text-xs text-text-secondary ml-auto">{new Date(b.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                    <p className="text-sm text-white"><b>Причина:</b> {b.reason}</p>
                    <p className="text-xs text-text-secondary">
                      <b>Выдал:</b> {b.moderator_name} · <b>Срок:</b> {b.duration_hours ? `${b.duration_hours} ч` : 'навсегда'}
                      {b.ends_at && ` · до ${new Date(b.ends_at).toLocaleString('ru-RU')}`}
                    </p>
                    {isActive && (
                      <button onClick={() => unpunish(b.id)} className="mt-2 text-xs text-green-400 hover:underline">
                        ✓ Снять наказание
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Модалка наказания */}
        {modal === 'punish' && (
          <Modal onClose={() => setModal(null)} title="Выдать наказание">
            <label className="text-xs text-text-secondary mb-1 block">Тип</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'warn', label: '⚠️ Предупр.', color: 'orange' },
                { id: 'mute', label: '🔇 Мут', color: 'yellow' },
                { id: 'ban', label: '🚫 Бан', color: 'red' },
              ].map(t => (
                <button key={t.id} onClick={() => setPType(t.id as any)}
                  className={`py-2 rounded-lg text-xs font-semibold border ${
                    pType === t.id ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-purple-900/20 text-text-secondary'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <label className="text-xs text-text-secondary mb-1 block">Причина</label>
            <textarea value={pReason} onChange={e => setPReason(e.target.value)} rows={2}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm resize-none" />

            <label className="text-xs text-text-secondary mb-1 block">Срок (часов, 0 = навсегда)</label>
            <div className="flex gap-2 mb-3">
              {['1', '24', '72', '168', '720', '0'].map(h => (
                <button key={h} onClick={() => setPHours(h)}
                  className={`flex-1 py-2 rounded-lg text-xs border ${
                    pHours === h ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-purple-900/20 text-text-secondary'
                  }`}>
                  {h === '0' ? '∞' : h === '24' ? '1д' : h === '72' ? '3д' : h === '168' ? '7д' : h === '720' ? '30д' : h + 'ч'}
                </button>
              ))}
            </div>
            <input value={pHours} onChange={e => setPHours(e.target.value)} type="number" placeholder="Своё значение"
              className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

            <button onClick={punish} disabled={!pReason} className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              Выдать наказание
            </button>
          </Modal>
        )}

        {modal === 'role' && (
          <Modal onClose={() => setModal(null)} title="Сменить роль пользователя">
            <div className="space-y-2 mb-4">
              {[
                { id: 'user',      label: 'Обычный пользователь',     icon: '👤', color: 'bg-gray-700/20 text-gray-300' },
                { id: 'support',   label: 'Support (поддержка)',      icon: '🛟', color: 'bg-cyan-900/30 text-cyan-400' },
                { id: 'moderator', label: 'Moderator (модератор)',    icon: '⚖️', color: 'bg-blue-900/30 text-blue-400' },
                { id: 'admin',     label: 'Admin (администратор)',    icon: '🛡',  color: 'bg-orange-900/30 text-orange-400' },
                ...(myRole === 'owner' ? [{ id: 'owner', label: 'Owner (владелец)', icon: '👑', color: 'bg-red-900/30 text-red-400' }] : []),
              ].map(r => (
                <button key={r.id} onClick={() => applyRole(r.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${r.color}`}>
                  <span className="text-base">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="border-t border-purple-900/20 pt-3 mt-3">
              <p className="text-xs text-text-secondary mb-2 font-semibold">⭐ Кастомная роль</p>
              <input value={crLabel} onChange={e => setCrLabel(e.target.value)}
                placeholder="Название (напр. SPONSOR)" maxLength={15}
                className="w-full px-3 py-2 mb-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className="text-[10px] text-text-secondary uppercase w-full">Иконка</span>
                {['⭐','🌙','🔥','💎','🎩','🐉','⚔️','🎭','🦊','🎮','👑','🛡','⚡','🚀','🎯','🌟','💫','🎪','🦅','🐺','🦁','🌌','🎨','🎵','🍷','☕','🎲','🃏','💀','😎'].map(i => (
                  <button key={i} onClick={() => setCrIcon(i)}
                    className={`w-9 h-9 rounded-lg text-base flex items-center justify-center ${crIcon === i ? 'bg-purple-600 ring-2 ring-white' : 'bg-bg-secondary border border-purple-900/30'}`}>
                    {i}
                  </button>
                ))}
                <input value={crIcon} onChange={e => setCrIcon(e.target.value.slice(0, 4))}
                  placeholder="свой" maxLength={4}
                  className="w-16 h-9 px-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm text-center" />
              </div>
              <div className="flex gap-2 mb-3 flex-wrap items-center">
                <span className="text-[10px] text-text-secondary uppercase w-full">Цвет</span>
                {['red','orange','yellow','green','blue','cyan','purple','pink'].map(col => (
                  <button key={col} onClick={() => setCrColor(col)}
                    className={`w-7 h-7 rounded-lg border-2 ${crColor === col ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: ({ red:'#ef4444', orange:'#f97316', yellow:'#eab308', green:'#22c55e', blue:'#3b82f6', cyan:'#06b6d4', purple:'#a855f7', pink:'#ec4899' } as any)[col] }} />
                ))}
              </div>
              <button onClick={() => applyRole('custom')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold">
                Применить кастомную
              </button>

              {customRolesList.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-900/20">
                  <p className="text-[10px] text-text-secondary mb-2 uppercase">Текущие кастомные роли ({customRolesList.length})</p>
                  <div className="space-y-1">
                    {customRolesList.map((cr: any) => (
                      <div key={cr.id} className="flex items-center justify-between bg-bg-secondary rounded-lg p-2">
                        <span className="text-xs text-white">{cr.icon} {cr.label}</span>
                        <button onClick={() => deleteCustomRole(cr.id)}
                          className="text-[10px] text-red-400 hover:underline">Удалить</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {active.custom_role_label && (
                <button onClick={clearCustomRole}
                  className="w-full py-2 mt-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-xs font-semibold">
                  ❌ Удалить старую: {active.custom_role_label}
                </button>
              )}
            </div>
          </Modal>
        )}

        {/* Окно с продажами */}
        {showAccounts && (
          <Modal onClose={() => setShowAccounts(false)} title={`Товары ${active.username || 'пользователя'} (${userAccounts.length})`}>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {userAccounts.length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-4">Нет товаров</p>
              ) : userAccounts.map(a => (
                <div key={a.id} className="bg-bg-secondary border border-purple-900/20 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">{a.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.status === 'sold' ? 'bg-gray-900/40 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                      {a.status || 'active'}
                    </span>
                    <span className="text-[10px] text-text-secondary ml-auto">{new Date(a.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p className="text-sm text-white font-semibold truncate">{a.title}</p>
                  <p className="text-sm text-purple-300">{a.price?.toLocaleString('ru-RU')} ₽</p>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {modal === 'stat' && (
          <Modal onClose={() => setModal(null)} title="Изменить статистику">
            <label className="text-xs text-text-secondary mb-1 block">Поле</label>
            <select value={statField} onChange={e => setStatField(e.target.value)}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm">
              <option value="balance">Баланс</option>
              <option value="xp">XP</option>
              <option value="level">Уровень</option>
              <option value="sales">Продажи</option>
              <option value="positive_reviews">Положительные отзывы</option>
              <option value="verified">Верификация (true/false)</option>
              </select>

            <label className="text-xs text-text-secondary mb-1 block">Новое значение</label>
            <input value={statValue} onChange={e => setStatValue(e.target.value)}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

            <button onClick={setStat} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold">
              Применить
            </button>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Поиск по никнейму, email или ID..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-bg-card border border-purple-900/30 text-white text-sm" />
        <button onClick={search} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm">
          <Search size={16} />
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-text-secondary">Загрузка...</div> :
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} onClick={() => openUser(u)}
              className="bg-bg-card border border-purple-900/20 hover:border-purple-700/40 rounded-xl p-3 cursor-pointer flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> :
                  <span className="text-xs font-bold text-white">{(u.username?.[0] || 'U').toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{u.username || u.email}</p>
                  <RB user={u} />
                  {u.custom_id && <span className="text-[10px] text-purple-300 font-mono">#{u.custom_id}</span>}
                </div>
                <p className="text-xs text-text-secondary truncate">{u.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-text-secondary">Баланс</p>
                <p className="text-sm font-bold text-white">{(u.balance || 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
};


/* =================== 3. ФИНАНСЫ =================== */
const OperationsSection: React.FC = () => {
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');
  const [note, setNote] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase.from('operations').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOps(data || []);

    // подтянем юзеров
    const ids = [...new Set((data || []).map(o => o.user_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data: users } = await supabase.from('users').select('id, username, email, custom_id').in('id', ids);
      const map: Record<string, any> = {};
      users?.forEach(u => { map[u.id] = u; });
      setUsersMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const action = async (opId: string, act: 'approve' | 'reject' | 'rollback') => {
    const { error } = await supabase.rpc('moderate_operation', { p_op_id: opId, p_action: act, p_note: note || null });
    if (error) alert(error.message);
    setNote('');
    setOpening(null);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pending', label: '⏳ Ожидает', color: 'yellow' },
          { id: 'completed', label: '✅ Выполнено', color: 'green' },
          { id: 'failed', label: '❌ Отклонено', color: 'red' },
          { id: 'all', label: 'Все', color: 'gray' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === f.id ? 'bg-purple-600 text-white' : 'bg-bg-card text-text-secondary border border-purple-900/20'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-text-secondary">Загрузка...</div> :
       ops.length === 0 ? <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-8 text-center text-text-secondary">Операций нет</div> :
        <div className="space-y-2">
          {ops.map(o => (
            <div key={o.id} className="bg-bg-card border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  o.type === 'deposit' ? 'bg-green-900/20 text-green-400' :
                  o.type === 'withdraw' ? 'bg-red-900/20 text-red-400' :
                  'bg-purple-900/20 text-purple-300'
                }`}>
                  {o.type === 'deposit' ? '+' : o.type === 'withdraw' ? '−' : '→'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {o.type} · {Number(o.amount).toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-xs text-text-secondary">
                    User: {usersMap[o.user_id]?.custom_id ? '#' + usersMap[o.user_id].custom_id : (usersMap[o.user_id]?.username || o.user_id?.slice(0, 8))} · {new Date(o.created_at).toLocaleString('ru-RU')}
                    {o.recipient && ` · → ${o.recipient}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                  o.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                  o.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                  'bg-red-900/30 text-red-400'
                }`}>{o.status}{o.rolled_back && ' · откат'}</span>
              </div>

              {opening === o.id && (
                <div className="mt-3 space-y-2">
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Комментарий (необязательно)"
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />
                  <div className="flex gap-2">
                    {o.status === 'pending' && (
                      <>
                        <button onClick={() => action(o.id, 'approve')} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold">
                          ✅ Одобрить
                        </button>
                        <button onClick={() => action(o.id, 'reject')} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold">
                          ❌ Отклонить
                        </button>
                      </>
                    )}
                    {o.status === 'completed' && !o.rolled_back && (
                      <button onClick={() => action(o.id, 'rollback')} className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold">
                        ↩️ Откатить
                      </button>
                    )}
                  </div>
                </div>
              )}
              {opening !== o.id && (o.status === 'pending' || (o.status === 'completed' && !o.rolled_back)) && (
                <button onClick={() => setOpening(o.id)} className="mt-2 text-xs text-purple-400 hover:underline">
                  Действия →
                </button>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
};


/* =================== 4. ТОВАРЫ =================== */
const ProductsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMsg, setEditMsg] = useState<{ id: string; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('accounts').select('*').limit(100).order('created_at', { ascending: false });
    if (query.trim()) q = q.ilike('title', `%${query}%`);
    if (category.trim()) q = q.eq('category', category);
    const { data } = await q;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const delProduct = async (id: string) => {
    const reason = prompt('Причина удаления:');
    if (!reason) return;
    await supabase.rpc('moderate_delete_account', { p_account_id: id, p_reason: reason });
    load();
  };

  const requestEdit = async (id: string) => {
    if (!editMsg) return;
    await supabase.rpc('moderate_request_edit', { p_account_id: id, p_message: editMsg.text });
    setEditMsg(null);
    alert('Запрос отправлен продавцу');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Поиск по названию..."
          className="flex-1 px-3 py-2 rounded-xl bg-bg-card border border-purple-900/30 text-white text-sm" />
        <input value={category} onChange={e => setCategory(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Категория"
          className="w-32 px-3 py-2 rounded-xl bg-bg-card border border-purple-900/30 text-white text-sm" />
        <button onClick={load} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm">
          <Search size={16} />
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-text-secondary">Загрузка...</div> :
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="bg-bg-card border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <Package size={18} className="text-purple-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 rounded text-purple-300">{p.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.status === 'sold' ? 'bg-gray-900/40 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                      {p.status || 'active'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-xs text-text-secondary">{p.price?.toLocaleString('ru-RU')} ₽ · seller: {p.seller_id?.slice(0, 8)}</p>
                </div>
                <div className="flex gap-1">
                  {onNavigate && (
                    <button onClick={() => onNavigate('product', { id: p.id })} className="p-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded-lg">
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button onClick={() => setEditMsg({ id: p.id, text: '' })} className="p-2 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 rounded-lg">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => delProduct(p.id)} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editMsg?.id === p.id && (
                <div className="mt-3 space-y-2">
                  <textarea value={editMsg.text} onChange={e => setEditMsg({ ...editMsg, text: e.target.value })}
                    placeholder="Что нужно исправить?" rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => requestEdit(p.id)} disabled={!editMsg.text}
                      className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                      Отправить запрос
                    </button>
                    <button onClick={() => setEditMsg(null)} className="px-4 py-2 bg-purple-900/30 text-white rounded-lg text-xs">
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
};


/* =================== 5. СТАТИСТИКА =================== */
const StatsSection: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0, active_users: 0, accounts: 0, sold: 0,
    pending_ops: 0, open_tickets: 0, total_revenue: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [modsMap, setModsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [users, accs, sold, pendingOps, openTk, ordersSum, modLogs] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('accounts').select('id', { count: 'exact', head: true }),
          supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
          supabase.from('operations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
          supabase.from('orders').select('amount'),
          supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(20),
        ]);
        const total = (ordersSum.data || []).reduce((s, o) => s + Number(o.amount || 0), 0);
        setStats({
          users: users.count || 0,
          active_users: 0,
          accounts: accs.count || 0,
          sold: sold.count || 0,
          pending_ops: pendingOps.count || 0,
          open_tickets: openTk.count || 0,
          total_revenue: total,
        });
        setLogs(modLogs.data || []);
        const modIds = [...new Set((modLogs.data || []).map((l: any) => l.moderator_id).filter(Boolean))];
        if (modIds.length > 0) {
          const { data: mods } = await supabase.from('users').select('id, username').in('id', modIds);
          const map: Record<string, any> = {};
          mods?.forEach((m: any) => { map[m.id] = m; });
          setModsMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filterMatches: Record<string, string[]> = {
    balance: ['set_balance', 'op_approve', 'op_reject', 'op_rollback'],
    punish:  ['ban', 'mute', 'warn', 'unpunish'],
    product: ['delete_account', 'request_edit'],
    roles:   ['set_role', 'set_verified'],
  };
  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => {
    const matches = filterMatches[logFilter] || [];
    return matches.some(m => (l.action || '').includes(m));
  });

  if (loading) return <div className="text-center py-8 text-text-secondary">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Пользователей', value: stats.users, color: 'text-blue-400' },
          { label: 'Товаров', value: stats.accounts, color: 'text-purple-400' },
          { label: 'Продано', value: stats.sold, color: 'text-green-400' },
          { label: 'Оборот, ₽', value: stats.total_revenue.toLocaleString('ru-RU'), color: 'text-yellow-400' },
          { label: 'Ожидают опер.', value: stats.pending_ops, color: 'text-orange-400' },
          { label: 'Открытые тикеты', value: stats.open_tickets, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-purple-900/20 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">📋 Журнал действий модераторов</h4>
        </div>

        <div className="flex gap-1 mb-3 flex-wrap">
          {[
            { id: 'all',         label: 'Все', icon: '📜' },
            { id: 'balance',     label: 'Балансы', icon: '💰', match: ['set_balance', 'op_'] },
            { id: 'punish',      label: 'Наказания', icon: '🚫', match: ['ban', 'mute', 'warn', 'unpunish'] },
            { id: 'product',     label: 'Товары', icon: '📦', match: ['delete_account', 'request_edit'] },
            { id: 'roles',       label: 'Роли', icon: '👑', match: ['set_role', 'set_verified'] },
          ].map(f => (
            <button key={f.id} onClick={() => setLogFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                logFilter === f.id ? 'bg-purple-600 text-white' : 'bg-bg-secondary text-text-secondary border border-purple-900/20'
              }`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-4">Действий нет</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map(l => (
              <div key={l.id} className="bg-bg-secondary border border-purple-900/20 rounded-lg p-2 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-purple-300">{l.action}</span>
                  <span className="text-text-secondary">{new Date(l.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <p className="text-white">{l.details}</p>
                <p className="text-[10px] text-text-secondary">
                  Mod: {modsMap[l.moderator_id]?.username || l.moderator_id?.slice(0, 8)} · Target: {l.target_type || '—'}/{l.target_id?.slice(0, 8) || '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


/* =================== РАССЫЛКА =================== */
const BroadcastSection: React.FC = () => {
  const [mode, setMode] = useState<'live' | 'notif'>('live');

  // Live event
  const [liveTitle, setLiveTitle] = useState('');
  const [liveSub, setLiveSub] = useState('');
  const [liveIcon, setLiveIcon] = useState('📢');

  // Notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifText, setNotifText] = useState('');
  const [notifIcon, setNotifIcon] = useState('📢');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const sendLive = async () => {
    if (!liveTitle.trim()) return;
    setSending(true); setResult(null);
    const { data: u } = await supabase.auth.getUser();
    const { data: me } = await supabase.from('users').select('username, avatar_url').eq('id', u.user!.id).maybeSingle();
    const { error } = await supabase.from('live_events').insert({
      event_type: 'custom',
      user_id: u.user?.id,
      username: me?.username,
      avatar_url: me?.avatar_url,
      title: liveTitle,
      subtitle: liveSub || null,
      icon: liveIcon,
    });
    setSending(false);
    if (error) setResult('⚠️ ' + error.message);
    else {
      setResult('✅ Эфир показан всем!');
      setLiveTitle(''); setLiveSub('');
      setTimeout(() => setResult(null), 3000);
    }
  };

  const sendNotif = async () => {
    if (!notifTitle.trim()) return;
    setSending(true); setResult(null);
    const { data, error } = await supabase.rpc('broadcast_notification', {
      p_title: notifTitle, p_text: notifText, p_icon: notifIcon,
    });
    setSending(false);
    if (error) setResult('⚠️ ' + error.message);
    else if (data?.ok) {
      setResult(`✅ Уведомление отправлено ${data.sent} пользователям!`);
      setNotifTitle(''); setNotifText('');
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult('⚠️ ' + (data?.error || 'Ошибка'));
    }
  };

  const icons = ['📢', '⚠️', '🎉', '🎁', '🔥', '💎', '🚀', '⭐', '🌙', '📨'];

  return (
    <div className="space-y-4">
      {/* Переключатель режима */}
      <div className="flex gap-2">
        <button onClick={() => setMode('live')}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm ${
            mode === 'live' ? 'bg-purple-600 text-white' : 'bg-bg-card border border-purple-900/30 text-text-secondary'
          }`}>
          📺 Прямой эфир
        </button>
        <button onClick={() => setMode('notif')}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm ${
            mode === 'notif' ? 'bg-purple-600 text-white' : 'bg-bg-card border border-purple-900/30 text-text-secondary'
          }`}>
          🔔 Уведомление всем
        </button>
      </div>

      {mode === 'live' ? (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white mb-1">📺 Кастомный прямой эфир</p>
            <p className="text-xs text-text-secondary">Появится в правом нижнем углу у всех онлайн-пользователей</p>
          </div>

          <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} maxLength={80}
            placeholder="Заголовок (например: Новое обновление!)"
            className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

          <input value={liveSub} onChange={e => setLiveSub(e.target.value)} maxLength={100}
            placeholder="Подзаголовок (необязательно)"
            className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

          <div>
            <p className="text-xs text-text-secondary mb-1">Иконка</p>
            <div className="flex gap-1.5 flex-wrap">
              {icons.map(i => (
                <button key={i} onClick={() => setLiveIcon(i)}
                  className={`w-9 h-9 rounded-lg text-base flex items-center justify-center ${
                    liveIcon === i ? 'bg-purple-600' : 'bg-bg-secondary border border-purple-900/30'
                  }`}>{i}</button>
              ))}
            </div>
          </div>

          <button onClick={sendLive} disabled={sending || !liveTitle.trim()}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={14} /> {sending ? 'Отправка...' : 'Показать в эфире'}
          </button>
        </div>
      ) : (
        <div className="bg-bg-card border border-purple-900/20 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white mb-1">🔔 Массовая рассылка уведомлений</p>
            <p className="text-xs text-text-secondary">Будет отправлено ВСЕМ зарегистрированным пользователям</p>
          </div>

          <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} maxLength={100}
            placeholder="Заголовок уведомления"
            className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm" />

          <textarea value={notifText} onChange={e => setNotifText(e.target.value)} maxLength={300} rows={3}
            placeholder="Текст сообщения"
            className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-purple-900/30 text-white text-sm resize-none" />

          <div>
            <p className="text-xs text-text-secondary mb-1">Иконка</p>
            <div className="flex gap-1.5 flex-wrap">
              {icons.map(i => (
                <button key={i} onClick={() => setNotifIcon(i)}
                  className={`w-9 h-9 rounded-lg text-base flex items-center justify-center ${
                    notifIcon === i ? 'bg-purple-600' : 'bg-bg-secondary border border-purple-900/30'
                  }`}>{i}</button>
              ))}
            </div>
          </div>

          <button onClick={sendNotif} disabled={sending || !notifTitle.trim()}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            <Send size={14} /> {sending ? 'Рассылка...' : 'Отправить всем'}
          </button>
        </div>
      )}

      {result && (
        <div className={`p-3 rounded-xl text-sm text-center ${
          result.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
        }`}>
          {result}
        </div>
      )}
    </div>
  );
};


/* =================== HELPERS =================== */
const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (!role || role === 'user') return null;
  const map: Record<string, { label: string; icon: string; cls: string }> = {
    owner:     { label: 'OWNER', icon: '👑', cls: 'bg-red-900/30 text-red-400 border-red-800/40' },
    admin:     { label: 'ADMIN', icon: '🛡', cls: 'bg-orange-900/30 text-orange-400 border-orange-800/40' },
    moderator: { label: 'MOD',   icon: '⚖️', cls: 'bg-blue-900/30 text-blue-400 border-blue-800/40' },
  };
  const r = map[role];
  if (!r) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border ${r.cls}`}>
      {r.icon} {r.label}
    </span>
  );
};

const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
      onClick={e => e.stopPropagation()}
      className="bg-bg-card border border-purple-900/30 rounded-2xl p-5 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-white"><X size={18} /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export default ModerationPanel;
