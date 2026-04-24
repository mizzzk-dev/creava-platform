import type { SourceSite } from '@/types'

export type PolicyState = 'draft' | 'under_review' | 'approved' | 'active' | 'paused' | 'deprecated' | 'rolled_back'
export type PublishState = 'not_published' | 'staged' | 'partially_published' | 'fully_published' | 'suppressed'
export type PolicyDraftState = 'none' | 'drafting' | 'ready_for_review' | 'stale'
export type PolicyReviewState = 'not_started' | 'in_review' | 'approved' | 'rejected' | 'changes_requested'
export type PolicyApprovalState = 'pending' | 'approved' | 'rejected' | 'expired'
export type ApprovalActorState = 'unassigned' | 'reviewer_assigned' | 'approver_assigned' | 'approved_by_human'
export type PolicyActivationState = 'not_scheduled' | 'scheduled' | 'staged_rollout' | 'active' | 'disabled'
export type PolicyEffectivenessState = 'unknown' | 'effective' | 'watch' | 'ineffective'
export type ExperimentState = 'none' | 'draft' | 'running' | 'paused' | 'completed' | 'stopped' | 'invalidated'
export type ExperimentVariantState = 'control' | 'locale_retrieval_tuned' | 'translation_reuse_tuned' | 'policy_template_tuned'
export type ExperimentGuardrailState = 'not_configured' | 'healthy' | 'warning' | 'breached' | 'auto_paused_like'
export type GuardrailState = 'not_configured' | 'healthy' | 'warning' | 'breached'
export type GuardrailBreachState = 'none' | 'suspected' | 'detected' | 'confirmed'
export type MultilingualSafetyState = 'not_checked' | 'safe' | 'review_needed' | 'blocked' | 'degraded_like'
export type MultilingualSafetyReviewState = 'not_started' | 'queued' | 'in_review' | 'approved' | 'changes_requested' | 'blocked'
export type TranslationSafetyState = 'healthy' | 'warning' | 'risky' | 'blocked'
export type RollbackState = 'not_needed' | 'prepared' | 'recommended' | 'running' | 'completed' | 'failed'
export type RollbackPreparednessState = 'not_ready' | 'ready' | 'stale' | 'missing'
export type SuppressionState = 'none' | 'suggested' | 'suppressed' | 'released'
export type AuditState = 'not_recorded' | 'recorded' | 'reviewed' | 'anomaly_detected'
export type AuditEventState = 'proposal_logged' | 'approval_logged' | 'publish_logged' | 'rollback_logged' | 'guardrail_logged' | 'safety_review_logged'
export type AuditTrailState = 'missing' | 'partial' | 'complete'
export type AuditVisibilityState = 'internal_only' | 'support_only' | 'ops_and_support'
export type LocaleImpactState = 'not_evaluated' | 'low' | 'medium' | 'high' | 'critical'
export type ChangeRiskState = 'low' | 'medium' | 'high' | 'critical'
export type LocaleRolloutState = 'not_started' | 'shadow' | 'limited' | 'full' | 'rolled_back'
export type RegressionState = 'none' | 'suspected' | 'detected' | 'confirmed' | 'mitigated'
export type IncidentLinkageState = 'none' | 'known_issue_linked' | 'incident_linked' | 'maintenance_linked'
export type RecommendationState = 'active' | 'monitoring' | 'suppressed'
export type ArticleState = 'draft' | 'review_pending' | 'published' | 'suppressed'
export type LocaleRecommendationState = 'default' | 'locale_tuned' | 'fallback_used' | 'rollback_candidate'
export type RegionalPolicyTemplateState = 'draft' | 'under_review' | 'active' | 'deprecated'

