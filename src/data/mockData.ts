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
  { id: 'steam', name: 'Steam', icon: '🎮', count: 1847, subcategories: ['CS2', 'Dota 2', 'PUBG', 'Rust'] },
  { id: 'telegram', name: 'Telegram', icon: '✈️', count: 543 },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️', count: 289 },
  { id: 'riot', name: 'Riot Games', icon: '🥊', count: 156 },
  { id: 'ea', name: 'EA Sports', icon: '⚽', count: 312 },
  { id: 'ubisoft', name: 'Ubisoft', icon: '🌀', count: 89 },
  { id: 'minecraft', name: 'Minecraft', icon: '🧊', count: 245 },
  { id: 'supercell', name: 'Supercell', icon: '⚡', count: 178 },
  { id: 'roblox', name: 'Roblox', icon: '🧱', count: 432 },
  { id: 'wot', name: 'World of Tanks', icon: '🛡️', count: 678 },
  { id: 'warthunder', name: 'War Thunder', icon: '✈️', count: 234 },
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

const sellers = [
  {
    id: 's1', username: 'NightDealer', avatar: 'ND', rating: 4.9, positivePercent: 98.7,
    totalSales: 2847, registeredAt: '2021-06-12', level: 'diamond' as const,
    isVerified: true, isOnline: true, reviewsCount: 1204, responseTime: '< 5 мин',
    description: 'Топ продавец. Гарантия на все аккаунты.'
  },
  {
    id: 's2', username: 'ShadowMarket', avatar: 'SM', rating: 4.7, positivePercent: 95.2,
    totalSales: 1234, registeredAt: '2022-01-08', level: 'platinum' as const,
    isVerified: true, isOnline: false, reviewsCount: 567, responseTime: '< 15 мин',
    description: 'Качественные аккаунты по лучшим ценам.'
  },
  {
    id: 's3', username: 'CryptoVault', avatar: 'CV', rating: 4.5, positivePercent: 91.8,
    totalSales: 876, registeredAt: '2022-08-20', level: 'gold' as const,
    isVerified: false, isOnline: true, reviewsCount: 321, responseTime: '< 30 мин',
    description: 'Надежный продавец игровых аккаунтов.'
  },
  {
    id: 's4', username: 'ProAccount', avatar: 'PA', rating: 4.8, positivePercent: 97.1,
    totalSales: 3421, registeredAt: '2020-11-05', level: 'diamond' as const,
    isVerified: true, isOnline: true, reviewsCount: 1876, responseTime: '< 3 мин',
    description: 'Магазин проверенных аккаунтов.'
  },
  {
    id: 's5', username: 'DarkSeller', avatar: 'DS', rating: 4.3, positivePercent: 88.4,
    totalSales: 432, registeredAt: '2023-02-14', level: 'silver' as const,
    isVerified: false, isOnline: false, reviewsCount: 189, responseTime: '< 1 час',
    description: 'Продажа аккаунтов всех категорий.'
  },
];

