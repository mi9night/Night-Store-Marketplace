// src/components/ModerationPanel.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Package, Receipt, Ticket, BarChart3,
  Search, Ban, VolumeX, AlertTriangle, CheckCircle2, XCircle,
  Trash2, Edit3, MessageSquare, RotateCcw, ArrowRight, X,
  Crown, Settings as SettingsIcon, Plus, Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Section = 'tickets' | 'users' | 'operations' | 'products' | 'stats';

interface Props {
  onNavigate?: (page: 'forum' | 'product' | 'profile' | 'topic', payload?: any) => void;
}

const ModerationPanel: React.FC<Props> = ({ onNavigate }) => {
  const [section, setSection] = useState<Section>('tickets');
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

  if (loading) return <div className="text-center py-12 text-text-secondary">Загрузка...</div>;

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
    { id: 'tickets',    label: 'Тикеты',     icon: Ticket },
    { id: 'users',      label: 'Пользователи', icon: Users },
    { id: 'operations', label: 'Финансы',    icon: Receipt },
    { id: 'products',   label: 'Товары',     icon: Package },
    { id: 'stats',      label: 'Статистика', icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">Панель модерации</h2>
        <span className={`px-3 py-1 text-[10px] rounded-full font-bold tracking-widest ${
          myRole === 'owner' ? 'bg-red-900/30 text-red-400 border border-red-500/20' :
          myRole === 'admin' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/20' :
          'bg-blue-900/30 text-blue-400 border border-blue-500/20'
        }`}>
          {myRole === 'owner' ? '👑 OWNER' : myRole === 'admin' ? '🛡 ADMIN' : '⚖️ MOD'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-bg-card border border-purple-900/20 rounded-xl p-1 no-scrollbar">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id as Section)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              section === s.id
                ? 'bg-purple-600/30 text-purple-300 shadow-lg shadow-purple-600/10'
                : 'text-text-secondary hover:text-white hover:bg-purple-900/10'
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
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {section === 'tickets' && <TicketsSection onNavigate={onNavigate} />}
          {section === 'users' && <UsersSection myRole={myRole} />}
          {section === 'operations' && <OperationsSection />}
          {section === 'products' && <ProductsSection onNavigate={onNavigate} />}
          {section === 'stats' && <StatsSection />}
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
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (t: any) => {
    setActiveTicket(t);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const updateStatus = async (status: string, resolution?: string) => {
    if (!activeTicket) return;
    const upd: any = { status, updated_at: new Date().toISOString() };
    if (resolution) upd.resolution = resolution;
    await supabase.from('tickets').update(upd).eq('id', activeTicket.id);
    setActiveTicket({ ...activeTicket, ...upd });
    load();
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: u.user?.id, message: reply }).select().single();
    if (data) setMessages([...messages, data]);
    setReply('');
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => filter === 'not_resolved' ? t.resolution === 'not_resolved' : (t.status === filter || t.resolution === filter));

  if (activeTicket) {
    return (
      <div className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-purple-900/5 border-b border-purple-900/20 flex items-center gap-3">
          <button onClick={() => setActiveTicket(null)} className="p-2 hover:bg-purple-900/20 rounded-lg transition-colors"><ArrowRight size={20} className="rotate-180 text-text-secondary" /></button>
          <div className="flex-1">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center"><Ticket size={16} className="text-accent"/></div>
                <h3 className="font-bold text-white">Тикет #{activeTicket.id.slice(0, 6).toUpperCase()}</h3>
             </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-bg-secondary text-text-secondary border border-purple-900/10 font-bold uppercase">{activeTicket.status}</span>
        </div>

        <div className="p-5 border-b border-purple-900/10 space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] text-text-secondary uppercase font-bold mb-1 opacity-60">Тема</p><p className="text-sm text-white font-medium">{activeTicket.subject}</p></div>
              <div><p className="text-[10px] text-text-secondary uppercase font-bold mb-1 opacity-60">Категория</p><p className="text-sm text-white font-medium">{activeTicket.category}</p></div>
           </div>
           <div><p className="text-[10px] text-text-secondary uppercase font-bold mb-1 opacity-60">Описание</p><p className="text-sm text-text-secondary leading-relaxed bg-bg-secondary/50 p-3 rounded-xl border border-purple-900/10">{activeTicket.description}</p></div>
        </div>

        <div className="p-4 border-b border-purple-900/10 flex gap-2 flex-wrap bg-purple-900/5">
          <button onClick={() => updateStatus('in_progress')} className="px-3 py-1.5 bg-yellow-900/20 text-yellow-400 rounded-lg text-[11px] font-bold border border-yellow-500/20 hover:bg-yellow-900/40 transition-colors">⏳ В работе</button>
          <button onClick={() => updateStatus('open', 'resolved')} className="px-3 py-1.5 bg-green-900/20 text-green-400 rounded-lg text-[11px] font-bold border border-green-500/20 hover:bg-green-900/40 transition-colors">✅ Решено</button>
          <button onClick={() => updateStatus('closed')} className="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-[11px] font-bold border border-purple-900/20 hover:bg-purple-900/10 transition-colors">🔒 Закрыть</button>
        </div>

        <div className="p-5 max-h-[400px] overflow-y-auto space-y-4 bg-[#0B0A12]/50">
          {messages.map(m => (
            <div key={m.id} className="space-y-1">
               <div className="flex items-center justify-between text-[10px] opacity-40 px-1"><span className="font-bold">Менеджер поддержки</span><span>{new Date(m.created_at).toLocaleString('ru-RU')}</span></div>
               <div className="bg-bg-card border border-purple-900/10 p-4 rounded-2xl text-sm text-text-secondary">{m.message}</div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-bg-card border-t border-purple-900/20 flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} placeholder="Напишите ответ..." className="flex-1 bg-bg-secondary border border-purple-900/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
          <button onClick={sendReply} className="px-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all">Отправить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[{id:'all',label:'Все'},{id:'open',label:'Открытые'},{id:'in_progress',label:'В работе'},{id:'resolved',label:'Решено'}].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${filter === f.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-bg-card border-purple-900/20 text-text-secondary hover:border-purple-700/50'}`}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 opacity-50 text-sm">Загрузка тикетов...</div> :
        <div className="grid gap-2">
          {filtered.map(t => (
            <div key={t.id} onClick={() => openTicket(t)} className="bg-bg-card border border-purple-900/10 hover:border-purple-600/40 p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-600/20 transition-colors"><Ticket size={18} className="text-purple-400"/></div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="font-bold text-sm text-white truncate">{t.subject}</span><span className="text-[9px] px-1.5 py-0.5 bg-bg-secondary rounded border border-purple-900/20 text-text-secondary font-bold uppercase">{t.category}</span></div>
                  <p className="text-[11px] text-text-secondary truncate">{t.description}</p>
               </div>
               <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${t.status==='open'?'text-blue-400 bg-blue-900/20':'text-gray-400 bg-gray-900/20'}`}>{t.status.toUpperCase()}</span>
                  <span className="text-[9px] text-text-secondary opacity-40">{new Date(t.created_at).toLocaleDateString()}</span>
               </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
};


/* =================== 2. ПОЛЬЗОВАТЕЛИ =================== */
const UsersSection: React.FC<{ myRole: string }> = ({ myRole }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<any>(null);
  const [modal, setModal] = useState<null | 'punish' | 'role'>(null);
  
  // Custom step input
  const [customAmount, setCustomAmount] = useState<string>('100');

  const search = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').or(`username.ilike.%${query}%,email.ilike.%${query}%`).order('created_at', { ascending: false }).limit(20);
    setUsers(data || []);
    setLoading(false);
  };

  const updateStat = async (field: string, amount: number) => {
    if (!active) return;
    const newVal = (active[field] || 0) + amount;
    const { data, error } = await supabase.rpc('moderate_set_stat', { p_user_id: active.id, p_field: field, p_value: String(newVal) });
    if (!error && data?.ok) setActive({ ...active, [field]: newVal });
  };

  const setVerified = async (v: boolean) => {
    if (!active) return;
    const { error } = await supabase.rpc('moderate_set_stat', { p_user_id: active.id, p_field: 'verified', p_value: String(v) });
    if (!error) setActive({ ...active, verified: v });
  };

  useEffect(() => { search(); }, []);

  if (active) {
    const amt = parseFloat(customAmount) || 0;
    return (
      <div className="space-y-4">
        <button onClick={() => setActive(null)} className="text-xs text-purple-400 font-bold flex items-center gap-1 hover:underline">← НАЗАД К ПОИСКУ</button>
        
        <div className="bg-bg-card border border-purple-900/20 rounded-3xl p-6 shadow-2xl">
           <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-600/20">
                {active.avatar_url ? <img src={active.avatar_url} className="w-full h-full object-cover" /> : <Users size={32} className="text-white"/>}
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1"><h3 className="text-xl font-bold text-white">{active.username || 'Без ника'}</h3><span className="px-2 py-0.5 bg-accent/20 text-accent text-[9px] font-black rounded uppercase tracking-tighter border border-accent/20">{active.role}</span></div>
                 <p className="text-sm text-text-secondary">{active.email}</p>
                 <p className="text-[10px] text-text-secondary font-mono opacity-50 mt-1">#{active.id}</p>
              </div>
           </div>

           <div className="mb-6 p-4 bg-bg-secondary/50 rounded-2xl border border-purple-900/10 flex items-center gap-4">
              <div className="flex-1">
                 <p className="text-[10px] text-text-secondary uppercase font-bold mb-1 opacity-60">Сумма изменения</p>
                 <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="w-full bg-transparent text-xl font-black text-white outline-none" />
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setCustomAmount('100')} className="px-3 py-1 bg-purple-900/30 rounded-lg text-[10px] font-bold text-white border border-purple-900/20">100</button>
                 <button onClick={() => setCustomAmount('1000')} className="px-3 py-1 bg-purple-900/30 rounded-lg text-[10px] font-bold text-white border border-purple-900/20">1K</button>
                 <button onClick={() => setCustomAmount('10000')} className="px-3 py-1 bg-purple-900/30 rounded-lg text-[10px] font-bold text-white border border-purple-900/20">10K</button>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { label: '💰 БАЛАНС', field: 'balance', value: active.balance || 0 },
                { label: '⚡ XP ОПЫТ', field: 'xp', value: active.xp || 0 },
                { label: '📈 УРОВЕНЬ', field: 'level', value: active.level || 1 },
                { label: '🛍 ПРОДАЖИ', field: 'sales', value: active.sales || 0 },
              ].map(s => (
                <div key={s.field} className="bg-bg-secondary p-4 rounded-2xl border border-purple-900/10 flex items-center justify-between">
                   <div><p className="text-[9px] text-text-secondary font-black mb-1">{s.label}</p><p className="text-lg font-bold text-white">{s.value.toLocaleString('ru-RU')}</p></div>
                   <div className="flex gap-1.5">
                      <button onClick={() => updateStat(s.field, -amt)} className="w-8 h-8 rounded-lg bg-red-900/20 text-red-400 flex items-center justify-center hover:bg-red-900/40 transition-colors border border-red-500/10"><Minus size={14}/></button>
                      <button onClick={() => updateStat(s.field, amt)} className="w-8 h-8 rounded-lg bg-green-900/20 text-green-400 flex items-center justify-center hover:bg-green-900/40 transition-colors border border-green-500/10"><Plus size={14}/></button>
                   </div>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setVerified(!active.verified)} className={`py-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${active.verified?'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20':'bg-blue-900/10 border-blue-500/20 text-blue-400 hover:bg-blue-900/20'}`}>
                <CheckCircle2 size={14}/> {active.verified ? 'ВЕРИФИЦИРОВАН' : 'ВЕРИФИЦИРОВАТЬ'}
              </button>
              <button onClick={() => setModal('role')} className="py-3 rounded-2xl bg-purple-900/20 border border-purple-600/20 text-white text-xs font-bold hover:bg-purple-600/20 transition-all flex items-center justify-center gap-2">
                <Crown size={14} className="text-accent-soft" /> СМЕНИТЬ РОЛЬ
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Поиск (Ник или Почта)..." className="flex-1 bg-bg-card border border-purple-900/20 rounded-2xl px-5 py-3 text-white text-sm outline-none shadow-inner" />
        <button onClick={search} className="px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/20 transition-all"><Search size={18}/></button>
      </div>
      <div className="grid gap-2">
         {users.map(u => (
           <div key={u.id} onClick={() => setActive(u)} className="bg-bg-card border border-purple-900/10 hover:border-purple-600/40 p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-xl" /> : <span className="font-bold text-white">{(u.username?.[0] || 'U').toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="font-bold text-sm text-white truncate mb-0.5">{u.username || u.email}</p>
                 <p className="text-[10px] text-text-secondary font-mono opacity-50">#{u.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black text-white">{u.balance?.toLocaleString('ru-RU')} ₽</p>
                 <span className="text-[9px] font-bold text-accent-soft uppercase">{u.role}</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};


/* =================== 3. ФИНАНСЫ =================== */
const OperationsSection: React.FC = () => {
  const [ops, setOps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('operations').select('*').order('created_at', { ascending: false }).limit(50);
      setOps(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      {ops.map(o => (
        <div key={o.id} className="bg-bg-card border border-purple-900/10 p-4 rounded-2xl flex items-center gap-4">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${o.type==='deposit'?'bg-green-900/20 text-green-400':'bg-red-900/20 text-red-400'}`}>
              {o.type==='deposit' ? <Plus size={18}/> : <Minus size={18}/>}
           </div>
           <div className="flex-1">
              <p className="text-sm font-bold text-white">{o.type === 'deposit' ? 'Пополнение баланса' : 'Вывод средств'}</p>
              <p className="text-[10px] text-text-secondary">Сумма: {o.amount} ₽ · Статус: <span className="font-bold">{o.status}</span></p>
           </div>
           <div className="text-right"><p className="text-[10px] text-text-secondary">{new Date(o.created_at).toLocaleDateString()}</p></div>
        </div>
      ))}
    </div>
  );
};

/* =================== 4. ТОВАРЫ =================== */
const ProductsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: false }).limit(20);
      setProducts(data || []);
    };
    load();
  }, []);
  return (
    <div className="grid gap-2">
      {products.map(p => (
        <div key={p.id} className="bg-bg-card border border-purple-900/10 p-4 rounded-2xl flex items-center gap-4">
           <Package size={20} className="text-purple-400"/>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{p.title}</p>
              <p className="text-[10px] text-text-secondary">{p.category} · {p.price} ₽</p>
           </div>
           <button onClick={() => onNavigate?.('product', { id: p.id })} className="p-2 bg-purple-900/20 rounded-lg text-purple-400 hover:bg-purple-600 hover:text-white transition-all"><ArrowRight size={16}/></button>
        </div>
      ))}
    </div>
  );
};

