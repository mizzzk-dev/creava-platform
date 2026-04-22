import { verifyAccessToken, type AuthenticatedUser } from '../../../lib/auth/provider'
import { requireInternalPermission, type InternalRole } from '../../../lib/auth/internal-access'

type SiteType = 'main' | 'store' | 'fc' | 'cross'

type MembershipPlan = 'free' | 'standard' | 'premium'
type MembershipStatus = 'non_member' | 'member' | 'grace' | 'canceled' | 'expired' | 'suspended' | 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'

type AccessLevel = 'public' | 'logged_in' | 'member' | 'premium' | 'admin'

type NormalizedClaims = {
  email: string | null
  phone: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  locale: string
  linkedProviders: string[]
  role: AccessLevel
}

const OPS_TOKEN = process.env.LOGTO_USER_SYNC_OPS_TOKEN
const SENSITIVE_REAUTH_MAX_AGE_SEC = Number(process.env.SENSITIVE_REAUTH_MAX_AGE_SEC ?? '900')
const SUPPORTED_SENSITIVE_ACTIONS = ['email_change', 'password_change', 'provider_link_change', 'session_revoke', 'account_recovery'] as const
type SensitiveActionType = (typeof SUPPORTED_SENSITIVE_ACTIONS)[number]
type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_change_requested'
  | 'email_change_completed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'linked_provider_added'
  | 'linked_provider_removed'
  | 'session_revoked'
  | 'all_sessions_revoked'
  | 'reauth_performed'
  | 'suspicious_review_flagged'

function normalizeLocale(raw: unknown, fallback: string = 'ja'): string {
  if (raw === 'ja' || raw === 'en' || raw === 'ko') return raw
  return fallback
}

function normalizeSite(raw: unknown): SiteType {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'main' || value === 'store' || value === 'fc' || value === 'cross') return value
  return 'cross'
}

function deriveRole(rawRoles: unknown, rawRole: unknown): AccessLevel {
  const normalizedRoles = Array.isArray(rawRoles) ? rawRoles : []
  if (normalizedRoles.includes('admin') || rawRole === 'admin') return 'admin'
  if (normalizedRoles.includes('premium') || rawRole === 'premium') return 'premium'
  if (normalizedRoles.includes('member') || rawRole === 'member') return 'member'
  return 'logged_in'
}

function toDisplayName(claims: Record<string, unknown>): string | null {
  const candidates = [claims.name, claims.displayName, claims.nickname, claims.username]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return null
}

function toLinkedProviders(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item : null))
      .filter((item): item is string => Boolean(item))
  }
  return []
}

function normalizeClaims(authUser: AuthenticatedUser, requestedLocale?: unknown): NormalizedClaims {
  const claims = authUser.claims
  return {
    email: typeof claims.email === 'string' ? claims.email : authUser.email,
    phone: typeof claims.phone_number === 'string' ? claims.phone_number : null,
    username: typeof claims.username === 'string' ? claims.username : null,
    displayName: toDisplayName(claims),
    avatarUrl: typeof claims.picture === 'string' ? claims.picture : null,
    locale: normalizeLocale(requestedLocale, normalizeLocale(claims.locale, 'ja')),
    linkedProviders: toLinkedProviders(claims.identities),
    role: deriveRole(claims.roles, claims.role),
  }
}


function normalizeOnboardingStatus(raw: unknown): 'not_started' | 'in_progress' | 'completed' | 'skipped' {
  const value = String(raw ?? '').trim()
  if (value === 'in_progress' || value === 'completed' || value === 'skipped') return value
  return 'not_started'
}

function normalizeProfileCompletionStatus(raw: unknown): 'not_started' | 'in_progress' | 'completed' {
  const value = String(raw ?? '').trim()
  if (value === 'complete' || value === 'completed') return 'completed'
  if (value === 'partial' || value === 'in_progress') return 'in_progress'
  return 'not_started'
}

function resolveLifecycleStage(params: {
  accountStatus: string
  membershipStatus: string
  onboardingStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  renewalState?: string
}): string {
  if (params.accountStatus === 'suspended' || params.accountStatus === 'restricted' || params.membershipStatus === 'suspended') return 'suspended_user'
  if (params.onboardingStatus === 'not_started' || params.onboardingStatus === 'in_progress') return 'onboarding_user'
  if (params.renewalState === 'upcoming' && params.membershipStatus === 'member') return 'renewal_soon_member'
  if (params.renewalState === 'reactivated' && params.membershipStatus === 'member') return 'reactivated_member'
  if (params.membershipStatus === 'member') return 'active_member'
  if (params.membershipStatus === 'grace') return 'grace_member'
  if (params.membershipStatus === 'expired' || params.membershipStatus === 'canceled') return 'expired_member'
  return 'authenticated_non_member'
}

function deriveRenewalState(params: { membershipStatus: string; subscriptionState: string; billingState: string; reactivatedAt?: string | null }): string {
  if (params.reactivatedAt) return 'reactivated'
  if (params.membershipStatus === 'grace') return 'grace'
  if (params.membershipStatus === 'expired' || params.membershipStatus === 'canceled') return 'expired'
  if (params.billingState === 'failed' || params.subscriptionState === 'past_due') return 'failed'
  if (params.subscriptionState === 'active' && params.membershipStatus === 'member') return 'completed'
  return 'not_applicable'
}

function deriveRenewalWindowState(params: { renewalState: string; renewalDueAt: string | null; graceEndsAt: string | null }): string {
  if (params.renewalState === 'grace') return 'grace_window'
  if (params.renewalState === 'expired') return 'rejoin_window'
  if (!params.renewalDueAt) return params.renewalState === 'not_applicable' ? 'inactive' : 'normal'
  const due = new Date(params.renewalDueAt).getTime()
  if (Number.isNaN(due)) return 'normal'
  const diffDays = (due - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays <= 0) return 'due_now'
  if (diffDays <= 7) return 'renewal_soon'
  if (params.graceEndsAt) return 'grace_window'
  return 'normal'
}

