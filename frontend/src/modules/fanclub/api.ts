import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { FanclubContent, StrapiListResponse } from '@/types'

const ENDPOINT = '/fanclub-contents'

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
    ...params,
  })
}

/**
 * スラッグでファンクラブコンテンツ詳細を取得する
 */
export function getFanclubDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<FanclubContent | null> {
  return fetchBySlug<FanclubContent>(ENDPOINT, slug, params)
}
