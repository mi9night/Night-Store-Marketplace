import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RealTimeNotification from './components/RealTimeNotification';

import AuthPage from './pages/AuthPage';
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
import StatusPage from './pages/StatusPage';
import OperationsPage from './pages/OperationsPage';
import RatesPage from './pages/RatesPage';
import ApiPage from './pages/ApiPage';

import { Account } from './types';
import type { Page } from './types/pages';

const App: React.FC = () => {

  /* ================= AUTH ================= */

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {

    // ✅ ВАЖНО: используем getSession(), а не getUser()
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    initAuth();

    // ✅ слушаем изменения auth (login/logout/confirm)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-white">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  /* ================= НАВИГАЦИЯ ================= */

  const [currentPage, setCurrentPage] = useState<Page>('market');
  const [forumFilter, setForumFilter] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [cartItems, setCartItems] = useState<Account[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSetPage = useCallback(
    (page: Page, filter: string | null = null) => {
      setCurrentPage(page);
      setForumFilter(filter);
      setIsMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

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

  /* ================= РЕНДЕР ================= */

  return (
    <div className="min-h-screen bg-bg-primary">

      <Header
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        cartCount={cartItems.length}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCartItems([])}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <Sidebar
        currentPage={currentPage}
        forumFilter={forumFilter}
        setCurrentPage={handleSetPage}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="lg:ml-60 pt-16 min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage + (forumFilter || '')}
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

              {currentPage === 'profile' && <ProfilePage />}

              {currentPage === 'cart' && (
                <CartPage
                  cartItems={cartItems}
                  onRemove={handleRemoveFromCart}
                  setCurrentPage={handleSetPage}
                  onSelectAccount={handleSelectAccount}
                />
              )}

              {currentPage === 'sell' && <SellPage />}
              {currentPage === 'bulk' && <BulkPage />}
              {currentPage === 'forum' && <ForumPage filter={forumFilter} />}
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

              {currentPage === 'settings' && <SettingsPage />}
              {currentPage === 'api' && <ApiPage />}
              {currentPage === 'operations' && <OperationsPage />}
              {currentPage === 'rates' && <RatesPage />}
              {currentPage === 'labels' && <LabelsPage />}
              {currentPage === 'autobuy' && <AutobuyPage />}
              {currentPage === 'topSellers' && <StatusPage />}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <RealTimeNotification />

    </div>
  );
};

export default App;