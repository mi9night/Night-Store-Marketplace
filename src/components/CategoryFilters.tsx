// src/components/CategoryFilters.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type FilterField =
  | { type: 'range';  key: string; label: string; suffix?: string; unit?: 'days' | 'years' | null }
  | { type: 'number'; key: string; label: string; suffix?: string }
  | { type: 'text';   key: string; label: string }
  | { type: 'radio';  key: string; label: string; options?: string[] }   // По умолчанию [Не важно, Нет, Да]
  | { type: 'check';  key: string; label: string }
  | { type: 'select'; key: string; label: string; options: string[] };

export interface FilterGroup {
  title?: string;
  fields: FilterField[];
}

interface Props {
  groups: FilterGroup[];
  values: Record<string, any>;
  onChange: (newValues: Record<string, any>) => void;
}

const set = (vals: Record<string, any>, key: string, v: any) => ({ ...vals, [key]: v });

interface SearchableSelectProps {
  fieldKey: string;
  label: string;
  options: string[];
  value: string;
  values: Record<string, any>;
  onChange: (newValues: Record<string, any>) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ fieldKey, label, options, value, values, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const unique = Array.from(new Set(options));
    if (!q) return unique.slice(0, 80);
    return unique
      .filter(o => o.toLowerCase().includes(q))
      .sort((a, b) => {
        const al = a.toLowerCase();
        const bl = b.toLowerCase();
        const ap = al.startsWith(q) ? 0 : 1;
        const bp = bl.startsWith(q) ? 0 : 1;
        return ap - bp || a.localeCompare(b, 'ru');
      })
      .slice(0, 80);
  }, [options, query]);

  const commit = (v: string) => {
    setQuery(v);
    onChange(set(values, fieldKey, v));
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="text-[11px] text-text-secondary mb-1 block">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            onChange(set(values, fieldKey, e.target.value));
            setOpen(true);
          }}
          placeholder="Начните вводить для поиска..."
          className="w-full px-2 py-1.5 pr-8 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white placeholder:text-text-secondary focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange(set(values, fieldKey, ''));
              setOpen(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white text-xs"
            title="Очистить"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[220] overflow-hidden rounded-xl border border-purple-800/40 bg-[#171425] shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_24px_rgba(139,92,246,0.14)]">
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length > 0 ? filtered.map(option => {
              const active = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { commit(option); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-purple-600/30 text-white border border-purple-500/40'
                      : 'text-text-secondary hover:text-white hover:bg-purple-900/20'
                  }`}
                >
                  {option}
                </button>
              );
            }) : (
              <div className="px-3 py-3 text-xs text-text-secondary text-center">
                Ничего не найдено · можно оставить свой вариант
              </div>
            )}
          </div>
          <div className="border-t border-purple-900/20 px-3 py-2 text-[10px] text-text-secondary bg-[#0B0A12]/60">
            Можно выбрать из списка или ввести свой вариант
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryFilters: React.FC<Props> = ({ groups, values, onChange }) => {
  const RadioBar: React.FC<{ k: string; opts?: string[] }> = ({ k, opts }) => {
    const options = opts || ['Не важно', 'Нет', 'Да'];
    const cur = values[k] || options[0];
    return (
      <div className="flex bg-bg-card rounded-lg p-0.5 gap-0.5">
        {options.map(o => (
          <button key={o} onClick={() => onChange(set(values, k, o))}
            className={`flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
              cur === o ? 'bg-green-700/40 text-green-300' : 'text-text-secondary hover:text-white'
            }`}>
            {o}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={groups.length > 1 ? "space-y-3" : "space-y-2"}>
      {groups.map((g, gi) => (
        <div key={gi} className={g.title ? "bg-bg-secondary border border-purple-900/20 rounded-xl p-3 space-y-2" : "space-y-2"}>
          {g.title && (
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{g.title}</p>
          )}
          {g.fields.map(f => {
            if (f.type === 'range') {
              return (
                <div key={f.key}>
                  <label className="text-[11px] text-text-secondary mb-1 block">{f.label}</label>
                  <div className="flex gap-1.5">
                    <input type="number" placeholder="от"
                      value={values[f.key + '_from'] || ''}
                      onChange={e => onChange(set(values, f.key + '_from', e.target.value))}
                      className="flex-1 px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                    <input type="number" placeholder="до"
                      value={values[f.key + '_to'] || ''}
                      onChange={e => onChange(set(values, f.key + '_to', e.target.value))}
                      className="flex-1 px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                    {f.suffix && <span className="text-xs text-text-secondary self-center px-1">{f.suffix}</span>}
                  </div>
                </div>
              );
            }
            if (f.type === 'number') {
              return (
                <div key={f.key}>
                  <label className="text-[11px] text-text-secondary mb-1 block">{f.label}</label>
                  <input type="number" placeholder="X"
                    value={values[f.key] || ''}
                    onChange={e => onChange(set(values, f.key, e.target.value))}
                    className="w-full px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                </div>
              );
            }
            if (f.type === 'text') {
              return (
                <div key={f.key}>
                  <label className="text-[11px] text-text-secondary mb-1 block">{f.label}</label>
                  <input type="text"
                    value={values[f.key] || ''}
                    onChange={e => onChange(set(values, f.key, e.target.value))}
                    className="w-full px-2 py-1.5 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white" />
                </div>
              );
            }
            if (f.type === 'radio') {
              return (
                <div key={f.key}>
                  <label className="text-[11px] text-text-secondary mb-1 block">{f.label}</label>
                  <RadioBar k={f.key} opts={f.options} />
                </div>
              );
            }
            if (f.type === 'check') {
              return (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer p-2 bg-bg-card rounded-md">
                  <input type="checkbox"
                    checked={!!values[f.key]}
                    onChange={e => onChange(set(values, f.key, e.target.checked))}
                    className="accent-purple-500 w-4 h-4" />
                  <span className="text-xs text-white">{f.label}</span>
                </label>
              );
            }
            if (f.type === 'select') {
              return (
                <SearchableSelect
                  key={f.key}
                  fieldKey={f.key}
                  label={f.label}
                  options={f.options}
                  value={values[f.key] || ''}
                  values={values}
                  onChange={onChange}
                />
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilters;
