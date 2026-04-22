import { useAuthClient } from '@/lib/auth/AuthProvider'



export type InternalOrderLookupItem = {
  id: number
  orderNumber: string
  userId: string | null
  billingCustomerId: string | null
  email: string | null
  paymentStatus: string
  orderStatus: string
  fulfillmentStatus: string
  shipmentStatus: string
  returnStatus: string
  refundStatus: string
  totalAmount: number
  currency: string
  orderedAt: string
  syncState: string
}

export type InternalLookupUser = {
  appUserId: string
  authUserId: string
  logtoUserId: string
  supabaseUserId?: string | null
  primaryEmail: string | null
  username: string | null
  membershipStatus: string
  membershipPlan: string
  accessLevel: string
  accountStatus: string
  sourceSite: string
  lifecycleStage: string
  onboardingStatus: string
  profileCompletionStatus: string
  lastLoginAt: string | null
  lastSyncedAt: string | null
}

export type InternalTimelineEvent = {
  eventId: string
  eventAt: string
  timelineEventType: string
  timelineEventSeverity: 'info' | 'warning' | 'high'
  timelineEventSource: string
  sourceSite: string
  summary: string
  linkedContextState: 'available' | 'partial' | 'none'
  dataConfidenceState: 'normal' | 'stale_possible' | 'mismatch_detected' | 'needs_recheck'
}

export type InternalUser360Summary = {
  sourceOfTruth: string
  authSource: string
  targetUserId: string
  sourceSite: string
  membershipStatus: string
  entitlementState: string
  subscriptionState: string
  billingState: string
  lifecycleStage: string
  dataConfidenceState: 'normal' | 'stale_possible' | 'mismatch_detected' | 'needs_recheck'
  staleAt: string | null
}

export type InternalOperationsSummary = {
  safeOperations: Array<{ actionType: string; privilegedActionState: string; operationResultState: string }>
  privilegedActions: Array<{ actionType: string; privilegedActionState: string; privilegedActionApprovalState: string; operationResultState: string }>
  explanation: string
}

export type InternalInvestigationSummary = {
  investigationState: string
  investigationReason: string | null
  followupState: string
  openCount: number
  latestUpdatedAt: string | null
  explanation: string
}

export type InternalAuditSummary = {
  totalCount: number
  successCount: number
  failedCount: number
  deniedCount: number
  latestAction: { action: string; status: string; reason: string | null; at: string | null } | null
}

export type InternalUserSummaryResponse = {
  appUser: { authUserId?: string | null; supabaseUserId?: string | null; logtoUserId?: string | null; [key: string]: unknown }
  userSummary: Record<string, unknown>
  user360Summary: InternalUser360Summary
  operationsSummary: InternalOperationsSummary
  investigationSummary: InternalInvestigationSummary
  auditSummary: InternalAuditSummary
  timeline: InternalTimelineEvent[]
  related: Record<string, unknown>
}

export type InternalRevenueSummary = {
  count: number
  currency: string
  totals: {
    gross: number
    net: number
    refund: number
    shipping: number
    discount: number
    tax: number
  }
  counts: {
    failed: number
    canceled: number
    refunded: number
  }
  bySourceSite: Array<{ sourceSite: string; gross: number; net: number; refund: number; records: number }>
  byRevenueType: Array<{ revenueType: string; gross: number; net: number; refund: number; records: number }>
}

