import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'
import { requireInternalPermission } from '../../../lib/auth/internal-access'

const OPS_TOKEN = process.env.ANALYTICS_OPS_TOKEN ?? process.env.INQUIRY_OPS_TOKEN ?? ''
const SALT = process.env.ANALYTICS_IP_HASH_SALT ?? process.env.INQUIRY_IP_HASH_SALT ?? 'mizzz-analytics'
const BI_DEFAULT_RANGE_DAYS = Number(process.env.BI_DEFAULT_RANGE_DAYS ?? 30)
const BI_MAX_FETCH_ROWS = Number(process.env.BI_MAX_FETCH_ROWS ?? 10000)
const BI_ALERT_MIN_VOLUME = Number(process.env.BI_ALERT_MIN_VOLUME ?? 20)
const BI_ALERT_DROP_RATIO = Number(process.env.BI_ALERT_DROP_RATIO ?? 0.2)
const BI_ALERT_SPIKE_RATIO = Number(process.env.BI_ALERT_SPIKE_RATIO ?? 0.35)
const BI_FORECAST_HORIZON_DAYS = Number(process.env.BI_FORECAST_HORIZON_DAYS ?? 14)
const PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD = Number(process.env.PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD ?? 200)
const PLAYBOOK_SAFE_MODE_DEFAULT = String(process.env.PLAYBOOK_SAFE_MODE_DEFAULT ?? 'true').toLowerCase() !== 'false'
const PLAYBOOK_RETRY_LIMIT = Number(process.env.PLAYBOOK_RETRY_LIMIT ?? 3)

const ALLOWED_EVENTS = new Set([
  'page_view', 'cta_click', 'nav_click', 'hero_click', 'card_click',
  'product_view', 'product_favorite_add', 'product_favorite_remove',
  'content_view', 'content_favorite_add', 'history_viewed',
  'notification_open', 'notification_click',
  'notification_preference_open', 'notification_preference_update',
  'email_opt_in', 'email_opt_out', 'in_app_opt_in', 'in_app_opt_out',
  'lifecycle_notification_impression', 'lifecycle_notification_click',
  'email_message_sent', 'email_message_failed', 'email_link_click',
  'notification_center_open', 'welcome_flow_complete', 'retention_nudge_click',
  'favorite_based_revisit', 'fc_update_revisit', 'campaign_message_click',
  'dormant_user_reactivation', 'unsubscribe_click',
  'search_open', 'search_submit', 'search_result_click', 'search_no_result',
  'filter_apply', 'sort_apply',
  'recommendation_impression', 'recommendation_click', 'related_content_click',
  'recent_history_click', 'favorite_based_click', 'notification_based_click',
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

function numberValue(value: unknown): number {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num : 0
}

function toIsoDay(value: unknown): string {
  const date = parseDateInput(value)
  if (!date) return 'unknown'
  return date.toISOString().slice(0, 10)
}

function toIsoMonth(value: unknown): string {
  const date = parseDateInput(value)
  if (!date) return 'unknown'
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function withinRange(value: unknown, from: Date, to: Date): boolean {
  const date = parseDateInput(value)
  if (!date) return false
  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime()
}

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
}

function toCsvRow(values: unknown[]): string {
  return values.map(toCsvCell).join(',')
}

function movingAverage(values: number[], window = 7): number[] {
  if (values.length === 0) return []
  return values.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = values.slice(start, index + 1)
    return slice.reduce((acc, item) => acc + item, 0) / slice.length
  })
}

function safeRatio(current: number, base: number): number {
  if (base <= 0) return 0
  return (current - base) / base
}