export interface SupportPolicyGovernanceSummary {
  supportPolicySummary: string
  sourceSite: SourceSite
  policyState: PolicyState
  publishState: PublishState
  policyDraftState: PolicyDraftState
  policyReviewState: PolicyReviewState
  policyApprovalState: PolicyApprovalState
  approvalReason: string
  approvalActorState: ApprovalActorState
  policyActivationState: PolicyActivationState
  policyEffectivenessState: PolicyEffectivenessState
  experimentState: ExperimentState
  experimentVariantState: ExperimentVariantState
  experimentGuardrailState: ExperimentGuardrailState
  guardrailState: GuardrailState
  guardrailBreachState: GuardrailBreachState
  guardrailReason: string
  multilingualSafetyState: MultilingualSafetyState
  multilingualSafetyReviewState: MultilingualSafetyReviewState
  translationSafetyState: TranslationSafetyState
  rollbackState: RollbackState
  suppressionState: SuppressionState
  rollbackReason: string
  rollbackPreparednessState: RollbackPreparednessState
  auditState: AuditState
  auditEventState: AuditEventState
  auditTrailState: AuditTrailState
  auditVisibilityState: AuditVisibilityState
  localeImpactState: LocaleImpactState
  localeRolloutState: LocaleRolloutState
  changeRiskState: ChangeRiskState
  regressionState: RegressionState
  incidentLinkageState: IncidentLinkageState
  recommendationState: RecommendationState
  articleState: ArticleState
  localeRecommendationState: LocaleRecommendationState
  regionalPolicyTemplateState: RegionalPolicyTemplateState
  policyLastReviewedAt: string
  policyLastActivatedAt: string
  policyLastRolledBackAt: string | null
  policyLastAuditedAt: string
}

export function buildSupportPolicyGovernanceSummary(params: {
  sourceSite: SourceSite
  searchResultCount: number
  localeFallbackState: string
  retrievalQualityState: string
  glossaryConsistencyState: string
  localeEffectivenessState: string
  regionalPolicyTemplateState: RegionalPolicyTemplateState
}): SupportPolicyGovernanceSummary {
  const now = new Date().toISOString()
  const lowConfidence = params.searchResultCount <= 2 || params.retrievalQualityState === 'needs_tuning'
  const degraded = params.retrievalQualityState === 'risky' || params.glossaryConsistencyState === 'inconsistent'
  const reviewNeeded = params.localeEffectivenessState === 'review_needed' || params.localeFallbackState !== 'not_needed'

  return {
    supportPolicySummary: `${params.sourceSite}:${params.regionalPolicyTemplateState}:${degraded ? 'degraded_like' : reviewNeeded ? 'review_needed' : 'safe'}`,
    sourceSite: params.sourceSite,
    policyState: degraded ? 'under_review' : 'active',
    publishState: degraded ? 'staged' : 'fully_published',
    policyDraftState: reviewNeeded ? 'ready_for_review' : 'none',
    policyReviewState: degraded ? 'changes_requested' : reviewNeeded ? 'in_review' : 'approved',
    policyApprovalState: degraded ? 'pending' : 'approved',
    approvalReason: degraded ? 'guardrail breach のため再承認が必要' : 'latest approved policy version',
    approvalActorState: degraded ? 'approver_assigned' : 'approved_by_human',
    policyActivationState: degraded ? 'staged_rollout' : 'active',
    policyEffectivenessState: degraded ? 'watch' : lowConfidence ? 'unknown' : 'effective',
    experimentState: degraded ? 'paused' : lowConfidence ? 'running' : 'completed',
    experimentVariantState: lowConfidence ? 'locale_retrieval_tuned' : 'control',
    experimentGuardrailState: degraded ? 'breached' : lowConfidence ? 'warning' : 'healthy',
    guardrailState: degraded ? 'breached' : lowConfidence ? 'warning' : 'healthy',
    guardrailBreachState: degraded ? 'confirmed' : lowConfidence ? 'suspected' : 'none',
    guardrailReason: degraded ? 'retrieval/glossary quality degraded' : lowConfidence ? 'low confidence locale ranking' : 'no critical issue',
    multilingualSafetyState: degraded ? 'review_needed' : reviewNeeded ? 'review_needed' : 'safe',
    multilingualSafetyReviewState: degraded ? 'in_review' : reviewNeeded ? 'queued' : 'approved',
    translationSafetyState: degraded ? 'risky' : reviewNeeded ? 'warning' : 'healthy',
    rollbackState: degraded ? 'recommended' : 'prepared',
    suppressionState: degraded ? 'suggested' : 'none',
    rollbackReason: degraded ? 'locale quality degradation detected' : 'rollback plan maintained for staged rollout',
    rollbackPreparednessState: 'ready',
    auditState: 'recorded',
    auditEventState: degraded ? 'guardrail_logged' : 'approval_logged',
    auditTrailState: 'complete',
    auditVisibilityState: 'ops_and_support',
    localeImpactState: degraded ? 'high' : reviewNeeded ? 'medium' : 'low',
    localeRolloutState: degraded ? 'limited' : 'full',
    changeRiskState: degraded ? 'high' : lowConfidence ? 'medium' : 'low',
    regressionState: degraded ? 'detected' : lowConfidence ? 'suspected' : 'none',
    incidentLinkageState: degraded ? 'known_issue_linked' : 'none',
    recommendationState: degraded ? 'monitoring' : 'active',
    articleState: degraded ? 'review_pending' : 'published',
    localeRecommendationState: degraded ? 'rollback_candidate' : reviewNeeded ? 'fallback_used' : 'locale_tuned',
    regionalPolicyTemplateState: params.regionalPolicyTemplateState,
    policyLastReviewedAt: now,
    policyLastActivatedAt: now,
    policyLastRolledBackAt: null,
    policyLastAuditedAt: now,
  }
}

