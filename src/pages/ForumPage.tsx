import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Plus, Eye, ThumbsUp, Clock, Pin } from 'lucide-react';

const forumTopics = [
  { id: 1, title: 'Гид: Как безопасно купить аккаунт Steam', category: 'Гайды', author: 'NightDealer', avatar: 'ND', replies: 234, views: 15678, likes: 89, date: '2 часа назад', isPinned: true, isHot: true },
  { id: 2, title: 'Обсуждение: Новые правила продажи Discord аккаунтов', category: 'Правила', author: 'Admin', avatar: 'AD', replies: 67, views: 3421, likes: 23, date: '5 часов назад', isPinned: true, isHot: false },
  { id: 3, title: 'Вопрос: Что делать если аккаунт не подошел?', category: 'Поддержка', author: 'GameUser', avatar: 'GU', replies: 12, views: 891, likes: 5, date: '1 день назад', isPinned: false, isHot: false },
  { id: 4, title: 'Топ CS2 аккаунты декабря 2024', category: 'Обзоры', author: 'ProAccount', avatar: 'PA', replies: 156, views: 9234, likes: 67, date: '2 дня назад', isPinned: false, isHot: true },
  { id: 5, title: 'Отзыв о продавце ShadowMarket - 10/10', category: 'Отзывы', author: 'DarkPlayer', avatar: 'DP', replies: 8, views: 445, likes: 34, date: '3 дня назад', isPinned: false, isHot: false },
  { id: 6, title: 'Эскроу система: Как работает и почему это безопасно', category: 'Гайды', author: 'SafeDealer', avatar: 'SD', replies: 89, views: 6789, likes: 112, date: '4 дня назад', isPinned: false, isHot: true },
  { id: 7, title: 'Курс валют влияет на цены аккаунтов?', category: 'Дискуссии', author: 'CryptoVault', avatar: 'CV', replies: 34, views: 2341, likes: 18, date: '5 дней назад', isPinned: false, isHot: false },
  { id: 8, title: 'Нужна помощь с активацией VPN аккаунта', category: 'Поддержка', author: 'NewUser', avatar: 'NU', replies: 6, views: 234, likes: 2, date: '6 дней назад', isPinned: false, isHot: false },
];

const categories = ['Все', 'Гайды', 'Правила', 'Поддержка', 'Обзоры', 'Отзывы', 'Дискуссии'];
const categoryColors: Record<string, string> = {
  'Гайды': 'text-blue-400 bg-blue-900/20 border-blue-800/30',
  'Правила': 'text-red-400 bg-red-900/20 border-red-800/30',
  'Поддержка': 'text-green-400 bg-green-900/20 border-green-800/30',
  'Обзоры': 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  'Отзывы': 'text-purple-400 bg-purple-900/20 border-purple-800/30',
  'Дискуссии': 'text-cyan-400 bg-cyan-900/20 border-cyan-800/30',
};

const ForumPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Все');

  const filtered = activeCategory === 'Все'
    ? forumTopics
    : forumTopics.filter(t => t.category === activeCategory);

  const pinned = filtered.filter(t => t.isPinned);
  const regular = filtered.filter(t => !t.isPinned);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Форум</h1>
          <p className="text-sm text-text-secondary">Обсуждения, гайды и поддержка сообщества</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          Создать тему
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MessageSquare, label: 'Тем', value: '1,234', color: 'text-accent' },
          { icon: Eye, label: 'Просмотров', value: '89K', color: 'text-blue-400' },
          { icon: ThumbsUp, label: 'Лайков', value: '15K', color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-4 text-center"
          >
            <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`tag ${activeCategory === cat ? 'tag-active' : ''}`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Pinned topics */}
      {pinned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin size={14} className="text-accent" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Закреплённые</span>
          </div>
          <div className="space-y-2">
            {pinned.map((topic, i) => (
              <TopicRow key={topic.id} topic={topic} index={i} pinned />
            ))}
          </div>
        </div>
      )}

      {/* Regular topics */}
      <div>
        {pinned.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Обсуждения</span>
          </div>
        )}
        <div className="space-y-2">
          {regular.map((topic, i) => (
            <TopicRow key={topic.id} topic={topic} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TopicRow: React.FC<{
  topic: typeof forumTopics[0];
  index: number;
  pinned?: boolean;
}> = ({ topic, index, pinned }) => {
  const categoryColor = categoryColors[topic.category] || 'text-text-secondary bg-purple-900/20 border-purple-800/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-bg-card border rounded-xl p-4 hover:border-purple-700/40 transition-all cursor-pointer card-hover ${
        pinned ? 'border-accent/30' : 'border-purple-900/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{topic.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {pinned && <Pin size={12} className="text-accent" />}
                {topic.isHot && <span className="text-xs text-orange-400 bg-orange-900/20 border border-orange-800/30 px-1.5 py-0.5 rounded-full">🔥 Горячее</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}>{topic.category}</span>
              </div>
              <h3 className="text-sm font-semibold text-text-primary hover:text-accent-soft transition-colors line-clamp-1">
                {topic.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span>{topic.author}</span>
            <span>•</span>
            <div className="flex items-center gap-1"><Clock size={11} />{topic.date}</div>
            <span>•</span>
            <div className="flex items-center gap-1"><MessageSquare size={11} />{topic.replies}</div>
            <div className="flex items-center gap-1"><Eye size={11} />{topic.views.toLocaleString()}</div>
            <div className="flex items-center gap-1"><ThumbsUp size={11} />{topic.likes}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ForumPage;
