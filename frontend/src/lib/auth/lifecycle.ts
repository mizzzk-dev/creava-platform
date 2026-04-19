import type { AccountStatus, AppUser, MembershipStatus } from '@/types'

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'
export type ProfileCompletionStatus = 'not_started' | 'in_progress' | 'completed'
export type EntitlementState = 'inactive' | 'active' | 'limited' | 'grace' | 'blocked'
export type LifecycleStage =
  | 'guest'
  | 'authenticated_non_member'
  | 'onboarding_user'
  | 'active_member'
  | 'grace_member'
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
  firstLoginAt: string | null
  lastLoginAt: string | null
  joinedAt: string | null
  renewedAt: string | null
  canceledAt: string | null
  graceEndsAt: string | null
  suspendedAt: string | null
  reactivatedAt: string | null
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

export function resolveLifecycleStage(params: {
  isSignedIn: boolean
  membershipStatus: MembershipStatus
  accountStatus: AccountStatus
  onboardingStatus: OnboardingStatus
}): LifecycleStage {
  const { isSignedIn, membershipStatus, accountStatus, onboardingStatus } = params

  if (!isSignedIn) return 'guest'
  if (accountStatus === 'suspended' || accountStatus === 'restricted' || membershipStatus === 'suspended') return 'suspended_user'
  if (onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') return 'onboarding_user'
  if (membershipStatus === 'member') return 'active_member'
  if (membershipStatus === 'grace') return 'grace_member'
  if (membershipStatus === 'expired' || membershipStatus === 'canceled') return 'inactive_member'
  return 'authenticated_non_member'
}

export function lifecycleFromClaims(user: AppUser, claims: Record<string, unknown>): UserLifecycleSummary {
  const onboardingStatus = resolveOnboardingStatus(claims.onboardingStatus ?? claims.onboardingState)
  const profileCompletionStatus = resolveProfileCompletionStatus(claims.profileCompletionStatus ?? claims.profileCompletionState)

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
    }),
    membershipStatus: user.membershipStatus,
    subscriptionState: user.subscriptionState,
    billingState: user.billingState,
    firstLoginAt: typeof claims.firstLoginAt === 'string' ? claims.firstLoginAt : null,
    lastLoginAt: typeof claims.lastLoginAt === 'string' ? claims.lastLoginAt : null,
    joinedAt: typeof claims.joinedAt === 'string' ? claims.joinedAt : null,
    renewedAt: typeof claims.renewedAt === 'string' ? claims.renewedAt : null,
    canceledAt: typeof claims.canceledAt === 'string' ? claims.canceledAt : null,
    graceEndsAt: typeof claims.graceEndsAt === 'string' ? claims.graceEndsAt : null,
    suspendedAt: typeof claims.suspendedAt === 'string' ? claims.suspendedAt : null,
    reactivatedAt: typeof claims.reactivatedAt === 'string' ? claims.reactivatedAt : null,
    sourceSite: claims.sourceSite === 'main' || claims.sourceSite === 'store' || claims.sourceSite === 'fc' ? claims.sourceSite : 'cross',
  }
}
