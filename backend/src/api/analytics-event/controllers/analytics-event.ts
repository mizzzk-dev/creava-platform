import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'

const OPS_TOKEN = process.env.ANALYTICS_OPS_TOKEN ?? process.env.INQUIRY_OPS_TOKEN ?? ''
const SALT = process.env.ANALYTICS_IP_HASH_SALT ?? process.env.INQUIRY_IP_HASH_SALT ?? 'mizzz-analytics'

const ALLOWED_EVENTS = new Set([
  'page_view', 'cta_click', 'nav_click', 'hero_click', 'card_click',
  'product_view', 'product_favorite_add', 'product_favorite_remove',
  'content_view', 'content_favorite_add', 'history_viewed',
  'notification_open', 'notification_click',
  'search_submit', 'filter_apply', 'sort_apply',
  'support_search', 'faq_open', 'guide_open',
  'form_start', 'form_confirm', 'form_submit_success', 'form_submit_failure',
  'login_click', 'signup_click', 'login_success',
  'theme_toggle', 'locale_switch',
  'cart_click', 'join_click', 'event_calendar_click',
  'campaign_click', 'error_state_view', 'retry_click', 'empty_state_view', 'api_failure',
])

function sanitizeText(value: unknown, maxLength = 120): string | undefined {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  if (!text) return undefined
  return text.slice(0, maxLength)
}

function sanitizeSourceSite(value: unknown): 'main' | 'store' | 'fc' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'main' || v === 'store' || v === 'fc') return v
  return 'unknown'
}

function sanitizeTheme(value: unknown): 'light' | 'dark' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'light' || v === 'dark') return v
  return 'unknown'
}

function sanitizeUserState(value: unknown): 'guest' | 'logged_in' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'guest' || v === 'logged_in') return v
  return 'unknown'
}

function sanitizeDeviceType(value: unknown): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'mobile' || v === 'tablet' || v === 'desktop') return v
  return 'unknown'
}

function sanitizeReferrerType(value: unknown): 'direct' | 'internal' | 'external' | 'unknown' {
  const v = String(value ?? '').toLowerCase()
  if (v === 'direct' || v === 'internal' || v === 'external') return v
  return 'unknown'
}

function getClientIp(ctx: any): string {
  const forwarded = ctx.request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? ctx.ip
  }
  return ctx.ip
}

function hashIp(ip: string): string {
  return createHash('sha256').update(`${ip}:${SALT}`).digest('hex')
}

function requireOpsToken(ctx: any): boolean {
  if (!OPS_TOKEN) {
    ctx.unauthorized('ANALYTICS_OPS_TOKEN が未設定です。')
    return false
  }

  const token = String(ctx.request.headers['x-analytics-ops-token'] ?? '')
  if (token !== OPS_TOKEN) {
    ctx.unauthorized('ops token が不正です。')
    return false
  }
  return true
}

function parseDateInput(value: unknown): Date | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export default factories.createCoreController('api::analytics-event.analytics-event', ({ strapi }) => ({
  async publicTrack(ctx) {
    const body = (ctx.request.body ?? {}) as {
      eventName?: string
      params?: Record<string, unknown>
    }

    const eventName = sanitizeText(body.eventName, 80)
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return ctx.badRequest('eventName が許可されていません。')
    }

    const params = body.params ?? {}
    const sourceSite = sanitizeSourceSite(params.sourceSite)
    const payload = Object.fromEntries(
      Object.entries(params).filter(([key]) => !['email', 'phone', 'name', 'userId'].includes(key)),
    )

    await strapi.documents('api::analytics-event.analytics-event').create({
      data: {
        eventName,
        sourceSite,
        locale: sanitizeText(params.locale, 12) ?? 'ja',
        theme: sanitizeTheme(params.theme),
        pageType: sanitizeText(params.pageType, 80),
        contentType: sanitizeText(params.contentType, 80),
        entityId: sanitizeText(params.entityId, 80),
        entitySlug: sanitizeText(params.entitySlug, 160),
        formType: sanitizeText(params.formType, 80),
        category: sanitizeText(params.category, 120),
        userState: sanitizeUserState(params.userState),
        deviceType: sanitizeDeviceType(params.deviceType),
        referrerType: sanitizeReferrerType(params.referrerType),
        experimentId: sanitizeText(params.experimentId, 80),
        variantId: sanitizeText(params.variantId, 80),
        path: sanitizeText(params.page_path, 240),
        payload,
        eventAt: parseDateInput(params.timestamp) ?? new Date(),
        ipHash: hashIp(getClientIp(ctx)),
        consentState: 'granted',
      },
    })

    ctx.body = { ok: true }
  },

  async opsSummary(ctx) {
    if (!requireOpsToken(ctx)) return

    const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const to = parseDateInput(ctx.query.to) ?? new Date()
    const sourceSite = sanitizeSourceSite(ctx.query.sourceSite)

    const filters: Record<string, unknown> = {
      eventAt: {
        $gte: from.toISOString(),
        $lte: to.toISOString(),
      },
    }

    if (sourceSite !== 'unknown') {
      filters.sourceSite = { $eq: sourceSite }
    }

    const events = await strapi.documents('api::analytics-event.analytics-event').findMany({
      filters,
      fields: ['eventName', 'sourceSite', 'formType', 'category', 'locale', 'eventAt'],
      limit: 5000,
      sort: ['eventAt:desc'],
    })

    const byEvent = new Map<string, number>()
    const bySite = new Map<string, number>()
    const byFormType = new Map<string, number>()
    const byLocale = new Map<string, number>()

    for (const event of events as Array<Record<string, unknown>>) {
      const eventName = String(event.eventName ?? 'unknown')
      const site = String(event.sourceSite ?? 'unknown')
      const formType = String(event.formType ?? 'none')
      const locale = String(event.locale ?? 'unknown')

      byEvent.set(eventName, (byEvent.get(eventName) ?? 0) + 1)
      bySite.set(site, (bySite.get(site) ?? 0) + 1)
      if (formType !== 'none') byFormType.set(formType, (byFormType.get(formType) ?? 0) + 1)
      byLocale.set(locale, (byLocale.get(locale) ?? 0) + 1)
    }

    const toSortedObject = (map: Map<string, number>) => Object.fromEntries(
      [...map.entries()].sort((a, b) => b[1] - a[1]),
    )

    ctx.body = {
      range: { from: from.toISOString(), to: to.toISOString() },
      totalEvents: events.length,
      byEvent: toSortedObject(byEvent),
      bySite: toSortedObject(bySite),
      byFormType: toSortedObject(byFormType),
      byLocale: toSortedObject(byLocale),
    }
  },
}))
