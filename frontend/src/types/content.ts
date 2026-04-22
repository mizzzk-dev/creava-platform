/**
 * Strapi コンテンツの公開ステータス
 * - public:    全員閲覧可
 * - fc_only:   member 以上
 * - limited:   期限あり（期限後は archiveVisibleForFC に従う）
 */
export type ContentStatus = 'public' | 'fc_only' | 'limited'

/**
 * Strapi Media フィールドの型（populate 時に返されるオブジェクト）
 * Strapi Cloud では url は絶対 URL、ローカルでは相対パス
 */
export interface StrapiMedia {
  id: number
  url: string
  alternativeText: string | null
  width: number | null
  height: number | null
  formats?: {
    thumbnail?: { url: string; width: number; height: number }
    small?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    large?: { url: string; width: number; height: number }
  } | null
}

/**
 * Strapi 共通フィールド
 */
export interface StrapiBase {
  id: number
  documentId: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/**
 * すべてのコンテンツが持つ共通フィールド
 *
 * NOTE: Strapi v5 は `status` をシステム予約フィールド（draft/published）として使用するため、
 * アクセス制御用のカスタム enum は `accessStatus` という名前にしています。
 */
export interface ContentBase extends StrapiBase {
  title: string
  slug: string
  accessStatus: ContentStatus
  publishAt: string | null
  limitedEndAt: string | null
  archiveVisibleForFC: boolean
}

/**
 * Strapi レスポンスの汎用ラッパー
 */
export interface StrapiResponse<T> {
  data: T
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiListResponse<T> extends StrapiResponse<T[]> {}
export interface StrapiSingleResponse<T> extends StrapiResponse<T> {}

/**
 * 各コンテンツ型（最小定義。詳細フィールドは各モジュールで拡張する）
 */
export interface Profile extends ContentBase {
  bio: string | null
  avatarUrl: string | null
}

export interface Work extends ContentBase {
  description: string | null
  thumbnail: StrapiMedia | null
  category: string | null
  isFeatured?: boolean
  externalUrl?: string | null
  caseStudyBackground?: string | null
  caseStudyGoal?: string | null
  caseStudyApproach?: string | null
  caseStudyImplementation?: string | null
  caseStudyResult?: string | null
}

export interface NewsItem extends ContentBase {
  body: string | null
  thumbnail: StrapiMedia | null
}

export interface BlogPost extends ContentBase {
  body: string | null
  thumbnail: StrapiMedia | null
  tags: string[]
}

export interface Event extends ContentBase {
  description: string | null
  startAt: string | null
  endAt: string | null
  venue: string | null
  bookingLink?: string | null
}

export interface FanclubContent extends ContentBase {
  body: string | null
  startAt?: string | null
  endAt?: string | null
  thumbnail: StrapiMedia | null
  category?: string
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroCopy?: string | null
  heroSubcopy?: string | null
  shortHighlight?: string | null
  campaignLabel?: string | null
  sectionStyle?: string | null
  cardStyleVariant?: string | null
  badgeStyleVariant?: string | null
  backgroundVariant?: string | null
  motionStyle?: string | null
  illustrationAsset?: StrapiMedia | null
  heroIllustration?: StrapiMedia | null
  weeklyHighlight?: boolean
  displayPriority?: number
}

export interface MediaItem extends StrapiBase {
  title: string
  source: string | null
  url: string | null
  publishedAt: string | null
}

export interface Award extends StrapiBase {
  title: string
  year: number | null
  organization: string | null
}

export type SourceSite = 'main' | 'store' | 'fc' | 'all'

export type FaqCategory =
  | 'general'
  | 'contact_precheck'
  | 'site_usage'
  | 'events'
  | 'profile_activity'
  | 'news'
  | 'store_order'
  | 'store_payment'
  | 'store_shipping'
  | 'store_returns'
  | 'store_digital'
  | 'store_error'
  | 'store_product'
  | 'store_legal'
  | 'fc_signup'
  | 'fc_login'
  | 'fc_payment'
  | 'fc_benefit'
  | 'fc_content'
  | 'fc_cancel'
  | 'fc_error'
  | 'fc_members_only'
  | 'fanclub'
  | 'store'
  | 'works'
  | 'contact'
  | 'account_issue'
  | 'membership_issue'
  | 'billing_issue'
  | 'renewal_issue'
  | 'privacy_issue'
  | 'security_issue'
  | 'order_issue'
  | 'fc_issue'
  | 'technical_issue'
  | 'content_issue'
  | 'other'

export interface FAQItem extends StrapiBase {
  question: string
  answer: string
  category: FaqCategory
  subcategory?: string | null
  sourceSite: SourceSite
  tags?: string[] | null
  relatedGuides?: Array<{ id: number; title: string; slug: string }> | null
  relatedForms?: string[] | null
  relatedProducts?: Array<{ id: number; title: string; slug: string }> | null
  relatedEvents?: Array<{ id: number; title: string; slug: string }> | null
  relatedNews?: Array<{ id: number; title: string; slug: string }> | null
  relatedFCContent?: Array<{ id: number; title: string; slug: string }> | null
  isPublic: boolean
  displayPriority: number
  featured: boolean
  keywords?: string[] | null
  slug: string
  seoTitle?: string | null
  seoDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  noindex?: boolean
  nofollow?: boolean
  breadcrumbLabel?: string | null
  structuredDataJson?: Record<string, unknown> | null
  order: number
}

export interface GuideItem extends StrapiBase {
  title: string
  slug: string
  summary: string | null
  body: string | null
  locale: string | null
  category: string
  sourceSite: SourceSite
  tags?: string[] | null
  relatedFAQs?: Array<{ id: number; question: string; slug: string }> | null
  relatedForms?: string[] | null
  relatedProducts?: Array<{ id: number; title: string; slug: string }> | null
  relatedEvents?: Array<{ id: number; title: string; slug: string }> | null
  relatedNews?: Array<{ id: number; title: string; slug: string }> | null
  relatedFCContent?: Array<{ id: number; title: string; slug: string }> | null
  featured: boolean
  displayPriority: number
  seoTitle?: string | null
  seoDescription?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  canonicalUrl?: string | null
  noindex?: boolean
  nofollow?: boolean
  breadcrumbLabel?: string | null
  structuredDataJson?: Record<string, unknown> | null
}

/**
 * サイト設定（Strapi Single Type: site-setting）
 */
export interface SiteSettings extends StrapiBase {
  siteName: string
  description: string | null
  logoUrl: string | null
  ogImage?: StrapiMedia | null
  announcementText?: string | null
  announcementUrl?: string | null
  announcementLevel?: 'info' | 'urgent' | null
  announcementBadge?: 'new' | 'important' | 'members' | 'early' | null
  announcementSecondaryText?: string | null
  weeklyHighlightTitle?: string | null
  weeklyHighlightText?: string | null
  weeklyHighlightUrl?: string | null
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroCopy?: string | null
  heroSubcopy?: string | null
  heroCTALabel?: string | null
  heroCTAUrl?: string | null
  heroVisual?: StrapiMedia | null
  heroVisualMobile?: StrapiMedia | null
  heroIllustration?: StrapiMedia | null
  heroSlides?: unknown
  heroSlidesDesktop?: StrapiMedia[] | null
  heroSlidesMobile?: StrapiMedia[] | null
  mainHeroImage?: StrapiMedia | null
  mainHeroImageMobile?: StrapiMedia | null
  fcHeroImage?: StrapiMedia | null
  fcHeroImageMobile?: StrapiMedia | null
  aboutMainVisual?: StrapiMedia | null
  aboutSubVisuals?: StrapiMedia[] | null
  pickupImage?: StrapiMedia | null
  featuredImage?: StrapiMedia | null
  campaignImage?: StrapiMedia | null
  collectionHeroImages?: StrapiMedia[] | null
  heroOverlayStyle?: 'soft' | 'dark' | 'editorial' | 'none' | null
  heroFocalPoint?: string | null
  imageAltDefault?: string | null
  illustrationAsset?: StrapiMedia | null
  sectionBackgroundVariant?: string | null
  backgroundVariant?: string | null
  motionStyle?: string | null
  cardStyleVariant?: string | null
  badgeStyleVariant?: string | null
  campaign?: string | null
  topPageSections?: unknown
  seasonalTheme?: 'default' | 'christmas' | 'halloween' | 'newyear' | null
  themeMode?: 'auto' | 'manual' | null
  autoThemeEnabled?: boolean
  manualThemeOverride?: 'default' | 'christmas' | 'halloween' | 'newyear' | null
  seasonalStartAt?: string | null
  seasonalEndAt?: string | null
  heroSeasonalVariant?: string | null
  illustrationSeasonalVariant?: string | null
  loadingAnimationVariant?: string | null
  scrollAnimationVariant?: string | null
  sectionStyleVariant?: string | null
  seasonalBadgeVariant?: string | null
  seasonalBackgroundVariant?: string | null
  seasonalCampaign?: unknown
  themeAppliedSites?: unknown
  newyearIntroEnabled?: boolean
  omikujiEnabled?: boolean
  omikujiMessages?: unknown
  omikujiVisualVariant?: string | null
  perYearEventKey?: string | null
  firstVisitOnlyEnabled?: boolean
  notificationCtaText?: string | null
  notificationCtaLink?: string | null
  errorPageNotFoundTitle?: string | null
  errorPageNotFoundSubcopy?: string | null
  errorPageNotFoundHint?: string | null
  errorPageServerTitle?: string | null
  errorPageServerSubcopy?: string | null
  errorPageServerHint?: string | null
  errorPageMaintenanceTitle?: string | null
  errorPageMaintenanceSubcopy?: string | null
  errorPageMaintenanceHint?: string | null
  errorPageMaintenanceBadge?: string | null
  errorPageRestrictedTitle?: string | null
  errorPageRestrictedSubcopy?: string | null
  errorPageRestrictedHint?: string | null
  errorPageCtaContactLabel?: string | null
  errorPageCtaHomeLabel?: string | null
  errorPageIllustration?: StrapiMedia | null
  errorPageAnimationStyle?: string | null
  errorPageBackgroundVariant?: string | null
  aboutHeroCopy?: string | null
  aboutHeroSubcopy?: string | null
  aboutSections?: unknown
  aboutWorldViewCopy?: string | null
  aboutCtaLabel?: string | null
  aboutCtaUrl?: string | null
  featured?: boolean | null
  pickup?: boolean | null
  isNew?: boolean | null
  isTrending?: boolean | null
  displayPriority?: number | null
  animationStyle?: string | null
  sectionStyle?: string | null
}
