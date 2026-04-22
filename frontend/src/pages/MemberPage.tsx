import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHead from '@/components/seo/PageHead'
import SocialAuthProviderStatus from '@/components/auth/SocialAuthProviderStatus'
import { useCurrentUser, useUserLifecycleApi } from '@/hooks'
import { ROUTES } from '@/lib/routeConstants'
import { clearWithdrawRequest, getMemberAccountSettings, getMemberBillingSummary, getMemberDashboard, requestWithdraw, updateMemberAccountSettings, type MemberBillingSummary } from '@/modules/member/api'
import type { MemberAccountSettings, MemberDashboardData, MemberOrderStatus, MemberPaymentSettings, MemberShippingSettings, ShipmentStatus } from '@/modules/member/types'
import { buildCrmSegments, buildLtvDashboard, buildSupportTemplates } from '@/modules/store/lib/commerceOptimization'
import MyPagePersonalizationPanel from '@/modules/personalization/components/MyPagePersonalizationPanel'
import NotificationPreferenceCenter from '@/modules/notifications/components/NotificationPreferenceCenter'
import { buildLoyaltyProfile } from '@/modules/member/loyalty'
import MemberLoyaltyPanel from '@/modules/member/components/MemberLoyaltyPanel'
import { getCampaignList } from '@/modules/campaign/api'
import type { CampaignSummary } from '@/modules/campaign/types'
import { SITE_TYPE } from '@/lib/siteLinks'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { resolveAccountCenterUrl, SUPABASE_EMAIL_CHANGE_REDIRECT_URL, SUPABASE_PASSWORD_RESET_REDIRECT_URL } from '@/lib/auth/config'
import { useAuthClient } from '@/lib/auth/AuthProvider'
import UserLifecycleBanner from '@/components/common/UserLifecycleBanner'
import MemberValueExperiencePanel from '@/components/common/MemberValueExperiencePanel'
import MemberProgressHub from '@/components/common/MemberProgressHub'
import { requestSupabaseEmailChange, sendSupabasePasswordReset } from '@/lib/auth/supabaseAccount'

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

const ACCOUNT_CENTER_ITEMS = [
  { key: 'member.accountCenterProfile', path: '/profile', type: 'profile' },
  { key: 'member.accountCenterSecurity', path: '/security', type: 'security' },
  { key: 'member.accountCenterSessions', path: '/sessions', type: 'sessions' },
  { key: 'member.accountCenterLinked', path: '/identities', type: 'linked_accounts' },
] as const


const POSTAL_CODE_PRESETS: Record<string, Pick<MemberShippingSettings, 'prefecture' | 'city' | 'addressLine'>> = {
  '1500001': { prefecture: '東京都', city: '渋谷区', addressLine: '神宮前1-1-1' },
  '1070001': { prefecture: '東京都', city: '港区', addressLine: '北青山2-2-2' },
  '5300001': { prefecture: '大阪府', city: '大阪市北区', addressLine: '梅田1-1-1' },
}

function maskUserId(userId: string): string {
  if (userId.length <= 8) return userId
  return `${userId.slice(0, 5)}...${userId.slice(-3)}`
}


function formatStateLabel(state: string): string {
  const labels: Record<string, string> = {
    active: '有効',
    pending: '確認待ち',
    restricted: '制限中',
    suspended: '停止中',
    non_member: '未入会',
    member: '会員',
    grace: '猶予期間',
    canceled: '解約済み',
    expired: '期限切れ',
    completed: '更新完了',
    upcoming: '更新前',
    due: '更新期限',
    failed: '更新失敗',
    not_applicable: '対象外',
    reactivated: '再開済み',
    clear: '正常',
    pending_review: '確認中',
  }
  return labels[state] ?? state
}

