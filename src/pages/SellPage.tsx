import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Shield, Zap, CheckCircle2, AlertCircle, ArrowLeft,
  Mail, Key, Eye, EyeOff, Lock, Plus, Trash2
} from 'lucide-react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';

// ─── Auto risk calculation ─────────────────────────────────────────────────
function calcRiskLevel(form: any): { level: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // No guarantee → +3
  if (!form.guarantee) {
    score += 3;
    reasons.push('Без гарантии');
  }

  // No original email → +2
  if (!form.hasOriginalEmail) {
    score += 2;
    reasons.push('Нет родной почты');
  }

  // No temp email → +1
  if (!form.hasTempEmail && !form.hasOriginalEmail) {
    score += 1;
    reasons.push('Нет привязанной почты');
  }

  // No description or too short → +1
  if (!form.description || form.description.length < 20) {
    score += 1;
    reasons.push('Короткое описание');
  }

  // No games count → +1
  if (!form.gamesCount || parseInt(form.gamesCount) === 0) {
    score += 1;
    reasons.push('Не указано количество игр');
  }

  // Low price (suspiciously cheap) → +1
  if (form.price && parseInt(form.price) < 100) {
    score += 1;
    reasons.push('Очень низкая цена');
  }

  // Short guarantee → +1
  if (form.guarantee && form.guaranteeHours === '12') {
    score += 1;
    reasons.push('Минимальная гарантия (12ч)');
  }

  // No account data → +2
  if (!form.accountData || form.accountData.length === 0) {
    score += 2;
    reasons.push('Нет данных аккаунта');
  }

  if (score >= 5) return { level: 'high', reasons };
  if (score >= 2) return { level: 'medium', reasons };
  return { level: 'low', reasons };
}

