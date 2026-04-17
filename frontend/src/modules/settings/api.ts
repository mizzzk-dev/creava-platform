import { fetchSingle } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { SiteSettings, StrapiSingleResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/** Strapi の Single Type エンドポイント */
const ENDPOINT = API_ENDPOINTS.siteSettings

/**
 * サイト設定（Single Type）を取得する
 */
export function getSiteSettings(
  params?: StrapiQueryParams,
): Promise<StrapiSingleResponse<SiteSettings>> {
  return fetchSingle<SiteSettings>(ENDPOINT, {
    populate: [
      'ogImage',
      'heroVisual',
      'heroVisualMobile',
      'heroIllustration',
      'heroSlidesDesktop',
      'heroSlidesMobile',
      'mainHeroImage',
      'mainHeroImageMobile',
      'fcHeroImage',
      'fcHeroImageMobile',
      'aboutMainVisual',
      'aboutSubVisuals',
      'pickupImage',
      'featuredImage',
      'campaignImage',
      'collectionHeroImages',
      'illustrationAsset',
      'errorPageIllustration',
    ],
    ...params,
  })
}
