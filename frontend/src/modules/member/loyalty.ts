import type { LoyaltyProfile, MembershipStatus } from './types'

function monthDiff(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear()
  const months = to.getMonth() - from.getMonth()
  return Math.max(0, years * 12 + months)
}

export function deriveMembershipStatus(value: MembershipStatus, renewalDate: string | null): MembershipStatus {
  if (value !== 'active') return value
  if (!renewalDate) return value
  const renewal = new Date(renewalDate)
  if (Number.isNaN(renewal.getTime())) return value
  const diffMs = renewal.getTime() - Date.now()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (days < 0) return 'grace_period'
  return value
}

export function buildLoyaltyProfile(profile: LoyaltyProfile): LoyaltyProfile {
  const now = new Date()
  const startedAt = profile.membershipStartedAt ? new Date(profile.membershipStartedAt) : null
  const tenureMonths = startedAt && !Number.isNaN(startedAt.getTime())
    ? Math.max(profile.tenureMonths, monthDiff(startedAt, now))
    : profile.tenureMonths

  return {
    ...profile,
    membershipStatus: deriveMembershipStatus(profile.membershipStatus, profile.renewalDate),
    tenureMonths,
  }
}
