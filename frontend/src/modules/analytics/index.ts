let initialized = false

function getMeasurementId(): string | null {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  return id && id.trim() ? id.trim() : null
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
  if (typeof window === 'undefined') return

  const measurementId = getMeasurementId()
  const analyticsAllowed = (window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag

  if (!measurementId || !analyticsAllowed || !gtag) return

  gtag('event', 'page_view', {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
  })
}
