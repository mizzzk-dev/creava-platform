import type { AppUser } from '@/types'
import type { UserLifecycleSummary } from '@/lib/auth/lifecycle'
import { resolveBenefitExperienceState } from '@/lib/auth/benefitState'
import { resolveMemberProgression } from '@/lib/auth/memberProgression'

export type CampaignEligibilityState = 'ineligible' | 'eligible' | 'prioritized' | 'excluded' | 'cooldown'
export type SeasonalEligibilityState = 'none' | 'teaser' | 'eligible' | 'highlighted' | 'expired'
export type SeasonalPerkState = 'none' | 'teaser' | 'available' | 'highlighted' | 'expired'
export type OfferVisibilityState = 'hidden' | 'teaser' | 'visible' | 'emphasized' | 'member_priority'
export type ContentPriorityState = 'default' | 'member_priority' | 'rank_priority' | 'winback_priority'
export type RecommendationState = 'generic' | 'lifecycle' | 'rank' | 'interest' | 'reactivation'
export type PersonalizationState = 'generic' | 'light_personalized' | 'state_based' | 'rank_based' | 'interest_based'
export type CampaignWindowState = 'closed' | 'opening' | 'live' | 'ending' | 'cooldown'

export interface CampaignPersonalizationState {
  sourceSite: 'main' | 'store' | 'fc' | 'member' | 'support' | 'admin'
  lifecycleStage: UserLifecycleSummary['lifecycleStage'] | 'guest'
  membershipStatus: AppUser['membershipStatus']
  entitlementState: AppUser['entitlementState']
  subscriptionState: AppUser['subscriptionState']
  billingState: AppUser['billingState']
  memberRankState: 'none' | 'starter' | 'core' | 'premium' | 'legacy' | 'honorary'
  missionState: 'available' | 'in_progress' | 'completed' | 'expired' | 'hidden'
  perkState: 'none' | 'teaser' | 'available' | 'expiring' | 'locked'
  campaignEligibilityState: CampaignEligibilityState
  seasonalEligibilityState: SeasonalEligibilityState
  seasonalPerkState: SeasonalPerkState
  personalizationState: PersonalizationState
  offerVisibilityState: OfferVisibilityState
  contentPriorityState: ContentPriorityState
  recommendationState: RecommendationState
  campaignWindowState: CampaignWindowState
  eligibilityReason: string
  personalizationReason: string
  recommendationReason: string
  nextBestActionLabel: string
  nextBestActionHref: string
  rejoinRecommended: boolean
  lastOfferShownAt: string | null
  lastSeasonalPromptAt: string | null
  lastRecommendationRefreshAt: string | null
}

function mapPersonalizationState(input: string): PersonalizationState {
  if (input === 'none') return 'generic'
  if (input === 'basic') return 'light_personalized'
  if (input === 'member') return 'state_based'
  if (input === 'cross_site') return 'interest_based'
  return 'state_based'
}

