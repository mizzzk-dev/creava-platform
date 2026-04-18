import { getAnalyticsBaseContext } from '@/modules/analytics/context'

let initialized = false
let lastTrackedPath: string | null = null

function getMeasurementId(): string | null {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
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

async function forwardToOps(eventName: string, params: Record<string, string | number | boolean>): Promise<void> {
  const endpoint = getOpsEndpoint()
  if (!endpoint || !isAnalyticsAllowed()) return

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
  if (!enabled || typeof window === 'undefined') return

  const measurementId = getMeasurementId()
  if (!measurementId) return

  const w = window as Window & {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }

  if (!initialized) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.dataset.mizzzAnalytics = 'ga4'
    document.head.appendChild(script)

    w.dataLayer = w.dataLayer ?? []
    w.gtag = (...args: unknown[]) => {
      w.dataLayer?.push(args)
    }

    w.gtag('js', new Date())
    w.gtag('config', measurementId, { anonymize_ip: true, send_page_view: false })

    initialized = true
  }
}

export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined' || !pathname) return

  if (lastTrackedPath === pathname) return
  lastTrackedPath = pathname

  const measurementId = getMeasurementId()
  const analyticsAllowed = isAnalyticsAllowed()
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag

  const base = getAnalyticsBaseContext(pathname)
  const payload: Record<string, string | number | boolean> = {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
    sourceSite: base.sourceSite,
    locale: base.locale,
    theme: base.theme,
    pageType: base.pageType,
    userState: base.userState,
    deviceType: base.deviceType,
    referrerType: base.referrerType,
    timestamp: base.timestamp,
  }

  if (measurementId && analyticsAllowed && gtag) {
    gtag('event', 'page_view', payload)
  }
  void forwardToOps('page_view', payload)
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return

  const measurementId = getMeasurementId()
  const analyticsAllowed = isAnalyticsAllowed()
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag

  const pathname = window.location.pathname
  const base = getAnalyticsBaseContext(pathname)
  const payload: Record<string, string | number | boolean> = {
    sourceSite: base.sourceSite,
    locale: base.locale,
    theme: base.theme,
    pageType: base.pageType,
    userState: base.userState,
    deviceType: base.deviceType,
    referrerType: base.referrerType,
    timestamp: base.timestamp,
    ...(params ?? {}),
  }

  if (measurementId && analyticsAllowed && gtag) {
    gtag('event', eventName, payload)
  }
  void forwardToOps(eventName, payload)
}