function buildLifecycleSummary(appUser: any, latestSubscription: any, latestEntitlement: any) {
  const onboardingStatus = normalizeOnboardingStatus(appUser?.onboardingState)
  const profileCompletionStatus = normalizeProfileCompletionStatus(appUser?.profileCompletionState)
  const membershipStatus = latestEntitlement?.membershipStatus ?? appUser?.membershipStatus ?? 'non_member'
  const accountStatus = appUser?.accountStatus ?? 'active'
  const subscriptionState = latestSubscription?.subscriptionStatus ?? 'none'
  const billingState = latestSubscription?.billingStatus ?? 'clear'
  const renewalDueAt = latestSubscription?.renewalDate ?? latestSubscription?.currentPeriodEnd ?? latestSubscription?.endAt ?? null
  const graceEndsAt = latestSubscription?.currentPeriodEnd ?? latestSubscription?.endAt ?? appUser?.graceEndsAt ?? null
  const reactivatedAt = appUser?.reactivatedAt ?? null
  const renewalState = deriveRenewalState({ membershipStatus, subscriptionState, billingState, reactivatedAt })
  const renewalWindowState = deriveRenewalWindowState({ renewalState, renewalDueAt, graceEndsAt })
  const lifecycleMessageState = renewalState === 'grace'
    ? 'grace_notice_sent'
    : renewalState === 'expired'
      ? 'winback_sent'
      : renewalState === 'upcoming' || renewalWindowState === 'renewal_soon'
        ? 'renewal_pending'
        : 'idle'

  return {
    onboardingStatus,
    profileCompletionStatus,
    lifecycleStage: resolveLifecycleStage({ accountStatus, membershipStatus, onboardingStatus, renewalState }),
    membershipStatus,
    accountStatus,
    accessLevel: latestEntitlement?.accessLevel ?? appUser?.accessLevel ?? 'logged_in',
    entitlementState: latestEntitlement?.entitlementState ?? 'inactive',
    subscriptionState,
    billingState,
    renewalState,
    renewalWindowState,
    lifecycleMessageState,
    reactivationEligibility: membershipStatus === 'grace' || membershipStatus === 'expired' || membershipStatus === 'canceled',
    winbackEligibility: membershipStatus === 'expired' || membershipStatus === 'canceled',
    firstLoginAt: appUser?.firstLoginAt ?? null,
    lastLoginAt: appUser?.lastLoginAt ?? null,
    joinedAt: latestSubscription?.startAt ?? appUser?.joinedAt ?? null,
    renewedAt: latestSubscription?.renewalDate ?? latestSubscription?.currentPeriodEnd ?? appUser?.renewedAt ?? null,
    canceledAt: latestSubscription?.canceledAt ?? appUser?.canceledAt ?? null,
    graceEndsAt,
    renewalDueAt,
    nextBillingAt: latestSubscription?.currentPeriodEnd ?? latestSubscription?.renewalDate ?? null,
    suspendedAt: accountStatus === 'suspended' || membershipStatus === 'suspended' ? (appUser?.updatedAt ?? null) : null,
    reactivatedAt: accountStatus === 'active' && membershipStatus === 'member' ? (reactivatedAt ?? latestSubscription?.updatedAt ?? null) : null,
    expiredAt: membershipStatus === 'expired' ? (latestSubscription?.endAt ?? latestSubscription?.updatedAt ?? appUser?.updatedAt ?? null) : null,
    paymentFailureAt: billingState === 'failed' ? (latestSubscription?.lastBillingEventAt ?? latestSubscription?.updatedAt ?? null) : null,
    sourceSite: appUser?.sourceSite ?? 'cross',
    statusReason: latestSubscription?.statusReason ?? latestEntitlement?.statusReason ?? null,
    statusUpdatedAt: latestSubscription?.updatedAt ?? latestEntitlement?.updatedAt ?? appUser?.updatedAt ?? null,
    lastRetentionMessageAt: appUser?.lastRetentionMessageAt ?? null,
    lastRenewalNoticeAt: appUser?.lastRenewalNoticeAt ?? null,
    lastWinbackNoticeAt: appUser?.lastWinbackNoticeAt ?? null,
  }
}


function normalizeMembershipStatus(status: MembershipStatus): MembershipStatus {
  if (status === 'guest') return 'non_member'
  if (status === 'active') return 'member'
  if (status === 'grace_period') return 'grace'
  if (status === 'paused') return 'suspended'
  if (status === 'cancelled') return 'canceled'
  return status
}

function toMembershipSummary(record: any): { membershipPlan: MembershipPlan; membershipStatus: MembershipStatus; accessLevel: AccessLevel } {
  if (!record) {
    return { membershipPlan: 'free', membershipStatus: 'non_member', accessLevel: 'logged_in' }
  }

  const membershipPlan = record.membershipType === 'premium' ? 'premium' : record.membershipType === 'paid' ? 'standard' : 'free'

  const statusRaw = String(record.subscriptionStatus ?? '').toLowerCase()
  const membershipStatus = statusRaw.includes('active')
    ? 'member'
    : statusRaw.includes('trial')
      ? 'grace'
      : statusRaw.includes('past_due')
        ? 'suspended'
        : statusRaw.includes('cancel')
          ? 'canceled'
          : statusRaw.includes('expire')
            ? 'expired'
            : 'non_member'

  const accessLevel = membershipPlan === 'premium'
    ? 'premium'
    : membershipPlan === 'standard'
      ? 'member'
      : 'logged_in'

  return { membershipPlan, membershipStatus: normalizeMembershipStatus(membershipStatus), accessLevel }
}


function deriveMemberProgressSeed(membershipStatus: MembershipStatus) {
  const isMember = membershipStatus === 'member'
  const isGrace = membershipStatus === 'grace'
  return {
    memberRankState: isMember || isGrace ? 'starter' : 'none',
    rankTier: isMember || isGrace ? 'tier_1' : 'tier_0',
    rankProgressState: isMember ? 'in_progress' : 'not_started',
    streakState: isGrace ? 'at_risk' : isMember ? 'active' : 'none',
    achievementState: 'none',
    missionState: isMember || isGrace ? 'in_progress' : 'available',
    missionProgress: isMember ? 35 : isGrace ? 70 : 0,
    perkState: isMember ? 'available' : isGrace ? 'expiring' : 'locked',
    perkEligibility: isMember || isGrace,
    perkUnlockState: isMember ? 'unlocked' : isGrace ? 'eligible' : 'locked',
    benefitVisibilityState: isMember ? 'emphasized' : isGrace ? 'visible' : 'teaser',
    personalizationState: isMember || isGrace ? 'cross_site' : 'basic',
    activitySummaryState: 'low',
    nextUnlockHint: isMember || isGrace
      ? 'FC更新確認・通知設定・store回遊で次ランクを解放できます。'
      : '会員登録後にランク・ミッション・特典段階が有効になります。',
  }
}

function buildSeedData(authUserId: string, claims: NormalizedClaims, sourceSite: SiteType, membership: { membershipPlan: MembershipPlan; membershipStatus: MembershipStatus; accessLevel: AccessLevel }, nowIso: string) {
  const completedFields = [claims.displayName, claims.email, claims.avatarUrl].filter(Boolean).length

  return {
    authUserId,
    authIdentity: process.env.AUTH_PROVIDER === 'supabase' ? 'supabase' : 'logto',
    supabaseUserId: authUserId,
    logtoUserId: authUserId,
    email: claims.email,
    primaryEmail: claims.email,
    primaryPhone: claims.phone,
    username: claims.username,
    displayName: claims.displayName,
    avatarUrl: claims.avatarUrl,
    locale: claims.locale,
    sourceSite,
    timezone: null,
    membershipStatus: membership.membershipStatus,
    membershipPlan: membership.membershipPlan,
    accessLevel: membership.accessLevel,
    loyaltyState: membership.membershipPlan === 'free' ? 'new' : 'member_active',
    ...deriveMemberProgressSeed(membership.membershipStatus),
    notificationPreference: {
      emailOptIn: true,
      inAppOptIn: true,
      webPushOptIn: false,
      updatedBy: 'provisioning',
    },
    crmPreference: {
      emailOptIn: true,
      smsOptIn: false,
      lineOptIn: false,
      updatedBy: 'provisioning',
    },
    consentState: 'granted',
    notificationConsentState: 'enabled',
    crmConsentState: 'opted_in',
    analyticsConsentState: 'unknown',
    privacySummary: {
      privacyNoticeState: 'informational',
      consentSummary: {
        notificationConsentState: 'enabled',
        crmConsentState: 'opted_in',
        analyticsConsentState: 'unknown',
      },
      dataLifecycleSummary: {
        dataExportState: 'not_requested',
        deletionState: 'none',
        retentionState: 'active',
        membershipCancellationState: 'none',
        legalHoldState: 'none',
      },
      nextActions: ['update_consent', 'request_export'],
      supportEscalationRequired: false,
    },
    privacyNoticeState: 'informational',
    dataExportState: 'not_requested',
    dataExportRequestState: 'none',
    dataExportRequestedAt: null,
    dataExportReadyAt: null,
    deletionState: 'none',
    deletionRequestState: 'none',
    deletionRequestedAt: null,
    deletionConfirmedAt: null,
    anonymizationState: 'none',
    retentionState: 'active',
    retentionReason: null,
    cancellationState: 'none',
    membershipCancellationState: 'none',
    legalHoldState: 'none',
    privacyUpdatedAt: nowIso,
    profileCompletionState: completedFields >= 3 ? 'complete' : completedFields > 0 ? 'partial' : 'empty',
    onboardingState: 'not_started',
    lifecycleStage: membership.membershipStatus === 'member' ? 'active_member' : membership.membershipStatus === 'grace' ? 'grace_member' : 'authenticated_non_member',
    entitlementState: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? 'active' : 'inactive',
    subscriptionState: 'none',
    billingState: 'clear',
    joinedAt: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? nowIso : null,
    renewedAt: null,
    canceledAt: null,
    graceEndsAt: null,
    suspendedAt: membership.membershipStatus === 'suspended' ? nowIso : null,
    reactivatedAt: null,
    acquisitionSource: sourceSite,
    linkedProviders: claims.linkedProviders,
    securitySummary: {
      securityLevelState: 'basic',
      mfaState: 'available',
      reauthRequiredState: 'unknown',
      linkedIdentityState: claims.linkedProviders.length > 1 ? 'multi_provider' : claims.linkedProviders.length === 1 ? 'single_provider' : 'none',
      sessionState: 'normal',
      recentAccessState: 'available',
      recoveryState: 'self_service_ready',
      sensitiveActionState: 'idle',
      securityNoticeState: 'none',
    },
    securityUpdatedAt: nowIso,
    lastSensitiveActionAt: null,
    lastPasswordResetAt: null,
    lastEmailChangeAt: null,
    lastMfaUpdateAt: null,
    firstLoginAt: nowIso,
    lastLoginAt: nowIso,
    statusUpdatedAt: nowIso,
    accountStatus: 'active',
    mergeState: 'none',
    supportFlags: {
      duplicateCandidate: false,
      needsManualReview: false,
      blockedReason: null,
    },
    fieldSources: {
      identityFields: process.env.AUTH_PROVIDER === 'supabase' ? 'supabase-auth' : 'logto',
      businessFields: 'app',
      membership: 'subscription-record',
      notificationPreference: 'app',
      crmPreference: 'app',
    },
    lastSyncedAt: nowIso,
    lastProgressUpdateAt: nowIso,
    syncVersion: 1,
  }
}

