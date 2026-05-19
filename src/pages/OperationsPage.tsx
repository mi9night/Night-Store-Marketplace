import React from 'react';

const OperationsPage: React.FC = () => {
  return (
    <div className="text-white bg-bg-card p-10 rounded-2xl border border-purple-900/20">
      <h1 className="text-2xl font-bold mb-6">Мои операции</h1>
      <p className="text-text-secondary">
        Здесь будут отображаться покупки, продажи, переводы и вывод средств.
      </p>
    </div>
  );
};

export default OperationsPage;