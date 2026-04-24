import { cmsGet } from './client'
import type { CmsListResponse, CmsQueryParams, CmsRequestOptions, CmsSingleResponse } from './types'

type WordPressListResponse<T> = {
  data: T[]
  meta?: {
    page?: number
    pageSize?: number
    pageCount?: number
    total?: number
    pagination?: {
      page?: number
      pageSize?: number
      pageCount?: number
      total?: number
    }
    trace?: Record<string, unknown>
  }
}

type WordPressSingleResponse<T> = {
  data: T
  meta?: {
    trace?: Record<string, unknown>
  }
}

const ENDPOINT_MAP: Record<string, string> = {
  '/blog-posts': '/blog',
  '/news-items': '/news',
  '/events': '/events',
  '/works': '/works',
  '/store-products': '/store-products',
  '/fanclub-contents': '/fanclub-contents',
  '/site-setting': '/site-settings',
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 12

function getWordPressApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_WORDPRESS_API_URL
  if (!baseUrl) {
    throw new Error('[CMS] VITE_WORDPRESS_API_URL が設定されていません。')
  }
  return baseUrl.replace(/\/$/, '')
}

function normalizeEndpoint(endpoint: string): string {
  return ENDPOINT_MAP[endpoint] ?? endpoint
}

function normalizePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const normalized = Math.floor(value)
  return normalized > 0 ? normalized : fallback
}

function toWordPressQuery(params?: CmsQueryParams, slug?: string): string {
  const qs = new URLSearchParams()
  const page = params?.pagination?.page
  const pageSize = params?.pagination?.pageSize

  if (typeof page === 'number') qs.set('page', String(page))
  if (typeof pageSize === 'number') qs.set('pageSize', String(pageSize))

  const sort = Array.isArray(params?.sort) ? params?.sort[0] : params?.sort
  if (sort) qs.set('sort', sort)

  const slugFilter = (params?.filters as { slug?: { $eq?: string } } | undefined)?.slug?.$eq
  const effectiveSlug = slug ?? slugFilter
  if (effectiveSlug) qs.set('slug', effectiveSlug)

  const status = params?.status
  if (status) qs.set('status', status)

  const locale = params?.locale
  if (locale) qs.set('locale', locale)

  const accessStatus = (params?.filters as { accessStatus?: { $eq?: string } } | undefined)?.accessStatus?.$eq
  if (accessStatus) qs.set('accessStatus', accessStatus)

  const query = qs.toString()
  return query ? `?${query}` : ''
}

function toCmsListResponse<T>(response: WordPressListResponse<T>, params?: CmsQueryParams): CmsListResponse<T> {
  const pagination = response.meta?.pagination
  const requestedPage = params?.pagination?.page
  const requestedPageSize = params?.pagination?.pageSize

  const page = normalizePositiveInt(pagination?.page ?? response.meta?.page ?? requestedPage, DEFAULT_PAGE)
  const pageSize = normalizePositiveInt(
    pagination?.pageSize ?? response.meta?.pageSize ?? requestedPageSize,
    DEFAULT_PAGE_SIZE,
  )
  const total = normalizePositiveInt(pagination?.total ?? response.meta?.total ?? response.data.length, response.data.length)
  const pageCount = normalizePositiveInt(
    pagination?.pageCount ?? response.meta?.pageCount ?? (total > 0 ? Math.ceil(total / pageSize) : 0),
    total > 0 ? 1 : 0,
  )

  return {
    data: response.data,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount,
        total,
      },
    },
  }
}

export async function fetchCollection<T>(endpoint: string, params?: CmsQueryParams, requestOptions?: CmsRequestOptions): Promise<CmsListResponse<T>> {
  const baseUrl = getWordPressApiBaseUrl()
  const path = normalizeEndpoint(endpoint)
  const url = `${baseUrl}${path}${toWordPressQuery(params)}`
  const response = await cmsGet<WordPressListResponse<T>>(url, requestOptions?.signal)
  return toCmsListResponse(response, params)
}

export async function fetchSingle<T>(endpoint: string, params?: CmsQueryParams, requestOptions?: CmsRequestOptions): Promise<CmsSingleResponse<T>> {
  const baseUrl = getWordPressApiBaseUrl()
  const path = normalizeEndpoint(endpoint)
  const url = `${baseUrl}${path}${toWordPressQuery(params)}`
  const response = await cmsGet<WordPressSingleResponse<T>>(url, requestOptions?.signal)
  return { data: response.data, meta: {} }
}

export async function fetchBySlug<T>(
  endpoint: string,
  slug: string,
  params?: Omit<CmsQueryParams, 'filters' | 'pagination'>,
  requestOptions?: CmsRequestOptions,
): Promise<T | null> {
  const response = await fetchCollection<T>(endpoint, {
    ...params,
    filters: { slug: { $eq: slug } },
    pagination: { page: 1, pageSize: 1, withCount: false },
  }, requestOptions)

  return response.data[0] ?? null
}
