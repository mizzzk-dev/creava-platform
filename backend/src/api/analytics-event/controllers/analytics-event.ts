import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'
import { requireInternalPermission } from '../../../lib/auth/internal-access'

const OPS_TOKEN = process.env.ANALYTICS_OPS_TOKEN ?? process.env.INQUIRY_OPS_TOKEN ?? ''
const SALT = process.env.ANALYTICS_IP_HASH_SALT ?? process.env.INQUIRY_IP_HASH_SALT ?? 'mizzz-analytics'
const BI_DEFAULT_RANGE_DAYS = Number(process.env.BI_DEFAULT_RANGE_DAYS ?? 30)
const BI_MAX_FETCH_ROWS = Number(process.env.BI_MAX_FETCH_ROWS ?? 10000)
const BI_ALERT_MIN_VOLUME = Number(process.env.BI_ALERT_MIN_VOLUME ?? 20)
const BI_ALERT_DROP_RATIO = Number(process.env.BI_ALERT_DROP_RATIO ?? 0.2)
const BI_ALERT_SPIKE_RATIO = Number(process.env.BI_ALERT_SPIKE_RATIO ?? 0.35)
const BI_FORECAST_HORIZON_DAYS = Number(process.env.BI_FORECAST_HORIZON_DAYS ?? 14)
const PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD = Number(process.env.PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD ?? 200)
const PLAYBOOK_SAFE_MODE_DEFAULT = String(process.env.PLAYBOOK_SAFE_MODE_DEFAULT ?? 'true').toLowerCase() !== 'false'
const PLAYBOOK_RETRY_LIMIT = Number(process.env.PLAYBOOK_RETRY_LIMIT ?? 3)
const STATUS_PUBLIC_HISTORY_LIMIT = Number(process.env.STATUS_PUBLIC_HISTORY_LIMIT ?? 10)

const ALLOWED_EVENTS = new Set([
  'page_view', 'cta_click', 'nav_click', 'hero_click', 'card_click',
  'product_view', 'product_favorite_add', 'product_favorite_remove',
  'content_view', 'content_favorite_add', 'history_viewed',
  'notification_open', 'notification_click',
  'notification_preference_open', 'notification_preference_update',
  'email_opt_in', 'email_opt_out', 'in_app_opt_in', 'in_app_opt_out',
  'lifecycle_notification_impression', 'lifecycle_notification_click',
  'email_message_sent', 'email_message_failed', 'email_link_click',
  'notification_center_open', 'welcome_flow_complete', 'retention_nudge_click',
  'favorite_based_revisit', 'fc_update_revisit', 'campaign_message_click',
  'dormant_user_reactivation', 'unsubscribe_click',
  'search_open', 'search_submit', 'search_result_click', 'search_no_result',
  'filter_apply', 'sort_apply',
  'recommendation_impression', 'recommendation_click', 'related_content_click',
  'recent_history_click', 'favorite_based_click', 'notification_based_click',
  'support_search', 'faq_open', 'guide_open',
  'help_hub_view', 'help_search_query', 'help_search_no_result', 'help_article_view', 'help_article_feedback', 'self_service_deflection',
  'proactive_intervention_evaluated', 'proactive_intervention_click', 'proactive_intervention_feedback', 'proactive_intervention_shown',
  'proactive_ranking_logged', 'proactive_policy_evaluated',
  'form_start', 'form_confirm', 'form_submit_success', 'form_submit_failure',
  'login_click', 'signup_click', 'login_success',
  'theme_toggle', 'locale_switch',
  'cart_click', 'join_click', 'event_calendar_click',
  'campaign_click', 'error_state_view', 'retry_click', 'empty_state_view', 'api_failure',
  'renewal_banner_view', 'renewal_cta_click', 'renewal_summary_view',
  'grace_notice_view', 'grace_recovery_cta_click', 'payment_fix_cta_click',
  'rejoin_banner_view', 'rejoin_cta_click', 'reactivation_success',
  'member_value_block_view', 'renewal_help_click', 'support_from_renewal_state',
  'lifecycle_message_sent', 'lifecycle_message_clicked', 'winback_offer_view', 'winback_offer_click',
  'notification_center_view', 'inbox_summary_view', 'message_detail_view', 'message_mark_read', 'message_archive', 'message_dismiss',
  'unread_badge_click', 'important_notice_view', 'important_notice_cta_click', 'lifecycle_message_view', 'lifecycle_message_cta_click',
  'campaign_message_view', 'campaign_message_cta_click', 'notification_settings_view', 'notification_settings_save', 'support_from_notification_center',
  'operations_dashboard_view', 'queue_summary_view', 'anomaly_summary_view', 'reconciliation_summary_view', 'playbook_summary_view',
  'queue_drilldown_open', 'anomaly_drilldown_open', 'reconciliation_drilldown_open',
  'playbook_start', 'playbook_complete',
  'safe_retry_start', 'safe_retry_complete',
  'resync_start', 'resync_complete',
  'resend_start', 'resend_complete',
  'related_user360_open', 'related_case_open',
  'incident_dashboard_view', 'alert_list_view', 'alert_acknowledge', 'alert_group_open',
  'incident_open', 'incident_assign', 'incident_resolve',
  'approval_request_create', 'approval_request_approve', 'approval_request_reject',
  'batch_preview_view', 'batch_dry_run_start', 'batch_dry_run_complete',
  'batch_execute_start', 'batch_execute_complete',
  'escalation_start', 'escalation_complete',
  'status_page_view', 'maintenance_notice_view', 'active_incident_view',
  'recovery_notice_view', 'resolved_notice_view', 'postmortem_view',
  'status_cta_support_click', 'status_cta_notification_click',
  'incident_notice_banner_view', 'incident_notice_banner_click',
  'maintenance_schedule_publish', 'incident_status_publish', 'recovery_status_publish',
  'postmortem_publish', 'knowledge_article_from_incident_open', 'related_support_article_open',
  'release_dashboard_view', 'release_summary_view', 'parity_check_run', 'parity_check_result_view',
  'migration_risk_view', 'rollout_start', 'rollout_pause', 'rollout_resume', 'rollout_complete',
  'verification_start', 'verification_complete', 'rollback_preview_view', 'rollback_execute_start',
  'rollback_execute_complete', 'hotfix_start', 'freeze_exception_request', 'release_note_publish',
  'related_incident_open',
  'flag_dashboard_view', 'flag_summary_view', 'flag_evaluation_view',
  'support_policy_dashboard_view', 'support_policy_review_queue_view', 'support_policy_rollback_execute',
  'rollout_percentage_change', 'staged_rollout_start', 'staged_rollout_pause', 'staged_rollout_resume',
  'experiment_start', 'experiment_pause', 'experiment_complete', 'experiment_stop',
  'kill_switch_preview_view', 'kill_switch_trigger_start', 'kill_switch_trigger_complete',
  'exposure_reason_view',
  'analytics_dashboard_view', 'event_taxonomy_reference_view', 'funnel_summary_view', 'attribution_summary_view', 'experiment_summary_view',
  'exposure_event_logged', 'conversion_event_logged', 'experiment_outcome_logged', 'event_validation_run', 'schema_drift_detected',
  'duplicate_event_detected', 'identity_merge_review_open', 'analytics_runbook_open',
])

function sanitizeText(value: unknown, maxLength = 120): string | undefined {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  if (!text) return undefined
  return text.slice(0, maxLength)
}

function sanitizeSourceSite(value: unknown): 'main' | 'store' | 'fc' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'main' || v === 'store' || v === 'fc') return v
  return 'unknown'
}

function sanitizeTheme(value: unknown): 'light' | 'dark' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'light' || v === 'dark') return v
  return 'unknown'
}

function sanitizeUserState(value: unknown): 'guest' | 'logged_in' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'guest' || v === 'logged_in') return v
  return 'unknown'
}

function sanitizeDeviceType(value: unknown): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'mobile' || v === 'tablet' || v === 'desktop') return v
  return 'unknown'
}

function sanitizeReferrerType(value: unknown): 'direct' | 'internal' | 'external' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'direct' || v === 'internal' || v === 'external') return v
  return 'unknown'
}

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`${ip}:${SALT}`).digest('hex')
}

function requireOpsToken(ctx: any): boolean {
  if (!OPS_TOKEN) {
    ctx.unauthorized('ANALYTICS_OPS_TOKEN が未設定です。')
    return false
  }

  const token = String(ctx.request.headers['x-analytics-ops-token'] ?? '')
  if (token !== OPS_TOKEN) {
    ctx.unauthorized('ops token が不正です。')
    return false
  }
  return true
}

function parseDateInput(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function numberValue(value: unknown): number {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num : 0
}

function toIsoDay(value: unknown): string {
  const date = parseDateInput(value)
  if (!date) return 'unknown'
  return date.toISOString().slice(0, 10)
}

function toIsoMonth(value: unknown): string {
  const date = parseDateInput(value)
  if (!date) return 'unknown'
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function withinRange(value: unknown, from: Date, to: Date): boolean {
  const date = parseDateInput(value)
  if (!date) return false
  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime()
}

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
}

function toCsvRow(values: unknown[]): string {
  return values.map(toCsvCell).join(',')
}

function movingAverage(values: number[], window = 7): number[] {
  if (values.length === 0) return []
  return values.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = values.slice(start, index + 1)
    return slice.reduce((acc, item) => acc + item, 0) / slice.length
  })
}

function safeRatio(current: number, base: number): number {
  if (base <= 0) return 0
  return (current - base) / base
}

function toSeverity(delta: number): 'low' | 'medium' | 'high' {
  const absolute = Math.abs(delta)
  if (absolute >= 0.35) return 'high'
  if (absolute >= 0.2) return 'medium'
  return 'low'
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function sumBy<T>(rows: T[], getter: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + getter(row), 0)
}

