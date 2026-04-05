export type AnalyticsConsent = 'granted' | 'denied'

export interface CookieConsentState {
  necessary: true
  analytics: AnalyticsConsent
  updatedAt: string
}

const KEY = 'mizzz_cookie_consent_v1'

export function loadCookieConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as CookieConsentState
    if (!parsed || !parsed.updatedAt) return null
    return {
      necessary: true,
      analytics: parsed.analytics === 'granted' ? 'granted' : 'denied',
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

export function saveCookieConsent(state: CookieConsentState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('mizzz:cookie-consent-updated', { detail: state }))
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  ;(window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__ = enabled
}
