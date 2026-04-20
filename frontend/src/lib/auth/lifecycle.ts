import type { AccountStatus, AppUser, MembershipStatus } from '@/types'

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'
export type ProfileCompletionStatus = 'not_started' | 'in_progress' | 'completed'
export type EntitlementState = 'inactive' | 'active' | 'limited' | 'grace' | 'blocked'
export type RenewalState = 'not_applicable' | 'upcoming' | 'due' | 'grace' | 'completed' | 'failed' | 'expired' | 'reactivated'
export type RenewalWindowState = 'normal' | 'renewal_soon' | 'due_now' | 'grace_window' | 'rejoin_window' | 'inactive'
export type LifecycleStage =
  | 'guest'
  | 'authenticated_non_member'
  | 'onboarding_user'
  | 'active_member'
  | 'renewal_soon_member'
  | 'grace_member'
  | 'expired_member'
  | 'reactivated_member'
  | 'inactive_member'
  | 'suspended_user'

export type UserLifecycleSummary = {
  onboardingStatus: OnboardingStatus
  profileCompletionStatus: ProfileCompletionStatus
  entitlementState: EntitlementState
  lifecycleStage: LifecycleStage
  membershipStatus: MembershipStatus
  subscriptionState: AppUser['subscriptionState']
  billingState: AppUser['billingState']
  renewalState: RenewalState
  renewalWindowState: RenewalWindowState
  lifecycleMessageState: 'idle' | 'renewal_pending' | 'grace_notice_sent' | 'winback_sent' | 'suppressed'
  reactivationEligibility: boolean
  winbackEligibility: boolean
  firstLoginAt: string | null
  lastLoginAt: string | null
  joinedAt: string | null
  renewedAt: string | null
  canceledAt: string | null
  graceEndsAt: string | null
  renewalDueAt: string | null
  nextBillingAt: string | null
  suspendedAt: string | null
  reactivatedAt: string | null
  expiredAt: string | null
  paymentFailureAt: string | null
  lastRetentionMessageAt: string | null
  lastRenewalNoticeAt: string | null
  lastWinbackNoticeAt: string | null
  statusReason: string | null
  statusUpdatedAt: string | null
  sourceSite: 'main' | 'store' | 'fc' | 'cross'
}

function resolveOnboardingStatus(raw: unknown): OnboardingStatus {
  if (raw === 'in_progress') return 'in_progress'
  if (raw === 'completed') return 'completed'
  if (raw === 'skipped') return 'skipped'
  return 'not_started'
}

function resolveProfileCompletionStatus(raw: unknown): ProfileCompletionStatus {
  if (raw === 'completed' || raw === 'complete') return 'completed'
  if (raw === 'in_progress' || raw === 'partial') return 'in_progress'
  return 'not_started'
}

function resolveRenewalState(user: AppUser, claims: Record<string, unknown>): RenewalState {
  const raw = claims.renewalState
  if (raw === 'upcoming' || raw === 'due' || raw === 'grace' || raw === 'completed' || raw === 'failed' || raw === 'expired' || raw === 'reactivated' || raw === 'not_applicable') {
    return raw
  }
  if (user.membershipStatus === 'grace') return 'grace'
  if (user.membershipStatus === 'expired' || user.membershipStatus === 'canceled') return 'expired'
  if (user.subscriptionState === 'past_due' || user.billingState === 'failed') return 'failed'
  if (user.membershipStatus === 'member') return 'completed'
  return 'not_applicable'
}

function resolveRenewalWindowState(raw: unknown, renewalState: RenewalState): RenewalWindowState {
  if (raw === 'normal' || raw === 'renewal_soon' || raw === 'due_now' || raw === 'grace_window' || raw === 'rejoin_window' || raw === 'inactive') return raw
  if (renewalState === 'upcoming') return 'renewal_soon'
  if (renewalState === 'due') return 'due_now'
  if (renewalState === 'grace') return 'grace_window'
  if (renewalState === 'expired') return 'rejoin_window'
  if (renewalState === 'not_applicable') return 'inactive'
  return 'normal'
}

