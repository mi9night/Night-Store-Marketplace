export interface Account {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: number;
  oldPrice?: number;
  currency: string;
  image?: string;
  seller: Seller;
  tags: AccountTag[];
  riskLevel: 'low' | 'medium' | 'high';
  hasOriginalEmail: boolean;
  hasTempEmail: boolean;
  lastLogin: string;
  country: string;
  gamesCount?: number;
  hoursPlayed?: number;
  level?: number;
  guarantee: boolean;
  guaranteeHours: number;
  escrow: boolean;
  isBanned: boolean;
  createdAt: string;
  description?: string;
  priceHistory: PricePoint[];
  rating: number;
  reviewsCount: number;
  isFavorite: boolean;
  soldCount: number;
  views: number;
  inventory?: InventoryItem[];
}

export interface AccountTag {
  label: string;
  color?: string;
  icon?: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface Seller {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  positivePercent: number;
  totalSales: number;
  registeredAt: string;
  level: SellerLevel;
  isVerified: boolean;
  isOnline: boolean;
  description?: string;
  reviewsCount: number;
  responseTime: string;
}

export type SellerLevel = 'newbie' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Review {
  id: string;
  author: string;
  authorAvatar: string;
  rating: number;
  text: string;
  date: string;
  isPositive: boolean;
  accountTitle: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  balance: number;
  currency: string;
  registeredAt: string;
  level: string;
  totalPurchases: number;
  totalSales: number;
  rating: number;
  isOnline: boolean;
}

export interface Notification {
  id: string;
  type: 'purchase' | 'sale' | 'message' | 'system' | 'promo';
  title: string;
  text: string;
  time: string;
  isRead: boolean;
  icon?: string;
}

export interface CartItem {
  account: Account;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  subcategories?: string[];
}

export interface InventoryItem {
  name: string;
  rarity: string;
  price: number;
  image?: string;
}

export interface TopSeller extends Seller {
  rank: number;
  monthlySales: number;
  monthlyRevenue: number;
}
