import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { NewsItem, StrapiListResponse } from '@/types'

/** Strapi のコレクションエンドポイント名 */
const ENDPOINT = '/news-items'

/**
 * ニュース一覧を取得する
 */
export function getNewsList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<NewsItem>> {
  return fetchCollection<NewsItem>(ENDPOINT, {
    sort: ['publishAt:desc'],
    ...params,
  })
}

/**
 * スラッグでニュース詳細を取得する
 */
export function getNewsDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<NewsItem | null> {
  return fetchBySlug<NewsItem>(ENDPOINT, slug, params)
}
