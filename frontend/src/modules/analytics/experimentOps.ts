import { useEffect, useMemo, useRef } from 'react'
import { getAnalyticsBaseContext } from '@/modules/analytics/context'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

const ASSIGNMENT_STORAGE_KEY = 'mizzz_experiment_assignment_v2'
const EXPOSURE_STORAGE_KEY = 'mizzz_experiment_exposure_v2'
const DECISION_STORAGE_KEY = 'mizzz_experiment_decision_v1'

export type ExperimentState = 'draft' | 'running' | 'paused' | 'completed' | 'stopped' | 'invalidated'
export type ExperimentVariantState = 'control' | 'challenger'
export type ExperimentExposureState = 'not_exposed' | 'eligible' | 'exposed' | 'blocked' | 'suppressed'
export type ExperimentAssignmentState = 'not_assigned' | 'assigned' | 'sticky_assigned' | 'excluded'
export type ExperimentDecisionState = 'win' | 'lose' | 'inconclusive' | 'rollback' | 'pending'
export type ExperimentRollbackState = 'not_required' | 'ready' | 'triggered' | 'completed'

export type ExperimentSite = 'main' | 'store' | 'fc' | 'shared'

export interface ExperimentMetric {
  key: string
  direction: 'up' | 'down'
  description: string
}

export interface ExperimentDefinition {
  id: string
  site: ExperimentSite
  title: string
  state: ExperimentState
  variants: readonly ['control', 'challenger']
  success: ExperimentMetric
  secondaryMetrics: ExperimentMetric[]
  guardrails: ExperimentMetric[]
  exposurePoint: string
  assignmentSalt: string
}

export const EXPERIMENT_DEFINITIONS: Record<string, ExperimentDefinition> = {
  'main-hero-cta-2026q2': {
    id: 'main-hero-cta-2026q2',
    site: 'main',
    title: 'main hero / CTA copy optimization',
    state: 'running',
    variants: ['control', 'challenger'],
    success: { key: 'main_to_store_or_fc_ctr', direction: 'up', description: 'Hero 経由の store/fc 遷移率' },
    secondaryMetrics: [{ key: 'hero_scroll_depth_p75', direction: 'up', description: 'Hero 直下セクション到達率' }],
    guardrails: [
      { key: 'error_state_rate', direction: 'down', description: 'error page 遷移率' },
      { key: 'content_shift_warning_rate', direction: 'down', description: 'flicker / CLS 警戒' },
    ],
    exposurePoint: 'main:home',
    assignmentSalt: 'main.hero.cta.2026q2',
  },
  'store-hero-cta-2026q2': {
    id: 'store-hero-cta-2026q2',
    site: 'store',
    title: 'store hero / cart CTA optimization',
    state: 'running',
    variants: ['control', 'challenger'],
    success: { key: 'begin_checkout_rate', direction: 'up', description: 'begin_checkout 率' },
    secondaryMetrics: [{ key: 'add_to_cart_rate', direction: 'up', description: 'add_to_cart 率' }],
    guardrails: [
      { key: 'cart_error_rate', direction: 'down', description: 'cart error / API failure 率' },
      { key: 'support_contact_rate_store', direction: 'down', description: '購入導線起因の問い合わせ率' },
    ],
    exposurePoint: 'store:hero',
    assignmentSalt: 'store.hero.cta.2026q2',
  },
  'fc-join-login-2026q2': {
    id: 'fc-join-login-2026q2',
    site: 'fc',
    title: 'fc join / login messaging optimization',
    state: 'running',
    variants: ['control', 'challenger'],
    success: { key: 'login_success_rate', direction: 'up', description: 'login_success 率' },
    secondaryMetrics: [{ key: 'join_cta_click_rate', direction: 'up', description: 'join CTA click 率' }],
    guardrails: [
      { key: 'member_gate_block_rate', direction: 'down', description: 'gate blocked rate' },
      { key: 'fc_support_handoff_rate', direction: 'down', description: '会員導線由来の support handoff 率' },
    ],
    exposurePoint: 'fc:hero',
    assignmentSalt: 'fc.join.login.2026q2',
  },
  'support-search-placement-2026q2': {
    id: 'support-search-placement-2026q2',
    site: 'shared',
    title: 'support help-search placement optimization',
    state: 'running',
    variants: ['control', 'challenger'],
    success: { key: 'help_center_search_to_article_rate', direction: 'up', description: '検索→記事閲覧率' },
    secondaryMetrics: [{ key: 'article_helpful_rate', direction: 'up', description: 'helpful 率' }],
    guardrails: [
      { key: 'contact_submit_rate', direction: 'down', description: '自己解決阻害の悪化抑制' },
      { key: 'support_empty_result_rate', direction: 'down', description: '検索空振り率' },
    ],
    exposurePoint: 'support:center',
    assignmentSalt: 'support.search.placement.2026q2',
  },
}

