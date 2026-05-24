// src/components/GlobalSearch.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Package, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserNav } from '../lib/UserNavContext';
import { dbToAccount } from '../lib/db';
import { Account } from '../types';
import type { Page } from '../types/pages';

interface Props {
  setCurrentPage: (p: Page, filter?: string | null) => void;
  onOpenAccount?: (account: Account) => void;
  onOpenTopic?: (id: string) => void;
}

const GlobalSearch: React.FC<Props> = ({ setCurrentPage, onOpenAccount, onOpenTopic }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ accounts: any[]; users: any[]; topics: any[] }>({ accounts: [], users: [], topics: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { openUser } = useUserNav();

  // Дебаунс поиск
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ accounts: [], users: [], topics: [] });
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const q = `%${query.trim()}%`;
      const [acc, usr, top] = await Promise.all([
        supabase.from('accounts').select('*').ilike('title', q).limit(20),
        supabase.from('users').select('id, username, email, avatar_url, custom_id, role, level')
          .or(`username.ilike.${q},email.ilike.${q},custom_id.ilike.${q}`).limit(20),
        supabase.from('forum_topics').select('id, title, category, author_name, views, likes').ilike('title', q).limit(20),
      ]);

      // Ранжируем — чем ближе к началу строки и чем короче, тем выше
      const score = (haystack: string | undefined | null) => {
        if (!haystack) return 9999;
        const h = haystack.toLowerCase();
        const needle = query.trim().toLowerCase();
        if (h === needle) return 0;
        if (h.startsWith(needle)) return 1;
        const idx = h.indexOf(needle);
        return idx === -1 ? 9999 : 10 + idx + Math.abs(h.length - needle.length) * 0.01;
      };

      const sortedAccounts = (acc.data || []).sort((a: any, b: any) => score(a.title) - score(b.title)).slice(0, 5);
      const sortedUsers = (usr.data || []).sort((a: any, b: any) => {
        const sa = Math.min(score(a.username), score(a.email), score(a.custom_id));
        const sb = Math.min(score(b.username), score(b.email), score(b.custom_id));
        return sa - sb;
      }).slice(0, 5);
      const sortedTopics = (top.data || []).sort((a: any, b: any) => score(a.title) - score(b.title)).slice(0, 5);

      setResults({
        accounts: sortedAccounts,
        users:    sortedUsers,
        topics:   sortedTopics,
      });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Клик вне
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const close = () => { setOpen(false); setQuery(''); };

  const total = results.accounts.length + results.users.length + results.topics.length;

  return (
    <div className="flex-1 max-w-xl mx-auto relative" ref={ref}>
      <div className="flex items-center bg-bg-secondary border border-purple-900/30 rounded-xl overflow-hidden hover:border-purple-700/50">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск товаров, людей, тем..."
          className="flex-1 px-4 py-2 bg-transparent border-none text-sm text-text-primary placeholder:text-text-secondary min-w-0"
          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="p-2 text-text-secondary hover:text-white">
            <X size={14} />
          </button>
        )}
        <button className="p-2 text-text-secondary">
          <Search size={16} />
        </button>
      </div>

      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-purple-900/30 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-text-secondary text-sm">Поиск...</div>
            ) : total === 0 ? (
              <div className="p-4 text-center text-text-secondary text-sm">Ничего не найдено</div>
            ) : (
              <>
                {/* Товары */}
                {results.accounts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-purple-300 font-bold bg-purple-900/20 flex items-center gap-2">
                      <Package size={11} /> Товары ({results.accounts.length})
                    </div>
                    {results.accounts.map(a => (
                      <button key={a.id}
                        onClick={() => { onOpenAccount?.(dbToAccount(a)); setCurrentPage('product'); close(); }}
                        className="w-full p-3 text-left hover:bg-purple-900/10 flex items-center gap-3 border-b border-purple-900/10">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center flex-shrink-0">
                          📦
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                          <p className="text-xs text-text-secondary">{a.category} · {a.price?.toLocaleString('ru-RU')} ₽</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Пользователи */}
                {results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-purple-300 font-bold bg-purple-900/20 flex items-center gap-2">
                      <Users size={11} /> Пользователи ({results.users.length})
                    </div>
                    {results.users.map(u => (
                      <button key={u.id}
                        onClick={() => { openUser(u.id); close(); }}
                        className="w-full p-3 text-left hover:bg-purple-900/10 flex items-center gap-3 border-b border-purple-900/10">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xs font-bold text-white">{(u.username?.[0] || 'U').toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.username || u.email}</p>
                          <p className="text-xs text-purple-300 font-mono">#{u.custom_id || u.id?.slice(0, 8)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Темы */}
                {results.topics.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-purple-300 font-bold bg-purple-900/20 flex items-center gap-2">
                      <MessageSquare size={11} /> Темы ({results.topics.length})
                    </div>
                    {results.topics.map(t => (
                      <button key={t.id}
                        onClick={() => { onOpenTopic?.(t.id); close(); }}
                        className="w-full p-3 text-left hover:bg-purple-900/10 flex items-center gap-3 border-b border-purple-900/10">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-900 to-cyan-700 flex items-center justify-center flex-shrink-0">
                          💬
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                          <p className="text-xs text-text-secondary">{t.category} · 👁 {t.views || 0} · 👍 {t.likes || 0}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
