import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Shield, Star,
  Clock, MapPin, Gamepad2, Mail, CheckCircle2, AlertTriangle,
  XCircle, TrendingDown, Users, Eye, Award, MessageSquare,
  Lock, Tag
} from 'lucide-react';
import { Account, Review } from '../types';
import { Page } from '../types/pages';
import { reviews } from '../data/mockData';

interface ProductPageProps {
  account: Account;
  setCurrentPage: (page: Page) => void;
  onAddToCart: (account: Account) => void;
}

const riskConfig = {
  low: { label: 'Низкий риск', className: 'risk-low', Icon: CheckCircle2, desc: 'Аккаунт прошёл AI проверку. Минимальный риск блокировки.' },
  medium: { label: 'Средний риск', className: 'risk-medium', Icon: AlertTriangle, desc: 'Есть некоторые факторы риска. Рекомендуем использовать осторожно.' },
  high: { label: 'Высокий риск', className: 'risk-high', Icon: XCircle, desc: 'Аккаунт имеет признаки возможной блокировки. Покупайте с осторожностью.' },
};

const levelColors = {
  newbie: 'text-gray-400', bronze: 'text-amber-600', silver: 'text-gray-300',
  gold: 'text-yellow-400', platinum: 'text-cyan-400', diamond: 'text-purple-400',
};

const levelLabels = {
  newbie: 'Новичок', bronze: 'Бронза', silver: 'Серебро',
  gold: 'Золото', platinum: 'Платина', diamond: 'Бриллиант 💎',
};

