import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, Zap, CheckCircle2, Info, AlertCircle, ArrowLeft } from 'lucide-react';
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

  const steps = ['Категория', 'Информация', 'Цена и гарантия', 'Публикация'];

  const handleNext = () => {
    setError(null);
    // Валидация шагов
    if (step === 1 && !formData.category) {
      setError('Выберите категорию');
      return;
    }
    if (step === 2 && (!formData.title || !formData.description)) {
      setError('Заполните название и описание');
      return;
    }
    if (step === 3 && !formData.price) {
      setError('Укажите цену');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handlePublish = async () => {
    setError(null);
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
        subcategory: formData.subcategory || null,
        price: parseInt(formData.price),
        country: formData.country || null,
        last_login: formData.lastLogin || null,
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

  /* ============ Экран успеха ============ */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-bg-card border border-success/30 rounded-2xl p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 size={48} className="text-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Аккаунт опубликован! 🎉</h2>
        <p className="text-text-secondary">Скоро появится в маркете</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-2">Продать аккаунт</h1>
        <p className="text-text-secondary text-sm">
          Заполните информацию о вашем аккаунте для размещения на маркетплейсе
        </p>
      </motion.div>

      {/* Steps — круглый степер */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-8"
      >
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  scale: i + 1 === step ? 1.1 : 1,
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i + 1 < step ? 'bg-success text-white' :
                  i + 1 === step ? 'bg-accent text-white shadow-[0_0_20px_rgba(138,43,226,0.5)]' :
                  'bg-purple-900/20 text-text-secondary'
                }`}>
                {i + 1 < step ? <CheckCircle2 size={16} /> : i + 1}
              </motion.div>
              <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-accent-soft' : 'text-text-secondary'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 rounded transition-all ${i + 1 < step ? 'bg-accent' : 'bg-purple-900/20'}`} />
            )}
          </React.Fragment>
        ))}
      </motion.div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
        >

          {/* === ШАГ 1: Категория (плитки) === */}
          {step === 1 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Выберите категорию</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <motion.button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id, subcategory: '' })}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      formData.category === cat.id
                        ? 'border-accent bg-purple-900/30 text-accent-soft'
                        : 'border-purple-900/20 bg-bg-secondary text-text-secondary hover:border-purple-700/40'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{cat.icon}</span>
                    <span className="text-sm font-medium block">{cat.name}</span>
                    <p className="text-xs text-text-secondary mt-0.5">{cat.count} товаров</p>
                  </motion.button>
                ))}
              </div>

              {/* Подкатегория */}
              {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <label className="text-sm text-text-secondary mb-2 block">Подкатегория (необязательно)</label>
                  <div className="flex flex-wrap gap-2">
                    {currentCategory.subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setFormData({ ...formData, subcategory: formData.subcategory === sub ? '' : sub })}
                        className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                          formData.subcategory === sub
                            ? 'border-accent bg-purple-900/30 text-accent-soft'
                            : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* === ШАГ 2: Информация === */}
          {step === 2 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Информация об аккаунте</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Название объявления *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Steam Prime | CS2 | 2000 часов"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Описание *</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Подробно опишите аккаунт..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-1.5 block">Страна аккаунта</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Россия"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-1.5 block">Последний вход</label>
                    <input
                      type="text"
                      value={formData.lastLogin}
                      onChange={e => setFormData({ ...formData, lastLogin: e.target.value })}
                      placeholder="1 день назад"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Количество игр (необязательно)</label>
                  <input
                    type="number"
                    value={formData.gamesCount}
                    onChange={e => setFormData({ ...formData, gamesCount: e.target.value })}
                    placeholder="50"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Родная почта</label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, hasOriginalEmail: !formData.hasOriginalEmail })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasOriginalEmail ? 'bg-accent' : 'bg-purple-900/40'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasOriginalEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className="text-sm text-text-secondary">{formData.hasOriginalEmail ? 'Есть' : 'Нет'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Временная почта</label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, hasTempEmail: !formData.hasTempEmail })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasTempEmail ? 'bg-accent' : 'bg-purple-900/40'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasTempEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className="text-sm text-text-secondary">{formData.hasTempEmail ? 'Есть' : 'Нет'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === ШАГ 3: Цена и гарантия === */}
          {step === 3 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Цена и гарантия</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Цена (₽) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl text-sm pr-10 bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">₽</span>
                  </div>
                  {formData.price && parseInt(formData.price) > 0 && (
                    <p className="text-xs text-text-secondary mt-1.5">
                      Вы получите: <span className="text-success font-semibold">{Math.round(parseInt(formData.price) * 0.92).toLocaleString()} ₽</span>
                      {' '}(комиссия 8%)
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Гарантия возврата</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      onClick={() => setFormData({ ...formData, guarantee: !formData.guarantee })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.guarantee ? 'bg-accent' : 'bg-purple-900/40'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.guarantee ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm text-text-secondary">Предоставить гарантию</span>
                  </div>
                  {formData.guarantee && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-2"
                    >
                      {['12', '24', '48', '72'].map(h => (
                        <button
                          key={h}
                          onClick={() => setFormData({ ...formData, guaranteeHours: h })}
                          className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                            formData.guaranteeHours === h
                              ? 'border-accent bg-purple-900/30 text-accent-soft'
                              : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                          }`}
                        >
                          {h}ч
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Escrow защита</label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setFormData({ ...formData, escrow: !formData.escrow })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.escrow ? 'bg-accent' : 'bg-purple-900/40'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.escrow ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm text-text-secondary">Использовать Escrow</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Уровень риска для покупателя</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low', label: 'Низкий', color: 'green', desc: 'Проверенный' },
                      { id: 'medium', label: 'Средний', color: 'yellow', desc: 'Есть нюансы' },
                      { id: 'high', label: 'Высокий', color: 'red', desc: 'На свой страх' },
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setFormData({ ...formData, riskLevel: r.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.riskLevel === r.id
                            ? `border-${r.color}-500/50 bg-${r.color}-900/20`
                            : 'border-purple-900/20 hover:border-purple-700/40'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          formData.riskLevel === r.id
                            ? r.id === 'low' ? 'text-green-400' : r.id === 'medium' ? 'text-yellow-400' : 'text-red-400'
                            : 'text-text-secondary'
                        }`}>{r.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-3 flex items-start gap-2">
                  <Info size={14} className="text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-text-secondary">
                    Аккаунты с гарантией и Escrow защитой продаются на 40% быстрее и получают лучшие позиции в поиске
                  </p>
                </div>
              </div>
            </>
          )}

          {/* === ШАГ 4: Подтверждение === */}
          {step === 4 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Готово к публикации!</h3>
              <div className="space-y-1">
                {[
                  { label: 'Категория', value: currentCategory?.name || formData.category || 'Не выбрана' },
                  { label: 'Подкатегория', value: formData.subcategory || '—' },
                  { label: 'Название', value: formData.title || 'Не заполнено' },
                  { label: 'Цена', value: formData.price ? `${parseInt(formData.price).toLocaleString()} ₽` : 'Не указана' },
                  { label: 'Вы получите', value: formData.price ? `${Math.round(parseInt(formData.price) * 0.92).toLocaleString()} ₽` : '—' },
                  { label: 'Гарантия', value: formData.guarantee ? `${formData.guaranteeHours}ч` : 'Нет' },
                  { label: 'Escrow', value: formData.escrow ? 'Активна' : 'Нет' },
                  { label: 'Родная почта', value: formData.hasOriginalEmail ? 'Есть' : 'Нет' },
                  { label: 'Уровень риска', value: { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[formData.riskLevel] || formData.riskLevel },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-purple-900/10">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <span className="text-sm font-medium text-text-primary text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-accent" />
                  <span className="text-sm font-semibold text-text-primary">AI проверка</span>
                </div>
                <p className="text-xs text-text-secondary">
                  После публикации ваш аккаунт будет проверен AI системой оценки риска.
                </p>
              </div>
            </>
          )}

          {/* Ошибка */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <motion.button
          onClick={handleBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-5 py-2.5 rounded-xl text-sm border border-purple-900/20 text-text-secondary hover:text-text-primary hover:border-purple-700/40 transition-all flex items-center gap-2 ${
            step === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={step === 1}
        >
          <ArrowLeft size={14} />
          Назад
        </motion.button>

        <motion.button
          onClick={step === 4 ? handlePublish : handleNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-accent hover:bg-accent-hover text-white disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.3)]"
        >
          {step === 4 ? (
            submitting ? (
              <>Публикация...</>
            ) : (
              <>
                <Zap size={16} />
                Опубликовать
              </>
            )
          ) : (
            <>
              Далее
              <ChevronDown size={16} className="-rotate-90" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SellPage;
