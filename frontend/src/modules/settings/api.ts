import { fetchSingle } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { SiteSettings, StrapiSingleResponse } from '@/types'

/** Strapi の Single Type エンドポイント */
const ENDPOINT = '/site-setting'

/**
 * サイト設定（Single Type）を取得する
 */
export function getSiteSettings(
  params?: StrapiQueryParams,
): Promise<StrapiSingleResponse<SiteSettings>> {
  return fetchSingle<SiteSettings>(ENDPOINT, params)
}
