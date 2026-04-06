import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import SocialAuthProviderStatus from '@/components/auth/SocialAuthProviderStatus'
import { useCurrentUser } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'
import { clearWithdrawRequest, getMemberDashboard, requestWithdraw, updateMemberPreferences } from '@/modules/member/api'
import type { MemberDashboardData, MemberOrderStatus, ShipmentStatus } from '@/modules/member/types'
import { buildCrmSegments, buildLtvDashboard, buildSupportTemplates } from '@/modules/store/lib/commerceOptimization'

const MEMBER_BENEFITS = [
  'member.benefitEarly',
  'member.benefitStore',
  'member.benefitEvent',
]

const NEXT_ACTIONS = [
  { key: 'member.actionStore', to: ROUTES.STORE },
  { key: 'member.actionFanclub', to: ROUTES.FANCLUB },
  { key: 'member.actionNews', to: ROUTES.NEWS },
]

const QUICK_LINKS = [
  { key: 'member.quickContact', to: ROUTES.CONTACT },
  { key: 'member.quickFaq', to: ROUTES.FAQ },
  { key: 'member.quickEvents', to: ROUTES.EVENTS },
  { key: 'member.quickCart', to: ROUTES.CART },
]

const GUEST_TODO = [
  'member.todoGuestSignIn',
  'member.todoGuestFanclub',
  'member.todoGuestContact',
]

const MEMBER_TODO = [
  'member.todoMemberNews',
  'member.todoMemberStore',
  'member.todoMemberEvent',
]

const ADMIN_TODO = [
  'member.todoAdminPublish',
  'member.todoAdminFanclub',
  'member.todoAdminSupport',
]

const ACCESS_ITEMS = [
  {
    titleKey: 'member.accessFanclubTitle',
    descKey: 'member.accessFanclubDesc',
    signedInStatusKey: 'member.accessStatusFanclubSignedIn',
    guestStatusKey: 'member.accessStatusFanclubGuest',
    to: ROUTES.FANCLUB,
    actionKey: 'member.actionFanclub',
  },
  {
    titleKey: 'member.accessStoreTitle',
    descKey: 'member.accessStoreDesc',
    signedInStatusKey: 'member.accessStatusStoreSignedIn',
    guestStatusKey: 'member.accessStatusStoreGuest',
    to: ROUTES.STORE,
    actionKey: 'member.actionStore',
  },
  {
    titleKey: 'member.accessSupportTitle',
    descKey: 'member.accessSupportDesc',
    signedInStatusKey: 'member.accessStatusSupportSignedIn',
    guestStatusKey: 'member.accessStatusSupportGuest',
    to: ROUTES.CONTACT,
    actionKey: 'member.quickContact',
  },
]

const ACCOUNT_MANAGEMENT_ITEMS = [
  {
    titleKey: 'member.accountProfileTitle',
    descKey: 'member.accountProfileDesc',
    actionKey: 'member.accountProfileAction',
    to: ROUTES.CONTACT,
  },
  {
    titleKey: 'member.accountPaymentTitle',
    descKey: 'member.accountPaymentDesc',
    actionKey: 'member.accountPaymentAction',
    to: ROUTES.STORE,
  },
  {
    titleKey: 'member.accountShippingTitle',
    descKey: 'member.accountShippingDesc',
    actionKey: 'member.accountShippingAction',
    to: ROUTES.CONTACT,
  },
]


function maskUserId(userId: string): string {
  if (userId.length <= 8) return userId
  return `${userId.slice(0, 5)}...${userId.slice(-3)}`
}