function buildPrivacySummary(appUser: any) {
  const notificationConsentState = appUser?.notificationConsentState ?? 'enabled'
  const crmConsentState = appUser?.crmConsentState ?? 'opted_in'
  const analyticsConsentState = appUser?.analyticsConsentState ?? 'unknown'
  const consentState = appUser?.consentState ?? (notificationConsentState === 'enabled' && crmConsentState === 'opted_in' ? 'granted' : 'partial')

  const summary = {
    consentState,
    notificationConsentState,
    crmConsentState,
    analyticsConsentState,
    privacyNoticeState: appUser?.privacyNoticeState ?? 'informational',
    dataExportState: appUser?.dataExportState ?? 'not_requested',
    dataExportRequestState: appUser?.dataExportRequestState ?? 'none',
    dataExportRequestedAt: appUser?.dataExportRequestedAt ?? null,
    dataExportReadyAt: appUser?.dataExportReadyAt ?? null,
    deletionState: appUser?.deletionState ?? 'none',
    deletionRequestState: appUser?.deletionRequestState ?? 'none',
    deletionRequestedAt: appUser?.deletionRequestedAt ?? null,
    deletionConfirmedAt: appUser?.deletionConfirmedAt ?? null,
    anonymizationState: appUser?.anonymizationState ?? 'none',
    retentionState: appUser?.retentionState ?? 'active',
    retentionReason: appUser?.retentionReason ?? null,
    cancellationState: appUser?.cancellationState ?? 'none',
    membershipCancellationState: appUser?.membershipCancellationState ?? 'none',
    legalHoldState: appUser?.legalHoldState ?? 'none',
    privacyUpdatedAt: appUser?.privacyUpdatedAt ?? appUser?.updatedAt ?? null,
    userFacingNotes: {
      deletion: '退会・解約・アカウント削除は別操作です。削除前に保持対象データを確認してください。',
      retention: '注文/請求/監査に関わる最小データは法令・規約に基づき保持される場合があります。',
      export: 'データエクスポートは即時ではなく、準備完了後に受け取り期限内で取得できます。',
    },
    nextActions: [
      'notification_preferences',
      'crm_preferences',
      'analytics_consent',
      'data_export_request',
      'membership_cancellation_or_account_deletion',
    ],
  }
  return summary
}

function resolveMfaState(claims: Record<string, unknown>, appUser: any): 'disabled' | 'available' | 'enabled' | 'required' {
  if (appUser?.accountStatus === 'restricted' || appUser?.accountStatus === 'suspended') return 'required'
  if (claims.aal === 'aal2') return 'enabled'
  const amr = Array.isArray(claims.amr) ? claims.amr : []
  if (amr.some((method) => typeof method === 'string' && (method.includes('totp') || method.includes('mfa')))) return 'enabled'
  return 'available'
}

function resolveLinkedIdentityState(linkedProviders: string[]): 'none' | 'single_provider' | 'multi_provider' | 'conflict_risk' {
  const normalized = Array.from(new Set(linkedProviders.map((provider) => provider.trim().toLowerCase()).filter(Boolean)))
  if (normalized.length === 0) return 'none'
  if (normalized.length === 1) return 'single_provider'
  const hasEmail = normalized.includes('email') || normalized.includes('password')
  return hasEmail ? 'multi_provider' : 'conflict_risk'
}

function buildSecuritySummary(params: { authUser: AuthenticatedUser; appUser: any; lifecycleSummary: ReturnType<typeof buildLifecycleSummary>; nowIso: string }) {
  const { authUser, appUser, lifecycleSummary, nowIso } = params
  const linkedProviders = Array.isArray(appUser?.linkedProviders) ? appUser.linkedProviders : []
  const mfaState = resolveMfaState(authUser.claims, appUser)
  const linkedIdentityState = resolveLinkedIdentityState(linkedProviders)
  const authTime = typeof authUser.claims.auth_time === 'number'
    ? authUser.claims.auth_time
    : typeof authUser.claims.iat === 'number'
      ? authUser.claims.iat
      : null
  const tokenAgeSec = authTime ? Math.max(0, Math.floor(Date.now() / 1000) - authTime) : null
  const reauthRequiredState = tokenAgeSec === null ? 'unknown' : tokenAgeSec > SENSITIVE_REAUTH_MAX_AGE_SEC ? 'required' : 'fresh'
  const sessionState = appUser?.accountStatus === 'restricted' || appUser?.accountStatus === 'suspended'
    ? 'review_recommended'
    : reauthRequiredState === 'required'
      ? 'revoke_recommended'
      : 'normal'
  const securityLevelState = mfaState === 'enabled'
    ? 'strong'
    : linkedIdentityState === 'multi_provider'
      ? 'enhanced'
      : lifecycleSummary.accessLevel === 'admin'
        ? 'restricted'
        : 'basic'

  return {
    securityHub: 'supabase',
    securityLevelState,
    mfaState,
    reauthRequiredState,
    linkedIdentityState,
    sessionState,
    recentAccessState: appUser?.lastLoginAt ? 'available' : 'limited',
    recoveryState: appUser?.primaryEmail ? 'self_service_ready' : 'support_required',
    sensitiveActionState: 'idle',
    securityNoticeState: sessionState === 'normal' ? 'none' : 'review_recommended',
    passwordChangeCapability: appUser?.primaryEmail ? 'self_service' : 'support_required',
    emailChangeCapability: reauthRequiredState === 'required' ? 'reauth_required' : 'self_service',
    providerLinkCapability: linkedIdentityState === 'conflict_risk' ? 'support_review_recommended' : 'self_service',
    sessionRevokeCapability: reauthRequiredState === 'required' ? 'reauth_required' : 'self_service',
    securityUpdatedAt: appUser?.securityUpdatedAt ?? nowIso,
    lastSensitiveActionAt: appUser?.lastSensitiveActionAt ?? null,
    lastPasswordResetAt: appUser?.lastPasswordResetAt ?? null,
    lastEmailChangeAt: appUser?.lastEmailChangeAt ?? null,
    lastMfaUpdateAt: appUser?.lastMfaUpdateAt ?? null,
    linkedProviders,
    recentAccess: {
      lastLoginAt: appUser?.lastLoginAt ?? null,
      sourceSite: appUser?.sourceSite ?? 'cross',
      sessionId: authUser.sessionId ?? null,
    },
  }
}

