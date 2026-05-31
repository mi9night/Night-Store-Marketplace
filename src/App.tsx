import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Clock, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from './lib/supabase';
import { dbToAccount } from './lib/db';
import { useUserNav } from './lib/UserNavContext';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import UserProfileModal from './components/UserProfileModal';
import LiveFeed from './components/LiveFeed';
import StartupNotice from './components/StartupNotice';

import AuthPage from './pages/AuthPage';
import DiscordCallback from './pages/DiscordCallback';
import EmailConfirmedPage from './pages/EmailConfirmedPage';
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
import PaymentPage from './pages/PaymentPage';

import type { Page } from './types/pages';
import { Account } from './types';
import { formatPunishmentDate, isPunishmentActive, Punishment } from './lib/moderation';

const BanLockScreen: React.FC<{ ban: Punishment }> = ({ ban }) => {
  const signOut = async () => { await supabase.auth.signOut(); };
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative overflow-hidden bg-[#171425] border border-red-800/40 rounded-3xl p-7 max-w-xl w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.16)]">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-transparent to-bg-primary pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-red-900/30 border border-red-700/40 flex items-center justify-center mx-auto mb-5 shadow-[0_0_28px_rgba(239,68,68,0.22)]">
            <ShieldAlert size={42} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Аккаунт заблокирован</h1>
          <p className="text-sm text-text-secondary mb-5">Пока действует бан, пользоваться сайтом нельзя.</p>
          <div className="bg-[#0B0A12] border border-red-900/30 rounded-2xl p-4 text-left space-y-3 mb-5">
            <div className="flex items-start gap-3"><Ban size={16} className="text-red-400 mt-0.5" /><div><p className="text-xs text-text-secondary">Причина</p><p className="text-sm text-white">{ban.reason || 'Без причины'}</p></div></div>
            <div className="flex items-start gap-3"><Clock size={16} className="text-yellow-400 mt-0.5" /><div><p className="text-xs text-text-secondary">Срок</p><p className="text-sm text-white">до {formatPunishmentDate(ban.ends_at)}</p></div></div>
            <div><p className="text-xs text-text-secondary">Выдал</p><p className="text-sm text-white">{ban.moderator_name || 'Модератор'}</p></div>
            {ban.created_at && <div><p className="text-xs text-text-secondary">Дата выдачи</p><p className="text-sm text-white">{new Date(ban.created_at).toLocaleString('ru-RU')}</p></div>}
          </div>
          <button onClick={signOut} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all">
            <LogOut size={16} /> Выйти из аккаунта
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AuthRequired: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-xl mx-auto bg-[#171425] border border-purple-900/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(139,92,246,0.12)]"
  >
    <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center mx-auto mb-4">
      <LogIn size={30} className="text-purple-300" />
    </div>
    <h2 className="text-xl font-bold text-white mb-2">Нужна авторизация</h2>
    <p className="text-sm text-text-secondary mb-5">
      Смотреть сайт можно без регистрации, но для покупок, продажи, сообщений, финансов и других действий нужно войти в аккаунт.
    </p>
    <button onClick={onLogin} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
      Войти или зарегистрироваться
    </button>
  </motion.div>
);

const App: React.FC = () => {

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeBan, setActiveBan] = useState<Punishment | null>(null);

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
      } else if (window.location.hash === '#view-profile') {
        const id = localStorage.getItem('view_profile_id');
        if (id) {
          localStorage.removeItem('view_profile_id');
          setViewedProfileId(id);
          setCurrentPage('profile');
        }
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
  const [paymentMode, setPaymentMode] = useState<'deposit' | 'withdraw' | undefined>(undefined);
  const loadActiveBan = useCallback(async (userId?: string | null) => {
    if (!userId) { setActiveBan(null); return; }
    const { data } = await supabase
      .from('bans')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'ban')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    const ban = (data || []).find((b: any) => isPunishmentActive(b));
    setActiveBan(ban || null);
  }, []);


  useEffect(() => {

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      await loadActiveBan(currentUser?.id);
      setAuthLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser && currentPage === ('auth' as any)) setCurrentPage('market');
      loadActiveBan(currentUser?.id);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();

  }, [loadActiveBan, currentPage]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => loadActiveBan(user.id);
    const channel = supabase.channel('app_ban_sync')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bans', filter: `user_id=eq.${user.id}` },
        refresh
      )
      .subscribe();

    const interval = window.setInterval(refresh, 30_000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [user?.id, loadActiveBan]);

  const handleSetPage = useCallback(
    (page: Page, filter: string | null = null) => {
      if (page === 'profile') setViewedProfileId(null);
      // Handle payment modes
      if (filter === 'deposit' || filter === 'withdraw') {
        setPaymentMode(filter as 'deposit' | 'withdraw');
      } else if (page !== ('payment' as any)) {
        setPaymentMode(undefined);
      }
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

  const handleOpenAccountFull = useCallback((acc: Account) => {
    setSelectedAccount(acc);
    setCurrentPage('product');
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const requireAuth = (children: React.ReactNode) =>
    user ? children : <AuthRequired onLogin={() => setCurrentPage('auth' as any)} />;

  // Discord callback — отдельная страница
  if (typeof window !== 'undefined' && window.location.pathname === '/auth/discord/callback') {
    return <DiscordCallback />;
  }

  // Email confirmation callback — отдельная страница
  if (typeof window !== 'undefined' && window.location.pathname === '/email-confirmed') {
    return <EmailConfirmedPage />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">

      {authLoading && (
        <div className="min-h-screen flex items-center justify-center text-white">
          Загрузка...
        </div>
      )}

      {!authLoading && user && activeBan && (
        <BanLockScreen ban={activeBan} />
      )}

      {!authLoading && (!user || !activeBan) && (
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
            onOpenAccountFull={handleOpenAccountFull}
            onOpenTopic={handleOpenTopic}
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

                  {currentPage === ('auth' as any) && <AuthPage />}

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

                  {currentPage === 'cart' && requireAuth(
                    <CartPage
                      cartItems={cartItems}
                      onRemove={handleRemoveFromCart}
                      onClearCart={handleClearCart}
                      setCurrentPage={handleSetPage}
                      onSelectAccount={handleSelectAccount}
                    />
                  )}

                  {currentPage === 'sell' && requireAuth(<SellPage />)}
                  {currentPage === 'bulk' && <BulkPage />}
                  {currentPage === 'forum' && <ForumPage filter={forumFilter} onOpenTopic={handleOpenTopic} />}

                  {currentPage === 'purchases' && requireAuth(
                    <PurchasesPage
                      onSelectAccount={handleSelectAccount}
                      setCurrentPage={handleSetPage}
                    />
                  )}

                  {currentPage === 'favorites' && requireAuth(
                    <FavoritesPage
                      onSelectAccount={handleSelectAccount}
                      setCurrentPage={handleSetPage}
                      onAddToCart={handleAddToCart}
                    />
                  )}

                  {currentPage === 'settings' && requireAuth(
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
                  {currentPage === 'operations' && requireAuth(<OperationsPage />)}
                  {currentPage === ('messages' as any) && requireAuth(<MessagesPage />)}
                  {currentPage === ('support' as any) && <SupportPage />}
                  {currentPage === 'labels' && requireAuth(<LabelsPage />)}
                  {currentPage === 'autobuy' && requireAuth(<AutobuyPage />)}
                  {currentPage === 'rates' && <RatesPage />}
                  {currentPage === 'api' && <ApiPage />}
                  {currentPage === ('payment' as any) && requireAuth(<PaymentPage initialMode={paymentMode} setCurrentPage={handleSetPage} />)}

                </motion.div>
              </AnimatePresence>

            </div>
          </main>

          <LiveFeed />
        </>
      )}

      {!authLoading && <StartupNotice />}
      <UserProfileModal />
    </div>
  );
};

export default App;