function toPriority(severity: string, count: number): 'critical' | 'high' | 'medium' | 'low' {
  if (severity === 'critical' || count >= 40) return 'critical'
  if (severity === 'high' || count >= 20) return 'high'
  if (severity === 'medium' || count >= 8) return 'medium'
  return 'low'
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toSummaryLogState(status: string): string {
  if (status === 'failed' || status === 'denied') return 'failed'
  if (status === 'pending') return 'pending'
  return 'completed'
}

function getActionPrefix(action: unknown): string {
  const text = String(action ?? '')
  const index = text.indexOf(':')
  return index >= 0 ? text.slice(0, index) : text
}


type CommunicationItem = {
  incidentId: string
  communicationType: string
  statusState: string
  statusSeverity: string
  publishingState: string
  incidentCommunicationPhase: string
  impactSummaryState: string
  affectedAreaState: string[]
  userActionRecommendationState: string
  sourceArea: string
  sourceSite: string
  publicTitle: string
  publicSummary: string
  publishedAt: string | null
  recoveryAnnouncedAt: string | null
  postmortemPublishedAt: string | null
  lastUpdatedAt: string | null
  nextUpdateAt: string | null
  postmortemState: string
  rcaState: string
  rootCauseCategory: string
  correctiveActionState: string
  preventionActionState: string
  knowledgeArticleState: string
  knowledgeSummary: string
}

function mapStatusSeverity(statusState: string, incomingSeverity?: string): string {
  if (incomingSeverity) return incomingSeverity
  if (statusState === 'major_outage') return 'critical'
  if (statusState === 'partial_outage') return 'high'
  if (statusState === 'degraded_performance') return 'medium'
  if (statusState.startsWith('maintenance')) return 'low'
  return 'none'
}

type ReleaseAuditItem = {
  releaseId: string
  changeRequestId: string
  sourceSite: string
  releaseState: string
  deploymentState: string
  rolloutState: string
  rollbackState: string
  migrationState: string
  migrationRiskState: string
  environmentParityState: string
  configDriftState: string
  verificationState: string
  smokeCheckState: string
  healthCheckState: string
  freezeState: string
  hotfixState: string
  releaseApprovalState: string
  releaseOwnerState: string
  releaseWindowState: string
  releaseVisibilityState: string
  releaseCommunicationState: string
  nextRecommendedAction: string
  lastVerifiedAt: string | null
  lastRolledBackAt: string | null
  lastParityCheckAt: string | null
  createdAt: string | null
}

type FlagAuditItem = {
  flagKey: string
  sourceSite: string
  sourceArea: string
  featureFlagType: string
  featureFlagState: string
  flagVisibilityState: string
  flagEvaluationState: string
  experimentState: string
  experimentType: string
  variantState: string
  assignmentState: string
  exposureState: string
  audienceRuleState: string
  audienceEligibilityState: string
  rolloutPercentageState: string
  rolloutWindowState: string
  killSwitchState: string
  emergencyDisableState: string
  evaluationReason: string
  lifecycleStage: string
  membershipStatus: string
  entitlementState: string
  subscriptionState: string
  billingState: string
  locale: string
  lastEvaluatedAt: string | null
  lastChangedAt: string | null
  lastDisabledAt: string | null
  nextRecommendedAction: string
}

type SupportPolicyAuditItem = {
  policyId: string
  sourceSite: string
  sourceArea: string
  policySummary: string
  policyState: string
  policyDraftState: string
  policyReviewState: string
  policyApprovalState: string
  policyActivationState: string
  policyEffectivenessState: string
  experimentState: string
  experimentVariantState: string
  experimentGuardrailState: string
  guardrailState: string
  guardrailReason: string
  multilingualSafetyState: string
  multilingualSafetyReviewState: string
  rollbackState: string
  rollbackReason: string
  rollbackPreparednessState: string
  auditState: string
  auditTrailState: string
  auditVisibilityState: string
  localeImpactState: string
  changeRiskState: string
  regionalPolicyTemplateState: string
  policyLastReviewedAt: string | null
  policyLastActivatedAt: string | null
  policyLastRolledBackAt: string | null
  policyLastAuditedAt: string | null
  nextRecommendedAction: string
  createdAt: string | null
}

function toReleaseAuditItem(row: Record<string, unknown>): ReleaseAuditItem {
  const metadata = parseJsonObject(row.metadata)
  return {
    releaseId: String(row.targetId ?? metadata.releaseId ?? `release:${Date.now()}`),
    changeRequestId: String(metadata.changeRequestId ?? metadata.releaseRequestId ?? 'change-request:unknown'),
    sourceSite: String(row.sourceSite ?? metadata.sourceSite ?? 'cross'),
    releaseState: String(metadata.releaseState ?? 'planned'),
    deploymentState: String(metadata.deploymentState ?? 'not_started'),
    rolloutState: String(metadata.rolloutState ?? 'not_started'),
    rollbackState: String(metadata.rollbackState ?? 'not_needed'),
    migrationState: String(metadata.migrationState ?? 'not_started'),
    migrationRiskState: String(metadata.migrationRiskState ?? 'low'),
    environmentParityState: String(metadata.environmentParityState ?? 'review_needed'),
    configDriftState: String(metadata.configDriftState ?? 'unknown'),
    verificationState: String(metadata.verificationState ?? 'pending'),
    smokeCheckState: String(metadata.smokeCheckState ?? 'pending'),
    healthCheckState: String(metadata.healthCheckState ?? 'pending'),
    freezeState: String(metadata.freezeState ?? 'none'),
    hotfixState: String(metadata.hotfixState ?? 'normal'),
    releaseApprovalState: String(metadata.releaseApprovalState ?? 'review_pending'),
    releaseOwnerState: String(metadata.releaseOwnerState ?? 'unassigned'),
    releaseWindowState: String(metadata.releaseWindowState ?? 'normal'),
    releaseVisibilityState: String(metadata.releaseVisibilityState ?? 'internal_only'),
    releaseCommunicationState: String(metadata.releaseCommunicationState ?? 'draft'),
    nextRecommendedAction: String(metadata.nextRecommendedAction ?? 'change request を review してください。'),
    lastVerifiedAt: metadata.lastVerifiedAt ? String(metadata.lastVerifiedAt) : null,
    lastRolledBackAt: metadata.lastRolledBackAt ? String(metadata.lastRolledBackAt) : null,
    lastParityCheckAt: metadata.lastParityCheckAt ? String(metadata.lastParityCheckAt) : null,
    createdAt: row.createdAt ? String(row.createdAt) : null,
  }
}

function toFlagAuditItem(row: Record<string, unknown>): FlagAuditItem {
  const metadata = parseJsonObject(row.metadata)
  return {
    flagKey: String(row.targetId ?? metadata.flagKey ?? `flag:${Date.now()}`),
    sourceSite: String(row.sourceSite ?? metadata.sourceSite ?? 'cross'),
    sourceArea: String(metadata.sourceArea ?? 'runtime-exposure-control'),
    featureFlagType: String(metadata.featureFlagType ?? 'ui_flag'),
    featureFlagState: String(metadata.featureFlagState ?? 'draft'),
    flagVisibilityState: String(metadata.flagVisibilityState ?? 'internal_only'),
    flagEvaluationState: String(metadata.flagEvaluationState ?? 'not_evaluated'),
    experimentState: String(metadata.experimentState ?? 'draft'),
    experimentType: String(metadata.experimentType ?? 'none'),
    variantState: String(metadata.variantState ?? 'control'),
    assignmentState: String(metadata.assignmentState ?? 'not_assigned'),
    exposureState: String(metadata.exposureState ?? 'not_exposed'),
    audienceRuleState: String(metadata.audienceRuleState ?? 'none'),
    audienceEligibilityState: String(metadata.audienceEligibilityState ?? 'unknown'),
    rolloutPercentageState: String(metadata.rolloutPercentageState ?? '0'),
    rolloutWindowState: String(metadata.rolloutWindowState ?? 'always'),
    killSwitchState: String(metadata.killSwitchState ?? 'available'),
    emergencyDisableState: String(metadata.emergencyDisableState ?? 'idle'),
    evaluationReason: String(metadata.evaluationReason ?? 'rule not evaluated yet'),
    lifecycleStage: String(metadata.lifecycleStage ?? 'unknown'),
    membershipStatus: String(metadata.membershipStatus ?? 'unknown'),
    entitlementState: String(metadata.entitlementState ?? 'unknown'),
    subscriptionState: String(metadata.subscriptionState ?? 'unknown'),
    billingState: String(metadata.billingState ?? 'unknown'),
    locale: String(metadata.locale ?? 'all'),
    lastEvaluatedAt: metadata.lastEvaluatedAt ? String(metadata.lastEvaluatedAt) : null,
    lastChangedAt: metadata.lastChangedAt ? String(metadata.lastChangedAt) : null,
    lastDisabledAt: metadata.lastDisabledAt ? String(metadata.lastDisabledAt) : null,
    nextRecommendedAction: String(metadata.nextRecommendedAction ?? 'preview / simulation で評価結果を確認'),
  }
}

function toSupportPolicyAuditItem(row: Record<string, unknown>): SupportPolicyAuditItem {
  const metadata = parseJsonObject(row.metadata)
  return {
    policyId: String(row.targetId ?? metadata.policyId ?? `support-policy:${Date.now()}`),
    sourceSite: String(row.sourceSite ?? metadata.sourceSite ?? 'cross'),
    sourceArea: String(metadata.sourceArea ?? 'support-governance'),
    policySummary: String(metadata.policySummary ?? 'support optimization governance summary'),
    policyState: String(metadata.policyState ?? 'draft'),
    policyDraftState: String(metadata.policyDraftState ?? 'drafting'),
    policyReviewState: String(metadata.policyReviewState ?? 'not_started'),
    policyApprovalState: String(metadata.policyApprovalState ?? 'pending'),
    policyActivationState: String(metadata.policyActivationState ?? 'not_scheduled'),
    policyEffectivenessState: String(metadata.policyEffectivenessState ?? 'unknown'),
    experimentState: String(metadata.experimentState ?? 'none'),
    experimentVariantState: String(metadata.experimentVariantState ?? 'control'),
    experimentGuardrailState: String(metadata.experimentGuardrailState ?? 'not_configured'),
    guardrailState: String(metadata.guardrailState ?? 'not_configured'),
    guardrailReason: String(metadata.guardrailReason ?? 'not evaluated'),
    multilingualSafetyState: String(metadata.multilingualSafetyState ?? 'not_checked'),
    multilingualSafetyReviewState: String(metadata.multilingualSafetyReviewState ?? 'not_started'),
    rollbackState: String(metadata.rollbackState ?? 'not_needed'),
    rollbackReason: String(metadata.rollbackReason ?? 'not required'),
    rollbackPreparednessState: String(metadata.rollbackPreparednessState ?? 'not_ready'),
    auditState: String(metadata.auditState ?? 'not_recorded'),
    auditTrailState: String(metadata.auditTrailState ?? 'missing'),
    auditVisibilityState: String(metadata.auditVisibilityState ?? 'internal_only'),
    localeImpactState: String(metadata.localeImpactState ?? 'not_evaluated'),
    changeRiskState: String(metadata.changeRiskState ?? 'low'),
    regionalPolicyTemplateState: String(metadata.regionalPolicyTemplateState ?? 'draft'),
    policyLastReviewedAt: metadata.policyLastReviewedAt ? String(metadata.policyLastReviewedAt) : null,
    policyLastActivatedAt: metadata.policyLastActivatedAt ? String(metadata.policyLastActivatedAt) : null,
    policyLastRolledBackAt: metadata.policyLastRolledBackAt ? String(metadata.policyLastRolledBackAt) : null,
    policyLastAuditedAt: metadata.policyLastAuditedAt ? String(metadata.policyLastAuditedAt) : null,
    nextRecommendedAction: String(metadata.nextRecommendedAction ?? 'review queue で multilingual safety / locale impact を確認'),
    createdAt: row.createdAt ? String(row.createdAt) : null,
  }
}

function toCommunicationItem(row: Record<string, unknown>): CommunicationItem {
  const metadata = parseJsonObject(row.metadata)
  const affectedAreas = Array.isArray(metadata.affectedAreaState)
    ? metadata.affectedAreaState.map((item) => String(item)).filter(Boolean)
    : []
  const statusState = String(metadata.statusState ?? (metadata.maintenanceState === 'in_progress' ? 'maintenance_in_progress' : 'operational'))
  return {
    incidentId: String(metadata.sourceIncidentId ?? row.targetId ?? ''),
    communicationType: String(metadata.communicationType ?? 'incident_notice'),
    statusState,
    statusSeverity: mapStatusSeverity(statusState, sanitizeText(metadata.statusSeverity, 20)),
    publishingState: String(metadata.publishingState ?? 'draft'),
    incidentCommunicationPhase: String(metadata.incidentCommunicationPhase ?? 'draft'),
    impactSummaryState: String(metadata.impactSummaryState ?? 'limited'),
    affectedAreaState: affectedAreas,
    userActionRecommendationState: String(metadata.userActionRecommendationState ?? '最新情報を確認し、必要に応じてサポートへお問い合わせください。'),
    sourceArea: String(metadata.sourceArea ?? 'operations'),
    sourceSite: String(metadata.sourceSite ?? row.sourceSite ?? 'cross'),
    publicTitle: String(metadata.publicTitle ?? '運用ステータスのお知らせ'),
    publicSummary: String(metadata.publicSummary ?? ''),
    publishedAt: String(metadata.publishedAt ?? row.createdAt ?? ''),
    recoveryAnnouncedAt: String(metadata.recoveryAnnouncedAt ?? ''),
    postmortemPublishedAt: String(metadata.postmortemPublishedAt ?? ''),
    lastUpdatedAt: String(metadata.lastUpdatedAt ?? row.createdAt ?? ''),
    nextUpdateAt: String(metadata.nextUpdateAt ?? ''),
    postmortemState: String(metadata.postmortemState ?? 'not_started'),
    rcaState: String(metadata.rcaState ?? 'not_started'),
    rootCauseCategory: String(metadata.rootCauseCategory ?? 'unknown'),
    correctiveActionState: String(metadata.correctiveActionState ?? 'pending'),
    preventionActionState: String(metadata.preventionActionState ?? 'pending'),
    knowledgeArticleState: String(metadata.knowledgeArticleState ?? 'not_started'),
    knowledgeSummary: String(metadata.knowledgeSummary ?? ''),
  }
}

function pickCurrentStatus(items: CommunicationItem[]): CommunicationItem {
  const ordered = items
    .filter((item) => item.publishingState === 'published')
    .sort((a, b) => (parseDateInput(b.lastUpdatedAt)?.getTime() ?? 0) - (parseDateInput(a.lastUpdatedAt)?.getTime() ?? 0))
  return ordered[0] ?? {
    incidentId: '', communicationType: 'none', statusState: 'operational', statusSeverity: 'none', publishingState: 'published',
    incidentCommunicationPhase: 'closed', impactSummaryState: 'none', affectedAreaState: [],
    userActionRecommendationState: '現在、main / store / fc への大きな影響は確認されていません。',
    sourceArea: 'cross', sourceSite: 'cross', publicTitle: 'All Systems Operational', publicSummary: '',
    publishedAt: null, recoveryAnnouncedAt: null, postmortemPublishedAt: null, lastUpdatedAt: null, nextUpdateAt: null,
    postmortemState: 'not_started', rcaState: 'not_started', rootCauseCategory: 'unknown', correctiveActionState: 'pending', preventionActionState: 'pending', knowledgeArticleState: 'not_started', knowledgeSummary: '',
  }
}

export default factories.createCoreController('api::analytics-event.analytics-event', ({ strapi }) => ({
  async publicTrack(ctx) {
    const body = (ctx.request.body ?? {}) as {
      eventName?: string
      params?: Record<string, unknown>
    }

    const eventName = sanitizeText(body.eventName, 80)
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return ctx.badRequest('eventName が許可されていません。')
    }

    const params = body.params ?? {}
    const sourceSite = sanitizeSourceSite(params.sourceSite)
    const payload = Object.fromEntries(
      Object.entries(params).filter(([key]) => !['email', 'phone', 'name', 'userId', 'accessToken', 'refreshToken'].includes(key)),
    )

    const eventId = sanitizeText(params.eventId, 180)
    if (eventId) {
      const duplicated = await strapi.documents('api::analytics-event.analytics-event').findFirst({
        filters: { eventId: { $eq: eventId } },
        fields: ['id', 'eventId'],
      })
      if (duplicated) {
        ctx.body = { ok: true, deduped: true }
        return
      }
    }

    await strapi.documents('api::analytics-event.analytics-event').create({
      data: {
        eventName,
        sourceSite,
        locale: sanitizeText(params.locale, 12) ?? 'ja',
        theme: sanitizeTheme(params.theme),
        pageType: sanitizeText(params.pageType, 80),
        contentType: sanitizeText(params.contentType, 80),
        entityId: sanitizeText(params.entityId, 80),
        entitySlug: sanitizeText(params.entitySlug, 160),
        formType: sanitizeText(params.formType, 80),
        category: sanitizeText(params.category, 120),
        userState: sanitizeUserState(params.userState),
        deviceType: sanitizeDeviceType(params.deviceType),
        referrerType: sanitizeReferrerType(params.referrerType),
        experimentId: sanitizeText(params.experimentId, 80),
        variantId: sanitizeText(params.variantId, 80),
        eventId,
        dedupeKey: sanitizeText(params.dedupeKey, 180),
        requestId: sanitizeText(params.requestId, 180),
        sessionId: sanitizeText(params.sessionId, 180),
        anonymousId: sanitizeText(params.anonymousId, 180),
        eventType: sanitizeText(params.eventType, 60),
        eventCategory: sanitizeText(params.eventCategory, 60),
        attributionState: sanitizeText(params.attributionState, 60),
        identityState: sanitizeText(params.identityState, 60),
        identityMergeState: sanitizeText(params.identityMergeState, 60),
        eventQualityState: sanitizeText(params.eventQualityState, 60),
        dedupeState: sanitizeText(params.dedupeState, 60),
        replayState: sanitizeText(params.replayState, 60),
        membershipStatus: sanitizeText(params.membershipStatus, 60),
        entitlementState: sanitizeText(params.entitlementState, 60),
        subscriptionState: sanitizeText(params.subscriptionState, 60),
        billingState: sanitizeText(params.billingState, 60),
        lifecycleStage: sanitizeText(params.lifecycleStage, 80),
        sourceSection: sanitizeText(params.sourceSection, 120),
        sourceScreen: sanitizeText(params.sourceScreen, 120),
        sourceComponent: sanitizeText(params.sourceComponent, 120),
        eventReason: sanitizeText(params.eventReason, 160),
        path: sanitizeText(params.page_path, 240),
        payload,
        eventAt: parseDateInput(params.timestamp) ?? new Date(),
        ipHash: hashIp(getClientIp(ctx)),
        consentState: sanitizeText(params.consentState, 20) === 'denied' ? 'denied' : 'granted',
      },
    })

    ctx.body = { ok: true, deduped: false }
  },

  async opsSummary(ctx) {
    if (!requireOpsToken(ctx)) return

    const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const to = parseDateInput(ctx.query.to) ?? new Date()
    const sourceSite = sanitizeSourceSite(ctx.query.sourceSite)

    const filters: Record<string, unknown> = {
      eventAt: {
        $gte: from.toISOString(),
        $lte: to.toISOString(),
      },
    }

    if (sourceSite !== 'unknown') {
      filters.sourceSite = { $eq: sourceSite }
    }

    const events = await strapi.documents('api::analytics-event.analytics-event').findMany({
      filters,
      fields: ['eventName', 'sourceSite', 'formType', 'category', 'locale', 'eventAt'],
      limit: 5000,
      sort: ['eventAt:desc'],
    })

    const byEvent = new Map<string, number>()
    const bySite = new Map<string, number>()
    const byFormType = new Map<string, number>()
    const byLocale = new Map<string, number>()

    for (const event of events as Array<Record<string, unknown>>) {
      const eventName = String(event.eventName ?? 'unknown')
      const site = String(event.sourceSite ?? 'unknown')
      const formType = String(event.formType ?? 'none')
      const locale = String(event.locale ?? 'unknown')

      byEvent.set(eventName, (byEvent.get(eventName) ?? 0) + 1)
      bySite.set(site, (bySite.get(site) ?? 0) + 1)
      if (formType !== 'none') byFormType.set(formType, (byFormType.get(formType) ?? 0) + 1)
      byLocale.set(locale, (byLocale.get(locale) ?? 0) + 1)
    }

    const toSortedObject = (map: Map<string, number>) => Object.fromEntries(
      [...map.entries()].sort((a, b) => b[1] - a[1]),
    )

    ctx.body = {
      range: { from: from.toISOString(), to: to.toISOString() },
      totalEvents: events.length,
      byEvent: toSortedObject(byEvent),
      bySite: toSortedObject(bySite),
      byFormType: toSortedObject(byFormType),
      byLocale: toSortedObject(byLocale),
    }
  },

  async internalBiOverview(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')

      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - BI_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [events, orders, revenues, subscriptions, inquiries, users, deliveries] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').findMany({
          filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['eventName', 'sourceSite', 'locale', 'eventAt', 'payload'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          filters: { orderedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'locale', 'orderedAt', 'totalAmount', 'paymentStatus', 'returnStatus', 'refundStatus', 'campaignId', 'userId'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'revenueType', 'revenueStatus', 'grossAmount', 'netAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt', 'campaignId', 'syncState'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['membershipType', 'subscriptionStatus', 'billingStatus', 'entitlementState', 'renewalDate', 'authUserId', 'customerId', 'createdAt', 'startAt', 'canceledAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'formType', 'status', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::app-user.app-user').findMany({
          fields: ['sourceSite', 'locale', 'membershipStatus', 'loyaltyState', 'firstLoginAt', 'createdAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['createdAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          filters: { sentAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'status', 'channel', 'templateKey', 'sentAt', 'clickedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
      ])

      const eventRows = events as Array<Record<string, unknown>>
      const orderRows = orders as Array<Record<string, unknown>>
      const revenueRows = revenues as Array<Record<string, unknown>>
      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const userRows = users as Array<Record<string, unknown>>
      const deliveryRows = deliveries as Array<Record<string, unknown>>

      const sessions = eventRows.filter((item) => item.eventName === 'page_view').length
      const newUsers = userRows.filter((item) => withinRange(item.firstLoginAt ?? item.createdAt, from, to)).length
      const mainToStore = eventRows.filter((item) => item.eventName === 'cta_click' && String((item.payload ?? {})['destination'] ?? '').includes('/store')).length
      const mainToFc = eventRows.filter((item) => item.eventName === 'cta_click' && String((item.payload ?? {})['destination'] ?? '').includes('/fanclub')).length
      const checkoutStarts = eventRows.filter((item) => item.eventName === 'cart_click').length
      const paidOrders = orderRows.filter((item) => item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded')
      const formsCompleted = eventRows.filter((item) => item.eventName === 'form_submit_success').length
      const revisitUsers = new Set(
        eventRows
          .filter((item) => item.eventName === 'favorite_based_revisit' || item.eventName === 'fc_update_revisit')
          .map((item) => String((item.payload ?? {})['userId'] ?? ''))
          .filter(Boolean),
      ).size

      const gross = revenueRows.reduce((acc, item) => acc + numberValue(item.grossAmount), 0)
      const net = revenueRows.reduce((acc, item) => acc + numberValue(item.netAmount), 0)
      const refund = revenueRows.reduce((acc, item) => acc + numberValue(item.refundAmount) + numberValue(item.partialRefundAmount), 0)
      const refundRate = gross > 0 ? refund / gross : 0

      const supportCount = inquiryRows.length
      const supportByCategory = (Object.entries(inquiryRows.reduce((acc: any, item) => {
        const key = String(item.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, count]) => ({ category, count }))

      const bySite = ['main', 'store', 'fc', 'cross'].map((site) => {
        const siteOrders = orderRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteRevenue = revenueRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteSupport = inquiryRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteEvents = eventRows.filter((item) => String(item.sourceSite ?? '') === site)
        return {
          site,
          sessions: siteEvents.filter((item) => item.eventName === 'page_view').length,
          paidOrders: siteOrders.filter((item) => item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded').length,
          netRevenue: siteRevenue.reduce((acc, item) => acc + numberValue(item.netAmount), 0),
          supportCases: siteSupport.length,
        }
      })

      const byLocale = (Object.entries(eventRows.reduce((acc: any, item) => {
        const locale = String(item.locale ?? 'unknown')
        acc[locale] = (acc[locale] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)) as Array<[string, number]>).map(([locale, count]) => ({ locale, events: count }))

      const byCampaign = (Object.entries(orderRows.reduce((acc: any, item) => {
        const campaign = String(item.campaignId ?? 'none')
        if (campaign === 'none') return acc
        if (!acc[campaign]) acc[campaign] = { campaignId: campaign, orders: 0, gross: 0 }
        acc[campaign].orders += 1
        acc[campaign].gross += numberValue(item.totalAmount)
        return acc
      }, {} as Record<string, { campaignId: string; orders: number; gross: number }>))
        .map(([, row]) => row) as Array<{ campaignId: string; orders: number; gross: number }>)
        .sort((a, b) => b.gross - a.gross)
        .slice(0, 10)

      const notificationPerformance = {
        sent: deliveryRows.filter((item) => item.status === 'sent').length,
        failed: deliveryRows.filter((item) => item.status === 'failed').length,
        clicked: deliveryRows.filter((item) => Boolean(item.clickedAt)).length,
      }

      const monthly = (Object.values(revenueRows.reduce((acc: any, item) => {
        const month = toIsoMonth(item.financialEventAt)
        if (month === 'unknown') return acc
        if (!acc[month]) acc[month] = { month, gross: 0, net: 0, refund: 0 }
        acc[month].gross += numberValue(item.grossAmount)
        acc[month].net += numberValue(item.netAmount)
        acc[month].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        return acc
      }, {} as Record<string, { month: string; gross: number; net: number; refund: number }>)) as Array<{ month: string; gross: number; net: number; refund: number }>).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

      const daily = (Object.values(eventRows.reduce((acc: any, item) => {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, sessions: 0, checkout: 0, formSuccess: 0 }
        if (item.eventName === 'page_view') acc[day].sessions += 1
        if (item.eventName === 'cart_click') acc[day].checkout += 1
        if (item.eventName === 'form_submit_success') acc[day].formSuccess += 1
        return acc
      }, {} as Record<string, { day: string; sessions: number; checkout: number; formSuccess: number }>)) as Array<{ day: string; sessions: number; checkout: number; formSuccess: number }>).sort((a, b) => a.day.localeCompare(b.day)).slice(-31)

      const kpi = {
        acquisition: {
          sessions,
          newUsers,
          trafficByReferrer: Object.entries(eventRows.reduce((acc: any, item) => {
            const referrer = String(item.referrerType ?? 'unknown')
            acc[referrer] = (acc[referrer] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)) as Array<[string, number]>,
        },
        conversion: {
          mainToStoreRate: sessions > 0 ? mainToStore / sessions : 0,
          mainToFcRate: sessions > 0 ? mainToFc / sessions : 0,
          checkoutStartRate: sessions > 0 ? checkoutStarts / sessions : 0,
          purchaseCompleteRate: checkoutStarts > 0 ? paidOrders.length / checkoutStarts : 0,
          fcJoinCompleteRate: eventRows.filter((item) => item.eventName === 'join_click').length > 0
            ? eventRows.filter((item) => item.eventName === 'login_success').length / eventRows.filter((item) => item.eventName === 'join_click').length
            : 0,
          formCompletionRate: eventRows.filter((item) => item.eventName === 'form_start').length > 0
            ? formsCompleted / eventRows.filter((item) => item.eventName === 'form_start').length
            : 0,
        },
        retention: {
          revisitUsers,
          notificationRevisitEvents: eventRows.filter((item) => item.eventName === 'notification_click').length,
          activeMembershipCount: subscriptionRows.filter((item) => item.entitlementState === 'active').length,
          graceMembershipCount: subscriptionRows.filter((item) => item.entitlementState === 'grace_period').length,
        },
        revenue: {
          gross,
          net,
          refund,
          refundRate,
          averageOrderValue: paidOrders.length > 0 ? paidOrders.reduce((acc, item) => acc + numberValue(item.totalAmount), 0) / paidOrders.length : 0,
          subscriptionRevenue: revenueRows.filter((item) => item.revenueType === 'fc_subscription').reduce((acc, item) => acc + numberValue(item.netAmount), 0),
        },
        support: {
          totalInquiries: supportCount,
          byCategory: supportByCategory,
        },
      }

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        freshnessState: {
          analyticsEventAt: eventRows[0]?.eventAt ?? null,
          orderAt: orderRows[0]?.orderedAt ?? null,
          revenueAt: revenueRows[0]?.financialEventAt ?? null,
          supportAt: inquiryRows[0]?.submittedAt ?? null,
        },
        sourceOfTruth: {
          rawEvent: 'api::analytics-event.analytics-event',
          orderFact: 'api::order.order',
          revenueFact: 'api::revenue-record.revenue-record',
          subscriptionFact: 'api::subscription-record.subscription-record',
          supportFact: 'api::inquiry-submission.inquiry-submission',
        },
        syncState: {
          revenue: Object.entries(revenueRows.reduce((acc: any, item) => {
            const state = String(item.syncState ?? 'unknown')
            acc[state] = (acc[state] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)) as Array<[string, number]>,
        },
        kpi,
        summaryTable: { monthly, daily, bySite, byLocale, byCampaign, notificationPerformance },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI overview の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiOverview failed: ${message}`)
      return ctx.internalServerError('BI overview の取得に失敗しました。')
    }
  },

  async internalBiCohorts(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')

      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - Math.max(180, BI_DEFAULT_RANGE_DAYS) * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [users, orders, subscriptions, inquiries] = await Promise.all([
        strapi.documents('api::app-user.app-user').findMany({
          fields: ['logtoUserId', 'firstLoginAt', 'createdAt', 'sourceSite', 'membershipStatus', 'loyaltyState'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['createdAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          fields: ['userId', 'orderedAt', 'totalAmount', 'paymentStatus', 'sourceSite', 'returnStatus', 'refundStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['authUserId', 'customerId', 'startAt', 'canceledAt', 'entitlementState', 'subscriptionStatus', 'billingStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['startAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          fields: ['email', 'submittedAt', 'sourceSite', 'status'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
      ])

      const userRows = (users as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.firstLoginAt ?? item.createdAt, from, to))
      const orderRows = (orders as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.orderedAt, from, to) && (item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded'))
      const subscriptionRows = (subscriptions as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.startAt, from, to))
      const supportRows = (inquiries as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.submittedAt, from, to))

      const signupCohort = (Object.values(userRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.firstLoginAt ?? item.createdAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, users: 0, retained30d: 0, retained60d: 0, supportCases: 0 }
        acc[key].users += 1
        return acc
      }, {} as Record<string, { cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>)) as Array<{ cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>)

      const firstPurchaseCohort = (Object.values(orderRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.orderedAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, orders: 0, revenue: 0, refundCases: 0 }
        acc[key].orders += 1
        acc[key].revenue += numberValue(item.totalAmount)
        if (item.returnStatus === 'refunded' || item.refundStatus === 'refunded') acc[key].refundCases += 1
        return acc
      }, {} as Record<string, { cohortKey: string; orders: number; revenue: number; refundCases: number }>)) as Array<{ cohortKey: string; orders: number; revenue: number; refundCases: number }>)

      const membershipCohort = (Object.values(subscriptionRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.startAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, joinCount: 0, canceledCount: 0, graceCount: 0, activeCount: 0 }
        acc[key].joinCount += 1
        if (item.canceledAt) acc[key].canceledCount += 1
        if (item.entitlementState === 'grace_period') acc[key].graceCount += 1
        if (item.entitlementState === 'active') acc[key].activeCount += 1
        return acc
      }, {} as Record<string, { cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>)) as Array<{ cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>)

      const supportImpact = (Object.values(supportRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.submittedAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, supportCases: 0, unresolved: 0 }
        acc[key].supportCases += 1
        if (item.status !== 'closed' && item.status !== 'replied') acc[key].unresolved += 1
        return acc
      }, {} as Record<string, { cohortKey: string; supportCases: number; unresolved: number }>)) as Array<{ cohortKey: string; supportCases: number; unresolved: number }>)

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        cohortKey: ['signup_month', 'first_purchase_month', 'membership_start_month'],
        retentionWindow: ['30d', '60d'],
        cohorts: {
          signup: signupCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          firstPurchase: firstPurchaseCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          membership: membershipCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          supportImpact: supportImpact.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI cohort の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiCohorts failed: ${message}`)
      return ctx.internalServerError('BI cohort の取得に失敗しました。')
    }
  },

  async internalBiAlerts(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const to = parseDateInput(ctx.query.to) ?? new Date()
      const from = parseDateInput(ctx.query.from) ?? new Date(to.getTime() - Math.max(30, BI_DEFAULT_RANGE_DAYS) * 24 * 60 * 60 * 1000)

      const [events, orders, revenues, subscriptions, inquiries, deliveries, webhooks] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').findMany({
          filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['eventName', 'sourceSite', 'locale', 'eventAt', 'payload'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          filters: { orderedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'orderedAt', 'paymentStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'revenueType', 'grossAmount', 'netAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['subscriptionStatus', 'billingStatus', 'entitlementState', 'renewalDate', 'createdAt', 'updatedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'formType', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          filters: { sentAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'status', 'channel', 'sentAt', 'clickedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
        strapi.documents('api::webhook-event-log.webhook-event-log').findMany({
          fields: ['provider', 'eventType', 'status', 'receivedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['receivedAt:desc'],
        }),
      ])

      const eventRows = events as Array<Record<string, unknown>>
      const orderRows = orders as Array<Record<string, unknown>>
      const revenueRows = revenues as Array<Record<string, unknown>>
      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const deliveryRows = deliveries as Array<Record<string, unknown>>
      const webhookRows = (webhooks as Array<Record<string, unknown>>).filter((item) => withinRange(item.receivedAt, from, to))

      const dailyMap = new Map<string, {
        day: string
        sessions: number
        checkoutStarts: number
        paidOrders: number
        mainToStore: number
        mainToFc: number
        formStart: number
        formComplete: number
        netRevenue: number
        grossRevenue: number
        refundAmount: number
        fcRevenue: number
        supportCount: number
        notificationSent: number
        notificationClicked: number
        webhookFailure: number
      }>()
      const ensureDay = (day: string) => {
        if (!dailyMap.has(day)) {
          dailyMap.set(day, {
            day,
            sessions: 0,
            checkoutStarts: 0,
            paidOrders: 0,
            mainToStore: 0,
            mainToFc: 0,
            formStart: 0,
            formComplete: 0,
            netRevenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
            fcRevenue: 0,
            supportCount: 0,
            notificationSent: 0,
            notificationClicked: 0,
            webhookFailure: 0,
          })
        }
        return dailyMap.get(day)!
      }

      for (const item of eventRows) {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        if (item.eventName === 'page_view') row.sessions += 1
        if (item.eventName === 'cart_click') row.checkoutStarts += 1
        if (item.eventName === 'form_start') row.formStart += 1
        if (item.eventName === 'form_submit_success') row.formComplete += 1
        if (item.eventName === 'cta_click') {
          const destination = String((item.payload ?? {})['destination'] ?? '')
          if (destination.includes('/store')) row.mainToStore += 1
          if (destination.includes('/fanclub')) row.mainToFc += 1
        }
      }

      for (const item of orderRows) {
        const day = toIsoDay(item.orderedAt)
        if (day === 'unknown') continue
        if (item.paymentStatus !== 'paid' && item.paymentStatus !== 'succeeded') continue
        ensureDay(day).paidOrders += 1
      }
      for (const item of revenueRows) {
        const day = toIsoDay(item.financialEventAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        row.grossRevenue += numberValue(item.grossAmount)
        row.netRevenue += numberValue(item.netAmount)
        row.refundAmount += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        if (item.revenueType === 'fc_subscription') row.fcRevenue += numberValue(item.netAmount)
      }
      for (const item of inquiryRows) {
        const day = toIsoDay(item.submittedAt)
        if (day === 'unknown') continue
        ensureDay(day).supportCount += 1
      }
      for (const item of deliveryRows) {
        const day = toIsoDay(item.sentAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        if (item.status === 'sent') row.notificationSent += 1
        if (item.clickedAt) row.notificationClicked += 1
      }
      for (const item of webhookRows) {
        const day = toIsoDay(item.receivedAt)
        if (day === 'unknown') continue
        if (String(item.status ?? '').toLowerCase() === 'failed') ensureDay(day).webhookFailure += 1
      }

      const daily = [...dailyMap.values()].sort((a, b) => a.day.localeCompare(b.day))
      const latestWindow = daily.slice(-7)
      const previousWindow = daily.slice(-14, -7)
      const sumWindow = (rows: typeof daily, key: keyof (typeof daily)[number]) => rows.reduce((acc, row) => acc + numberValue(row[key]), 0)
      const avg = (rows: typeof daily, key: keyof (typeof daily)[number]) => rows.length > 0 ? sumWindow(rows, key) / rows.length : 0

      const currentSessions = sumWindow(latestWindow, 'sessions')
      const previousSessions = sumWindow(previousWindow, 'sessions')
      const currentMainToStoreRate = currentSessions > 0 ? sumWindow(latestWindow, 'mainToStore') / currentSessions : 0
      const previousMainToStoreRate = previousSessions > 0 ? sumWindow(previousWindow, 'mainToStore') / previousSessions : 0
      const currentMainToFcRate = currentSessions > 0 ? sumWindow(latestWindow, 'mainToFc') / currentSessions : 0
      const previousMainToFcRate = previousSessions > 0 ? sumWindow(previousWindow, 'mainToFc') / previousSessions : 0
      const currentCheckoutRate = currentSessions > 0 ? sumWindow(latestWindow, 'checkoutStarts') / currentSessions : 0
      const previousCheckoutRate = previousSessions > 0 ? sumWindow(previousWindow, 'checkoutStarts') / previousSessions : 0
      const currentPurchaseRate = sumWindow(latestWindow, 'checkoutStarts') > 0 ? sumWindow(latestWindow, 'paidOrders') / sumWindow(latestWindow, 'checkoutStarts') : 0
      const previousPurchaseRate = sumWindow(previousWindow, 'checkoutStarts') > 0 ? sumWindow(previousWindow, 'paidOrders') / sumWindow(previousWindow, 'checkoutStarts') : 0
      const currentFormRate = sumWindow(latestWindow, 'formStart') > 0 ? sumWindow(latestWindow, 'formComplete') / sumWindow(latestWindow, 'formStart') : 0
      const previousFormRate = sumWindow(previousWindow, 'formStart') > 0 ? sumWindow(previousWindow, 'formComplete') / sumWindow(previousWindow, 'formStart') : 0
      const currentNotificationCtr = sumWindow(latestWindow, 'notificationSent') > 0 ? sumWindow(latestWindow, 'notificationClicked') / sumWindow(latestWindow, 'notificationSent') : 0
      const previousNotificationCtr = sumWindow(previousWindow, 'notificationSent') > 0 ? sumWindow(previousWindow, 'notificationClicked') / sumWindow(previousWindow, 'notificationSent') : 0
      const currentRefundRate = sumWindow(latestWindow, 'grossRevenue') > 0 ? sumWindow(latestWindow, 'refundAmount') / sumWindow(latestWindow, 'grossRevenue') : 0
      const previousRefundRate = sumWindow(previousWindow, 'grossRevenue') > 0 ? sumWindow(previousWindow, 'refundAmount') / sumWindow(previousWindow, 'grossRevenue') : 0

      const metricSeries = {
        sessions: daily.map((row) => ({ day: row.day, value: row.sessions })),
        storeNetRevenue: daily.map((row) => ({ day: row.day, value: row.netRevenue - row.fcRevenue })),
        fcSubscriptionRevenue: daily.map((row) => ({ day: row.day, value: row.fcRevenue })),
        supportCases: daily.map((row) => ({ day: row.day, value: row.supportCount })),
      }

      const metricDefinition = [
        { metricKey: 'sessions', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'count' },
        { metricKey: 'main_to_store_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'main_to_fc_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'checkout_start_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'purchase_complete_rate', ownerTeam: 'commerce', sourceOfTruth: 'api::order.order', unit: 'ratio' },
        { metricKey: 'form_completion_rate', ownerTeam: 'support', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'notification_click_rate', ownerTeam: 'crm', sourceOfTruth: 'api::delivery-log.delivery-log', unit: 'ratio' },
        { metricKey: 'store_net_revenue', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'currency' },
        { metricKey: 'fc_subscription_revenue', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'currency' },
        { metricKey: 'refund_rate', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'ratio' },
        { metricKey: 'support_cases', ownerTeam: 'support', sourceOfTruth: 'api::inquiry-submission.inquiry-submission', unit: 'count' },
        { metricKey: 'webhook_failure_count', ownerTeam: 'operations', sourceOfTruth: 'api::webhook-event-log.webhook-event-log', unit: 'count' },
      ]

      const alertRules = [
        { metricKey: 'sessions', alertScope: 'global', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'growth' },
        { metricKey: 'purchase_complete_rate', alertScope: 'store', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'commerce' },
        { metricKey: 'form_completion_rate', alertScope: 'main,store,fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'support' },
        { metricKey: 'store_net_revenue', alertScope: 'store', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'fc_subscription_revenue', alertScope: 'fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'refund_rate', alertScope: 'store,fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_spike', value: BI_ALERT_SPIKE_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'support_cases', alertScope: 'global', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_spike', value: BI_ALERT_SPIKE_RATIO }, ownerTeam: 'support' },
      ]

      const candidates = [
        { metricKey: 'sessions', current: currentSessions, baseline: previousSessions, hint: '流入低下時は main 導線 / 集客チャネル / 配信停止を確認' },
        { metricKey: 'main_to_store_rate', current: currentMainToStoreRate, baseline: previousMainToStoreRate, hint: 'main の store CTA 配置・文言・リンク切れを確認' },
        { metricKey: 'main_to_fc_rate', current: currentMainToFcRate, baseline: previousMainToFcRate, hint: 'main から fanclub 導線、会員特典訴求を確認' },
        { metricKey: 'checkout_start_rate', current: currentCheckoutRate, baseline: previousCheckoutRate, hint: '商品詳細→カート導線、在庫表示、価格表記を確認' },
        { metricKey: 'purchase_complete_rate', current: currentPurchaseRate, baseline: previousPurchaseRate, hint: '決済失敗、配送オプション、エラー率を確認' },
        { metricKey: 'form_completion_rate', current: currentFormRate, baseline: previousFormRate, hint: 'フォーム必須項目、バリデーション、入力補助を確認' },
        { metricKey: 'notification_click_rate', current: currentNotificationCtr, baseline: previousNotificationCtr, hint: '配信チャネル別 CTR、件名、配信タイミングを確認' },
        { metricKey: 'store_net_revenue', current: sumWindow(latestWindow, 'netRevenue') - sumWindow(latestWindow, 'fcRevenue'), baseline: sumWindow(previousWindow, 'netRevenue') - sumWindow(previousWindow, 'fcRevenue'), hint: 'store の checkout / 決済 / 在庫 / キャンペーンを確認' },
        { metricKey: 'fc_subscription_revenue', current: sumWindow(latestWindow, 'fcRevenue'), baseline: sumWindow(previousWindow, 'fcRevenue'), hint: '継続更新成功率、失敗課金、churn を確認' },
        { metricKey: 'refund_rate', current: currentRefundRate, baseline: previousRefundRate, hint: '返品理由、配送遅延、不良率、誤配送を確認' },
        { metricKey: 'support_cases', current: sumWindow(latestWindow, 'supportCount'), baseline: sumWindow(previousWindow, 'supportCount'), hint: 'FAQ/Guide不足、決済/配送障害、フォーム障害を確認' },
        { metricKey: 'webhook_failure_count', current: sumWindow(latestWindow, 'webhookFailure'), baseline: sumWindow(previousWindow, 'webhookFailure'), hint: 'Webhook endpoint とリトライ失敗ログを確認' },
      ]

      const anomalyEvents = candidates.flatMap((candidate) => {
        const totalVolume = candidate.current + candidate.baseline
        if (totalVolume < BI_ALERT_MIN_VOLUME) return []
        const deltaRatio = safeRatio(candidate.current, candidate.baseline)
        const negativeAnomaly = deltaRatio <= -BI_ALERT_DROP_RATIO && ['refund_rate', 'support_cases', 'webhook_failure_count'].includes(candidate.metricKey) === false
        const positiveAnomaly = deltaRatio >= BI_ALERT_SPIKE_RATIO && ['refund_rate', 'support_cases', 'webhook_failure_count'].includes(candidate.metricKey)
        if (!negativeAnomaly && !positiveAnomaly) return []
        const direction = deltaRatio >= 0 ? 'increase' : 'decrease'
        return [{
          metricKey: candidate.metricKey,
          anomalySeverity: toSeverity(deltaRatio),
          comparisonWindow: 'last_7d_vs_prev_7d',
          baselineSeries: candidate.baseline,
          metricSeries: candidate.current,
          explanationText: `${candidate.metricKey} が ${direction}（${(deltaRatio * 100).toFixed(1)}%）`,
          confidenceState: totalVolume >= BI_ALERT_MIN_VOLUME * 3 ? 'high' : 'medium',
          actionHint: candidate.hint,
          ownerTeam: metricDefinition.find((item) => item.metricKey === candidate.metricKey)?.ownerTeam ?? 'operations',
          muteState: 'unmuted',
          acknowledgementState: 'unacked',
        }]
      })

      const revenueSeriesValues = metricSeries.storeNetRevenue.map((item) => item.value)
      const supportSeriesValues = metricSeries.supportCases.map((item) => item.value)
      const revenueBaseline = movingAverage(revenueSeriesValues, 7)
      const supportBaseline = movingAverage(supportSeriesValues, 7)
      const latestDay = daily[daily.length - 1]?.day
      const forecastSeries = [
        {
          metricKey: 'store_net_revenue',
          forecastHorizon: `${BI_FORECAST_HORIZON_DAYS}d`,
          baselineSeries: metricSeries.storeNetRevenue.map((row, index) => ({ day: row.day, value: revenueBaseline[index] ?? row.value })),
          forecastSeries: Array.from({ length: BI_FORECAST_HORIZON_DAYS }).map((_, index) => ({ dayOffset: index + 1, value: revenueBaseline[revenueBaseline.length - 1] ?? 0 })),
          confidenceState: 'medium',
        },
        {
          metricKey: 'support_cases',
          forecastHorizon: `${BI_FORECAST_HORIZON_DAYS}d`,
          baselineSeries: metricSeries.supportCases.map((row, index) => ({ day: row.day, value: supportBaseline[index] ?? row.value })),
          forecastSeries: Array.from({ length: BI_FORECAST_HORIZON_DAYS }).map((_, index) => ({ dayOffset: index + 1, value: supportBaseline[supportBaseline.length - 1] ?? 0 })),
          confidenceState: 'medium',
        },
      ]

      const summaryInsights = [
        {
          reportAudience: 'executive',
          insightSeverity: anomalyEvents.some((item) => item.anomalySeverity === 'high') ? 'high' : 'medium',
          businessSignal: anomalyEvents.length > 0 ? `${anomalyEvents.length}件の重要変化を検知` : '重大な変化なし',
          signalSource: 'internal.bi.alerts',
          explanationText: anomalyEvents.length > 0 ? anomalyEvents.slice(0, 3).map((item) => item.explanationText).join(' / ') : '主要KPIは安定推移',
          actionHint: 'high のアラートは当日中に ownerTeam が一次調査し、acknowledge を更新',
        },
      ]

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        refreshState: { latestDay, generatedAt: new Date().toISOString() },
        sourceOfTruth: {
          rawEvent: 'api::analytics-event.analytics-event',
          orderFact: 'api::order.order',
          revenueFact: 'api::revenue-record.revenue-record',
          supportFact: 'api::inquiry-submission.inquiry-submission',
          webhookFact: 'api::webhook-event-log.webhook-event-log',
          subscriptionFact: 'api::subscription-record.subscription-record',
        },
        metricDefinition,
        metricSeries,
        alertRules,
        anomalyEvents,
        forecastSeries,
        summaryInsights,
        muteState: 'managed_in_runbook',
        notificationChannel: ['internal-dashboard', 'ops-runbook'],
        acknowledgementState: anomalyEvents.length > 0 ? 'pending' : 'none',
        businessHealthSnapshot: {
          churnSignals: subscriptionRows.filter((item) => item.subscriptionStatus === 'canceled' || item.entitlementState === 'grace_period').length,
          paymentFailures: subscriptionRows.filter((item) => item.billingStatus === 'failed').length,
          supportWeeklyAverage: avg(latestWindow, 'supportCount'),
          webhookFailureWeeklyAverage: avg(latestWindow, 'webhookFailure'),
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI alerts の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiAlerts failed: ${message}`)
      return ctx.internalServerError('BI alerts の取得に失敗しました。')
    }
  },

  async internalBiReport(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const audience = sanitizeText(ctx.query.audience, 40) ?? 'operations'
      const period = sanitizeText(ctx.query.period, 20) ?? 'weekly'
      const to = parseDateInput(ctx.query.to) ?? new Date()
      const days = period === 'monthly' ? 30 : 7
      const from = parseDateInput(ctx.query.from) ?? new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

      const [alerts, revenues, inquiries] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').count({
          filters: { eventName: { $eq: 'api_failure' }, eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['netAmount', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'sourceSite', 'financialEventAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
      ])

      const revenueRows = revenues as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const gross = revenueRows.reduce((acc, item) => acc + numberValue(item.grossAmount), 0)
      const net = revenueRows.reduce((acc, item) => acc + numberValue(item.netAmount), 0)
      const refund = revenueRows.reduce((acc, item) => acc + numberValue(item.refundAmount) + numberValue(item.partialRefundAmount), 0)
      const refundRate = gross > 0 ? refund / gross : 0
      const supportTotal = inquiryRows.length
      const supportByCategory = (Object.entries(inquiryRows.reduce((acc: Record<string, number>, item) => {
        const key = String(item.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 5)

      const sections = [
        {
          reportSection: 'summary',
          explanationText: `${period === 'monthly' ? '月次' : '週次'}の net 売上は ${Math.round(net).toLocaleString()}、返金率は ${(refundRate * 100).toFixed(2)}%。support 件数は ${supportTotal} 件。`,
          actionHint: refundRate > 0.08 ? '返金理由上位カテゴリを優先調査し、商品説明・配送・品質改善を実行' : '現行運用を維持し、キャンペーン比較を継続',
          insightSeverity: refundRate > 0.12 ? 'high' : refundRate > 0.08 ? 'medium' : 'low',
        },
        {
          reportSection: 'operations',
          explanationText: `API失敗イベントは ${alerts} 件。support 上位カテゴリ: ${supportByCategory.map(([category, count]) => `${category}(${count})`).join(', ') || 'なし'}.`,
          actionHint: alerts > 0 ? 'internal admin の anomaly center で当日原因を確認し、runbookに追記' : '引き続き15分監視と週次レビューを継続',
          insightSeverity: alerts > 20 ? 'high' : alerts > 5 ? 'medium' : 'low',
        },
      ]

      ctx.body = {
        reportTemplate: {
          reportAudience: audience,
          period,
          sections: ['summary', 'operations', 'finance', 'support'],
          sourceOfTruth: ['api::revenue-record.revenue-record', 'api::inquiry-submission.inquiry-submission', 'api::analytics-event.analytics-event'],
        },
        reportRun: {
          generatedAt: new Date().toISOString(),
          range: { from: from.toISOString(), to: to.toISOString() },
          reportAudience: audience,
          period,
          summaryInsight: {
            explanationText: sections[0].explanationText,
            insightSeverity: sections.some((item) => item.insightSeverity === 'high') ? 'high' : 'medium',
            confidenceState: 'medium',
          },
          reportSections: sections,
          kpiSnapshot: {
            gross,
            net,
            refund,
            refundRate,
            supportTotal,
          },
          exportState: {
            csv: '/api/internal/bi/export.csv',
            dashboard: '/internal/admin',
            reviewOwner: audience === 'executive' ? '経営チーム' : audience === 'support' ? 'support/CS' : '運営チーム',
          },
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI report の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiReport failed: ${message}`)
      return ctx.internalServerError('BI report の生成に失敗しました。')
    }
  },

  async internalAutomationPlaybooks(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const from = parseDateInput(ctx.query.from) ?? daysAgo(14)
      const mid = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [subscriptions, inquiries, revenues, deliveries, events] = await Promise.all([
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['billingStatus', 'subscriptionStatus', 'updatedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          fields: ['submittedAt', 'inquiryCategory', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          fields: ['financialEventAt', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          fields: ['sentAt', 'status', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
        strapi.documents('api::analytics-event.analytics-event').findMany({
          fields: ['eventAt', 'eventName', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
      ])

      const subRows = (subscriptions as Array<Record<string, unknown>>).filter((row) => withinRange(row.updatedAt, from, to))
      const inquiryRows = (inquiries as Array<Record<string, unknown>>).filter((row) => withinRange(row.submittedAt, from, to))
      const revenueRows = (revenues as Array<Record<string, unknown>>).filter((row) => withinRange(row.financialEventAt, from, to))
      const deliveryRows = (deliveries as Array<Record<string, unknown>>).filter((row) => withinRange(row.sentAt, from, to))
      const eventRows = (events as Array<Record<string, unknown>>).filter((row) => withinRange(row.eventAt, from, to))
      const prevRange = { from, to: mid }
      const latestRange = { from: mid, to }
      const inRange = (value: unknown, range: { from: Date; to: Date }) => withinRange(value, range.from, range.to)

      const previousPaymentFailures = subRows.filter((row) => row.billingStatus === 'failed' && inRange(row.updatedAt, prevRange)).length
      const latestPaymentFailures = subRows.filter((row) => row.billingStatus === 'failed' && inRange(row.updatedAt, latestRange)).length
      const previousSupportCases = inquiryRows.filter((row) => inRange(row.submittedAt, prevRange)).length
      const latestSupportCases = inquiryRows.filter((row) => inRange(row.submittedAt, latestRange)).length
      const previousRefundRate = (() => {
        const rows = revenueRows.filter((row) => inRange(row.financialEventAt, prevRange))
        const gross = sumBy(rows, (row) => numberValue(row.grossAmount))
        const refund = sumBy(rows, (row) => numberValue(row.refundAmount) + numberValue(row.partialRefundAmount))
        return gross > 0 ? refund / gross : 0
      })()
      const latestRefundRate = (() => {
        const rows = revenueRows.filter((row) => inRange(row.financialEventAt, latestRange))
        const gross = sumBy(rows, (row) => numberValue(row.grossAmount))
        const refund = sumBy(rows, (row) => numberValue(row.refundAmount) + numberValue(row.partialRefundAmount))
        return gross > 0 ? refund / gross : 0
      })()
      const previousCtr = (() => {
        const rows = deliveryRows.filter((row) => inRange(row.sentAt, prevRange))
        const sent = rows.filter((row) => row.status === 'sent').length
        const clicked = rows.filter((row) => row.status === 'clicked').length
        return sent > 0 ? clicked / sent : 0
      })()
      const latestCtr = (() => {
        const rows = deliveryRows.filter((row) => inRange(row.sentAt, latestRange))
        const sent = rows.filter((row) => row.status === 'sent').length
        const clicked = rows.filter((row) => row.status === 'clicked').length
        return sent > 0 ? clicked / sent : 0
      })()
      const previousCheckoutStarts = eventRows.filter((row) => row.eventName === 'cart_click' && inRange(row.eventAt, prevRange)).length
      const latestCheckoutStarts = eventRows.filter((row) => row.eventName === 'cart_click' && inRange(row.eventAt, latestRange)).length

      const highSupportCategory = (Object.entries(inquiryRows.reduce((acc: Record<string, number>, row) => {
        const key = String(row.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})) as Array<[string, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

      const playbooks = [
        {
          playbookKey: 'billing-failed-payment-recovery',
          title: 'failed payment 急増時の回復導線提案',
          ownerTeam: 'finance',
          severity: 'high',
          runMode: 'auto_with_approval',
          sourceSite: 'cross',
          triggerSource: 'billing_event',
          triggerValue: { current: latestPaymentFailures, baseline: previousPaymentFailures, ratio: safeRatio(latestPaymentFailures, Math.max(previousPaymentFailures, 1)) },
          conditionSet: { paymentFailureCount: { gte: 10 }, conversionDropPercent: { gte: 20 } },
          action: ['recovery_message_suggestion', 'support_task_create', 'manual_review_queue_add'],
          approvalStep: ['finance_lead', 'support_lead'],
          approvalRequired: true,
        },
        {
          playbookKey: 'support-surge-faq-guidance',
          title: 'support 急増時のFAQ/Guide更新タスク',
          ownerTeam: 'support',
          severity: 'medium',
          runMode: 'auto_safe',
          sourceSite: 'cross',
          triggerSource: 'support_case_surge',
          triggerValue: { current: latestSupportCases, baseline: previousSupportCases, ratio: safeRatio(latestSupportCases, Math.max(previousSupportCases, 1)), category: highSupportCategory },
          conditionSet: { unresolvedDuration: { gteHours: 12 }, supportCategory: highSupportCategory },
          action: ['faq_update_task_create', 'guide_update_task_create', 'routing_recommendation'],
          approvalStep: [],
          approvalRequired: false,
        },
        {
          playbookKey: 'campaign-ctr-drop-review',
          title: 'campaign CTR 低下時の見直し提案',
          ownerTeam: 'crm',
          severity: 'medium',
          runMode: 'suggested',
          sourceSite: 'main',
          triggerSource: 'crm_campaign_degradation',
          triggerValue: { current: latestCtr, baseline: previousCtr, ratio: safeRatio(latestCtr, Math.max(previousCtr, 0.0001)) },
          conditionSet: { notificationCTR: { drop: BI_ALERT_DROP_RATIO } },
          action: ['campaign_review_task_create', 'template_switch_suggestion'],
          approvalStep: ['crm_lead'],
          approvalRequired: false,
        },
        {
          playbookKey: 'checkout-drop-growth-review',
          title: 'checkout 開始率低下時のgrowth調査',
          ownerTeam: 'growth',
          severity: 'high',
          runMode: 'suggested',
          sourceSite: 'store',
          triggerSource: 'kpi_alert',
          triggerValue: { current: latestCheckoutStarts, baseline: previousCheckoutStarts, ratio: safeRatio(latestCheckoutStarts, Math.max(previousCheckoutStarts, 1)) },
          conditionSet: { sourceSite: 'store', campaignScope: 'all' },
          action: ['growth_review_task_create', 'dashboard_pin'],
          approvalStep: [],
          approvalRequired: false,
        },
        {
          playbookKey: 'refund-spike-finance-review',
          title: 'refund率急増時のfinance review',
          ownerTeam: 'finance',
          severity: 'high',
          runMode: 'auto_with_approval',
          sourceSite: 'store',
          triggerSource: 'order_refund_event',
          triggerValue: { current: latestRefundRate, baseline: previousRefundRate, ratio: safeRatio(latestRefundRate, Math.max(previousRefundRate, 0.0001)) },
          conditionSet: { refundRate: { spike: BI_ALERT_SPIKE_RATIO } },
          action: ['finance_alert_create', 'campaign_pause_suggestion', 'manual_override_queue_add'],
          approvalStep: ['finance_lead'],
          approvalRequired: true,
        },
      ].map((playbook) => {
        const ratio = numberValue((playbook.triggerValue as Record<string, unknown>).ratio)
        const triggered = (playbook.severity === 'high' && Math.abs(ratio) >= BI_ALERT_DROP_RATIO) || (playbook.severity !== 'high' && Math.abs(ratio) >= 0.15)
        return {
          ...playbook,
          workflow: 'ops-automation-v1',
          retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, backoffMs: 30000 },
          runGuard: {
            dryRun: true,
            safeMode: PLAYBOOK_SAFE_MODE_DEFAULT,
            cooldownWindow: 'PT4H',
            deduplicationKey: `${playbook.playbookKey}:${toIsoDay(to.toISOString())}`,
            rateLimitRule: '20 actions / 10min',
            audienceSizeGuard: PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD,
          },
          executionState: triggered ? (playbook.approvalRequired ? 'pending_approval' : 'suggested') : 'skipped',
          triggered,
        }
      })

      const pendingApprovals = playbooks.filter((item) => item.triggered && item.approvalRequired).map((item) => ({
        playbookKey: item.playbookKey,
        title: item.title,
        ownerTeam: item.ownerTeam,
        approvalStatus: 'pending',
        approvalStep: item.approvalStep,
        reason: `${item.triggerSource} で閾値超過`,
      }))

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        triggerSourceCatalog: ['kpi_alert', 'anomaly_detection', 'billing_event', 'order_refund_event', 'support_case_surge', 'crm_campaign_degradation', 'manual_operator_trigger'],
        runModeCatalog: ['manual', 'suggested', 'auto_safe', 'auto_with_approval', 'disabled'],
        playbooks,
        pendingApprovals,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation playbook の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationPlaybooks failed: ${message}`)
      return ctx.internalServerError('playbook 一覧の取得に失敗しました。')
    }
  },

  async internalOperationsDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const to = parseDateInput(ctx.query.to) ?? new Date()
      const from = parseDateInput(ctx.query.from) ?? new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
      const staleThresholdHours = Number(process.env.OPS_STALE_THRESHOLD_HOURS ?? 6)
      const staleThresholdMs = staleThresholdHours * 60 * 60 * 1000

      const [inquiries, notifications, subscriptions, securityInvestigations, securityNotices, playbookRuns, appUsers] = await Promise.all([
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          fields: ['id', 'status', 'submittedAt', 'updatedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          fields: ['id', 'status', 'sentAt', 'createdAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['id', 'billingStatus', 'subscriptionStatus', 'membershipStatus', 'entitlementState', 'syncState', 'updatedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::security-investigation.security-investigation').findMany({
          fields: ['id', 'status', 'investigationState', 'updatedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::security-notice.security-notice').findMany({
          fields: ['id', 'status', 'noticeType', 'acknowledgedAt', 'publishedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['publishedAt:desc'],
        }),
        strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
          filters: { targetType: { $eq: 'playbook-execution' } },
          fields: ['id', 'status', 'createdAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['createdAt:desc'],
        }),
        strapi.documents('api::app-user.app-user').findMany({
          fields: ['id', 'membershipStatus', 'billingState', 'entitlementState', 'subscriptionState', 'lifecycleStage', 'updatedAt', 'sourceSite', 'deletionState', 'deletionRequestState', 'privacyNoticeState', 'privacyUpdatedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
      ])

      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const notificationRows = notifications as Array<Record<string, unknown>>
      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const securityInvestigationRows = securityInvestigations as Array<Record<string, unknown>>
      const securityNoticeRows = securityNotices as Array<Record<string, unknown>>
      const playbookRunRows = playbookRuns as Array<Record<string, unknown>>
      const appUserRows = appUsers as Array<Record<string, unknown>>

      const unresolvedSupport = inquiryRows.filter((row) => ['new', 'in_review', 'waiting_reply', 'reopened'].includes(String(row.status ?? ''))).length
      const waitingUser = inquiryRows.filter((row) => String(row.status ?? '') === 'waiting_reply').length
      const notificationFailures = notificationRows.filter((row) => ['failed', 'bounced', 'retry_pending'].includes(String(row.status ?? ''))).length
      const pendingPrivacyActions = appUserRows.filter((row) => {
        const deletionState = String(row.deletionState ?? '')
        const deletionRequestState = String(row.deletionRequestState ?? '')
        const privacyNoticeState = String(row.privacyNoticeState ?? '')
        return ['pending', 'queued', 'in_progress', 'scheduled', 'deletion_pending'].includes(deletionState)
          || ['requested', 'pending_review', 'queued', 'in_progress'].includes(deletionRequestState)
          || ['review_needed', 'pending'].includes(privacyNoticeState)
      }).length
      const securityReviewPending = securityInvestigationRows.filter((row) => ['open', 'pending', 'needs_review'].includes(String(row.investigationState ?? row.status ?? ''))).length
      const mismatchCount = subscriptionRows.filter((row) => {
        const billing = String(row.billingStatus ?? '')
        const membership = String(row.membershipStatus ?? '')
        const entitlement = String(row.entitlementState ?? '')
        const subscriptionStatus = String(row.subscriptionStatus ?? '')
        return (billing === 'failed' && membership === 'active')
          || (subscriptionStatus === 'active' && entitlement === 'revoked')
          || String(row.syncState ?? '') === 'mismatch_detected'
      }).length
      const staleSummaryCount = appUserRows.filter((row) => {
        const updated = parseDateInput(row.updatedAt)
        return updated ? (to.getTime() - updated.getTime()) > staleThresholdMs : true
      }).length

      const queueSummary = [
        { queueType: 'support_backlog', queueState: unresolvedSupport > 0 ? 'pending' : 'healthy', queueItemCount: unresolvedSupport, queueItemSeverity: toPriority('high', unresolvedSupport), sourceArea: 'support', nextRecommendedAction: 'support center で担当割当と期限を更新', relatedEntityType: 'support-case' },
        { queueType: 'notification_retry', queueState: notificationFailures > 0 ? 'retry_pending' : 'healthy', queueItemCount: notificationFailures, queueItemSeverity: toPriority('medium', notificationFailures), sourceArea: 'notification', nextRecommendedAction: 'failure reason を確認し safe retry を実行', relatedEntityType: 'notification-delivery' },
        { queueType: 'privacy_export_pending', queueState: pendingPrivacyActions > 0 ? 'pending' : 'healthy', queueItemCount: pendingPrivacyActions, queueItemSeverity: toPriority('high', pendingPrivacyActions), sourceArea: 'privacy', nextRecommendedAction: 'privacy center で優先度順に再処理', relatedEntityType: 'privacy-request' },
        { queueType: 'security_review_pending', queueState: securityReviewPending > 0 ? 'needs_review' : 'healthy', queueItemCount: securityReviewPending, queueItemSeverity: toPriority('high', securityReviewPending), sourceArea: 'security', nextRecommendedAction: 'security hub で open case を triage', relatedEntityType: 'security-investigation' },
      ]

      const anomalySummary = [
        { anomalyType: 'membership_entitlement_mismatch', anomalySeverity: toPriority('high', mismatchCount), anomalyState: mismatchCount > 0 ? 'detected' : 'clear', anomalyReason: 'membershipStatus / entitlementState / billingState の整合崩れ', sourceArea: 'membership', relatedEntityType: 'subscription-record', relatedEntityId: null, requiresReviewState: mismatchCount > 0 ? 'required' : 'none' },
        { anomalyType: 'support_backlog_spike', anomalySeverity: toPriority('high', unresolvedSupport), anomalyState: unresolvedSupport >= 20 ? 'detected' : 'normal', anomalyReason: '未解決 support case が閾値超過', sourceArea: 'support', relatedEntityType: 'support-case', relatedEntityId: null, requiresReviewState: unresolvedSupport >= 20 ? 'required' : 'none' },
        { anomalyType: 'notification_delivery_spike', anomalySeverity: toPriority('medium', notificationFailures), anomalyState: notificationFailures >= 10 ? 'detected' : 'normal', anomalyReason: '通知配信失敗が増加', sourceArea: 'notification', relatedEntityType: 'delivery-log', relatedEntityId: null, requiresReviewState: notificationFailures >= 10 ? 'required' : 'none' },
        { anomalyType: 'stale_summary_detected', anomalySeverity: toPriority('medium', staleSummaryCount), anomalyState: staleSummaryCount > 0 ? 'detected' : 'clear', anomalyReason: `app 側 summary の最終更新が ${staleThresholdHours}h を超過`, sourceArea: 'operations', relatedEntityType: 'app-user', relatedEntityId: null, requiresReviewState: staleSummaryCount > 0 ? 'required' : 'none' },
      ]

      const reconciliationSummary = [
        { reconciliationType: 'membership_sync', reconciliationState: mismatchCount > 0 ? 'detected' : 'not_needed', reconciliationReason: mismatchCount > 0 ? 'subscription と user domain の差分あり' : '差分なし', queueItemCount: mismatchCount, sourceArea: 'membership', nextRecommendedAction: mismatchCount > 0 ? 'dry-run で差分確認後に safe re-sync を実行' : '監視継続' },
        { reconciliationType: 'privacy_processing', reconciliationState: pendingPrivacyActions > 0 ? 'queued' : 'not_needed', reconciliationReason: pendingPrivacyActions > 0 ? 'privacy request が滞留' : '滞留なし', queueItemCount: pendingPrivacyActions, sourceArea: 'privacy', nextRecommendedAction: pendingPrivacyActions > 0 ? 'requestType ごとにキューを再評価' : '監視継続' },
        { reconciliationType: 'notification_delivery', reconciliationState: notificationFailures > 0 ? 'queued' : 'not_needed', reconciliationReason: notificationFailures > 0 ? 'delivery failure/retry pending あり' : '失敗なし', queueItemCount: notificationFailures, sourceArea: 'notification', nextRecommendedAction: notificationFailures > 0 ? '再送対象を抽出して safe retry' : '監視継続' },
      ]

      const playbookSummary = [
        { playbookType: 'support_backlog_triage', playbookState: unresolvedSupport > 0 ? 'ready' : 'suggested', playbookTriggerState: unresolvedSupport >= 10 ? 'triggered' : 'normal', playbookResultState: 'not_started', requiresConfirmation: false, sourceArea: 'support' },
        { playbookType: 'membership_mismatch_review', playbookState: mismatchCount > 0 ? 'requires_confirmation' : 'suggested', playbookTriggerState: mismatchCount > 0 ? 'triggered' : 'normal', playbookResultState: 'not_started', requiresConfirmation: true, sourceArea: 'membership' },
        { playbookType: 'notification_retry_review', playbookState: notificationFailures > 0 ? 'ready' : 'suggested', playbookTriggerState: notificationFailures > 0 ? 'triggered' : 'normal', playbookResultState: 'not_started', requiresConfirmation: false, sourceArea: 'notification' },
      ]

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          businessState: 'app-user domain',
          operations: 'ops summary derived in backend',
        },
        operationsSummary: {
          unresolvedState: unresolvedSupport > 0 ? 'has_unresolved' : 'healthy',
          backlogState: unresolvedSupport > 15 ? 'high_backlog' : unresolvedSupport > 0 ? 'backlog' : 'healthy',
          attentionState: [mismatchCount, unresolvedSupport, pendingPrivacyActions, securityReviewPending].some((count) => count > 0) ? 'required' : 'normal',
          opsPriorityState: toPriority('high', mismatchCount + unresolvedSupport + pendingPrivacyActions),
          lastCheckedAt: new Date().toISOString(),
          lastProcessedAt: playbookRunRows[0]?.createdAt ?? null,
          nextRecommendedAction: mismatchCount > 0 ? 'reconciliation タブで membership mismatch の dry-run を優先' : unresolvedSupport > 0 ? 'support backlog triage を実行' : 'queue summary を定時監視',
        },
        kpiSummary: {
          openSupportCases: unresolvedSupport,
          waitingUserCount: waitingUser,
          unresolvedCriticalIssues: queueSummary.filter((item) => item.queueItemSeverity === 'critical').reduce((acc, item) => acc + item.queueItemCount, 0),
          notificationFailures,
          pendingPrivacyActions,
          securityReviews: securityReviewPending,
          reconciliationNeededCount: reconciliationSummary.filter((item) => item.reconciliationState !== 'not_needed').reduce((acc, item) => acc + item.queueItemCount, 0),
        },
        queueSummary,
        anomalySummary,
        reconciliationSummary,
        playbookSummary,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('operations dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalOperationsDashboard failed: ${message}`)
      return ctx.internalServerError('operations dashboard summary の取得に失敗しました。')
    }
  },

  async internalReleaseDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.release.read')
      const rows = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { action: { $containsi: 'ops-release' } },
        fields: ['id', 'status', 'sourceSite', 'targetId', 'metadata', 'createdAt'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })
      const releaseItems = (rows as Array<Record<string, unknown>>).map(toReleaseAuditItem).slice(0, 80)

      const parityBlocked = releaseItems.filter((item) => ['blocked', 'drift_detected', 'review_needed'].includes(item.environmentParityState)).length
      const migrationHighRisk = releaseItems.filter((item) => ['high', 'destructive_like', 'irreversible_like'].includes(item.migrationRiskState)).length
      const blockedChanges = releaseItems.filter((item) => ['blocked', 'review_pending'].includes(item.releaseState) || ['pending', 'rejected'].includes(item.releaseApprovalState))
      const rollbackReady = releaseItems.filter((item) => ['prepared', 'available'].includes(item.rollbackState))
      const activeRollouts = releaseItems.filter((item) => ['staged', 'partial', 'paused'].includes(item.rolloutState))

      ctx.body = {
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          businessState: 'app-user domain',
          releaseControlPlane: 'internal_audit_log + release summary metadata',
        },
        releaseSummary: {
          totalCount: releaseItems.length,
          plannedCount: releaseItems.filter((item) => item.releaseState === 'planned').length,
          releasingCount: releaseItems.filter((item) => ['releasing', 'partially_released'].includes(item.releaseState)).length,
          verifiedCount: releaseItems.filter((item) => item.releaseState === 'verified').length,
          rolledBackCount: releaseItems.filter((item) => item.releaseState === 'rolled_back').length,
          blockedCount: blockedChanges.length,
          nextRecommendedAction: parityBlocked > 0 ? 'environment parity / config drift を解消してから release approve を進める' : activeRollouts.length > 0 ? 'active rollout の verification checklist を完了する' : 'planned release の review を進める',
        },
        deploymentSummary: {
          runningCount: releaseItems.filter((item) => item.deploymentState === 'running').length,
          failedCount: releaseItems.filter((item) => item.deploymentState === 'failed').length,
          readyCount: releaseItems.filter((item) => item.deploymentState === 'ready').length,
          completedCount: releaseItems.filter((item) => item.deploymentState === 'completed').length,
        },
        rolloutSummary: {
          activeCount: activeRollouts.length,
          pausedCount: releaseItems.filter((item) => item.rolloutState === 'paused').length,
          completedCount: releaseItems.filter((item) => item.rolloutState === 'completed').length,
          revertedCount: releaseItems.filter((item) => item.rolloutState === 'reverted').length,
        },
        rollbackSummary: {
          rollbackReadyCount: rollbackReady.length,
          runningCount: releaseItems.filter((item) => item.rollbackState === 'running').length,
          completedCount: releaseItems.filter((item) => item.rollbackState === 'completed').length,
          failedCount: releaseItems.filter((item) => item.rollbackState === 'failed').length,
        },
        environmentParitySummary: {
          alignedCount: releaseItems.filter((item) => item.environmentParityState === 'aligned').length,
          driftDetectedCount: releaseItems.filter((item) => item.environmentParityState === 'drift_detected').length,
          reviewNeededCount: releaseItems.filter((item) => item.environmentParityState === 'review_needed').length,
          blockedCount: releaseItems.filter((item) => item.environmentParityState === 'blocked').length,
          configDriftDetectedCount: releaseItems.filter((item) => ['missing_secret', 'runtime_mismatch', 'drift_detected'].includes(item.configDriftState)).length,
          lastParityCheckAt: releaseItems.find((item) => item.lastParityCheckAt)?.lastParityCheckAt ?? null,
        },
        migrationSummary: {
          notStartedCount: releaseItems.filter((item) => item.migrationState === 'not_started').length,
          runningCount: releaseItems.filter((item) => item.migrationState === 'running').length,
          completedCount: releaseItems.filter((item) => item.migrationState === 'completed').length,
          failedCount: releaseItems.filter((item) => item.migrationState === 'failed').length,
          highRiskCount: migrationHighRisk,
          destructiveLikeCount: releaseItems.filter((item) => item.migrationRiskState === 'destructive_like').length,
          irreversibleLikeCount: releaseItems.filter((item) => item.migrationRiskState === 'irreversible_like').length,
        },
        releaseNoteSummary: {
          internalDraftCount: releaseItems.filter((item) => item.releaseCommunicationState === 'draft').length,
          supportReadyCount: releaseItems.filter((item) => item.releaseCommunicationState === 'support_ready').length,
          publicPublishedCount: releaseItems.filter((item) => item.releaseVisibilityState === 'public' && item.releaseCommunicationState === 'published').length,
        },
        freezeSummary: {
          freezeActiveCount: releaseItems.filter((item) => item.freezeState === 'active').length,
          freezeExceptionCount: releaseItems.filter((item) => item.releaseWindowState === 'freeze_exception').length,
          hotfixCount: releaseItems.filter((item) => item.hotfixState === 'active').length,
        },
        blockedChanges: blockedChanges.slice(0, 20),
        activeRollouts: activeRollouts.slice(0, 20),
        rollbackReadyItems: rollbackReady.slice(0, 20),
        releases: releaseItems,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('release dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalReleaseDashboard failed: ${message}`)
      return ctx.internalServerError('release dashboard summary の取得に失敗しました。')
    }
  },

  async internalFlagDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.flag.read')
      const rows = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { action: { $containsi: 'ops-flag' } },
        fields: ['id', 'status', 'sourceSite', 'targetId', 'metadata', 'createdAt'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })
      const flagItems = (rows as Array<Record<string, unknown>>).map(toFlagAuditItem).slice(0, 120)
      const activeItems = flagItems.filter((item) => ['active_limited', 'active_partial', 'active_full'].includes(item.featureFlagState))
      const riskyItems = flagItems.filter((item) => item.killSwitchState === 'unavailable' || item.featureFlagState === 'active_full')
      const runningExperiments = flagItems.filter((item) => item.experimentState === 'running')
      const killSwitchReady = flagItems.filter((item) => ['available', 'armed'].includes(item.killSwitchState))

      ctx.body = {
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          businessState: 'app-user domain',
          runtimeExposureControlPlane: 'internal_audit_log + backend evaluation summary',
        },
        flagSummary: {
          totalCount: flagItems.length,
          draftCount: flagItems.filter((item) => item.featureFlagState === 'draft').length,
          activeLimitedCount: flagItems.filter((item) => item.featureFlagState === 'active_limited').length,
          activePartialCount: flagItems.filter((item) => item.featureFlagState === 'active_partial').length,
          activeFullCount: flagItems.filter((item) => item.featureFlagState === 'active_full').length,
          pausedCount: flagItems.filter((item) => item.featureFlagState === 'paused').length,
          disabledCount: flagItems.filter((item) => item.featureFlagState === 'disabled').length,
          riskyCount: riskyItems.length,
          nextRecommendedAction: riskyItems.length > 0 ? 'kill switch 非対応または active_full を優先見直し' : 'staged exposure の preview / simulation を継続',
        },
        experimentSummary: {
          runningCount: runningExperiments.length,
          pausedCount: flagItems.filter((item) => item.experimentState === 'paused').length,
          completedCount: flagItems.filter((item) => item.experimentState === 'completed').length,
          invalidatedCount: flagItems.filter((item) => item.experimentState === 'invalidated').length,
        },
        exposureSummary: {
          exposedCount: flagItems.filter((item) => item.exposureState === 'exposed').length,
          blockedCount: flagItems.filter((item) => item.exposureState === 'blocked').length,
          suppressedCount: flagItems.filter((item) => item.exposureState === 'suppressed').length,
          eligibleCount: flagItems.filter((item) => item.exposureState === 'eligible').length,
        },
        audienceSummary: {
          targetedCount: flagItems.filter((item) => item.audienceRuleState !== 'none').length,
          excludedCount: flagItems.filter((item) => item.audienceEligibilityState === 'excluded').length,
          memberTargetedCount: flagItems.filter((item) => ['active', 'grace'].includes(item.membershipStatus)).length,
          localeScopedCount: flagItems.filter((item) => item.locale !== 'all').length,
        },
        killSwitchSummary: {
          availableCount: killSwitchReady.length,
          armedCount: flagItems.filter((item) => item.killSwitchState === 'armed').length,
          triggeredCount: flagItems.filter((item) => item.killSwitchState === 'triggered').length,
          resetPendingCount: flagItems.filter((item) => item.killSwitchState === 'reset_pending').length,
        },
        evaluationSummary: {
          explainableCount: flagItems.filter((item) => item.evaluationReason.length >= 4).length,
          staleCount: flagItems.filter((item) => {
            const at = parseDateInput(item.lastEvaluatedAt)
            return at ? (Date.now() - at.getTime()) > (6 * 60 * 60 * 1000) : true
          }).length,
          activeCount: activeItems.length,
        },
        blockedOrRiskyFlags: riskyItems.slice(0, 20),
        runningExperiments: runningExperiments.slice(0, 20),
        killSwitchReadyItems: killSwitchReady.slice(0, 20),
        flags: flagItems,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('flag dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalFlagDashboard failed: ${message}`)
      return ctx.internalServerError('flag dashboard summary の取得に失敗しました。')
    }
  },

  async internalFlagEvaluation(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.flag.read')
      const flagKey = sanitizeText(ctx.query.flagKey, 140)
      const sourceSite = sanitizeSourceSite(ctx.query.sourceSite)
      const membershipStatus = sanitizeText(ctx.query.membershipStatus, 32) ?? 'guest'
      const entitlementState = sanitizeText(ctx.query.entitlementState, 32) ?? 'none'
      const lifecycleStage = sanitizeText(ctx.query.lifecycleStage, 32) ?? 'unknown'
      const locale = sanitizeText(ctx.query.locale, 12) ?? 'ja'
      const rolloutPercentage = Number(ctx.query.rolloutPercentage ?? 0)
      const hashSeed = `${flagKey ?? 'default'}:${membershipStatus}:${entitlementState}:${lifecycleStage}:${locale}:${sourceSite}`
      const hash = createHash('sha256').update(hashSeed).digest('hex')
      const bucket = parseInt(hash.slice(0, 8), 16) % 100
      const isEligibleMembership = ['active', 'grace', 'trialing'].includes(membershipStatus)
      const isEligibleEntitlement = ['granted', 'limited'].includes(entitlementState)
      const eligible = isEligibleMembership && isEligibleEntitlement
      const exposureState = eligible && bucket < rolloutPercentage ? 'exposed' : eligible ? 'eligible' : 'blocked'
      const assignmentState = eligible ? 'sticky_assigned' : 'excluded'
      const variantState = eligible && bucket % 2 === 0 ? 'control' : eligible ? 'variant_a' : 'not_assigned'

      ctx.body = {
        flagKey: flagKey ?? 'unknown',
        sourceSite: sourceSite === 'unknown' ? 'cross' : sourceSite,
        sourceArea: 'runtime-exposure-control',
        flagEvaluationState: 'evaluated',
        audienceEligibilityState: eligible ? 'eligible' : 'excluded',
        assignmentState,
        exposureState,
        variantState,
        evaluationReason: eligible
          ? `membershipStatus=${membershipStatus}, entitlementState=${entitlementState}, bucket=${bucket}, rolloutPercentage=${rolloutPercentage}`
          : `membershipStatus=${membershipStatus} または entitlementState=${entitlementState} が targeting 条件を満たしていません`,
        evaluationSummary: {
          membershipStatus,
          entitlementState,
          lifecycleStage,
          locale,
          rolloutPercentageState: String(Math.max(0, Math.min(100, rolloutPercentage))),
          evaluatedBucket: bucket,
        },
        lastEvaluatedAt: new Date().toISOString(),
        nextRecommendedAction: exposureState === 'blocked' ? 'audience ルールまたは rollout percentage を preview で見直す' : 'support / internal admin で exposure reason を共有',
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('flag evaluation の権限がありません。')
      strapi.log.error(`[analytics-event] internalFlagEvaluation failed: ${message}`)
      return ctx.internalServerError('flag evaluation に失敗しました。')
    }
  },

  async internalReleaseAction(ctx) {
    try {
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const actionType = sanitizeText(body.actionType, 40) ?? 'preview'
      const permission = actionType === 'approve'
        ? 'internal.release.approve'
        : actionType === 'execute'
          ? 'internal.release.execute'
          : actionType === 'rollback_execute'
            ? 'internal.release.rollback'
            : actionType === 'publish_note'
              ? 'internal.release.note.publish'
              : 'internal.release.read'
      const access = await requireInternalPermission(ctx, permission)
      const reason = sanitizeText(body.reason, 240)
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      const releaseId = sanitizeText(body.releaseId, 140) ?? `release:${Date.now()}`
      const sourceSite = sanitizeSourceSite(body.sourceSite) === 'unknown' ? 'cross' : sanitizeSourceSite(body.sourceSite)
      const dryRun = body.dryRun !== false
      const confirmed = Boolean(body.confirmed)
      if (['execute', 'rollback_execute'].includes(actionType) && !confirmed) return ctx.badRequest('execute / rollback_execute には confirmed=true が必要です。')

      const nowIso = new Date().toISOString()
      const migrationRiskState = sanitizeText(body.migrationRiskState, 32) ?? 'medium'
      const environmentParityState = sanitizeText(body.environmentParityState, 32) ?? 'review_needed'
      const releaseState = sanitizeText(body.releaseState, 32)
        ?? (actionType === 'approve' ? 'ready' : actionType === 'execute' ? 'releasing' : actionType === 'rollback_execute' ? 'rolled_back' : 'planned')
      const deploymentState = sanitizeText(body.deploymentState, 32)
        ?? (actionType === 'execute' ? 'running' : actionType === 'rollback_execute' ? 'rolled_back' : 'ready')
      const rolloutState = sanitizeText(body.rolloutState, 32)
        ?? (actionType === 'execute' ? 'staged' : actionType === 'rollback_execute' ? 'reverted' : 'not_started')
      const rollbackState = sanitizeText(body.rollbackState, 32)
        ?? (actionType === 'rollback_execute' ? 'completed' : 'available')

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'release-item',
          targetId: releaseId,
          action: `ops-release:${actionType}`,
          status: actionType === 'execute' && dryRun ? 'pending' : 'success',
          reason,
          sourceSite,
          beforeState: { releaseState: 'planned', rolloutState: 'not_started', rollbackState: 'prepared' },
          afterState: { releaseState, rolloutState, rollbackState },
          metadata: {
            releaseId,
            changeRequestId: sanitizeText(body.changeRequestId, 120) ?? `change:${releaseId}`,
            actionType,
            dryRun,
            confirmed,
            releaseState,
            deploymentState,
            rolloutState,
            rollbackState,
            migrationState: sanitizeText(body.migrationState, 32) ?? 'planned',
            migrationRiskState,
            environmentParityState,
            configDriftState: sanitizeText(body.configDriftState, 32) ?? 'review_needed',
            featureFlagState: sanitizeText(body.featureFlagState, 32) ?? 'ready',
            verificationState: sanitizeText(body.verificationState, 32) ?? 'pending',
            smokeCheckState: sanitizeText(body.smokeCheckState, 32) ?? 'pending',
            healthCheckState: sanitizeText(body.healthCheckState, 32) ?? 'pending',
            releaseCommunicationState: sanitizeText(body.releaseCommunicationState, 32) ?? 'draft',
            releaseVisibilityState: sanitizeText(body.releaseVisibilityState, 32) ?? 'internal_only',
            freezeState: sanitizeText(body.freezeState, 32) ?? 'none',
            hotfixState: sanitizeText(body.hotfixState, 32) ?? 'normal',
            releaseOwnerState: sanitizeText(body.releaseOwnerState, 32) ?? 'assigned',
            releaseApprovalState: sanitizeText(body.releaseApprovalState, 32) ?? (actionType === 'approve' ? 'approved' : 'review_pending'),
            releaseWindowState: sanitizeText(body.releaseWindowState, 32) ?? 'normal',
            lastVerifiedAt: actionType === 'verify' ? nowIso : null,
            lastRolledBackAt: actionType === 'rollback_execute' ? nowIso : null,
            lastParityCheckAt: ['parity_check', 'preview'].includes(actionType) ? nowIso : null,
            nextRecommendedAction: sanitizeText(body.nextRecommendedAction, 240) ?? (actionType === 'parity_check' ? 'drift があれば修正後に approval を再開' : actionType === 'execute' ? 'verification checklist を実行' : actionType === 'rollback_execute' ? 'incident dashboard / status page を更新' : 'reviewer の承認待ち'),
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        releaseId,
        actionType,
        dryRun,
        confirmed,
        releaseState,
        deploymentState,
        rolloutState,
        rollbackState,
        migrationRiskState,
        environmentParityState,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('release action の権限がありません。')
      strapi.log.error(`[analytics-event] internalReleaseAction failed: ${message}`)
      return ctx.internalServerError('release action 実行に失敗しました。')
    }
  },

  async internalFlagAction(ctx) {
    try {
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const actionType = sanitizeText(body.actionType, 40) ?? 'preview'
      const permission = actionType === 'approve'
        ? 'internal.flag.approve'
        : actionType === 'execute'
          ? 'internal.flag.execute'
          : actionType === 'kill_switch_trigger'
            ? 'internal.flag.emergency'
            : 'internal.flag.read'
      const access = await requireInternalPermission(ctx, permission)
      const reason = sanitizeText(body.reason, 240)
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      const flagKey = sanitizeText(body.flagKey, 140) ?? `flag:${Date.now()}`
      const sourceSite = sanitizeSourceSite(body.sourceSite) === 'unknown' ? 'cross' : sanitizeSourceSite(body.sourceSite)
      const confirmed = Boolean(body.confirmed)
      const dryRun = body.dryRun !== false
      if (['execute', 'kill_switch_trigger', 'reset'].includes(actionType) && !confirmed) return ctx.badRequest('execute / kill switch / reset は confirmed=true が必要です。')

      const nowIso = new Date().toISOString()
      const featureFlagState = sanitizeText(body.featureFlagState, 32)
        ?? (actionType === 'execute' ? 'active_partial' : actionType === 'kill_switch_trigger' ? 'disabled' : 'draft')
      const experimentState = sanitizeText(body.experimentState, 32) ?? (actionType === 'execute' ? 'running' : 'draft')
      const killSwitchState = sanitizeText(body.killSwitchState, 32)
        ?? (actionType === 'kill_switch_trigger' ? 'triggered' : actionType === 'reset' ? 'reset_pending' : 'available')
      const emergencyDisableState = sanitizeText(body.emergencyDisableState, 32)
        ?? (actionType === 'kill_switch_trigger' ? 'disabled' : 'idle')

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'feature-flag-item',
          targetId: flagKey,
          action: `ops-flag:${actionType}`,
          status: ['execute', 'kill_switch_trigger'].includes(actionType) && dryRun ? 'pending' : 'success',
          reason,
          sourceSite,
          beforeState: { featureFlagState: 'draft', killSwitchState: 'available' },
          afterState: { featureFlagState, killSwitchState },
          metadata: {
            flagKey,
            actionType,
            dryRun,
            confirmed,
            sourceArea: sanitizeText(body.sourceArea, 64) ?? 'runtime-exposure-control',
            featureFlagType: sanitizeText(body.featureFlagType, 32) ?? 'ui_flag',
            featureFlagState,
            flagVisibilityState: sanitizeText(body.flagVisibilityState, 32) ?? 'internal_only',
            flagEvaluationState: sanitizeText(body.flagEvaluationState, 32) ?? 'evaluated',
            experimentState,
            experimentType: sanitizeText(body.experimentType, 32) ?? 'ab_test',
            variantState: sanitizeText(body.variantState, 32) ?? 'control',
            assignmentState: sanitizeText(body.assignmentState, 32) ?? 'sticky_assigned',
            exposureState: sanitizeText(body.exposureState, 32) ?? (featureFlagState.startsWith('active') ? 'exposed' : 'blocked'),
            audienceRuleState: sanitizeText(body.audienceRuleState, 32) ?? 'inclusion_and_exclusion',
            audienceEligibilityState: sanitizeText(body.audienceEligibilityState, 32) ?? 'eligible',
            rolloutPercentageState: sanitizeText(body.rolloutPercentageState, 32) ?? '25',
            rolloutWindowState: sanitizeText(body.rolloutWindowState, 32) ?? 'always',
            killSwitchState,
            emergencyDisableState,
            evaluationReason: sanitizeText(body.evaluationReason, 240) ?? 'membershipStatus / entitlementState / lifecycleStage rule で評価',
            membershipStatus: sanitizeText(body.membershipStatus, 32) ?? 'active',
            entitlementState: sanitizeText(body.entitlementState, 32) ?? 'granted',
            subscriptionState: sanitizeText(body.subscriptionState, 32) ?? 'active',
            billingState: sanitizeText(body.billingState, 32) ?? 'clear',
            lifecycleStage: sanitizeText(body.lifecycleStage, 32) ?? 'engaged',
            locale: sanitizeText(body.locale, 12) ?? 'all',
            lastEvaluatedAt: nowIso,
            lastChangedAt: nowIso,
            lastDisabledAt: actionType === 'kill_switch_trigger' ? nowIso : null,
            nextRecommendedAction: sanitizeText(body.nextRecommendedAction, 240) ?? (actionType === 'kill_switch_trigger' ? 'incident dashboard / status page / support center の通知を更新' : actionType === 'execute' ? 'staged rollout の監視を継続' : 'preview / simulation で評価結果を確認'),
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        flagKey,
        actionType,
        dryRun,
        confirmed,
        featureFlagState,
        experimentState,
        killSwitchState,
        emergencyDisableState,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('flag action の権限がありません。')
      strapi.log.error(`[analytics-event] internalFlagAction failed: ${message}`)
      return ctx.internalServerError('flag action 実行に失敗しました。')
    }
  },

  async internalSupportPolicyDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.support.read')
      const rows = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { action: { $containsi: 'ops-support-policy' } },
        fields: ['id', 'status', 'sourceSite', 'targetId', 'metadata', 'createdAt'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })
      const policies = (rows as Array<Record<string, unknown>>).map(toSupportPolicyAuditItem).slice(0, 120)
      const reviewQueue = policies.filter((item) => ['under_review', 'draft'].includes(item.policyState) || ['in_review', 'changes_requested'].includes(item.policyReviewState))
      const guardrailBreaches = policies.filter((item) => ['breached', 'auto_paused_like'].includes(item.experimentGuardrailState) || item.guardrailState === 'breached')
      const rollbackReadyItems = policies.filter((item) => ['prepared', 'recommended'].includes(item.rollbackState))

      ctx.body = {
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          supportPolicyControlPlane: 'internal_audit_log + support policy governance metadata',
          audit: 'internal_audit_log',
        },
        policySummary: {
          totalCount: policies.length,
          draftCount: policies.filter((item) => item.policyState === 'draft').length,
          underReviewCount: policies.filter((item) => item.policyState === 'under_review').length,
          activeCount: policies.filter((item) => item.policyState === 'active').length,
          pausedCount: policies.filter((item) => item.policyState === 'paused').length,
          rolledBackCount: policies.filter((item) => item.policyState === 'rolled_back').length,
          reviewNeededCount: reviewQueue.length,
          nextRecommendedAction: guardrailBreaches.length > 0
            ? 'guardrail breach の rollback recommendation を優先確認'
            : reviewQueue.length > 0
              ? 'review queue で multilingual safety check を処理'
              : 'staged rollout 後の effectiveness / audit を確認',
        },
        experimentSummary: {
          runningCount: policies.filter((item) => item.experimentState === 'running').length,
          pausedCount: policies.filter((item) => item.experimentState === 'paused').length,
          completedCount: policies.filter((item) => item.experimentState === 'completed').length,
          invalidatedCount: policies.filter((item) => item.experimentState === 'invalidated').length,
        },
        guardrailSummary: {
          healthyCount: policies.filter((item) => item.experimentGuardrailState === 'healthy').length,
          warningCount: policies.filter((item) => ['warning'].includes(item.experimentGuardrailState)).length,
          breachedCount: policies.filter((item) => item.experimentGuardrailState === 'breached' || item.guardrailState === 'breached').length,
          autoPausedLikeCount: policies.filter((item) => item.experimentGuardrailState === 'auto_paused_like').length,
        },
        rollbackSummary: {
          preparedCount: policies.filter((item) => item.rollbackState === 'prepared').length,
          recommendedCount: policies.filter((item) => item.rollbackState === 'recommended').length,
          runningCount: policies.filter((item) => item.rollbackState === 'running').length,
          completedCount: policies.filter((item) => item.rollbackState === 'completed').length,
          failedCount: policies.filter((item) => item.rollbackState === 'failed').length,
        },
        multilingualSafetySummary: {
          safeCount: policies.filter((item) => item.multilingualSafetyState === 'safe').length,
          reviewNeededCount: policies.filter((item) => item.multilingualSafetyState === 'review_needed').length,
          blockedCount: policies.filter((item) => item.multilingualSafetyState === 'blocked').length,
          degradedLikeCount: policies.filter((item) => item.multilingualSafetyState === 'degraded_like').length,
        },
        auditSummary: {
          recordedCount: policies.filter((item) => item.auditState === 'recorded').length,
          reviewedCount: policies.filter((item) => item.auditState === 'reviewed').length,
          anomalyCount: policies.filter((item) => item.auditState === 'anomaly_detected').length,
          completeTrailCount: policies.filter((item) => item.auditTrailState === 'complete').length,
        },
        localeImpactSummary: {
          lowCount: policies.filter((item) => item.localeImpactState === 'low').length,
          mediumCount: policies.filter((item) => item.localeImpactState === 'medium').length,
          highCount: policies.filter((item) => item.localeImpactState === 'high').length,
          criticalCount: policies.filter((item) => item.localeImpactState === 'critical').length,
        },
        riskSummary: {
          lowCount: policies.filter((item) => item.changeRiskState === 'low').length,
          mediumCount: policies.filter((item) => item.changeRiskState === 'medium').length,
          highCount: policies.filter((item) => item.changeRiskState === 'high').length,
          criticalCount: policies.filter((item) => item.changeRiskState === 'critical').length,
        },
        reviewQueue: reviewQueue.slice(0, 30),
        guardrailBreaches: guardrailBreaches.slice(0, 30),
        rollbackReadyItems: rollbackReadyItems.slice(0, 30),
        policies,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('support policy dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalSupportPolicyDashboard failed: ${message}`)
      return ctx.internalServerError('support policy dashboard の取得に失敗しました。')
    }
  },

  async internalSupportPolicyAction(ctx) {
    try {
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const actionType = sanitizeText(body.actionType, 40) ?? 'draft'
      const permission = actionType === 'approve'
        ? 'internal.support.policy.approve'
        : ['activate', 'rollback_execute'].includes(actionType)
          ? 'internal.support.policy.execute'
          : 'internal.support.read'
      const access = await requireInternalPermission(ctx, permission)
      const reason = sanitizeText(body.reason, 240)
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      const policyId = sanitizeText(body.policyId, 140) ?? `support-policy:${Date.now()}`
      const sourceSite = sanitizeSourceSite(body.sourceSite) === 'unknown' ? 'cross' : sanitizeSourceSite(body.sourceSite)
      const dryRun = body.dryRun !== false
      const confirmed = Boolean(body.confirmed)
      if (['activate', 'rollback_execute'].includes(actionType) && !confirmed) return ctx.badRequest('activate / rollback_execute は confirmed=true が必要です。')

      const nowIso = new Date().toISOString()
      const policyState = sanitizeText(body.policyState, 32)
        ?? (actionType === 'activate' ? 'active' : actionType === 'rollback_execute' ? 'rolled_back' : actionType === 'pause' ? 'paused' : actionType === 'request_review' ? 'under_review' : 'draft')
      const policyReviewState = sanitizeText(body.policyReviewState, 32)
        ?? (actionType === 'request_review' ? 'in_review' : actionType === 'approve' ? 'approved' : 'not_started')
      const policyApprovalState = sanitizeText(body.policyApprovalState, 32)
        ?? (actionType === 'approve' ? 'approved' : 'pending')
      const rollbackState = sanitizeText(body.rollbackState, 32)
        ?? (actionType === 'rollback_execute' ? 'completed' : actionType === 'rollback_prepare' ? 'prepared' : 'not_needed')

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'support-policy-item',
          targetId: policyId,
          action: `ops-support-policy:${actionType}`,
          status: ['activate', 'rollback_execute'].includes(actionType) && dryRun ? 'pending' : 'success',
          reason,
          sourceSite,
          beforeState: { policyState: 'draft', rollbackState: 'not_needed' },
          afterState: { policyState, rollbackState },
          metadata: {
            policyId,
            actionType,
            sourceArea: sanitizeText(body.sourceArea, 64) ?? 'support-governance',
            dryRun,
            confirmed,
            policySummary: sanitizeText(body.policySummary, 240) ?? 'support optimization governance update',
            policyState,
            policyDraftState: sanitizeText(body.policyDraftState, 32) ?? (actionType === 'draft' ? 'drafting' : 'ready_for_review'),
            policyReviewState,
            policyApprovalState,
            policyActivationState: sanitizeText(body.policyActivationState, 32) ?? (actionType === 'activate' ? 'staged_rollout' : 'not_scheduled'),
            policyEffectivenessState: sanitizeText(body.policyEffectivenessState, 32) ?? 'unknown',
            experimentState: sanitizeText(body.experimentState, 32) ?? (actionType === 'activate' ? 'running' : 'draft'),
            experimentVariantState: sanitizeText(body.experimentVariantState, 40) ?? 'control',
            experimentGuardrailState: sanitizeText(body.experimentGuardrailState, 32) ?? 'healthy',
            guardrailState: sanitizeText(body.guardrailState, 32) ?? 'healthy',
            guardrailReason: sanitizeText(body.guardrailReason, 240) ?? 'initial guardrail check',
            multilingualSafetyState: sanitizeText(body.multilingualSafetyState, 32) ?? 'not_checked',
            multilingualSafetyReviewState: sanitizeText(body.multilingualSafetyReviewState, 32) ?? 'not_started',
            rollbackState,
            rollbackReason: sanitizeText(body.rollbackReason, 240) ?? (actionType === 'rollback_execute' ? 'guardrail breach detected' : 'rollback plan maintained'),
            rollbackPreparednessState: sanitizeText(body.rollbackPreparednessState, 32) ?? (['rollback_prepare', 'activate'].includes(actionType) ? 'ready' : 'not_ready'),
            auditState: sanitizeText(body.auditState, 32) ?? 'recorded',
            auditTrailState: sanitizeText(body.auditTrailState, 32) ?? 'complete',
            auditVisibilityState: sanitizeText(body.auditVisibilityState, 32) ?? 'ops_and_support',
            localeImpactState: sanitizeText(body.localeImpactState, 32) ?? 'medium',
            changeRiskState: sanitizeText(body.changeRiskState, 32) ?? (actionType === 'rollback_execute' ? 'high' : 'medium'),
            regionalPolicyTemplateState: sanitizeText(body.regionalPolicyTemplateState, 32) ?? 'active',
            policyLastReviewedAt: nowIso,
            policyLastActivatedAt: actionType === 'activate' ? nowIso : null,
            policyLastRolledBackAt: actionType === 'rollback_execute' ? nowIso : null,
            policyLastAuditedAt: nowIso,
            nextRecommendedAction: sanitizeText(body.nextRecommendedAction, 240)
              ?? (actionType === 'request_review'
                ? 'multilingual safety review queue で locale impact を確認'
                : actionType === 'activate'
                  ? 'guardrail dashboard で breach 監視を継続'
                  : actionType === 'rollback_execute'
                    ? 'rollback 後に policy effectiveness / support quality を監査'
                    : 'policy registry で次アクションを確認'),
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        policyId,
        actionType,
        dryRun,
        confirmed,
        policyState,
        policyReviewState,
        policyApprovalState,
        rollbackState,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('support policy action の権限がありません。')
      strapi.log.error(`[analytics-event] internalSupportPolicyAction failed: ${message}`)
      return ctx.internalServerError('support policy action 実行に失敗しました。')
    }
  },

  async internalScheduledChecksRun(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const now = new Date()
      const nowIso = now.toISOString()
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const triggerMode = sanitizeText(body.triggerMode, 24) ?? 'manual'
      const sourceSite = sanitizeSourceSite(body.sourceSite)
      const checkCatalog = [
        { scheduledCheckType: 'membership_entitlement_mismatch', sourceArea: 'membership', staleHours: 6 },
        { scheduledCheckType: 'billing_subscription_mismatch', sourceArea: 'billing', staleHours: 6 },
        { scheduledCheckType: 'notification_failure_spike', sourceArea: 'notification', staleHours: 2 },
        { scheduledCheckType: 'privacy_request_stall', sourceArea: 'privacy', staleHours: 8 },
        { scheduledCheckType: 'security_review_stall', sourceArea: 'security', staleHours: 4 },
        { scheduledCheckType: 'support_backlog_spike', sourceArea: 'support', staleHours: 2 },
        { scheduledCheckType: 'summary_sync_stale', sourceArea: 'operations', staleHours: 6 },
      ] as const

      const staleLimitMs = 6 * 60 * 60 * 1000
      const [subscriptions, appUsers, notifications, inquiries, investigations] = await Promise.all([
        strapi.documents('api::subscription-record.subscription-record').findMany({ fields: ['billingStatus', 'subscriptionStatus', 'membershipStatus', 'entitlementState', 'syncState', 'updatedAt'], limit: BI_MAX_FETCH_ROWS }),
        strapi.documents('api::app-user.app-user').findMany({ fields: ['membershipStatus', 'subscriptionState', 'entitlementState', 'billingState', 'updatedAt', 'deletionRequestState', 'deletionState', 'privacyNoticeState'], limit: BI_MAX_FETCH_ROWS }),
        strapi.documents('api::delivery-log.delivery-log').findMany({ fields: ['status', 'createdAt'], limit: BI_MAX_FETCH_ROWS }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({ fields: ['status', 'submittedAt', 'updatedAt'], limit: BI_MAX_FETCH_ROWS }),
        strapi.documents('api::security-investigation.security-investigation').findMany({ fields: ['investigationState', 'updatedAt'], limit: BI_MAX_FETCH_ROWS }),
      ])

      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const appUserRows = appUsers as Array<Record<string, unknown>>
      const notificationRows = notifications as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const investigationRows = investigations as Array<Record<string, unknown>>

      const mismatchMembership = subscriptionRows.filter((row) => {
        const membership = String(row.membershipStatus ?? '')
        const entitlement = String(row.entitlementState ?? '')
        const billing = String(row.billingStatus ?? '')
        return (membership === 'active' && entitlement === 'inactive') || (membership === 'grace' && billing === 'failed') || String(row.syncState ?? '') === 'mismatch_detected'
      }).length
      const mismatchBilling = appUserRows.filter((row) => {
        const billing = String(row.billingState ?? '')
        const subscriptionState = String(row.subscriptionState ?? '')
        return (billing === 'failed' && ['active', 'trialing'].includes(subscriptionState)) || (billing === 'clear' && subscriptionState === 'past_due')
      }).length
      const notificationFailure = notificationRows.filter((row) => ['failed', 'bounced', 'retry_pending'].includes(String(row.status ?? ''))).length
      const privacyStall = appUserRows.filter((row) => ['requested', 'pending_review', 'queued', 'in_progress'].includes(String(row.deletionRequestState ?? '')) || ['pending', 'queued', 'in_progress'].includes(String(row.deletionState ?? '')) || ['review_needed', 'pending'].includes(String(row.privacyNoticeState ?? ''))).length
      const securityStall = investigationRows.filter((row) => ['open', 'pending', 'needs_review'].includes(String(row.investigationState ?? ''))).length
      const supportBacklog = inquiryRows.filter((row) => ['new', 'in_review', 'waiting_reply', 'reopened'].includes(String(row.status ?? ''))).length
      const staleSummary = appUserRows.filter((row) => {
        const updatedAt = parseDateInput(row.updatedAt)
        return updatedAt ? (now.getTime() - updatedAt.getTime() > staleLimitMs) : true
      }).length

      const resultMap: Record<string, { detectedCount: number; alertSeverity: 'low' | 'medium' | 'high' }> = {
        membership_entitlement_mismatch: { detectedCount: mismatchMembership, alertSeverity: mismatchMembership >= 10 ? 'high' : mismatchMembership >= 3 ? 'medium' : 'low' },
        billing_subscription_mismatch: { detectedCount: mismatchBilling, alertSeverity: mismatchBilling >= 8 ? 'high' : mismatchBilling >= 3 ? 'medium' : 'low' },
        notification_failure_spike: { detectedCount: notificationFailure, alertSeverity: notificationFailure >= 20 ? 'high' : notificationFailure >= 8 ? 'medium' : 'low' },
        privacy_request_stall: { detectedCount: privacyStall, alertSeverity: privacyStall >= 10 ? 'high' : privacyStall >= 3 ? 'medium' : 'low' },
        security_review_stall: { detectedCount: securityStall, alertSeverity: securityStall >= 10 ? 'high' : securityStall >= 3 ? 'medium' : 'low' },
        support_backlog_spike: { detectedCount: supportBacklog, alertSeverity: supportBacklog >= 20 ? 'high' : supportBacklog >= 8 ? 'medium' : 'low' },
        summary_sync_stale: { detectedCount: staleSummary, alertSeverity: staleSummary >= 50 ? 'high' : staleSummary >= 10 ? 'medium' : 'low' },
      }

      const checks = checkCatalog.map((check) => {
        const result = resultMap[check.scheduledCheckType]
        const alertState = result.detectedCount > 0 ? 'detected' : 'clear'
        const scheduledCheckState = 'completed'
        return {
          ...check,
          scheduledCheckState,
          detectedCount: result.detectedCount,
          alertState,
          alertSeverity: result.alertSeverity,
          alertPriority: toPriority(result.alertSeverity, result.detectedCount),
          lastCheckedAt: nowIso,
          nextRecommendedAction: result.detectedCount > 0 ? `${check.sourceArea} の triage を開始` : '監視継続',
        }
      })

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'scheduled-check-run',
          targetId: `scheduled-checks:${now.getTime()}`,
          action: 'ops-scheduled-check:run',
          status: 'success',
          reason: `triggerMode=${triggerMode}`,
          sourceSite: sourceSite === 'unknown' ? 'cross' : sourceSite,
          beforeState: { scheduledCheckState: 'queued' },
          afterState: { scheduledCheckState: 'completed', detectedTotal: checks.reduce((acc, item) => acc + item.detectedCount, 0) },
          metadata: { triggerMode, checks },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })
      ctx.body = {
        triggerMode,
        sourceSite,
        checkCount: checks.length,
        detectedAlerts: checks.filter((item) => item.detectedCount > 0).length,
        checks,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('scheduled checks の実行権限がありません。')
      strapi.log.error(`[analytics-event] internalScheduledChecksRun failed: ${message}`)
      return ctx.internalServerError('scheduled checks の実行に失敗しました。')
    }
  },


  async publicStatusSummary(ctx) {
    try {
      const sourceSite = sanitizeText(ctx.query?.sourceSite, 20) ?? 'main'
      const logs = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: {
          action: {
            $containsi: 'ops-incident-communication',
          },
          status: { $ne: 'denied' },
        },
        fields: ['action', 'status', 'sourceSite', 'targetId', 'metadata', 'createdAt'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })

      const items = (logs as Array<Record<string, unknown>>)
        .map(toCommunicationItem)
        .filter((item) => item.publishingState === 'published' && (item.sourceSite === 'cross' || item.sourceSite === sourceSite))

      const current = pickCurrentStatus(items)
      const active = items.filter((item) => ['published', 'update_posted'].includes(item.incidentCommunicationPhase) && !['resolved', 'closed'].includes(item.incidentCommunicationPhase)).slice(0, STATUS_PUBLIC_HISTORY_LIMIT)
      const maintenance = items.filter((item) => item.statusState.includes('maintenance')).slice(0, STATUS_PUBLIC_HISTORY_LIMIT)
      const resolved = items.filter((item) => ['resolved_notice_posted', 'closed'].includes(item.incidentCommunicationPhase)).slice(0, STATUS_PUBLIC_HISTORY_LIMIT)
      const postmortems = items.filter((item) => item.postmortemState === 'published').slice(0, STATUS_PUBLIC_HISTORY_LIMIT)
      const knowledge = items.filter((item) => item.knowledgeArticleState === 'published').slice(0, STATUS_PUBLIC_HISTORY_LIMIT)

      ctx.body = {
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          businessState: 'app-user domain',
          statusSummary: 'internal_audit_log communication summaries',
        },
        publicStatusSummary: {
          statusState: current.statusState,
          statusSeverity: current.statusSeverity,
          statusVisibilityState: 'public',
          publishingState: current.publishingState,
          affectedAreaState: current.affectedAreaState,
          userActionRecommendationState: current.userActionRecommendationState,
          nextUpdateAt: current.nextUpdateAt,
          lastUpdatedAt: current.lastUpdatedAt,
        },
        maintenanceSummary: maintenance,
        incidentCommunicationSummary: active,
        activeIncidentCommunications: active,
        resolvedIncidentCommunications: resolved,
        postmortemSummary: postmortems,
        knowledgeSummary: knowledge,
      }
    } catch (error) {
      strapi.log.error(`[analytics-event] publicStatusSummary failed: ${(error as Error).message}`)
      return ctx.internalServerError('public status summary の取得に失敗しました。')
    }
  },

  async internalIncidentDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const logs = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: {
          action: {
            $containsi: 'ops-',
          },
        },
        fields: ['action', 'status', 'reason', 'sourceSite', 'targetType', 'targetId', 'metadata', 'createdAt', 'actorLogtoUserId'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })

      const rows = logs as Array<Record<string, unknown>>
      const checkLogs = rows.filter((row) => getActionPrefix(row.action) === 'ops-scheduled-check')
      const triageLogs = rows.filter((row) => getActionPrefix(row.action) === 'ops-incident-triage')
      const approvalLogs = rows.filter((row) => getActionPrefix(row.action) === 'ops-approval')
      const batchLogs = rows.filter((row) => getActionPrefix(row.action) === 'ops-batch-operation')
      const escalationLogs = rows.filter((row) => getActionPrefix(row.action) === 'ops-escalation')

      const latestCheck = checkLogs[0]
      const latestCheckMetadata = parseJsonObject(latestCheck?.metadata)
      const latestChecks = Array.isArray(latestCheckMetadata.checks) ? latestCheckMetadata.checks as Array<Record<string, unknown>> : []
      const alertItems = latestChecks.map((item, index) => ({
        alertId: `${String(item.scheduledCheckType ?? 'check')}:${index}`,
        alertType: String(item.scheduledCheckType ?? 'unknown'),
        alertSeverity: String(item.alertSeverity ?? 'low'),
        alertPriority: String(item.alertPriority ?? 'low'),
        alertState: String(item.alertState ?? 'detected'),
        alertReason: String(item.nextRecommendedAction ?? ''),
        sourceArea: String(item.sourceArea ?? 'operations'),
        detectedCount: Number(item.detectedCount ?? 0),
        requiresReviewState: Number(item.detectedCount ?? 0) > 0 ? 'required' : 'none',
      }))

      const incidentItems = triageLogs.slice(0, 20).map((row) => {
        const metadata = parseJsonObject(row.metadata)
        return {
          incidentId: String(row.targetId ?? ''),
          incidentType: String(metadata.incidentType ?? 'operations_incident'),
          incidentSeverity: String(metadata.incidentSeverity ?? 'medium'),
          incidentPriority: String(metadata.incidentPriority ?? 'medium'),
          incidentState: String(metadata.incidentState ?? 'open'),
          incidentOwnerState: String(metadata.incidentOwnerState ?? 'unassigned'),
          incidentResolutionState: String(metadata.incidentResolutionState ?? 'pending'),
          escalationState: String(metadata.escalationState ?? 'none'),
          blockedState: String(metadata.blockedState ?? 'none'),
          nextRecommendedAction: String(metadata.nextRecommendedAction ?? 'runbook を確認'),
          sourceArea: String(metadata.sourceArea ?? row.sourceSite ?? 'cross'),
          createdAt: row.createdAt,
        }
      })

      const approvalItems = approvalLogs.slice(0, 20).map((row) => {
        const metadata = parseJsonObject(row.metadata)
        return {
          approvalId: String(row.targetId ?? ''),
          approvalType: String(metadata.approvalType ?? 'batch_operation'),
          approvalState: String(metadata.approvalState ?? 'pending'),
          approvalReason: String(row.reason ?? ''),
          approvalActor: String(row.actorLogtoUserId ?? ''),
          requiresApprovalState: 'required',
          createdAt: row.createdAt,
        }
      })

      const batchItems = batchLogs.slice(0, 20).map((row) => {
        const metadata = parseJsonObject(row.metadata)
        return {
          batchOperationId: String(row.targetId ?? ''),
          batchOperationType: String(metadata.batchOperationType ?? 'unknown'),
          batchOperationScope: String(metadata.batchOperationScope ?? 'cross'),
          batchOperationState: String(metadata.batchOperationState ?? toSummaryLogState(String(row.status ?? 'pending'))),
          batchOperationPreviewState: String(metadata.batchOperationPreviewState ?? 'preview_ready'),
          batchOperationDryRunState: String(metadata.batchOperationDryRunState ?? 'not_started'),
          batchOperationResultState: String(metadata.batchOperationResultState ?? 'not_started'),
          requiresApprovalState: String(metadata.requiresApprovalState ?? 'required'),
          lastExecutedAt: row.createdAt,
        }
      })

      const escalationItems = escalationLogs.slice(0, 20).map((row) => {
        const metadata = parseJsonObject(row.metadata)
        return {
          escalationId: String(row.targetId ?? ''),
          escalationState: String(metadata.escalationState ?? toSummaryLogState(String(row.status ?? 'pending'))),
          escalationReason: String(row.reason ?? ''),
          escalationTarget: String(metadata.escalationTarget ?? 'ops_lead'),
          incidentId: String(metadata.incidentId ?? ''),
          createdAt: row.createdAt,
        }
      })

      const unresolvedIncidentCount = incidentItems.filter((item) => !['resolved', 'closed'].includes(item.incidentState)).length
      const blockedIncidentCount = incidentItems.filter((item) => ['blocked', 'waiting_approval', 'waiting_external'].includes(item.incidentState) || item.blockedState === 'blocked').length
      const staleIncidentCount = incidentItems.filter((item) => item.incidentState === 'open' && parseDateInput(item.createdAt) ? (Date.now() - new Date(String(item.createdAt)).getTime()) > 24 * 60 * 60 * 1000 : false).length

      ctx.body = {
        sourceOfTruth: {
          auth: 'supabase-auth(auth.users)',
          businessState: 'app-user domain',
          operationsControlPlane: 'internal_audit_log + scheduled check result',
        },
        scheduledCheckSummary: {
          scheduledCheckState: latestCheck ? 'completed' : 'idle',
          scheduledCheckTypeCount: latestChecks.length,
          lastCheckedAt: latestCheck?.createdAt ?? null,
          lastTriggeredAt: latestCheck?.createdAt ?? null,
          staleCheckCount: alertItems.filter((item) => item.alertType.includes('stale')).length,
        },
        alertSummary: {
          totalCount: alertItems.length,
          detectedCount: alertItems.filter((item) => item.alertState === 'detected').length,
          criticalCount: alertItems.filter((item) => item.alertPriority === 'critical').length,
          nextRecommendedAction: alertItems.some((item) => item.alertPriority === 'critical') ? 'critical alert を incident 化して owner を割当' : 'detected alert を triage',
          items: alertItems,
        },
        incidentSummary: {
          totalCount: incidentItems.length,
          unresolvedCount: unresolvedIncidentCount,
          blockedCount: blockedIncidentCount,
          staleCount: staleIncidentCount,
          escalatedCount: incidentItems.filter((item) => item.escalationState === 'escalated').length,
          nextRecommendedAction: unresolvedIncidentCount > 0 ? '未解決 incident の owner 割当と承認待ち整理' : 'scheduled checks を定期実行',
          items: incidentItems,
        },
        approvalSummary: {
          totalCount: approvalItems.length,
          pendingCount: approvalItems.filter((item) => item.approvalState === 'pending').length,
          rejectedCount: approvalItems.filter((item) => item.approvalState === 'rejected').length,
          lastApprovedAt: approvalItems.find((item) => item.approvalState === 'approved')?.createdAt ?? null,
          items: approvalItems,
        },
        batchOperationSummary: {
          totalCount: batchItems.length,
          pendingApprovalCount: batchItems.filter((item) => item.batchOperationState === 'pending_approval').length,
          runningCount: batchItems.filter((item) => item.batchOperationState === 'running').length,
          failedCount: batchItems.filter((item) => item.batchOperationResultState === 'failed' || item.batchOperationState === 'failed').length,
          lastExecutedAt: batchItems[0]?.lastExecutedAt ?? null,
          items: batchItems,
        },
        escalationSummary: {
          totalCount: escalationItems.length,
          activeCount: escalationItems.filter((item) => !['completed', 'resolved'].includes(item.escalationState)).length,
          completedCount: escalationItems.filter((item) => ['completed', 'resolved'].includes(item.escalationState)).length,
          items: escalationItems,
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('incident dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalIncidentDashboard failed: ${message}`)
      return ctx.internalServerError('incident dashboard summary の取得に失敗しました。')
    }
  },


  async internalIncidentCommunicationsDashboard(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.status.read')
      const rows = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { action: { $containsi: 'ops-incident-communication' } },
        fields: ['status', 'sourceSite', 'targetId', 'metadata', 'createdAt', 'actorLogtoUserId'],
        sort: ['createdAt:desc'],
        limit: BI_MAX_FETCH_ROWS,
      })
      const items = (rows as Array<Record<string, unknown>>).map(toCommunicationItem)
      ctx.body = {
        summary: {
          totalCount: items.length,
          draftCount: items.filter((item) => item.publishingState === 'draft').length,
          reviewCount: items.filter((item) => item.publishingState === 'review').length,
          publishedCount: items.filter((item) => item.publishingState === 'published').length,
          postmortemPendingCount: items.filter((item) => item.incidentCommunicationPhase === 'postmortem_pending').length,
          staleCount: items.filter((item) => item.lastUpdatedAt && (Date.now() - (parseDateInput(item.lastUpdatedAt)?.getTime() ?? 0)) > 6 * 60 * 60 * 1000).length,
        },
        items: items.slice(0, 60),
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('incident communications dashboard の権限がありません。')
      strapi.log.error(`[analytics-event] internalIncidentCommunicationsDashboard failed: ${message}`)
      return ctx.internalServerError('incident communications dashboard の取得に失敗しました。')
    }
  },

  async internalIncidentCommunicationPublish(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.status.publish')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const sourceIncidentId = sanitizeText(body.sourceIncidentId, 120) ?? `incident:${Date.now()}`
      const sourceSite = sanitizeText(body.sourceSite, 20) ?? 'cross'
      const sourceArea = sanitizeText(body.sourceArea, 40) ?? 'operations'
      const statusState = sanitizeText(body.statusState, 40) ?? 'degraded_performance'
      const maintenanceState = sanitizeText(body.maintenanceState, 40) ?? 'none'
      const maintenanceType = sanitizeText(body.maintenanceType, 20) ?? 'planned'
      const incidentCommunicationPhase = sanitizeText(body.incidentCommunicationPhase, 40) ?? 'draft'
      const publishingState = sanitizeText(body.publishingState, 20) ?? 'draft'
      const publicTitle = sanitizeText(body.publicTitle, 140) ?? '運用状況のお知らせ'
      const publicSummary = sanitizeText(body.publicSummary, 500) ?? ''
      const userActionRecommendationState = sanitizeText(body.userActionRecommendationState, 240) ?? 'しばらくしてから再試行し、解消しない場合はサポートへお問い合わせください。'
      const reason = sanitizeText(body.reason, 240)
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      const affectedAreaState = Array.isArray(body.affectedAreaState)
        ? body.affectedAreaState.map((item) => sanitizeText(item, 40)).filter(Boolean)
        : []

      const communicationId = sanitizeText(body.communicationId, 120) ?? `status:${Date.now()}`
      const nowIso = new Date().toISOString()
      const publishedAt = publishingState === 'published' ? nowIso : null
      const postmortemState = sanitizeText(body.postmortemState, 40) ?? 'not_started'
      const rcaState = sanitizeText(body.rcaState, 40) ?? 'not_started'
      const rootCauseCategory = sanitizeText(body.rootCauseCategory, 40) ?? 'unknown'
      const correctiveActionState = sanitizeText(body.correctiveActionState, 40) ?? 'pending'
      const preventionActionState = sanitizeText(body.preventionActionState, 40) ?? 'pending'
      const knowledgeArticleState = sanitizeText(body.knowledgeArticleState, 40) ?? 'not_started'
      const knowledgeSummary = sanitizeText(body.knowledgeSummary, 240) ?? ''

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'incident-communication',
          targetId: communicationId,
          action: `ops-incident-communication:${incidentCommunicationPhase}`,
          status: publishingState === 'published' ? 'success' : 'pending',
          reason,
          sourceSite,
          beforeState: { publishingState: 'draft' },
          afterState: { publishingState },
          metadata: {
            sourceIncidentId,
            sourceArea,
            sourceSite,
            communicationType: maintenanceState !== 'none' ? 'maintenance_notice' : 'incident_notice',
            statusState,
            statusSeverity: mapStatusSeverity(statusState),
            statusVisibilityState: 'public',
            maintenanceState,
            maintenanceType,
            maintenanceWindowState: sanitizeText(body.maintenanceWindowState, 40) ?? 'none',
            incidentCommunicationState: sanitizeText(body.incidentCommunicationState, 40) ?? 'active',
            incidentCommunicationPhase,
            impactSummaryState: sanitizeText(body.impactSummaryState, 40) ?? 'limited',
            affectedAreaState,
            userActionRecommendationState,
            postmortemState,
            postmortemVisibilityState: sanitizeText(body.postmortemVisibilityState, 40) ?? 'internal_only',
            rcaState,
            rootCauseCategory,
            correctiveActionState,
            preventionActionState,
            learningState: sanitizeText(body.learningState, 40) ?? 'capturing',
            knowledgeArticleState,
            publishingState,
            publicTitle,
            publicSummary,
            knowledgeSummary,
            publishedAt,
            lastUpdatedAt: nowIso,
            recoveryAnnouncedAt: incidentCommunicationPhase === 'resolved_notice_posted' ? nowIso : null,
            postmortemPublishedAt: postmortemState === 'published' ? nowIso : null,
            nextUpdateAt: sanitizeText(body.nextUpdateAt, 40) ?? null,
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        communicationId,
        sourceIncidentId,
        publishingState,
        incidentCommunicationPhase,
        statusState,
        postmortemState,
        rcaState,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('incident communication publish の権限がありません。')
      strapi.log.error(`[analytics-event] internalIncidentCommunicationPublish failed: ${message}`)
      return ctx.internalServerError('incident communication publish に失敗しました。')
    }
  },

  async internalIncidentTriageAction(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const actionType = sanitizeText(body.actionType, 40) ?? 'acknowledge'
      const incidentType = sanitizeText(body.incidentType, 80) ?? 'operations_incident'
      const incidentSeverity = sanitizeText(body.incidentSeverity, 20) ?? 'medium'
      const incidentPriority = sanitizeText(body.incidentPriority, 20) ?? toPriority(incidentSeverity, 1)
      const reason = sanitizeText(body.reason, 240)
      const sourceArea = sanitizeText(body.sourceArea, 40) ?? 'operations'
      const incidentId = sanitizeText(body.incidentId, 120) ?? `incident:${Date.now()}`
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      let incidentState = 'open'
      let escalationState = 'none'
      let incidentResolutionState = 'pending'
      let nextRecommendedAction = 'owner を割り当てて詳細調査'
      if (actionType === 'acknowledge') {
        incidentState = 'in_review'
        nextRecommendedAction = 'アラート根拠を確認して incident 化の要否を判断'
      } else if (actionType === 'create_incident') {
        incidentState = 'open'
        nextRecommendedAction = 'incident owner を割当'
      } else if (actionType === 'escalate') {
        incidentState = 'escalated'
        escalationState = 'escalated'
        nextRecommendedAction = 'escalation target の承認/対応を待機'
      } else if (actionType === 'resolve') {
        incidentState = 'resolved'
        incidentResolutionState = 'resolved'
        nextRecommendedAction = '再発防止メモと runbook 更新'
      }

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'incident',
          targetId: incidentId,
          action: `ops-incident-triage:${actionType}`,
          status: 'success',
          reason,
          sourceSite: 'cross',
          beforeState: { incidentState: 'detected' },
          afterState: { incidentState },
          metadata: {
            actionType,
            incidentType,
            incidentSeverity,
            incidentPriority,
            incidentState,
            escalationState,
            incidentOwnerState: actionType === 'create_incident' ? 'assigned' : 'unassigned',
            incidentResolutionState,
            sourceArea,
            nextRecommendedAction,
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        incidentId,
        actionType,
        incidentState,
        escalationState,
        incidentResolutionState,
        nextRecommendedAction,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('incident triage の権限がありません。')
      strapi.log.error(`[analytics-event] internalIncidentTriageAction failed: ${message}`)
      return ctx.internalServerError('incident triage 実行に失敗しました。')
    }
  },

  async internalApprovalAction(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.approve')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const approvalType = sanitizeText(body.approvalType, 80) ?? 'batch_operation'
      const approvalState = sanitizeText(body.approvalState, 24) ?? 'pending'
      const approvalId = sanitizeText(body.approvalId, 120) ?? `approval:${Date.now()}`
      const reason = sanitizeText(body.reason, 240)
      const targetActionId = sanitizeText(body.targetActionId, 120) ?? 'unknown'
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'approval',
          targetId: approvalId,
          action: `ops-approval:${approvalState}`,
          status: approvalState === 'rejected' ? 'denied' : 'success',
          reason,
          sourceSite: 'cross',
          beforeState: { approvalState: 'pending' },
          afterState: { approvalState },
          metadata: { approvalType, approvalState, targetActionId, approvalActor: access.authUser.userId },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = { approvalId, approvalType, approvalState, targetActionId }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('approval 操作権限がありません。')
      strapi.log.error(`[analytics-event] internalApprovalAction failed: ${message}`)
      return ctx.internalServerError('approval 操作に失敗しました。')
    }
  },

  async internalBatchOperationAction(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const batchOperationType = sanitizeText(body.batchOperationType, 80) ?? 'safe_resync'
      const batchOperationScope = sanitizeText(body.batchOperationScope, 80) ?? 'cross_site'
      const reason = sanitizeText(body.reason, 240)
      const mode = sanitizeText(body.mode, 20) ?? 'preview'
      const confirmed = Boolean(body.confirmed)
      const requiresApproval = body.requiresApproval !== false
      const batchOperationId = sanitizeText(body.batchOperationId, 120) ?? `batch:${batchOperationType}:${Date.now()}`
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      if (mode === 'execute' && !confirmed) return ctx.badRequest('execute には confirmed=true が必要です。')

      const batchOperationState = mode === 'preview'
        ? 'preview_ready'
        : mode === 'dry_run'
          ? 'dry_run_ready'
          : requiresApproval
            ? 'pending_approval'
            : 'running'
      const batchOperationResultState = mode === 'execute'
        ? (requiresApproval ? 'pending_approval' : 'queued')
        : mode === 'dry_run'
          ? 'dry_run_completed'
          : 'not_started'

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'batch-operation',
          targetId: batchOperationId,
          action: `ops-batch-operation:${mode}`,
          status: requiresApproval && mode === 'execute' ? 'pending' : 'success',
          reason,
          sourceSite: 'cross',
          beforeState: { batchOperationState: 'draft' },
          afterState: { batchOperationState },
          metadata: {
            batchOperationType,
            batchOperationScope,
            batchOperationState,
            batchOperationPreviewState: mode === 'preview' ? 'preview_ready' : 'completed',
            batchOperationDryRunState: mode === 'dry_run' ? 'dry_run_completed' : 'not_started',
            batchOperationResultState,
            requiresApprovalState: requiresApproval ? 'required' : 'not_required',
            runbookState: 'linked',
            confirmed,
          },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        batchOperationId,
        batchOperationType,
        batchOperationScope,
        mode,
        confirmed,
        requiresApprovalState: requiresApproval ? 'required' : 'not_required',
        batchOperationState,
        batchOperationResultState,
        diffSummary: mode === 'preview' ? '対象件数と影響範囲を確認してください。' : mode === 'dry_run' ? 'write を行わない dry-run 結果です。' : '承認後に execute queue へ移送されます。',
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('batch safe ops 実行権限がありません。')
      strapi.log.error(`[analytics-event] internalBatchOperationAction failed: ${message}`)
      return ctx.internalServerError('batch safe ops の実行に失敗しました。')
    }
  },

  async internalOperationsSafeAction(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const actionType = sanitizeText(body.actionType, 80)
      const sourceArea = sanitizeText(body.sourceArea, 40) ?? 'operations'
      const reason = sanitizeText(body.reason, 240)
      const dryRun = body.dryRun !== false
      const confirmed = Boolean(body.confirmed)
      const actionTargetType = sanitizeText(body.targetEntityType, 60) ?? 'ops-summary'
      const actionTargetId = sanitizeText(body.targetEntityId, 120) ?? `summary:${sourceArea}`

      if (!actionType) return ctx.badRequest('actionType は必須です。')
      if (!reason || reason.length < 8) return ctx.badRequest('reason は8文字以上で入力してください。')

      const dangerousAction = ['membership_resync', 'billing_resync', 'privacy_deletion_execute'].includes(actionType)
      if (dangerousAction && !dryRun && !confirmed) {
        return ctx.badRequest('dangerous action は confirmed=true が必要です。')
      }

      const actionId = `${actionType}:${Date.now()}`
      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: actionTargetType,
          targetId: actionTargetId,
          action: `ops-safe-action:${actionType}`,
          status: dangerousAction && !dryRun ? 'pending' : 'success',
          reason,
          sourceSite: 'cross',
          beforeState: { queueState: 'pending_review' },
          afterState: { queueState: dryRun ? 'dry_run_completed' : dangerousAction ? 'pending_confirmation' : 'processed' },
          metadata: { actionId, sourceArea, dryRun, dangerousAction, confirmed },
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        actionId,
        actionType,
        sourceArea,
        dryRun,
        dangerousAction,
        confirmed,
        resultState: dryRun ? 'dry_run_completed' : dangerousAction ? 'pending_confirmation' : 'queued',
        explanation: dangerousAction
          ? '危険操作は dry-run と確認ログを残し、承認後に実処理へ進めてください。'
          : 'safe action をキュー投入しました。実処理は runbook に従って実施してください。',
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('safe operation 実行権限がありません。')
      strapi.log.error(`[analytics-event] internalOperationsSafeAction failed: ${message}`)
      return ctx.internalServerError('safe operation の実行に失敗しました。')
    }
  },

  async internalAutomationRuns(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.audit.read')
      const logs = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { targetType: { $eq: 'playbook-execution' } },
        fields: ['targetId', 'action', 'status', 'reason', 'sourceSite', 'metadata', 'createdAt', 'actorLogtoUserId'],
        limit: 100,
        sort: ['createdAt:desc'],
      })

      const items = (logs as Array<Record<string, unknown>>).map((row) => ({
        executionRun: String(row.targetId ?? ''),
        actionStatus: row.status,
        action: row.action,
        sourceSite: row.sourceSite,
        reason: row.reason,
        actorLogtoUserId: row.actorLogtoUserId,
        createdAt: row.createdAt,
        metadata: row.metadata ?? {},
      }))

      ctx.body = { count: items.length, items }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation run の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationRuns failed: ${message}`)
      return ctx.internalServerError('playbook 実行履歴の取得に失敗しました。')
    }
  },

  async internalAutomationRun(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const playbookKey = sanitizeText(body.playbookKey, 120)
      if (!playbookKey) return ctx.badRequest('playbookKey は必須です。')
      const runMode = sanitizeText(body.runMode, 40) ?? 'manual'
      const dryRun = body.dryRun !== false
      const sourceSite = sanitizeSourceSite(body.sourceSite)
      const reason = sanitizeText(body.reason, 240) ?? 'manual trigger'
      const approvalRequired = Boolean((body.approvalRequired ?? (playbookKey.includes('billing') || playbookKey.includes('refund'))))
      const actionStatus = approvalRequired ? 'denied' : 'success'
      const executionRun = `${playbookKey}:${Date.now()}`
      const metadata = {
        workflow: 'ops-automation-v1',
        runMode,
        dryRun,
        safeMode: PLAYBOOK_SAFE_MODE_DEFAULT,
        retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, backoffMs: 30000 },
        idempotencyKey: `${playbookKey}:${toIsoDay(new Date().toISOString())}:${sourceSite}`,
        approvalStatus: approvalRequired ? 'pending' : 'not_required',
        rollbackHint: approvalRequired ? '承認前のため適用なし' : '実行済み action の taskId を参照して差し戻し',
      }

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'playbook-execution',
          targetId: executionRun,
          action: `playbook:${playbookKey}`,
          status: actionStatus,
          reason,
          sourceSite: sourceSite === 'unknown' ? 'cross' : sourceSite,
          beforeState: { executionState: 'pending' },
          afterState: { executionState: approvalRequired ? 'pending_approval' : (dryRun ? 'dry_run_completed' : 'succeeded') },
          metadata,
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        executionRun,
        playbookKey,
        runMode,
        dryRun,
        sourceSite,
        actionStatus: approvalRequired ? 'pending_approval' : (dryRun ? 'dry_run_completed' : 'succeeded'),
        approvalStatus: approvalRequired ? 'pending' : 'not_required',
        failureReason: approvalRequired ? 'dangerous action のため承認待ちへ移送' : null,
        retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, attempts: 0 },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation run の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationRun failed: ${message}`)
      return ctx.internalServerError('playbook 実行に失敗しました。')
    }
  },

  async internalBiExportCsv(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - BI_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const events = await strapi.documents('api::analytics-event.analytics-event').findMany({
        filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        fields: ['eventName', 'sourceSite', 'locale', 'eventAt'],
        limit: BI_MAX_FETCH_ROWS,
        sort: ['eventAt:desc'],
      })
      const revenues = await strapi.documents('api::revenue-record.revenue-record').findMany({
        filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        fields: ['sourceSite', 'netAmount', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt'],
        limit: BI_MAX_FETCH_ROWS,
        sort: ['financialEventAt:desc'],
      })

      const eventDaily = (Object.values((events as Array<Record<string, unknown>>).reduce((acc: any, item) => {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, sessions: 0, ctaClicks: 0 }
        if (item.eventName === 'page_view') acc[day].sessions += 1
        if (item.eventName === 'cta_click') acc[day].ctaClicks += 1
        return acc
      }, {} as Record<string, { day: string; sessions: number; ctaClicks: number }>)) as Array<{ day: string; sessions: number; ctaClicks: number }>)

      const revenueDaily = (Object.values((revenues as Array<Record<string, unknown>>).reduce((acc: any, item) => {
        const day = toIsoDay(item.financialEventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, gross: 0, net: 0, refund: 0 }
        acc[day].gross += numberValue(item.grossAmount)
        acc[day].net += numberValue(item.netAmount)
        acc[day].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        return acc
      }, {} as Record<string, { day: string; gross: number; net: number; refund: number }>)) as Array<{ day: string; gross: number; net: number; refund: number }>)

      const merged = eventDaily.map((row) => ({
        ...row,
        gross: revenueDaily.find((item) => item.day === row.day)?.gross ?? 0,
        net: revenueDaily.find((item) => item.day === row.day)?.net ?? 0,
        refund: revenueDaily.find((item) => item.day === row.day)?.refund ?? 0,
      })).sort((a, b) => b.day.localeCompare(a.day))

      const headers = ['day', 'sessions', 'ctaClicks', 'gross', 'net', 'refund']
      const lines = [toCsvRow(headers), ...merged.map((row) => toCsvRow([row.day, row.sessions, row.ctaClicks, row.gross, row.net, row.refund]))]

      ctx.set('Content-Type', 'text/csv; charset=utf-8')
      ctx.set('Content-Disposition', `attachment; filename="bi-overview-${new Date().toISOString().slice(0, 10)}.csv"`)
      ctx.body = `\uFEFF${lines.join('\n')}`
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI export の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiExportCsv failed: ${message}`)
      return ctx.internalServerError('BI export の作成に失敗しました。')
    }
  },
}))
