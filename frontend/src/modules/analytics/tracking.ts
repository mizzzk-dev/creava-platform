import { trackEvent } from '@/modules/analytics'
import { getExperimentVariant } from '@/modules/analytics/experiments'

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

function sanitize(params?: AnalyticsParams): Record<string, string | number | boolean> {
  if (!params) return {}
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, string | number | boolean>
}

function withExperiment(params?: AnalyticsParams): Record<string, string | number | boolean> {
  const sanitized = sanitize(params)
  const experimentId = typeof sanitized.experimentId === 'string' ? sanitized.experimentId : undefined
  if (!experimentId) return sanitized

  const assignment = getExperimentVariant(experimentId)
  if (!assignment) return sanitized

  return {
    ...sanitized,
    experimentId: assignment.experimentId,
    variantId: assignment.variantId,
  }
}

export function trackMizzzEvent(eventName: string, params?: AnalyticsParams): void {
  trackEvent(eventName, withExperiment(params))
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

export function trackThemeToggle(fromTheme: string, toTheme: string): void {
  trackMizzzEvent('theme_toggle', { from: fromTheme, to: toTheme })
}

export function trackLanguageSwitch(language: string, fromLanguage?: string): void {
  trackMizzzEvent('locale_switch', { locale: language, fromLocale: fromLanguage })
}

export function trackProductCardClick(location: string, slug: string, status: string): void {
  trackMizzzEvent('card_click', { location, contentType: 'product', entitySlug: slug, category: status })
}

export function trackSeasonalBlockClick(location: string, theme: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('hero_click', { location, theme, ...extras })
}

export function trackOmikujiResult(site: string, result: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('content_view', { site, category: result, ...extras })
}

export function trackPlayfulInteraction(
  type: string,
  location: string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('card_click', { type, location, ...extras })
}

export function trackErrorPageView(
  code: '404' | '500' | '503' | '403' | string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('content_view', { contentType: 'error_page', category: code, ...extras })
}

export function trackErrorPageCta(
  code: '404' | '500' | '503' | '403' | string,
  cta: string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('cta_click', { pageType: 'error', category: code, cta, ...extras })
}
