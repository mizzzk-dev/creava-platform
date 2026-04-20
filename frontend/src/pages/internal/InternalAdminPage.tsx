import { useState } from 'react'
import { useCurrentUser } from '@/hooks'
import {
  useInternalAdminApi,
  type InternalLookupUser,
  type InternalOrderLookupItem,
  type InternalRevenueSummary,
  type InternalBiOverview,
  type InternalBiCohorts,
  type InternalBiAlerts,
  type InternalBiReport,
  type InternalAutomationPlaybooksResponse,
  type InternalAutomationRunsResponse,
  type InternalAutomationRunResponse,
} from '@/modules/internal-admin/api'

export default function InternalAdminPage() {
  const { user, isSignedIn } = useCurrentUser()
  const api = useInternalAdminApi()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<InternalLookupUser[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
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

  if (!isSignedIn) return <section className="mx-auto max-w-4xl px-4 py-16">ログインが必要です。</section>
  if (user?.role !== 'admin') return <section className="mx-auto max-w-4xl px-4 py-16">internal admin は管理者ロールのみアクセスできます。</section>

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Internal Admin Console (Beta)</h1>
      <p className="mt-2 text-sm text-gray-500">user lookup / summary / danger operations を最小機能で提供します。</p>

      <div className="mt-6 rounded border border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500">user lookup</p>
        <div className="mt-2 flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="email で検索" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={() => {
              setMessage(null)
              api.searchUsers(query).then((res) => setUsers(res.users)).catch((e: Error) => setMessage(e.message))
            }}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >検索</button>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {users.map((item) => (
            <li key={item.logtoUserId} className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setMessage(null)
                  api.getUserSummary(item.logtoUserId).then(setSelectedUser).catch((e: Error) => setMessage(e.message))
                }}
              >
                <p>{item.primaryEmail ?? item.logtoUserId}</p>
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
          <h2 className="text-lg font-medium">User Summary</h2>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">membership / entitlement</p>
              <p className="mt-1 font-medium">
                {(selectedUser.userSummary?.membershipStatus ?? selectedUser.appUser?.membershipStatus ?? '-')}
                {' / '}
                {(selectedUser.userSummary?.entitlementState ?? selectedUser.userSummary?.membership?.entitlementState ?? '-')}
              </p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">subscription / billing</p>
              <p className="mt-1 font-medium">
                {(selectedUser.userSummary?.subscriptionState ?? selectedUser.userSummary?.membership?.subscriptionState ?? '-')}
                {' / '}
                {(selectedUser.userSummary?.billingState ?? selectedUser.userSummary?.membership?.billingState ?? '-')}
              </p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50/60 p-2 dark:border-violet-900/60 dark:bg-violet-950/20">
              <p className="text-gray-500 dark:text-gray-300">benefit visibility / gate</p>
              <p className="mt-1 font-medium">
                {(selectedUser.userSummary?.benefitVisibilityState ?? '-')}
                {' / '}
                {(selectedUser.userSummary?.accessGateState ?? '-')}
              </p>
            </div>
          </div>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">{JSON.stringify(selectedUser.userSummary, null, 2)}</pre>

          <div className="mt-4 rounded border border-rose-300 p-3 dark:border-rose-800">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Danger Zone</p>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="操作理由 (必須)" className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-300 px-2 py-2 text-sm">
                <option value="active">active</option>
                <option value="pending_review">pending_review</option>
                <option value="suspended">suspended</option>
                <option value="closed">closed</option>
              </select>
              <button
                type="button"
                className="rounded border border-rose-400 px-3 py-2 text-sm text-rose-700"
                onClick={() => {
                  api.updateAccountStatus(selectedUser.appUser.logtoUserId, status, reason)
                    .then(() => setMessage('accountStatus を更新しました。'))
                    .catch((e: Error) => setMessage(e.message))
                }}
              >accountStatus 更新</button>
              <button
                type="button"
                className="rounded border border-amber-400 px-3 py-2 text-sm text-amber-700"
                onClick={() => {
                  api.resetNotificationPreference(selectedUser.appUser.logtoUserId, reason)
                    .then(() => setMessage('notificationPreference をリセットしました。'))
                    .catch((e: Error) => setMessage(e.message))
                }}
              >通知設定リセット</button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
    </section>
  )
}
