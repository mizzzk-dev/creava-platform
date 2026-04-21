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
    authIdentity: process.env.AUTH_PROVIDER === 'supabase' ? 'supabase' : 'logto',
    supabaseUserId: authUserId,
    logtoUserId: authUserId,
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
    profileCompletionState: completedFields >= 3 ? 'complete' : completedFields > 0 ? 'partial' : 'empty',
    onboardingState: 'not_started',
    lifecycleStage: membership.membershipStatus === 'member' ? 'active_member' : membership.membershipStatus === 'grace' ? 'grace_member' : 'authenticated_non_member',
    entitlementState: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? 'active' : 'none',
    joinedAt: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? nowIso : null,
    renewedAt: null,
    canceledAt: null,
    graceEndsAt: null,
    suspendedAt: membership.membershipStatus === 'suspended' ? nowIso : null,
    reactivatedAt: null,
    acquisitionSource: sourceSite,
    linkedProviders: claims.linkedProviders,
    firstLoginAt: nowIso,
    lastLoginAt: nowIso,
    accountStatus: 'active',
    mergeState: 'none',
    supportFlags: {
      duplicateCandidate: false,
      needsManualReview: false,
      blockedReason: null,
    },
    fieldSources: {
      identityFields: 'logto',
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
  const appUser = await strapi.documents('api::app-user.app-user').findFirst({ filters: { logtoUserId: { $eq: logtoUserId } } })
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
        filters: { logtoUserId: { $eq: authUser.userId } },
      })

      if (!existing) {
        const created = await strapi.documents('api::app-user.app-user').create({
          data: buildSeedData(authUser.userId, claims, sourceSite, membership, nowIso),
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
          entitlementState: membership.membershipStatus === 'member' || membership.membershipStatus === 'grace' ? 'active' : 'none',
          suspendedAt: membership.membershipStatus === 'suspended' ? nowIso : existing.suspendedAt ?? null,
          renewedAt: membership.membershipStatus === 'member' ? nowIso : existing.renewedAt ?? null,
          ...deriveMemberProgressSeed(membership.membershipStatus),
          lastProgressUpdateAt: nowIso,
          lastSyncedAt: nowIso,
        },
      })

      await ensureNotificationPreference(strapi, authUser.userId, sourceSite, claims.locale, nowIso)

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
        filters: { logtoUserId: { $eq: authUser.userId } },
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

      ctx.body = {
        appUser,
        auth: {
          logtoUserId: authUser.userId,
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
        lifecycleSummary,
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

  async supportLookup(ctx) {
    if (!assertOpsToken(ctx)) return ctx.unauthorized('ops token が不正です。')

    const { email, logtoUserId, appUserId } = ctx.query ?? {}
    if (!email && !logtoUserId && !appUserId) {
      return ctx.badRequest('email, logtoUserId, appUserId のいずれかが必要です。')
    }

    const filters: Record<string, unknown>[] = []
    if (typeof email === 'string' && email) filters.push({ primaryEmail: { $eqi: email } })
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
      const { email, logtoUserId, appUserId } = ctx.query ?? {}
      if (!email && !logtoUserId && !appUserId) {
        return ctx.badRequest('email, logtoUserId, appUserId のいずれかが必要です。')
      }

      const filters: Record<string, unknown>[] = []
      if (typeof email === 'string' && email) filters.push({ primaryEmail: { $eqi: email } })
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
          logtoUserId: user.logtoUserId,
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
      const logtoUserId = String(ctx.params.logtoUserId ?? '').trim()
      if (!logtoUserId) return ctx.badRequest('logtoUserId が必要です。')

      const summary = await buildUserSummary(strapi, logtoUserId)
      if (!summary) return ctx.notFound('対象ユーザーが見つかりません。')

      ctx.body = summary
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
      const logtoUserId = String(ctx.params.logtoUserId ?? '').trim()
      const reason = String(ctx.request.body?.reason ?? '').trim()
      const nextStatus = String(ctx.request.body?.nextStatus ?? '').trim()

      if (!logtoUserId || !reason || !nextStatus) {
        return ctx.badRequest('logtoUserId, reason, nextStatus が必要です。')
      }

      const user = await strapi.documents('api::app-user.app-user').findFirst({ filters: { logtoUserId: { $eq: logtoUserId } } })
      if (!user) return ctx.notFound('対象ユーザーが見つかりません。')

      const updated = await strapi.documents('api::app-user.app-user').update({
        documentId: user.documentId,
        data: { accountStatus: nextStatus },
      })

      await createInternalAuditLog(strapi, {
        actorLogtoUserId: access.authUser.userId,
        actorInternalRoles: access.internalRoles,
        targetType: 'app-user',
        targetId: logtoUserId,
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
          logtoUserId,
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
      const logtoUserId = String(ctx.params.logtoUserId ?? '').trim()
      const reason = String(ctx.request.body?.reason ?? '').trim()
      if (!logtoUserId || !reason) return ctx.badRequest('logtoUserId, reason が必要です。')

      const preference = await strapi.documents('api::notification-preference.notification-preference').findFirst({
        filters: { userId: { $eq: logtoUserId } },
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
        targetId: logtoUserId,
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
