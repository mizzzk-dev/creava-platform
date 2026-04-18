import type { ContentStatus } from '@/types'

export type PurchaseStatus = 'available' | 'soldout' | 'coming_soon'
export type StoreCategory = 'other' | 'digital' | 'photo' | 'apparel' | 'print'
export type CampaignType = 'feature' | 'drop' | 'launch' | 'restock' | 'benefit' | 'announcement'
export type NotifyType = 'restock' | 'sale_start' | 'campaign' | 'member_early_access' | 'weekly_update'

export interface StoreProductSummary {
  id: number
  documentId: string
  slug: string
  title: string
  price: number
  currency: string
  previewImage: { url: string; alt: string | null } | null
  accessStatus: ContentStatus
  limitedEndAt: string | null
  archiveVisibleForFC: boolean
  stripeLink: string | null
  baseLink: string | null
  stripeProductId?: string | null
  stripePriceId?: string | null
  productType?: 'digital' | 'physical' | 'ticket' | 'service' | string
  isPurchasable?: boolean
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | string
  saleStatus?: 'active' | 'scheduled' | 'ended' | string
  metadataKey?: string | null
  purchaseStatus: PurchaseStatus
  stock: number
  category: StoreCategory | string
  tags: string[]
  sortOrder: number
  featured: boolean
  isNewArrival: boolean
  pickup: boolean
  memberBenefit: string | null
  membersOnlyNotice: string | null
  earlyAccess: boolean
  specialOffer: string | null
  campaignLabel: string | null
  campaignSlug?: string | null
  campaignType?: CampaignType
  shortHighlight: string | null
  heroCopy: string | null
  heroSubcopy?: string | null
  heroVisual?: { url: string; alt: string | null } | null
  heroIllustration?: { url: string; alt: string | null } | null
  illustrationAsset?: { url: string; alt: string | null } | null
  isTrending: boolean
  isLimited: boolean
  membersOnly?: boolean
  startAt?: string | null
  endAt?: string | null
  bannerLink?: string | null
  ctaText?: string | null
  ctaLink?: string | null
  sectionStyle?: string | null
  cardStyleVariant?: string | null
  badgeStyleVariant?: string | null
  backgroundVariant?: string | null
  sectionBackgroundVariant?: string | null
  motionStyle?: string | null
  displayPriority: number
  notifyEnabled?: boolean
  notifyType?: NotifyType | null
  notifyLabel?: string | null
  restockExpectedAt?: string | null
  isImportant?: boolean
  weeklyHighlight?: boolean
  dashboardPriority?: number
  announcementBar?: boolean
  notificationCopy?: string | null
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

export interface RelatedContentLink {
  id: number
  slug: string
  title: string
}

export interface StoreProduct extends StoreProductSummary {
  description: string | null
  externalPurchaseNote: string | null
  cautionNotes?: string | null
  shippingNotes?: string | null
  digitalDeliveryNotes?: string | null
  relatedProducts: RelatedContentLink[]
  relatedNews: RelatedContentLink[]
  relatedEvents: RelatedContentLink[]
  relatedBlogPosts: RelatedContentLink[]
  relatedFanclubContents: RelatedContentLink[]
}
