import { fetchCollection } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { MediaItem, Award, StrapiListResponse } from '@/types'

export function getMediaList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<MediaItem>> {
  return fetchCollection<MediaItem>('/media-items', {
    sort: ['publishedAt:desc'],
    ...params,
  })
}

export function getAwardsList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<Award>> {
  return fetchCollection<Award>('/awards', {
    sort: ['year:desc'],
    ...params,
  })
}
