import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, TrendingUp, Plus, Eye, ThumbsUp, Clock, Pin } from 'lucide-react';

interface ForumPageProps {
  filter?: string | null;
}

const forumTopics = [
  { id: 1, title: 'Гид: Как безопасно купить аккаунт Steam', category: 'Гайды', isPinned: true },
  { id: 2, title: 'Обсуждение: Новые правила продажи Discord аккаунтов', category: 'Правила', isPinned: true },
  { id: 3, title: 'Вопрос: Что делать если аккаунт не подошел?', category: 'Поддержка', isPinned: false },
];

const categories = ['Все', 'Гайды', 'Правила', 'Поддержка'];

const ForumPage: React.FC<ForumPageProps> = ({ filter }) => {

  const [activeCategory, setActiveCategory] = useState<string>('Все');

  useEffect(() => {
    if (filter) {
      setActiveCategory(filter);
    } else {
      setActiveCategory('Все');
    }
  }, [filter]);

  const filtered =
    activeCategory === 'Все'
      ? forumTopics
      : forumTopics.filter(t => t.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">Форум</h1>
      </motion.div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg text-sm ${
              activeCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-purple-900/20 text-text-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-3">
        {filtered.map(topic => (
          <div
            key={topic.id}
            className="bg-bg-card border border-purple-900/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              {topic.isPinned && <Pin size={14} className="text-accent" />}
              <span className="text-sm text-text-primary">{topic.title}</span>
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Категория: {topic.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumPage;