import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import { getMockStoreProducts, getMockStoreProduct } from '@/lib/mock/store-products'
import { isStrapiForbiddenError } from '@/lib/api/fallback'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { StrapiListResponse } from '@/types'
import type { StoreProduct, StoreProductSummary, PurchaseStatus } from './types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { StrapiApiError } from '@/lib/api/client'

const ENDPOINT = API_ENDPOINTS.store
const USE_MOCK = !import.meta.env.VITE_STRAPI_API_URL

function normalizePurchaseStatus(value: unknown): PurchaseStatus {
  if (value === 'soldout' || value === 'coming_soon') return value
  return 'available'
}

function normalizeStoreProduct(item: Partial<StoreProductSummary>): StoreProductSummary {
  return {
    id: Number(item.id ?? 0),
    documentId: String(item.documentId ?? ''),
    slug: String(item.slug ?? ''),
    title: String(item.title ?? ''),
    price: typeof item.price === 'number' ? item.price : 0,
    currency: typeof item.currency === 'string' ? item.currency : 'JPY',
    previewImage: item.previewImage ?? null,
    accessStatus: item.accessStatus ?? 'public',
    limitedEndAt: item.limitedEndAt ?? null,
    archiveVisibleForFC: Boolean(item.archiveVisibleForFC),
    stripeLink: item.stripeLink ?? null,
    baseLink: item.baseLink ?? null,
    purchaseStatus: normalizePurchaseStatus(item.purchaseStatus),
    stock: typeof item.stock === 'number' ? item.stock : 0,
    category: typeof item.category === 'string' && item.category ? item.category : 'other',
    tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
    featured: Boolean(item.featured),
    isNewArrival: Boolean(item.isNewArrival),
  }
}

function validateStoreListResponse(res: StrapiListResponse<StoreProductSummary>): StrapiListResponse<StoreProductSummary> {
  const normalized = res.data
    .map((item) => normalizeStoreProduct(item))
    .filter((item) => item.id > 0 && item.slug && item.title)

  return {
    ...res,
    data: normalized,
  }
}

export function getProducts(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<StoreProductSummary>> {
  if (USE_MOCK) {
    const pageSize = params?.pagination?.pageSize ?? 12
    return Promise.resolve(getMockStoreProducts(pageSize))
  }

  const merged = {
    fields: ['title', 'slug', 'price', 'currency', 'accessStatus', 'limitedEndAt', 'archiveVisibleForFC', 'stripeLink', 'baseLink', 'purchaseStatus', 'stock', 'category', 'tags', 'sortOrder', 'featured', 'isNewArrival'],
    populate: {
      previewImage: { fields: ['url', 'alternativeText', 'width', 'height'] },
    },
    sort: ['sortOrder:asc', 'publishAt:desc'],
    pagination: { pageSize: 24, withCount: false },
    ...params,
  }

  return fetchCollection<StoreProductSummary>(ENDPOINT, merged)
    .then(validateStoreListResponse)
    .catch((error) => {
      if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
        return getMockStoreProducts(merged.pagination?.pageSize ?? 12)
      }
      throw error
    })
}

export async function getProduct(slug: string, signal?: AbortSignal): Promise<StoreProduct | null> {
  if (USE_MOCK) {
    const res = getMockStoreProduct(slug)
    return res?.data ?? null
  }
  try {
    const product = await fetchBySlug<StoreProduct>(ENDPOINT, slug, {
      fields: ['title', 'slug', 'price', 'currency', 'accessStatus', 'limitedEndAt', 'archiveVisibleForFC', 'stripeLink', 'baseLink', 'purchaseStatus', 'description', 'externalPurchaseNote', 'stock', 'category', 'tags', 'sortOrder', 'featured', 'isNewArrival', 'cautionNotes', 'shippingNotes', 'digitalDeliveryNotes'],
      populate: {
        previewImage: { fields: ['url', 'alternativeText', 'width', 'height'] },
      },
    }, { signal })

    if (!product) return null
    return {
      ...normalizeStoreProduct(product),
      description: product.description ?? null,
      externalPurchaseNote: product.externalPurchaseNote ?? null,
      cautionNotes: product.cautionNotes ?? null,
      shippingNotes: product.shippingNotes ?? null,
      digitalDeliveryNotes: product.digitalDeliveryNotes ?? null,
    }
  } catch (error) {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      const res = getMockStoreProduct(slug)
      return res?.data ?? null
    }
    throw error
  }
}
