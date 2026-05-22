import { Account, Category, Notification, Review, TopSeller, User } from '../types';

export const currentUser: User = {
  id: 'u1',
  username: 'DarkHunter_X',
  email: 'darkhunter@nightstore.io',
  avatar: 'DH',
  balance: 12450.50,
  currency: 'RUB',
  registeredAt: '2023-03-15',
  level: 'Gold',
  totalPurchases: 47,
  totalSales: 124,
  rating: 4.9,
  isOnline: true,
};

export const categories: Category[] = [
  { id: 'steam', name: 'Steam', icon: '🎮', count: 1847 },
  { id: 'telegram', name: 'Telegram', icon: '✈️', count: 543 },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', count: 289 },
  { id: 'riot', name: 'Riot Games', icon: '🥊', count: 156 },
  { id: 'ea', name: 'EA Sports', icon: '⚽', count: 312 },
  { id: 'ubisoft', name: 'Ubisoft', icon: '🌀', count: 89 },
  { id: 'minecraft', name: 'Minecraft', icon: '🧊', count: 245 },
  { id: 'supercell', name: 'Supercell', icon: '⚡', count: 178 },
  { id: 'roblox', name: 'Roblox', icon: '🧱', count: 432 },
  { id: 'wot', name: 'World of Tanks', icon: '🛡️', count: 678 },
  { id: 'gift', name: 'Gift / Services', icon: '🎁', count: 123 },
  { id: 'rockstar', name: 'Rockstar', icon: '⭐️', count: 567 },
  { id: 'discord', name: 'Discord', icon: '💬', count: 312 },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', count: 89 },
  { id: 'ai', name: 'AI Services', icon: '🤖', count: 45 },
  { id: 'battlenet', name: 'Battle.net', icon: '🌀', count: 167 },
  { id: 'vpn', name: 'VPN', icon: '🔒', count: 89 },
  { id: 'mi', name: 'Xiaomi / Mi', icon: '📱', count: 34 },
  { id: 'hearthstone', name: 'Hearthstone', icon: '🎴', count: 78 },
];

export const accounts: Account[] = [
  {
    id: 'a1', title: 'Steam Prime | CS2 2500 часов | 47 игр', category: 'steam', subcategory: 'CS2',
    price: 1850, oldPrice: 2200, currency: 'RUB',
    seller: { id: 's1', username: 'NightDealer', rating: 4.9, avatar: 'ND' } as any,
    tags: [{ label: 'Prime', icon: '⭐' }, { label: 'RU', icon: '🇷🇺' }],
    riskLevel: 'low', hasOriginalEmail: true, hasTempEmail: true,
    lastLogin: '3 дня назад', country: 'Россия', gamesCount: 47,
    guarantee: true, guaranteeHours: 24, createdAt: '2024-11-15', views: 12450,
    description: 'Полный доступ, первая почта в комплекте. Идеально под основу.'
  },
  {
    id: 'a2', title: 'Fortnite OG | Renegade Raider | Rare', category: 'fortnite',
    price: 15400, oldPrice: 18000, currency: 'RUB',
    seller: { id: 's2', username: 'ShadowMarket', rating: 4.7, avatar: 'SM' } as any,
    tags: [{ label: 'OG', icon: '💎' }, { label: 'Renegade', icon: '🔥' }],
    riskLevel: 'medium', hasOriginalEmail: false, hasTempEmail: true,
    lastLogin: '1 день назад', country: 'USA',
    guarantee: true, guaranteeHours: 12, createdAt: '2024-12-01', views: 8900,
    description: 'Редчайший аккаунт с Renegade Raider. Смена почты доступна.'
  },
];

export const notifications: Notification[] = [];
export const reviews: Review[] = [];
export const topSellers: TopSeller[] = [];
export const exchangeRates = [
  { currency: 'USD', rate: 91.5, change: +0.32, flag: '🇺🇸' },
  { currency: 'EUR', rate: 99.2, change: -0.18, flag: '🇪🇺' },
];
