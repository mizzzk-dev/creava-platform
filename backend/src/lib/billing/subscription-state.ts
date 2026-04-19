export type BillingStatus = 'ok' | 'past_due' | 'unpaid' | 'failed' | 'not_started'
export type EntitlementState = 'active' | 'grace_period' | 'inactive'

export type NormalizedSubscriptionState = {
  subscriptionStatus: string
  billingStatus: BillingStatus
  entitlementState: EntitlementState
  membershipStatus: 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'
  accessLevel: 'public' | 'logged_in' | 'member' | 'premium' | 'admin'
  renewalDate: string | null
  gracePeriodState: 'none' | 'active' | 'expired'
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

function toIsoFromUnix(raw: unknown): string | null {
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  return new Date(value * 1000).toISOString()
}

function normalizeStatus(raw: unknown): string {
  const value = String(raw ?? '').trim().toLowerCase()
  return value || 'incomplete'
}

function toBillingStatus(subscriptionStatus: string): BillingStatus {
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') return 'ok'
  if (subscriptionStatus === 'past_due') return 'past_due'
  if (subscriptionStatus === 'unpaid') return 'unpaid'
  if (subscriptionStatus === 'incomplete_expired') return 'failed'
  if (subscriptionStatus === 'incomplete') return 'not_started'
  if (subscriptionStatus === 'canceled') return 'ok'
  return 'not_started'
}

export function normalizeStripeSubscriptionState(raw: Record<string, unknown>, planAccessLevel: 'member' | 'premium' = 'member'): NormalizedSubscriptionState {
  const subscriptionStatus = normalizeStatus(raw.status)
  const currentPeriodStart = toIsoFromUnix(raw.current_period_start)
  const currentPeriodEnd = toIsoFromUnix(raw.current_period_end)
  const canceledAt = toIsoFromUnix(raw.canceled_at)
  const cancelAtPeriodEnd = Boolean(raw.cancel_at_period_end)

  const billingStatus = toBillingStatus(subscriptionStatus)
  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
  const isGrace = subscriptionStatus === 'past_due'
  const isCancelled = subscriptionStatus === 'canceled' || subscriptionStatus === 'incomplete_expired'

  const entitlementState: EntitlementState = isActive ? 'active' : isGrace ? 'grace_period' : 'inactive'

  const membershipStatus: NormalizedSubscriptionState['membershipStatus'] =
    isActive ? 'active' : isGrace ? 'grace_period' : subscriptionStatus === 'unpaid' ? 'paused' : isCancelled ? 'cancelled' : 'guest'

  const accessLevel: NormalizedSubscriptionState['accessLevel'] =
    entitlementState === 'inactive' ? 'logged_in' : planAccessLevel

  const gracePeriodState: NormalizedSubscriptionState['gracePeriodState'] =
    isGrace ? 'active' : subscriptionStatus === 'unpaid' ? 'expired' : 'none'

  return {
    subscriptionStatus,
    billingStatus,
    entitlementState,
    membershipStatus,
    accessLevel,
    renewalDate: currentPeriodEnd,
    gracePeriodState,
    cancelAtPeriodEnd,
    canceledAt,
    currentPeriodStart,
    currentPeriodEnd,
  }
}