export type InternalBiOverview = {
  range: { from: string; to: string }
  freshnessState: Record<string, string | null>
  sourceOfTruth: Record<string, string>
  syncState: { revenue: Array<[string, number]> }
  kpi: {
    acquisition: { sessions: number; newUsers: number; trafficByReferrer: Array<[string, number]> }
    conversion: {
      mainToStoreRate: number
      mainToFcRate: number
      checkoutStartRate: number
      purchaseCompleteRate: number
      fcJoinCompleteRate: number
      formCompletionRate: number
    }
    retention: {
      revisitUsers: number
      notificationRevisitEvents: number
      activeMembershipCount: number
      graceMembershipCount: number
    }
    revenue: {
      gross: number
      net: number
      refund: number
      refundRate: number
      averageOrderValue: number
      subscriptionRevenue: number
    }
    support: {
      totalInquiries: number
      byCategory: Array<{ category: string; count: number }>
    }
  }
  summaryTable: {
    monthly: Array<{ month: string; gross: number; net: number; refund: number }>
    daily: Array<{ day: string; sessions: number; checkout: number; formSuccess: number }>
    bySite: Array<{ site: string; sessions: number; paidOrders: number; netRevenue: number; supportCases: number }>
    byLocale: Array<{ locale: string; events: number }>
    byCampaign: Array<{ campaignId: string; orders: number; gross: number }>
    notificationPerformance: { sent: number; failed: number; clicked: number }
  }
}

