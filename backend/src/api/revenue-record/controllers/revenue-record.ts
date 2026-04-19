import { factories } from '@strapi/strapi'
import { requireInternalPermission } from '../../../lib/auth/internal-access'

type RevenueRecord = {
  id: number
  revenueSource?: string
  revenueType?: string
  revenueStatus?: string
  grossAmount?: number
  netAmount?: number
  refundAmount?: number
  partialRefundAmount?: number
  discountAmount?: number
  shippingFee?: number
  taxAmount?: number
  orderId?: string | null
  subscriptionId?: string | null
  paymentId?: string | null
  refundId?: string | null
  currency?: string
  sourceSite?: string
  campaignId?: string | null
  couponId?: string | null
  userId?: string | null
  financialEventType?: string
  financialEventAt?: string | null
  recognizedAt?: string | null
  syncState?: string
  summaryState?: string
  reportPeriod?: string | null
}

function toDayKey(value?: string | null): string {
  if (!value) return 'unknown'
  return String(value).slice(0, 10)
}

function toMonthKey(value?: string | null): string {
  if (!value) return 'unknown'
  return String(value).slice(0, 7)
}

function sumBy<T>(items: T[], reader: (item: T) => number): number {
  return items.reduce((acc, item) => acc + reader(item), 0)
}

function numberValue(raw: unknown): number {
  const value = Number(raw ?? 0)
  return Number.isFinite(value) ? value : 0
}

function normalizeCurrency(raw: unknown): string {
  return typeof raw === 'string' && raw.trim() ? raw.toUpperCase() : 'JPY'
}