interface AssignmentRecord {
  experimentId: string
  variantId: ExperimentVariantState
  assignedAt: string
  assignmentState: ExperimentAssignmentState
  traceId: string
}

function getRuntimeRolloutPercentage(): number {
  const raw = Number(import.meta.env.VITE_EXPERIMENT_DEFAULT_ROLLOUT_PERCENT ?? 50)
  if (Number.isNaN(raw)) return 50
  return Math.max(0, Math.min(100, raw))
}

function isExperimentRuntimeEnabled(): boolean {
  return String(import.meta.env.VITE_EXPERIMENT_RUNTIME_ENABLED ?? 'true') === 'true'
}

function isConsentGranted(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__)
}

function getTrafficQualityState(): 'production' | 'internal' | 'preview' | 'bot_like' {
  if (typeof window === 'undefined') return 'production'
  const hostname = window.location.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.includes('internal')) return 'internal'
  if (hostname.includes('staging') || hostname.includes('preview') || hostname.includes('vercel.app') || hostname.includes('netlify.app')) return 'preview'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/bot|crawler|spider|headless|lighthouse/.test(ua)) return 'bot_like'
  return 'production'
}

function hashToBucket(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash % 100)
}

function loadStorage<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(key)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, T>
  } catch {
    return {}
  }
}

