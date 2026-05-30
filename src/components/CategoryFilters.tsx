// src/components/CategoryFilters.tsx
import React from 'react';

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
              const listId = `filter-${f.key}-${gi}`;
              const cur = values[f.key] || '';
              return (
                <div key={f.key}>
                  <label className="text-[11px] text-text-secondary mb-1 block">{f.label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      list={listId}
                      value={cur}
                      onChange={e => onChange(set(values, f.key, e.target.value))}
                      placeholder="— любой — / начните вводить"
                      className="w-full px-2 py-1.5 pr-7 bg-bg-card border border-purple-900/30 rounded-md text-xs text-white placeholder:text-text-secondary focus:border-accent focus:outline-none"
                    />
                    {cur && (
                      <button
                        type="button"
                        onClick={() => onChange(set(values, f.key, ''))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white text-xs"
                        title="Очистить"
                      >
                        ×
                      </button>
                    )}
                    <datalist id={listId}>
                      {f.options.map(o => <option key={o} value={o} />)}
                    </datalist>
                  </div>
                  {f.options.length > 12 && (
                    <p className="text-[9px] text-text-secondary mt-1">
                      💡 Можно печатать для поиска по списку
                    </p>
                  )}
                </div>
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