export function resolveLifecycleStage(params: {
  isSignedIn: boolean
  membershipStatus: MembershipStatus
  accountStatus: AccountStatus
  onboardingStatus: OnboardingStatus
  renewalState?: RenewalState
}): LifecycleStage {
  const { isSignedIn, membershipStatus, accountStatus, onboardingStatus, renewalState } = params

  if (!isSignedIn) return 'guest'
  if (accountStatus === 'suspended' || accountStatus === 'restricted' || membershipStatus === 'suspended') return 'suspended_user'
  if (onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') return 'onboarding_user'
  if (renewalState === 'upcoming' && membershipStatus === 'member') return 'renewal_soon_member'
  if (renewalState === 'reactivated') return 'reactivated_member'
  if (membershipStatus === 'member') return 'active_member'
  if (membershipStatus === 'grace') return 'grace_member'
  if (membershipStatus === 'expired' || membershipStatus === 'canceled') return 'expired_member'
  if (renewalState === 'expired') return 'inactive_member'
  return 'authenticated_non_member'
}

export function lifecycleFromClaims(user: AppUser, claims: Record<string, unknown>): UserLifecycleSummary {
  const onboardingStatus = resolveOnboardingStatus(claims.onboardingStatus ?? claims.onboardingState)
  const profileCompletionStatus = resolveProfileCompletionStatus(claims.profileCompletionStatus ?? claims.profileCompletionState)
  const renewalState = resolveRenewalState(user, claims)

  return {
    onboardingStatus,
    profileCompletionStatus,
    entitlementState: claims.entitlementState === 'active'
      ? 'active'
      : claims.entitlementState === 'limited'
        ? 'limited'
        : claims.entitlementState === 'grace'
          ? 'grace'
          : claims.entitlementState === 'blocked'
            ? 'blocked'
            : 'inactive',
    lifecycleStage: resolveLifecycleStage({
      isSignedIn: true,
      membershipStatus: user.membershipStatus,
      accountStatus: user.accountStatus,
      onboardingStatus,
      renewalState,
    }),
    membershipStatus: user.membershipStatus,
    subscriptionState: user.subscriptionState,
    billingState: user.billingState,
    renewalState,
    renewalWindowState: resolveRenewalWindowState(claims.renewalWindowState, renewalState),
    lifecycleMessageState:
      claims.lifecycleMessageState === 'renewal_pending' || claims.lifecycleMessageState === 'grace_notice_sent' || claims.lifecycleMessageState === 'winback_sent' || claims.lifecycleMessageState === 'suppressed'
        ? claims.lifecycleMessageState
        : 'idle',
    reactivationEligibility: Boolean(claims.reactivationEligibility),
    winbackEligibility: Boolean(claims.winbackEligibility),
    firstLoginAt: typeof claims.firstLoginAt === 'string' ? claims.firstLoginAt : null,
    lastLoginAt: typeof claims.lastLoginAt === 'string' ? claims.lastLoginAt : null,
    joinedAt: typeof claims.joinedAt === 'string' ? claims.joinedAt : null,
    renewedAt: typeof claims.renewedAt === 'string' ? claims.renewedAt : null,
    canceledAt: typeof claims.canceledAt === 'string' ? claims.canceledAt : null,
    graceEndsAt: typeof claims.graceEndsAt === 'string' ? claims.graceEndsAt : null,
    renewalDueAt: typeof claims.renewalDueAt === 'string' ? claims.renewalDueAt : null,
    nextBillingAt: typeof claims.nextBillingAt === 'string' ? claims.nextBillingAt : null,
    suspendedAt: typeof claims.suspendedAt === 'string' ? claims.suspendedAt : null,
    reactivatedAt: typeof claims.reactivatedAt === 'string' ? claims.reactivatedAt : null,
    expiredAt: typeof claims.expiredAt === 'string' ? claims.expiredAt : null,
    paymentFailureAt: typeof claims.paymentFailureAt === 'string' ? claims.paymentFailureAt : null,
    lastRetentionMessageAt: typeof claims.lastRetentionMessageAt === 'string' ? claims.lastRetentionMessageAt : null,
    lastRenewalNoticeAt: typeof claims.lastRenewalNoticeAt === 'string' ? claims.lastRenewalNoticeAt : null,
    lastWinbackNoticeAt: typeof claims.lastWinbackNoticeAt === 'string' ? claims.lastWinbackNoticeAt : null,
    statusReason: typeof claims.statusReason === 'string' ? claims.statusReason : null,
    statusUpdatedAt: typeof claims.statusUpdatedAt === 'string' ? claims.statusUpdatedAt : null,
    sourceSite: claims.sourceSite === 'main' || claims.sourceSite === 'store' || claims.sourceSite === 'fc' ? claims.sourceSite : 'cross',
  }
}