export default factories.createCoreController('api::revenue-record.revenue-record', ({ strapi }) => ({
  async internalSummary(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const sourceSite = String(ctx.query.sourceSite ?? '').trim()
      const reportPeriod = String(ctx.query.reportPeriod ?? '').trim()
      const limit = Math.max(1, Math.min(2000, Number(ctx.query.limit ?? 1000)))

      const filters: Record<string, unknown> = {}
      if (sourceSite) filters.sourceSite = { $eq: sourceSite }
      if (reportPeriod) filters.reportPeriod = { $eq: reportPeriod }

      const records = await strapi.documents('api::revenue-record.revenue-record').findMany({
        filters,
        limit,
        sort: ['financialEventAt:desc', 'createdAt:desc'],
      }) as RevenueRecord[]

      const gross = sumBy(records, (item) => numberValue(item.grossAmount))
      const net = sumBy(records, (item) => numberValue(item.netAmount))
      const refund = sumBy(records, (item) => numberValue(item.refundAmount) + numberValue(item.partialRefundAmount))
      const shipping = sumBy(records, (item) => numberValue(item.shippingFee))
      const discount = sumBy(records, (item) => numberValue(item.discountAmount))
      const tax = sumBy(records, (item) => numberValue(item.taxAmount))

      const bySourceSite = Object.values(records.reduce((acc, item) => {
        const key = item.sourceSite ?? item.revenueSource ?? 'unknown'
        if (!acc[key]) {
          acc[key] = { sourceSite: key, gross: 0, net: 0, refund: 0, records: 0 }
        }
        acc[key].gross += numberValue(item.grossAmount)
        acc[key].net += numberValue(item.netAmount)
        acc[key].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        acc[key].records += 1
        return acc
      }, {} as Record<string, { sourceSite: string; gross: number; net: number; refund: number; records: number }>))

      const byRevenueType = Object.values(records.reduce((acc, item) => {
        const key = item.revenueType ?? 'unknown'
        if (!acc[key]) {
          acc[key] = { revenueType: key, gross: 0, net: 0, refund: 0, records: 0 }
        }
        acc[key].gross += numberValue(item.grossAmount)
        acc[key].net += numberValue(item.netAmount)
        acc[key].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        acc[key].records += 1
        return acc
      }, {} as Record<string, { revenueType: string; gross: number; net: number; refund: number; records: number }>))

      const daily = Object.values(records.reduce((acc, item) => {
        const key = toDayKey(item.financialEventAt ?? item.recognizedAt ?? null)
        if (!acc[key]) acc[key] = { day: key, gross: 0, net: 0, refund: 0, records: 0 }
        acc[key].gross += numberValue(item.grossAmount)
        acc[key].net += numberValue(item.netAmount)
        acc[key].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        acc[key].records += 1
        return acc
      }, {} as Record<string, { day: string; gross: number; net: number; refund: number; records: number }>)).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 31)

      const monthly = Object.values(records.reduce((acc, item) => {
        const key = toMonthKey(item.financialEventAt ?? item.recognizedAt ?? null)
        if (!acc[key]) acc[key] = { month: key, gross: 0, net: 0, refund: 0, records: 0 }
        acc[key].gross += numberValue(item.grossAmount)
        acc[key].net += numberValue(item.netAmount)
        acc[key].refund += numberValue(item.refundAmount) + numberValue(item.partialRefundAmount)
        acc[key].records += 1
        return acc
      }, {} as Record<string, { month: string; gross: number; net: number; refund: number; records: number }>)).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12)

      const failedCount = records.filter((item) => item.revenueStatus === 'failed').length
      const canceledCount = records.filter((item) => item.revenueStatus === 'canceled').length
      const refundedCount = records.filter((item) => item.revenueType === 'refund' || item.revenueType === 'partial_refund').length

      ctx.body = {
        count: records.length,
        currency: normalizeCurrency(records[0]?.currency),
        totals: { gross, net, refund, shipping, discount, tax },
        counts: { failed: failedCount, canceled: canceledCount, refunded: refundedCount },
        bySourceSite,
        byRevenueType,
        daily,
        monthly,
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal revenue summary の権限がありません。')
      strapi.log.error(`[revenue] internalSummary failed: ${message}`)
      return ctx.internalServerError('売上サマリーの取得に失敗しました。')
    }
  },

  async internalRecords(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const sourceSite = String(ctx.query.sourceSite ?? '').trim()
      const revenueType = String(ctx.query.revenueType ?? '').trim()
      const reportPeriod = String(ctx.query.reportPeriod ?? '').trim()
      const limit = Math.max(1, Math.min(200, Number(ctx.query.limit ?? 100)))
      const filters: Record<string, unknown> = {}
      if (sourceSite) filters.sourceSite = { $eq: sourceSite }
      if (revenueType) filters.revenueType = { $eq: revenueType }
      if (reportPeriod) filters.reportPeriod = { $eq: reportPeriod }

      const records = await strapi.documents('api::revenue-record.revenue-record').findMany({
        filters,
        limit,
        sort: ['financialEventAt:desc', 'createdAt:desc'],
      }) as RevenueRecord[]

      ctx.body = {
        count: records.length,
        items: records.map((item) => ({
          id: item.id,
          sourceSite: item.sourceSite ?? item.revenueSource,
          revenueType: item.revenueType,
          revenueStatus: item.revenueStatus,
          grossAmount: numberValue(item.grossAmount),
          netAmount: numberValue(item.netAmount),
          refundAmount: numberValue(item.refundAmount) + numberValue(item.partialRefundAmount),
          discountAmount: numberValue(item.discountAmount),
          shippingFee: numberValue(item.shippingFee),
          taxAmount: numberValue(item.taxAmount),
          orderId: item.orderId,
          subscriptionId: item.subscriptionId,
          paymentId: item.paymentId,
          refundId: item.refundId,
          campaignId: item.campaignId,
          couponId: item.couponId,
          userId: item.userId,
          currency: normalizeCurrency(item.currency),
          financialEventType: item.financialEventType,
          financialEventAt: item.financialEventAt,
          reportPeriod: item.reportPeriod,
          syncState: item.syncState,
          summaryState: item.summaryState,
        })),
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal revenue records の権限がありません。')
      strapi.log.error(`[revenue] internalRecords failed: ${message}`)
      return ctx.internalServerError('売上明細の取得に失敗しました。')
    }
  },

  async internalExportCsv(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const sourceSite = String(ctx.query.sourceSite ?? '').trim()
      const reportPeriod = String(ctx.query.reportPeriod ?? '').trim()
      const filters: Record<string, unknown> = {}
      if (sourceSite) filters.sourceSite = { $eq: sourceSite }
      if (reportPeriod) filters.reportPeriod = { $eq: reportPeriod }

      const maxRows = Math.max(100, Math.min(20000, Number(process.env.REVENUE_EXPORT_MAX_ROWS ?? 5000)))
      const records = await strapi.documents('api::revenue-record.revenue-record').findMany({
        filters,
        limit: maxRows,
        sort: ['financialEventAt:desc', 'createdAt:desc'],
      }) as RevenueRecord[]

      const header = [
        'id', 'sourceSite', 'revenueType', 'revenueStatus', 'grossAmount', 'netAmount', 'refundAmount', 'discountAmount',
        'shippingFee', 'taxAmount', 'currency', 'orderId', 'subscriptionId', 'paymentId', 'refundId', 'userId',
        'campaignId', 'couponId', 'financialEventType', 'financialEventAt', 'reportPeriod', 'syncState', 'summaryState',
      ]

      const rows = records.map((item) => [
        item.id,
        item.sourceSite ?? item.revenueSource ?? '',
        item.revenueType ?? '',
        item.revenueStatus ?? '',
        numberValue(item.grossAmount),
        numberValue(item.netAmount),
        numberValue(item.refundAmount) + numberValue(item.partialRefundAmount),
        numberValue(item.discountAmount),
        numberValue(item.shippingFee),
        numberValue(item.taxAmount),
        normalizeCurrency(item.currency),
        item.orderId ?? '',
        item.subscriptionId ?? '',
        item.paymentId ?? '',
        item.refundId ?? '',
        item.userId ?? '',
        item.campaignId ?? '',
        item.couponId ?? '',
        item.financialEventType ?? '',
        item.financialEventAt ?? item.recognizedAt ?? '',
        item.reportPeriod ?? '',
        item.syncState ?? '',
        item.summaryState ?? '',
      ])

      const csv = [header, ...rows]
        .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      ctx.set('Content-Type', 'text/csv; charset=utf-8')
      ctx.set('Content-Disposition', `attachment; filename="revenue-records-${new Date().toISOString().slice(0, 10)}.csv"`)
      ctx.body = `\uFEFF${csv}`
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) return ctx.forbidden('internal revenue export の権限がありません。')
      strapi.log.error(`[revenue] internalExportCsv failed: ${message}`)
      return ctx.internalServerError('CSV エクスポートに失敗しました。')
    }
  },
}))