function saveStorage<T>(key: string, value: Record<string, T>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function makeTraceId(experimentId: string, sessionId: string): string {
  return `${experimentId}:${sessionId}:${Date.now().toString(36)}`
}

function resolveAssignment(definition: ExperimentDefinition): AssignmentRecord {
  const assignments = loadStorage<AssignmentRecord>(ASSIGNMENT_STORAGE_KEY)
  const existing = assignments[definition.id]
  if (existing && definition.variants.includes(existing.variantId)) {
    return {
      ...existing,
      assignmentState: 'sticky_assigned',
    }
  }

  const ctx = getAnalyticsBaseContext(window.location.pathname)
  const quality = getTrafficQualityState()
  const rollout = getRuntimeRolloutPercentage()
  const traceId = makeTraceId(definition.id, ctx.sessionId)

  if (!isExperimentRuntimeEnabled() || quality !== 'production') {
    return {
      experimentId: definition.id,
      variantId: 'control',
      assignedAt: new Date().toISOString(),
      assignmentState: 'excluded',
      traceId,
    }
  }

  const bucket = hashToBucket(`${definition.assignmentSalt}:${ctx.anonymousId}:${ctx.sourceSite}`)
  const variantId: ExperimentVariantState = bucket < rollout ? (bucket % 2 === 0 ? 'control' : 'challenger') : 'control'

  const assignment: AssignmentRecord = {
    experimentId: definition.id,
    variantId,
    assignedAt: new Date().toISOString(),
    assignmentState: 'assigned',
    traceId,
  }
  assignments[definition.id] = assignment
  saveStorage(ASSIGNMENT_STORAGE_KEY, assignments)
  return assignment
}

function markExposure(experimentId: string, variantId: ExperimentVariantState): boolean {
  const exposureMap = loadStorage<string>(EXPOSURE_STORAGE_KEY)
  const key = `${experimentId}:${variantId}:${window.location.pathname}`
  if (exposureMap[key]) return false
  exposureMap[key] = new Date().toISOString()
  saveStorage(EXPOSURE_STORAGE_KEY, exposureMap)
  return true
}

export interface UseExperimentResult {
  experimentId: string
  variantId: ExperimentVariantState
  assignmentState: ExperimentAssignmentState
  exposureState: ExperimentExposureState
  decisionState: ExperimentDecisionState
  rollbackState: ExperimentRollbackState
  traceId: string
  startedAt: string
}

export function useExperiment(experimentId: keyof typeof EXPERIMENT_DEFINITIONS): UseExperimentResult {
  const definition = EXPERIMENT_DEFINITIONS[experimentId]
  const assignment = useMemo(() => resolveAssignment(definition), [definition])
  const exposureStateRef = useRef<ExperimentExposureState>('not_exposed')

  useEffect(() => {
    const ctx = getAnalyticsBaseContext(window.location.pathname)
    trackMizzzEvent('experiment_assignment_logged', {
      experimentId: definition.id,
      experimentState: definition.state,
      experimentVariantState: assignment.variantId,
      experimentAssignmentState: assignment.assignmentState,
      experimentTraceId: assignment.traceId,
      experimentStartedAt: assignment.assignedAt,
      sourceSite: ctx.sourceSite,
      trafficQualityState: getTrafficQualityState(),
    })
  }, [assignment.assignedAt, assignment.assignmentState, assignment.traceId, assignment.variantId, definition.id, definition.state])

  useEffect(() => {
    if (!isConsentGranted()) {
      exposureStateRef.current = 'suppressed'
      return
    }

    const logged = markExposure(definition.id, assignment.variantId)
    exposureStateRef.current = logged ? 'exposed' : 'eligible'
    if (!logged) return

    const now = new Date().toISOString()
    trackMizzzEvent('exposure_event_logged', {
      experimentId: definition.id,
      variantId: assignment.variantId,
      experimentVariantState: assignment.variantId,
      experimentState: definition.state,
      experimentExposureState: 'exposed',
      experimentGuardrailState: 'healthy',
      experimentSuccessMetricState: definition.success.key,
      experimentTraceId: assignment.traceId,
      experimentExposedAt: now,
      experimentStartedAt: assignment.assignedAt,
      exposurePoint: definition.exposurePoint,
      sourceSite: definition.site,
    })
  }, [assignment.assignedAt, assignment.traceId, assignment.variantId, definition.exposurePoint, definition.id, definition.site, definition.state, definition.success.key])

  return {
    experimentId: definition.id,
    variantId: assignment.variantId,
    assignmentState: assignment.assignmentState,
    exposureState: exposureStateRef.current,
    decisionState: 'pending',
    rollbackState: 'ready',
    traceId: assignment.traceId,
    startedAt: assignment.assignedAt,
  }
}

export function logExperimentDecision(input: {
  experimentId: keyof typeof EXPERIMENT_DEFINITIONS
  decisionState: ExperimentDecisionState
  rollbackState: ExperimentRollbackState
  reviewedAt: string
  closedAt?: string
  note?: string
}): void {
  const definition = EXPERIMENT_DEFINITIONS[input.experimentId]
  const decisions = loadStorage<typeof input>(DECISION_STORAGE_KEY)
  decisions[definition.id] = input
  saveStorage(DECISION_STORAGE_KEY, decisions)

  trackMizzzEvent('experiment_decision_logged', {
    experimentId: definition.id,
    experimentDecisionState: input.decisionState,
    experimentRollbackState: input.rollbackState,
    experimentReviewedAt: input.reviewedAt,
    experimentClosedAt: input.closedAt ?? '',
    decisionNoteState: input.note ? 'recorded' : 'none',
  })
}
