import type { SourceSite } from '@/types'

export type PolicyState = 'draft' | 'under_review' | 'approved' | 'active' | 'paused' | 'deprecated' | 'rolled_back'
export type PolicyDraftState = 'none' | 'drafting' | 'ready_for_review' | 'stale'
export type PolicyReviewState = 'not_started' | 'in_review' | 'approved' | 'rejected' | 'changes_requested'
export type PolicyApprovalState = 'pending' | 'approved' | 'rejected' | 'expired'
export type PolicyActivationState = 'not_scheduled' | 'scheduled' | 'staged_rollout' | 'active' | 'disabled'
export type PolicyEffectivenessState = 'unknown' | 'effective' | 'watch' | 'ineffective'
export type ExperimentState = 'none' | 'draft' | 'running' | 'paused' | 'completed' | 'stopped' | 'invalidated'
export type ExperimentVariantState = 'control' | 'locale_retrieval_tuned' | 'translation_reuse_tuned' | 'policy_template_tuned'
export type ExperimentGuardrailState = 'not_configured' | 'healthy' | 'warning' | 'breached' | 'auto_paused_like'
export type GuardrailState = 'not_configured' | 'healthy' | 'warning' | 'breached'
export type MultilingualSafetyState = 'not_checked' | 'safe' | 'review_needed' | 'blocked' | 'degraded_like'
export type MultilingualSafetyReviewState = 'not_started' | 'queued' | 'in_review' | 'approved' | 'changes_requested' | 'blocked'
export type RollbackState = 'not_needed' | 'prepared' | 'recommended' | 'running' | 'completed' | 'failed'
export type RollbackPreparednessState = 'not_ready' | 'ready' | 'stale' | 'missing'
export type AuditState = 'not_recorded' | 'recorded' | 'reviewed' | 'anomaly_detected'
export type AuditTrailState = 'missing' | 'partial' | 'complete'
export type AuditVisibilityState = 'internal_only' | 'support_only' | 'ops_and_support'
export type LocaleImpactState = 'not_evaluated' | 'low' | 'medium' | 'high' | 'critical'
export type ChangeRiskState = 'low' | 'medium' | 'high' | 'critical'
export type RegionalPolicyTemplateState = 'draft' | 'under_review' | 'active' | 'deprecated'

export interface SupportPolicyGovernanceSummary {
  supportPolicySummary: string
  sourceSite: SourceSite
  policyState: PolicyState
  policyDraftState: PolicyDraftState
  policyReviewState: PolicyReviewState
  policyApprovalState: PolicyApprovalState
  policyActivationState: PolicyActivationState
  policyEffectivenessState: PolicyEffectivenessState
  experimentState: ExperimentState
  experimentVariantState: ExperimentVariantState
  experimentGuardrailState: ExperimentGuardrailState
  guardrailState: GuardrailState
  guardrailReason: string
  multilingualSafetyState: MultilingualSafetyState
  multilingualSafetyReviewState: MultilingualSafetyReviewState
  rollbackState: RollbackState
  rollbackReason: string
  rollbackPreparednessState: RollbackPreparednessState
  auditState: AuditState
  auditTrailState: AuditTrailState
  auditVisibilityState: AuditVisibilityState
  localeImpactState: LocaleImpactState
  changeRiskState: ChangeRiskState
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
    policyDraftState: reviewNeeded ? 'ready_for_review' : 'none',
    policyReviewState: degraded ? 'changes_requested' : reviewNeeded ? 'in_review' : 'approved',
    policyApprovalState: degraded ? 'pending' : 'approved',
    policyActivationState: degraded ? 'staged_rollout' : 'active',
    policyEffectivenessState: degraded ? 'watch' : lowConfidence ? 'unknown' : 'effective',
    experimentState: degraded ? 'paused' : lowConfidence ? 'running' : 'completed',
    experimentVariantState: lowConfidence ? 'locale_retrieval_tuned' : 'control',
    experimentGuardrailState: degraded ? 'breached' : lowConfidence ? 'warning' : 'healthy',
    guardrailState: degraded ? 'breached' : lowConfidence ? 'warning' : 'healthy',
    guardrailReason: degraded ? 'retrieval/glossary quality degraded' : lowConfidence ? 'low confidence locale ranking' : 'no critical issue',
    multilingualSafetyState: degraded ? 'review_needed' : reviewNeeded ? 'review_needed' : 'safe',
    multilingualSafetyReviewState: degraded ? 'in_review' : reviewNeeded ? 'queued' : 'approved',
    rollbackState: degraded ? 'recommended' : 'prepared',
    rollbackReason: degraded ? 'locale quality degradation detected' : 'rollback plan maintained for staged rollout',
    rollbackPreparednessState: 'ready',
    auditState: 'recorded',
    auditTrailState: 'complete',
    auditVisibilityState: 'ops_and_support',
    localeImpactState: degraded ? 'high' : reviewNeeded ? 'medium' : 'low',
    changeRiskState: degraded ? 'high' : lowConfidence ? 'medium' : 'low',
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
    policy_draft_state: summary.policyDraftState,
    policy_review_state: summary.policyReviewState,
    policy_approval_state: summary.policyApprovalState,
    policy_activation_state: summary.policyActivationState,
    policy_effectiveness_state: summary.policyEffectivenessState,
    experiment_state: summary.experimentState,
    experiment_variant_state: summary.experimentVariantState,
    experiment_guardrail_state: summary.experimentGuardrailState,
    guardrail_state: summary.guardrailState,
    guardrail_reason: summary.guardrailReason,
    multilingual_safety_state: summary.multilingualSafetyState,
    multilingual_safety_review_state: summary.multilingualSafetyReviewState,
    rollback_state: summary.rollbackState,
    rollback_reason: summary.rollbackReason,
    rollback_preparedness_state: summary.rollbackPreparednessState,
    audit_state: summary.auditState,
    audit_trail_state: summary.auditTrailState,
    audit_visibility_state: summary.auditVisibilityState,
    locale_impact_state: summary.localeImpactState,
    change_risk_state: summary.changeRiskState,
    regional_policy_template_state: summary.regionalPolicyTemplateState,
    policy_last_reviewed_at: summary.policyLastReviewedAt,
    policy_last_activated_at: summary.policyLastActivatedAt,
    policy_last_rolled_back_at: summary.policyLastRolledBackAt ?? '',
    policy_last_audited_at: summary.policyLastAuditedAt,
  }
}
