import { fetchCollection } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import { buildEmptyListResponse, isStrapiForbiddenError } from '@/lib/api/fallback'
import { StrapiApiError } from '@/lib/api/client'
import type { FAQItem, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.faqs

export function getFaqList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<FAQItem>> {
  const merged = {
    fields: ['question', 'answer', 'category', 'subcategory', 'sourceSite', 'tags', 'relatedForms', 'featured', 'isPublic', 'displayPriority', 'keywords', 'slug', 'seoTitle', 'seoDescription', 'ogTitle', 'ogDescription', 'canonicalUrl', 'noindex', 'nofollow', 'breadcrumbLabel', 'structuredDataJson', 'order'],
    populate: ['relatedGuides', 'relatedProducts', 'relatedEvents', 'relatedNews', 'relatedFCContent'],
    sort: ['displayPriority:desc', 'sortOrder:asc', 'order:asc', 'updatedAt:desc'],
    pagination: { pageSize: 100, withCount: false },
    ...params,
  }

  return fetchCollection<FAQItem>(ENDPOINT, merged).catch((error) => {
    if (isStrapiForbiddenError(error) || (error instanceof StrapiApiError && (error.status === 0 || error.status === 408))) {
      return buildEmptyListResponse<FAQItem>(merged.pagination?.pageSize ?? 100)
    }
    throw error
  })
}
