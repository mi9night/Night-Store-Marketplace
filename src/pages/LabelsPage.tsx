import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, X } from 'lucide-react';

const LabelsPage: React.FC = () => {
  const [labels, setLabels] = useState([
    { id: '1', name: 'Проверено', color: '#10B981' },
    { id: '2', name: 'Срочно', color: '#EF4444' },
    { id: '3', name: 'VIP', color: '#A855F7' },
  ]);
  const [newLabelName, setNewLabelName] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Tag size={24} className="text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Управление метками</h1>
          <p className="text-text-secondary">Создавайте и управляйте метками для быстрого поиска и фильтрации аккаунтов.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-card border border-purple-900/20 rounded-2xl p-6 space-y-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Новая метка</h3>
            <p className="text-sm text-text-secondary">Добавьте метку, которая поможет вам быстро находить нужные объявления.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto">
            <input
              type="text"
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              placeholder="Введите название метки..."
              className="flex-1 px-4 py-3 rounded-xl text-sm bg-bg-primary border border-purple-900/20 text-text-primary"
            />
            <button
              onClick={() => {
                if (!newLabelName.trim()) return;
                setLabels(prev => [...prev, { id: Date.now().toString(), name: newLabelName.trim(), color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}` }]);
                setNewLabelName('');
              }}
              className="btn-primary px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Plus size={16} />
              Добавить
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {labels.map(label => (
            <motion.div
              key={label.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 p-4 bg-bg-primary rounded-2xl border border-purple-900/20"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{label.name}</p>
                  <p className="text-xs text-text-secondary">Цвет: {label.color}</p>
                </div>
              </div>
              <button
                onClick={() => setLabels(prev => prev.filter(item => item.id !== label.id))}
                className="text-error hover:text-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LabelsPage;
