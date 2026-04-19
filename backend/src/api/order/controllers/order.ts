import { factories } from '@strapi/strapi'
import { verifyLogtoToken } from '../../../lib/auth/logto'
import { requireInternalPermission } from '../../../lib/auth/internal-access'

type UserFacingOrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'canceled' | 'refund_in_progress' | 'refunded' | 'exception'

type UserFacingShipmentStatus = 'not_shipped' | 'preparing' | 'in_transit' | 'delivered' | 'returned' | 'exception'

function toUserFacingOrderStatus(order: any): UserFacingOrderStatus {
  if (order.returnStatus === 'refunded' || order.refundStatus === 'refunded') return 'refunded'
  if (order.returnStatus === 'approved' || order.returnStatus === 'received') return 'refund_in_progress'
  if (order.orderStatus === 'canceled' || order.orderStatus === 'cancelled') return 'canceled'
  if (order.shipmentStatus === 'delivered') return 'delivered'
  if (order.shipmentStatus === 'in_transit' || order.shipmentStatus === 'shipped') return 'shipped'
  if (order.fulfillmentStatus === 'preparing') return 'preparing'
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'succeeded') return 'paid'
  if (order.orderStatus === 'exception' || order.shipmentStatus === 'failed' || order.fulfillmentStatus === 'failed') return 'exception'
  return 'pending'
}

function toUserFacingShipmentStatus(order: any): UserFacingShipmentStatus {
  if (order.shipmentStatus === 'delivered') return 'delivered'
  if (order.shipmentStatus === 'in_transit' || order.shipmentStatus === 'shipped') return 'in_transit'
  if (order.shipmentStatus === 'returned') return 'returned'
  if (order.fulfillmentStatus === 'preparing') return 'preparing'
  if (order.shipmentStatus === 'failed' || order.fulfillmentStatus === 'failed') return 'exception'
  return 'not_shipped'
}

function normalizeOrderForMember(order: any) {
  return {
    id: Number(order.id),
    externalOrderId: order.orderNumber ?? order.externalId ?? order.documentId,
    provider: order.provider ?? 'stripe',
    providerStatus: order.paymentStatus ?? 'pending',
    status: toUserFacingOrderStatus(order),
    total: Number(order.totalAmount ?? order.amountTotal ?? 0),
    currency: order.currency ?? 'JPY',
    orderedAt: order.orderedAt ?? order.createdAt,
    lines: (order.lineItems ?? []).map((line: any) => ({
      productName: line.title ?? line.productName ?? line.name ?? 'item',
      quantity: Number(line.quantity ?? 1),
    })),
    paymentStatus: order.paymentStatus ?? 'pending',
    orderStatus: order.orderStatus ?? 'pending',
    fulfillmentStatus: order.fulfillmentStatus ?? 'unfulfilled',
    shipmentStatus: order.shipmentStatus ?? 'not_shipped',
    returnStatus: order.returnStatus ?? 'none',
  }
}

function normalizeShipmentForMember(order: any) {
  return {
    id: Number(order.id),
    orderExternalId: order.orderNumber ?? order.externalId ?? order.documentId,
    carrier: order.shippingCarrier ?? 'unassigned',
    trackingNumber: order.trackingNumber ?? '-',
    status: toUserFacingShipmentStatus(order),
    estimatedDeliveryAt: order.estimatedDeliveryAt ?? null,
    lastSyncedAt: order.webhookSyncedAt ?? order.updatedAt,
  }
}

function toInt(raw: unknown, fallback: number): number {
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(100, Math.round(value)))
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async myOrders(ctx) {
    try {
      const authUser = await verifyLogtoToken(ctx.request.headers.authorization)
      const pageSize = toInt(ctx.query.pageSize, 20)

      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          $or: [
            { userId: { $eq: authUser.userId } },
            { customerId: { $eq: authUser.userId } },
          ],
        },
        sort: ['orderedAt:desc', 'createdAt:desc'],
        limit: pageSize,
      })

      ctx.body = { data: orders.map(normalizeOrderForMember) }
    } catch (error) {
      strapi.log.error(`[order] myOrders failed: ${(error as Error).message}`)
      ctx.unauthorized('注文情報の取得にはログインが必要です。')
    }
  },

  async myShipments(ctx) {
    try {
      const authUser = await verifyLogtoToken(ctx.request.headers.authorization)
      const pageSize = toInt(ctx.query.pageSize, 20)

      const orders = await strapi.documents('api::order.order').findMany({
        filters: {
          $or: [
            { userId: { $eq: authUser.userId } },
            { customerId: { $eq: authUser.userId } },
          ],
        },
        sort: ['updatedAt:desc'],
        limit: pageSize,
      })

      ctx.body = { data: orders.map(normalizeShipmentForMember) }
    } catch (error) {
      strapi.log.error(`[order] myShipments failed: ${(error as Error).message}`)
      ctx.unauthorized('配送情報の取得にはログインが必要です。')
    }
  },

  async internalLookup(ctx) {
    try {
      await requireInternalPermission(ctx, 'internal.user.read')
      const rawQuery = String(ctx.query.query ?? '').trim()
      if (!rawQuery) return ctx.badRequest('query は必須です。')

      const filters = {
        $or: [
          { orderNumber: { $containsi: rawQuery } },
          { userId: { $eq: rawQuery } },
          { billingCustomerId: { $eq: rawQuery } },
          { customerId: { $eq: rawQuery } },
          { paymentIntentId: { $eq: rawQuery } },
          { checkoutSessionId: { $eq: rawQuery } },
          { email: { $eqi: rawQuery } },
        ],
      }

      const orders = await strapi.documents('api::order.order').findMany({ filters, sort: ['orderedAt:desc', 'createdAt:desc'], limit: 30 })
      ctx.body = {
        count: orders.length,
        items: orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber ?? order.externalId ?? order.documentId,
          userId: order.userId ?? null,
          billingCustomerId: order.billingCustomerId ?? order.customerId ?? null,
          email: order.email ?? null,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          shipmentStatus: order.shipmentStatus,
          returnStatus: order.returnStatus,
          refundStatus: order.refundStatus,
          totalAmount: order.totalAmount ?? order.amountTotal ?? 0,
          currency: order.currency ?? 'JPY',
          orderedAt: order.orderedAt ?? order.createdAt,
          syncState: order.syncState ?? 'unknown',
        })),
      }
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('Internal permission denied')) {
        return ctx.forbidden('internal order lookup の権限がありません。')
      }
      strapi.log.error(`[order] internalLookup failed: ${message}`)
      return ctx.internalServerError('注文検索に失敗しました。')
    }
  },
}))
