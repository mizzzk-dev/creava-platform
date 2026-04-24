import * as strapiProvider from './strapi'
import * as wordpressProvider from './wordpress'
import { resolveProviderForEndpoint } from './rollout'
import type {
  CmsListResponse,
  CmsProvider,
  CmsQueryParams,
  CmsRequestOptions,
  CmsSingleResponse,
} from './types'

function getProviderForEndpoint(endpoint: string): typeof strapiProvider {
  const provider = resolveProviderForEndpoint(endpoint)
  return provider === 'wordpress' ? wordpressProvider : strapiProvider
}

export function getCmsProviderState(endpoint: string): {
  cmsProviderState: CmsProvider
  cmsProviderVerifiedAt: string
} {
  return {
    cmsProviderState: resolveProviderForEndpoint(endpoint),
    cmsProviderVerifiedAt: new Date().toISOString(),
  }
}

export function fetchCollection<T>(
  endpoint: string,
  params?: CmsQueryParams,
  requestOptions?: CmsRequestOptions,
): Promise<CmsListResponse<T>> {
  const provider = getProviderForEndpoint(endpoint)
  return provider.fetchCollection<T>(endpoint, params, requestOptions)
}

export function fetchSingle<T>(
  endpoint: string,
  params?: CmsQueryParams,
  requestOptions?: CmsRequestOptions,
): Promise<CmsSingleResponse<T>> {
  const provider = getProviderForEndpoint(endpoint)
  return provider.fetchSingle<T>(endpoint, params, requestOptions)
}

export function fetchBySlug<T>(
  endpoint: string,
  slug: string,
  params?: Omit<CmsQueryParams, 'filters' | 'pagination'>,
  requestOptions?: CmsRequestOptions,
): Promise<T | null> {
  const provider = getProviderForEndpoint(endpoint)
  return provider.fetchBySlug<T>(endpoint, slug, params, requestOptions)
}

export type { CmsListResponse, CmsSingleResponse, CmsQueryParams, CmsProvider } from './types'
