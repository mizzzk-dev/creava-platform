export type AnalyticsConsent = 'granted' | 'denied'

export interface CookieConsentState {
  necessary: true
  analytics: AnalyticsConsent
  updatedAt: string
}

export const COOKIE_CONSENT_KEY = 'mizzz_cookie_consent_v1'
export const COOKIE_CONSENT_EVENT = 'mizzz:cookie-consent-updated'

export function loadCookieConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
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
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: state }))
}

export function resetCookieConsent(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COOKIE_CONSENT_KEY)
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: null }))
}

export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  ;(window as Window & { __MIZZZ_ANALYTICS_ALLOWED__?: boolean }).__MIZZZ_ANALYTICS_ALLOWED__ = enabled
}
