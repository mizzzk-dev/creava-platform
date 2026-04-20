import type { AppUser } from '@/types'
import type { LifecycleStage, UserLifecycleSummary } from './lifecycle'

export type BenefitVisibilityState = 'hidden' | 'teaser' | 'visible' | 'emphasized' | 'member_only'
export type AccessGateState = 'public' | 'logged_in_only' | 'member_only' | 'entitled_only' | 'temporarily_blocked'
export type EarlyAccessState = 'none' | 'preview' | 'early_access' | 'public_release'
export type MemberPerkState = 'none' | 'available' | 'highlighted' | 'expiring_soon' | 'locked'
export type PersonalizationState = 'none' | 'basic' | 'member' | 'cross_site'

export interface BenefitExperienceState {
  membershipStatus: AppUser['membershipStatus']
  entitlementState: AppUser['entitlementState']
  subscriptionState: AppUser['subscriptionState']
  billingState: AppUser['billingState']
  lifecycleStage: LifecycleStage
  benefitVisibilityState: BenefitVisibilityState
  accessGateState: AccessGateState
  earlyAccessState: EarlyAccessState
  memberPerkState: MemberPerkState
  personalizationState: PersonalizationState
  benefitEligibility: boolean
  benefitPriority: 'none' | 'normal' | 'high' | 'critical'
  gatingReason: string | null
  benefitReason: string | null
  visibleForState: 'guest' | 'non_member' | 'member' | 'grace' | 'expired' | 'admin'
  sourceSite: 'main' | 'store' | 'fc'
  statusUpdatedAt: string | null
  lastBenefitPromptAt: string | null
  lastMemberValueShownAt: string | null
}

export function resolveBenefitExperienceState(params: {
  user: AppUser | null
  lifecycle: UserLifecycleSummary | null
  sourceSite: 'main' | 'store' | 'fc'
}): BenefitExperienceState {
  const { user, lifecycle, sourceSite } = params

  if (!user || !lifecycle) {
    return {
      membershipStatus: 'non_member',
      entitlementState: 'inactive',
      subscriptionState: 'none',
      billingState: 'clear',
      lifecycleStage: 'guest',
      benefitVisibilityState: 'teaser',
      accessGateState: 'public',
      earlyAccessState: sourceSite === 'fc' ? 'preview' : 'none',
      memberPerkState: 'locked',
      personalizationState: 'none',
      benefitEligibility: false,
      benefitPriority: 'normal',
      gatingReason: 'signin_required',
      benefitReason: 'member_value_teaser',
      visibleForState: 'guest',
      sourceSite,
      statusUpdatedAt: null,
      lastBenefitPromptAt: null,
      lastMemberValueShownAt: null,
    }
  }

  const isAdmin = user.role === 'admin'
  const isMember = user.membershipStatus === 'member'
  const isGrace = user.membershipStatus === 'grace'
  const isExpired = user.membershipStatus === 'expired' || user.membershipStatus === 'canceled'
  const hasEntitlement = user.entitlementState === 'active' || user.entitlementState === 'limited' || user.entitlementState === 'grace'

  let benefitVisibilityState: BenefitVisibilityState = 'teaser'
  let accessGateState: AccessGateState = 'public'
  let earlyAccessState: EarlyAccessState = sourceSite === 'store' ? 'preview' : 'none'
  let memberPerkState: MemberPerkState = 'none'
  let benefitPriority: BenefitExperienceState['benefitPriority'] = 'normal'
  let gatingReason: string | null = null
  let benefitReason: string | null = null

  if (isAdmin) {
    benefitVisibilityState = 'emphasized'
    accessGateState = 'entitled_only'
    earlyAccessState = 'early_access'
    memberPerkState = 'highlighted'
    benefitPriority = 'high'
    benefitReason = 'admin_monitoring'
  } else if (isMember && hasEntitlement) {
    benefitVisibilityState = 'emphasized'
    accessGateState = 'member_only'
    earlyAccessState = sourceSite === 'main' ? 'preview' : 'early_access'
    memberPerkState = lifecycle.renewalState === 'upcoming' ? 'expiring_soon' : 'available'
    benefitPriority = lifecycle.renewalWindowState === 'due_now' ? 'critical' : 'high'
    benefitReason = 'member_entitled'
  } else if (isGrace) {
    benefitVisibilityState = 'visible'
    accessGateState = 'member_only'
    earlyAccessState = 'preview'
    memberPerkState = 'expiring_soon'
    benefitPriority = 'critical'
    benefitReason = 'grace_retention'
    gatingReason = 'renewal_required'
  } else if (isExpired) {
    benefitVisibilityState = 'teaser'
    accessGateState = 'logged_in_only'
    earlyAccessState = 'none'
    memberPerkState = 'locked'
    benefitPriority = 'high'
    benefitReason = 'winback_value'
    gatingReason = 'reactivation_required'
  } else {
    benefitVisibilityState = 'teaser'
    accessGateState = 'logged_in_only'
    earlyAccessState = sourceSite === 'fc' ? 'preview' : 'none'
    memberPerkState = 'locked'
    benefitPriority = 'normal'
    benefitReason = 'join_prompt'
    gatingReason = 'membership_required'
  }

  return {
    membershipStatus: user.membershipStatus,
    entitlementState: user.entitlementState,
    subscriptionState: user.subscriptionState,
    billingState: user.billingState,
    lifecycleStage: lifecycle.lifecycleStage,
    benefitVisibilityState,
    accessGateState,
    earlyAccessState,
    memberPerkState,
    personalizationState: isMember || isGrace ? 'cross_site' : 'basic',
    benefitEligibility: isMember || isGrace || isAdmin,
    benefitPriority,
    gatingReason,
    benefitReason,
    visibleForState: isAdmin ? 'admin' : isMember ? 'member' : isGrace ? 'grace' : isExpired ? 'expired' : 'non_member',
    sourceSite,
    statusUpdatedAt: lifecycle.statusUpdatedAt,
    lastBenefitPromptAt: lifecycle.lastBenefitPromptAt,
    lastMemberValueShownAt: lifecycle.lastMemberValueShownAt,
  }
}
