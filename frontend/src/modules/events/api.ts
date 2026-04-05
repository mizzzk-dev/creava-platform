import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { Event, StrapiListResponse } from '@/types'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const ENDPOINT = API_ENDPOINTS.events

export function getEventsList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<Event>> {
  return fetchCollection<Event>(ENDPOINT, {
    fields: [
      'title',
      'slug',
      'startAt',
      'endAt',
      'venue',
      'accessStatus',
      'limitedEndAt',
      'archiveVisibleForFC',
    ],
    sort: ['startAt:asc'],
    pagination: { pageSize: 16, withCount: false },
    ...params,
  })
}

export function getEventDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<Event | null> {
  return fetchBySlug<Event>(ENDPOINT, slug, params)
}
