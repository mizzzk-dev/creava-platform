import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { FanclubContent, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.fanclub

/**
 * ファンクラブコンテンツ一覧を取得する
 *
 * NOTE: FC限定コンテンツの表示制御は canViewContent() を各ページで適用すること
 */
export function getFanclubList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<FanclubContent>> {
  return fetchCollection<FanclubContent>(ENDPOINT, {
    sort: ['publishAt:desc'],
    populate: ['thumbnail'],
    ...params,
  })
}

/**
 * スラッグでファンクラブコンテンツ詳細を取得する
 */
export function getFanclubDetail(
  slug: string,
  signal?: AbortSignal,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<FanclubContent | null> {
  return fetchBySlug<FanclubContent>(ENDPOINT, slug, { populate: ['thumbnail'], ...params }, { signal })
}