function resolveSecuritySeverity(eventType: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
  if (eventType === 'suspicious_review_flagged') return 'high'
  if (eventType === 'all_sessions_revoked' || eventType === 'email_change_completed' || eventType === 'mfa_disabled') return 'medium'
  return 'low'
}

async function createSecurityEvent(strapi: any, payload: {
  eventType: SecurityEventType
  targetUserId: string
  actorId?: string
  actorType?: 'user' | 'support' | 'internal_admin' | 'system'
  sourceSite?: SiteType
  result?: 'success' | 'failed' | 'denied' | 'review_recommended'
  metadata?: Record<string, unknown>
  dedupeKey?: string
}) {
  const nowIso = new Date().toISOString()
  if (payload.dedupeKey) {
    const existing = await strapi.documents('api::security-event.security-event').findFirst({
      filters: { dedupeKey: { $eq: payload.dedupeKey } },
    })
    if (existing) return existing
  }

  return strapi.documents('api::security-event.security-event').create({
    data: {
      dedupeKey: payload.dedupeKey ?? null,
      securityEventType: payload.eventType,
      securityEventSeverity: resolveSecuritySeverity(payload.eventType),
      securityEventSource: payload.sourceSite ?? 'cross',
      securityActorType: payload.actorType ?? 'user',
      securityActorId: payload.actorId ?? payload.targetUserId,
      securityTargetUserId: payload.targetUserId,
      result: payload.result ?? 'success',
      eventOccurredAt: nowIso,
      eventRecordedAt: nowIso,
      securityEventMetadata: payload.metadata ?? {},
    },
  })
}

async function createSecurityNoticeFromEvent(strapi: any, payload: {
  targetUserId: string
  sourceSite?: SiteType
  eventType: SecurityEventType
  eventId?: string
}) {
  const nowIso = new Date().toISOString()
  const config: Record<SecurityEventType, { type: string; state: string; title: string; message: string; suspiciousReviewState?: string; recoveryRecommendationState?: string }> = {
    login_success: { type: 'security_info', state: 'info', title: 'ログインを確認しました', message: 'アカウントへのログインがありました。覚えがない場合はセッションを確認してください。' },
    login_failed: { type: 'suspicious_review', state: 'review_recommended', title: 'ログイン失敗が続いています', message: '第三者アクセスの可能性があります。パスワード変更またはセッション確認を推奨します。', suspiciousReviewState: 'flagged' },
    logout: { type: 'security_info', state: 'none', title: 'ログアウトしました', message: 'ログアウトを実行しました。' },
    password_reset_requested: { type: 'important_change', state: 'info', title: 'パスワード再設定が要求されました', message: 'パスワード再設定メールを送信しました。' },
    password_reset_completed: { type: 'important_change', state: 'review_recommended', title: 'パスワードを変更しました', message: '心当たりがない場合はサポートに連絡してください。' },
    email_change_requested: { type: 'important_change', state: 'info', title: 'メールアドレス変更を受け付けました', message: '変更確認メールを送信しました。' },
    email_change_completed: { type: 'important_change', state: 'action_required', title: 'メールアドレスが変更されました', message: '心当たりがない場合は直ちに復旧フローを開始してください。', recoveryRecommendationState: 'recommended' },
    mfa_enabled: { type: 'security_info', state: 'resolved', title: '2段階認証を有効化しました', message: 'セキュリティ強度が向上しました。' },
    mfa_disabled: { type: 'suspicious_review', state: 'review_recommended', title: '2段階認証が無効化されました', message: '心当たりがない場合は再有効化とパスワード変更を推奨します。', suspiciousReviewState: 'flagged' },
    linked_provider_added: { type: 'important_change', state: 'info', title: '連携ログインを追加しました', message: '新しいログインプロバイダーが連携されました。' },
    linked_provider_removed: { type: 'important_change', state: 'review_recommended', title: '連携ログインを解除しました', message: '心当たりがない場合はアカウント復旧を推奨します。', recoveryRecommendationState: 'recommended' },
    session_revoked: { type: 'session_review', state: 'resolved', title: '他セッションをログアウトしました', message: '別端末のセッションを無効化しました。' },
    all_sessions_revoked: { type: 'session_review', state: 'resolved', title: 'すべてのセッションを無効化しました', message: '全端末の再ログインが必要です。' },
    reauth_performed: { type: 'security_info', state: 'none', title: '再認証を確認しました', message: '機密操作に必要な再認証が完了しました。' },
    suspicious_review_flagged: { type: 'suspicious_review', state: 'action_required', title: '不審アクセスのレビューを推奨します', message: '安全確認のためセキュリティ確認を行ってください。', suspiciousReviewState: 'flagged', recoveryRecommendationState: 'recommended' },
  }

  const selected = config[payload.eventType]
  if (selected.state === 'none') return null
  return strapi.documents('api::security-notice.security-notice').create({
    data: {
      securityTargetUserId: payload.targetUserId,
      securityNoticeType: selected.type,
      securityNoticeState: selected.state,
      title: selected.title,
      message: selected.message,
      eventRef: payload.eventId ?? null,
      suspiciousReviewState: selected.suspiciousReviewState ?? 'none',
      recoveryRecommendationState: selected.recoveryRecommendationState ?? 'none',
      sourceSite: payload.sourceSite ?? 'cross',
      publishedAtISO: nowIso,
      noticeMetadata: {},
    },
  })
}

function assertOpsToken(ctx: any): boolean {
  if (!OPS_TOKEN) return false
  return String(ctx.request.headers['x-ops-token'] ?? '') === OPS_TOKEN
}

async function requireAuthUser(ctx: any): Promise<AuthenticatedUser> {
  return verifyAccessToken(ctx.request.headers.authorization)
}

async function findLatestSubscription(strapi: any, authUserId: string) {
  return strapi.documents('api::subscription-record.subscription-record').findFirst({
    filters: { authUserId: { $eq: authUserId } },
    sort: ['createdAt:desc'],
  })
}

async function findLatestEntitlement(strapi: any, authUserId: string) {
  return strapi.documents('api::entitlement-record.entitlement-record').findFirst({
    filters: { authUserId: { $eq: authUserId } },
    sort: ['createdAt:desc'],
  })
}

async function ensureNotificationPreference(strapi: any, authUserId: string, sourceSite: SiteType, locale: string, nowIso: string): Promise<void> {
  const existing = await strapi.documents('api::notification-preference.notification-preference').findFirst({
    filters: { userId: { $eq: authUserId } },
  })

  if (existing) {
    await strapi.documents('api::notification-preference.notification-preference').update({
      documentId: existing.documentId,
      data: { lastSyncedAt: nowIso, sourceSite, locale },
    })
    return
  }

  await strapi.documents('api::notification-preference.notification-preference').create({
    data: {
      userId: authUserId,
      sourceSite,
      locale,
      emailOptIn: true,
      inAppOptIn: true,
      themeConfig: { source: 'user-sync-provisioning' },
      consentVersion: 'v1',
      lastSyncedAt: nowIso,
    },
  })
}

async function createInternalAuditLog(strapi: any, payload: {
  actorLogtoUserId: string
  actorInternalRoles: InternalRole[]
  targetType: string
  targetId: string
  action: string
  status: 'success' | 'denied' | 'failed'
  reason?: string
  sourceSite?: string
  beforeState?: unknown
  afterState?: unknown
  metadata?: Record<string, unknown>
  requestId?: string | null
}) {
  await strapi.documents('api::internal-audit-log.internal-audit-log').create({
    data: {
      actorLogtoUserId: payload.actorLogtoUserId,
      actorInternalRoles: payload.actorInternalRoles,
      targetType: payload.targetType,
      targetId: payload.targetId,
      action: payload.action,
      status: payload.status,
      reason: payload.reason ?? null,
      sourceSite: normalizeSite(payload.sourceSite),
      beforeState: payload.beforeState ?? null,
      afterState: payload.afterState ?? null,
      metadata: payload.metadata ?? {},
      requestId: payload.requestId ?? null,
    },
  })
}