export type InternalBiCohorts = {
  range: { from: string; to: string }
  cohortKey: string[]
  retentionWindow: string[]
  cohorts: {
    signup: Array<{ cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>
    firstPurchase: Array<{ cohortKey: string; orders: number; revenue: number; refundCases: number }>
    membership: Array<{ cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>
    supportImpact: Array<{ cohortKey: string; supportCases: number; unresolved: number }>
  }
}

export type InternalBiAlerts = {
  range: { from: string; to: string }
  refreshState: { latestDay?: string; generatedAt: string }
  sourceOfTruth: Record<string, string>
  metricDefinition: Array<{ metricKey: string; ownerTeam: string; sourceOfTruth: string; unit: string }>
  metricSeries: {
    sessions: Array<{ day: string; value: number }>
    storeNetRevenue: Array<{ day: string; value: number }>
    fcSubscriptionRevenue: Array<{ day: string; value: number }>
    supportCases: Array<{ day: string; value: number }>
  }
  alertRules: Array<{ metricKey: string; alertScope: string; comparisonWindow: string; alertThreshold: { type: string; value: number }; ownerTeam: string }>
  anomalyEvents: Array<{
    metricKey: string
    anomalySeverity: 'low' | 'medium' | 'high'
    comparisonWindow: string
    baselineSeries: number
    metricSeries: number
    explanationText: string
    confidenceState: string
    actionHint: string
    ownerTeam: string
    muteState: string
    acknowledgementState: string
  }>
  forecastSeries: Array<{
    metricKey: string
    forecastHorizon: string
    baselineSeries: Array<{ day: string; value: number }>
    forecastSeries: Array<{ dayOffset: number; value: number }>
    confidenceState: string
  }>
  summaryInsights: Array<{
    reportAudience: string
    insightSeverity: string
    businessSignal: string
    signalSource: string
    explanationText: string
    actionHint: string
  }>
  muteState: string
  notificationChannel: string[]
  acknowledgementState: string
  businessHealthSnapshot: {
    churnSignals: number
    paymentFailures: number
    supportWeeklyAverage: number
    webhookFailureWeeklyAverage: number
  }
}

export type InternalBiReport = {
  reportTemplate: {
    reportAudience: string
    period: string
    sections: string[]
    sourceOfTruth: string[]
  }
  reportRun: {
    generatedAt: string
    range: { from: string; to: string }
    reportAudience: string
    period: string
    summaryInsight: { explanationText: string; insightSeverity: string; confidenceState: string }
    reportSections: Array<{ reportSection: string; explanationText: string; actionHint: string; insightSeverity: string }>
    kpiSnapshot: { gross: number; net: number; refund: number; refundRate: number; supportTotal: number }
    exportState: { csv: string; dashboard: string; reviewOwner: string }
  }
}

export type InternalAutomationPlaybook = {
  playbookKey: string
  title: string
  ownerTeam: string
  severity: string
  runMode: 'manual' | 'suggested' | 'auto_safe' | 'auto_with_approval' | 'disabled'
  sourceSite: string
  triggerSource: string
  triggerValue: Record<string, unknown>
  conditionSet: Record<string, unknown>
  action: string[]
  approvalStep: string[]
  approvalRequired: boolean
  workflow: string
  retryPolicy: { maxAttempts: number; backoffMs: number }
  runGuard: Record<string, unknown>
  executionState: string
  triggered: boolean
}

export type InternalAutomationPlaybooksResponse = {
  range: { from: string; to: string }
  triggerSourceCatalog: string[]
  runModeCatalog: string[]
  playbooks: InternalAutomationPlaybook[]
  pendingApprovals: Array<{ playbookKey: string; title: string; ownerTeam: string; approvalStatus: string; approvalStep: string[]; reason: string }>
}

export type InternalAutomationRunsResponse = {
  count: number
  items: Array<{
    executionRun: string
    actionStatus: string
    action: string
    sourceSite: string
    reason: string
    actorLogtoUserId: string
    createdAt: string
    metadata: Record<string, unknown>
  }>
}

export type InternalAutomationRunResponse = {
  executionRun: string
  playbookKey: string
  runMode: string
  dryRun: boolean
  sourceSite: string
  actionStatus: string
  approvalStatus: string
  failureReason: string | null
  retryPolicy: { maxAttempts: number; attempts: number }
}

export type InternalOperationsDashboardResponse = {
  range: { from: string; to: string }
  sourceOfTruth: Record<string, string>
  operationsSummary: {
    unresolvedState: string
    backlogState: string
    attentionState: string
    opsPriorityState: string
    lastCheckedAt: string
    lastProcessedAt: string | null
    nextRecommendedAction: string
  }
  kpiSummary: {
    openSupportCases: number
    waitingUserCount: number
    unresolvedCriticalIssues: number
    notificationFailures: number
    pendingPrivacyActions: number
    securityReviews: number
    reconciliationNeededCount: number
  }
  queueSummary: Array<{
    queueType: string
    queueState: string
    queueItemCount: number
    queueItemSeverity: string
    sourceArea: string
    nextRecommendedAction: string
    relatedEntityType: string
  }>
  anomalySummary: Array<{
    anomalyType: string
    anomalySeverity: string
    anomalyState: string
    anomalyReason: string
    sourceArea: string
    relatedEntityType: string
    requiresReviewState: string
  }>
  reconciliationSummary: Array<{
    reconciliationType: string
    reconciliationState: string
    reconciliationReason: string
    queueItemCount: number
    sourceArea: string
    nextRecommendedAction: string
  }>
  playbookSummary: Array<{
    playbookType: string
    playbookState: string
    playbookTriggerState: string
    playbookResultState: string
    requiresConfirmation: boolean
    sourceArea: string
  }>
}

export type InternalOperationsSafeActionResponse = {
  actionId: string
  actionType: string
  sourceArea: string
  dryRun: boolean
  dangerousAction: boolean
  confirmed: boolean
  resultState: string
  explanation: string
}

export type InternalScheduledChecksResponse = {
  triggerMode: string
  sourceSite: string
  checkCount: number
  detectedAlerts: number
  checks: Array<{
    scheduledCheckType: string
    sourceArea: string
    scheduledCheckState: string
    detectedCount: number
    alertState: string
    alertSeverity: string
    alertPriority: string
    lastCheckedAt: string
    nextRecommendedAction: string
  }>
}

export type InternalIncidentDashboardResponse = {
  sourceOfTruth: Record<string, string>
  scheduledCheckSummary: {
    scheduledCheckState: string
    scheduledCheckTypeCount: number
    lastCheckedAt: string | null
    lastTriggeredAt: string | null
    staleCheckCount: number
  }
  alertSummary: {
    totalCount: number
    detectedCount: number
    criticalCount: number
    nextRecommendedAction: string
    items: Array<{
      alertId: string
      alertType: string
      alertSeverity: string
      alertPriority: string
      alertState: string
      alertReason: string
      sourceArea: string
      detectedCount: number
      requiresReviewState: string
    }>
  }
  incidentSummary: {
    totalCount: number
    unresolvedCount: number
    blockedCount: number
    staleCount: number
    escalatedCount: number
    nextRecommendedAction: string
    items: Array<{
      incidentId: string
      incidentType: string
      incidentSeverity: string
      incidentPriority: string
      incidentState: string
      incidentOwnerState: string
      incidentResolutionState: string
      escalationState: string
      blockedState: string
      nextRecommendedAction: string
      sourceArea: string
      createdAt: string
    }>
  }
  approvalSummary: {
    totalCount: number
    pendingCount: number
    rejectedCount: number
    lastApprovedAt: string | null
    items: Array<{
      approvalId: string
      approvalType: string
      approvalState: string
      approvalReason: string
      approvalActor: string
      requiresApprovalState: string
      createdAt: string
    }>
  }
  batchOperationSummary: {
    totalCount: number
    pendingApprovalCount: number
    runningCount: number
    failedCount: number
    lastExecutedAt: string | null
    items: Array<{
      batchOperationId: string
      batchOperationType: string
      batchOperationScope: string
      batchOperationState: string
      batchOperationPreviewState: string
      batchOperationDryRunState: string
      batchOperationResultState: string
      requiresApprovalState: string
      lastExecutedAt: string
    }>
  }
  escalationSummary: {
    totalCount: number
    activeCount: number
    completedCount: number
    items: Array<{
      escalationId: string
      escalationState: string
      escalationReason: string
      escalationTarget: string
      incidentId: string
      createdAt: string
    }>
  }
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_STRAPI_API_URL
  if (!baseUrl) throw new Error('VITE_STRAPI_API_URL が未設定です。')
  return baseUrl.replace(/\/$/, '')
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`content-type が不正です: ${contentType} (${text.slice(0, 120)})`)
  }
  return response.json() as Promise<T>
}

