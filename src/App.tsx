import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RealTimeNotification from './components/RealTimeNotification';
import MarketPage from './pages/MarketPage';
import ProductPage from './pages/ProductPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import SellPage from './pages/SellPage';
import BulkPage from './pages/BulkPage';
import ForumPage from './pages/ForumPage';
import PurchasesPage from './pages/PurchasesPage';
import FavoritesPage from './pages/FavoritesPage';
import SettingsPage from './pages/SettingsPage';
import LabelsPage from './pages/LabelsPage';
import AutobuyPage from './pages/AutobuyPage';
import TopSellersPage from './pages/TopSellersPage';
import { Account } from './types';
import type { Page } from './types/pages';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('market');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [cartItems, setCartItems] = useState<Account[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectAccount = useCallback((account: Account) => {
    setSelectedAccount(account);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCart = useCallback((account: Account) => {
    setCartItems(prev => {
      if (prev.find(i => i.id === account.id)) return prev;
      return [...prev, account];
    });
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleSetPage = useCallback((page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        cartCount={cartItems.length}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="lg:ml-60 pt-16 min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Page content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {currentPage === 'market' && (
                <MarketPage
                  onSelectAccount={handleSelectAccount}
                  setCurrentPage={handleSetPage}
                  onAddToCart={handleAddToCart}
                />
              )}
              {currentPage === 'product' && selectedAccount && (
                <ProductPage
                  account={selectedAccount}
                  setCurrentPage={handleSetPage}
                  onAddToCart={handleAddToCart}
                />
              )}
              {currentPage === 'profile' && (
                <ProfilePage />
              )}
              {currentPage === 'cart' && (
                <CartPage
                  cartItems={cartItems}
                  onRemove={handleRemoveFromCart}
                  setCurrentPage={handleSetPage}
                  onSelectAccount={handleSelectAccount}
                />
              )}
              {currentPage === 'sell' && (
                <SellPage />
              )}
              {currentPage === 'bulk' && (
                <BulkPage />
              )}
              {currentPage === 'forum' && (
                <ForumPage />
              )}
              {currentPage === 'purchases' && (
                <PurchasesPage
                  onSelectAccount={handleSelectAccount}
                  setCurrentPage={handleSetPage}
                />
              )}
              {currentPage === 'favorites' && (
                <FavoritesPage
                  onSelectAccount={handleSelectAccount}
                  setCurrentPage={handleSetPage}
                  onAddToCart={handleAddToCart}
                />
              )}
              {currentPage === 'settings' && (
                <SettingsPage />
              )}
              {currentPage === 'labels' && (
                <LabelsPage />
              )}
              {currentPage === 'autobuy' && (
                <AutobuyPage />
              )}
              {currentPage === 'topSellers' && (
                <TopSellersPage />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Real-time notifications */}
      <RealTimeNotification />

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-purple-900/20 z-40">
        <div className="flex items-center justify-around py-2 px-4">
          {[
            { icon: '🏪', label: 'Маркет', page: 'market' as Page },
            { icon: '❤️', label: 'Избранное', page: 'favorites' as Page },
            { icon: '🛒', label: 'Корзина', page: 'cart' as Page },
            { icon: '👤', label: 'Профиль', page: 'profile' as Page },
          ].map(item => (
            <motion.button
              key={item.page}
              onClick={() => handleSetPage(item.page)}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                currentPage === item.page ? 'text-accent-soft' : 'text-text-secondary'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {item.page === 'cart' && cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
