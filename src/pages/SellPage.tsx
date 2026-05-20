import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Shield, Zap, CheckCircle2, Info } from 'lucide-react';
import { categories } from '../data/mockData';

const SellPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
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
  });

  const steps = ['Категория', 'Информация', 'Цена и гарантия', 'Публикация'];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-2">Продать аккаунт</h1>
        <p className="text-text-secondary text-sm">Заполните информацию о вашем аккаунте для размещения на маркетплейсе</p>
      </motion.div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-8"
      >
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i + 1 < step ? 'bg-success text-white' :
                i + 1 === step ? 'bg-accent text-white glow-purple' :
                'bg-purple-900/20 text-text-secondary'
              }`}>
                {i + 1 < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
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
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
      >
        {step === 1 && (
          <>
            <h3 className="text-base font-semibold text-text-primary">Выберите категорию</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <motion.button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    formData.category === cat.id
                      ? 'border-accent bg-purple-900/30 text-accent-soft'
                      : 'border-purple-900/20 bg-bg-primary text-text-secondary hover:border-purple-700/40'
                  }`}
                >
                  <span className="text-2xl block mb-2">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                  <p className="text-xs text-text-secondary mt-0.5">{cat.count} товаров</p>
                </motion.button>
              ))}
            </div>
          </>
        )}

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
                  className="w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Описание *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробно опишите аккаунт..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
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
                    className="w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Последний вход</label>
                  <input
                    type="text"
                    value={formData.lastLogin}
                    onChange={e => setFormData({ ...formData, lastLogin: e.target.value })}
                    placeholder="1 день назад"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
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
                    className="w-full px-4 py-3 rounded-xl text-sm pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">₽</span>
                </div>
                {formData.price && (
                  <p className="text-xs text-text-secondary mt-1.5">
                    Вы получите: <span className="text-success">{Math.round(parseInt(formData.price) * 0.92).toLocaleString()} ₽</span>
                    {' '}(комиссия 8%)
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-2 block">Гарантия возврата</label>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    onClick={() => setFormData({ ...formData, guarantee: !formData.guarantee })}
                    className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${formData.guarantee ? 'bg-accent' : 'bg-purple-900/40'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.guarantee ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-text-secondary">Предоставить гарантию</span>
                </div>
                {formData.guarantee && (
                  <div className="flex gap-2">
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
                  </div>
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

              <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-3 flex items-start gap-2">
                <Info size={14} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-secondary">
                  Аккаунты с гарантией и Escrow защитой продаются на 40% быстрее и получают лучшие позиции в поиске
                </p>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-base font-semibold text-text-primary">Готово к публикации!</h3>
            <div className="space-y-3">
              {[
                { label: 'Категория', value: formData.category || 'Не выбрана' },
                { label: 'Название', value: formData.title || 'Не заполнено' },
                { label: 'Цена', value: formData.price ? `${parseInt(formData.price).toLocaleString()} ₽` : 'Не указана' },
                { label: 'Гарантия', value: formData.guarantee ? `${formData.guaranteeHours}ч` : 'Нет' },
                { label: 'Escrow', value: formData.escrow ? 'Активна' : 'Нет' },
                { label: 'Родная почта', value: formData.hasOriginalEmail ? 'Есть' : 'Нет' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-purple-900/10">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm font-medium text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-purple-900/10 border border-purple-800/20 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-accent" />
                <span className="text-sm font-semibold text-text-primary">AI проверка</span>
              </div>
              <p className="text-xs text-text-secondary">После публикации ваш аккаунт будет проверен AI системой оценки риска.</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <motion.button
          onClick={handleBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-5 py-2.5 rounded-xl text-sm border border-purple-900/20 text-text-secondary hover:text-text-primary hover:border-purple-700/40 transition-all ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={step === 1}
        >
          Назад
        </motion.button>
        <motion.button
          onClick={step === 4 ? undefined : handleNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          {step === 4 ? (
            <>
              <Zap size={16} />
              Опубликовать
            </>
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
