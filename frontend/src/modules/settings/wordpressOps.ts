import { CmsApiError } from '@/lib/cms/client'

export type EditorialOpsSnapshot = {
  generatedAt: string
  opsTraceId: string
  editorialOpsState: string
  editorialSlaState: Record<string, number>
  editorialQueueState: Record<string, number>
  queuePriorityState: Record<string, number>
  operatorLoadState: Array<Record<string, unknown>>
  reviewCadenceState: Record<string, number>
  publishRiskState: Record<string, number>
  releaseRiskState: Record<string, number>
  dependencyImpactState: Record<string, number>
  escalationState: Record<string, number>
  reminderState: Record<string, number>
  overdueState: Record<string, number>
  blockedState: Record<string, number>
  publishReadinessState: Record<string, number>
  operatorActionState: { nextRecommendedAction: string; highPriorityCount: number }
  opsPriorityState: string
  opsUpdatedAt?: string
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

export type DependencyGraphSnapshot = {
  generatedAt: string
  opsTraceId: string
  dependencyGraphState: string
  dependencySeverityState: Record<string, number>
  brokenDependencyState: Record<string, number>
  impactSummary: Record<string, number>
  publishImpactPreview: Array<Record<string, unknown>>
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
}

export type ReleaseCalendarSnapshot = {
  generatedAt: string
  releaseCalendarState: string
  publishQueueState: Record<string, number>
  publishWindowState: string
  freezeWindowState: string
  releaseReadinessChecklist: string[]
  calendar: Array<Record<string, unknown>>
  publishQueue: Array<Record<string, unknown>>
}

export type WorkflowAutomationSnapshot = {
  generatedAt: string
  workflowAutomationState: string
  guardedAutomationPolicy: Record<string, string>
  reminderState: Record<string, number>
  escalationState: Record<string, number>
  dailyDigestState: string
  weeklyOpsSummaryState: string
  items: Array<Record<string, unknown>>
}

export type WorkloadBalancingSnapshot = {
  generatedAt: string
  operatorLoadState: Record<string, number>
  reviewCadenceState: Record<string, number>
  queueBacklogState: Record<string, number>
  opsReportingState: Record<string, string>
  owners: Array<Record<string, unknown>>
  kpi: Record<string, number>
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

export async function fetchWordPressDependencyGraphSnapshot(): Promise<DependencyGraphSnapshot> {
  return fetchOps<DependencyGraphSnapshot>('/ops/dependency-graph')
}

export async function fetchWordPressReleaseCalendarSnapshot(): Promise<ReleaseCalendarSnapshot> {
  return fetchOps<ReleaseCalendarSnapshot>('/ops/release-calendar')
}

export async function fetchWordPressWorkflowAutomationSnapshot(): Promise<WorkflowAutomationSnapshot> {
  return fetchOps<WorkflowAutomationSnapshot>('/ops/workflow-automation')
}

export async function fetchWordPressWorkloadBalancingSnapshot(): Promise<WorkloadBalancingSnapshot> {
  return fetchOps<WorkloadBalancingSnapshot>('/ops/workload-balancing')
}
