import type { ContentStatus } from '@/types'

export type PurchaseStatus = 'available' | 'soldout' | 'coming_soon'
export type StoreCategory = 'other' | 'digital' | 'photo' | 'apparel' | 'print'
export type CampaignType = 'feature' | 'drop' | 'launch' | 'restock' | 'benefit' | 'announcement'

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
  isTrending: boolean
  isLimited: boolean
  membersOnly?: boolean
  startAt?: string | null
  endAt?: string | null
  bannerLink?: string | null
  ctaText?: string | null
  ctaLink?: string | null
  sectionStyle?: string | null
  badgeStyleVariant?: string | null
  displayPriority: number
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
