import { trackEvent } from '@/modules/analytics'

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

function sanitize(params?: AnalyticsParams): Record<string, string | number | boolean> {
  if (!params) return {}
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, string | number | boolean>
}

export function trackMizzzEvent(eventName: string, params?: AnalyticsParams): void {
  trackEvent(eventName, sanitize(params))
}

export function trackCtaClick(location: string, cta: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('cta_click', { location, cta, ...extras })
}

export function trackCampaignClick(location: string, campaignSlug: string, action: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('campaign_click', { location, campaignSlug, action, ...extras })
}

export function trackErrorState(location: string, message: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('error_state_view', { location, message, ...extras })
}

export function trackRetryClick(location: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('retry_click', { location, ...extras })
}

export function trackEmptyState(location: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('empty_state_view', { location, ...extras })
}

export function trackApiFailure(location: string, error: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('api_failure', { location, error, ...extras })
}
