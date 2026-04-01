import type { ContentStatus } from '@/types'

/** 購入ステータス */
export type PurchaseStatus = 'available' | 'soldout' | 'coming_soon'

/**
 * 商品サマリー（一覧ページ用）
 *
 * Strapi collection: store-products
 * 必要フィールド: title, slug, price, currency, previewImage,
 *                status, limitedEndAt, archiveVisibleForFC,
 *                stripeLink, baseLink, purchaseStatus
 */
export interface StoreProductSummary {
  id: number
  documentId: string
  slug: string
  title: string
  /** 価格（整数、日本円なら税込み円単位） */
  price: number
  /** 通貨コード（デフォルト: 'JPY'） */
  currency: string
  previewImage: { url: string; alt: string | null } | null
  /** FC 表示制御 */
  status: ContentStatus
  limitedEndAt: string | null
  archiveVisibleForFC: boolean
  /** Stripe Checkout / Payment Link URL */
  stripeLink: string | null
  /** BASE 商品ページ URL */
  baseLink: string | null
  purchaseStatus: PurchaseStatus
}

/**
 * 商品詳細（詳細ページ用）
 *
 * 追加フィールド: description, externalPurchaseNote
 */
export interface StoreProduct extends StoreProductSummary {
  description: string | null
  /** 購入時の補足説明（「送料別途」「受注生産」など） */
  externalPurchaseNote: string | null
}
