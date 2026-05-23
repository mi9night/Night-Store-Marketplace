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
  // Игры
  { id: 'steam',      name: 'Steam',          icon: '🎮', count: 0, subcategories: ['CS2', 'Dota 2', 'PUBG', 'Rust', 'Prime'] },
  { id: 'telegram',   name: 'Telegram',       icon: '✈️', count: 0, subcategories: ['Каналы', 'Аккаунты', 'Stars', 'Premium'] },
  { id: 'brawl',      name: 'Brawl Stars',    icon: '👊', count: 0 },
  { id: 'ea',         name: 'EA Games',       icon: '🎯', count: 0, subcategories: ['FIFA', 'Apex Legends'] },
  { id: 'ubisoft',    name: 'Ubisoft',        icon: '🌀', count: 0, subcategories: ['Rainbow Six', 'Assassins Creed'] },
  { id: 'minecraft',  name: 'Minecraft',      icon: '🟩', count: 0 },
  { id: 'supercell',  name: 'Supercell',      icon: '⚔️', count: 0, subcategories: ['Clash Royale', 'Clash of Clans'] },
  { id: 'roblox',     name: 'Roblox',         icon: '🟥', count: 0 },
  { id: 'wot',        name: 'World of Tanks', icon: '🛡', count: 0 },
  { id: 'wr',         name: 'Wargaming',      icon: '⚡', count: 0 },
  // Соцсети + сервисы
  { id: 'rockstar',   name: 'Rockstar',       icon: '🌟', count: 0, subcategories: ['GTA V', 'RDR2'] },
  { id: 'discord',    name: 'Discord',        icon: '💬', count: 0 },
  { id: 'tiktok',     name: 'TikTok',         icon: '🎵', count: 0 },
  { id: 'instagram',  name: 'Instagram',      icon: '📷', count: 0 },
  { id: 'ai',         name: 'AI сервисы',     icon: '🧠', count: 0, subcategories: ['ChatGPT', 'Claude', 'Midjourney'] },
  { id: 'neural',     name: 'Нейросети',      icon: '⚛️', count: 0 },
  { id: 'vpn',        name: 'VPN',            icon: '🔐', count: 0 },
  { id: 'mu',         name: 'MU',             icon: 'μ',  count: 0 },
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
    id: 'a2', title: 'Epic Games | Fortnite OG | Rare Skins Pack', category: 'epic', subcategory: 'Fortnite',
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
  {
    id: 'a5', title: 'GTA Online | 500M$ | Шарк Карта | Все DLC', category: 'gta',
    price: 750, oldPrice: 950, currency: 'RUB',
    seller: sellers[0],
    tags: [
      { label: '500M$', icon: '💰' }, { label: 'Все DLC', icon: '🎯' },
      { label: 'BR', icon: '🇧🇷' }, { label: 'Гарантия', icon: '🛡️' }
    ],
    riskLevel: 'medium', hasOriginalEmail: false, hasTempEmail: true,
    lastLogin: '2 дня назад', country: 'Бразилия', gamesCount: 12,
    guarantee: true, guaranteeHours: 24, escrow: false, isBanned: false, createdAt: '2024-12-05',
    description: 'GTA Online аккаунт с 500 миллионами долларов и всеми DLC. Разблокировано всё.',
    priceHistory: [
      { date: '01.10', price: 950 }, { date: '15.10', price: 900 }, { date: '01.11', price: 850 },
      { date: '15.11', price: 800 }, { date: '01.12', price: 750 }, { date: '15.12', price: 750 },
    ],
    rating: 4.4, reviewsCount: 89, isFavorite: true, soldCount: 312, views: 18934,
  },
  {
    id: 'a6', title: 'Adobe CC 2025 | Все приложения | Активировано', category: 'software',
    price: 1350, currency: 'RUB',
    seller: sellers[1],
    tags: [
      { label: 'Все приложения', icon: '🎨' }, { label: '1 год', icon: '📅' },
      { label: 'Активировано', icon: '✅' }
    ],
    riskLevel: 'low', hasOriginalEmail: true, hasTempEmail: false,
    lastLogin: '5 дней назад', country: 'Глобально', guarantee: true, guaranteeHours: 24,
    escrow: true, isBanned: false, createdAt: '2024-12-10',
    description: 'Adobe Creative Cloud 2025 подписка. Все приложения активированы. Photoshop, Illustrator, Premiere Pro и др.',
    priceHistory: [
      { date: '01.10', price: 1600 }, { date: '15.10', price: 1550 }, { date: '01.11', price: 1450 },
      { date: '15.11', price: 1400 }, { date: '01.12', price: 1350 }, { date: '15.12', price: 1350 },
    ],
    rating: 4.8, reviewsCount: 445, isFavorite: false, soldCount: 567, views: 22341,
  },
  {
    id: 'a7', title: 'Steam | Dota 2 Divine 5 | 6000 часов | MMR 6500', category: 'steam',
    price: 4500, oldPrice: 5000, currency: 'RUB',
    seller: sellers[3],
    tags: [
      { label: 'Divine 5', icon: '🏆' }, { label: '6000 ч', icon: '⏱️' },
      { label: 'MMR 6500', icon: '📊' }, { label: 'RU', icon: '🇷🇺' }
    ],
    riskLevel: 'low', hasOriginalEmail: true, hasTempEmail: true,
    lastLogin: '1 день назад', country: 'Россия', gamesCount: 23,
    hoursPlayed: 6000, level: 187, guarantee: true, guaranteeHours: 24,
    escrow: true, isBanned: false, createdAt: '2024-10-01',
    description: 'Высокорейтинговый аккаунт Dota 2 с Divine 5 рангом. 6000 часов игры. MMR 6500.',
    priceHistory: [
      { date: '01.10', price: 5000 }, { date: '15.10', price: 4900 }, { date: '01.11', price: 4800 },
      { date: '15.11', price: 4700 }, { date: '01.12', price: 4600 }, { date: '15.12', price: 4500 },
    ],
    rating: 4.9, reviewsCount: 187, isFavorite: false, soldCount: 34, views: 8765,
  },
  {
    id: 'a8', title: 'CS2 | Global Elite | 3000 часов | Чистый VAC', category: 'cs2',
    price: 2800, currency: 'RUB',
    seller: sellers[4],
    tags: [
      { label: 'Global Elite', icon: '🎖️' }, { label: '3000 ч', icon: '⏱️' },
      { label: 'Нет VAC', icon: '✅' }, { label: 'UA', icon: '🇺🇦' }
    ],
    riskLevel: 'medium', hasOriginalEmail: false, hasTempEmail: true,
    lastLogin: '10 дней назад', country: 'Украина', gamesCount: 8,
    hoursPlayed: 3000, guarantee: true, guaranteeHours: 24,
    escrow: false, isBanned: false, createdAt: '2024-11-20',
    description: 'CS2 аккаунт с рангом Global Elite. 3000 часов. Без VAC блокировок.',
    priceHistory: [
      { date: '01.10', price: 3200 }, { date: '15.10', price: 3100 }, { date: '01.11', price: 3000 },
      { date: '15.11', price: 2900 }, { date: '01.12', price: 2800 }, { date: '15.12', price: 2800 },
    ],
    rating: 4.3, reviewsCount: 67, isFavorite: false, soldCount: 23, views: 4567,
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
