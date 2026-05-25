import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Package, Receipt, Ticket, BarChart3,
  Search, Ban, VolumeX, AlertTriangle, CheckCircle2, XCircle,
  Trash2, Edit3, MessageSquare, RotateCcw, ArrowRight, X,
  Crown, Settings as SettingsIcon, RefreshCw
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
        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
          myRole === 'owner' ? 'bg-red-900/30 text-red-400' :
          myRole === 'admin' ? 'bg-orange-900/30 text-orange-400' :
          'bg-blue-900/30 text-blue-400'
        }`}>
          {myRole === 'owner' ? '👑 OWNER' : myRole === 'admin' ? '🛡 ADMIN' : '⚖️ MOD'}
        </span>
      </div>

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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* =================== 4. ТОВАРЫ (с кнопкой проверки изменений) =================== */
const ProductsSection: React.FC<{ onNavigate?: Props['onNavigate'] }> = ({ onNavigate }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [editMsg, setEditMsg] = useState<{ id: string; text: string } | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

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

  // === НОВАЯ ФУНКЦИЯ: Проверка изменений ===
  const checkAccountChanges = async (productId: string) => {
    setChecking(productId);
    
    setTimeout(() => {
      alert(`Проверка изменений для товара #${productId.slice(0, 8)}\n\n(В будущем здесь будет результат проверки почты и пароля)`);
      setChecking(null);
    }, 800);
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
                  
                  {/* === НОВАЯ КНОПКА: Проверить изменения === */}
                  <button 
                    onClick={() => checkAccountChanges(p.id)} 
                    disabled={checking === p.id}
                    className="p-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 rounded-lg disabled:opacity-50"
                    title="Проверить изменения аккаунта"
                  >
                    {checking === p.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  </button>

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

export default ModerationPanel;