const PriceChart: React.FC<{ data: { date: string; price: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const range = maxPrice - minPrice || 1;
  const isDown = data[data.length - 1].price < data[0].price;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown size={16} className={isDown ? 'text-success' : 'text-error'} />
        <span className="text-sm font-medium text-text-primary">История цены</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isDown ? 'risk-low' : 'risk-high'}`}>
          {isDown ? `↓ -${Math.round((1 - data[data.length-1].price / data[0].price) * 100)}%` : '↑ Рост'}
        </span>
      </div>
      <div className="h-24 flex items-end gap-1">
        {data.map((point, i) => {
          const height = ((point.price - minPrice) / range) * 100;
          const barHeight = Math.max(height, 8);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-primary border border-purple-900/30 rounded px-2 py-1 text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {point.price.toLocaleString()}₽
              </div>
              <div
                className="chart-bar w-full"
                style={{ height: `${barHeight}%` }}
              />
              <span className="text-xs text-text-secondary">{point.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProductPage: React.FC<ProductPageProps> = ({ account, setCurrentPage, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'stats' | 'history'>('reviews');
  const [isFav, setIsFav] = useState(account.isFavorite);
  const risk = riskConfig[account.riskLevel];
  const productReviews = reviews.slice(0, 4);

  const infoItems = [
    { icon: Clock, label: 'Последний вход', value: account.lastLogin },
    { icon: MapPin, label: 'Страна', value: account.country },
    ...(account.gamesCount ? [{ icon: Gamepad2, label: 'Количество игр', value: `${account.gamesCount} игр` }] : []),
    { icon: Mail, label: 'Родная почта', value: account.hasOriginalEmail ? 'Есть ✅' : 'Нет ❌' },
    { icon: Mail, label: 'Временная почта', value: account.hasTempEmail ? 'Есть ✅' : 'Нет ❌' },
    { icon: Shield, label: 'Гарантия', value: account.guarantee ? `${account.guaranteeHours}ч` : 'Нет' },
    { icon: Lock, label: 'Escrow защита', value: account.escrow ? 'Активна' : 'Нет' },
    { icon: Eye, label: 'Просмотров', value: account.views.toLocaleString() },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setCurrentPage('market')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        whileHover={{ x: -2 }}
      >
        <ArrowLeft size={16} />
        Назад к маркету
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-text-secondary bg-purple-900/20 px-2 py-0.5 rounded-full uppercase">
                    {account.category}
                  </span>
                  {account.escrow && (
                    <span className="escrow-badge text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={10} /> Escrow
                    </span>
                  )}
                  {account.guarantee && (
                    <span className="text-xs risk-low px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield size={10} /> {account.guaranteeHours}ч гарантия
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-text-primary leading-snug">{account.title}</h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFav(!isFav)}
              >
                <Heart
                  size={22}
                  className={`transition-all ${isFav ? 'text-red-500 fill-red-500' : 'text-text-secondary hover:text-red-400'}`}
                />
              </motion.button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {account.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs bg-purple-900/20 border border-purple-800/20 text-text-secondary px-3 py-1 rounded-lg">
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </span>
              ))}
            </div>

            {/* AI Risk */}
            <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${risk.className}`}>
              <risk.Icon size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">AI Оценка: {risk.label}</p>
                <p className="text-xs opacity-80 mt-0.5">{risk.desc}</p>
              </div>
            </div>

            {/* Description */}
            {account.description && (
              <p className="text-sm text-text-secondary leading-relaxed">{account.description}</p>
            )}
          </motion.div>

          {/* Info grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Tag size={16} className="text-accent" />
              Параметры аккаунта
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {infoItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-bg-primary rounded-xl p-3 border border-purple-900/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={13} className="text-accent" />
                    <span className="text-xs text-text-secondary">{item.label}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Price chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
          >
            <PriceChart data={account.priceHistory} />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl overflow-hidden"
          >
            <div className="flex border-b border-purple-900/20">
              {[
                { id: 'reviews', label: 'Отзывы', count: account.reviewsCount },
                { id: 'stats', label: 'Статистика', count: null },
                { id: 'history', label: 'История', count: null },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-accent text-accent-soft bg-purple-900/10'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="badge">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-xl">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-text-primary">{account.rating}</p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(account.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                        ))}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{account.reviewsCount} отзывов</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5,4,3,2,1].map(star => {
                        const pct = star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 2 : 2;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary w-4">{star}</span>
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-1.5 bg-purple-900/20 rounded-full overflow-hidden">
                              <div className="progress-bar h-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-text-secondary w-8">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {productReviews.map((review, i) => (
                    <ReviewCard key={review.id} review={review} index={i} />
                  ))}
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Всего продаж', value: account.soldCount, icon: ShoppingCart },
                    { label: 'Просмотров', value: account.views.toLocaleString(), icon: Eye },
                    { label: 'В избранном', value: Math.floor(account.views * 0.08), icon: Heart },
                    { label: 'Добавлено в корзину', value: Math.floor(account.soldCount * 1.4), icon: ShoppingCart },
                  ].map(stat => (
                    <div key={stat.label} className="bg-bg-primary rounded-xl p-4 border border-purple-900/10">
                      <stat.icon size={20} className="text-accent mb-2" />
                      <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                      <p className="text-xs text-text-secondary">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl border border-purple-900/10">
                      <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center">
                        <ShoppingCart size={14} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">Продан пользователю ***{Math.floor(Math.random() * 9000 + 1000)}</p>
                        <p className="text-xs text-text-secondary">{i + 3} дня назад</p>
                      </div>
                      <span className="text-sm font-semibold text-success">+{account.price.toLocaleString()} ₽</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right column - Buy block */}
        <div className="space-y-4">
          {/* Price block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-card border border-purple-900/30 rounded-2xl p-5 sticky top-20"
          >
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary">{account.price.toLocaleString()}</span>
                <span className="text-text-secondary">₽</span>
                {account.oldPrice && (
                  <span className="text-sm text-text-secondary line-through">{account.oldPrice.toLocaleString()} ₽</span>
                )}
              </div>
              {account.oldPrice && (
                <span className="inline-block mt-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">
                  Скидка {Math.round((1 - account.price / account.oldPrice) * 100)}%
                </span>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold"
              >
                <Zap size={18} />
                Быстрая покупка
              </motion.button>
              <motion.button
                onClick={() => onAddToCart(account)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-purple-900/20 border border-purple-800/30 text-text-primary hover:border-accent hover:bg-purple-900/40 transition-all"
              >
                <ShoppingCart size={18} />
                В корзину
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-transparent border border-purple-900/20 text-text-secondary hover:text-text-primary hover:border-purple-700/40 transition-all text-sm"
              >
                <Tag size={16} />
                Хочу скидку
              </motion.button>
            </div>

            <div className="space-y-2 pt-4 border-t border-purple-900/20">
              {[
                { icon: Shield, text: '24ч гарантия', sub: 'Возврат средств', color: 'text-success' },
                { icon: Lock, text: 'Escrow защита', sub: 'Безопасная сделка', color: 'text-accent-soft' },
                { icon: CheckCircle2, text: 'Проверено AI', sub: 'Оценка риска', color: 'text-blue-400' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <item.icon size={16} className={item.color} />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{item.text}</p>
                    <p className="text-xs text-text-secondary">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Seller block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users size={16} className="text-accent" />
              Продавец
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center avatar-ring">
                <span className="text-base font-bold text-white">{account.seller.avatar}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-text-primary">{account.seller.username}</span>
                  {account.seller.isVerified && <CheckCircle2 size={14} className="text-accent" />}
                  <span className={`text-xs ${levelColors[account.seller.level]}`}>
                    [{levelLabels[account.seller.level]}]
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${account.seller.isOnline ? 'bg-success' : 'bg-gray-500'}`} />
                  <span className="text-xs text-text-secondary">{account.seller.isOnline ? 'Онлайн' : 'Оффлайн'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Рейтинг', value: `${account.seller.rating}/5`, icon: Star },
                { label: 'Положит.', value: `${account.seller.positivePercent}%`, icon: CheckCircle2 },
                { label: 'Продаж', value: account.seller.totalSales.toLocaleString(), icon: ShoppingCart },
                { label: 'Ответ', value: account.seller.responseTime, icon: MessageSquare },
              ].map(stat => (
                <div key={stat.label} className="bg-bg-primary rounded-xl p-3 border border-purple-900/10">
                  <stat.icon size={13} className="text-accent mb-1" />
                  <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="text-xs text-text-secondary mb-4">
              <span>На сайте с {account.seller.registeredAt}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-purple-900/20 border border-purple-800/30 text-text-primary hover:border-accent transition-all"
            >
              <MessageSquare size={16} />
              Написать продавцу
            </motion.button>
          </motion.div>

          {/* Ban check */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-card border border-purple-900/20 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-accent" />
              <span className="text-sm font-semibold text-text-primary">Проверка на бан</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'VAC бан', status: !account.isBanned, check: true },
                { label: 'Trade ban', status: true, check: true },
                { label: 'Community ban', status: true, check: true },
                { label: 'Game ban', status: !account.isBanned, check: !account.isBanned },
              ].map(check => (
                <div key={check.label} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{check.label}</span>
                  <span className={`flex items-center gap-1 text-xs ${check.status ? 'text-success' : 'text-error'}`}>
                    {check.status ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {check.status ? 'Нет' : 'Есть'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ReviewCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-bg-primary rounded-xl p-4 border border-purple-900/10"
  >
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-white">{review.authorAvatar}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary">{review.author}</span>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={11} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            ))}
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{review.text}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-secondary">{review.accountTitle}</span>
          <span className="text-xs text-text-secondary">{review.date}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default ProductPage;
