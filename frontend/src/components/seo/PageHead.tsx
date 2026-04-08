import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { SITE_NAME, SITE_URL, OG_DEFAULT_IMAGE } from '@/lib/seo'

interface Props {
  /** ページ固有のタイトル。未指定なら SITE_NAME のみ */
  title?: string
  /** ページ固有の description */
  description?: string
  /** OGP 画像 URL */
  ogImage?: string
  /** OGP タイプ（記事は 'article'） */
  ogType?: 'website' | 'article'
  /** ファンクラブ等の会員限定ページは true にして noindex */
  noindex?: boolean
}

const ALT_LANGS = ['ja', 'en', 'ko'] as const

function resolveOgLocale(language: string): 'ja_JP' | 'en_US' | 'ko_KR' {
  if (language.startsWith('ja')) return 'ja_JP'
  if (language.startsWith('ko')) return 'ko_KR'
  return 'en_US'
}

export default function PageHead({
  title,
  description,
  ogImage = OG_DEFAULT_IMAGE,
  ogType = 'website',
  noindex = false,
}: Props) {
  const { i18n } = useTranslation()
  const { pathname } = useLocation()

  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = `${SITE_URL}${pathname}`
  const ogLocale = resolveOgLocale(i18n.language)
  const alternateLinks = ALT_LANGS.map((lang) => ({
    lang,
    href: `${canonicalUrl}?lng=${lang}`,
  }))

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {SITE_URL && <link rel="canonical" href={canonicalUrl} />}
      {SITE_URL && alternateLinks.map(({ lang, href }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={href} />
      ))}
      {SITE_URL && <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      {SITE_URL && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="ja_JP" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="ko_KR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