async function buildUserSummary(strapi: any, logtoUserId: string) {
  const appUser = await strapi.documents('api::app-user.app-user').findFirst({
    filters: {
      $or: [
        { authUserId: { $eq: logtoUserId } },
        { supabaseUserId: { $eq: logtoUserId } },
        { logtoUserId: { $eq: logtoUserId } },
      ],
    },
  })
  if (!appUser) return null

  const [notificationPreference, inquirySubmissions, moderationLogs, favorites, viewHistories, reports, latestSubscription, latestEntitlement] = await Promise.all([
    strapi.documents('api::notification-preference.notification-preference').findFirst({ filters: { userId: { $eq: logtoUserId } } }),
    strapi.documents('api::inquiry-submission.inquiry-submission').findMany({ filters: { email: { $eqi: appUser.primaryEmail ?? '' } }, limit: 10, sort: ['submittedAt:desc'] }),
    strapi.documents('api::moderation-log.moderation-log').findMany({ filters: { performedBy: { $eq: logtoUserId } }, limit: 10, sort: ['createdAt:desc'] }),
    strapi.documents('api::favorite.favorite').findMany({ filters: { userId: { $eq: logtoUserId } }, limit: 10, sort: ['updatedAt:desc'] }),
    strapi.documents('api::view-history.view-history').findMany({ filters: { userId: { $eq: logtoUserId } }, limit: 10, sort: ['viewedAt:desc'] }),
    strapi.documents('api::community-report.community-report').findMany({ filters: { reporterUserId: { $eq: logtoUserId } }, limit: 10, sort: ['createdAt:desc'] }),
    findLatestSubscription(strapi, logtoUserId),
    findLatestEntitlement(strapi, logtoUserId),
  ])

  const lifecycleSummary = buildLifecycleSummary(appUser, latestSubscription, latestEntitlement)

  const securitySummary = buildSecuritySummary({
    authUser: { userId: logtoUserId, email: appUser.primaryEmail, claims: {}, scopes: [], sessionId: null },
    appUser,
    lifecycleSummary,
    nowIso: new Date().toISOString(),
  })

  return {
    appUser,
    userSummary: {
      membershipStatus: appUser.membershipStatus,
      membershipPlan: appUser.membershipPlan,
      accessLevel: appUser.accessLevel,
      loyaltyState: appUser.loyaltyState,
      memberRankState: appUser.memberRankState ?? 'none',
      rankTier: appUser.rankTier ?? 'tier_0',
      rankProgressState: appUser.rankProgressState ?? 'not_started',
      streakState: appUser.streakState ?? 'none',
      missionState: appUser.missionState ?? 'available',
      missionProgress: appUser.missionProgress ?? 0,
      achievementState: appUser.achievementState ?? 'none',
      perkState: appUser.perkState ?? 'none',
      perkUnlockState: appUser.perkUnlockState ?? 'locked',
      nextUnlockHint: appUser.nextUnlockHint ?? null,
      accountStatus: appUser.accountStatus,
      linkedProviders: appUser.linkedProviders,
      security: securitySummary,
      firstLoginAt: appUser.firstLoginAt,
      lastLoginAt: appUser.lastLoginAt,
      sourceSite: appUser.sourceSite,
      lifecycleStage: lifecycleSummary.lifecycleStage,
      onboardingStatus: lifecycleSummary.onboardingStatus,
      profileCompletionStatus: lifecycleSummary.profileCompletionStatus,
      notificationPreference: notificationPreference
        ? {
          emailOptIn: notificationPreference.emailOptIn,
          inAppOptIn: notificationPreference.inAppOptIn,
          locale: notificationPreference.locale,
          sourceSite: notificationPreference.sourceSite,
          lastSyncedAt: notificationPreference.lastSyncedAt,
        }
        : null,
      supportCaseLink: {
        inquiryCount: inquirySubmissions.length,
        latestInquiryStatus: inquirySubmissions[0]?.status ?? null,
      },
      privacySummary: buildPrivacySummary(appUser),
      moderationState: {
        moderationActionCount: moderationLogs.length,
        reportCount: reports.length,
      },
      activityState: {
        favoriteCount: favorites.length,
        recentHistoryCount: viewHistories.length,
      },
      billing: latestSubscription
        ? {
          billingProvider: latestSubscription.provider,
          subscriptionId: latestSubscription.subscriptionId,
          subscriptionStatus: latestSubscription.subscriptionStatus,
          billingStatus: latestSubscription.billingStatus ?? 'not_started',
          currentPeriodEnd: latestSubscription.currentPeriodEnd ?? latestSubscription.endAt ?? null,
          cancelAtPeriodEnd: Boolean(latestSubscription.cancelAtPeriodEnd),
          canceledAt: latestSubscription.canceledAt ?? null,
          syncState: latestSubscription.syncState ?? 'unknown',
          syncVersion: latestSubscription.syncVersion ?? null,
          sourceOfTruth: latestSubscription.sourceOfTruth ?? 'unknown',
        }
        : null,
      entitlement: latestEntitlement
        ? {
          entitlementState: latestEntitlement.entitlementState,
          entitlementSet: latestEntitlement.entitlementSet ?? {},
          accessLevel: latestEntitlement.accessLevel,
          membershipStatus: latestEntitlement.membershipStatus,
          earlyAccessEligibility: Boolean(latestEntitlement.earlyAccessEligibility),
          campaignEligibility: latestEntitlement.campaignEligibility ?? {},
        }
        : null,
    },
    related: {
      inquiries: inquirySubmissions,
      moderationLogs,
      favorites,
      viewHistories,
      communityReports: reports,
    },
  }
}

