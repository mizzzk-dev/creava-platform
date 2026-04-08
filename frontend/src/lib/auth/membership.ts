import type { ContractStatus, MemberPlan, UserRole } from '@/types'

export type VisibilityScope = 'public' | 'members' | 'premium'

export function canAccessByRole(role: UserRole, visibility: VisibilityScope): boolean {
  if (visibility === 'public') return true
  if (visibility === 'members') return role === 'member' || role === 'premium' || role === 'admin'
  return role === 'premium' || role === 'admin'
}

export function isMembershipActive(status: ContractStatus): boolean {
  return status === 'active' || status === 'grace' || status === 'cancel_scheduled'
}

export function canAccessByPlan(plan: MemberPlan, visibility: VisibilityScope): boolean {
  if (visibility === 'public') return true
  if (visibility === 'members') return plan === 'paid' || plan === 'premium'
  return plan === 'premium'
}