export function resolveCampaignPersonalizationState(params: {
  user: AppUser | null
  lifecycle: UserLifecycleSummary | null
  sourceSite: CampaignPersonalizationState['sourceSite']
}): CampaignPersonalizationState {
  const { user, lifecycle, sourceSite } = params
  const normalizedSite = sourceSite === 'admin' || sourceSite === 'support' || sourceSite === 'member' ? 'main' : sourceSite
  const benefit = resolveBenefitExperienceState({ user, lifecycle, sourceSite: normalizedSite })
  const progress = resolveMemberProgression({ user, lifecycle, sourceSite })

  if (!user || !lifecycle) {
    return {
      sourceSite,
      lifecycleStage: 'guest',
      membershipStatus: 'non_member',
      entitlementState: 'inactive',
      subscriptionState: 'none',
      billingState: 'clear',
      memberRankState: 'none',
      missionState: 'available',
      perkState: 'teaser',
      campaignEligibilityState: 'eligible',
      seasonalEligibilityState: 'teaser',
      seasonalPerkState: 'teaser',
      personalizationState: 'generic',
      offerVisibilityState: 'teaser',
      contentPriorityState: 'default',
      recommendationState: 'generic',
      campaignWindowState: 'opening',
      eligibilityReason: 'signin_for_member_campaign',
      personalizationReason: 'anonymous_user',
      recommendationReason: 'show_brand_hub_first',
      nextBestActionLabel: 'ログインして施策を最適化',
      nextBestActionHref: '/login',
      rejoinRecommended: false,
      lastOfferShownAt: null,
      lastSeasonalPromptAt: null,
      lastRecommendationRefreshAt: null,
    }
  }

  const isHighRank = progress.memberRankState === 'premium' || progress.memberRankState === 'legacy'
  const isExpired = user.membershipStatus === 'expired' || user.membershipStatus === 'canceled'
  const isGrace = user.membershipStatus === 'grace'

  let campaignEligibilityState: CampaignEligibilityState = 'ineligible'
  let seasonalEligibilityState: SeasonalEligibilityState = 'none'
  let seasonalPerkState: SeasonalPerkState = 'none'
  let offerVisibilityState: OfferVisibilityState = 'hidden'
  let contentPriorityState: ContentPriorityState = 'default'
  let recommendationState: RecommendationState = 'generic'
  let campaignWindowState: CampaignWindowState = 'live'
  let eligibilityReason = 'non_member_default'
  let personalizationReason = 'lifecycle_based'
  let recommendationReason = 'fresh_updates'
  let nextBestActionLabel = 'おすすめを確認する'
  let nextBestActionHref = '/member'

  if (benefit.gatingReason === 'renewal_required') {
    campaignEligibilityState = 'prioritized'
    seasonalEligibilityState = 'eligible'
    seasonalPerkState = 'available'
    offerVisibilityState = 'member_priority'
    contentPriorityState = 'winback_priority'
    recommendationState = 'reactivation'
    campaignWindowState = 'ending'
    eligibilityReason = 'grace_retention_window'
    personalizationReason = 'grace_needs_recovery'
    recommendationReason = 'show_recovery_offer_first'
    nextBestActionLabel = '会員ステータスを維持する'
    nextBestActionHref = '/member'
  } else if (isExpired) {
    campaignEligibilityState = lifecycle.winbackEligibility ? 'prioritized' : 'cooldown'
    seasonalEligibilityState = lifecycle.winbackEligibility ? 'teaser' : 'expired'
    seasonalPerkState = lifecycle.winbackEligibility ? 'teaser' : 'expired'
    offerVisibilityState = 'teaser'
    contentPriorityState = 'winback_priority'
    recommendationState = 'reactivation'
    campaignWindowState = lifecycle.winbackEligibility ? 'opening' : 'cooldown'
    eligibilityReason = lifecycle.winbackEligibility ? 'winback_ready' : 'winback_cooldown'
    personalizationReason = 'expired_member_rejoin'
    recommendationReason = 'show_rejoin_value'
    nextBestActionLabel = '再開オファーを確認する'
    nextBestActionHref = '/fanclub/join'
  } else if (user.membershipStatus === 'member') {
    campaignEligibilityState = isHighRank ? 'prioritized' : 'eligible'
    seasonalEligibilityState = isHighRank ? 'highlighted' : 'eligible'
    seasonalPerkState = isHighRank ? 'highlighted' : 'available'
    offerVisibilityState = isHighRank ? 'member_priority' : 'visible'
    contentPriorityState = isHighRank ? 'rank_priority' : 'member_priority'
    recommendationState = progress.missionState === 'completed' ? 'interest' : 'rank'
    campaignWindowState = lifecycle.renewalWindowState === 'due_now' ? 'ending' : 'live'
    eligibilityReason = isHighRank ? 'high_rank_priority' : 'active_member'
    personalizationReason = isHighRank ? 'rank_value_emphasis' : 'member_state_based'
    recommendationReason = progress.missionState === 'completed' ? 'interest_expansion' : 'rank_progression'
    nextBestActionLabel = progress.missionState === 'completed' ? '今週の限定特典を見る' : '次のランク条件を進める'
    nextBestActionHref = '/member'
  } else if (user.membershipStatus === 'suspended') {
    campaignEligibilityState = 'excluded'
    seasonalEligibilityState = 'none'
    seasonalPerkState = 'none'
    offerVisibilityState = 'hidden'
    contentPriorityState = 'default'
    recommendationState = 'lifecycle'
    campaignWindowState = 'closed'
    eligibilityReason = 'account_restricted'
    personalizationReason = 'support_required'
    recommendationReason = 'show_support_only'
    nextBestActionLabel = 'サポートへ相談する'
    nextBestActionHref = '/support'
  } else {
    campaignEligibilityState = 'eligible'
    seasonalEligibilityState = 'teaser'
    seasonalPerkState = 'teaser'
    offerVisibilityState = 'teaser'
    contentPriorityState = 'default'
    recommendationState = 'lifecycle'
    campaignWindowState = 'opening'
    eligibilityReason = 'join_prompt_target'
    personalizationReason = 'basic_non_member'
    recommendationReason = 'show_join_value'
    nextBestActionLabel = '会員特典を確認する'
    nextBestActionHref = '/fanclub/join'
  }

  if (user.billingState === 'failed' || user.subscriptionState === 'past_due') {
    campaignEligibilityState = campaignEligibilityState === 'excluded' ? 'excluded' : 'cooldown'
    campaignWindowState = 'cooldown'
    eligibilityReason = 'billing_recovery_needed'
    recommendationReason = 'payment_fix_before_offer'
    nextBestActionLabel = 'お支払い状況を確認する'
    nextBestActionHref = '/member'
  }

  if (isGrace && campaignEligibilityState !== 'excluded') {
    offerVisibilityState = 'emphasized'
  }

  return {
    sourceSite,
    lifecycleStage: lifecycle.lifecycleStage,
    membershipStatus: user.membershipStatus,
    entitlementState: user.entitlementState,
    subscriptionState: user.subscriptionState,
    billingState: user.billingState,
    memberRankState: progress.memberRankState,
    missionState: progress.missionState,
    perkState: progress.perkState,
    campaignEligibilityState,
    seasonalEligibilityState,
    seasonalPerkState,
    personalizationState: mapPersonalizationState(benefit.personalizationState),
    offerVisibilityState,
    contentPriorityState,
    recommendationState,
    campaignWindowState,
    eligibilityReason,
    personalizationReason,
    recommendationReason,
    nextBestActionLabel,
    nextBestActionHref,
    rejoinRecommended: isExpired,
    lastOfferShownAt: lifecycle.lastRetentionMessageAt,
    lastSeasonalPromptAt: lifecycle.lastBenefitPromptAt,
    lastRecommendationRefreshAt: lifecycle.lastMemberValueShownAt,
  }
}
