import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { Work, StrapiListResponse } from '@/types'

const ENDPOINT = '/works'

/**
 * 作品一覧を取得する
 */
export function getWorksList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<Work>> {
  return fetchCollection<Work>(ENDPOINT, {
    sort: ['publishAt:desc'],
    ...params,
  })
}

/**
 * スラッグで作品詳細を取得する
 */
export function getWorkDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<Work | null> {
  return fetchBySlug<Work>(ENDPOINT, slug, params)
}
