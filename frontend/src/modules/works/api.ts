import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { Work, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.works

/**
 * 作品一覧を取得する
 */
export function getWorksList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<Work>> {
  return fetchCollection<Work>(ENDPOINT, {
    sort: ['publishAt:desc'],
    populate: ['thumbnail'],
    ...params,
  })
}

/**
 * スラッグで作品詳細を取得する
 */
export function getWorkDetail(
  slug: string,
  signal?: AbortSignal,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<Work | null> {
  return fetchBySlug<Work>(ENDPOINT, slug, { populate: ['thumbnail'], ...params }, { signal })
}
