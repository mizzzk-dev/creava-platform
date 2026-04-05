/** ルートパスの定数 */
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  WORKS: '/works',
  WORK_DETAIL: '/works/:slug',
  NEWS: '/news',
  NEWS_DETAIL: '/news/:slug',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:slug',
  FANCLUB: '/fanclub',
  FANCLUB_DETAIL: '/fanclub/:slug',
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:slug',
  CONTACT: '/contact',
  STORE: '/store',
  STORE_DETAIL: '/store/:handle',
  CART: '/store/cart',
  MEMBER: '/member',
  PRICING: '/pricing',
  FAQ: '/faq',
  LEGAL_PRIVACY: '/legal/privacy-policy',
  LEGAL_TERMS: '/legal/terms',
  LEGAL_COOKIE: '/legal/cookie-policy',
  LEGAL_TRADE: '/legal/tokushoho',
  PREVIEW: '/preview',
} as const

/** 詳細ページへの URL を生成する */
export const detailPath = {
  news: (slug: string) => `/news/${slug}`,
  blog: (slug: string) => `/blog/${slug}`,
  work: (slug: string) => `/works/${slug}`,
  fanclub: (slug: string) => `/fanclub/${slug}`,
  event: (slug: string) => `/events/${slug}`,
  product: (handle: string) => `/store/${handle}`,
} as const
