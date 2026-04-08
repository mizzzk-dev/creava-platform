import { strapiGet } from './client'
import type { StrapiRequestOptions } from './client'
import { buildQueryString } from './query'
import { isPreviewMode } from '@/lib/preview'
import type { StrapiQueryParams } from './query'
import type { StrapiListResponse, StrapiSingleResponse } from '@/types'

function withPreview(params?: StrapiQueryParams): StrapiQueryParams | undefined {
  if (!isPreviewMode()) return params
  return { status: 'draft', ...params }
}

function needsAuth(params?: StrapiQueryParams): boolean {
  return params?.status === 'draft' || isPreviewMode()
}

export function fetchCollection<T>(
  endpoint: string,
  params?: StrapiQueryParams,
  requestOptions?: StrapiRequestOptions,
): Promise<StrapiListResponse<T>> {
  const merged = withPreview(params)
  const qs = merged ? buildQueryString(merged) : ''
  return strapiGet<StrapiListResponse<T>>(endpoint, qs, {
    auth: needsAuth(merged) ? 'required' : 'none',
    ...requestOptions,
  })
}

export function fetchSingle<T>(
  endpoint: string,
  params?: StrapiQueryParams,
  requestOptions?: StrapiRequestOptions,
): Promise<StrapiSingleResponse<T>> {
  const qs = params ? buildQueryString(params) : ''
  return strapiGet<StrapiSingleResponse<T>>(endpoint, qs, {
    auth: needsAuth(params) ? 'required' : 'none',
    ...requestOptions,
  })
}

export async function fetchBySlug<T>(
  endpoint: string,
  slug: string,
  params?: Omit<StrapiQueryParams, 'filters' | 'pagination'>,
  requestOptions?: StrapiRequestOptions,
): Promise<T | null> {
  const previewParams = isPreviewMode() ? { status: 'draft' as const } : {}
  const merged = {
    ...previewParams,
    ...params,
    filters: { slug: { $eq: slug } },
    pagination: { pageSize: 1, withCount: false },
  }

  const qs = buildQueryString(merged)
  const res = await strapiGet<StrapiListResponse<T>>(endpoint, qs, {
    auth: needsAuth(merged) ? 'required' : 'none',
    ...requestOptions,
  })
  return res.data[0] ?? null
}

export type { StrapiQueryParams }
