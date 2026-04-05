import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import { buildEmptyListResponse, isStrapiForbiddenError } from '@/lib/api/fallback'
import type { NewsItem, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.news

export function getNewsList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<NewsItem>> {
  const merged = {
    fields: ['title', 'slug', 'publishAt', 'accessStatus', 'limitedEndAt', 'archiveVisibleForFC'],
    sort: ['publishAt:desc'],
    populate: {
      thumbnail: { fields: ['url', 'alternativeText', 'width', 'height'] },
    },
    pagination: { pageSize: 16, withCount: false },
    ...params,
  }

  return fetchCollection<NewsItem>(ENDPOINT, merged).catch((error) => {
    if (isStrapiForbiddenError(error)) {
      return buildEmptyListResponse<NewsItem>(merged.pagination?.pageSize ?? 16)
    }
    throw error
  })
}

export function getNewsDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<NewsItem | null> {
  return fetchBySlug<NewsItem>(ENDPOINT, slug, { populate: ['thumbnail'], ...params })
}