function toSeverity(delta: number): 'low' | 'medium' | 'high' {
  const absolute = Math.abs(delta)
  if (absolute >= 0.35) return 'high'
  if (absolute >= 0.2) return 'medium'
  return 'low'
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function sumBy<T>(rows: T[], getter: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + getter(row), 0)
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

  async internalBiOverview(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')

      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - BI_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [events, orders, revenues, subscriptions, inquiries, users, deliveries] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').findMany({
          filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['eventName', 'sourceSite', 'locale', 'eventAt', 'payload'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          filters: { orderedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'locale', 'orderedAt', 'totalAmount', 'paymentStatus', 'returnStatus', 'refundStatus', 'campaignId', 'userId'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'revenueType', 'revenueStatus', 'grossAmount', 'netAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt', 'campaignId', 'syncState'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['membershipType', 'subscriptionStatus', 'billingStatus', 'entitlementState', 'renewalDate', 'authUserId', 'customerId', 'createdAt', 'startAt', 'canceledAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'formType', 'status', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::app-user.app-user').findMany({
          fields: ['sourceSite', 'locale', 'membershipStatus', 'loyaltyState', 'firstLoginAt', 'createdAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['createdAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          filters: { sentAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'status', 'channel', 'templateKey', 'sentAt', 'clickedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
      ])

      const eventRows = events as Array<Record<string, unknown>>
      const orderRows = orders as Array<Record<string, unknown>>
      const revenueRows = revenues as Array<Record<string, unknown>>
      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const userRows = users as Array<Record<string, unknown>>
      const deliveryRows = deliveries as Array<Record<string, unknown>>

      const sessions = eventRows.filter((item) => item.eventName === 'page_view').length
      const newUsers = userRows.filter((item) => withinRange(item.firstLoginAt ?? item.createdAt, from, to)).length
      const mainToStore = eventRows.filter((item) => item.eventName === 'cta_click' && String((item.payload ?? {})['destination'] ?? '').includes('/store')).length
      const mainToFc = eventRows.filter((item) => item.eventName === 'cta_click' && String((item.payload ?? {})['destination'] ?? '').includes('/fanclub')).length
      const checkoutStarts = eventRows.filter((item) => item.eventName === 'cart_click').length
      const paidOrders = orderRows.filter((item) => item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded')
      const formsCompleted = eventRows.filter((item) => item.eventName === 'form_submit_success').length
      const revisitUsers = new Set(
        eventRows
          .filter((item) => item.eventName === 'favorite_based_revisit' || item.eventName === 'fc_update_revisit')
          .map((item) => String((item.payload ?? {})['userId'] ?? ''))
          .filter(Boolean),
      ).size

      const gross = revenueRows.reduce((acc, item) => acc + numberValue(item.grossAmount), 0)
      const net = revenueRows.reduce((acc, item) => acc + numberValue(item.netAmount), 0)
      const refund = revenueRows.reduce((acc, item) => acc + numberValue(item.refundAmount) + numberValue(item.partialRefundAmount), 0)
      const refundRate = gross > 0 ? refund / gross : 0

      const supportCount = inquiryRows.length
      const supportByCategory = (Object.entries(inquiryRows.reduce((acc: any, item) => {
        const key = String(item.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, count]) => ({ category, count }))

      const bySite = ['main', 'store', 'fc', 'cross'].map((site) => {
        const siteOrders = orderRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteRevenue = revenueRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteSupport = inquiryRows.filter((item) => String(item.sourceSite ?? '') === site)
        const siteEvents = eventRows.filter((item) => String(item.sourceSite ?? '') === site)
        return {
          site,
          sessions: siteEvents.filter((item) => item.eventName === 'page_view').length,
          paidOrders: siteOrders.filter((item) => item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded').length,
          netRevenue: siteRevenue.reduce((acc, item) => acc + numberValue(item.netAmount), 0),
          supportCases: siteSupport.length,
        }
      })

      const byLocale = (Object.entries(eventRows.reduce((acc: any, item) => {
        const locale = String(item.locale ?? 'unknown')
        acc[locale] = (acc[locale] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)) as Array<[string, number]>).map(([locale, count]) => ({ locale, events: count }))

      const byCampaign = (Object.entries(orderRows.reduce((acc: any, item) => {
        const campaign = String(item.campaignId ?? 'none')
        if (campaign === 'none') return acc
        if (!acc[campaign]) acc[campaign] = { campaignId: campaign, orders: 0, gross: 0 }
        acc[campaign].orders += 1
        acc[campaign].gross += numberValue(item.totalAmount)
        return acc
      }, {} as Record<string, { campaignId: string; orders: number; gross: number }>))
        .map(([, row]) => row) as Array<{ campaignId: string; orders: number; gross: number }>)
        .sort((a, b) => b.gross - a.gross)
        .slice(0, 10)

      const notificationPerformance = {
        sent: deliveryRows.filter((item) => item.status === 'sent').length,
        failed: deliveryRows.filter((item) => item.status === 'failed').length,
        clicked: deliveryRows.filter((item) => Boolean(item.clickedAt)).length,
      }

      const monthly = (Object.values(revenueRows.reduce((acc: any, item) => {
        const month = toIsoMonth(item.financialEventAt)
        if (month === 'unknown') return acc
        if (!acc[month]) acc[month] = { month, gross: 0, net: 0, refund: 0 }
        acc[month].gross += numberValue(item.grossAmount)
        acc[month].net += numberValue(item.netAmount)
        acc[month].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        return acc
      }, {} as Record<string, { month: string; gross: number; net: number; refund: number }>)) as Array<{ month: string; gross: number; net: number; refund: number }>).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

      const daily = (Object.values(eventRows.reduce((acc: any, item) => {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, sessions: 0, checkout: 0, formSuccess: 0 }
        if (item.eventName === 'page_view') acc[day].sessions += 1
        if (item.eventName === 'cart_click') acc[day].checkout += 1
        if (item.eventName === 'form_submit_success') acc[day].formSuccess += 1
        return acc
      }, {} as Record<string, { day: string; sessions: number; checkout: number; formSuccess: number }>)) as Array<{ day: string; sessions: number; checkout: number; formSuccess: number }>).sort((a, b) => a.day.localeCompare(b.day)).slice(-31)

      const kpi = {
        acquisition: {
          sessions,
          newUsers,
          trafficByReferrer: Object.entries(eventRows.reduce((acc: any, item) => {
            const referrer = String(item.referrerType ?? 'unknown')
            acc[referrer] = (acc[referrer] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)) as Array<[string, number]>,
        },
        conversion: {
          mainToStoreRate: sessions > 0 ? mainToStore / sessions : 0,
          mainToFcRate: sessions > 0 ? mainToFc / sessions : 0,
          checkoutStartRate: sessions > 0 ? checkoutStarts / sessions : 0,
          purchaseCompleteRate: checkoutStarts > 0 ? paidOrders.length / checkoutStarts : 0,
          fcJoinCompleteRate: eventRows.filter((item) => item.eventName === 'join_click').length > 0
            ? eventRows.filter((item) => item.eventName === 'login_success').length / eventRows.filter((item) => item.eventName === 'join_click').length
            : 0,
          formCompletionRate: eventRows.filter((item) => item.eventName === 'form_start').length > 0
            ? formsCompleted / eventRows.filter((item) => item.eventName === 'form_start').length
            : 0,
        },
        retention: {
          revisitUsers,
          notificationRevisitEvents: eventRows.filter((item) => item.eventName === 'notification_click').length,
          activeMembershipCount: subscriptionRows.filter((item) => item.entitlementState === 'active').length,
          graceMembershipCount: subscriptionRows.filter((item) => item.entitlementState === 'grace_period').length,
        },
        revenue: {
          gross,
          net,
          refund,
          refundRate,
          averageOrderValue: paidOrders.length > 0 ? paidOrders.reduce((acc, item) => acc + numberValue(item.totalAmount), 0) / paidOrders.length : 0,
          subscriptionRevenue: revenueRows.filter((item) => item.revenueType === 'fc_subscription').reduce((acc, item) => acc + numberValue(item.netAmount), 0),
        },
        support: {
          totalInquiries: supportCount,
          byCategory: supportByCategory,
        },
      }

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        freshnessState: {
          analyticsEventAt: eventRows[0]?.eventAt ?? null,
          orderAt: orderRows[0]?.orderedAt ?? null,
          revenueAt: revenueRows[0]?.financialEventAt ?? null,
          supportAt: inquiryRows[0]?.submittedAt ?? null,
        },
        sourceOfTruth: {
          rawEvent: 'api::analytics-event.analytics-event',
          orderFact: 'api::order.order',
          revenueFact: 'api::revenue-record.revenue-record',
          subscriptionFact: 'api::subscription-record.subscription-record',
          supportFact: 'api::inquiry-submission.inquiry-submission',
        },
        syncState: {
          revenue: Object.entries(revenueRows.reduce((acc: any, item) => {
            const state = String(item.syncState ?? 'unknown')
            acc[state] = (acc[state] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)) as Array<[string, number]>,
        },
        kpi,
        summaryTable: { monthly, daily, bySite, byLocale, byCampaign, notificationPerformance },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI overview の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiOverview failed: ${message}`)
      return ctx.internalServerError('BI overview の取得に失敗しました。')
    }
  },

  async internalBiCohorts(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')

      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - Math.max(180, BI_DEFAULT_RANGE_DAYS) * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [users, orders, subscriptions, inquiries] = await Promise.all([
        strapi.documents('api::app-user.app-user').findMany({
          fields: ['logtoUserId', 'firstLoginAt', 'createdAt', 'sourceSite', 'membershipStatus', 'loyaltyState'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['createdAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          fields: ['userId', 'orderedAt', 'totalAmount', 'paymentStatus', 'sourceSite', 'returnStatus', 'refundStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['authUserId', 'customerId', 'startAt', 'canceledAt', 'entitlementState', 'subscriptionStatus', 'billingStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['startAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          fields: ['email', 'submittedAt', 'sourceSite', 'status'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
      ])

      const userRows = (users as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.firstLoginAt ?? item.createdAt, from, to))
      const orderRows = (orders as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.orderedAt, from, to) && (item.paymentStatus === 'paid' || item.paymentStatus === 'succeeded'))
      const subscriptionRows = (subscriptions as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.startAt, from, to))
      const supportRows = (inquiries as Array<Record<string, unknown>>)
        .filter((item) => withinRange(item.submittedAt, from, to))

      const signupCohort = (Object.values(userRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.firstLoginAt ?? item.createdAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, users: 0, retained30d: 0, retained60d: 0, supportCases: 0 }
        acc[key].users += 1
        return acc
      }, {} as Record<string, { cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>)) as Array<{ cohortKey: string; users: number; retained30d: number; retained60d: number; supportCases: number }>)

      const firstPurchaseCohort = (Object.values(orderRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.orderedAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, orders: 0, revenue: 0, refundCases: 0 }
        acc[key].orders += 1
        acc[key].revenue += numberValue(item.totalAmount)
        if (item.returnStatus === 'refunded' || item.refundStatus === 'refunded') acc[key].refundCases += 1
        return acc
      }, {} as Record<string, { cohortKey: string; orders: number; revenue: number; refundCases: number }>)) as Array<{ cohortKey: string; orders: number; revenue: number; refundCases: number }>)

      const membershipCohort = (Object.values(subscriptionRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.startAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, joinCount: 0, canceledCount: 0, graceCount: 0, activeCount: 0 }
        acc[key].joinCount += 1
        if (item.canceledAt) acc[key].canceledCount += 1
        if (item.entitlementState === 'grace_period') acc[key].graceCount += 1
        if (item.entitlementState === 'active') acc[key].activeCount += 1
        return acc
      }, {} as Record<string, { cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>)) as Array<{ cohortKey: string; joinCount: number; canceledCount: number; graceCount: number; activeCount: number }>)

      const supportImpact = (Object.values(supportRows.reduce((acc: any, item) => {
        const key = toIsoMonth(item.submittedAt)
        if (key === 'unknown') return acc
        if (!acc[key]) acc[key] = { cohortKey: key, supportCases: 0, unresolved: 0 }
        acc[key].supportCases += 1
        if (item.status !== 'closed' && item.status !== 'replied') acc[key].unresolved += 1
        return acc
      }, {} as Record<string, { cohortKey: string; supportCases: number; unresolved: number }>)) as Array<{ cohortKey: string; supportCases: number; unresolved: number }>)

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        cohortKey: ['signup_month', 'first_purchase_month', 'membership_start_month'],
        retentionWindow: ['30d', '60d'],
        cohorts: {
          signup: signupCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          firstPurchase: firstPurchaseCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          membership: membershipCohort.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
          supportImpact: supportImpact.sort((a, b) => a.cohortKey.localeCompare(b.cohortKey)).slice(-12),
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI cohort の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiCohorts failed: ${message}`)
      return ctx.internalServerError('BI cohort の取得に失敗しました。')
    }
  },

  async internalBiAlerts(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const to = parseDateInput(ctx.query.to) ?? new Date()
      const from = parseDateInput(ctx.query.from) ?? new Date(to.getTime() - Math.max(30, BI_DEFAULT_RANGE_DAYS) * 24 * 60 * 60 * 1000)

      const [events, orders, revenues, subscriptions, inquiries, deliveries, webhooks] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').findMany({
          filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['eventName', 'sourceSite', 'locale', 'eventAt', 'payload'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
        strapi.documents('api::order.order').findMany({
          filters: { orderedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'orderedAt', 'paymentStatus'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['orderedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'revenueType', 'grossAmount', 'netAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['subscriptionStatus', 'billingStatus', 'entitlementState', 'renewalDate', 'createdAt', 'updatedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'formType', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          filters: { sentAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'status', 'channel', 'sentAt', 'clickedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
        strapi.documents('api::webhook-event-log.webhook-event-log').findMany({
          fields: ['provider', 'eventType', 'status', 'receivedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['receivedAt:desc'],
        }),
      ])

      const eventRows = events as Array<Record<string, unknown>>
      const orderRows = orders as Array<Record<string, unknown>>
      const revenueRows = revenues as Array<Record<string, unknown>>
      const subscriptionRows = subscriptions as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const deliveryRows = deliveries as Array<Record<string, unknown>>
      const webhookRows = (webhooks as Array<Record<string, unknown>>).filter((item) => withinRange(item.receivedAt, from, to))

      const dailyMap = new Map<string, {
        day: string
        sessions: number
        checkoutStarts: number
        paidOrders: number
        mainToStore: number
        mainToFc: number
        formStart: number
        formComplete: number
        netRevenue: number
        grossRevenue: number
        refundAmount: number
        fcRevenue: number
        supportCount: number
        notificationSent: number
        notificationClicked: number
        webhookFailure: number
      }>()
      const ensureDay = (day: string) => {
        if (!dailyMap.has(day)) {
          dailyMap.set(day, {
            day,
            sessions: 0,
            checkoutStarts: 0,
            paidOrders: 0,
            mainToStore: 0,
            mainToFc: 0,
            formStart: 0,
            formComplete: 0,
            netRevenue: 0,
            grossRevenue: 0,
            refundAmount: 0,
            fcRevenue: 0,
            supportCount: 0,
            notificationSent: 0,
            notificationClicked: 0,
            webhookFailure: 0,
          })
        }
        return dailyMap.get(day)!
      }

      for (const item of eventRows) {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        if (item.eventName === 'page_view') row.sessions += 1
        if (item.eventName === 'cart_click') row.checkoutStarts += 1
        if (item.eventName === 'form_start') row.formStart += 1
        if (item.eventName === 'form_submit_success') row.formComplete += 1
        if (item.eventName === 'cta_click') {
          const destination = String((item.payload ?? {})['destination'] ?? '')
          if (destination.includes('/store')) row.mainToStore += 1
          if (destination.includes('/fanclub')) row.mainToFc += 1
        }
      }

      for (const item of orderRows) {
        const day = toIsoDay(item.orderedAt)
        if (day === 'unknown') continue
        if (item.paymentStatus !== 'paid' && item.paymentStatus !== 'succeeded') continue
        ensureDay(day).paidOrders += 1
      }
      for (const item of revenueRows) {
        const day = toIsoDay(item.financialEventAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        row.grossRevenue += numberValue(item.grossAmount)
        row.netRevenue += numberValue(item.netAmount)
        row.refundAmount += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        if (item.revenueType === 'fc_subscription') row.fcRevenue += numberValue(item.netAmount)
      }
      for (const item of inquiryRows) {
        const day = toIsoDay(item.submittedAt)
        if (day === 'unknown') continue
        ensureDay(day).supportCount += 1
      }
      for (const item of deliveryRows) {
        const day = toIsoDay(item.sentAt)
        if (day === 'unknown') continue
        const row = ensureDay(day)
        if (item.status === 'sent') row.notificationSent += 1
        if (item.clickedAt) row.notificationClicked += 1
      }
      for (const item of webhookRows) {
        const day = toIsoDay(item.receivedAt)
        if (day === 'unknown') continue
        if (String(item.status ?? '').toLowerCase() === 'failed') ensureDay(day).webhookFailure += 1
      }

      const daily = [...dailyMap.values()].sort((a, b) => a.day.localeCompare(b.day))
      const latestWindow = daily.slice(-7)
      const previousWindow = daily.slice(-14, -7)
      const sumWindow = (rows: typeof daily, key: keyof (typeof daily)[number]) => rows.reduce((acc, row) => acc + numberValue(row[key]), 0)
      const avg = (rows: typeof daily, key: keyof (typeof daily)[number]) => rows.length > 0 ? sumWindow(rows, key) / rows.length : 0

      const currentSessions = sumWindow(latestWindow, 'sessions')
      const previousSessions = sumWindow(previousWindow, 'sessions')
      const currentMainToStoreRate = currentSessions > 0 ? sumWindow(latestWindow, 'mainToStore') / currentSessions : 0
      const previousMainToStoreRate = previousSessions > 0 ? sumWindow(previousWindow, 'mainToStore') / previousSessions : 0
      const currentMainToFcRate = currentSessions > 0 ? sumWindow(latestWindow, 'mainToFc') / currentSessions : 0
      const previousMainToFcRate = previousSessions > 0 ? sumWindow(previousWindow, 'mainToFc') / previousSessions : 0
      const currentCheckoutRate = currentSessions > 0 ? sumWindow(latestWindow, 'checkoutStarts') / currentSessions : 0
      const previousCheckoutRate = previousSessions > 0 ? sumWindow(previousWindow, 'checkoutStarts') / previousSessions : 0
      const currentPurchaseRate = sumWindow(latestWindow, 'checkoutStarts') > 0 ? sumWindow(latestWindow, 'paidOrders') / sumWindow(latestWindow, 'checkoutStarts') : 0
      const previousPurchaseRate = sumWindow(previousWindow, 'checkoutStarts') > 0 ? sumWindow(previousWindow, 'paidOrders') / sumWindow(previousWindow, 'checkoutStarts') : 0
      const currentFormRate = sumWindow(latestWindow, 'formStart') > 0 ? sumWindow(latestWindow, 'formComplete') / sumWindow(latestWindow, 'formStart') : 0
      const previousFormRate = sumWindow(previousWindow, 'formStart') > 0 ? sumWindow(previousWindow, 'formComplete') / sumWindow(previousWindow, 'formStart') : 0
      const currentNotificationCtr = sumWindow(latestWindow, 'notificationSent') > 0 ? sumWindow(latestWindow, 'notificationClicked') / sumWindow(latestWindow, 'notificationSent') : 0
      const previousNotificationCtr = sumWindow(previousWindow, 'notificationSent') > 0 ? sumWindow(previousWindow, 'notificationClicked') / sumWindow(previousWindow, 'notificationSent') : 0
      const currentRefundRate = sumWindow(latestWindow, 'grossRevenue') > 0 ? sumWindow(latestWindow, 'refundAmount') / sumWindow(latestWindow, 'grossRevenue') : 0
      const previousRefundRate = sumWindow(previousWindow, 'grossRevenue') > 0 ? sumWindow(previousWindow, 'refundAmount') / sumWindow(previousWindow, 'grossRevenue') : 0

      const metricSeries = {
        sessions: daily.map((row) => ({ day: row.day, value: row.sessions })),
        storeNetRevenue: daily.map((row) => ({ day: row.day, value: row.netRevenue - row.fcRevenue })),
        fcSubscriptionRevenue: daily.map((row) => ({ day: row.day, value: row.fcRevenue })),
        supportCases: daily.map((row) => ({ day: row.day, value: row.supportCount })),
      }

      const metricDefinition = [
        { metricKey: 'sessions', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'count' },
        { metricKey: 'main_to_store_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'main_to_fc_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'checkout_start_rate', ownerTeam: 'growth', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'purchase_complete_rate', ownerTeam: 'commerce', sourceOfTruth: 'api::order.order', unit: 'ratio' },
        { metricKey: 'form_completion_rate', ownerTeam: 'support', sourceOfTruth: 'api::analytics-event.analytics-event', unit: 'ratio' },
        { metricKey: 'notification_click_rate', ownerTeam: 'crm', sourceOfTruth: 'api::delivery-log.delivery-log', unit: 'ratio' },
        { metricKey: 'store_net_revenue', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'currency' },
        { metricKey: 'fc_subscription_revenue', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'currency' },
        { metricKey: 'refund_rate', ownerTeam: 'finance', sourceOfTruth: 'api::revenue-record.revenue-record', unit: 'ratio' },
        { metricKey: 'support_cases', ownerTeam: 'support', sourceOfTruth: 'api::inquiry-submission.inquiry-submission', unit: 'count' },
        { metricKey: 'webhook_failure_count', ownerTeam: 'operations', sourceOfTruth: 'api::webhook-event-log.webhook-event-log', unit: 'count' },
      ]

      const alertRules = [
        { metricKey: 'sessions', alertScope: 'global', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'growth' },
        { metricKey: 'purchase_complete_rate', alertScope: 'store', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'commerce' },
        { metricKey: 'form_completion_rate', alertScope: 'main,store,fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'support' },
        { metricKey: 'store_net_revenue', alertScope: 'store', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'fc_subscription_revenue', alertScope: 'fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_drop', value: BI_ALERT_DROP_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'refund_rate', alertScope: 'store,fc', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_spike', value: BI_ALERT_SPIKE_RATIO }, ownerTeam: 'finance' },
        { metricKey: 'support_cases', alertScope: 'global', comparisonWindow: 'last_7d_vs_prev_7d', alertThreshold: { type: 'relative_spike', value: BI_ALERT_SPIKE_RATIO }, ownerTeam: 'support' },
      ]

      const candidates = [
        { metricKey: 'sessions', current: currentSessions, baseline: previousSessions, hint: '流入低下時は main 導線 / 集客チャネル / 配信停止を確認' },
        { metricKey: 'main_to_store_rate', current: currentMainToStoreRate, baseline: previousMainToStoreRate, hint: 'main の store CTA 配置・文言・リンク切れを確認' },
        { metricKey: 'main_to_fc_rate', current: currentMainToFcRate, baseline: previousMainToFcRate, hint: 'main から fanclub 導線、会員特典訴求を確認' },
        { metricKey: 'checkout_start_rate', current: currentCheckoutRate, baseline: previousCheckoutRate, hint: '商品詳細→カート導線、在庫表示、価格表記を確認' },
        { metricKey: 'purchase_complete_rate', current: currentPurchaseRate, baseline: previousPurchaseRate, hint: '決済失敗、配送オプション、エラー率を確認' },
        { metricKey: 'form_completion_rate', current: currentFormRate, baseline: previousFormRate, hint: 'フォーム必須項目、バリデーション、入力補助を確認' },
        { metricKey: 'notification_click_rate', current: currentNotificationCtr, baseline: previousNotificationCtr, hint: '配信チャネル別 CTR、件名、配信タイミングを確認' },
        { metricKey: 'store_net_revenue', current: sumWindow(latestWindow, 'netRevenue') - sumWindow(latestWindow, 'fcRevenue'), baseline: sumWindow(previousWindow, 'netRevenue') - sumWindow(previousWindow, 'fcRevenue'), hint: 'store の checkout / 決済 / 在庫 / キャンペーンを確認' },
        { metricKey: 'fc_subscription_revenue', current: sumWindow(latestWindow, 'fcRevenue'), baseline: sumWindow(previousWindow, 'fcRevenue'), hint: '継続更新成功率、失敗課金、churn を確認' },
        { metricKey: 'refund_rate', current: currentRefundRate, baseline: previousRefundRate, hint: '返品理由、配送遅延、不良率、誤配送を確認' },
        { metricKey: 'support_cases', current: sumWindow(latestWindow, 'supportCount'), baseline: sumWindow(previousWindow, 'supportCount'), hint: 'FAQ/Guide不足、決済/配送障害、フォーム障害を確認' },
        { metricKey: 'webhook_failure_count', current: sumWindow(latestWindow, 'webhookFailure'), baseline: sumWindow(previousWindow, 'webhookFailure'), hint: 'Webhook endpoint とリトライ失敗ログを確認' },
      ]

      const anomalyEvents = candidates.flatMap((candidate) => {
        const totalVolume = candidate.current + candidate.baseline
        if (totalVolume < BI_ALERT_MIN_VOLUME) return []
        const deltaRatio = safeRatio(candidate.current, candidate.baseline)
        const negativeAnomaly = deltaRatio <= -BI_ALERT_DROP_RATIO && ['refund_rate', 'support_cases', 'webhook_failure_count'].includes(candidate.metricKey) === false
        const positiveAnomaly = deltaRatio >= BI_ALERT_SPIKE_RATIO && ['refund_rate', 'support_cases', 'webhook_failure_count'].includes(candidate.metricKey)
        if (!negativeAnomaly && !positiveAnomaly) return []
        const direction = deltaRatio >= 0 ? 'increase' : 'decrease'
        return [{
          metricKey: candidate.metricKey,
          anomalySeverity: toSeverity(deltaRatio),
          comparisonWindow: 'last_7d_vs_prev_7d',
          baselineSeries: candidate.baseline,
          metricSeries: candidate.current,
          explanationText: `${candidate.metricKey} が ${direction}（${(deltaRatio * 100).toFixed(1)}%）`,
          confidenceState: totalVolume >= BI_ALERT_MIN_VOLUME * 3 ? 'high' : 'medium',
          actionHint: candidate.hint,
          ownerTeam: metricDefinition.find((item) => item.metricKey === candidate.metricKey)?.ownerTeam ?? 'operations',
          muteState: 'unmuted',
          acknowledgementState: 'unacked',
        }]
      })

      const revenueSeriesValues = metricSeries.storeNetRevenue.map((item) => item.value)
      const supportSeriesValues = metricSeries.supportCases.map((item) => item.value)
      const revenueBaseline = movingAverage(revenueSeriesValues, 7)
      const supportBaseline = movingAverage(supportSeriesValues, 7)
      const latestDay = daily[daily.length - 1]?.day
      const forecastSeries = [
        {
          metricKey: 'store_net_revenue',
          forecastHorizon: `${BI_FORECAST_HORIZON_DAYS}d`,
          baselineSeries: metricSeries.storeNetRevenue.map((row, index) => ({ day: row.day, value: revenueBaseline[index] ?? row.value })),
          forecastSeries: Array.from({ length: BI_FORECAST_HORIZON_DAYS }).map((_, index) => ({ dayOffset: index + 1, value: revenueBaseline[revenueBaseline.length - 1] ?? 0 })),
          confidenceState: 'medium',
        },
        {
          metricKey: 'support_cases',
          forecastHorizon: `${BI_FORECAST_HORIZON_DAYS}d`,
          baselineSeries: metricSeries.supportCases.map((row, index) => ({ day: row.day, value: supportBaseline[index] ?? row.value })),
          forecastSeries: Array.from({ length: BI_FORECAST_HORIZON_DAYS }).map((_, index) => ({ dayOffset: index + 1, value: supportBaseline[supportBaseline.length - 1] ?? 0 })),
          confidenceState: 'medium',
        },
      ]

      const summaryInsights = [
        {
          reportAudience: 'executive',
          insightSeverity: anomalyEvents.some((item) => item.anomalySeverity === 'high') ? 'high' : 'medium',
          businessSignal: anomalyEvents.length > 0 ? `${anomalyEvents.length}件の重要変化を検知` : '重大な変化なし',
          signalSource: 'internal.bi.alerts',
          explanationText: anomalyEvents.length > 0 ? anomalyEvents.slice(0, 3).map((item) => item.explanationText).join(' / ') : '主要KPIは安定推移',
          actionHint: 'high のアラートは当日中に ownerTeam が一次調査し、acknowledge を更新',
        },
      ]

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        refreshState: { latestDay, generatedAt: new Date().toISOString() },
        sourceOfTruth: {
          rawEvent: 'api::analytics-event.analytics-event',
          orderFact: 'api::order.order',
          revenueFact: 'api::revenue-record.revenue-record',
          supportFact: 'api::inquiry-submission.inquiry-submission',
          webhookFact: 'api::webhook-event-log.webhook-event-log',
          subscriptionFact: 'api::subscription-record.subscription-record',
        },
        metricDefinition,
        metricSeries,
        alertRules,
        anomalyEvents,
        forecastSeries,
        summaryInsights,
        muteState: 'managed_in_runbook',
        notificationChannel: ['internal-dashboard', 'ops-runbook'],
        acknowledgementState: anomalyEvents.length > 0 ? 'pending' : 'none',
        businessHealthSnapshot: {
          churnSignals: subscriptionRows.filter((item) => item.subscriptionStatus === 'canceled' || item.entitlementState === 'grace_period').length,
          paymentFailures: subscriptionRows.filter((item) => item.billingStatus === 'failed').length,
          supportWeeklyAverage: avg(latestWindow, 'supportCount'),
          webhookFailureWeeklyAverage: avg(latestWindow, 'webhookFailure'),
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI alerts の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiAlerts failed: ${message}`)
      return ctx.internalServerError('BI alerts の取得に失敗しました。')
    }
  },

  async internalBiReport(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const audience = sanitizeText(ctx.query.audience, 40) ?? 'operations'
      const period = sanitizeText(ctx.query.period, 20) ?? 'weekly'
      const to = parseDateInput(ctx.query.to) ?? new Date()
      const days = period === 'monthly' ? 30 : 7
      const from = parseDateInput(ctx.query.from) ?? new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

      const [alerts, revenues, inquiries] = await Promise.all([
        strapi.documents('api::analytics-event.analytics-event').count({
          filters: { eventName: { $eq: 'api_failure' }, eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['netAmount', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'sourceSite', 'financialEventAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          filters: { submittedAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
          fields: ['sourceSite', 'inquiryCategory', 'submittedAt'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
      ])

      const revenueRows = revenues as Array<Record<string, unknown>>
      const inquiryRows = inquiries as Array<Record<string, unknown>>
      const gross = revenueRows.reduce((acc, item) => acc + numberValue(item.grossAmount), 0)
      const net = revenueRows.reduce((acc, item) => acc + numberValue(item.netAmount), 0)
      const refund = revenueRows.reduce((acc, item) => acc + numberValue(item.refundAmount) + numberValue(item.partialRefundAmount), 0)
      const refundRate = gross > 0 ? refund / gross : 0
      const supportTotal = inquiryRows.length
      const supportByCategory = (Object.entries(inquiryRows.reduce((acc: Record<string, number>, item) => {
        const key = String(item.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})) as Array<[string, number]>).sort((a, b) => b[1] - a[1]).slice(0, 5)

      const sections = [
        {
          reportSection: 'summary',
          explanationText: `${period === 'monthly' ? '月次' : '週次'}の net 売上は ${Math.round(net).toLocaleString()}、返金率は ${(refundRate * 100).toFixed(2)}%。support 件数は ${supportTotal} 件。`,
          actionHint: refundRate > 0.08 ? '返金理由上位カテゴリを優先調査し、商品説明・配送・品質改善を実行' : '現行運用を維持し、キャンペーン比較を継続',
          insightSeverity: refundRate > 0.12 ? 'high' : refundRate > 0.08 ? 'medium' : 'low',
        },
        {
          reportSection: 'operations',
          explanationText: `API失敗イベントは ${alerts} 件。support 上位カテゴリ: ${supportByCategory.map(([category, count]) => `${category}(${count})`).join(', ') || 'なし'}.`,
          actionHint: alerts > 0 ? 'internal admin の anomaly center で当日原因を確認し、runbookに追記' : '引き続き15分監視と週次レビューを継続',
          insightSeverity: alerts > 20 ? 'high' : alerts > 5 ? 'medium' : 'low',
        },
      ]

      ctx.body = {
        reportTemplate: {
          reportAudience: audience,
          period,
          sections: ['summary', 'operations', 'finance', 'support'],
          sourceOfTruth: ['api::revenue-record.revenue-record', 'api::inquiry-submission.inquiry-submission', 'api::analytics-event.analytics-event'],
        },
        reportRun: {
          generatedAt: new Date().toISOString(),
          range: { from: from.toISOString(), to: to.toISOString() },
          reportAudience: audience,
          period,
          summaryInsight: {
            explanationText: sections[0].explanationText,
            insightSeverity: sections.some((item) => item.insightSeverity === 'high') ? 'high' : 'medium',
            confidenceState: 'medium',
          },
          reportSections: sections,
          kpiSnapshot: {
            gross,
            net,
            refund,
            refundRate,
            supportTotal,
          },
          exportState: {
            csv: '/api/internal/bi/export.csv',
            dashboard: '/internal/admin',
            reviewOwner: audience === 'executive' ? '経営チーム' : audience === 'support' ? 'support/CS' : '運営チーム',
          },
        },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI report の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiReport failed: ${message}`)
      return ctx.internalServerError('BI report の生成に失敗しました。')
    }
  },

  async internalAutomationPlaybooks(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const from = parseDateInput(ctx.query.from) ?? daysAgo(14)
      const mid = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const [subscriptions, inquiries, revenues, deliveries, events] = await Promise.all([
        strapi.documents('api::subscription-record.subscription-record').findMany({
          fields: ['billingStatus', 'subscriptionStatus', 'updatedAt', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['updatedAt:desc'],
        }),
        strapi.documents('api::inquiry-submission.inquiry-submission').findMany({
          fields: ['submittedAt', 'inquiryCategory', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['submittedAt:desc'],
        }),
        strapi.documents('api::revenue-record.revenue-record').findMany({
          fields: ['financialEventAt', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['financialEventAt:desc'],
        }),
        strapi.documents('api::delivery-log.delivery-log').findMany({
          fields: ['sentAt', 'status', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['sentAt:desc'],
        }),
        strapi.documents('api::analytics-event.analytics-event').findMany({
          fields: ['eventAt', 'eventName', 'sourceSite'],
          limit: BI_MAX_FETCH_ROWS,
          sort: ['eventAt:desc'],
        }),
      ])

      const subRows = (subscriptions as Array<Record<string, unknown>>).filter((row) => withinRange(row.updatedAt, from, to))
      const inquiryRows = (inquiries as Array<Record<string, unknown>>).filter((row) => withinRange(row.submittedAt, from, to))
      const revenueRows = (revenues as Array<Record<string, unknown>>).filter((row) => withinRange(row.financialEventAt, from, to))
      const deliveryRows = (deliveries as Array<Record<string, unknown>>).filter((row) => withinRange(row.sentAt, from, to))
      const eventRows = (events as Array<Record<string, unknown>>).filter((row) => withinRange(row.eventAt, from, to))
      const prevRange = { from, to: mid }
      const latestRange = { from: mid, to }
      const inRange = (value: unknown, range: { from: Date; to: Date }) => withinRange(value, range.from, range.to)

      const previousPaymentFailures = subRows.filter((row) => row.billingStatus === 'failed' && inRange(row.updatedAt, prevRange)).length
      const latestPaymentFailures = subRows.filter((row) => row.billingStatus === 'failed' && inRange(row.updatedAt, latestRange)).length
      const previousSupportCases = inquiryRows.filter((row) => inRange(row.submittedAt, prevRange)).length
      const latestSupportCases = inquiryRows.filter((row) => inRange(row.submittedAt, latestRange)).length
      const previousRefundRate = (() => {
        const rows = revenueRows.filter((row) => inRange(row.financialEventAt, prevRange))
        const gross = sumBy(rows, (row) => numberValue(row.grossAmount))
        const refund = sumBy(rows, (row) => numberValue(row.refundAmount) + numberValue(row.partialRefundAmount))
        return gross > 0 ? refund / gross : 0
      })()
      const latestRefundRate = (() => {
        const rows = revenueRows.filter((row) => inRange(row.financialEventAt, latestRange))
        const gross = sumBy(rows, (row) => numberValue(row.grossAmount))
        const refund = sumBy(rows, (row) => numberValue(row.refundAmount) + numberValue(row.partialRefundAmount))
        return gross > 0 ? refund / gross : 0
      })()
      const previousCtr = (() => {
        const rows = deliveryRows.filter((row) => inRange(row.sentAt, prevRange))
        const sent = rows.filter((row) => row.status === 'sent').length
        const clicked = rows.filter((row) => row.status === 'clicked').length
        return sent > 0 ? clicked / sent : 0
      })()
      const latestCtr = (() => {
        const rows = deliveryRows.filter((row) => inRange(row.sentAt, latestRange))
        const sent = rows.filter((row) => row.status === 'sent').length
        const clicked = rows.filter((row) => row.status === 'clicked').length
        return sent > 0 ? clicked / sent : 0
      })()
      const previousCheckoutStarts = eventRows.filter((row) => row.eventName === 'cart_click' && inRange(row.eventAt, prevRange)).length
      const latestCheckoutStarts = eventRows.filter((row) => row.eventName === 'cart_click' && inRange(row.eventAt, latestRange)).length

      const highSupportCategory = (Object.entries(inquiryRows.reduce((acc: Record<string, number>, row) => {
        const key = String(row.inquiryCategory ?? 'unknown')
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})) as Array<[string, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

      const playbooks = [
        {
          playbookKey: 'billing-failed-payment-recovery',
          title: 'failed payment 急増時の回復導線提案',
          ownerTeam: 'finance',
          severity: 'high',
          runMode: 'auto_with_approval',
          sourceSite: 'cross',
          triggerSource: 'billing_event',
          triggerValue: { current: latestPaymentFailures, baseline: previousPaymentFailures, ratio: safeRatio(latestPaymentFailures, Math.max(previousPaymentFailures, 1)) },
          conditionSet: { paymentFailureCount: { gte: 10 }, conversionDropPercent: { gte: 20 } },
          action: ['recovery_message_suggestion', 'support_task_create', 'manual_review_queue_add'],
          approvalStep: ['finance_lead', 'support_lead'],
          approvalRequired: true,
        },
        {
          playbookKey: 'support-surge-faq-guidance',
          title: 'support 急増時のFAQ/Guide更新タスク',
          ownerTeam: 'support',
          severity: 'medium',
          runMode: 'auto_safe',
          sourceSite: 'cross',
          triggerSource: 'support_case_surge',
          triggerValue: { current: latestSupportCases, baseline: previousSupportCases, ratio: safeRatio(latestSupportCases, Math.max(previousSupportCases, 1)), category: highSupportCategory },
          conditionSet: { unresolvedDuration: { gteHours: 12 }, supportCategory: highSupportCategory },
          action: ['faq_update_task_create', 'guide_update_task_create', 'routing_recommendation'],
          approvalStep: [],
          approvalRequired: false,
        },
        {
          playbookKey: 'campaign-ctr-drop-review',
          title: 'campaign CTR 低下時の見直し提案',
          ownerTeam: 'crm',
          severity: 'medium',
          runMode: 'suggested',
          sourceSite: 'main',
          triggerSource: 'crm_campaign_degradation',
          triggerValue: { current: latestCtr, baseline: previousCtr, ratio: safeRatio(latestCtr, Math.max(previousCtr, 0.0001)) },
          conditionSet: { notificationCTR: { drop: BI_ALERT_DROP_RATIO } },
          action: ['campaign_review_task_create', 'template_switch_suggestion'],
          approvalStep: ['crm_lead'],
          approvalRequired: false,
        },
        {
          playbookKey: 'checkout-drop-growth-review',
          title: 'checkout 開始率低下時のgrowth調査',
          ownerTeam: 'growth',
          severity: 'high',
          runMode: 'suggested',
          sourceSite: 'store',
          triggerSource: 'kpi_alert',
          triggerValue: { current: latestCheckoutStarts, baseline: previousCheckoutStarts, ratio: safeRatio(latestCheckoutStarts, Math.max(previousCheckoutStarts, 1)) },
          conditionSet: { sourceSite: 'store', campaignScope: 'all' },
          action: ['growth_review_task_create', 'dashboard_pin'],
          approvalStep: [],
          approvalRequired: false,
        },
        {
          playbookKey: 'refund-spike-finance-review',
          title: 'refund率急増時のfinance review',
          ownerTeam: 'finance',
          severity: 'high',
          runMode: 'auto_with_approval',
          sourceSite: 'store',
          triggerSource: 'order_refund_event',
          triggerValue: { current: latestRefundRate, baseline: previousRefundRate, ratio: safeRatio(latestRefundRate, Math.max(previousRefundRate, 0.0001)) },
          conditionSet: { refundRate: { spike: BI_ALERT_SPIKE_RATIO } },
          action: ['finance_alert_create', 'campaign_pause_suggestion', 'manual_override_queue_add'],
          approvalStep: ['finance_lead'],
          approvalRequired: true,
        },
      ].map((playbook) => {
        const ratio = numberValue((playbook.triggerValue as Record<string, unknown>).ratio)
        const triggered = (playbook.severity === 'high' && Math.abs(ratio) >= BI_ALERT_DROP_RATIO) || (playbook.severity !== 'high' && Math.abs(ratio) >= 0.15)
        return {
          ...playbook,
          workflow: 'ops-automation-v1',
          retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, backoffMs: 30000 },
          runGuard: {
            dryRun: true,
            safeMode: PLAYBOOK_SAFE_MODE_DEFAULT,
            cooldownWindow: 'PT4H',
            deduplicationKey: `${playbook.playbookKey}:${toIsoDay(to.toISOString())}`,
            rateLimitRule: '20 actions / 10min',
            audienceSizeGuard: PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD,
          },
          executionState: triggered ? (playbook.approvalRequired ? 'pending_approval' : 'suggested') : 'skipped',
          triggered,
        }
      })

      const pendingApprovals = playbooks.filter((item) => item.triggered && item.approvalRequired).map((item) => ({
        playbookKey: item.playbookKey,
        title: item.title,
        ownerTeam: item.ownerTeam,
        approvalStatus: 'pending',
        approvalStep: item.approvalStep,
        reason: `${item.triggerSource} で閾値超過`,
      }))

      ctx.body = {
        range: { from: from.toISOString(), to: to.toISOString() },
        triggerSourceCatalog: ['kpi_alert', 'anomaly_detection', 'billing_event', 'order_refund_event', 'support_case_surge', 'crm_campaign_degradation', 'manual_operator_trigger'],
        runModeCatalog: ['manual', 'suggested', 'auto_safe', 'auto_with_approval', 'disabled'],
        playbooks,
        pendingApprovals,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation playbook の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationPlaybooks failed: ${message}`)
      return ctx.internalServerError('playbook 一覧の取得に失敗しました。')
    }
  },

  async internalAutomationRuns(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.audit.read')
      const logs = await strapi.documents('api::internal-audit-log.internal-audit-log').findMany({
        filters: { targetType: { $eq: 'playbook-execution' } },
        fields: ['targetId', 'action', 'status', 'reason', 'sourceSite', 'metadata', 'createdAt', 'actorLogtoUserId'],
        limit: 100,
        sort: ['createdAt:desc'],
      })

      const items = (logs as Array<Record<string, unknown>>).map((row) => ({
        executionRun: String(row.targetId ?? ''),
        actionStatus: row.status,
        action: row.action,
        sourceSite: row.sourceSite,
        reason: row.reason,
        actorLogtoUserId: row.actorLogtoUserId,
        createdAt: row.createdAt,
        metadata: row.metadata ?? {},
      }))

      ctx.body = { count: items.length, items }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation run の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationRuns failed: ${message}`)
      return ctx.internalServerError('playbook 実行履歴の取得に失敗しました。')
    }
  },

  async internalAutomationRun(ctx) {
    try {
      const access = await requireInternalPermission(ctx, 'internal.playbook.run')
      const body = (ctx.request.body ?? {}) as Record<string, unknown>
      const playbookKey = sanitizeText(body.playbookKey, 120)
      if (!playbookKey) return ctx.badRequest('playbookKey は必須です。')
      const runMode = sanitizeText(body.runMode, 40) ?? 'manual'
      const dryRun = body.dryRun !== false
      const sourceSite = sanitizeSourceSite(body.sourceSite)
      const reason = sanitizeText(body.reason, 240) ?? 'manual trigger'
      const approvalRequired = Boolean((body.approvalRequired ?? (playbookKey.includes('billing') || playbookKey.includes('refund'))))
      const actionStatus = approvalRequired ? 'denied' : 'success'
      const executionRun = `${playbookKey}:${Date.now()}`
      const metadata = {
        workflow: 'ops-automation-v1',
        runMode,
        dryRun,
        safeMode: PLAYBOOK_SAFE_MODE_DEFAULT,
        retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, backoffMs: 30000 },
        idempotencyKey: `${playbookKey}:${toIsoDay(new Date().toISOString())}:${sourceSite}`,
        approvalStatus: approvalRequired ? 'pending' : 'not_required',
        rollbackHint: approvalRequired ? '承認前のため適用なし' : '実行済み action の taskId を参照して差し戻し',
      }

      await strapi.documents('api::internal-audit-log.internal-audit-log').create({
        data: {
          actorLogtoUserId: access.authUser.userId,
          actorInternalRoles: access.internalRoles,
          targetType: 'playbook-execution',
          targetId: executionRun,
          action: `playbook:${playbookKey}`,
          status: actionStatus,
          reason,
          sourceSite: sourceSite === 'unknown' ? 'cross' : sourceSite,
          beforeState: { executionState: 'pending' },
          afterState: { executionState: approvalRequired ? 'pending_approval' : (dryRun ? 'dry_run_completed' : 'succeeded') },
          metadata,
          requestId: String(ctx.request.headers['x-request-id'] ?? ''),
        },
      })

      ctx.body = {
        executionRun,
        playbookKey,
        runMode,
        dryRun,
        sourceSite,
        actionStatus: approvalRequired ? 'pending_approval' : (dryRun ? 'dry_run_completed' : 'succeeded'),
        approvalStatus: approvalRequired ? 'pending' : 'not_required',
        failureReason: approvalRequired ? 'dangerous action のため承認待ちへ移送' : null,
        retryPolicy: { maxAttempts: PLAYBOOK_RETRY_LIMIT, attempts: 0 },
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal automation run の権限がありません。')
      strapi.log.error(`[analytics-event] internalAutomationRun failed: ${message}`)
      return ctx.internalServerError('playbook 実行に失敗しました。')
    }
  },

  async internalBiExportCsv(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const from = parseDateInput(ctx.query.from) ?? new Date(Date.now() - BI_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
      const to = parseDateInput(ctx.query.to) ?? new Date()

      const events = await strapi.documents('api::analytics-event.analytics-event').findMany({
        filters: { eventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        fields: ['eventName', 'sourceSite', 'locale', 'eventAt'],
        limit: BI_MAX_FETCH_ROWS,
        sort: ['eventAt:desc'],
      })
      const revenues = await strapi.documents('api::revenue-record.revenue-record').findMany({
        filters: { financialEventAt: { $gte: from.toISOString(), $lte: to.toISOString() } },
        fields: ['sourceSite', 'netAmount', 'grossAmount', 'refundAmount', 'partialRefundAmount', 'financialEventAt'],
        limit: BI_MAX_FETCH_ROWS,
        sort: ['financialEventAt:desc'],
      })

      const eventDaily = (Object.values((events as Array<Record<string, unknown>>).reduce((acc: any, item) => {
        const day = toIsoDay(item.eventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, sessions: 0, ctaClicks: 0 }
        if (item.eventName === 'page_view') acc[day].sessions += 1
        if (item.eventName === 'cta_click') acc[day].ctaClicks += 1
        return acc
      }, {} as Record<string, { day: string; sessions: number; ctaClicks: number }>)) as Array<{ day: string; sessions: number; ctaClicks: number }>)

      const revenueDaily = (Object.values((revenues as Array<Record<string, unknown>>).reduce((acc: any, item) => {
        const day = toIsoDay(item.financialEventAt)
        if (day === 'unknown') return acc
        if (!acc[day]) acc[day] = { day, gross: 0, net: 0, refund: 0 }
        acc[day].gross += numberValue(item.grossAmount)
        acc[day].net += numberValue(item.netAmount)
        acc[day].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        return acc
      }, {} as Record<string, { day: string; gross: number; net: number; refund: number }>)) as Array<{ day: string; gross: number; net: number; refund: number }>)

      const merged = eventDaily.map((row) => ({
        ...row,
        gross: revenueDaily.find((item) => item.day === row.day)?.gross ?? 0,
        net: revenueDaily.find((item) => item.day === row.day)?.net ?? 0,
        refund: revenueDaily.find((item) => item.day === row.day)?.refund ?? 0,
      })).sort((a, b) => b.day.localeCompare(a.day))

      const headers = ['day', 'sessions', 'ctaClicks', 'gross', 'net', 'refund']
      const lines = [toCsvRow(headers), ...merged.map((row) => toCsvRow([row.day, row.sessions, row.ctaClicks, row.gross, row.net, row.refund]))]

      ctx.set('Content-Type', 'text/csv; charset=utf-8')
      ctx.set('Content-Disposition', `attachment; filename="bi-overview-${new Date().toISOString().slice(0, 10)}.csv"`)
      ctx.body = `\uFEFF${lines.join('\n')}`
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal BI export の権限がありません。')
      strapi.log.error(`[analytics-event] internalBiExportCsv failed: ${message}`)
      return ctx.internalServerError('BI export の作成に失敗しました。')
    }
  },
}))
