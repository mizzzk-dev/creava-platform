import { useEffect, useMemo, useRef } from 'react'
import { getAnalyticsBaseContext, type SourceSite } from '@/modules/analytics/context'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

const ASSIGNMENT_STORAGE_KEY = 'mizzz_personalization_assignment_v1'
const IMPRESSION_STORAGE_KEY = 'mizzz_personalization_impression_v1'

export type PersonalizationState = 'draft' | 'running' | 'paused' | 'rolled_back'
export type PersonalizationVariantState = 'control' | 'personalized'
export type PersonalizationImpressionState = 'not_tracked' | 'logged' | 'deduped' | 'suppressed'
export type PersonalizationAssignmentState = 'not_assigned' | 'assigned' | 'sticky_assigned' | 'excluded'
export type PersonalizationEligibilityState = 'eligible' | 'ineligible' | 'consent_blocked' | 'traffic_blocked'
export type PersonalizationSegmentState = 'new_visitor' | 'returning' | 'member' | 'high_intent' | 'unknown'
export type PersonalizationSuccessMetricState = 'pending' | 'improving' | 'neutral' | 'degrading'
export type PersonalizationGuardrailState = 'healthy' | 'warning' | 'breached'
export type PersonalizationHoldoutState = 'holdout' | 'treatment'
export type PersonalizationDecisionState = 'pending' | 'adopt' | 'rollback' | 'inconclusive'
export type PersonalizationRollbackState = 'not_required' | 'ready' | 'triggered' | 'completed'
export type PersonalizationConsentState = 'granted' | 'denied' | 'unknown'
export type PersonalizationSeoState = 'safe' | 'client_only' | 'needs_review'
export type PersonalizationAccessibilityState = 'safe' | 'needs_review'

export interface PersonalizationDefinition {
  id: string
  sourceSite: SourceSite | 'support'
  state: PersonalizationState
  assignmentSalt: string
  exposurePoint: string
  holdoutRate: number
  successMetricKey: string
  guardrailMetricKey: string
  seoState: PersonalizationSeoState
}

const PERSONALIZATION_DEFINITIONS: Record<string, PersonalizationDefinition> = {
  'main-hub-routing-2026q2': {
    id: 'main-hub-routing-2026q2',
    sourceSite: 'main',
    state: 'running',
    assignmentSalt: 'main.hub.routing.2026q2',
    exposurePoint: 'main:home:hub-order',
    holdoutRate: 10,
    successMetricKey: 'main_primary_cta_ctr',
    guardrailMetricKey: 'main_bounce_rate',
    seoState: 'safe',
  },
  'store-listing-assist-2026q2': {
    id: 'store-listing-assist-2026q2',
    sourceSite: 'store',
    state: 'running',
    assignmentSalt: 'store.listing.assist.2026q2',
    exposurePoint: 'store:products:list',
    holdoutRate: 10,
    successMetricKey: 'store_add_to_cart_rate',
    guardrailMetricKey: 'store_support_handoff_rate',
    seoState: 'safe',
  },
  'fc-join-guidance-2026q2': {
    id: 'fc-join-guidance-2026q2',
    sourceSite: 'fc',
    state: 'running',
    assignmentSalt: 'fc.join.guidance.2026q2',
    exposurePoint: 'fc:join:hero',
    holdoutRate: 15,
    successMetricKey: 'fc_join_or_login_completion_rate',
    guardrailMetricKey: 'fc_member_gate_block_rate',
    seoState: 'safe',
  },
  'support-recommendation-path-2026q2': {
    id: 'support-recommendation-path-2026q2',
    sourceSite: 'support',
    state: 'running',
    assignmentSalt: 'support.recommendation.path.2026q2',
    exposurePoint: 'support:center:recommendation',
    holdoutRate: 15,
    successMetricKey: 'support_self_resolution_rate',
    guardrailMetricKey: 'support_contact_spike_rate',
    seoState: 'safe',
  },
}

interface AssignmentRecord {
  variant: PersonalizationVariantState
  assignmentState: PersonalizationAssignmentState
  holdoutState: PersonalizationHoldoutState
  segmentState: PersonalizationSegmentState
  eligibilityState: PersonalizationEligibilityState
  traceId: string
  assignedAt: string
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
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as Record<string, T> : {}
  } catch {
    return {}
  }
}

