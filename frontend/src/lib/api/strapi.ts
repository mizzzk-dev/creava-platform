import { strapiGet } from './client'
import { buildQueryString } from './query'
import { isPreviewMode } from '@/lib/preview'
import type { StrapiQueryParams } from './query'
import type { StrapiListResponse, StrapiSingleResponse } from '@/types'

/**
 * プレビューモード時に status=draft を注入する
 * 通常アクセスでは何も追加しない（Strapi デフォルトは published のみ）
 */
function withPreview(params?: StrapiQueryParams): StrapiQueryParams | undefined {
  if (!isPreviewMode()) return params
  // draft モードを要求（明示的な status 指定があれば上書きしない）
  return { status: 'draft', ...params }
}

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
  const merged = withPreview(params)
  const qs = merged ? buildQueryString(merged) : ''
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
  const previewParams = isPreviewMode() ? { status: 'draft' as const } : {}
  const qs = buildQueryString({
    ...previewParams,
    ...params,
    filters: { slug: { $eq: slug } },
    pagination: { pageSize: 1 },
  })

  const res = await strapiGet<StrapiListResponse<T>>(endpoint, qs)
  return res.data[0] ?? null
}

export type { StrapiQueryParams }
