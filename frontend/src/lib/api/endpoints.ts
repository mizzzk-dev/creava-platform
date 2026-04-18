/**
 * Strapi API エンドポイント定数
 *
 * バックエンドの schema.json の `pluralName` と一致させること。
 * 変更時は backend/src/api/<name>/content-types/<name>/schema.json の
 * "pluralName" を必ず確認する。
 *
 * Collection Types → pluralName がエンドポイントになる
 * Single Types     → singularName がエンドポイントになる
 */
export const API_ENDPOINTS = {
  // Collection Types
  works:           '/works',
  news:            '/news-items',
  blog:            '/blog-posts',
  fanclub:         '/fanclub-contents',
  events:          '/events',
  store:           '/store-products',
  campaigns:       '/campaigns',
  memberOrders:    '/orders',
  memberShipments: '/shipments',
  memberNotices:   '/member-notices',
  memberAuditLogs: '/audit-logs',
  membershipPlans: '/membership-plans',
  checkoutAttempts: '/checkout-attempts',
  paymentRecords: '/payment-records',
  subscriptionRecords: '/subscription-records',
  webhookEventLogs: '/webhook-event-logs',
  mediaItems:      '/media-items',
  awards:          '/awards',
  faqs:            '/faqs',
  guides:          '/guides',
  favorites:       '/favorites',
  viewHistories:   '/view-histories',
  memberNotifications: '/member-notifications',
  notificationPreferences: '/notification-preferences',
  lifecycleTemplates: '/lifecycle-templates',
  deliveryLogs: '/delivery-logs',
  communityReactions: '/community-reactions',
  participationLogs: '/participation-logs',
  communityPosts: '/community-posts',
  communityReports: '/community-reports',
  moderationLogs: '/moderation-logs',

  // Single Types
  profile:         '/profile',
  siteSettings:    '/site-setting',
} as const