export function buildPolicyGovernanceQueryParams(summary: SupportPolicyGovernanceSummary): Record<string, string> {
  return {
    policy_state: summary.policyState,
    publish_state: summary.publishState,
    policy_draft_state: summary.policyDraftState,
    policy_review_state: summary.policyReviewState,
    policy_approval_state: summary.policyApprovalState,
    approval_reason: summary.approvalReason,
    approval_actor_state: summary.approvalActorState,
    policy_activation_state: summary.policyActivationState,
    policy_effectiveness_state: summary.policyEffectivenessState,
    experiment_state: summary.experimentState,
    experiment_variant_state: summary.experimentVariantState,
    experiment_guardrail_state: summary.experimentGuardrailState,
    guardrail_state: summary.guardrailState,
    guardrail_breach_state: summary.guardrailBreachState,
    guardrail_reason: summary.guardrailReason,
    multilingual_safety_state: summary.multilingualSafetyState,
    multilingual_safety_review_state: summary.multilingualSafetyReviewState,
    translation_safety_state: summary.translationSafetyState,
    rollback_state: summary.rollbackState,
    suppression_state: summary.suppressionState,
    rollback_reason: summary.rollbackReason,
    rollback_preparedness_state: summary.rollbackPreparednessState,
    audit_state: summary.auditState,
    audit_event_state: summary.auditEventState,
    audit_trail_state: summary.auditTrailState,
    audit_visibility_state: summary.auditVisibilityState,
    locale_impact_state: summary.localeImpactState,
    locale_rollout_state: summary.localeRolloutState,
    change_risk_state: summary.changeRiskState,
    regression_state: summary.regressionState,
    incident_linkage_state: summary.incidentLinkageState,
    recommendation_state: summary.recommendationState,
    article_state: summary.articleState,
    locale_recommendation_state: summary.localeRecommendationState,
    regional_policy_template_state: summary.regionalPolicyTemplateState,
    policy_last_reviewed_at: summary.policyLastReviewedAt,
    policy_last_activated_at: summary.policyLastActivatedAt,
    policy_last_rolled_back_at: summary.policyLastRolledBackAt ?? '',
    policy_last_audited_at: summary.policyLastAuditedAt,
  }
}