export const accounts: Account[] = [
  {
    id: 'a1', title: 'Steam Prime | CS2 2500 часов | 47 игр', category: 'steam', subcategory: 'CS2',
    price: 1850, oldPrice: 2200, currency: 'RUB',
    seller: sellers[0],
    tags: [
      { label: '2 года', icon: '📅' }, { label: '47 игр', icon: '🎮' },
      { label: 'RU', icon: '🇷🇺' }, { label: 'Prime', icon: '⭐' }
    ],
    riskLevel: 'low', hasOriginalEmail: true, hasTempEmail: true,
    lastLogin: '3 дня назад', country: 'Россия', gamesCount: 47,
    hoursPlayed: 2500, level: 34, guarantee: true, guaranteeHours: 24,
    escrow: true, isBanned: false, createdAt: '2024-11-15',
    description: 'Чистый аккаунт Steam с Prime статусом в CS2. 47 игр в библиотеке. Много часов в CS2. Полный доступ к родной почте.',
    priceHistory: [
      { date: '01.10', price: 2200 }, { date: '15.10', price: 2100 }, { date: '01.11', price: 1950 },
      { date: '15.11', price: 1900 }, { date: '01.12', price: 1850 }, { date: '15.12', price: 1850 },
    ],
    rating: 4.9, reviewsCount: 847, isFavorite: false, soldCount: 234, views: 15678,
    inventory: [
      { name: 'AK-47 | Redline', rarity: 'Classified', price: 1200 },
      { name: 'AWP | Asiimov', rarity: 'Covert', price: 3400 },
    ]
  },
  {
    id: 'a2', title: 'Epic Games | Fortnite OG | Rare Skins Pack', category: 'fortnite',
    price: 3200, currency: 'RUB',
    seller: sellers[3],
    tags: [
      { label: '5 лет', icon: '📅' }, { label: 'OG скины', icon: '💎' },
      { label: 'US', icon: '🇺🇸' }, { label: 'Гарантия', icon: '🛡️' }
    ],
    riskLevel: 'low', hasOriginalEmail: false, hasTempEmail: true,
    lastLogin: '7 дней назад', country: 'США', guarantee: true, guaranteeHours: 24,
    escrow: true, isBanned: false, createdAt: '2024-10-20',
    description: 'Epic Games аккаунт с редкими OG скинами в Fortnite.账号 с историей.',
    priceHistory: [
      { date: '01.10', price: 3500 }, { date: '15.10', price: 3400 }, { date: '01.11', price: 3300 },
      { date: '15.11', price: 3200 }, { date: '01.12', price: 3200 }, { date: '15.12', price: 3200 },
    ],
    rating: 4.8, reviewsCount: 312, isFavorite: true, soldCount: 89, views: 7234,
  },
  {
    id: 'a3', title: 'Discord | Nitro до 2026 | Редкий тег #0001', category: 'discord',
    price: 890, oldPrice: 1100, currency: 'RUB',
    seller: sellers[1],
    tags: [
      { label: 'Nitro 2026', icon: '💜' }, { label: '#0001', icon: '🏷️' },
      { label: 'DE', icon: '🇩🇪' }
    ],
    riskLevel: 'medium', hasOriginalEmail: true, hasTempEmail: false,
    lastLogin: '14 дней назад', country: 'Германия', guarantee: true, guaranteeHours: 12,
    escrow: false, isBanned: false, createdAt: '2024-12-01',
    description: 'Discord аккаунт с активным Nitro до 2026 года и редким тегом #0001.',
    priceHistory: [
      { date: '01.10', price: 1100 }, { date: '15.10', price: 1050 }, { date: '01.11', price: 1000 },
      { date: '15.11', price: 950 }, { date: '01.12', price: 890 }, { date: '15.12', price: 890 },
    ],
    rating: 4.6, reviewsCount: 156, isFavorite: false, soldCount: 45, views: 3421,
  },
  {
    id: 'a4', title: 'VPN Premium | NordVPN 3 года | 6 устройств', category: 'vpn',
    price: 2100, currency: 'RUB',
    seller: sellers[2],
    tags: [
      { label: '3 года', icon: '📅' }, { label: '6 устройств', icon: '📱' },
      { label: 'Глобал', icon: '🌍' }, { label: 'Премиум', icon: '👑' }
    ],
    riskLevel: 'low', hasOriginalEmail: true, hasTempEmail: false,
    lastLogin: '1 час назад', country: 'Глобально', guarantee: true, guaranteeHours: 24,
    escrow: true, isBanned: false, createdAt: '2024-11-28',
    description: 'NordVPN Premium подписка на 3 года. 6 устройств одновременно. Без ограничений.',
    priceHistory: [
      { date: '01.10', price: 2400 }, { date: '15.10', price: 2300 }, { date: '01.11', price: 2200 },
      { date: '15.11', price: 2150 }, { date: '01.12', price: 2100 }, { date: '15.12', price: 2100 },
    ],
    rating: 4.7, reviewsCount: 234, isFavorite: false, soldCount: 167, views: 9876,
  },
];

