import { isFanclubSite, isMainSite, isStoreSite } from '@/lib/siteLinks'

export type StatusState =
  | 'operational'
  | 'maintenance_scheduled'
  | 'maintenance_in_progress'
  | 'degraded_performance'
  | 'partial_outage'
  | 'major_outage'
  | 'recovering'
  | 'resolved'

export interface PublicStatusResponse {
  sourceOfTruth: {
    auth: string
    businessState: string
    statusSummary: string
  }
  publicStatusSummary: {
    statusState: StatusState
    statusSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical'
    statusVisibilityState: 'public' | 'internal_only'
    publishingState: 'draft' | 'review' | 'published'
    affectedAreaState: string[]
    userActionRecommendationState: string
    nextUpdateAt: string | null
    lastUpdatedAt: string | null
  }
  maintenanceSummary: Array<Record<string, unknown>>
  activeIncidentCommunications: Array<Record<string, unknown>>
  resolvedIncidentCommunications: Array<Record<string, unknown>>
  postmortemSummary: Array<Record<string, unknown>>
  knowledgeSummary: Array<Record<string, unknown>>
}

const STATUS_TIMEOUT_MS = Number(import.meta.env.VITE_STATUS_FETCH_TIMEOUT_MS ?? 5000)
const STATUS_RETRY_COUNT = Number(import.meta.env.VITE_STATUS_FETCH_RETRY_COUNT ?? 1)

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL が未設定です。')
  return baseUrl.replace(/\/$/, '')
}

function detectSourceSite(): 'main' | 'store' | 'fc' {
  if (isStoreSite) return 'store'
  if (isFanclubSite) return 'fc'
  if (isMainSite) return 'main'
  return 'main'
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const raw = await response.text()
    if (contentType.includes('text/html') || raw.toLowerCase().includes('<html')) {
      throw new Error(`status API が HTML を返しました (${contentType})`)
    }
    throw new Error(`status API content-type が不正です: ${contentType}`)
  }
  return response.json() as Promise<T>
}

export async function getPublicStatusSummary(): Promise<PublicStatusResponse> {
  const site = detectSourceSite()
  const url = `${getApiBaseUrl()}/api/status/public-summary?sourceSite=${site}`
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= STATUS_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`status API エラー (${response.status}): ${body.slice(0, 120)}`)
      }
      return await parseJson<PublicStatusResponse>(response)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('status API の取得に失敗しました。')
      if (attempt >= STATUS_RETRY_COUNT) break
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('status API の取得に失敗しました。')
}
