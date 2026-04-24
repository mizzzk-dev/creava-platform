import { getAnalyticsBaseContext } from '@/modules/analytics/context'
import { inferEventMeta } from '@/modules/analytics/taxonomy'

let initialized = false
let lastTrackedPath: string | null = null
let gtmInitialized = false
type AnalyticsPrimitive = string | number | boolean
type AnalyticsValue = AnalyticsPrimitive | unknown[]

function getMeasurementId(): string | null {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  return id && id.trim() ? id.trim() : null
}

function getGtmContainerId(): string | null {
  const id = import.meta.env.VITE_GTM_CONTAINER_ID as string | undefined
  return id && id.trim() ? id.trim() : null
}

function getOpsEndpoint(): string | null {
  const endpoint = import.meta.env.VITE_ANALYTICS_OPS_ENDPOINT as string | undefined
  return endpoint && endpoint.trim() ? endpoint.trim() : null
}

function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__)
}

function makeEventId(eventName: string, timestamp: string, sessionId: string): string {
  return `${eventName}:${sessionId}:${timestamp}`
}

function initializeDataLayer(): Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer ?? []
  w.gtag = w.gtag ?? ((...args: unknown[]) => { w.dataLayer?.push(args) })
  return w
}

function updateConsentMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  const w = initializeDataLayer()
  w.gtag?.('consent', 'update', {
    analytics_storage: enabled ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}

async function forwardToOps(eventName: string, params: Record<string, AnalyticsValue>): Promise<void> {
  const endpoint = getOpsEndpoint()
  if (!endpoint) return

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, params }),
      keepalive: true,
    })
  } catch {
    // 非クリティカルのため握りつぶす
  }
}

export function initializeAnalytics(enabled: boolean): void {
  if (typeof window === 'undefined') return
  const w = initializeDataLayer()
  const gtmContainerId = getGtmContainerId()
  const measurementId = getMeasurementId()

  if (!gtmInitialized && gtmContainerId) {
    const gtmScript = document.createElement('script')
    gtmScript.async = true
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`
    gtmScript.dataset.mizzzAnalytics = 'gtm'
    document.head.appendChild(gtmScript)
    gtmInitialized = true
  }

  if (!initialized && measurementId) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.dataset.mizzzAnalytics = 'ga4'
    document.head.appendChild(script)

    const gtag = w.gtag
    if (!gtag) return

    gtag('js', new Date())
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    })
    gtag('config', measurementId, {
      anonymize_ip: true,
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })

    initialized = true
  }

  updateConsentMode(enabled)
}

export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined' || !pathname) return

  if (lastTrackedPath === pathname) return
  lastTrackedPath = pathname

  const measurementId = getMeasurementId()
  const analyticsAllowed = isAnalyticsAllowed()
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag

  const base = getAnalyticsBaseContext(pathname)
  const payload: Record<string, AnalyticsValue> = {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
    sourceSite: base.sourceSite,
    locale: base.locale,
    theme: base.theme,
    pageType: base.pageType,
    userState: base.userState,
    authenticatedState: base.authenticatedState,
    anonymousState: base.anonymousState,
    sessionId: base.sessionId,
    anonymousId: base.anonymousId,
    deviceType: base.deviceType,
    referrerType: base.referrerType,
    attributionState: base.attributionState,
    eventType: 'page_view',
    eventCategory: 'navigation',
    consentAwareTrackingState: analyticsAllowed ? 'consented' : 'required_only',
    eventQualityState: 'normal',
    dedupeState: 'event_id',
    replayState: 'none',
    eventId: makeEventId('page_view', base.timestamp, base.sessionId),
    timestamp: base.timestamp,
  }

  if (measurementId && analyticsAllowed && gtag) {
    gtag('event', 'page_view', payload)
  }
  void forwardToOps('page_view', payload)
}

export function trackEvent(eventName: string, params?: Record<string, AnalyticsValue>): void {
  if (typeof window === 'undefined') return

  const measurementId = getMeasurementId()
  const analyticsAllowed = isAnalyticsAllowed()
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag

  const pathname = window.location.pathname
  const base = getAnalyticsBaseContext(pathname)
  const meta = inferEventMeta(eventName)
  const payload: Record<string, AnalyticsValue> = {
    sourceSite: base.sourceSite,
    locale: base.locale,
    theme: base.theme,
    pageType: base.pageType,
    userState: base.userState,
    authenticatedState: base.authenticatedState,
    anonymousState: base.anonymousState,
    sessionId: base.sessionId,
    anonymousId: base.anonymousId,
    deviceType: base.deviceType,
    referrerType: base.referrerType,
    attributionState: base.attributionState,
    eventType: meta.eventType,
    eventCategory: meta.eventCategory,
    consentAwareTrackingState: analyticsAllowed ? 'consented' : 'required_only',
    eventQualityState: 'normal',
    dedupeState: 'event_id',
    replayState: 'none',
    eventId: makeEventId(eventName, base.timestamp, base.sessionId),
    timestamp: base.timestamp,
    ...(params ?? {}),
  }

  if (measurementId && analyticsAllowed && gtag) {
    gtag('event', eventName, payload)
  }
  void forwardToOps(eventName, payload)
}
