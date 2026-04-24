import type { SourceSite } from '@/types'
import type { HelpKnowledgeCandidate } from '@/modules/support/conversationalHelp'
import type { ProactiveRecommendation, ProactiveSupportSummary } from '@/modules/support/proactiveSupport'

export type CandidateSetState = 'empty' | 'generated' | 'filtered' | 'ranked'
export type RankingState = 'not_ranked' | 'ranked' | 'low_confidence' | 'fallback_rule_applied' | 'manual_override'
export type RankingReason =
  | 'known_issue_priority'
  | 'semantic_retrieval_match'
  | 'category_lifecycle_bias'
  | 'low_confidence_fallback'
  | 'member_state_priority'
export type OrchestrationState = 'not_started' | 'active' | 'branching' | 'completed' | 'suppressed' | 'failed'
export type OrchestrationPolicyState = 'default' | 'issue_first' | 'assistant_first' | 'handoff_accelerated' | 'manual_review'
export type LifecycleAwareState = 'none' | 'guest_journey' | 'onboarding_like' | 'membership_like' | 'grace_like' | 'expired_like' | 'high_risk_journey'
export type ExperimentState = 'none' | 'draft' | 'running' | 'paused' | 'completed' | 'invalidated'
export type ExperimentVariantState = 'control' | 'issue_first' | 'assistant_first' | 'handoff_first'
export type PolicyState = 'inactive' | 'active' | 'under_review' | 'deprecated'
export type PolicyEffectivenessState = 'unknown' | 'effective' | 'watch' | 'ineffective'
export type RecommendationFeedbackState = 'none' | 'helpful' | 'not_helpful' | 'dismissed'

export interface ProactiveOptimizationSummary {
  rankingState: RankingState
  rankingReason: RankingReason
  candidateSetState: CandidateSetState
  orchestrationState: OrchestrationState
  orchestrationPolicyState: OrchestrationPolicyState
  lifecycleAwareState: LifecycleAwareState
  experimentState: ExperimentState
  experimentVariantState: ExperimentVariantState
  policyState: PolicyState
  policyEffectivenessState: PolicyEffectivenessState
  recommendationFeedbackState: RecommendationFeedbackState
  policyLastEvaluatedAt: string
  recommendationLastRankedAt: string
}

function resolveLifecycleAwareState(summary: ProactiveSupportSummary): LifecycleAwareState {
  if (summary.userContextState === 'guest') return 'guest_journey'
  if (summary.userContextState === 'grace') return 'grace_like'
  if (summary.userContextState === 'expired') return 'expired_like'
  if (summary.userContextState === 'member') return 'membership_like'
  if (summary.userContextState === 'high_risk_journey') return 'high_risk_journey'
  return 'onboarding_like'
}

function resolveExperimentVariant(lifecycleAwareState: LifecycleAwareState, hasKnownIssue: boolean): ExperimentVariantState {
  if (hasKnownIssue) return 'issue_first'
  if (lifecycleAwareState === 'guest_journey') return 'assistant_first'
  if (lifecycleAwareState === 'expired_like' || lifecycleAwareState === 'high_risk_journey') return 'handoff_first'
  return 'control'
}

export function rankProactiveRecommendations(params: {
  sourceSite: SourceSite
  category: string
  summary: ProactiveSupportSummary
  candidates: HelpKnowledgeCandidate[]
  recommendations: ProactiveRecommendation[]
}): { ranked: ProactiveRecommendation[]; optimization: ProactiveOptimizationSummary } {
  const lifecycleAwareState = resolveLifecycleAwareState(params.summary)
  const hasKnownIssue = params.candidates.some((item) => item.type === 'known_issue')
  const now = new Date().toISOString()

  const ranked = [...params.recommendations].sort((a, b) => {
    const scoreMap = { low: 1, medium: 2, high: 3 } as const
    const typeWeight = (type: ProactiveRecommendation['recommendationType']) => {
      if (hasKnownIssue && type === 'known_issue') return 100
      if (lifecycleAwareState === 'guest_journey' && type === 'assistant') return 80
      if ((lifecycleAwareState === 'expired_like' || lifecycleAwareState === 'high_risk_journey') && type === 'handoff') return 70
      if (type === 'article') return 60
      if (type === 'troubleshooting') return 50
      if (type === 'assistant') return 45
      if (type === 'handoff') return 35
      return 20
    }

    return (typeWeight(b.recommendationType) + scoreMap[b.recommendationScoreState])
      - (typeWeight(a.recommendationType) + scoreMap[a.recommendationScoreState])
  })

  const rankingState: RankingState = params.summary.recommendationScoreState === 'low' ? 'low_confidence' : 'ranked'
  const rankingReason: RankingReason = hasKnownIssue
    ? 'known_issue_priority'
    : rankingState === 'low_confidence'
      ? 'low_confidence_fallback'
      : lifecycleAwareState === 'membership_like'
        ? 'member_state_priority'
        : 'semantic_retrieval_match'

  const orchestrationPolicyState: OrchestrationPolicyState = hasKnownIssue
    ? 'issue_first'
    : lifecycleAwareState === 'guest_journey'
      ? 'assistant_first'
      : lifecycleAwareState === 'expired_like' || lifecycleAwareState === 'high_risk_journey'
        ? 'handoff_accelerated'
        : 'default'

  return {
    ranked: ranked.slice(0, 4),
    optimization: {
      candidateSetState: params.candidates.length > 0 ? 'ranked' : 'empty',
      rankingState,
      rankingReason,
      orchestrationState: params.summary.recommendationState === 'suppressed' ? 'suppressed' : 'active',
      orchestrationPolicyState,
      lifecycleAwareState,
      experimentState: 'running',
      experimentVariantState: resolveExperimentVariant(lifecycleAwareState, hasKnownIssue),
      policyState: 'active',
      policyEffectivenessState: 'unknown',
      recommendationFeedbackState: 'none',
      policyLastEvaluatedAt: now,
      recommendationLastRankedAt: now,
    },
  }
}

export function buildOptimizationQueryParams(summary: ProactiveOptimizationSummary): Record<string, string> {
  return {
    ranking_state: summary.rankingState,
    ranking_reason: summary.rankingReason,
    candidate_set_state: summary.candidateSetState,
    orchestration_state: summary.orchestrationState,
    orchestration_policy_state: summary.orchestrationPolicyState,
    lifecycle_aware_state: summary.lifecycleAwareState,
    experiment_state: summary.experimentState,
    experiment_variant_state: summary.experimentVariantState,
    policy_state: summary.policyState,
    policy_effectiveness_state: summary.policyEffectivenessState,
  }
}
