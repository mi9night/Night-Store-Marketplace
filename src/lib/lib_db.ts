// src/lib/db.ts
// Утилиты для маппинга между Supabase (snake_case) и фронтом (camelCase)

import type { Account } from '../types';

/* ============ ACCOUNT ============ */

export function dbToAccount(row: any): Account {
  if (!row) return row;

  return {
    id: row.id,
    title: row.title || '',
    category: row.category || '',
    subcategory: row.subcategory,
    price: Number(row.price) || 0,
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    currency: 'RUB',
    image: row.image_url,
    seller: row.seller || {
      id: row.seller_id || 'unknown',
      username: row.seller_name || 'Продавец',
      avatar: row.seller_avatar || (row.seller_name?.[0] || 'P').toUpperCase(),
      rating: 4.8,
      positivePercent: 98,
      totalSales: 0,
      registeredAt: row.created_at,
      level: 'silver',
      isVerified: false,
      isOnline: false,
      reviewsCount: 0,
      responseTime: '~1ч',
    },
    tags: [],
    riskLevel: (row.risk_level as 'low' | 'medium' | 'high') || 'low',
    hasOriginalEmail: row.has_original_email ?? false,
    hasTempEmail: row.has_temp_email ?? false,
    lastLogin: row.last_login || '',
    country: row.country || '',
    gamesCount: row.games_count,
    guarantee: row.guarantee ?? true,
    guaranteeHours: row.guarantee_hours ?? 24,
    escrow: row.escrow ?? true,
    isBanned: false,
    createdAt: row.created_at,
    description: row.description || '',
    priceHistory: [],
    rating: 4.8,
    reviewsCount: 0,
    isFavorite: false,
    soldCount: 0,
    views: row.views || 0,
  };
}

export function accountToDb(a: Partial<Account> & { seller_id?: string }) {
  return {
    seller_id: a.seller_id,
    title: a.title,
    description: a.description,
    category: a.category,
    subcategory: a.subcategory,
    price: a.price,
    old_price: a.oldPrice,
    country: a.country,
    last_login: a.lastLogin,
    games_count: a.gamesCount,
    has_original_email: a.hasOriginalEmail,
    has_temp_email: a.hasTempEmail,
    guarantee: a.guarantee,
    guarantee_hours: a.guaranteeHours,
    escrow: a.escrow,
    risk_level: a.riskLevel,
    image_url: a.image,
    status: 'active',
  };
}
