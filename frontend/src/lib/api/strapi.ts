import { strapiGet } from './client'
import { buildQueryString } from './query'
import type { StrapiQueryParams } from './query'
import type { StrapiListResponse, StrapiSingleResponse } from '@/types'

/**
 * Strapi Collection Type の一覧を取得する
 *
 * @param endpoint - Strapi のコレクションエンドポイント（例: `/news-items`）
 * @param params   - クエリパラメータ
 */
export function fetchCollection<T>(
  endpoint: string,
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<T>> {
  const qs = params ? buildQueryString(params) : ''
  return strapiGet<StrapiListResponse<T>>(endpoint, qs)
}

/**
 * Strapi Single Type を取得する
 *
 * @param endpoint - Strapi の Single Type エンドポイント（例: `/site-setting`）
 * @param params   - クエリパラメータ
 */
export function fetchSingle<T>(
  endpoint: string,
  params?: StrapiQueryParams,
): Promise<StrapiSingleResponse<T>> {
  const qs = params ? buildQueryString(params) : ''
  return strapiGet<StrapiSingleResponse<T>>(endpoint, qs)
}

/**
 * Strapi Collection Type からスラッグで単一アイテムを取得する
 *
 * filters[slug][$eq]=<slug> を使って検索し、最初の結果を返す
 * 見つからない場合は null を返す
 *
 * @param endpoint - Strapi のコレクションエンドポイント
 * @param slug     - 取得するアイテムのスラッグ
 * @param params   - 追加クエリパラメータ
 */
export async function fetchBySlug<T>(
  endpoint: string,
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<T | null> {
  const qs = buildQueryString({
    ...params,
    filters: { slug: { $eq: slug } },
    pagination: { pageSize: 1 },
  })

  const res = await strapiGet<StrapiListResponse<T>>(endpoint, qs)
  return res.data[0] ?? null
}

export type { StrapiQueryParams }
