export type SupportCaseStatus = 'draft' | 'submitted' | 'triaging' | 'waiting_user' | 'in_progress' | 'resolved' | 'closed' | 'reopened'
export type SupportCaseResolutionState = 'unresolved' | 'self_resolved' | 'support_resolved' | 'info_only' | 'duplicate' | 'escalated'
export type SupportCaseVisibilityState = 'private_user' | 'support_only' | 'internal_only' | 'linked_article_only'
export type SelfServiceState = 'not_attempted' | 'article_suggested' | 'article_viewed' | 'self_resolved' | 'still_need_support'

export interface SupportCaseSummary {
  openCases: number
  waitingUser: number
  unresolved: number
  selfResolved: number
  total: number
  recent: Array<{
    caseStatus: SupportCaseStatus
    caseResolutionState: SupportCaseResolutionState
    caseVisibilityState: SupportCaseVisibilityState
    selfServiceState: SelfServiceState
    priority: string
    sourceSite: string
    inquiryCategory: string
    submittedAt: string
    updatedAt: string
    resolvedAt: string | null
  }>
}

export interface SupportCaseHistoryItem {
  id: number
  inquiryNumber: string
  inquiryTraceId: string | null
  formType: string
  supportCaseType: string
  subject: string
  messagePreview: string
  priority: string
  sourceSite: string
  submittedAt: string
  updatedAt: string
  resolvedAt: string | null
  repliedAt: string | null
  supportLastReplyAt?: string | null
  supportLastUserReplyAt?: string | null
  supportLastAdminReplyAt?: string | null
  supportUnreadState?: 'none' | 'unread_for_user' | 'unread_for_support' | 'unread_both'
  supportUnreadUserCount?: number
  replyChannelState?: 'in_app' | 'email' | 'synced_multi_channel'
  mailSyncState?: 'not_applicable' | 'pending' | 'synced' | 'failed' | 'partial'
  deliveryState?: 'not_sent' | 'queued' | 'delivered' | 'bounced_like' | 'failed' | 'unknown'
  threadSyncState?: 'not_synced' | 'synced' | 'duplicate_suppressed' | 'parse_failed' | 'needs_review'
  attachmentState?: 'none' | 'uploaded' | 'linked' | 'failed' | 'blocked'
  attachmentCount: number
  replyStatus: string
  caseStatus: SupportCaseStatus
  caseResolutionState: SupportCaseResolutionState
  caseVisibilityState: SupportCaseVisibilityState
  selfServiceState: SelfServiceState
  requesterType: 'guest' | 'authenticated_user' | 'member'
}

export interface SupportCaseDetail extends SupportCaseHistoryItem {
  sourcePage?: string
  locale?: string
  message?: string
  notificationState?: 'not_configured' | 'sent' | 'failed' | 'unknown'
  inboundReplyState?: 'idle' | 'received' | 'synced' | 'failed' | 'needs_review'
  outboundReplyState?: 'idle' | 'queued' | 'sent' | 'failed'
  supportLastMailSentAt?: string | null
  supportLastMailReceivedAt?: string | null
  supportLastSyncAt?: string | null
  attachmentMetadata?: Array<Record<string, unknown>>
  supportTimeline?: SupportCaseReply[]
}

export interface SupportCaseReply {
  id: number
  supportReplyType: 'user_message' | 'admin_reply' | 'system_message' | 'internal_note'
  supportReplyVisibility: 'user_visible' | 'support_only' | 'internal_only'
  supportReplyAuthorType: string
  supportReplyAuthorId: string | null
  supportReplyAuthorName: string | null
  supportReplyBody: string
  supportReplyPostedAt: string | null
  supportReplyState: string
  supportReplyTraceId: string | null
  supportTimelineEvent: string | null
  supportStatusFrom: string | null
  supportStatusTo: string | null
  supportReplyMeta?: Record<string, unknown> | null
}

function ensureJson(response: Response, label: string): Promise<any> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return response.text().then((body) => {
      throw new Error(`${label}: content-type が JSON ではありません (${contentType}) ${body.slice(0, 120)}`)
    })
  }
  return response.json()
}

async function call<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`support case API error: ${response.status}`)
  }

  return ensureJson(response, path) as Promise<T>
}

export async function getMySupportSummary(token: string): Promise<SupportCaseSummary> {
  const res = await call<{ data: SupportCaseSummary }>(token, '/api/inquiry-submissions/me/summary')
  return res.data
}

export async function getMySupportHistory(token: string, page = 1, pageSize = 10): Promise<{ items: SupportCaseHistoryItem[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await call<{ data: SupportCaseHistoryItem[]; meta?: { pagination?: { total?: number } } }>(token, `/api/inquiry-submissions/me/history?${params.toString()}`)
  return {
    items: Array.isArray(res.data) ? res.data : [],
    total: Number(res.meta?.pagination?.total ?? 0),
  }
}

export async function reopenSupportCase(token: string, id: number): Promise<void> {
  await call<{ data: { id: number } }>(token, `/api/inquiry-submissions/me/${id}/reopen`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
}

export async function getMySupportCaseDetail(token: string, id: number): Promise<SupportCaseDetail> {
  const res = await call<{ data: SupportCaseDetail }>(token, `/api/inquiry-submissions/me/${id}`)
  return res.data
}

export async function postMySupportReply(token: string, id: number, payload: { message: string; idempotencyKey?: string; traceId?: string }): Promise<void> {
  await call<{ data: { accepted: boolean } }>(token, `/api/inquiry-submissions/me/${id}/replies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_STRAPI_API_URL
  if (!base) throw new Error('VITE_STRAPI_API_URL が未設定です。')
  return base.replace(/\/$/, '')
}
