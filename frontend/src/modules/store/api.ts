import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import { getMockStoreProducts, getMockStoreProduct } from '@/lib/mock/store-products'
import { isStrapiForbiddenError } from '@/lib/api/fallback'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { StrapiListResponse } from '@/types'
import type { StoreProduct, StoreProductSummary } from './types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { StrapiApiError } from '@/lib/api/client'

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
const ENDPOINT = API_ENDPOINTS.store

/**
 * VITE_STRAPI_API_URL 未設定時はモックデータを使う
 * → Strapi なしでフロントエンドのストア UI を確認できる
 */
const USE_MOCK = !import.meta.env.VITE_STRAPI_API_URL

/**
 * 商品一覧を取得する
 * Strapi 未設定時: モックデータを返す
 */
export function getProducts(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<StoreProductSummary>> {
  if (USE_MOCK) {
    const pageSize = params?.pagination?.pageSize ?? 12
    return Promise.resolve(getMockStoreProducts(pageSize))
  }
  const merged = {
    populate: ['previewImage'],
    sort: ['publishAt:desc'],
    ...params,
  }
  return fetchCollection<StoreProductSummary>(ENDPOINT, merged).catch((error) => {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      return getMockStoreProducts(merged.pagination?.pageSize ?? 12)
    }
    throw error
  })
}

/**
 * スラッグで商品詳細を取得する
 * 見つからない場合は null を返す
 * Strapi 未設定時: モックデータから検索する
 */
export async function getProduct(slug: string, signal?: AbortSignal): Promise<StoreProduct | null> {
  if (USE_MOCK) {
    const res = getMockStoreProduct(slug)
    return res?.data ?? null
  }
  try {
    return await fetchBySlug<StoreProduct>(ENDPOINT, slug, {
      populate: ['previewImage'],
    }, { signal })
  } catch (error) {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      const res = getMockStoreProduct(slug)
      return res?.data ?? null
    }
    throw error
  }
}
