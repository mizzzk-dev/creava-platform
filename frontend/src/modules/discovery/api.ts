import { strapiGet } from '@/lib/api/client'
import { cmsGet } from '@/lib/cms/client'
import { resolveProviderForEndpoint } from '@/lib/cms/rollout'
import type { DiscoverySearchQuery, DiscoverySearchResponse } from './types'

const DISCOVERY_ENDPOINT = '/discovery-search'

function toDiscoveryParams(query: DiscoverySearchQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set('q', query.q)
  params.set('sourceSite', query.sourceSite)
  params.set('contentType', query.contentType)
  params.set('category', query.category)
  params.set('locale', query.locale)
  params.set('sort', query.sort)
  params.set('memberState', query.memberState)
  params.set('limit', String(query.limit ?? 24))
  return params
}

function getWordPressApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_WORDPRESS_API_URL
  if (!baseUrl) {
    throw new Error('[Discovery] VITE_WORDPRESS_API_URL が設定されていません。')
  }
  return baseUrl.replace(/\/$/, '')
}

export async function searchDiscovery(query: DiscoverySearchQuery): Promise<DiscoverySearchResponse> {
  const params = toDiscoveryParams(query)
  const provider = resolveProviderForEndpoint(DISCOVERY_ENDPOINT)

  if (provider === 'wordpress') {
    return cmsGet<DiscoverySearchResponse>(`${getWordPressApiBaseUrl()}/discovery/search?${params.toString()}`)
  }

  return strapiGet<DiscoverySearchResponse>(`/discovery/search?${params.toString()}`, '', { auth: 'none' })
}