export const notifications: Notification[] = [
  { id: 'n1', type: 'purchase', title: 'Покупка совершена', text: 'Steam Prime аккаунт успешно приобретен', time: '5 мин назад', isRead: false, icon: '🛒' },
  { id: 'n2', type: 'sale', title: 'Новая продажа!', text: 'Ваш Discord Nitro куплен за 890₽', time: '23 мин назад', isRead: false, icon: '💰' },
  { id: 'n3', type: 'message', title: 'Сообщение от NightDealer', text: 'Аккаунт доставлен, проверяйте!', time: '1 час назад', isRead: false, icon: '💬' },
  { id: 'n4', type: 'system', title: 'Система безопасности', text: 'Новый вход с устройства Windows', time: '3 часа назад', isRead: true, icon: '🔒' },
  { id: 'n5', type: 'promo', title: 'Специальное предложение', text: 'Скидка 20% на Steam аккаунты до конца недели!', time: '1 день назад', isRead: true, icon: '🎁' },
  { id: 'n6', type: 'system', title: 'Пополнение баланса', text: 'На ваш счет зачислено 5000₽', time: '2 дня назад', isRead: true, icon: '💳' },
];

export const reviews: Review[] = [
  { id: 'r1', author: 'GamerPro777', authorAvatar: 'GP', rating: 5, text: 'Отличный продавец! Аккаунт пришел быстро, всё совпадает с описанием. Рекомендую!', date: '15 дек 2024', isPositive: true, accountTitle: 'Steam Prime | CS2' },
  { id: 'r2', author: 'NightWalker', authorAvatar: 'NW', rating: 5, text: 'Уже третья покупка у этого продавца. Всегда качественно и быстро. 5 звезд заслуженно.', date: '14 дек 2024', isPositive: true, accountTitle: 'VPN NordVPN' },
  { id: 'r3', author: 'CyberUser', authorAvatar: 'CU', rating: 4, text: 'Хороший аккаунт, небольшая задержка при передаче но в целом доволен.', date: '12 дек 2024', isPositive: true, accountTitle: 'Discord Nitro' },
  { id: 'r4', author: 'DarkPlayer', authorAvatar: 'DP', rating: 3, text: 'Аккаунт соответствует описанию, но продавец долго отвечал. Всё равно получил что хотел.', date: '10 дек 2024', isPositive: true, accountTitle: 'GTA Online' },
  { id: 'r5', author: 'ShadowByte', authorAvatar: 'SB', rating: 5, text: 'Невероятно! Аккаунт лучше чем ожидал. Escrow защита сработала отлично. 10/10', date: '9 дек 2024', isPositive: true, accountTitle: 'Steam Dota 2' },
  { id: 'r6', author: 'QuantumX', authorAvatar: 'QX', rating: 2, text: 'Аккаунт пришел не так быстро как обещали, но гарантия сработала и всё решили.', date: '7 дек 2024', isPositive: false, accountTitle: 'Adobe CC' },
];

export const topSellers: TopSeller[] = [
  { ...sellers[3], rank: 1, monthlySales: 342, monthlyRevenue: 584700 },
  { ...sellers[0], rank: 2, monthlySales: 287, monthlyRevenue: 412300 },
  { ...sellers[1], rank: 3, monthlySales: 198, monthlyRevenue: 287400 },
  { ...sellers[2], rank: 4, monthlySales: 143, monthlyRevenue: 198600 },
  { ...sellers[4], rank: 5, monthlySales: 89, monthlyRevenue: 124800 },
];

export const savedSearches = ['CS2 Prime', 'Discord Nitro', 'VPN Premium', 'Steam 50+ игр', 'Fortnite OG'];

export const exchangeRates = [
  { currency: 'USD', rate: 91.5, change: +0.32, flag: '🇺🇸' },
  { currency: 'EUR', rate: 99.2, change: -0.18, flag: '🇪🇺' },
  { currency: 'BTC', rate: 8924500, change: +2.14, flag: '₿' },
  { currency: 'USDT', rate: 91.8, change: +0.05, flag: '💎' },
  { currency: 'UAH', rate: 2.34, change: -0.02, flag: '🇺🇦' },
];
