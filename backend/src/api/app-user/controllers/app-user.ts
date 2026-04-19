import { verifyLogtoToken, type AuthenticatedUser } from '../../../lib/auth/logto'
import { requireInternalPermission, type InternalRole } from '../../../lib/auth/internal-access'

type SiteType = 'main' | 'store' | 'fc' | 'cross'

type MembershipPlan = 'free' | 'standard' | 'premium'
type MembershipStatus = 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'

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

function toMembershipSummary(record: any): { membershipPlan: MembershipPlan; membershipStatus: MembershipStatus; accessLevel: AccessLevel } {
  if (!record) {
    return { membershipPlan: 'free', membershipStatus: 'guest', accessLevel: 'logged_in' }
  }

  const membershipPlan = record.membershipType === 'premium' ? 'premium' : record.membershipType === 'paid' ? 'standard' : 'free'

  const statusRaw = String(record.subscriptionStatus ?? '').toLowerCase()
  const membershipStatus = statusRaw.includes('active')
    ? 'active'
    : statusRaw.includes('trial')
      ? 'grace_period'
      : statusRaw.includes('past_due')
        ? 'paused'
        : statusRaw.includes('cancel')
          ? 'cancelled'
          : 'guest'

  const accessLevel = membershipPlan === 'premium'
    ? 'premium'
    : membershipPlan === 'standard'
      ? 'member'
      : 'logged_in'

  return { membershipPlan, membershipStatus, accessLevel }
}

function buildSeedData(logtoUserId: string, claims: NormalizedClaims, sourceSite: SiteType, membership: { membershipPlan: MembershipPlan; membershipStatus: MembershipStatus; accessLevel: AccessLevel }, nowIso: string) {
  const completedFields = [claims.displayName, claims.email, claims.avatarUrl].filter(Boolean).length

  return {
    authIdentity: 'logto',
    logtoUserId,
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
    syncVersion: 1,
  }
}

function assertOpsToken(ctx: any): boolean {
  if (!OPS_TOKEN) return false
  return String(ctx.request.headers['x-ops-token'] ?? '') === OPS_TOKEN
}

async function requireAuthUser(ctx: any): Promise<AuthenticatedUser> {
  return verifyLogtoToken(ctx.request.headers.authorization)
}

async function findLatestSubscription(strapi: any, logtoUserId: string) {
  return strapi.documents('api::subscription-record.subscription-record').findFirst({
    filters: { authUserId: { $eq: logtoUserId } },
    sort: ['createdAt:desc'],
  })
}

async function findLatestEntitlement(strapi: any, logtoUserId: string) {
  return strapi.documents('api::entitlement-record.entitlement-record').findFirst({
    filters: { authUserId: { $eq: logtoUserId } },
    sort: ['createdAt:desc'],
  })
}

async function ensureNotificationPreference(strapi: any, logtoUserId: string, sourceSite: SiteType, locale: string, nowIso: string): Promise<void> {
  const existing = await strapi.documents('api::notification-preference.notification-preference').findFirst({
    filters: { userId: { $eq: logtoUserId } },
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
      userId: logtoUserId,
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

  return {
    appUser,
    userSummary: {
      membershipStatus: appUser.membershipStatus,
      membershipPlan: appUser.membershipPlan,
      accessLevel: appUser.accessLevel,
      loyaltyState: appUser.loyaltyState,
      accountStatus: appUser.accountStatus,
      linkedProviders: appUser.linkedProviders,
      firstLoginAt: appUser.firstLoginAt,
      lastLoginAt: appUser.lastLoginAt,
      sourceSite: appUser.sourceSite,
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
