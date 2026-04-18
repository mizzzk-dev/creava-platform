import { MAIN_SITE_URL, STORE_SITE_URL, FANCLUB_SITE_URL, SITE_TYPE } from '@/lib/siteLinks'

export const SITE_NAME = 'mizzz'

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? ''

/** OGP のデフォルト画像（public/ に配置する想定） */
export const OG_DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

const ALT_LANGS = ['ja', 'en', 'ko'] as const

export type SeoSiteType = 'main' | 'store' | 'fanclub'

export interface AlternateLink {
  hrefLang: string
  href: string
}

export const resolveSiteUrl = (siteType: SeoSiteType = SITE_TYPE): string => {
  if (siteType === 'store') return STORE_SITE_URL
  if (siteType === 'fanclub') return FANCLUB_SITE_URL
  return MAIN_SITE_URL
}

export const buildCanonicalUrl = (pathname: string, siteType: SeoSiteType = SITE_TYPE): string => {
  const origin = resolveSiteUrl(siteType)
  return `${origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

export const buildLocaleAlternates = (pathname: string, siteType: SeoSiteType = SITE_TYPE): AlternateLink[] => {
  const canonical = buildCanonicalUrl(pathname, siteType)
  return ALT_LANGS.map((lang) => ({
    hrefLang: lang,
    href: lang === 'ja' ? canonical : `${canonical}?lng=${lang}`,
  }))
}

/**
 * body テキストを OGP description 用に短縮する
 * 改行を除去して maxLen 文字で切り詰める
 */
export function truncateForDescription(text: string, maxLen = 120): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}…` : normalized
}
