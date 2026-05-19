import React from 'react';

const ApiPage: React.FC = () => {
  return (
    <div className="text-white bg-bg-card p-10 rounded-2xl border border-purple-900/20">
      <h1 className="text-2xl font-bold mb-4">API доступ</h1>

      <div className="bg-purple-900/10 p-6 rounded-xl border border-purple-900/20">
        <p className="mb-3 text-sm text-text-secondary">
          Используйте API для автоматизации продаж и управления аккаунтами.
        </p>

        <div className="text-sm font-mono bg-black/30 p-3 rounded-lg">
          GET https://api.nightstore.io/v1/accounts
        </div>
      </div>
    </div>
  );
};

export default ApiPage;