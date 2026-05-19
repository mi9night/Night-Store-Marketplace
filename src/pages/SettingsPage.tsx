import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Shield, Bell, Palette, Key, CreditCard,
  Globe, Eye, EyeOff, Save, Smartphone
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    purchases: true, sales: true, messages: true, promo: false, system: true,
  });
  const [twoFactor, setTwoFactor] = useState(false);

  const sections = [
    { id: 'profile', label: 'Профиль', icon: Settings },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'appearance', label: 'Внешний вид', icon: Palette },
    { id: 'payments', label: 'Оплата', icon: CreditCard },
    { id: 'api', label: 'API', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Settings size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">Настройки</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-bg-card border border-purple-900/20 rounded-2xl p-3 h-fit"
        >
          {sections.map(section => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              whileHover={{ x: 2 }}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm ${
                activeSection === section.id ? 'sidebar-item-active' : 'text-text-secondary'
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
        >
          {activeSection === 'profile' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Данные профиля</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Имя пользователя', placeholder: 'DarkHunter_X', type: 'text' },
                  { label: 'Email', placeholder: 'darkhunter@nightstore.io', type: 'email' },
                  { label: 'Telegram', placeholder: '@username', type: 'text' },
                  { label: 'Discord', placeholder: 'user#1234', type: 'text' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-sm text-text-secondary mb-1.5 block">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">О себе</label>
                <textarea
                  rows={3}
                  placeholder="Расскажите о себе..."
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Язык интерфейса</label>
                <div className="flex items-center gap-2">
                  {['🇷🇺 Русский', '🇺🇸 English', '🇩🇪 Deutsch'].map(lang => (
                    <button
                      key={lang}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                        lang.includes('Русский')
                          ? 'border-accent bg-purple-900/30 text-accent-soft'
                          : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Безопасность</h3>
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Новый пароль</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Подтвердить пароль</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm" />
                </div>
              </div>

              <div className="border-t border-purple-900/20 pt-5">
                <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Smartphone size={16} className="text-accent" />
                  Двухфакторная аутентификация
                </h4>
                <div className="flex items-center justify-between p-4 bg-bg-primary rounded-xl border border-purple-900/20">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Google Authenticator</p>
                    <p className="text-xs text-text-secondary">Дополнительный слой защиты для вашего аккаунта</p>
                  </div>
                  <div
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${twoFactor ? 'bg-accent' : 'bg-purple-900/40'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${twoFactor ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Globe size={16} className="text-accent" />
                  Активные сессии
                </h4>
                {[
                  { device: 'Chrome / Windows 11', location: 'Москва, Россия', time: 'Сейчас', current: true },
                  { device: 'Safari / iPhone 15', location: 'Санкт-Петербург', time: '2 часа назад', current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-purple-900/10 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-success' : 'bg-gray-500'}`} />
                      <div>
                        <p className="text-sm text-text-primary">{session.device}</p>
                        <p className="text-xs text-text-secondary">{session.location} • {session.time}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-xs text-error hover:text-red-400 transition-colors">Завершить</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Уведомления</h3>
              <div className="space-y-3">
                {[
                  { key: 'purchases' as keyof typeof notifications, label: 'Покупки', desc: 'Уведомления о совершённых покупках' },
                  { key: 'sales' as keyof typeof notifications, label: 'Продажи', desc: 'Уведомления о продажах ваших аккаунтов' },
                  { key: 'messages' as keyof typeof notifications, label: 'Сообщения', desc: 'Новые сообщения от продавцов и покупателей' },
                  { key: 'promo' as keyof typeof notifications, label: 'Акции и скидки', desc: 'Промо-акции и специальные предложения' },
                  { key: 'system' as keyof typeof notifications, label: 'Системные', desc: 'Важные уведомления безопасности' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-bg-primary rounded-xl border border-purple-900/20">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-secondary">{item.desc}</p>
                    </div>
                    <div
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${notifications[item.key] ? 'bg-accent' : 'bg-purple-900/40'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifications[item.key] ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Внешний вид</h3>
              <div>
                <label className="text-sm text-text-secondary mb-3 block">Акцентный цвет</label>
                <div className="flex gap-3">
                  {['#8A2BE2', '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === '#8A2BE2' ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-3 block">Размер карточек</label>
                <div className="flex gap-2">
                  {['Компактный', 'Средний', 'Большой'].map(size => (
                    <button
                      key={size}
                      className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                        size === 'Средний'
                          ? 'border-accent bg-purple-900/30 text-accent-soft'
                          : 'border-purple-900/20 text-text-secondary hover:border-purple-700/40'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'api' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">API доступ</h3>
              <div className="bg-bg-primary rounded-xl p-4 border border-purple-900/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-primary">API ключ</span>
                  <button className="text-xs text-accent hover:text-accent-hover transition-colors">Сгенерировать новый</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value="ns_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-mono"
                  />
                  <button className="p-2 bg-accent/20 rounded-xl hover:bg-accent/30 transition-colors">
                    <Eye size={16} className="text-accent" />
                  </button>
                </div>
              </div>
              <div className="bg-bg-primary rounded-xl p-4 border border-purple-900/20">
                <p className="text-sm font-medium text-text-primary mb-2">Документация</p>
                <p className="text-xs text-text-secondary mb-3">Используйте API для автоматизации продаж и управления аккаунтами</p>
                <div className="font-mono text-xs bg-bg-card rounded-lg p-3 text-accent-soft">
                  <p className="text-text-secondary"># Получить список товаров</p>
                  <p>GET https://api.nightstore.io/v1/accounts</p>
                  <p className="text-text-secondary mt-2"># Создать объявление</p>
                  <p>POST https://api.nightstore.io/v1/accounts</p>
                </div>
              </div>
            </>
          )}

          {activeSection === 'payments' && (
            <>
              <h3 className="text-base font-semibold text-text-primary">Способы оплаты</h3>
              <div className="space-y-3">
                {[
                  { name: 'Банковская карта', last4: '4242', icon: '💳', connected: true },
                  { name: 'Qiwi кошелёк', last4: null, icon: '🥝', connected: false },
                  { name: 'Криптовалюта', last4: null, icon: '₿', connected: true },
                  { name: 'ЮMoney', last4: null, icon: '💰', connected: false },
                ].map(method => (
                  <div key={method.name} className="flex items-center justify-between p-4 bg-bg-primary rounded-xl border border-purple-900/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{method.name}</p>
                        {method.last4 && <p className="text-xs text-text-secondary">•••• {method.last4}</p>}
                      </div>
                    </div>
                    <button className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      method.connected
                        ? 'border-success/30 text-success hover:bg-success/10'
                        : 'border-accent/30 text-accent hover:bg-accent/10'
                    }`}>
                      {method.connected ? 'Отключить' : 'Подключить'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Save button */}
          <div className="border-t border-purple-900/20 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Save size={16} />
              Сохранить изменения
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