export default function MemberPage() {
  const { t } = useTranslation()
  const { user, isLoaded, isSignedIn } = useCurrentUser()
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const role = user?.role ?? 'guest'
  const isMember = role === 'member'
  const isAdmin = role === 'admin'
  const canViewMemberNotices = isMember || isAdmin
  const roleTodo = isAdmin ? ADMIN_TODO : isMember ? MEMBER_TODO : GUEST_TODO
  const progressTotal = roleTodo.length
  const progressDone = isAdmin ? progressTotal : isMember ? 2 : isSignedIn ? 1 : 0
  const progressPercent = Math.round((progressDone / progressTotal) * 100)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setDashboardData(null)
      return
    }

    let cancelled = false
    setDashboardLoading(true)
    setDashboardError(null)

    getMemberDashboard(canViewMemberNotices)
      .then((data) => {
        if (!cancelled) {
          setDashboardData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardError(t('member.dashboardLoadError', { defaultValue: 'データの読み込みに失敗しました。時間をおいて再度お試しください。' }))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [canViewMemberNotices, isLoaded, isSignedIn, t])

  const visibleNotices = useMemo(() => {
    if (!dashboardData) return []
    return dashboardData.notices.filter((notice) => notice.audience === 'all' || canViewMemberNotices)
  }, [canViewMemberNotices, dashboardData])

  const handlePreferenceChange = async (key: 'newsletterOptIn' | 'loginAlertOptIn', checked: boolean) => {
    if (!dashboardData) return
    const nextPreferences = { ...dashboardData.preferences, [key]: checked }
    try {
      const saved = await updateMemberPreferences(nextPreferences)
      setDashboardData({ ...dashboardData, preferences: saved })
    } catch {
      setDashboardError(t('member.preferencesSaveError', { defaultValue: '通知設定の保存に失敗しました。時間をおいて再度お試しください。' }))
    }
  }

  const handleWithdrawRequest = async () => {
    if (!dashboardData || dashboardData.withdrawRequested) return
    const requested = await requestWithdraw()
    setDashboardData({ ...dashboardData, withdrawRequested: requested })
  }

  const handleWithdrawCancel = async () => {
    if (!dashboardData || !dashboardData.withdrawRequested) return
    const requested = await clearWithdrawRequest()
    setDashboardData({ ...dashboardData, withdrawRequested: requested })
  }

  const orderStatusLabel = (status: MemberOrderStatus) => t(`member.orderStatus.${status}`, { defaultValue: status })
  const shipmentStatusLabel = (status: ShipmentStatus) => t(`member.shipmentStatus.${status}`, { defaultValue: status })
  const formatDateTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  const crmSegments = dashboardData ? buildCrmSegments([
    { memberId: user?.id ?? 'current', favoritesCount: 2, restockRequests: 1, orderCount: dashboardData.orders.length, lastOrderAt: dashboardData.orders[0]?.orderedAt ?? null },
    { memberId: 'seed-loyal', favoritesCount: 4, restockRequests: 2, orderCount: 5, lastOrderAt: '2026-03-20T09:00:00.000Z' },
    { memberId: 'seed-reactivation', favoritesCount: 1, restockRequests: 0, orderCount: 1, lastOrderAt: '2025-12-10T09:00:00.000Z' },
  ]) : null

  const ltvDashboard = dashboardData ? buildLtvDashboard([
    { memberId: user?.id ?? 'current', firstOrderAt: dashboardData.orders[0]?.orderedAt ?? '2026-01-15T00:00:00.000Z', latestOrderAt: dashboardData.orders[0]?.orderedAt ?? '2026-03-30T00:00:00.000Z', totalOrderCount: dashboardData.orders.length || 1, acquisition: 'organic' },
    { memberId: 'seed-1', firstOrderAt: '2026-01-10T00:00:00.000Z', latestOrderAt: '2026-03-30T00:00:00.000Z', totalOrderCount: 4, acquisition: 'social' },
    { memberId: 'seed-2', firstOrderAt: '2026-02-01T00:00:00.000Z', latestOrderAt: '2026-02-10T00:00:00.000Z', totalOrderCount: 1, acquisition: 'ads' },
    { memberId: 'seed-3', firstOrderAt: '2026-01-04T00:00:00.000Z', latestOrderAt: '2026-03-02T00:00:00.000Z', totalOrderCount: 2, acquisition: 'direct' },
  ]) : null

  const supportTemplates = dashboardData ? buildSupportTemplates(dashboardData.orders) : []

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <PageHead title={t('member.title', { defaultValue: 'マイページ' })} description={t('member.description', { defaultValue: '会員状態と特典を確認できます。' })} />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('member.title', { defaultValue: 'マイページ' })}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('member.pageLead', { defaultValue: '会員状態と利用できる導線をまとめて確認できます。' })}</p>

      {!isLoaded && <p className="mt-4 text-sm text-gray-500">{t('common.loading')}</p>}

      {isLoaded && !isSignedIn && (
        <div className="mt-6 rounded border border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('member.signInPrompt', { defaultValue: '会員情報を見るにはログインしてください。' })}</p>
          <div className="mt-3 flex gap-4">
            <Link to={ROUTES.FANCLUB} className="inline-flex text-sm text-violet-500 hover:text-violet-400">{t('home.fanclub.joinButton')} →</Link>
            <Link to={ROUTES.STORE} className="inline-flex text-sm text-gray-700 dark:text-gray-300">{t('member.actionStore', { defaultValue: 'Storeを見る' })} →</Link>
          </div>
        </div>
      )}

      {isLoaded && isSignedIn && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">status</p>
              <p className="mt-2 text-xl font-medium text-gray-900 dark:text-gray-100">
                {isAdmin
                  ? t('member.adminLabel', { defaultValue: '管理者' })
                  : isMember
                    ? t('member.memberLabel', { defaultValue: 'FC会員' })
                    : t('member.guestLabel', { defaultValue: '一般ユーザー' })}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isAdmin
                  ? t('member.adminDesc', { defaultValue: '会員限定導線を含む全コンテンツの確認が可能です。' })
                  : isMember
                    ? t('member.memberDesc', { defaultValue: '限定コンテンツ・商品の閲覧/購入が可能です。' })
                    : t('member.guestDesc', { defaultValue: '一部コンテンツは Fanclub 参加後に閲覧できます。' })}
              </p>
              <dl className="mt-4 space-y-2 rounded bg-gray-50 p-3 text-xs dark:bg-gray-900/50">
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('member.accountId', { defaultValue: 'アカウントID' })}</dt>
                  <dd className="font-mono text-gray-700 dark:text-gray-200">{user ? maskUserId(user.id) : '-'}</dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-gray-500 dark:text-gray-400">{t('member.accountEmail', { defaultValue: 'メールアドレス' })}</dt>
                  <dd className="text-gray-700 dark:text-gray-200">{user?.email ?? t('member.emailMissing', { defaultValue: '未設定' })}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">benefits</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {MEMBER_BENEFITS.map((benefit) => (
                  <li key={benefit}>• {t(benefit, { defaultValue: benefit })}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('member.benefitNote', { defaultValue: '最新の会員特典・公開状態は Fanclub / Store の各ページで確認できます。' })}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">progress</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{progressPercent}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('member.progressMeta', { done: progressDone, total: progressTotal, defaultValue: `${progressDone}/${progressTotal} completed` })}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label={t('member.progressLabel', { defaultValue: 'My page readiness progress' })}>
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.progressHelp', { defaultValue: '次のアクションを進めることで、限定導線や運用確認の抜け漏れを減らせます。' })}</p>
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">next</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                {NEXT_ACTIONS.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
                  >
                    {t(action.key, { defaultValue: action.key })} →
                  </Link>
                ))}
              </div>
              {!isMember && !isAdmin && (
                <p className="mt-3 text-xs text-violet-500">{t('member.joinHint', { defaultValue: 'FC限定商品や先行情報は Fanclub 参加後に利用できます。' })}</p>
              )}
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">quick links</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500"
                  >
                    {t(link.key, { defaultValue: link.key })}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('member.quickLinksHelp', { defaultValue: '不明点があれば FAQ を確認し、依頼相談は Contact から送信してください。' })}</p>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
            <p className="font-mono text-[11px] text-gray-400">access overview</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.accessLead', { defaultValue: '利用頻度の高い導線について、現在のアクセス状態をまとめています。' })}</p>
            <ul className="mt-4 space-y-3">
              {ACCESS_ITEMS.map((item) => (
                <li key={item.titleKey} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t(item.titleKey, { defaultValue: item.titleKey })}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t(item.descKey, { defaultValue: item.descKey })}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[11px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                      {t(isSignedIn ? item.signedInStatusKey : item.guestStatusKey, { defaultValue: isSignedIn ? item.signedInStatusKey : item.guestStatusKey })}
                    </span>
                  </div>
                  <Link to={item.to} className="mt-3 inline-flex text-xs text-violet-500 hover:text-violet-400">
                    {t(item.actionKey, { defaultValue: item.actionKey })} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
            <p className="font-mono text-[11px] text-gray-400">checklist</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.checklistLead', { defaultValue: '次のアクションを進めると、マイページの活用がスムーズになります。' })}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {roleTodo.map((todo) => (
                <li key={todo} className="flex gap-2">
                  <span aria-hidden className="text-violet-500">✓</span>
                  <span>{t(todo, { defaultValue: todo })}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">account</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.accountLead', { defaultValue: '会員情報・支払い先・配送先に関する管理導線です。' })}</p>
              <ul className="mt-4 space-y-3">
                {ACCOUNT_MANAGEMENT_ITEMS.map((item) => (
                  <li key={item.titleKey} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t(item.titleKey, { defaultValue: item.titleKey })}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t(item.descKey, { defaultValue: item.descKey })}</p>
                    <Link to={item.to} className="mt-3 inline-flex text-xs text-violet-500 hover:text-violet-400">
                      {t(item.actionKey, { defaultValue: item.actionKey })} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">auth</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.authLead', { defaultValue: 'ソーシャルログイン連携の対応状況を確認できます。' })}</p>
              <SocialAuthProviderStatus isSignedIn={isSignedIn} />
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.authHelp', { defaultValue: '実際のログイン方式は、Clerk ダイアログで表示される有効なプロバイダー設定に従います。' })}</p>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-gray-400">operations</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.operationsLead', { defaultValue: '注文・配送・通知設定などの実運用項目を確認できます。' })}</p>
              </div>
              {dashboardLoading && <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.loading')}</p>}
            </div>

            {dashboardError && (
              <p className="mt-3 rounded border border-rose-300 bg-rose-50 p-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{dashboardError}</p>
            )}

            {dashboardData && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.ordersTitle', { defaultValue: '注文履歴' })}</h2>
                  {dashboardData.orders.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      {dashboardData.orders.map((order) => (
                        <li key={order.externalOrderId} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <p className="font-mono text-[11px] text-gray-500">{order.externalOrderId}</p>
                          <p className="mt-1">{order.lines.map((line) => `${line.productName} ×${line.quantity}`).join(' / ')}</p>
                          <p className="mt-1 text-gray-500 dark:text-gray-400">{t('member.orderSummary', { status: orderStatusLabel(order.status), total: order.total.toLocaleString(), currency: order.currency, defaultValue: '状態: {{status}} / 合計: {{total}} {{currency}}' })}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.ordersEmpty', { defaultValue: '表示できる注文履歴はありません。' })}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.shipmentsTitle', { defaultValue: '配送状況' })}</h2>
                  {dashboardData.shipments.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      {dashboardData.shipments.map((shipment) => (
                        <li key={shipment.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <p className="font-mono text-[11px] text-gray-500">{shipment.orderExternalId}</p>
                          <p className="mt-1">{shipment.carrier} / {shipment.trackingNumber}</p>
                          <p className="mt-1 text-gray-500 dark:text-gray-400">{t('member.shipmentSummary', { status: shipmentStatusLabel(shipment.status), defaultValue: '配送状態: {{status}}' })}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.shipmentsEmpty', { defaultValue: '配送状況はありません。' })}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.noticesTitle', { defaultValue: '重要なお知らせ' })}</h2>
                  {visibleNotices.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      {visibleNotices.map((notice) => (
                        <li key={notice.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{notice.title}</p>
                            {notice.priority === 'high' && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{t('member.noticeHighPriority', { defaultValue: '重要' })}</span>}
                          </div>
                          <p className="mt-1">{notice.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.noticesEmpty', { defaultValue: '表示可能なお知らせはありません。' })}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.preferencesTitle', { defaultValue: '通知設定' })}</h2>
                  <div className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <label className="flex items-center justify-between gap-3 rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                      <span>{t('member.newsletterOptIn', { defaultValue: 'メールマガジンを受け取る' })}</span>
                      <input type="checkbox" checked={dashboardData.preferences.newsletterOptIn} onChange={(event) => void handlePreferenceChange('newsletterOptIn', event.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                      <span>{t('member.loginAlertOptIn', { defaultValue: 'ログイン通知を受け取る' })}</span>
                      <input type="checkbox" checked={dashboardData.preferences.loginAlertOptIn} onChange={(event) => void handlePreferenceChange('loginAlertOptIn', event.target.checked)} />
                    </label>
                  </div>
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.auditLogsTitle', { defaultValue: 'ログ履歴' })}</h2>
                  {dashboardData.auditLogs.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                      {dashboardData.auditLogs.map((log) => (
                        <li key={log.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <p>{log.eventType}</p>
                          <p className="mt-1 text-gray-500 dark:text-gray-400">{formatDateTime(log.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.auditLogsEmpty', { defaultValue: 'ログ履歴はありません。' })}</p>
                  )}
                </section>


                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.crmTitle', { defaultValue: 'CRMセグメント' })}</h2>
                  {crmSegments ? (
                    <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <li>{t('member.crmHighIntent', { defaultValue: '高関心層' })}: {crmSegments.highIntent.length}</li>
                      <li>{t('member.crmLoyal', { defaultValue: 'ロイヤル層' })}: {crmSegments.loyal.length}</li>
                      <li>{t('member.crmReactivation', { defaultValue: '再活性候補' })}: {crmSegments.reactivation.length}</li>
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.ltvTitle', { defaultValue: 'LTVダッシュボード' })}</h2>
                  {ltvDashboard ? (
                    <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <p>{t('member.ltvRetention', { defaultValue: '会員継続率' })}: {ltvDashboard.retentionRate}%</p>
                      <p>{t('member.ltvRepurchase', { defaultValue: '再購入率' })}: {ltvDashboard.repurchaseRate}%</p>
                      <p>{t('member.ltvCvrBySource', { defaultValue: '流入別CVR' })}: O {ltvDashboard.cvrByAcquisition.organic}% / S {ltvDashboard.cvrByAcquisition.social}% / A {ltvDashboard.cvrByAcquisition.ads}% / D {ltvDashboard.cvrByAcquisition.direct}%</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.supportTemplatesTitle', { defaultValue: '問い合わせテンプレート' })}</h2>
                  {supportTemplates.length > 0 ? (
                    <ul className="mt-3 grid gap-2 md:grid-cols-3">
                      {supportTemplates.map((template) => (
                        <li key={template.id} className="rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{template.label}</p>
                          <p className="mt-1">{template.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.supportTemplatesEmpty', { defaultValue: 'テンプレート作成には注文履歴が必要です。' })}</p>
                  )}
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.withdrawTitle', { defaultValue: '退会手続き' })}</h2>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t('member.withdrawDescription', { defaultValue: '退会前に、未配送注文と会員期限をご確認ください。' })}</p>
                  <button
                    type="button"
                    onClick={() => void handleWithdrawRequest()}
                    disabled={dashboardData.withdrawRequested}
                    className="mt-3 rounded border border-rose-400 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
                  >
                    {t('member.withdrawAction', { defaultValue: '退会申請を開始する' })}
                  </button>
                  {dashboardData.withdrawRequested && (
                    <>
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{t('member.withdrawRequested', { defaultValue: '退会申請を受け付けました。運営より登録メール宛にご連絡します。' })}</p>
                      <button
                        type="button"
                        onClick={() => void handleWithdrawCancel()}
                        className="mt-2 text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {t('member.withdrawCancel', { defaultValue: '申請を取り消す' })}
                      </button>
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