function saveStorage<T>(key: string, value: Record<string, T>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function detectConsentState(): PersonalizationConsentState {
  if (typeof window === 'undefined') return 'unknown'
  const allowed = (window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__
  if (allowed === true) return 'granted'
  if (allowed === false) return 'denied'
  return 'unknown'
}

function detectTrafficQualityState(): 'production' | 'internal' | 'preview' | 'bot_like' {
  if (typeof window === 'undefined') return 'production'
  const hostname = window.location.hostname.toLowerCase()
  const ua = window.navigator.userAgent.toLowerCase()
  if (hostname === 'localhost' || hostname.includes('internal')) return 'internal'
  if (hostname.includes('staging') || hostname.includes('preview') || hostname.includes('vercel.app') || hostname.includes('netlify.app')) return 'preview'
  if (/bot|crawler|spider|headless|lighthouse/.test(ua)) return 'bot_like'
  return 'production'
}

function resolveSegmentState(): PersonalizationSegmentState {
  const ctx = getAnalyticsBaseContext(window.location.pathname)
  const hasHistory = window.localStorage.getItem('mizzz_history_v2')
  if (ctx.userState === 'logged_in') return 'member'
  if (ctx.referrerType === 'external') return 'high_intent'
  if (hasHistory) return 'returning'
  return 'new_visitor'
}

function resolveAssignment(definition: PersonalizationDefinition): AssignmentRecord {
  const existing = loadStorage<AssignmentRecord>(ASSIGNMENT_STORAGE_KEY)[definition.id]
  if (existing) {
    return { ...existing, assignmentState: 'sticky_assigned' }
  }

  const ctx = getAnalyticsBaseContext(window.location.pathname)
  const traffic = detectTrafficQualityState()
  const consentState = detectConsentState()
  const segmentState = resolveSegmentState()
  const traceId = `${definition.id}:${ctx.sessionId}:${Date.now().toString(36)}`

  if (traffic !== 'production') {
    return {
      variant: 'control',
      assignmentState: 'excluded',
      holdoutState: 'holdout',
      segmentState,
      eligibilityState: 'traffic_blocked',
      traceId,
      assignedAt: new Date().toISOString(),
    }
  }

  if (consentState !== 'granted') {
    return {
      variant: 'control',
      assignmentState: 'excluded',
      holdoutState: 'holdout',
      segmentState,
      eligibilityState: 'consent_blocked',
      traceId,
      assignedAt: new Date().toISOString(),
    }
  }

  const bucket = hashToBucket(`${definition.assignmentSalt}:${ctx.anonymousId}:${segmentState}:${ctx.sourceSite}`)
  const holdoutState: PersonalizationHoldoutState = bucket < definition.holdoutRate ? 'holdout' : 'treatment'
  const variant: PersonalizationVariantState = holdoutState === 'holdout' ? 'control' : 'personalized'

  const assignment: AssignmentRecord = {
    variant,
    assignmentState: 'assigned',
    holdoutState,
    segmentState,
    eligibilityState: 'eligible',
    traceId,
    assignedAt: new Date().toISOString(),
  }
  const records = loadStorage<AssignmentRecord>(ASSIGNMENT_STORAGE_KEY)
  records[definition.id] = assignment
  saveStorage(ASSIGNMENT_STORAGE_KEY, records)
  return assignment
}

function markImpression(definitionId: string, variant: PersonalizationVariantState): PersonalizationImpressionState {
  const map = loadStorage<string>(IMPRESSION_STORAGE_KEY)
  const key = `${definitionId}:${variant}:${window.location.pathname}`
  if (map[key]) return 'deduped'
  map[key] = new Date().toISOString()
  saveStorage(IMPRESSION_STORAGE_KEY, map)
  return 'logged'
}

export interface UsePersonalizationResult {
  personalizationId: string
  personalizationState: PersonalizationState
  personalizationVariantState: PersonalizationVariantState
  personalizationImpressionState: PersonalizationImpressionState
  personalizationAssignmentState: PersonalizationAssignmentState
  personalizationEligibilityState: PersonalizationEligibilityState
  personalizationSegmentState: PersonalizationSegmentState
  personalizationSuccessMetricState: PersonalizationSuccessMetricState
  personalizationGuardrailState: PersonalizationGuardrailState
  personalizationHoldoutState: PersonalizationHoldoutState
  personalizationDecisionState: PersonalizationDecisionState
  personalizationRollbackState: PersonalizationRollbackState
  personalizationConsentState: PersonalizationConsentState
  personalizationSeoState: PersonalizationSeoState
  personalizationAccessibilityState: PersonalizationAccessibilityState
  personalizationTraceId: string
  personalizationStartedAt: string
  isPersonalized: boolean
}

export function usePersonalization(key: keyof typeof PERSONALIZATION_DEFINITIONS): UsePersonalizationResult {
  const definition = PERSONALIZATION_DEFINITIONS[key]
  const assignment = useMemo(() => resolveAssignment(definition), [definition])
  const impressionStateRef = useRef<PersonalizationImpressionState>('not_tracked')

  useEffect(() => {
    const ctx = getAnalyticsBaseContext(window.location.pathname)
    trackMizzzEvent('personalization_assignment_logged', {
      personalizationId: definition.id,
      sourceSite: definition.sourceSite,
      personalizationState: definition.state,
      personalizationVariantState: assignment.variant,
      personalizationAssignmentState: assignment.assignmentState,
      personalizationEligibilityState: assignment.eligibilityState,
      personalizationSegmentState: assignment.segmentState,
      personalizationHoldoutState: assignment.holdoutState,
      personalizationTraceId: assignment.traceId,
      personalizationStartedAt: assignment.assignedAt,
      trafficQualityState: detectTrafficQualityState(),
      locale: ctx.locale,
      deviceType: ctx.deviceType,
      referrerType: ctx.referrerType,
    })
  }, [assignment.assignedAt, assignment.assignmentState, assignment.eligibilityState, assignment.holdoutState, assignment.segmentState, assignment.traceId, assignment.variant, definition.id, definition.sourceSite, definition.state])

  useEffect(() => {
    const consentState = detectConsentState()
    if (consentState !== 'granted') {
      impressionStateRef.current = 'suppressed'
      return
    }
    impressionStateRef.current = markImpression(definition.id, assignment.variant)
    if (impressionStateRef.current !== 'logged') return

    trackMizzzEvent('personalization_impression_logged', {
      personalizationId: definition.id,
      sourceSite: definition.sourceSite,
      exposurePoint: definition.exposurePoint,
      personalizationState: definition.state,
      personalizationVariantState: assignment.variant,
      personalizationImpressionState: 'logged',
      personalizationAssignmentState: assignment.assignmentState,
      personalizationEligibilityState: assignment.eligibilityState,
      personalizationSegmentState: assignment.segmentState,
      personalizationSuccessMetricState: 'pending',
      personalizationGuardrailState: 'healthy',
      personalizationHoldoutState: assignment.holdoutState,
      personalizationDecisionState: 'pending',
      personalizationRollbackState: 'ready',
      personalizationConsentState: consentState,
      personalizationSeoState: definition.seoState,
      personalizationAccessibilityState: 'safe',
      personalizationTraceId: assignment.traceId,
      personalizationShownAt: new Date().toISOString(),
      personalizationStartedAt: assignment.assignedAt,
      personalizationMetricKey: definition.successMetricKey,
      personalizationGuardrailMetricKey: definition.guardrailMetricKey,
    })
  }, [assignment.assignedAt, assignment.assignmentState, assignment.eligibilityState, assignment.holdoutState, assignment.segmentState, assignment.traceId, assignment.variant, definition.exposurePoint, definition.guardrailMetricKey, definition.id, definition.seoState, definition.sourceSite, definition.state, definition.successMetricKey])

  return {
    personalizationId: definition.id,
    personalizationState: definition.state,
    personalizationVariantState: assignment.variant,
    personalizationImpressionState: impressionStateRef.current,
    personalizationAssignmentState: assignment.assignmentState,
    personalizationEligibilityState: assignment.eligibilityState,
    personalizationSegmentState: assignment.segmentState,
    personalizationSuccessMetricState: 'pending',
    personalizationGuardrailState: 'healthy',
    personalizationHoldoutState: assignment.holdoutState,
    personalizationDecisionState: 'pending',
    personalizationRollbackState: 'ready',
    personalizationConsentState: detectConsentState(),
    personalizationSeoState: definition.seoState,
    personalizationAccessibilityState: 'safe',
    personalizationTraceId: assignment.traceId,
    personalizationStartedAt: assignment.assignedAt,
    isPersonalized: assignment.variant === 'personalized',
  }
}

export const PERSONALIZATION_REGISTRY = PERSONALIZATION_DEFINITIONS
