import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { dbToAccount } from './lib/db';
import { useUserNav } from './lib/UserNavContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RealTimeNotification from './components/RealTimeNotification';
import UserProfileModal from './components/UserProfileModal';
import LiveFeed from './components/LiveFeed';

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
import TopSellersPage from './pages/TopSellersPage';
import TopicPage from './pages/TopicPage';
import MessagesPage from './pages/MessagesPage';
import SupportPage from './pages/SupportPage';
import OperationsPage from './pages/OperationsPage';
import LabelsPage from './pages/LabelsPage';
import AutobuyPage from './pages/AutobuyPage';
import RatesPage from './pages/RatesPage';
import ApiPage from './pages/ApiPage';

import type { Page } from './types/pages';
import { Account } from './types';

const App: React.FC = () => {

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<Page>('market');
  const [forumFilter, setForumFilter] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [cartItems, setCartItems] = useState<Account[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userNav = useUserNav();
  useEffect(() => {
    if (userNav?.setOpenFullProfile) {
      userNav.setOpenFullProfile((id: string) => {
        setViewedProfileId(id);
        setCurrentPage('profile');
      });
    }

    const checkHash = () => {
      if (window.location.hash === '#mod-user') {
        setCurrentPage('settings');
        window.location.hash = '';
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);

  useEffect(() => {

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();

  }, []);

  const handleSetPage = useCallback(
    (page: Page, filter: string | null = null) => {
      setCurrentPage(page);
      setForumFilter(filter);
      setIsMobileMenuOpen(false);
    },
    []
  );

  const handleSelectAccount = useCallback((account: Account) => {
    setSelectedAccount(account);
    setCurrentPage('product');
  }, []);

  const handleAddToCart = useCallback((account: Account) => {
    setCartItems(prev =>
      prev.find(i => i.id === account.id)
        ? prev
        : [...prev, account]
    );
  }, []);

  const handleOpenTopic = useCallback((id: string) => {
    setSelectedTopicId(id);
    setCurrentPage('topic' as Page);
  }, []);

  const handleOpenAccount = useCallback(async (id: string) => {
    const { data } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle();
    if (data) {
      setSelectedAccount(dbToAccount(data));
      setCurrentPage('product');
    }
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">

      {authLoading && (
        <div className="min-h-screen flex items-center justify-center text-white">
          Загрузка...
        </div>
      )}

      {!authLoading && !user && (
        <AuthPage />
      )}

      {!authLoading && user && (
        <>
          <Header
            currentPage={currentPage}
            setCurrentPage={handleSetPage}
            cartCount={cartItems.length}
            cartItems={cartItems}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
            onOpenAccount={handleOpenAccount}
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

                  {currentPage === 'profile' && <ProfilePage setCurrentPage={handleSetPage} onOpenTopic={handleOpenTopic} onOpenAccount={handleOpenAccount} viewedProfileId={viewedProfileId} onResetView={() => setViewedProfileId(null)} />}

                  {currentPage === 'cart' && (
                    <CartPage
                      cartItems={cartItems}
                      onRemove={handleRemoveFromCart}
                      onClearCart={handleClearCart}
                      setCurrentPage={handleSetPage}
                      onSelectAccount={handleSelectAccount}
                    />
                  )}

                  {currentPage === 'sell' && <SellPage />}
                  {currentPage === 'bulk' && <BulkPage />}
                  {currentPage === 'forum' && <ForumPage filter={forumFilter} onOpenTopic={handleOpenTopic} />}

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
                    <SettingsPage
                      onNavigate={(page: any, payload?: any) => {
                        if (page === 'product' && payload?.id) handleOpenAccount(payload.id);
                        else if (page === 'topic' && payload?.id) handleOpenTopic(payload.id);
                        else handleSetPage(page);
                      }}
                    />
                  )}
                  {currentPage === 'topSellers' && <TopSellersPage />}

                  {currentPage === ('topic' as any) && selectedTopicId && (
                    <TopicPage topicId={selectedTopicId} setCurrentPage={handleSetPage} />
                  )}

                  {/* ✅ Восстановленные страницы */}
                  {currentPage === 'operations' && <OperationsPage />}
                  {currentPage === ('messages' as any) && <MessagesPage />}
                  {currentPage === ('support' as any) && <SupportPage />}
                  {currentPage === 'labels' && <LabelsPage />}
                  {currentPage === 'autobuy' && <AutobuyPage />}
                  {currentPage === 'rates' && <RatesPage />}
                  {currentPage === 'api' && <ApiPage />}

                </motion.div>
              </AnimatePresence>

            </div>
          </main>

          <RealTimeNotification />
          <LiveFeed />
        </>
      )}

      <UserProfileModal />
    </div>
  );
};

export default App;