function buildLifecycleActions(summary: ReturnType<typeof useUserLifecycleApi>): Array<{ key: string; to: string; event: string }> {
  if (!summary) return []
  if (summary.accountStatus === 'suspended' || summary.accountStatus === 'restricted') {
    return [{ key: 'member.lifecycleActionSupport', to: ROUTES.CONTACT, event: 'support_from_renewal_state' }]
  }
  if (summary.billingState === 'failed' || summary.renewalState === 'failed') {
    return [
      { key: 'member.lifecycleActionPaymentFix', to: ROUTES.MEMBER, event: 'payment_fix_cta_click' },
      { key: 'member.lifecycleActionSupport', to: ROUTES.CONTACT, event: 'support_from_renewal_state' },
    ]
  }
  if (summary.renewalState === 'grace' || summary.membershipStatus === 'grace') {
    return [
      { key: 'member.lifecycleActionRecover', to: ROUTES.MEMBER, event: 'grace_recovery_cta_click' },
      { key: 'member.lifecycleActionHelp', to: ROUTES.STORE_GUIDE, event: 'renewal_help_click' },
    ]
  }
  if (summary.renewalState === 'upcoming' || summary.renewalState === 'due') {
    return [
      { key: 'member.lifecycleActionRenew', to: ROUTES.MEMBER, event: 'renewal_cta_click' },
      { key: 'member.lifecycleActionBenefits', to: ROUTES.FANCLUB, event: 'member_value_block_view' },
    ]
  }
  if (summary.membershipStatus === 'expired' || summary.membershipStatus === 'canceled' || summary.renewalState === 'expired') {
    return [
      { key: 'member.lifecycleActionRejoin', to: ROUTES.FANCLUB, event: 'rejoin_cta_click' },
      { key: 'member.lifecycleActionSupport', to: ROUTES.CONTACT, event: 'support_from_renewal_state' },
    ]
  }
  return [{ key: 'member.lifecycleActionBenefits', to: ROUTES.FANCLUB, event: 'member_value_block_view' }]
}

