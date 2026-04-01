import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { StrapiListResponse } from '@/types'
import type { StoreProduct, StoreProductSummary } from './types'

/**
 * Strapi コレクションエンドポイント名
 *
 * CMS 側に必要なフィールド:
 *   title, slug, price, currency, previewImage (media),
 *   status, limitedEndAt, archiveVisibleForFC,
 *   stripeLink, baseLink, purchaseStatus,
 *   description, externalPurchaseNote
 *
 * 将来 Shopify へ移行する場合は ENDPOINT と型を差し替える
 */
const ENDPOINT = '/store-products'

/**
 * 商品一覧を取得する
 */
export function getProducts(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<StoreProductSummary>> {
  return fetchCollection<StoreProductSummary>(ENDPOINT, {
    populate: ['previewImage'],
    sort: ['publishAt:desc'],
    ...params,
  })
}

/**
 * スラッグで商品詳細を取得する
 * 見つからない場合は null を返す
 */
export function getProduct(slug: string): Promise<StoreProduct | null> {
  return fetchBySlug<StoreProduct>(ENDPOINT, slug, {
    populate: ['previewImage'],
  })
}