export default ({ strapi }) => ({
  async provision(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const sourceSite = normalizeSite(ctx.request.body?.sourceSite)
      const claims = normalizeClaims(authUser, ctx.request.body?.locale)
      const nowIso = new Date().toISOString()

      const latestSubscription = await findLatestSubscription(strapi, authUser.userId)
      const membership = toMembershipSummary(latestSubscription)

      const existing = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })

      if (!existing) {
        const created = await strapi.documents('api::app-user.app-user').create({
          data: buildSeedData(authUser.userId, claims, sourceSite, membership, nowIso),
        })
        const event = await createSecurityEvent(strapi, {
          eventType: 'login_success',
          targetUserId: authUser.userId,
          actorId: authUser.userId,
          sourceSite,
          dedupeKey: `login_success:${authUser.userId}:${nowIso.slice(0, 16)}`,
          metadata: { reason: 'first_login_provision' },
        })
        await createSecurityNoticeFromEvent(strapi, {
          targetUserId: authUser.userId,
          sourceSite,
          eventType: 'login_success',
          eventId: event?.eventId,
        })

        await ensureNotificationPreference(strapi, authUser.userId, sourceSite, claims.locale, nowIso)

        ctx.body = {
          provisioned: true,
          reason: 'first_login',
          appUser: created,
        }
        return
      }

      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: existing.documentId,
        data: {
          primaryEmail: claims.email,
          primaryPhone: claims.phone,
          username: claims.username,
          displayName: claims.displayName,
          avatarUrl: claims.avatarUrl,
          locale: claims.locale,
          sourceSite,
          linkedProviders: claims.linkedProviders,
          securitySummary: {
            ...(existing.securitySummary ?? {}),
            linkedIdentityState: resolveLinkedIdentityState(claims.linkedProviders),
            mfaState: resolveMfaState(authUser.claims, existing),
            reauthRequiredState: 'unknown',
            securityUpdatedAt: nowIso,
          },
          securityUpdatedAt: nowIso,
          lastLoginAt: nowIso,
          membershipPlan: membership.membershipPlan,
          membershipStatus: membership.membershipStatus,
          accessLevel: claims.role === 'admin' ? 'admin' : membership.accessLevel,
          lifecycleStage: resolveLifecycleStage({
            accountStatus: existing.accountStatus,
            membershipStatus: membership.membershipStatus,
            onboardingStatus: normalizeOnboardingStatus(existing.onboardingState),
            renewalState: membership.membershipStatus === 'member' ? 'completed' : membership.membershipStatus === 'grace' ? 'grace' : 'not_applicable',
          }),
          entitlementState: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? 'active' : 'inactive',
          subscriptionState: latestSubscription?.subscriptionStatus ?? existing.subscriptionState ?? 'none',
          billingState: latestSubscription?.billingStatus ?? existing.billingState ?? 'clear',
          statusUpdatedAt: nowIso,
          suspendedAt: membership.membershipStatus === 'suspended' ? nowIso : existing.suspendedAt ?? null,
          renewedAt: membership.membershipStatus === 'member' ? nowIso : existing.renewedAt ?? null,
          ...deriveMemberProgressSeed(membership.membershipStatus),
          lastProgressUpdateAt: nowIso,
          lastSyncedAt: nowIso,
        },
      })

      await ensureNotificationPreference(strapi, authUser.userId, sourceSite, claims.locale, nowIso)
      await createSecurityEvent(strapi, {
        eventType: 'login_success',
        targetUserId: authUser.userId,
        actorId: authUser.userId,
        sourceSite,
        dedupeKey: `login_success:${authUser.userId}:${nowIso.slice(0, 16)}`,
        metadata: { reason: 're_login_sync' },
      })

      ctx.body = {
        provisioned: false,
        reason: 're_login_sync',
        appUser: updated,
      }
    } catch (error) {
      const message = (error as Error).message
      strapi.log.error(`[user-sync] provision failed: ${message}`)
      if (message.includes('Authorization') || message.includes('JWT')) {
        return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      }
      ctx.internalServerError('user provisioning に失敗しました。')
    }
  },

  async me(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')

      const [latestSubscription, latestEntitlement] = await Promise.all([
        findLatestSubscription(strapi, authUser.userId),
        findLatestEntitlement(strapi, authUser.userId),
      ])
      const notificationPreference = await strapi.documents('api::notification-preference.notification-preference').findFirst({
        filters: { userId: { $eq: authUser.userId } },
      })

      const membership = latestEntitlement
        ? {
          membershipPlan: appUser.membershipPlan,
          membershipStatus: latestEntitlement.membershipStatus,
          accessLevel: latestEntitlement.accessLevel,
        }
        : toMembershipSummary(latestSubscription)

      const lifecycleSummary = buildLifecycleSummary(appUser, latestSubscription, latestEntitlement)
      const securitySummary = buildSecuritySummary({
        authUser,
        appUser,
        lifecycleSummary,
        nowIso: new Date().toISOString(),
      })
      const privacySummary = buildPrivacySummary(appUser)

      ctx.body = {
        appUser,
        auth: {
          authUserId: authUser.userId,
          supabaseUserId: authUser.userId,
          email: authUser.email,
          scopes: authUser.scopes,
        },
        membership,
        billingSummary: latestSubscription
          ? {
            subscriptionStatus: latestSubscription.subscriptionStatus,
            billingStatus: latestSubscription.billingStatus ?? 'not_started',
            currentPeriodStart: latestSubscription.currentPeriodStart ?? latestSubscription.startAt ?? null,
            currentPeriodEnd: latestSubscription.currentPeriodEnd ?? latestSubscription.endAt ?? null,
            cancelAtPeriodEnd: Boolean(latestSubscription.cancelAtPeriodEnd),
            canceledAt: latestSubscription.canceledAt ?? null,
            renewalDate: latestSubscription.renewalDate ?? latestSubscription.currentPeriodEnd ?? latestSubscription.endAt ?? null,
            syncState: latestSubscription.syncState ?? 'unknown',
            syncVersion: latestSubscription.syncVersion ?? null,
            sourceOfTruth: latestSubscription.sourceOfTruth ?? 'unknown',
            lastBillingEventAt: latestSubscription.lastBillingEventAt ?? null,
          }
          : null,
        entitlementSummary: latestEntitlement
          ? {
            entitlementState: latestEntitlement.entitlementState,
            entitlementSet: latestEntitlement.entitlementSet ?? {},
            earlyAccessEligibility: Boolean(latestEntitlement.earlyAccessEligibility),
            campaignEligibility: latestEntitlement.campaignEligibility ?? {},
            sourceOfTruth: latestEntitlement.sourceOfTruth ?? 'unknown',
            syncState: latestEntitlement.syncState ?? 'unknown',
          }
          : null,
        notificationPreference,
        privacySummary,
        lifecycleSummary,
        securityHub: securitySummary.securityHub,
        securitySummary,
        progressionSummary: {
          loyaltyState: appUser.loyaltyState,
          memberRankState: appUser.memberRankState ?? 'none',
          rankTier: appUser.rankTier ?? 'tier_0',
          rankProgressState: appUser.rankProgressState ?? 'not_started',
          streakState: appUser.streakState ?? 'none',
          missionState: appUser.missionState ?? 'available',
          missionProgress: appUser.missionProgress ?? 0,
          achievementState: appUser.achievementState ?? 'none',
          perkState: appUser.perkState ?? 'none',
          perkUnlockState: appUser.perkUnlockState ?? 'locked',
          benefitVisibilityState: appUser.benefitVisibilityState ?? 'teaser',
          personalizationState: appUser.personalizationState ?? 'basic',
          activitySummaryState: appUser.activitySummaryState ?? 'low',
          nextUnlockHint: appUser.nextUnlockHint ?? null,
          lastProgressUpdateAt: appUser.lastProgressUpdateAt ?? null,
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) {
        return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      }
      ctx.internalServerError('user summary の取得に失敗しました。')
    }
  },

  async privacySummary(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')
      ctx.body = { privacySummary: buildPrivacySummary(appUser) }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      return ctx.internalServerError('privacy summary の取得に失敗しました。')
    }
  },

  async updatePrivacyPreferences(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')
      const nowIso = new Date().toISOString()
      const updates = {
        notificationConsentState: String(ctx.request.body?.notificationConsentState ?? appUser.notificationConsentState ?? 'enabled'),
        crmConsentState: String(ctx.request.body?.crmConsentState ?? appUser.crmConsentState ?? 'opted_in'),
        analyticsConsentState: String(ctx.request.body?.analyticsConsentState ?? appUser.analyticsConsentState ?? 'unknown'),
      }
      const consentState = updates.notificationConsentState === 'disabled' && updates.crmConsentState === 'opted_out'
        ? 'revoked'
        : updates.notificationConsentState === 'enabled' && updates.crmConsentState === 'opted_in'
          ? 'granted'
          : 'partial'

      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: appUser.documentId,
        data: {
          ...updates,
          consentState,
          privacyUpdatedAt: nowIso,
          privacySummary: {
            ...(appUser.privacySummary ?? {}),
            updatedBy: 'self_service',
            lastConsentUpdatedAt: nowIso,
          },
        },
      })
      ctx.body = { ok: true, privacySummary: buildPrivacySummary(updated) }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      return ctx.internalServerError('privacy preference の更新に失敗しました。')
    }
  },

  async requestDataExport(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')
      const nowIso = new Date().toISOString()
      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: appUser.documentId,
        data: {
          dataExportState: 'requested',
          dataExportRequestState: 'requested',
          dataExportRequestedAt: nowIso,
          privacyUpdatedAt: nowIso,
        },
      })
      ctx.body = { ok: true, dataExportState: updated.dataExportState, dataExportRequestedAt: updated.dataExportRequestedAt, privacySummary: buildPrivacySummary(updated) }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      return ctx.internalServerError('data export request の登録に失敗しました。')
    }
  },

  async requestDeletion(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')
      const nowIso = new Date().toISOString()
      const confirmPhrase = String(ctx.request.body?.confirmPhrase ?? '').trim()
      if (confirmPhrase !== 'DELETE_MY_ACCOUNT') return ctx.badRequest('確認フレーズが一致しません。')
      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: appUser.documentId,
        data: {
          deletionState: 'cooling_off',
          deletionRequestState: 'confirmed',
          deletionRequestedAt: appUser.deletionRequestedAt ?? nowIso,
          deletionConfirmedAt: nowIso,
          retentionState: appUser.legalHoldState === 'active' ? 'retained_minimum' : 'deletion_pending',
          cancellationState: appUser.cancellationState === 'completed' ? 'completed' : 'requested',
          privacyUpdatedAt: nowIso,
        },
      })
      ctx.body = { ok: true, deletionState: updated.deletionState, deletionConfirmedAt: updated.deletionConfirmedAt, privacySummary: buildPrivacySummary(updated) }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      return ctx.internalServerError('deletion request の登録に失敗しました。')
    }
  },

  async requestMembershipCancellation(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')
      const nowIso = new Date().toISOString()
      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: appUser.documentId,
        data: {
          membershipCancellationState: 'requested',
          cancellationState: 'requested',
          privacyUpdatedAt: nowIso,
        },
      })
      ctx.body = { ok: true, membershipCancellationState: updated.membershipCancellationState, privacySummary: buildPrivacySummary(updated) }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      return ctx.internalServerError('membership cancellation request の登録に失敗しました。')
    }
  },

  async securityOverview(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const [events, notices] = await Promise.all([
        strapi.documents('api::security-event.security-event').findMany({
          filters: { securityTargetUserId: { $eq: authUser.userId } },
          sort: ['eventOccurredAt:desc'],
          limit: 20,
        }),
        strapi.documents('api::security-notice.security-notice').findMany({
          filters: { securityTargetUserId: { $eq: authUser.userId } },
          sort: ['publishedAtISO:desc'],
          limit: 20,
        }),
      ])
      const openReview = notices.filter((notice: any) => notice.securityNoticeState === 'review_recommended' || notice.securityNoticeState === 'action_required').length
      const suspiciousCount = notices.filter((notice: any) => notice.suspiciousReviewState === 'flagged' || notice.suspiciousReviewState === 'under_review').length
      ctx.body = {
        securitySummary: {
          securityTimelineState: events.length > 0 ? 'available' : 'empty',
          securityNoticeState: openReview > 0 ? 'review_recommended' : 'none',
          suspiciousReviewState: suspiciousCount > 0 ? 'flagged' : 'none',
          recentAccessState: events.some((event: any) => event.securityEventType === 'login_success') ? 'available' : 'limited',
          recoveryState: notices.some((notice: any) => notice.recoveryRecommendationState === 'recommended') ? 'support_recommended' : 'none',
        },
        recentEvents: events,
        notices,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) {
        return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      }
      return ctx.internalServerError('security overview の取得に失敗しました。')
    }
  },

  async verifySensitiveAction(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const actionType = String(ctx.request.body?.actionType ?? '').trim() as SensitiveActionType
      if (!SUPPORTED_SENSITIVE_ACTIONS.includes(actionType)) {
        return ctx.badRequest(`actionType が不正です。(${SUPPORTED_SENSITIVE_ACTIONS.join(', ')})`)
      }

      const appUser = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { supabaseUserId: { $eq: authUser.userId } },
            { logtoUserId: { $eq: authUser.userId } },
          ],
        },
      })
      if (!appUser) return ctx.notFound('app user が未プロビジョニングです。')

      const authTime = typeof authUser.claims.auth_time === 'number'
        ? authUser.claims.auth_time
        : typeof authUser.claims.iat === 'number'
          ? authUser.claims.iat
          : null
      const tokenAgeSec = authTime ? Math.max(0, Math.floor(Date.now() / 1000) - authTime) : Number.MAX_SAFE_INTEGER
      if (tokenAgeSec > SENSITIVE_REAUTH_MAX_AGE_SEC) {
        return ctx.preconditionFailed('再認証が必要です。')
      }

      const nowIso = new Date().toISOString()
      await strapi.documents('api::app-user.app-user').update({
        documentId: appUser.documentId,
        data: {
          lastSensitiveActionAt: nowIso,
          securityUpdatedAt: nowIso,
          securitySummary: {
            ...(appUser.securitySummary ?? {}),
            sensitiveActionState: 'verified',
            reauthRequiredState: 'fresh',
            securityUpdatedAt: nowIso,
          },
        },
      })
      const event = await createSecurityEvent(strapi, {
        eventType: 'reauth_performed',
        targetUserId: authUser.userId,
        actorId: authUser.userId,
        sourceSite: normalizeSite(ctx.request.body?.sourceSite),
        metadata: { actionType, tokenAgeSec },
      })
      await createSecurityNoticeFromEvent(strapi, {
        targetUserId: authUser.userId,
        sourceSite: normalizeSite(ctx.request.body?.sourceSite),
        eventType: 'reauth_performed',
        eventId: event?.eventId,
      })

      ctx.body = {
        ok: true,
        actionType,
        sensitiveActionState: 'verified',
        tokenAgeSec,
        verifiedAt: nowIso,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) {
        return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      }
      return ctx.internalServerError('sensitive action の検証に失敗しました。')
    }
  },

  async appendSecurityEvent(ctx) {
    try {
      const authUser = await requireAuthUser(ctx)
      const sourceSite = normalizeSite(ctx.request.body?.sourceSite)
      const eventType = String(ctx.request.body?.eventType ?? '').trim() as SecurityEventType
      const allowedEventTypes: SecurityEventType[] = [
        'logout',
        'password_reset_requested',
        'password_reset_completed',
        'email_change_requested',
        'email_change_completed',
        'mfa_enabled',
        'mfa_disabled',
        'linked_provider_added',
        'linked_provider_removed',
        'session_revoked',
        'all_sessions_revoked',
        'suspicious_review_flagged',
      ]
      if (!allowedEventTypes.includes(eventType)) return ctx.badRequest('eventType が不正です。')
      const dedupeKey = String(ctx.request.body?.dedupeKey ?? '').trim() || undefined
      const event = await createSecurityEvent(strapi, {
        eventType,
        targetUserId: authUser.userId,
        actorId: authUser.userId,
        sourceSite,
        dedupeKey,
        metadata: typeof ctx.request.body?.metadata === 'object' ? ctx.request.body.metadata : {},
      })
      const notice = await createSecurityNoticeFromEvent(strapi, {
        targetUserId: authUser.userId,
        sourceSite,
        eventType,
        eventId: event?.eventId,
      })
      ctx.body = { ok: true, event, notice }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Authorization') || message.includes('JWT')) {
        return ctx.unauthorized('ログイン状態を確認して再試行してください。')
      }
      return ctx.internalServerError('security event の記録に失敗しました。')
    }
  },

  async supportLookup(ctx) {
    if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です。')

    const { email, authUserId, logtoUserId, appUserId } = ctx.query ?? {}
    if (!email && !authUserId && !logtoUserId && !appUserId) {
      return ctx.badRequest('email, authUserId, logtoUserId, appUserId のいずれかが必要です。')
    }

    const filters: Record<string, unknown>[] = []
    if (typeof email === 'string' && email) filters.push({ primaryEmail: { $eqi: email } })
    if (typeof authUserId === 'string' && authUserId) filters.push({ authUserId: { $eq: authUserId } })
    if (typeof logtoUserId === 'string' && logtoUserId) filters.push({ logtoUserId: { $eq: logtoUserId } })
    if (typeof appUserId === 'string' && appUserId) filters.push({ appUserId: { $eq: appUserId } })

    const users = await strapi.documents('api::app-user.app-user').findMany({
      filters: { $or: filters },
      limit: 20,
      sort: ['updatedAt:desc'],
    })

    ctx.body = {
      count: users.length,
      users,
    }
  },

  async internalLookup(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.user.read')
      const { email, authUserId, logtoUserId, appUserId } = ctx.query ?? {}
      if (!email && !authUserId && !logtoUserId && !appUserId) {
        return ctx.badRequest('email, authUserId, logtoUserId, appUserId のいずれかが必要です。')
      }

      const filters: Record<string, unknown>[] = []
      if (typeof email === 'string' && email) filters.push({ primaryEmail: { $eqi: email } })
      if (typeof authUserId === 'string' && authUserId) filters.push({ authUserId: { $eq: authUserId } })
      if (typeof logtoUserId === 'string' && logtoUserId) filters.push({ logtoUserId: { $eq: logtoUserId } })
      if (typeof appUserId === 'string' && appUserId) filters.push({ appUserId: { $eq: appUserId } })

      const users = await strapi.documents('api::app-user.app-user').findMany({
        filters: { $or: filters },
        limit: 20,
        sort: ['updatedAt:desc'],
      })

      ctx.body = {
        count: users.length,
        internalRoles: access.internalRoles,
        users: users.map((user: any) => ({
          appUserId: user.appUserId,
          authUserId: user.authUserId ?? user.supabaseUserId ?? user.logtoUserId,
          logtoUserId: user.logtoUserId,
          supabaseUserId: user.supabaseUserId,
          primaryEmail: user.primaryEmail,
          username: user.username,
          membershipStatus: user.membershipStatus,
          membershipPlan: user.membershipPlan,
          accessLevel: user.accessLevel,
          accountStatus: user.accountStatus,
          sourceSite: user.sourceSite,
          lifecycleStage: resolveLifecycleStage({
            accountStatus: user.accountStatus,
            membershipStatus: user.membershipStatus,
            onboardingStatus: normalizeOnboardingStatus(user.onboardingState),
          }),
          onboardingStatus: normalizeOnboardingStatus(user.onboardingState),
          profileCompletionStatus: normalizeProfileCompletionStatus(user.profileCompletionState),
          memberRankState: user.memberRankState ?? 'none',
          missionState: user.missionState ?? 'available',
          perkState: user.perkState ?? 'none',
          achievementState: user.achievementState ?? 'none',
          lastLoginAt: user.lastLoginAt,
          lastSyncedAt: user.lastSyncedAt,
        })),
      }
    } catch (error) {
      if ((error as Error).message.includes('Internal permission denied')) {
        return ctx.forbidden('internal 権限が不足しています。')
      }
      return ctx.unauthorized('認証に失敗しました。')
    }
  },

  async internalSummary(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const authUserId = String(ctx.params.authUserId ?? ctx.params.logtoUserId ?? '').trim()
      if (!authUserId) return ctx.badRequest('authUserId が必要です。')

      const summary = await buildUserSummary(strapi, authUserId)
      if (!summary) return ctx.notFound('対象ユーザーが見つかりません。')

      ctx.body = summary
    } catch (error) {
      if ((error as Error).message.includes('Internal permission denied')) {
        return ctx.forbidden('internal 権限が不足しています。')
      }
      return ctx.unauthorized('認証に失敗しました。')
    }
  },

  async internalSecurityOps(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.user.read')
      const authUserId = String(ctx.params.authUserId ?? '').trim()
      if (!authUserId) return ctx.badRequest('authUserId が必要です。')
      const [events, notices, investigations] = await Promise.all([
        strapi.documents('api::security-event.security-event').findMany({
          filters: { securityTargetUserId: { $eq: authUserId } },
          sort: ['eventOccurredAt:desc'],
          limit: 100,
        }),
        strapi.documents('api::security-notice.security-notice').findMany({
          filters: { securityTargetUserId: { $eq: authUserId } },
          sort: ['publishedAtISO:desc'],
          limit: 100,
        }),
        strapi.documents('api::security-investigation.security-investigation').findMany({
          filters: { securityTargetUserId: { $eq: authUserId } },
          sort: ['updatedAt:desc'],
          limit: 100,
        }),
      ])
      ctx.body = { internalRoles: access.internalRoles, events, notices, investigations }
    } catch (error) {
      if ((error as Error).message.includes('Internal permission denied')) {
        return ctx.forbidden('internal 権限が不足しています。')
      }
      return ctx.unauthorized('認証に失敗しました。')
    }
  },

  async updateAccountStatus(ctx) {
    const requestId = String(ctx.request.headers['x-request-id'] ?? '') || null
    try {
      const access = await requireInternalPermission(ctx, 'internal.account.status.update')
      const authUserId = String(ctx.params.authUserId ?? ctx.params.logtoUserId ?? '').trim()
      const reason = String(ctx.request.body?.reason ?? '').trim()
      const nextStatus = String(ctx.request.body?.nextStatus ?? '').trim()

      if (!authUserId || !reason || !nextStatus) {
        return ctx.badRequest('authUserId, reason, nextStatus が必要です。')
      }

      const user = await strapi.documents('api::app-user.app-user').findFirst({
        filters: {
          $or: [{ authUserId: { $eq: authUserId } }, { supabaseUserId: { $eq: authUserId } }, { logtoUserId: { $eq: authUserId } }],
        },
      })
      if (!user) return ctx.notFound('対象ユーザーが見つかりません。')

      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: user.documentId,
        data: { accountStatus: nextStatus },
      })

      await createInternalAuditLog(strapi, {
        actorLogtoUserId: access.authUser.userId,
        actorInternalRoles: access.internalRoles,
        targetType: 'app-user',
        targetId: authUserId,
        action: 'account_status_update',
        status: 'success',
        reason,
        sourceSite: updated.sourceSite,
        beforeState: { accountStatus: user.accountStatus },
        afterState: { accountStatus: updated.accountStatus },
        metadata: { dangerousOperation: true },
        requestId,
      })

      ctx.body = {
        ok: true,
        dangerousOperation: true,
        user: {
          authUserId,
          accountStatus: updated.accountStatus,
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) {
        return ctx.forbidden('internal 権限が不足しています。')
      }
      return ctx.unauthorized('認証に失敗しました。')
    }
  },

  async resetNotificationPreference(ctx) {
    const requestId = String(ctx.request.headers['x-request-id'] ?? '') || null
    try {
      const access = await requireInternalPermission(ctx, 'internal.notification.reset')
      const authUserId = String(ctx.params.authUserId ?? ctx.params.logtoUserId ?? '').trim()
      const reason = String(ctx.request.body?.reason ?? '').trim()
      if (!authUserId || !reason) return ctx.badRequest('authUserId, reason が必要です。')

      const preference = await strapi.documents('api::notification-preference.notification-preference').findFirst({
        filters: { userId: { $eq: authUserId } },
      })

      if (!preference) return ctx.notFound('notification preference が見つかりません。')

      const updated = await strapi.documents('api::notification-preference.notification-preference').update({
        documentId: preference.documentId,
        data: {
          emailOptIn: true,
          inAppOptIn: true,
          themeConfig: {
            ...(preference.themeConfig ?? {}),
            resetBy: 'internal_tool',
            resetAt: new Date().toISOString(),
          },
        },
      })

      await createInternalAuditLog(strapi, {
        actorLogtoUserId: access.authUser.userId,
        actorInternalRoles: access.internalRoles,
        targetType: 'notification-preference',
        targetId: authUserId,
        action: 'notification_preference_reset',
        status: 'success',
        reason,
        sourceSite: updated.sourceSite,
        beforeState: { emailOptIn: preference.emailOptIn, inAppOptIn: preference.inAppOptIn },
        afterState: { emailOptIn: updated.emailOptIn, inAppOptIn: updated.inAppOptIn },
        metadata: { dangerousOperation: true },
        requestId,
      })

      ctx.body = {
        ok: true,
        dangerousOperation: true,
        notificationPreference: {
          userId: updated.userId,
          emailOptIn: updated.emailOptIn,
          inAppOptIn: updated.inAppOptIn,
          sourceSite: updated.sourceSite,
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) {
        return ctx.forbidden('internal 権限が不足しています。')
      }
      return ctx.unauthorized('認証に失敗しました。')
    }
  },
})
