import { SITE_TYPE } from '@/lib/siteLinks'

export type SourceSite = 'main' | 'store' | 'fc'
export type UserState = 'guest' | 'logged_in'

export interface AnalyticsBaseContext {
  sourceSite: SourceSite
  locale: string
  theme: 'light' | 'dark'
  pageType: string
  userState: UserState
  deviceType: 'mobile' | 'tablet' | 'desktop'
  referrerType: 'direct' | 'internal' | 'external'
  experimentId?: string
  variantId?: string
  timestamp: string
}

const DEFAULT_LOCALE = 'ja'

function normalizeSourceSite(): SourceSite {
  if (SITE_TYPE === 'store') return 'store'
  if (SITE_TYPE === 'fanclub') return 'fc'
  return 'main'
}

function detectTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function detectReferrerType(): 'direct' | 'internal' | 'external' {
  if (typeof document === 'undefined' || !document.referrer) return 'direct'

  try {
    const referrer = new URL(document.referrer)
    if (referrer.origin === window.location.origin) return 'internal'
    return 'external'
  } catch {
    return 'external'
  }
}

function detectUserState(): UserState {
  if (typeof window === 'undefined') return 'guest'
  return localStorage.getItem('logto_access_token') ? 'logged_in' : 'guest'
}

export function inferPageType(pathname: string): string {
  if (!pathname || pathname === '/') return 'home'
  if (pathname.startsWith('/products') || pathname.startsWith('/store')) return 'product'
  if (pathname.startsWith('/contact')) return 'contact'
  if (pathname.startsWith('/support')) return 'support'
  if (pathname.startsWith('/faq')) return 'faq'
  if (pathname.startsWith('/guide')) return 'guide'
  if (pathname.startsWith('/events')) return 'event'
  if (pathname.startsWith('/news')) return 'news'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname.startsWith('/join')) return 'join'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/mypage') || pathname.startsWith('/member')) return 'mypage'
  if (pathname.startsWith('/legal') || pathname.startsWith('/privacy') || pathname.startsWith('/terms')) return 'legal'
  return 'other'
}

export function getAnalyticsBaseContext(pathname: string): AnalyticsBaseContext {
  const locale = typeof document === 'undefined'
    ? DEFAULT_LOCALE
    : (document.documentElement.lang || DEFAULT_LOCALE)

  return {
    sourceSite: normalizeSourceSite(),
    locale,
    theme: detectTheme(),
    pageType: inferPageType(pathname),
    userState: detectUserState(),
    deviceType: detectDeviceType(),
    referrerType: detectReferrerType(),
    timestamp: new Date().toISOString(),
  }
}
