import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { BlogPost, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.blog

export function getBlogList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<BlogPost>> {
  return fetchCollection<BlogPost>(ENDPOINT, {
    fields: ['title', 'slug', 'publishAt', 'accessStatus', 'limitedEndAt', 'archiveVisibleForFC'],
    sort: ['publishAt:desc'],
    populate: {
      thumbnail: { fields: ['url', 'alternativeText', 'width', 'height'] },
    },
    pagination: { pageSize: 12, withCount: false },
    ...params,
  })
}

export function getBlogDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<BlogPost | null> {
  return fetchBySlug<BlogPost>(ENDPOINT, slug, {
    populate: ['thumbnail'],
    ...params,
  })
}
