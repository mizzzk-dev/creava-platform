import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import { buildEmptyListResponse, isStrapiForbiddenError } from '@/lib/api/fallback'
import { StrapiApiError } from '@/lib/api/client'
import type { GuideItem, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.guides

export function getGuideList(params?: StrapiQueryParams): Promise<StrapiListResponse<GuideItem>> {
  const merged = {
    fields: ['title', 'slug', 'summary', 'body', 'locale', 'category', 'sourceSite', 'tags', 'featured', 'displayPriority', 'seoTitle', 'seoDescription'],
    populate: ['relatedFAQs', 'relatedProducts', 'relatedEvents', 'relatedNews', 'relatedFCContent', 'coverImage'],
    sort: ['featured:desc', 'displayPriority:desc', 'updatedAt:desc'],
    pagination: { pageSize: 100, withCount: false },
    ...params,
  }

  return fetchCollection<GuideItem>(ENDPOINT, merged).catch((error) => {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      return buildEmptyListResponse<GuideItem>(merged.pagination?.pageSize ?? 100)
    }
    throw error
  })
}

export function getGuideBySlug(slug: string, params?: StrapiQueryParams): Promise<GuideItem | null> {
  return fetchBySlug<GuideItem>(ENDPOINT, slug, {
    populate: ['relatedFAQs', 'relatedProducts', 'relatedEvents', 'relatedNews', 'relatedFCContent', 'coverImage'],
    ...params,
  }).catch((error) => {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      return null
    }
    throw error
  })
}
