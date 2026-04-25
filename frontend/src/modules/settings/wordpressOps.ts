import { CmsApiError } from '@/lib/cms/client'

export type EditorialOpsSnapshot = {
  generatedAt: string
  opsTraceId: string
  editorialOpsState: string
  editorialQueueState: Record<string, number>
  publishReadinessState: Record<string, number>
  operatorActionState: { nextRecommendedAction: string; highPriorityCount: number }
  opsPriorityState: string
  queueItems: Array<Record<string, unknown>>
  qualityActionItems: Array<Record<string, unknown>>
  auditState: Record<string, unknown>
}

export type PublishAuditSnapshot = {
  generatedAt: string
  auditState: Record<string, number>
  items: Array<Record<string, unknown>>
}

export type SearchDiagnosticsSnapshot = {
  generatedAt: string
  searchQualityState: string
  summary: Record<string, number>
  queries: Array<Record<string, unknown>>
  tuningRules: Record<string, string>
}

export type AssetHealthSnapshot = {
  generatedAt: string
  assetHealthState: string
  summary: Record<string, number>
  duplicateCandidates: Array<Record<string, unknown>>
  assets: Array<Record<string, unknown>>
  safetyPolicy: Record<string, string>
}

export type ContentQualitySnapshot = {
  generatedAt: string
  contentQualityState: string
  localeCompletenessState: string
  seoReadinessState: string
  mediaCompletenessState: string
  dependencyHealthState: string
  staleContentState: string
  searchQualityState: string
  assetHealthState: string
  prePublishChecklist: string[]
  postPublishChecklist: string[]
  weeklyReviewFocus: string[]
  monthlyReviewFocus: string[]
}

function getBaseUrl(): string {
  const base = import.meta.env.VITE_WORDPRESS_API_URL
  if (!base) {
    throw new Error('[wordpressOps] VITE_WORDPRESS_API_URL が未設定です。')
  }
  return base.replace(/\/$/, '')
}

async function fetchOps<T>(path: string): Promise<T> {
  const endpoint = `${getBaseUrl()}${path}`
  const timeoutMs = Number(import.meta.env.VITE_WORDPRESS_EDITORIAL_OPS_TIMEOUT_MS ?? 8000)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new CmsApiError(response.status, response.statusText, `[wordpressOps] ${response.status} ${response.statusText}`, {
        url: endpoint,
        contentType: response.headers.get('content-type') ?? 'unknown',
        retried: 0,
        requestId: response.headers.get('x-request-id'),
      })
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      throw new CmsApiError(response.status, response.statusText, '[wordpressOps] JSON 以外のレスポンスです。', {
        url: endpoint,
        contentType,
        retried: 0,
        responseSnippet: text.slice(0, 220),
        requestId: response.headers.get('x-request-id'),
      })
    }

    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchWordPressEditorialOpsSnapshot(): Promise<EditorialOpsSnapshot> {
  return fetchOps<EditorialOpsSnapshot>('/ops/editorial-dashboard')
}

export async function fetchWordPressPublishAuditSnapshot(): Promise<PublishAuditSnapshot> {
  return fetchOps<PublishAuditSnapshot>('/ops/publish-audit')
}

export async function fetchWordPressSearchDiagnosticsSnapshot(): Promise<SearchDiagnosticsSnapshot> {
  return fetchOps<SearchDiagnosticsSnapshot>('/ops/search-diagnostics')
}

export async function fetchWordPressAssetHealthSnapshot(): Promise<AssetHealthSnapshot> {
  return fetchOps<AssetHealthSnapshot>('/ops/asset-health')
}

export async function fetchWordPressContentQualitySnapshot(): Promise<ContentQualitySnapshot> {
  return fetchOps<ContentQualitySnapshot>('/ops/content-quality')
}
