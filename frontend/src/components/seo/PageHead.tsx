import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { SITE_NAME, OG_DEFAULT_IMAGE, buildCanonicalUrl, buildLocaleAlternates } from '@/lib/seo'

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
  /** noindex 時にも nofollow まで付けるか */
  nofollow?: boolean
  /** canonical を個別に上書きしたい場合 */
  canonicalUrl?: string
  /** canonical パスを location.pathname 以外で指定したい場合 */
  canonicalPath?: string
  /** OGP専用タイトル */
  ogTitle?: string
  /** OGP専用description */
  ogDescription?: string
  /** meta keywords */
  keywords?: string[]
}

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
  nofollow,
  canonicalUrl,
  canonicalPath,
  ogTitle,
  ogDescription,
  keywords,
}: Props) {
  const { i18n } = useTranslation()
  const { pathname } = useLocation()

  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const resolvedCanonicalUrl = canonicalUrl ?? buildCanonicalUrl(canonicalPath ?? pathname)
  const ogLocale = resolveOgLocale(i18n.language)
  const alternateLinks = buildLocaleAlternates(canonicalPath ?? pathname)
  const robotsContent = noindex ? `noindex,${nofollow ?? true ? 'nofollow' : 'follow'}` : undefined

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      {robotsContent && <meta name="robots" content={robotsContent} />}
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={resolvedCanonicalUrl} />
      {alternateLinks.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={resolvedCanonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle ?? pageTitle} />
      {(ogDescription ?? description) && <meta property="og:description" content={ogDescription ?? description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="ja_JP" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="ko_KR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle ?? pageTitle} />
      {(ogDescription ?? description) && <meta name="twitter:description" content={ogDescription ?? description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
