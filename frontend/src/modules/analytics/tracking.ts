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

export function trackThemeToggle(fromTheme: string, toTheme: string): void {
  trackMizzzEvent('theme_toggle', { from: fromTheme, to: toTheme })
}

export function trackLanguageSwitch(language: string, fromLanguage?: string): void {
  trackMizzzEvent('language_switch', { language, from: fromLanguage })
}

export function trackProductCardClick(location: string, slug: string, status: string): void {
  trackMizzzEvent('product_card_click', { location, slug, status })
}

export function trackSeasonalBlockClick(location: string, theme: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('seasonal_block_click', { location, theme, ...extras })
}

export function trackOmikujiResult(site: string, result: string, extras?: AnalyticsParams): void {
  trackMizzzEvent('omikuji_result', { site, result, ...extras })
}

export function trackPlayfulInteraction(
  type: string,
  location: string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('playful_interaction', { type, location, ...extras })
}

export function trackErrorPageView(
  code: '404' | '500' | '503' | '403' | string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('error_page_view', { code, ...extras })
}

export function trackErrorPageCta(
  code: '404' | '500' | '503' | '403' | string,
  cta: string,
  extras?: AnalyticsParams,
): void {
  trackMizzzEvent('error_page_cta_click', { code, cta, ...extras })
}
