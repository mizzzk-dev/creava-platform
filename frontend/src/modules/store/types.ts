import type { ContentStatus } from '@/types'

export type PurchaseStatus = 'available' | 'soldout' | 'coming_soon'
export type StoreCategory = 'other' | 'digital' | 'photo' | 'apparel' | 'print'

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
}

export interface StoreProduct extends StoreProductSummary {
  description: string | null
  externalPurchaseNote: string | null
  cautionNotes?: string | null
  shippingNotes?: string | null
  digitalDeliveryNotes?: string | null
}
