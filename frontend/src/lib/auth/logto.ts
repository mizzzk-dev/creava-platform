import type { AccountStatus, AppUser, BillingState, ContractStatus, EntitlementState, InternalRole, MemberPlan, MembershipStatus, SubscriptionState, UserRole } from '@/types'

export interface LogtoClaimsLike {
  sub?: unknown
  email?: unknown
  email_verified?: unknown
  username?: unknown
  role?: unknown
  roles?: unknown
  memberPlan?: unknown
  contractStatus?: unknown
  membershipStatus?: unknown
  accountStatus?: unknown
  subscriptionState?: unknown
  billingState?: unknown
  entitlementState?: unknown
  accessLevel?: unknown
  internalRole?: unknown
  [key: string]: unknown
}

function resolveMembershipStatus(raw: unknown): MembershipStatus {
  if (raw === 'member') return 'member'
  if (raw === 'grace') return 'grace'
  if (raw === 'canceled') return 'canceled'
  if (raw === 'expired') return 'expired'
  if (raw === 'suspended') return 'suspended'
  return 'non_member'
}

function deriveMembershipStatus(raw: unknown, role: UserRole, plan: MemberPlan, contractStatus: ContractStatus): MembershipStatus {
  const normalized = resolveMembershipStatus(raw)
  if (normalized !== 'non_member') return normalized
  if (contractStatus === 'grace') return 'grace'
  if (contractStatus === 'canceled') return 'canceled'
  if (contractStatus === 'expired') return 'expired'
  if (role === 'admin' || role === 'member' || role === 'premium') return 'member'
  if (plan === 'paid' || plan === 'premium') return 'member'
  return 'non_member'
}


function resolveSubscriptionState(raw: unknown): SubscriptionState {
  if (raw === 'trialing') return 'trialing'
  if (raw === 'active') return 'active'
  if (raw === 'past_due') return 'past_due'
  if (raw === 'canceled') return 'canceled'
  if (raw === 'expired') return 'expired'
  return 'none'
}

function resolveBillingState(raw: unknown): BillingState {
  if (raw === 'pending') return 'pending'
  if (raw === 'failed') return 'failed'
  if (raw === 'refunded') return 'refunded'
  if (raw === 'disputed') return 'disputed'
  return 'clear'
}

function deriveEntitlementState(raw: unknown, membershipStatus: MembershipStatus): EntitlementState {
  if (raw === 'active') return 'active'
  if (raw === 'limited') return 'limited'
  if (raw === 'grace') return 'grace'
  if (raw === 'blocked') return 'blocked'
  return membershipStatus === 'member' ? 'active' : membershipStatus === 'grace' ? 'grace' : 'inactive'
}

function resolveAccountStatus(raw: unknown): AccountStatus {
  if (raw === 'pending') return 'pending'
  if (raw === 'restricted') return 'restricted'
  if (raw === 'suspended') return 'suspended'
  if (raw === 'deleted_like') return 'deleted_like'
  return 'active'
}

function resolveInternalRole(raw: unknown): InternalRole {
  if (raw === 'support') return 'support'
  if (raw === 'moderator') return 'moderator'
  if (raw === 'admin') return 'admin'
  if (raw === 'super_admin') return 'super_admin'
  return 'user'
}

function resolveAccessLevel(raw: unknown): AppUser['accessLevel'] {
  if (raw === 'public') return 'public'
  if (raw === 'member') return 'member'
  if (raw === 'premium') return 'premium'
  if (raw === 'admin') return 'admin'
  return 'logged_in'
}

function resolveRole(raw: unknown): UserRole {
  if (raw === 'admin') return 'admin'
  if (raw === 'premium') return 'premium'
  if (raw === 'member') return 'member'
  if (raw === 'free') return 'free'
  return 'guest'
}

function resolveMemberPlan(raw: unknown): MemberPlan {
  if (raw === 'free') return 'free'
  if (raw === 'premium') return 'premium'
  if (raw === 'paid') return 'paid'
  return 'free'
}

function resolveContractStatus(raw: unknown): ContractStatus {
  if (raw === 'grace') return 'grace'
  if (raw === 'cancel_scheduled') return 'cancel_scheduled'
  if (raw === 'canceled') return 'canceled'
  if (raw === 'expired') return 'expired'
  return 'active'
}

function pickRole(claims: LogtoClaimsLike): UserRole {
  const rawRoles = claims.roles
  if (Array.isArray(rawRoles)) {
    if (rawRoles.includes('admin')) return 'admin'
    if (rawRoles.includes('premium')) return 'premium'
    if (rawRoles.includes('member')) return 'member'
    if (rawRoles.includes('free')) return 'free'
  }

  return resolveRole(claims.role)
}

export function toAppUserFromLogtoClaims(claims: LogtoClaimsLike): AppUser {
  const userId = typeof claims.sub === 'string' && claims.sub ? claims.sub : 'guest'
  const email = typeof claims.email === 'string' ? claims.email : null
  const role = pickRole(claims)
  const contractStatus = resolveContractStatus(claims.contractStatus)
  const memberPlan = resolveMemberPlan(claims.memberPlan)
  const membershipStatus = deriveMembershipStatus(claims.membershipStatus, role, memberPlan, contractStatus)
  const accessLevel = resolveAccessLevel(claims.accessLevel)
  const subscriptionState = resolveSubscriptionState(claims.subscriptionState)
  const billingState = resolveBillingState(claims.billingState)

  return {
    id: userId,
    email,
    role,
    memberPlan,
    contractStatus,
    subscriptionState,
    billingState,
    entitlementState: deriveEntitlementState(claims.entitlementState, membershipStatus),
    membershipStatus,
    accountStatus: resolveAccountStatus(claims.accountStatus),
    accessLevel,
    internalRole: resolveInternalRole(claims.internalRole),
    emailVerified: claims.email_verified === true,
  }
}
