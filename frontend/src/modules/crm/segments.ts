import type { SegmentContext } from './types'

export function buildEngagementSegment(lastActiveAt: string | null): SegmentContext['engagementSegment'] {
  if (!lastActiveAt) return 'new'
  const diff = Date.now() - new Date(lastActiveAt).getTime()
  const days = diff / (24 * 60 * 60 * 1000)
  if (days <= 7) return 'active'
  if (days <= 30) return 'at_risk'
  return 'dormant'
}

export function buildLifecycleScenarios(context: SegmentContext): string[] {
  const scenarios = ['welcome']

  if (context.engagementSegment === 'dormant') scenarios.push('inactivity_nudge')
  if (context.membershipStatus === 'member') scenarios.push('member_benefit')
  if (context.membershipStatus === 'grace' || context.renewalState === 'grace') scenarios.push('grace_recovery')
  if (context.renewalState === 'upcoming' || context.renewalState === 'due') scenarios.push('renewal_nudge')
  if (context.membershipStatus === 'expired' || context.membershipStatus === 'canceled' || context.renewalState === 'expired') scenarios.push('winback_offer')
  if (context.favoriteCategories.length > 0) scenarios.push('favorite_related')
  if (context.benefitVisibilityState === 'teaser') scenarios.push('benefit_teaser')
  if (context.earlyAccessState === 'preview' || context.earlyAccessState === 'early_access') scenarios.push('early_access_prompt')
  if (context.personalizationState === 'cross_site') scenarios.push('cross_site_value')
  if (context.sourceSite === 'store') scenarios.push('store_new_arrival', 'campaign_announcement')
  if (context.sourceSite === 'fc') scenarios.push('fc_update')
  if (context.sourceSite === 'main') scenarios.push('event_update')

  return scenarios
}
