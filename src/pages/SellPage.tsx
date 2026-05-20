import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Shield, Zap, CheckCircle2, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';

const SellPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    price: '',
    country: '',
    lastLogin: '',
    gamesCount: '',
    hasOriginalEmail: false,
    hasTempEmail: false,
    guarantee: true,
    guaranteeHours: '24',
    escrow: true,
    riskLevel: 'low',
  });

  const set = (k: string, v: any) => setFormData({ ...formData, [k]: v });

  const handleSubmit = async () => {
    setError(null);

    if (!formData.title || !formData.price || !formData.category) {
      setError('Заполните название, категорию и цену');
      return;
    }

    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setError('Войдите в систему');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('accounts').insert({
        seller_id: u.user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        price: parseInt(formData.price),
        country: formData.country,
        last_login: formData.lastLogin,
        games_count: formData.gamesCount ? parseInt(formData.gamesCount) : null,
        has_original_email: formData.hasOriginalEmail,
        has_temp_email: formData.hasTempEmail,
        guarantee: formData.guarantee,
        guarantee_hours: parseInt(formData.guaranteeHours),
        escrow: formData.escrow,
        risk_level: formData.riskLevel,
        status: 'active',
      });

      if (insertError) throw insertError;

      setSuccess(true);
      // Сброс через 3 секунды
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({
          category: '', subcategory: '', title: '', description: '', price: '',
          country: '', lastLogin: '', gamesCount: '', hasOriginalEmail: false,
          hasTempEmail: false, guarantee: true, guaranteeHours: '24',
          escrow: true, riskLevel: 'low',
        });
      }, 2500);
    } catch (e: any) {
      setError(e.message || 'Ошибка публикации');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = categories.find(c => c.id === formData.category);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-bg-card border border-success/30 rounded-2xl p-12 text-center"
      >
        <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Аккаунт опубликован! 🎉</h2>
        <p className="text-text-secondary">Скоро появится в маркете</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Package size={24} className="text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-white">Выставить аккаунт</h1>
          <p className="text-sm text-text-secondary">Шаг {step} из 3</p>
        </div>
      </motion.div>

      {/* Прогресс */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(n => (
          <div
            key={n}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              n <= step ? 'bg-accent' : 'bg-purple-900/30'
            }`}
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-4"
      >

        {/* === ШАГ 1: Категория и заголовок === */}
        {step === 1 && (
          <>
            <h2 className="text-base font-semibold text-white mb-2">Основная информация</h2>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Категория</label>
              <select
                value={formData.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              >
                <option value="">Выберите категорию</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {currentCategory?.subcategories && (
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Подкатегория</label>
                <select
                  value={formData.subcategory}
                  onChange={e => set('subcategory', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                >
                  <option value="">— Любая —</option>
                  {currentCategory.subcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Название аккаунта</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Например: Steam аккаунт с CS2 + 50 играми"
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Описание</label>
              <textarea
                value={formData.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
                placeholder="Опишите аккаунт подробнее..."
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white resize-none"
              />
            </div>
          </>
        )}

        {/* === ШАГ 2: Детали === */}
        {step === 2 && (
          <>
            <h2 className="text-base font-semibold text-white mb-2">Детали и цена</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Цена, ₽</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="1000"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Страна</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => set('country', e.target.value)}
                  placeholder="Россия"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Кол-во игр</label>
                <input
                  type="number"
                  value={formData.gamesCount}
                  onChange={e => set('gamesCount', e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Последний вход</label>
                <input
                  type="text"
                  value={formData.lastLogin}
                  onChange={e => set('lastLogin', e.target.value)}
                  placeholder="2 дня назад"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.hasOriginalEmail} onChange={e => set('hasOriginalEmail', e.target.checked)} className="accent-purple-500" />
                <span className="text-sm text-white">Оригинальная почта</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.hasTempEmail} onChange={e => set('hasTempEmail', e.target.checked)} className="accent-purple-500" />
                <span className="text-sm text-white">Временная почта</span>
              </label>
            </div>
          </>
        )}

        {/* === ШАГ 3: Защита === */}
        {step === 3 && (
          <>
            <h2 className="text-base font-semibold text-white mb-2">Защита покупателя</h2>

            <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-success" />
                  <div>
                    <p className="text-sm font-semibold text-white">Гарантия</p>
                    <p className="text-xs text-text-secondary">Замена/возврат в случае проблем</p>
                  </div>
                </div>
                <input type="checkbox" checked={formData.guarantee} onChange={e => set('guarantee', e.target.checked)} className="accent-purple-500 w-4 h-4" />
              </label>
              {formData.guarantee && (
                <div className="mt-3">
                  <label className="text-xs text-text-secondary mb-1.5 block">Срок гарантии (часы)</label>
                  <select
                    value={formData.guaranteeHours}
                    onChange={e => set('guaranteeHours', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white"
                  >
                    <option value="1">1 час</option>
                    <option value="24">24 часа</option>
                    <option value="72">3 дня</option>
                    <option value="168">7 дней</option>
                  </select>
                </div>
              )}
            </div>

            <div className="bg-bg-secondary border border-purple-900/20 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-white">Эскроу</p>
                    <p className="text-xs text-text-secondary">Безопасная сделка через площадку</p>
                  </div>
                </div>
                <input type="checkbox" checked={formData.escrow} onChange={e => set('escrow', e.target.checked)} className="accent-purple-500 w-4 h-4" />
              </label>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Уровень риска (для покупателя)</label>
              <select
                value={formData.riskLevel}
                onChange={e => set('riskLevel', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white"
              >
                <option value="low">Низкий — проверенный аккаунт</option>
                <option value="medium">Средний — могут быть нюансы</option>
                <option value="high">Высокий — на свой страх</option>
              </select>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg bg-error/10 text-error">⚠️ {error}</div>
            )}
          </>
        )}

        {/* Кнопки навигации */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-900/20">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-900/20 text-white rounded-xl text-sm hover:bg-purple-900/40"
            >
              <ArrowLeft size={14} /> Назад
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold"
            >
              Далее <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Публикация...' : <>Опубликовать <CheckCircle2 size={14} /></>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SellPage;
