import type { AppUser, ContractStatus, MemberPlan, UserRole } from '@/types'

export interface LogtoClaimsLike {
  sub?: unknown
  email?: unknown
  email_verified?: unknown
  username?: unknown
  role?: unknown
  roles?: unknown
  memberPlan?: unknown
  contractStatus?: unknown
  [key: string]: unknown
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
  return 'paid'
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

  return {
    id: userId,
    email,
    role,
    memberPlan: resolveMemberPlan(claims.memberPlan),
    contractStatus: resolveContractStatus(claims.contractStatus),
    emailVerified: claims.email_verified === true,
  }
}

