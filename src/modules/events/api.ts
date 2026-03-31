import { fetchCollection, fetchBySlug } from '@/lib/api/strapi'
import type { StrapiQueryParams } from '@/lib/api/strapi'
import type { Event, StrapiListResponse } from '@/types'

const ENDPOINT = '/events'

export function getEventsList(
  params?: StrapiQueryParams,
): Promise<StrapiListResponse<Event>> {
  return fetchCollection<Event>(ENDPOINT, {
    sort: ['startAt:asc'],
    ...params,
  })
}

export function getEventDetail(
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
): Promise<Event | null> {
  return fetchBySlug<Event>(ENDPOINT, slug, params)
}