const RISK_CONFIG = {
  low:    { label: 'Низкий',  color: 'text-green-400',  bg: 'bg-green-900/20 border-green-700/30', desc: 'Проверенный аккаунт' },
  medium: { label: 'Средний', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/30', desc: 'Есть нюансы' },
  high:   { label: 'Высокий', color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/30', desc: 'Повышенный риск' },
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface AccountDataField {
  key: string;
  value: string;
}

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
    gamesCount: '',
    hasOriginalEmail: false,
    hasTempEmail: false,
    originalEmail: '',
    originalEmailPassword: '',
    tempEmail: '',
    tempEmailPassword: '',
    guarantee: true,
    guaranteeHours: '24',
    // accountData — login/password/extra fields for the buyer
    accountData: [
      { key: 'Логин', value: '' },
      { key: 'Пароль', value: '' },
    ] as AccountDataField[],
  });

  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const steps = ['Категория', 'Информация', 'Цена и гарантия', 'Публикация'];

  // Auto-calculated risk
  const risk = calcRiskLevel(formData);
  const riskCfg = RISK_CONFIG[risk.level];

  const handleNext = () => {
    setError(null);
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

      // Build account data object
      const dataObj: Record<string, string> = {};
      formData.accountData.forEach(f => {
        if (f.key.trim() && f.value.trim()) {
          dataObj[f.key.trim()] = f.value.trim();
        }
      });

      // Add email data if provided
      if (formData.hasOriginalEmail && formData.originalEmail) {
        dataObj['Родная почта'] = formData.originalEmail;
        if (formData.originalEmailPassword) dataObj['Пароль от почты'] = formData.originalEmailPassword;
      }
      if (formData.hasTempEmail && formData.tempEmail) {
        dataObj['Временная почта'] = formData.tempEmail;
        if (formData.tempEmailPassword) dataObj['Пароль от врем. почты'] = formData.tempEmailPassword;
      }

      const { error: insertError } = await supabase.from('accounts').insert({
        seller_id: u.user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        price: parseInt(formData.price),
        games_count: formData.gamesCount ? parseInt(formData.gamesCount) : null,
        has_original_email: formData.hasOriginalEmail,
        has_temp_email: formData.hasTempEmail,
        guarantee: formData.guarantee,
        guarantee_hours: parseInt(formData.guaranteeHours),
        escrow: true, // Always escrow
        risk_level: risk.level, // Auto-calculated
        status: 'active',
        data: Object.keys(dataObj).length > 0 ? dataObj : null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({
          category: '', subcategory: '', title: '', description: '', price: '',
          gamesCount: '', hasOriginalEmail: false, hasTempEmail: false,
          originalEmail: '', originalEmailPassword: '', tempEmail: '', tempEmailPassword: '',
          guarantee: true, guaranteeHours: '24',
          accountData: [{ key: 'Логин', value: '' }, { key: 'Пароль', value: '' }],
        });
      }, 2500);
    } catch (e: any) {
      setError(e.message || 'Ошибка публикации');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = categories.find(c => c.id === formData.category);

  const addDataField = () => {
    setFormData({
      ...formData,
      accountData: [...formData.accountData, { key: '', value: '' }],
    });
  };

  const removeDataField = (idx: number) => {
    setFormData({
      ...formData,
      accountData: formData.accountData.filter((_, i) => i !== idx),
    });
  };

  const updateDataField = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...formData.accountData];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData({ ...formData, accountData: updated });
  };

  /* ============ Success screen ============ */
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Продать аккаунт</h1>
        <p className="text-text-secondary text-sm">
          Заполните информацию о вашем аккаунте для размещения на маркетплейсе
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ scale: i + 1 === step ? 1.1 : 1 }}
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

          {/* === STEP 1: Category === */}
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
                  </motion.button>
                ))}
              </div>

              {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
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

          {/* === STEP 2: Info === */}
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
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white resize-none focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Количество игр (необязательно)</label>
                  <input
                    type="number"
                    value={formData.gamesCount}
                    onChange={e => setFormData({ ...formData, gamesCount: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                {/* Email toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Родная почта</label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, hasOriginalEmail: !formData.hasOriginalEmail, originalEmail: '', originalEmailPassword: '' })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasOriginalEmail ? 'bg-accent' : 'bg-purple-900/40'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasOriginalEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${formData.hasOriginalEmail ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.hasOriginalEmail ? 'Есть' : 'Нет'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary mb-2 block">Временная почта</label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, hasTempEmail: !formData.hasTempEmail, tempEmail: '', tempEmailPassword: '' })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.hasTempEmail ? 'bg-accent' : 'bg-purple-900/40'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.hasTempEmail ? 'left-5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${formData.hasTempEmail ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.hasTempEmail ? 'Есть' : 'Нет'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Original email fields */}
                <AnimatePresence>
                  {formData.hasOriginalEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={14} className="text-green-400" />
                          <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Родная почта</span>
                        </div>
                        <input
                          type="email"
                          value={formData.originalEmail}
                          onChange={e => setFormData({ ...formData, originalEmail: e.target.value })}
                          placeholder="email@example.com"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                        <input
                          type="password"
                          value={formData.originalEmailPassword}
                          onChange={e => setFormData({ ...formData, originalEmailPassword: e.target.value })}
                          placeholder="Пароль от почты"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Temp email fields */}
                <AnimatePresence>
                  {formData.hasTempEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#0B0A12] border border-purple-900/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={14} className="text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Временная почта</span>
                        </div>
                        <input
                          type="email"
                          value={formData.tempEmail}
                          onChange={e => setFormData({ ...formData, tempEmail: e.target.value })}
                          placeholder="temp@mail.com"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                        <input
                          type="password"
                          value={formData.tempEmailPassword}
                          onChange={e => setFormData({ ...formData, tempEmailPassword: e.target.value })}
                          placeholder="Пароль от почты"
                          className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-card border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* === STEP 3: Price & Guarantee === */}
          {step === 3 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Цена и гарантия</h3>
              <div className="space-y-4">
                {/* Price — no commission */}
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
                </div>

                {/* Guarantee */}
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

                  <AnimatePresence mode="wait">
                    {formData.guarantee ? (
                      <motion.div
                        key="hours"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
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
                    ) : (
                      <motion.div
                        key="no-guarantee"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-3 flex items-start gap-2"
                      >
                        <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-400">
                          Гарантия действует только на момент покупки. После получения данных претензии не принимаются.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Account data — real login/password */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Данные аккаунта для покупателя</label>
                  <div className="space-y-2">
                    {formData.accountData.map((field, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={field.key}
                          onChange={e => updateDataField(idx, 'key', e.target.value)}
                          placeholder="Название (Логин, Пароль...)"
                          className="w-1/3 px-3 py-2.5 rounded-lg text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                        <div className="flex-1 relative">
                          <input
                            type={showPasswords[idx] ? 'text' : 'password'}
                            value={field.value}
                            onChange={e => updateDataField(idx, 'value', e.target.value)}
                            placeholder="Значение"
                            className="w-full px-3 py-2.5 pr-9 rounded-lg text-sm bg-bg-secondary border border-purple-900/30 text-white focus:border-accent focus:outline-none transition-colors"
                          />
                          <button
                            onClick={() => setShowPasswords(p => ({ ...p, [idx]: !p[idx] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                          >
                            {showPasswords[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {formData.accountData.length > 1 && (
                          <button
                            onClick={() => removeDataField(idx)}
                            className="p-2 text-text-secondary hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                    <button
                      onClick={addDataField}
                      className="w-full py-2 rounded-lg text-xs font-medium bg-purple-900/20 border border-purple-700/30 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Добавить поле
                    </button>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2 flex items-center gap-1">
                    <Lock size={10} /> Данные зашифрованы и будут доступны только покупателю после оплаты
                  </p>
                </div>

                {/* Auto risk level (read-only) */}
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Уровень риска (определяется автоматически)</label>
                  <div className={`p-3 rounded-xl border ${riskCfg.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className={riskCfg.color} />
                      <span className={`text-sm font-semibold ${riskCfg.color}`}>{riskCfg.label} риск</span>
                    </div>
                    {risk.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {risk.reasons.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-text-secondary">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === STEP 4: Confirmation === */}
          {step === 4 && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Готово к публикации!</h3>
              <div className="space-y-1">
                {[
                  { label: 'Категория', value: currentCategory?.name || formData.category || 'Не выбрана' },
                  { label: 'Подкатегория', value: formData.subcategory || '—' },
                  { label: 'Название', value: formData.title || 'Не заполнено' },
                  { label: 'Цена', value: formData.price ? `${parseInt(formData.price).toLocaleString()} ₽` : 'Не указана' },
                  { label: 'Гарантия', value: formData.guarantee ? `${formData.guaranteeHours}ч` : 'Только на момент покупки' },
                  { label: 'Escrow', value: 'Активна ✅' },
                  { label: 'Родная почта', value: formData.hasOriginalEmail ? `Есть (${formData.originalEmail || '—'})` : 'Нет' },
                  { label: 'Временная почта', value: formData.hasTempEmail ? `Есть (${formData.tempEmail || '—'})` : 'Нет' },
                  { label: 'Данные аккаунта', value: `${formData.accountData.filter(f => f.key && f.value).length} полей` },
                  { label: 'Уровень риска', value: riskCfg.label },
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
                  После публикации ваш аккаунт будет автоматически проверен ботом-валидатором.
                  Результаты проверки отобразятся на странице товара.
                </p>
              </div>
            </>
          )}

          {/* Error */}
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
          <ArrowLeft size={14} /> Назад
        </motion.button>

        <motion.button
          onClick={step === 4 ? handlePublish : handleNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-accent hover:bg-accent-hover text-white disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.3)]"
        >
          {step === 4 ? (
            submitting ? 'Публикация...' : <><Zap size={16} /> Опубликовать</>
          ) : (
            <>Далее <ChevronDown size={16} className="-rotate-90" /></>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SellPage;