async function internalFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`internal API エラー (${response.status}): ${body.slice(0, 160)}`)
  }

  return parseJson<T>(response)
}

export function useInternalAdminApi() {
  const auth = useAuthClient()

  async function withToken<T>(runner: (token: string) => Promise<T>): Promise<T> {
    const token = await auth.getAccessToken()
    if (!token) throw new Error('internal admin にはログインが必要です。')
    return runner(token)
  }

  return {
    searchUsers: async (query: string) => withToken((token) => internalFetch<{ count: number; users: InternalLookupUser[] }>(`/internal/users/lookup?q=${encodeURIComponent(query)}`, token)),
    getUserSummary: async (authUserId: string) => withToken((token) => internalFetch<InternalUserSummaryResponse>(`/internal/users/${encodeURIComponent(authUserId)}/summary`, token)),
    updateAccountStatus: async (authUserId: string, nextStatus: string, reason: string) => withToken((token) => internalFetch<any>(`/internal/users/${encodeURIComponent(authUserId)}/account-status`, token, { method: 'POST', body: JSON.stringify({ nextStatus, reason }) })),
    resetNotificationPreference: async (authUserId: string, reason: string) => withToken((token) => internalFetch<any>(`/internal/users/${encodeURIComponent(authUserId)}/notification-reset`, token, { method: 'POST', body: JSON.stringify({ reason }) })),
    searchOrders: async (query: string) => withToken((token) => internalFetch<{ count: number; items: InternalOrderLookupItem[] }>(`/internal/orders/lookup?query=${encodeURIComponent(query)}`, token)),
    getRevenueSummary: async (sourceSite?: string) => withToken((token) => internalFetch<InternalRevenueSummary>(`/internal/revenue/summary${sourceSite ? `?sourceSite=${encodeURIComponent(sourceSite)}` : ''}`, token)),
    getBiOverview: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiOverview>(`/internal/bi/overview${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    getBiCohorts: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiCohorts>(`/internal/bi/cohorts${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    getBiAlerts: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiAlerts>(`/internal/bi/alerts${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    getBiReport: async (audience: 'executive' | 'operations' | 'support' | 'crm' = 'operations', period: 'weekly' | 'monthly' = 'weekly', from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      query.set('audience', audience)
      query.set('period', period)
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalBiReport>(`/internal/bi/report?${query.toString()}`, token)
    }),
    getAutomationPlaybooks: async () => withToken((token) => internalFetch<InternalAutomationPlaybooksResponse>('/internal/automation/playbooks', token)),
    getOperationsDashboard: async (from?: string, to?: string) => withToken((token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      return internalFetch<InternalOperationsDashboardResponse>(`/internal/operations/dashboard${query.toString() ? `?${query.toString()}` : ''}`, token)
    }),
    runSafeOperation: async (payload: { actionType: string; sourceArea: string; reason: string; dryRun?: boolean; confirmed?: boolean; targetEntityType?: string; targetEntityId?: string }) =>
      withToken((token) => internalFetch<InternalOperationsSafeActionResponse>('/internal/operations/safe-action', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })),
    runScheduledChecks: async (payload?: { triggerMode?: string; sourceSite?: string }) =>
      withToken((token) => internalFetch<InternalScheduledChecksResponse>('/internal/operations/scheduled-checks/run', token, {
        method: 'POST',
        body: JSON.stringify(payload ?? {}),
      })),
    getIncidentDashboard: async () => withToken((token) => internalFetch<InternalIncidentDashboardResponse>('/internal/incidents/dashboard', token)),
    runIncidentTriage: async (payload: { actionType: 'acknowledge' | 'create_incident' | 'escalate' | 'resolve'; incidentId?: string; incidentType?: string; incidentSeverity?: string; incidentPriority?: string; sourceArea?: string; reason: string; escalationTarget?: string }) =>
      withToken((token) => internalFetch<any>('/internal/incidents/triage', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })),
    runApprovalAction: async (payload: { approvalId?: string; approvalType?: string; approvalState: 'pending' | 'approved' | 'rejected' | 'expired'; targetActionId?: string; reason: string }) =>
      withToken((token) => internalFetch<any>('/internal/operations/approval', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })),
    runBatchOperation: async (payload: { batchOperationId?: string; batchOperationType: string; batchOperationScope?: string; mode: 'preview' | 'dry_run' | 'execute'; confirmed?: boolean; requiresApproval?: boolean; reason: string }) =>
      withToken((token) => internalFetch<any>('/internal/operations/batch', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })),
    getAutomationRuns: async () => withToken((token) => internalFetch<InternalAutomationRunsResponse>('/internal/automation/runs', token)),
    runAutomationPlaybook: async (payload: { playbookKey: string; runMode?: string; dryRun?: boolean; sourceSite?: string; reason?: string; approvalRequired?: boolean }) =>
      withToken((token) => internalFetch<InternalAutomationRunResponse>('/internal/automation/run', token, { method: 'POST', body: JSON.stringify(payload) })),
    downloadBiCsv: async (from?: string, to?: string) => withToken(async (token) => {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      const path = `/internal/bi/export.csv${query.toString() ? `?${query.toString()}` : ''}`
      const response = await fetch(`${getApiBaseUrl()}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error(`BI CSV エクスポートに失敗しました: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bi-overview-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }),
    downloadRevenueCsv: async (sourceSite?: string) => withToken(async (token) => {
      const path = `/internal/revenue/export.csv${sourceSite ? `?sourceSite=${encodeURIComponent(sourceSite)}` : ''}`
      const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`CSV エクスポートに失敗しました: ${response.status}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `revenue-records-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }),
  }
}