/* =================== 5. СТАТИСТИКА =================== */
const StatsSection: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('moderation_logs').select('*').order('created_at', { ascending: false }).limit(30);
      setLogs(data || []);
    };
    load();
  }, []);

  const translateAction = (action: string) => {
    const map: Record<string, string> = {
      set_verified: 'Верификация пользователя',
      set_balance: 'Изменение баланса',
      set_xp: 'Изменение XP',
      set_level: 'Изменение уровня',
      set_role: 'Смена роли',
      ban: 'Блокировка (БАН)',
      mute: 'Мут (Блокировка чата)',
      warn: 'Предупреждение',
      delete_account: 'Удаление товара',
      op_approve: 'Одобрение выплаты',
      op_reject: 'Отказ в выплате',
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-4">
       <div className="bg-bg-card border border-purple-900/20 rounded-3xl p-6">
          <h4 className="text-sm font-black text-white mb-5 tracking-widest flex items-center gap-2"><BarChart3 size={16} className="text-accent-soft"/> ЖУРНАЛ ДЕЙСТВИЙ</h4>
          <div className="space-y-2">
             {logs.map(l => (
               <div key={l.id} className="bg-bg-secondary/40 border border-purple-900/5 p-4 rounded-2xl flex items-start gap-4">
                  <div className="w-1 h-10 bg-purple-600 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">{translateAction(l.action)}</span>
                        <span className="text-[9px] text-text-secondary opacity-40">{new Date(l.created_at).toLocaleString('ru-RU')}</span>
                     </div>
                     <p className="text-xs text-text-secondary leading-relaxed">{l.details}</p>
                     <p className="text-[9px] text-text-secondary mt-2 font-bold opacity-30 italic">Модератор: {l.moderator_id?.slice(0, 8)}</p>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};


/* =================== HELPERS =================== */
const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-bg-card border border-purple-900/30 rounded-3xl p-6 w-full max-w-md shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-black text-white uppercase tracking-widest">{title}</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-white p-1 hover:bg-purple-900/20 rounded-lg transition-colors"><X size={20} /></button>
      </div>
      {children}
    </motion.div>
  </div>
);

export default ModerationPanel;