export default function MemberPage() {
  const { t } = useTranslation()
  const { user, lifecycle, isLoaded, isSignedIn } = useCurrentUser()
  const authClient = useAuthClient()
  const lifecycleSummary = useUserLifecycleApi()
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null)
  const [accountSettings, setAccountSettings] = useState<MemberAccountSettings | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountSaveError, setAccountSaveError] = useState<string | null>(null)
  const [accountSavedAt, setAccountSavedAt] = useState<string | null>(null)
  const [cardValidationErrors, setCardValidationErrors] = useState<Record<string, string>>({})
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [billingSummary, setBillingSummary] = useState<MemberBillingSummary | null>(null)
  const [securityEmail, setSecurityEmail] = useState('')
  const [securityMessage, setSecurityMessage] = useState<string | null>(null)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const role = user?.role ?? 'guest'
  const isMember = user?.membershipStatus === 'member' || user?.membershipStatus === 'grace'
  const isAdmin = role === 'admin'
  const canViewMemberNotices = isMember || isAdmin
  const roleTodo = isAdmin ? ADMIN_TODO : isMember ? MEMBER_TODO : GUEST_TODO
  const progressTotal = roleTodo.length
  const progressDone = isAdmin ? progressTotal : isMember ? 2 : isSignedIn ? 1 : 0
  const progressPercent = Math.round((progressDone / progressTotal) * 100)
  const lifecycleActions = buildLifecycleActions(lifecycleSummary)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setDashboardData(null)
      return
    }

    let cancelled = false
    setDashboardLoading(true)
    setDashboardError(null)

    authClient.getAccessToken()
      .then((token) => getMemberDashboard(canViewMemberNotices, token))
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
  }, [authClient, canViewMemberNotices, isLoaded, isSignedIn, t])

  useEffect(() => {
    let cancelled = false
    getCampaignList()
      .then((res) => {
        if (cancelled) return
        setCampaigns(res.data)
      })
      .catch(() => {
        if (cancelled) return
        setCampaigns([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAccountSettings(null)
      return
    }

    getMemberAccountSettings({ id: user?.id ?? null, email: user?.email ?? null })
      .then((settings) => {
        setAccountSettings(settings)
      })
      .catch(() => {
        setDashboardError(t('member.accountSaveError', { defaultValue: '会員情報の読み込みに失敗しました。' }))
      })
  }, [isLoaded, isSignedIn, t, user?.email])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setBillingSummary(null)
      return
    }
    let cancelled = false
    authClient.getAccessToken()
      .then((token) => {
        if (!token) return null
        return getMemberBillingSummary(token)
      })
      .then((res) => {
        if (!cancelled && res) setBillingSummary(res)
      })
      .catch(() => {
        if (!cancelled) setBillingSummary(null)
      })
    return () => {
      cancelled = true
    }
  }, [authClient, isLoaded, isSignedIn])

  const visibleNotices = useMemo(() => {
    if (!dashboardData) return []
    return dashboardData.notices.filter((notice) => notice.audience === 'all' || canViewMemberNotices)
  }, [canViewMemberNotices, dashboardData])

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

  const handleAccountProfileChange = (key: 'userId' | 'displayName' | 'email', value: string) => {
    if (!accountSettings) return
    setAccountSaveError(null)
    setAccountSettings({
      ...accountSettings,
      profile: {
        ...accountSettings.profile,
        [key]: value,
      },
    })
  }

  const handleAccountFieldChange = (
    section: 'payments',
    id: string,
    key: keyof MemberPaymentSettings,
    value: string,
  ) => {
    if (!accountSettings) return
    setAccountSaveError(null)
    setAccountSettings({
      ...accountSettings,
      [section]: accountSettings[section].map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    })
    setCardValidationErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleShippingFieldChange = (id: string, key: keyof MemberShippingSettings, value: string) => {
    if (!accountSettings) return
    setAccountSaveError(null)
    setAccountSettings({
      ...accountSettings,
      shippings: accountSettings.shippings.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    })
  }

  const handleShippingAutoFillByPostalCode = (shippingId: string) => {
    if (!accountSettings) return
    const current = accountSettings.shippings.find((shipping) => shipping.id === shippingId)
    if (!current) return
    const postalCode = current.postalCode.replace(/\D/g, '').slice(0, 7)
    const preset = POSTAL_CODE_PRESETS[postalCode]
    if (!preset) {
      setAccountSaveError(t('member.postalCodeNotFound', { defaultValue: '郵便番号に一致する住所候補が見つかりませんでした。都道府県・市区町村・番地を直接入力してください。' }))
      return
    }

    setAccountSaveError(null)
    setAccountSettings({
      ...accountSettings,
      shippings: accountSettings.shippings.map((shipping) => (shipping.id === shippingId ? { ...shipping, ...preset } : shipping)),
    })
  }

  const validateCardNumber = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 12 || digits.length > 19) return false
    let sum = 0
    let shouldDouble = false
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let digit = Number(digits[i])
      if (shouldDouble) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      shouldDouble = !shouldDouble
    }
    return sum % 10 === 0
  }

  const validatePaymentCard = (payment: MemberPaymentSettings): string | null => {
    if (!payment.cardholderName.trim()) {
      return t('member.cardholderRequired', { defaultValue: 'カード名義を入力してください。' })
    }
    if (!validateCardNumber(payment.cardNumber)) {
      return t('member.cardNumberInvalid', { defaultValue: 'カード番号が無効です。' })
    }
    const month = Number(payment.expiryMonth)
    const year = Number(payment.expiryYear)
    if (!Number.isFinite(month) || month < 1 || month > 12 || !Number.isFinite(year) || year < 0 || year > 99) {
      return t('member.cardExpiryInvalid', { defaultValue: '有効期限を MM / YY 形式で入力してください。' })
    }
    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return t('member.cardExpired', { defaultValue: 'カードの有効期限が切れています。' })
    }
    return null
  }

  const handleSaveAccountSettings = async () => {
    if (!accountSettings) return
    const cardErrors = accountSettings.payments.reduce<Record<string, string>>((acc, payment) => {
      const message = validatePaymentCard(payment)
      if (message) {
        acc[payment.id] = message
      }
      return acc
    }, {})
    setCardValidationErrors(cardErrors)
    if (Object.keys(cardErrors).length > 0) {
      setAccountSaveError(t('member.accountPaymentValidationError', { defaultValue: '無効なクレジットカード情報があります。内容を修正してください。' }))
      return
    }
    setAccountSaving(true)
    setAccountSaveError(null)
    try {
      const saved = await updateMemberAccountSettings(accountSettings)
      setAccountSettings(saved)
      setAccountSavedAt(new Date().toISOString())
    } catch {
      setAccountSaveError(t('member.accountSaveError', { defaultValue: '会員情報の保存に失敗しました。' }))
    } finally {
      setAccountSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setSecurityError(t('member.securityNoEmail', { defaultValue: '登録メールアドレスがないため、パスワード再設定を開始できません。' }))
      return
    }
    setSecurityLoading(true)
    setSecurityError(null)
    setSecurityMessage(null)
    try {
      const redirectTo = SUPABASE_PASSWORD_RESET_REDIRECT_URL || `${window.location.origin}/callback?redirect=${encodeURIComponent(ROUTES.MEMBER)}`
      await sendSupabasePasswordReset(user.email, redirectTo)
      setSecurityMessage(t('member.securityPasswordResetSent', { defaultValue: 'パスワード再設定メールを送信しました。メール内リンクから変更を完了してください。' }))
      trackMizzzEvent('password_reset_start', { sourceSite: SITE_TYPE, membershipStatus: user.membershipStatus })
    } catch {
      setSecurityError(t('member.securityPasswordResetError', { defaultValue: 'パスワード再設定メールの送信に失敗しました。時間をおいて再試行してください。' }))
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleEmailChange = async () => {
    if (!securityEmail.trim()) {
      setSecurityError(t('member.securityEmailRequired', { defaultValue: '変更先メールアドレスを入力してください。' }))
      return
    }
    setSecurityLoading(true)
    setSecurityError(null)
    setSecurityMessage(null)
    try {
      const token = await authClient.getAccessToken()
      if (!token) throw new Error('missing token')
      await requestSupabaseEmailChange(token, securityEmail.trim())
      const baseMessage = t('member.securityEmailChangeSent', { defaultValue: 'メールアドレス変更確認メールを送信しました。新旧メールで承認を完了してください。' })
      setSecurityMessage(SUPABASE_EMAIL_CHANGE_REDIRECT_URL ? `${baseMessage} (${SUPABASE_EMAIL_CHANGE_REDIRECT_URL})` : baseMessage)
      trackMizzzEvent('email_change_start', { sourceSite: SITE_TYPE, membershipStatus: user?.membershipStatus ?? 'non_member' })
    } catch {
      setSecurityError(t('member.securityEmailChangeError', { defaultValue: 'メールアドレス変更リクエストに失敗しました。再認証後に再度お試しください。' }))
    } finally {
      setSecurityLoading(false)
    }
  }

  const orderStatusLabel = (status: MemberOrderStatus) => t(`member.orderStatus.${status}`, { defaultValue: status })
  const shipmentStatusLabel = (status: ShipmentStatus) => t(`member.shipmentStatus.${status}`, { defaultValue: status })
  const formatDateTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }
  const accountSavedAtLabel = accountSavedAt ? formatDateTime(accountSavedAt) : null

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
  const accountCenterLinks = useMemo(
    () => ACCOUNT_CENTER_ITEMS.map((item) => ({ ...item, href: resolveAccountCenterUrl(item.path) })),
    [],
  )
  const accountCenterRoot = useMemo(() => resolveAccountCenterUrl(), [])
  const loyaltyProfile = dashboardData ? buildLoyaltyProfile(dashboardData.loyaltyProfile) : null
  const locale = (typeof document !== 'undefined' ? document.documentElement.lang : 'ja').slice(0, 2)
  const visibleCampaigns = useMemo(() => {
    if (!loyaltyProfile) return []
    return campaigns.filter((campaign) => {
      const siteOk = campaign.targetSites.length === 0 || campaign.targetSites.includes(SITE_TYPE === 'fanclub' ? 'fc' : SITE_TYPE === 'store' ? 'store' : 'main')
      const localeOk = campaign.targetLocales.length === 0 || campaign.targetLocales.includes(locale)
      const memberOk = loyaltyProfile.accessLevel === 'premium'
        ? true
        : loyaltyProfile.accessLevel === 'member'
          ? campaign.audience !== 'premium'
          : loyaltyProfile.accessLevel === 'logged_in'
            ? campaign.audience === 'public' || campaign.audience === 'logged_in'
            : campaign.audience === 'public'
      return siteOk && localeOk && memberOk
    })
  }, [campaigns, locale, loyaltyProfile])

  useEffect(() => {
    if (!isSignedIn) return
    trackMizzzEvent('account_center_view', {
      sourceSite: SITE_TYPE,
      membershipStatus: lifecycleSummary?.membershipStatus ?? user?.membershipStatus ?? 'non_member',
      lifecycleStage: lifecycleSummary?.lifecycleStage ?? lifecycle?.lifecycleStage ?? 'unknown',
    })
    trackMizzzEvent('account_summary_view', {
      sourceSite: SITE_TYPE,
      membershipStatus: lifecycleSummary?.membershipStatus ?? user?.membershipStatus ?? 'non_member',
      lifecycleStage: lifecycleSummary?.lifecycleStage ?? lifecycle?.lifecycleStage ?? 'unknown',
      subscriptionState: lifecycleSummary?.subscriptionState ?? user?.subscriptionState ?? 'none',
      billingState: lifecycleSummary?.billingState ?? user?.billingState ?? 'clear',
    })
  }, [isSignedIn, lifecycle?.lifecycleStage, lifecycleSummary?.billingState, lifecycleSummary?.lifecycleStage, lifecycleSummary?.membershipStatus, lifecycleSummary?.subscriptionState, user?.billingState, user?.membershipStatus, user?.subscriptionState])

  useEffect(() => {
    if (!loyaltyProfile) return
    trackMizzzEvent('loyalty_badge_view', {
      membershipState: loyaltyProfile.membershipStatus,
      accessLevel: loyaltyProfile.accessLevel,
      badge: loyaltyProfile.loyaltyBadge,
    })
    trackMizzzEvent('renewal_info_view', {
      membershipState: loyaltyProfile.membershipStatus,
      renewalDate: loyaltyProfile.renewalDate ?? 'none',
    })
  }, [loyaltyProfile])

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
          <UserLifecycleBanner user={user} lifecycle={lifecycle} context="member" />
          <MemberValueExperiencePanel sourceSite="member" />
          <MemberProgressHub sourceSite="member" />
          {lifecycleSummary && (
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">account summary</p>
              <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                <p>{t('member.accountStatusLabel', { defaultValue: 'アカウント状態' })}: <span className="font-medium">{formatStateLabel(lifecycleSummary.accountStatus)}</span></p>
                <p>{t('member.membershipStatusLabel', { defaultValue: '会員状態' })}: <span className="font-medium">{formatStateLabel(lifecycleSummary.membershipStatus)}</span></p>
                <p>{t('member.renewalStateLabel', { defaultValue: '更新状態' })}: <span className="font-medium">{formatStateLabel(lifecycleSummary.renewalState)}</span></p>
                <p>{t('member.billingStateLabel', { defaultValue: '課金状態' })}: <span className="font-medium">{formatStateLabel(lifecycleSummary.billingState)}</span></p>
                <p>{t('member.lifecycleStageLabel', { defaultValue: 'ライフサイクル段階' })}: <span className="font-medium">{lifecycleSummary.lifecycleStage}</span></p>
                <p>{t('member.nextBillingLabel', { defaultValue: '次回課金予定' })}: <span className="font-medium">{lifecycleSummary.nextBillingAt ? formatDateTime(lifecycleSummary.nextBillingAt) : '-'}</span></p>
                <p>{t('member.graceEndsLabel', { defaultValue: '猶予終了予定' })}: <span className="font-medium">{lifecycleSummary.graceEndsAt ? formatDateTime(lifecycleSummary.graceEndsAt) : '-'}</span></p>
                <p>{t('member.statusReasonLabel', { defaultValue: '状態理由' })}: <span className="font-medium">{lifecycleSummary.statusReason ?? '-'}</span></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lifecycleActions.map((action) => (
                  <Link
                    key={action.key}
                    to={action.to}
                    className="inline-flex rounded-full border border-cyan-300 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-200 dark:hover:bg-cyan-950/30"
                    onClick={() => trackMizzzEvent(action.event, {
                      sourceSite: SITE_TYPE,
                      membershipStatus: lifecycleSummary.membershipStatus,
                      renewalState: lifecycleSummary.renewalState,
                      lifecycleStage: lifecycleSummary.lifecycleStage,
                    })}
                  >
                    {t(action.key, { defaultValue: action.key })}
                  </Link>
                ))}
              </div>
              {lifecycleSummary.onboardingStatus !== 'completed' && (
                <div className="mt-3 rounded bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-950/30 dark:text-violet-200">
                  {t('member.onboardingHelp', { defaultValue: '初回設定を完了すると、通知・おすすめ・サポート導線が最適化されます。' })}
                  <Link
                    to={ROUTES.MEMBER}
                    className="ml-2 font-semibold underline"
                    onClick={() => trackMizzzEvent('profile_completion_click', { membershipStatus: lifecycleSummary.membershipStatus })}
                  >
                    {t('member.onboardingCta', { defaultValue: '設定を進める' })}
                  </Link>
                </div>
              )}
            </div>
          )}
          {loyaltyProfile && (
            <MemberLoyaltyPanel profile={loyaltyProfile} campaigns={visibleCampaigns} />
          )}
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
                  <dd className="font-mono text-gray-700 dark:text-gray-200">
                    {accountSettings?.profile.userId ? maskUserId(accountSettings.profile.userId) : user ? maskUserId(user.id) : '-'}
                  </dd>
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
                    onClick={() => trackMizzzEvent('mypage_shortcut_click', { destination: action.to, membershipState: loyaltyProfile?.membershipStatus ?? 'guest' })}
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
            <p className="font-mono text-[11px] text-gray-400">account center</p>
            <h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{t('member.accountCenterTitle', { defaultValue: 'アカウント設定ハブ' })}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.accountCenterLead', { defaultValue: 'セキュリティに関わる設定は Supabase Auth フローで安全に管理し、通知や導線はこのマイページで整理します。' })}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {accountCenterLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!item.href}
                  onClick={(event) => {
                    if (!item.href) {
                      event.preventDefault()
                      return
                    }
                    trackMizzzEvent('mypage_shortcut_click', { destination: item.path, membershipState: loyaltyProfile?.membershipStatus ?? 'guest', module: 'account_center', settingType: item.type })
                  }}
                  className={`rounded border px-3 py-2 text-sm transition ${
                    item.href
                      ? 'border-gray-200 text-gray-700 hover:border-violet-300 hover:text-violet-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-violet-700 dark:hover:text-violet-300'
                      : 'cursor-not-allowed border-gray-200 text-gray-400 opacity-70 dark:border-gray-800 dark:text-gray-500'
                  }`}
                >
                  {t(item.key, { defaultValue: item.key })} ↗
                </a>
              ))}
            </div>
            <div className="mt-3 rounded border border-dashed border-gray-200 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <p>{t('member.accountCenterHostHint', { defaultValue: 'Supabase Auth Flow: パスワード変更 / メール変更 / MFA(将来拡張) / 連携アカウント / セッション管理' })}</p>
              <p className="mt-1">{t('member.accountCenterCustomHint', { defaultValue: 'Custom UI: 通知設定 / CRM配信設定 / FAQ・Support導線 / 会員向け説明文' })}</p>
              {accountCenterRoot ? (
                <a href={accountCenterRoot} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-violet-600 underline hover:text-violet-500 dark:text-violet-300 dark:hover:text-violet-200">
                  {t('member.accountCenterOpenAll', { defaultValue: 'Account Center を開く' })} ↗
                </a>
              ) : (
                <p className="mt-2 text-rose-600 dark:text-rose-300">{t('member.accountCenterUnavailable', { defaultValue: '環境変数未設定のため Account Center URL を生成できません。' })}</p>
              )}
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

          <MyPagePersonalizationPanel />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">account</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.accountLead', { defaultValue: '会員情報・支払い先・配送先に関する管理導線です。' })}</p>
              {accountSettings && (
                <div className="mt-4 space-y-3 text-xs">
                  <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('member.accountProfileTitle', { defaultValue: '会員情報を更新' })}</p>
                    <div className="mt-2 grid gap-2">
                      <input value={accountSettings.profile.displayName} onChange={(event) => handleAccountProfileChange('displayName', event.target.value)} placeholder={t('member.accountDisplayNamePlaceholder', { defaultValue: '表示名' })} className="rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900" />
                      <input value={accountSettings.profile.userId} onChange={(event) => handleAccountProfileChange('userId', event.target.value)} placeholder={t('member.accountUserIdPlaceholder', { defaultValue: 'ユーザーID' })} className="rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900" />
                      <input value={accountSettings.profile.email} onChange={(event) => handleAccountProfileChange('email', event.target.value)} placeholder={t('member.accountEmailPlaceholder', { defaultValue: 'メールアドレス' })} className="rounded border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900" />
                    </div>
                  </div>

                  <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('member.accountPaymentTitle', { defaultValue: '支払い先情報' })}</p>
                    <div className="mt-2 space-y-2">
                      {accountSettings.payments.map((payment) => (
                        <div key={payment.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <input value={payment.label} onChange={(event) => handleAccountFieldChange('payments', payment.id, 'label', event.target.value)} placeholder={t('member.cardLabelPlaceholder', { defaultValue: 'カードラベル' })} className="w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                          <input value={payment.cardholderName} onChange={(event) => handleAccountFieldChange('payments', payment.id, 'cardholderName', event.target.value)} placeholder={t('member.cardholderPlaceholder', { defaultValue: 'カード名義 (例: TARO YAMADA)' })} className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                          <div className="mt-1 grid gap-2 sm:grid-cols-3">
                            <input value={payment.cardNumber} onChange={(event) => handleAccountFieldChange('payments', payment.id, 'cardNumber', event.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric" placeholder={t('member.cardNumberPlaceholder', { defaultValue: 'カード番号' })} className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900 sm:col-span-2" />
                            <div className="flex gap-2">
                              <input value={payment.expiryMonth} onChange={(event) => handleAccountFieldChange('payments', payment.id, 'expiryMonth', event.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="MM" className="w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                              <input value={payment.expiryYear} onChange={(event) => handleAccountFieldChange('payments', payment.id, 'expiryYear', event.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="YY" className="w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                          </div>
                          {cardValidationErrors[payment.id] && (
                            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">{cardValidationErrors[payment.id]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('member.accountShippingTitle', { defaultValue: '配送先情報' })}</p>
                    <div className="mt-2 space-y-2">
                      {accountSettings.shippings.map((shipping) => (
                        <div key={shipping.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900/40">
                          <input value={shipping.label} onChange={(event) => handleShippingFieldChange(shipping.id, 'label', event.target.value)} placeholder={t('member.shippingLabelPlaceholder', { defaultValue: '配送先ラベル' })} className="w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                          <div className="mt-1 flex items-center gap-2">
                            <input value={shipping.postalCode} onChange={(event) => handleShippingFieldChange(shipping.id, 'postalCode', event.target.value.replace(/\D/g, '').slice(0, 7))} inputMode="numeric" placeholder={t('member.shippingPostalPlaceholder', { defaultValue: '郵便番号 (例: 1500001)' })} className="w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                            <button type="button" onClick={() => handleShippingAutoFillByPostalCode(shipping.id)} className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300">
                              {t('member.shippingLookupPostal', { defaultValue: '郵便番号で入力' })}
                            </button>
                          </div>
                          <div className="mt-1 grid gap-2 sm:grid-cols-2">
                            <input value={shipping.prefecture} onChange={(event) => handleShippingFieldChange(shipping.id, 'prefecture', event.target.value)} placeholder={t('member.shippingPrefecturePlaceholder', { defaultValue: '都道府県' })} className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                            <input value={shipping.city} onChange={(event) => handleShippingFieldChange(shipping.id, 'city', event.target.value)} placeholder={t('member.shippingCityPlaceholder', { defaultValue: '市区町村' })} className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                          </div>
                          <input value={shipping.addressLine} onChange={(event) => handleShippingFieldChange(shipping.id, 'addressLine', event.target.value)} placeholder={t('member.shippingAddressLinePlaceholder', { defaultValue: '番地' })} className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                          <input value={shipping.building} onChange={(event) => handleShippingFieldChange(shipping.id, 'building', event.target.value)} placeholder={t('member.shippingBuildingPlaceholder', { defaultValue: 'ビル名・部屋番号' })} className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={accountSaving}
                    onClick={() => { void handleSaveAccountSettings() }}
                    className="inline-flex items-center rounded border border-violet-300 px-3 py-1.5 text-xs text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-800 dark:hover:bg-violet-900/20"
                  >
                    {accountSaving
                      ? t('member.accountSaving', { defaultValue: '保存中…' })
                      : t('member.accountSaveAction', { defaultValue: '会員情報を保存する' })}
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                    {accountSaveError && <span className="text-rose-600 dark:text-rose-300">{accountSaveError}</span>}
                    {!accountSaveError && accountSavedAtLabel && t('member.accountSavedAt', { savedAt: accountSavedAtLabel, defaultValue: '最終保存: {{savedAt}}' })}
                    {!accountSaveError && !accountSavedAtLabel && t('member.accountSaveHint', { defaultValue: '保存後に最終更新時刻が表示されます。' })}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-[11px] text-gray-400">auth</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('member.authLead', { defaultValue: 'ソーシャルログイン連携の対応状況を確認できます。' })}</p>
              <SocialAuthProviderStatus isSignedIn={isSignedIn} />
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('member.authHelp', { defaultValue: '実際のログイン方式は、Supabase Auth で有効化されたプロバイダー設定に従います。' })}</p>
              <div className="mt-4 rounded border border-dashed border-gray-200 p-3 text-xs dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{t('member.securitySectionTitle', { defaultValue: 'セキュリティ設定（自己管理）' })}</p>
                <p className="mt-1 text-gray-600 dark:text-gray-300">{t('member.securitySectionLead', { defaultValue: 'パスワード再設定・メール変更は Supabase Auth の安全なフローで実行します。' })}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { void handlePasswordReset() }}
                    disabled={securityLoading}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:border-violet-300 hover:text-violet-600 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
                  >
                    {t('member.securityPasswordResetAction', { defaultValue: 'パスワード再設定メールを送る' })}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={securityEmail}
                    onChange={(event) => setSecurityEmail(event.target.value)}
                    type="email"
                    placeholder={t('member.securityEmailInputPlaceholder', { defaultValue: '変更先メールアドレス' })}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-[11px] dark:border-gray-700 dark:bg-gray-900 md:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={() => { void handleEmailChange() }}
                    disabled={securityLoading}
                    className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:border-violet-300 hover:text-violet-600 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200"
                  >
                    {t('member.securityEmailChangeAction', { defaultValue: 'メール変更を申請' })}
                  </button>
                </div>
                {securityMessage && <p className="mt-2 text-emerald-600 dark:text-emerald-300">{securityMessage}</p>}
                {securityError && <p className="mt-2 text-rose-600 dark:text-rose-300">{securityError}</p>}
              </div>
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

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
                  <NotificationPreferenceCenter location="member_page" />
                </section>

                <section className="rounded border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Billing / Entitlement</h2>
                  <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                    <p>membershipStatus: <span className="font-mono">{billingSummary?.membership.membershipStatus ?? '-'}</span></p>
                    <p>accessLevel: <span className="font-mono">{billingSummary?.membership.accessLevel ?? '-'}</span></p>
                    <p>subscriptionStatus: <span className="font-mono">{billingSummary?.billingSummary?.subscriptionStatus ?? '-'}</span></p>
                    <p>billingStatus: <span className="font-mono">{billingSummary?.billingSummary?.billingStatus ?? '-'}</span></p>
                    <p>renewalDate: <span className="font-mono">{billingSummary?.billingSummary?.renewalDate ? formatDateTime(billingSummary.billingSummary.renewalDate) : '-'}</span></p>
                    <p>entitlementState: <span className="font-mono">{billingSummary?.entitlementSummary?.entitlementState ?? '-'}</span></p>
                    <p className="sm:col-span-2">entitlementSet: <span className="break-all font-mono">{JSON.stringify(billingSummary?.entitlementSummary?.entitlementSet ?? {})}</span></p>
                    <p>syncState: <span className="font-mono">{billingSummary?.billingSummary?.syncState ?? '-'}</span></p>
                    <p>sourceOfTruth: <span className="font-mono">{billingSummary?.billingSummary?.sourceOfTruth ?? '-'}</span></p>
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
