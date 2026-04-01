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
  const ogLocale = i18n.language.startsWith('ja') ? 'ja_JP' : 'en_US'

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {SITE_URL && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      {SITE_URL && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
