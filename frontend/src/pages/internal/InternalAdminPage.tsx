import { useState } from 'react'
import { useCurrentUser } from '@/hooks'
import {
  useInternalAdminApi,
  type InternalLookupUser,
  type InternalOrderLookupItem,
  type InternalUserSummaryResponse,
  type InternalRevenueSummary,
  type InternalBiOverview,
  type InternalBiCohorts,
  type InternalBiAlerts,
  type InternalBiReport,
  type InternalAutomationPlaybooksResponse,
  type InternalAutomationRunsResponse,
  type InternalAutomationRunResponse,
  type InternalOperationsDashboardResponse,
  type InternalOperationsSafeActionResponse,
  type InternalIncidentDashboardResponse,
  type InternalScheduledChecksResponse,
  type InternalIncidentCommunicationsDashboardResponse,
  type InternalReleaseDashboardResponse,
} from '@/modules/internal-admin/api'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

export default function InternalAdminPage() {
  const { user, isSignedIn } = useCurrentUser()
  const api = useInternalAdminApi()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<InternalLookupUser[]>([])
  const [selectedUser, setSelectedUser] = useState<InternalUserSummaryResponse | null>(null)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState('suspended')
  const [message, setMessage] = useState<string | null>(null)
  const [orderQuery, setOrderQuery] = useState('')
  const [orders, setOrders] = useState<InternalOrderLookupItem[]>([])
  const [revenueSite, setRevenueSite] = useState<'all' | 'store' | 'fc'>('all')
  const [revenueSummary, setRevenueSummary] = useState<InternalRevenueSummary | null>(null)
  const [biOverview, setBiOverview] = useState<InternalBiOverview | null>(null)
  const [biCohorts, setBiCohorts] = useState<InternalBiCohorts | null>(null)
  const [biAlerts, setBiAlerts] = useState<InternalBiAlerts | null>(null)
  const [biReport, setBiReport] = useState<InternalBiReport | null>(null)
  const [automationPlaybooks, setAutomationPlaybooks] = useState<InternalAutomationPlaybooksResponse | null>(null)
  const [automationRuns, setAutomationRuns] = useState<InternalAutomationRunsResponse | null>(null)
  const [automationRunResult, setAutomationRunResult] = useState<InternalAutomationRunResponse | null>(null)
  const [operationsDashboard, setOperationsDashboard] = useState<InternalOperationsDashboardResponse | null>(null)
  const [safeActionReason, setSafeActionReason] = useState('queue 状態確認のため dry-run 実行')
  const [safeActionResult, setSafeActionResult] = useState<InternalOperationsSafeActionResponse | null>(null)
  const [releaseDashboard, setReleaseDashboard] = useState<InternalReleaseDashboardResponse | null>(null)
  const [releaseReason, setReleaseReason] = useState('preview / dry-run で release risk を確認')
  const [releaseActionResult, setReleaseActionResult] = useState<Record<string, unknown> | null>(null)
  const [incidentDashboard, setIncidentDashboard] = useState<InternalIncidentDashboardResponse | null>(null)
  const [scheduledChecksResult, setScheduledChecksResult] = useState<InternalScheduledChecksResponse | null>(null)
  const [triageReason, setTriageReason] = useState('scheduled check で検知した異常を確認')
  const [communicationsDashboard, setCommunicationsDashboard] = useState<InternalIncidentCommunicationsDashboardResponse | null>(null)
  const [approvalReason, setApprovalReason] = useState('dry-run 結果確認後に承認')
  const [batchReason, setBatchReason] = useState('preview / dry-run による影響確認')
  const selectedUserSummary = (selectedUser?.userSummary ?? {}) as Record<string, any>

  const internalRole = user?.internalRole ?? 'user'
  const canAccessInternalAdmin = user?.role === 'admin' || internalRole === 'admin' || internalRole === 'super_admin' || internalRole === 'support' || internalRole === 'moderator'

  if (!isSignedIn) return <section className="mx-auto max-w-4xl px-4 py-16">ログインが必要です。</section>
  if (!canAccessInternalAdmin) return <section className="mx-auto max-w-4xl px-4 py-16">internal admin は support / admin ロールのみアクセスできます。</section>

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Internal Admin Console (Beta)</h1>
      <p className="mt-2 text-sm text-gray-500">user lookup / summary / danger operations を最小機能で提供します。</p>
      <p className="mt-1 text-xs text-gray-500">閲覧優先（read-heavy）で、safe operation と privileged action を分離しています。現在ロール: {internalRole}</p>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">operations dashboard (main / store / fc)</p>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              trackMizzzEvent('operations_dashboard_view', { actorRole: internalRole, sourceSection: 'operations_dashboard', sourceArea: 'cross' })
              api.getOperationsDashboard().then(setOperationsDashboard).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-xs text-white"
          >summary 更新</button>
        </div>

        {operationsDashboard && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">
              range: {operationsDashboard.range.from} ~ {operationsDashboard.range.to}
            </p>
            <p className="font-medium">
              priority: {operationsDashboard.operationsSummary.opsPriorityState} / attention: {operationsDashboard.operationsSummary.attentionState}
            </p>
            <p className="text-gray-500">
              next: {operationsDashboard.operationsSummary.nextRecommendedAction}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">KPI</p>
                <p>open support: {operationsDashboard.kpiSummary.openSupportCases}</p>
                <p>waiting user: {operationsDashboard.kpiSummary.waitingUserCount}</p>
                <p>critical unresolved: {operationsDashboard.kpiSummary.unresolvedCriticalIssues}</p>
                <p>notification failures: {operationsDashboard.kpiSummary.notificationFailures}</p>
                <p>pending privacy: {operationsDashboard.kpiSummary.pendingPrivacyActions}</p>
                <p>security reviews: {operationsDashboard.kpiSummary.securityReviews}</p>
                <p>reconciliation needed: {operationsDashboard.kpiSummary.reconciliationNeededCount}</p>
              </div>
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">queue / anomaly / reconciliation / playbook</p>
                <p>queue: {operationsDashboard.queueSummary.length} types</p>
                <p>anomaly: {operationsDashboard.anomalySummary.filter((item) => item.anomalyState === 'detected').length} detected</p>
                <p>reconciliation: {operationsDashboard.reconciliationSummary.filter((item) => item.reconciliationState !== 'not_needed').length} needed</p>
                <p>playbook ready: {operationsDashboard.playbookSummary.filter((item) => item.playbookTriggerState === 'triggered').length}</p>
              </div>
            </div>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({
              queueSummary: operationsDashboard.queueSummary,
              anomalySummary: operationsDashboard.anomalySummary,
              reconciliationSummary: operationsDashboard.reconciliationSummary,
              playbookSummary: operationsDashboard.playbookSummary,
            }, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs text-gray-500">safe operations (dry-run / confirm / audit)</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <input value={safeActionReason} onChange={(e) => setSafeActionReason(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 text-xs" placeholder="reason を入力" />
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-xs"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('safe_retry_start', { actorRole: internalRole, sourceSection: 'operations_dashboard', sourceArea: 'notification' })
                api.runSafeOperation({
                  actionType: 'notification_retry',
                  sourceArea: 'notification',
                  reason: safeActionReason,
                  dryRun: true,
                  targetEntityType: 'delivery-log',
                }).then((result) => {
                  setSafeActionResult(result)
                  trackMizzzEvent('safe_retry_complete', { actorRole: internalRole, sourceSection: 'operations_dashboard', sourceArea: 'notification' })
                }).catch((e: Error) => setMessage(e.message))
              }}
            >notification retry dry-run</button>
            <button
              type="button"
              className="rounded border border-amber-400 px-3 py-2 text-xs text-amber-700"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('resync_start', { actorRole: internalRole, sourceSection: 'operations_dashboard', sourceArea: 'membership' })
                api.runSafeOperation({
                  actionType: 'membership_resync',
                  sourceArea: 'membership',
                  reason: safeActionReason,
                  dryRun: false,
                  confirmed: true,
                  targetEntityType: 'subscription-record',
                }).then((result) => {
                  setSafeActionResult(result)
                  trackMizzzEvent('resync_complete', { actorRole: internalRole, sourceSection: 'operations_dashboard', sourceArea: 'membership' })
                }).catch((e: Error) => setMessage(e.message))
              }}
            >membership resync (confirm)</button>
          </div>
          {safeActionResult && (
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(safeActionResult, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">release dashboard / change management / parity / rollback</p>
          <button
            type="button"
            className="rounded bg-gray-900 px-3 py-2 text-xs text-white"
            onClick={() => {
              setMessage(null)
              trackMizzzEvent('release_dashboard_view', { actorRole: internalRole, sourceSection: 'release_dashboard', sourceArea: 'cross' })
              api.getReleaseDashboard().then(setReleaseDashboard).catch((e: Error) => setMessage(e.message))
            }}
          >release summary 更新</button>
        </div>

        {releaseDashboard && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">next: {releaseDashboard.releaseSummary.nextRecommendedAction}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">release / rollout / rollback</p>
                <p>planned: {releaseDashboard.releaseSummary.plannedCount}</p>
                <p>releasing: {releaseDashboard.releaseSummary.releasingCount}</p>
                <p>blocked: {releaseDashboard.releaseSummary.blockedCount}</p>
                <p>active rollout: {releaseDashboard.rolloutSummary.activeCount}</p>
                <p>rollback ready: {releaseDashboard.rollbackSummary.rollbackReadyCount}</p>
                <p>rollback completed: {releaseDashboard.rollbackSummary.completedCount}</p>
              </div>
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">parity / migration / release notes</p>
                <p>parity drift: {releaseDashboard.environmentParitySummary.driftDetectedCount}</p>
                <p>config drift: {releaseDashboard.environmentParitySummary.configDriftDetectedCount}</p>
                <p>migration high risk: {releaseDashboard.migrationSummary.highRiskCount}</p>
                <p>destructive_like: {releaseDashboard.migrationSummary.destructiveLikeCount}</p>
                <p>support ready note: {releaseDashboard.releaseNoteSummary.supportReadyCount}</p>
                <p>public published note: {releaseDashboard.releaseNoteSummary.publicPublishedCount}</p>
              </div>
            </div>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({
              blockedChanges: releaseDashboard.blockedChanges.slice(0, 8),
              activeRollouts: releaseDashboard.activeRollouts.slice(0, 8),
              rollbackReadyItems: releaseDashboard.rollbackReadyItems.slice(0, 8),
            }, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 rounded border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-xs text-gray-500">release safe actions (preview / parity / approve / execute / rollback / publish note)</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <input value={releaseReason} onChange={(e) => setReleaseReason(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-2 text-xs" placeholder="release action reason を入力" />
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-xs"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('parity_check_run', { actorRole: internalRole, sourceSection: 'release_dashboard', sourceArea: 'cross' })
                api.runReleaseAction({
                  actionType: 'parity_check',
                  sourceSite: 'cross',
                  reason: releaseReason,
                  dryRun: true,
                  environmentParityState: 'review_needed',
                  configDriftState: 'runtime_mismatch',
                  migrationRiskState: 'medium',
                }).then((result) => {
                  setReleaseActionResult(result)
                  return api.getReleaseDashboard().then(setReleaseDashboard)
                }).catch((e: Error) => setMessage(e.message))
              }}
            >parity check dry-run</button>
            <button
              type="button"
              className="rounded border border-amber-300 px-3 py-2 text-xs text-amber-700"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('rollout_start', { actorRole: internalRole, sourceSection: 'release_dashboard', sourceArea: 'cross' })
                api.runReleaseAction({
                  actionType: 'execute',
                  sourceSite: 'cross',
                  reason: releaseReason,
                  dryRun: false,
                  confirmed: true,
                  releaseState: 'releasing',
                  deploymentState: 'running',
                  rolloutState: 'staged',
                  verificationState: 'pending',
                  rollbackState: 'available',
                }).then((result) => {
                  setReleaseActionResult(result)
                  return api.getReleaseDashboard().then(setReleaseDashboard)
                }).catch((e: Error) => setMessage(e.message))
              }}
            >staged rollout execute</button>
            <button
              type="button"
              className="rounded border border-red-300 px-3 py-2 text-xs text-red-700"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('rollback_execute_start', { actorRole: internalRole, sourceSection: 'release_dashboard', sourceArea: 'cross' })
                api.runReleaseAction({
                  actionType: 'rollback_execute',
                  sourceSite: 'cross',
                  reason: releaseReason,
                  dryRun: false,
                  confirmed: true,
                  releaseState: 'rolled_back',
                  deploymentState: 'rolled_back',
                  rolloutState: 'reverted',
                  rollbackState: 'completed',
                  releaseCommunicationState: 'support_ready',
                }).then((result) => {
                  setReleaseActionResult(result)
                  return api.getReleaseDashboard().then(setReleaseDashboard)
                }).catch((e: Error) => setMessage(e.message))
              }}
            >rollback execute</button>
          </div>
          {releaseActionResult && (
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(releaseActionResult, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">incident dashboard / scheduled checks / approval workflow / batch safe ops</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-xs"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('incident_dashboard_view', { actorRole: internalRole, sourceSection: 'incident_dashboard', sourceArea: 'cross' })
                api.getIncidentDashboard().then(setIncidentDashboard).catch((e: Error) => setMessage(e.message))
              }}
            >incident summary 更新</button>
            <button
              type="button"
              className="rounded bg-gray-900 px-3 py-2 text-xs text-white"
              onClick={() => {
                setMessage(null)
                trackMizzzEvent('alert_list_view', { actorRole: internalRole, sourceSection: 'incident_dashboard', sourceArea: 'cross' })
                api.runScheduledChecks({ triggerMode: 'manual', sourceSite: 'main' }).then((result) => {
                  setScheduledChecksResult(result)
                }).catch((e: Error) => setMessage(e.message))
              }}
            >scheduled checks 実行</button>
          </div>
        </div>

        {incidentDashboard && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">
              alerts: {incidentDashboard.alertSummary.detectedCount}/{incidentDashboard.alertSummary.totalCount} · incidents unresolved: {incidentDashboard.incidentSummary.unresolvedCount} · approvals pending: {incidentDashboard.approvalSummary.pendingCount}
            </p>
            <p className="text-gray-500">next: {incidentDashboard.incidentSummary.nextRecommendedAction}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">alert / incident</p>
                <p>critical alerts: {incidentDashboard.alertSummary.criticalCount}</p>
                <p>blocked incidents: {incidentDashboard.incidentSummary.blockedCount}</p>
                <p>stale incidents: {incidentDashboard.incidentSummary.staleCount}</p>
                <p>escalated incidents: {incidentDashboard.incidentSummary.escalatedCount}</p>
              </div>
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                <p className="font-medium">approval / batch / escalation</p>
                <p>pending approvals: {incidentDashboard.approvalSummary.pendingCount}</p>
                <p>batch pending approval: {incidentDashboard.batchOperationSummary.pendingApprovalCount}</p>
                <p>batch failed: {incidentDashboard.batchOperationSummary.failedCount}</p>
                <p>active escalations: {incidentDashboard.escalationSummary.activeCount}</p>
              </div>
            </div>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({
              alertItems: incidentDashboard.alertSummary.items.slice(0, 8),
              incidentItems: incidentDashboard.incidentSummary.items.slice(0, 8),
              approvalItems: incidentDashboard.approvalSummary.items.slice(0, 8),
            }, null, 2)}</pre>
          </div>
        )}

        {scheduledChecksResult && (
          <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(scheduledChecksResult, null, 2)}</pre>
        )}

        <div className="mt-4 rounded border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500">incident communications / status publish</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  api.getIncidentCommunicationsDashboard().then(setCommunicationsDashboard).catch((e: Error) => setMessage(e.message))
                }}
              >communications 更新</button>
              <button
                type="button"
                className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700"
                onClick={() => {
                  setMessage(null)
                  api.publishIncidentCommunication({
                    sourceSite: 'cross',
                    sourceArea: 'operations',
                    statusState: 'degraded_performance',
                    incidentCommunicationPhase: 'published',
                    publishingState: 'published',
                    publicTitle: '一部機能の遅延について',
                    publicSummary: '現在、通知反映と会員情報同期に遅延が発生しています。',
                    affectedAreaState: ['notification_center', 'member_sync'],
                    userActionRecommendationState: '時間をおいて再試行し、急ぎの場合はサポートセンターをご利用ください。',
                    reason: triageReason,
                  }).then(() => api.getIncidentCommunicationsDashboard().then(setCommunicationsDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >public notice publish</button>
              <button
                type="button"
                className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                onClick={() => {
                  setMessage(null)
                  api.publishIncidentCommunication({
                    sourceSite: 'cross',
                    sourceArea: 'operations',
                    statusState: 'resolved',
                    incidentCommunicationPhase: 'resolved_notice_posted',
                    publishingState: 'published',
                    publicTitle: '復旧のお知らせ',
                    publicSummary: '遅延は解消し、main / store / fc の処理が安定しています。',
                    affectedAreaState: ['notification_center', 'member_sync'],
                    userActionRecommendationState: '通常どおりご利用いただけます。問題が続く場合はサポートへご連絡ください。',
                    postmortemState: 'drafting',
                    reason: triageReason,
                  }).then(() => api.getIncidentCommunicationsDashboard().then(setCommunicationsDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >resolved notice</button>
            </div>
          </div>
          {communicationsDashboard && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              <p>draft/review/published: {communicationsDashboard.summary.draftCount} / {communicationsDashboard.summary.reviewCount} / {communicationsDashboard.summary.publishedCount}</p>
              <p>postmortem pending: {communicationsDashboard.summary.postmortemPendingCount} · stale: {communicationsDashboard.summary.staleCount}</p>
              <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify(communicationsDashboard.items.slice(0, 8), null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs text-gray-500">triage / incident action</p>
            <input value={triageReason} onChange={(e) => setTriageReason(e.target.value)} className="mt-2 w-full rounded border border-gray-300 px-2 py-2 text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('alert_acknowledge', { actorRole: internalRole, sourceSection: 'incident_dashboard', actionType: 'acknowledge' })
                  api.runIncidentTriage({ actionType: 'acknowledge', reason: triageReason, sourceArea: 'operations' }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >ack</button>
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('incident_open', { actorRole: internalRole, sourceSection: 'incident_dashboard', incidentType: 'operations_incident' })
                  api.runIncidentTriage({ actionType: 'create_incident', reason: triageReason, incidentSeverity: 'medium', sourceArea: 'membership' }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >incident化</button>
              <button
                type="button"
                className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('escalation_start', { actorRole: internalRole, sourceSection: 'incident_dashboard', incidentType: 'operations_incident' })
                  api.runIncidentTriage({ actionType: 'escalate', reason: triageReason, escalationTarget: 'ops_lead', sourceArea: 'security' }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >escalate</button>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs text-gray-500">approval action</p>
            <input value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} className="mt-2 w-full rounded border border-gray-300 px-2 py-2 text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('approval_request_create', { actorRole: internalRole, sourceSection: 'approval_workflow', actionType: 'pending' })
                  api.runApprovalAction({ approvalState: 'pending', approvalType: 'batch_operation', reason: approvalReason }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >request</button>
              <button
                type="button"
                className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('approval_request_approve', { actorRole: internalRole, sourceSection: 'approval_workflow', actionType: 'approved' })
                  api.runApprovalAction({ approvalState: 'approved', approvalType: 'batch_operation', reason: approvalReason }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >approve</button>
              <button
                type="button"
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('approval_request_reject', { actorRole: internalRole, sourceSection: 'approval_workflow', actionType: 'rejected' })
                  api.runApprovalAction({ approvalState: 'rejected', approvalType: 'batch_operation', reason: approvalReason }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >reject</button>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs text-gray-500">batch safe ops (preview / dry-run / execute)</p>
            <input value={batchReason} onChange={(e) => setBatchReason(e.target.value)} className="mt-2 w-full rounded border border-gray-300 px-2 py-2 text-xs" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('batch_preview_view', { actorRole: internalRole, sourceSection: 'batch_safe_ops', actionType: 'preview' })
                  api.runBatchOperation({ batchOperationType: 'safe_resync', batchOperationScope: 'membership', mode: 'preview', reason: batchReason }).then(() => api.getIncidentDashboard().then(setIncidentDashboard)).catch((e: Error) => setMessage(e.message))
                }}
              >preview</button>
              <button
                type="button"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('batch_dry_run_start', { actorRole: internalRole, sourceSection: 'batch_safe_ops', actionType: 'dry_run' })
                  api.runBatchOperation({ batchOperationType: 'safe_retry', batchOperationScope: 'notification', mode: 'dry_run', reason: batchReason }).then(() => {
                    trackMizzzEvent('batch_dry_run_complete', { actorRole: internalRole, sourceSection: 'batch_safe_ops', actionType: 'dry_run' })
                    return api.getIncidentDashboard().then(setIncidentDashboard)
                  }).catch((e: Error) => setMessage(e.message))
                }}
              >dry-run</button>
              <button
                type="button"
                className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('batch_execute_start', { actorRole: internalRole, sourceSection: 'batch_safe_ops', actionType: 'execute' })
                  api.runBatchOperation({ batchOperationType: 'safe_resend', batchOperationScope: 'support', mode: 'execute', confirmed: true, requiresApproval: true, reason: batchReason }).then(() => {
                    trackMizzzEvent('batch_execute_complete', { actorRole: internalRole, sourceSection: 'batch_safe_ops', actionType: 'execute' })
                    return api.getIncidentDashboard().then(setIncidentDashboard)
                  }).catch((e: Error) => setMessage(e.message))
                }}
              >execute(confirm)</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">user lookup</p>
        <div className="mt-2 flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="email で検索" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              trackMizzzEvent('user_lookup_start', { actorRole: internalRole, sourceSection: 'lookup' })
              api.searchUsers(query).then((res) => setUsers(res.users)).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >検索</button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((item) => (
            <li key={item.authUserId} className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setMessage(null)
                  trackMizzzEvent('user_lookup_result_view', { actorRole: internalRole, sourceSection: 'lookup', targetUserState: item.membershipStatus })
                  api.getUserSummary(item.authUserId).then((summary) => {
                    setSelectedUser(summary)
                    trackMizzzEvent('user360_summary_view', { actorRole: internalRole, sourceSection: 'user360', targetUserState: summary.user360Summary.membershipStatus })
                  }).catch((e: Error) => setMessage(e.message))
                }}
              >
                <p>{item.primaryEmail ?? item.authUserId}</p>
                <p className="text-xs text-gray-500">{item.membershipStatus} / {item.accountStatus} / {item.lifecycleStage} / {item.sourceSite}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>



      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">order lookup</p>
        <div className="mt-2 flex gap-2">
          <input value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} placeholder="orderNumber / email / userId / paymentIntentId" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.searchOrders(orderQuery).then((res) => setOrders(res.items)).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >検索</button>
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {orders.map((item) => (
            <li key={item.id} className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <p className="font-medium">{item.orderNumber}</p>
              <p className="text-gray-500">{item.paymentStatus} / {item.orderStatus} / {item.fulfillmentStatus} / {item.shipmentStatus} / return:{item.returnStatus}</p>
              <p className="text-gray-500">{item.totalAmount} {item.currency} · {item.email ?? item.userId ?? '-'}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">financial summary</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select value={revenueSite} onChange={(e) => setRevenueSite(e.target.value as 'all' | 'store' | 'fc')} className="rounded border border-gray-300 px-2 py-2 text-sm">
            <option value="all">all</option>
            <option value="store">store</option>
            <option value="fc">fc</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getRevenueSummary(revenueSite === 'all' ? undefined : revenueSite)
                .then(setRevenueSummary)
                .catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >集計更新</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.downloadRevenueCsv(revenueSite === 'all' ? undefined : revenueSite)
                .catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >CSV export</button>
        </div>
        {revenueSummary && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">
              records: {revenueSummary.count} / currency: {revenueSummary.currency}
            </p>
            <p className="font-medium">
              gross: {revenueSummary.totals.gross.toLocaleString()} / net: {revenueSummary.totals.net.toLocaleString()} / refund: {revenueSummary.totals.refund.toLocaleString()}
            </p>
            <p className="text-gray-500">
              failed: {revenueSummary.counts.failed} / canceled: {revenueSummary.counts.canceled} / refunded: {revenueSummary.counts.refunded}
            </p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({ bySourceSite: revenueSummary.bySourceSite, byRevenueType: revenueSummary.byRevenueType }, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">workflow / playbook automation console</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getAutomationPlaybooks().then(setAutomationPlaybooks).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >Playbook一覧更新</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getAutomationRuns().then(setAutomationRuns).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >実行履歴更新</button>
        </div>
        {automationPlaybooks && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">
              range: {automationPlaybooks.range.from} ~ {automationPlaybooks.range.to} / pendingApproval: {automationPlaybooks.pendingApprovals.length}
            </p>
            <ul className="space-y-2">
              {automationPlaybooks.playbooks.map((item) => (
                <li key={item.playbookKey} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-gray-500">{item.playbookKey} / {item.ownerTeam} / {item.runMode} / state:{item.executionState}</p>
                  <p className="text-gray-500">trigger:{item.triggerSource} / severity:{item.severity} / approval:{item.approvalRequired ? 'required' : 'none'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                      onClick={() => {
                        setMessage(null)
                        api.runAutomationPlaybook({
                          playbookKey: item.playbookKey,
                          runMode: 'manual',
                          dryRun: true,
                          sourceSite: item.sourceSite,
                          reason: 'internal admin dry-run',
                          approvalRequired: item.approvalRequired,
                        }).then(setAutomationRunResult).catch((e: Error) => setMessage(e.message))
                      }}
                    >dry-run</button>
                    <button
                      type="button"
                      className="rounded border border-amber-400 px-2 py-1 text-xs text-amber-700"
                      onClick={() => {
                        setMessage(null)
                        api.runAutomationPlaybook({
                          playbookKey: item.playbookKey,
                          runMode: item.runMode,
                          dryRun: false,
                          sourceSite: item.sourceSite,
                          reason: 'internal admin execute',
                          approvalRequired: item.approvalRequired,
                        }).then(setAutomationRunResult).catch((e: Error) => setMessage(e.message))
                      }}
                    >実行</button>
                  </div>
                </li>
              ))}
            </ul>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({ pendingApprovals: automationPlaybooks.pendingApprovals }, null, 2)}</pre>
          </div>
        )}
        {automationRuns && (
          <div className="mt-3 text-xs">
            <p className="text-gray-500">run count: {automationRuns.count}</p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify(automationRuns.items.slice(0, 10), null, 2)}</pre>
          </div>
        )}
        {automationRunResult && (
          <div className="mt-3 text-xs">
            <p className="font-medium">latest run: {automationRunResult.executionRun}</p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify(automationRunResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">data platform / BI overview</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getBiOverview().then(setBiOverview).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >BI集計更新</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getBiCohorts().then(setBiCohorts).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >Cohort集計更新</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.downloadBiCsv().catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >BI CSV export</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getBiAlerts().then(setBiAlerts).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >Alert/Anomaly更新</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getBiReport('executive', 'weekly').then(setBiReport).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >経営レポート生成</button>
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.getBiReport('support', 'weekly').then(setBiReport).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >Supportレポート生成</button>
        </div>
        {biOverview && (
          <div className="mt-3 space-y-3 text-xs">
            <p className="text-gray-500">range: {biOverview.range.from} ~ {biOverview.range.to}</p>
            <p className="font-medium">
              sessions: {biOverview.kpi.acquisition.sessions.toLocaleString()} / newUsers: {biOverview.kpi.acquisition.newUsers.toLocaleString()} / net: {biOverview.kpi.revenue.net.toLocaleString()} / support: {biOverview.kpi.support.totalInquiries.toLocaleString()}
            </p>
            <p className="text-gray-500">
              CVR(checkout→purchase): {(biOverview.kpi.conversion.purchaseCompleteRate * 100).toFixed(1)}% / refundRate: {(biOverview.kpi.revenue.refundRate * 100).toFixed(2)}% / formCompletion: {(biOverview.kpi.conversion.formCompletionRate * 100).toFixed(1)}%
            </p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({
              bySite: biOverview.summaryTable.bySite,
              byCampaign: biOverview.summaryTable.byCampaign,
              supportByCategory: biOverview.kpi.support.byCategory,
              freshnessState: biOverview.freshnessState,
            }, null, 2)}</pre>
          </div>
        )}
        {biCohorts && (
          <div className="mt-3 space-y-2 text-xs">
            <p className="text-gray-500">cohort windows: {biCohorts.retentionWindow.join(', ')}</p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify(biCohorts.cohorts, null, 2)}</pre>
          </div>
        )}
        {biAlerts && (
          <div className="mt-3 space-y-2 text-xs">
            <p className="font-medium">
              anomaly: {biAlerts.anomalyEvents.length} / forecast: {biAlerts.forecastSeries.length} / generatedAt: {biAlerts.refreshState.generatedAt}
            </p>
            <p className="text-gray-500">
              churnSignals: {biAlerts.businessHealthSnapshot.churnSignals} / paymentFailures: {biAlerts.businessHealthSnapshot.paymentFailures} / supportAvg: {biAlerts.businessHealthSnapshot.supportWeeklyAverage.toFixed(1)}
            </p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify({
              summaryInsights: biAlerts.summaryInsights,
              anomalyEvents: biAlerts.anomalyEvents,
              alertRules: biAlerts.alertRules,
            }, null, 2)}</pre>
          </div>
        )}
        {biReport && (
          <div className="mt-3 space-y-2 text-xs">
            <p className="font-medium">report audience: {biReport.reportRun.reportAudience} / period: {biReport.reportRun.period}</p>
            <pre className="overflow-auto rounded bg-gray-50 p-3 dark:bg-gray-900">{JSON.stringify(biReport.reportRun, null, 2)}</pre>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-medium">User 360 Summary</h2>
          <p className="mt-1 text-xs text-gray-500">{selectedUser.operationsSummary.explanation}</p>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">membership / entitlement</p>
              <p className="mt-1 font-medium">
                {(selectedUserSummary.membershipStatus ?? selectedUser.appUser?.membershipStatus ?? '-')}
                {' / '}
                {(selectedUserSummary.entitlementState ?? selectedUserSummary.membership?.entitlementState ?? '-')}
              </p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">subscription / billing</p>
              <p className="mt-1 font-medium">
                {(selectedUserSummary.subscriptionState ?? selectedUserSummary.membership?.subscriptionState ?? '-')}
                {' / '}
                {(selectedUserSummary.billingState ?? selectedUserSummary.membership?.billingState ?? '-')}
              </p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">benefit visibility / gate</p>
              <p className="mt-1 font-medium">
                {(selectedUserSummary.benefitVisibilityState ?? '-')}
                {' / '}
                {(selectedUserSummary.accessGateState ?? '-')}
              </p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">investigation / follow-up</p>
              <p className="mt-1 font-medium">
                {selectedUser.investigationSummary.investigationState}
                {' / '}
                {selectedUser.investigationSummary.followupState}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
            <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
              <p className="text-gray-500">data confidence</p>
              <p className="font-medium">{selectedUser.user360Summary.dataConfidenceState}</p>
            </div>
            <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
              <p className="text-gray-500">audit summary</p>
              <p className="font-medium">total:{selectedUser.auditSummary.totalCount} / fail:{selectedUser.auditSummary.failedCount}</p>
            </div>
            <div className="rounded border border-gray-200 p-2 dark:border-gray-700">
              <p className="text-gray-500">latest privileged action</p>
              <p className="font-medium">{selectedUser.auditSummary.latestAction?.action ?? 'none'}</p>
            </div>
          </div>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(selectedUser.userSummary, null, 2)}</pre>

          <div className="mt-4 rounded border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-sm font-medium">Timeline / Investigation Context</p>
            <p className="text-xs text-gray-500">状態の根拠を時系列で追跡します（account / membership / notification / support / privacy / security / audit）。</p>
            <button
              type="button"
              className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs"
              onClick={() => trackMizzzEvent('timeline_view', { actorRole: internalRole, sourceSection: 'timeline', targetUserState: selectedUser.user360Summary.membershipStatus })}
            >timeline_view を計測</button>
            <ul className="mt-2 max-h-72 space-y-2 overflow-auto text-xs">
              {selectedUser.timeline.slice(0, 20).map((event) => (
                <li key={event.eventId} className="rounded border border-gray-200 p-2 dark:border-gray-700">
                  <p className="font-medium">{event.timelineEventType} · {event.timelineEventSeverity}</p>
                  <p className="text-gray-500">{event.eventAt} / {event.timelineEventSource} / {event.sourceSite}</p>
                  <p>{event.summary}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded border border-emerald-300 p-3 dark:border-emerald-800">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Safe Operations</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
              {selectedUser.operationsSummary.safeOperations.map((operation) => (
                <li key={operation.actionType}>{operation.actionType} / {operation.privilegedActionState}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded border border-rose-300 p-3 dark:border-rose-800">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Privileged Actions (理由 + 確認必須)</p>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">危険操作は one-click では実行しません。操作理由を入力し、監査ログに保存します。</p>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="操作理由 (必須)" className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                <option value="active">active</option>
                <option value="pending_review">pending_review</option>
                <option value="suspended">suspended</option>
                <option value="closed">closed</option>
              </select>
            {(() => {
              const targetAuthUserId = String(selectedUser.appUser.authUserId ?? selectedUser.appUser.supabaseUserId ?? selectedUser.appUser.logtoUserId ?? '').trim()
              return (
                <>
              <button
                type="button"
                className="rounded border border-rose-400 px-3 py-2 text-sm text-rose-700"
                onClick={() => {
                  if (!targetAuthUserId) {
                    setMessage('authUserId が取得できません。')
                    return
                  }
                  if (!reason.trim()) {
                    setMessage('操作理由を入力してください。')
                    return
                  }
                  trackMizzzEvent('privileged_action_start', { actorRole: internalRole, actionType: 'account_status_update', targetUserState: selectedUser.user360Summary.membershipStatus })
                  api.updateAccountStatus(targetAuthUserId, status, reason)
                    .then(() => {
                      trackMizzzEvent('privileged_action_complete', { actorRole: internalRole, actionType: 'account_status_update' })
                      setMessage('accountStatus を更新しました。')
                    })
                    .catch((e: Error) => setMessage(e.message))
                }}
              >accountStatus 更新</button>
              <button
                type="button"
                className="rounded border border-amber-400 px-3 py-2 text-sm text-amber-700"
                onClick={() => {
                  if (!targetAuthUserId) {
                    setMessage('authUserId が取得できません。')
                    return
                  }
                  if (!reason.trim()) {
                    setMessage('操作理由を入力してください。')
                    return
                  }
                  trackMizzzEvent('privileged_action_start', { actorRole: internalRole, actionType: 'notification_preference_reset', targetUserState: selectedUser.user360Summary.membershipStatus })
                  api.resetNotificationPreference(targetAuthUserId, reason)
                    .then(() => {
                      trackMizzzEvent('privileged_action_complete', { actorRole: internalRole, actionType: 'notification_preference_reset' })
                      setMessage('notificationPreference をリセットしました。')
                    })
                    .catch((e: Error) => setMessage(e.message))
                }}
              >通知設定リセット</button>
                </>
              )
            })()}
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
    </section>
  )
}
