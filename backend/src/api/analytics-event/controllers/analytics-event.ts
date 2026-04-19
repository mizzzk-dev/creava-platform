import { createHash } from 'node:crypto'
import { factories } from '@strapi/strapi'
import { requireInternalPermission } from '../../../lib/auth/internal-access'

const OPS_TOKEN = process.env.ANALYTICS_OPS_TOKEN ?? process.env.INQUIRY_OPS_TOKEN ?? ''
const SALT = process.env.ANALYTICS_IP_HASH_SALT ?? process.env.INQUIRY_IP_HASH_SALT ?? 'mizzz-analytics'
const BI_DEFAULT_RANGE_DAYS = Number(process.env.BI_DEFAULT_RANGE_DAYS ?? 30)
const BI_MAX_FETCH_ROWS = Number(process.env.BI_MAX_FETCH_ROWS ?? 10000)

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
