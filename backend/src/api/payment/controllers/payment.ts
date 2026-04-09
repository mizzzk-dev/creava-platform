import { parseStripeWebhookEvent } from '../../../lib/stripe/webhook'
import {
  createFanclubCheckoutSession,
  createStoreCheckoutSession,
  createCustomerPortalSession,
} from '../services/payment'

function normalizeLocale(raw: unknown): string {
  if (raw === 'ja' || raw === 'en' || raw === 'ko') return raw
  return 'ja'
}

function normalizeQuantity(raw: unknown): number {
  const value = Number(raw ?? 1)
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(10, Math.round(value)))
}

export default ({ strapi }) => ({
  async createStoreCheckout(ctx) {
    try {
      const { productId, quantity, locale, userId } = ctx.request.body ?? {}
      if (!productId) return ctx.badRequest('productId は必須です。')

      const product = await strapi.documents('api::store-product.store-product').findOne({
        documentId: String(productId),
        status: 'published',
      })

      if (!product) return ctx.notFound('商品が見つかりません。')
      if (product.purchaseStatus !== 'available') return ctx.badRequest('購入可能状態ではありません。')
      if ((product.stock ?? 0) <= 0) return ctx.badRequest('在庫切れです。')
      if (product.isPurchasable === false) return ctx.badRequest('現在購入できません。')

      const session = await createStoreCheckoutSession({
        productDocumentId: product.documentId,
        productId: Number(product.id),
        title: product.title,
        currency: product.currency ?? 'JPY',
        unitAmount: Number(product.price ?? 0),
        quantity: normalizeQuantity(quantity),
        userId: typeof userId === 'string' && userId ? userId : null,
        locale: normalizeLocale(locale),
      })

      await strapi.documents('api::checkout-attempt.checkout-attempt').create({
        data: {
          checkoutType: 'store',
          provider: 'stripe',
          status: 'created',
          locale: normalizeLocale(locale),
          userId: typeof userId === 'string' && userId ? userId : null,
          idempotencyKey: `store:${product.documentId}:${normalizeQuantity(quantity)}:${userId ?? 'guest'}`,
          externalCheckoutSessionId: session.id,
          metadata: {
            productDocumentId: product.documentId,
            productId: product.id,
            quantity: normalizeQuantity(quantity),
          },
        },
      })

      ctx.body = { url: session.url, sessionId: session.id }
    } catch (error) {
      strapi.log.error(`[payment] createStoreCheckout failed: ${(error as Error).message}`)
      ctx.internalServerError('チェックアウト生成に失敗しました。')
    }
  },

  async createFanclubCheckout(ctx) {
    try {
      const { planId, locale, userId } = ctx.request.body ?? {}
      if (!planId) return ctx.badRequest('planId は必須です。')
      if (!userId || typeof userId !== 'string') return ctx.unauthorized('userId は必須です。')

      const plan = await strapi.documents('api::membership-plan.membership-plan').findOne({
        documentId: String(planId),
        status: 'published',
      })
      if (!plan) return ctx.notFound('プランが見つかりません。')
      if (!plan.stripePriceId) return ctx.badRequest('プランの Stripe price ID が未設定です。')
      if (plan.isJoinable === false) return ctx.badRequest('現在加入できません。')

      const session = await createFanclubCheckoutSession({
        planDocumentId: plan.documentId,
        planId: Number(plan.id),
        planName: plan.name,
        stripePriceId: plan.stripePriceId,
        userId,
        locale: normalizeLocale(locale),
      })

      await strapi.documents('api::checkout-attempt.checkout-attempt').create({
        data: {
          checkoutType: 'fanclub',
          provider: 'stripe',
          status: 'created',
          locale: normalizeLocale(locale),
          userId,
          idempotencyKey: `fanclub:${plan.documentId}:${userId}`,
          externalCheckoutSessionId: session.id,
          metadata: {
            planDocumentId: plan.documentId,
            planId: plan.id,
            planName: plan.name,
          },
        },
      })

      ctx.body = { url: session.url, sessionId: session.id }
    } catch (error) {
      strapi.log.error(`[payment] createFanclubCheckout failed: ${(error as Error).message}`)
      ctx.internalServerError('ファンクラブ決済セッション生成に失敗しました。')
    }
  },

  async createPortalSession(ctx) {
    try {
      const { customerId } = ctx.request.body ?? {}
      if (!customerId || typeof customerId !== 'string') {
        return ctx.badRequest('customerId は必須です。')
      }

      const session = await createCustomerPortalSession(customerId)
      ctx.body = { url: session.url }
    } catch (error) {
      strapi.log.error(`[payment] createPortalSession failed: ${(error as Error).message}`)
      ctx.internalServerError('ポータルセッション生成に失敗しました。')
    }
  },

  async stripeWebhook(ctx) {
    try {
      const event = parseStripeWebhookEvent(ctx)

      const alreadyHandled = await strapi.documents('api::webhook-event-log.webhook-event-log').findFirst({
        filters: { provider: { $eq: 'stripe' }, eventId: { $eq: event.id } },
      })
      if (alreadyHandled) {
        ctx.body = { received: true, duplicated: true }
        return
      }

      const webhookLog = await strapi.documents('api::webhook-event-log.webhook-event-log').create({
        data: {
          provider: 'stripe',
          eventId: event.id,
          eventType: event.type,
          livemode: Boolean(event.livemode),
          status: 'received',
          payload: event,
          processedAt: new Date().toISOString(),
        },
      })

      const object = event.data.object as Record<string, unknown>

      if (event.type === 'checkout.session.completed') {
        await strapi.documents('api::payment-record.payment-record').create({
          data: {
            provider: 'stripe',
            paymentStatus: 'succeeded',
            checkoutSessionId: String(object.id ?? ''),
            customerId: typeof object.customer === 'string' ? object.customer : null,
            paymentIntentId: typeof object.payment_intent === 'string' ? object.payment_intent : null,
            amountTotal: Number(object.amount_total ?? 0),
            currency: typeof object.currency === 'string' ? object.currency.toUpperCase() : 'JPY',
            metadata: (object.metadata as Record<string, unknown>) ?? {},
          },
        })
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const metadata = (object.metadata as Record<string, unknown>) ?? {}
        await strapi.documents('api::subscription-record.subscription-record').create({
          data: {
            provider: 'stripe',
            customerId: typeof object.customer === 'string' ? object.customer : null,
            subscriptionId: typeof object.id === 'string' ? object.id : null,
            subscriptionStatus: typeof object.status === 'string' ? object.status : 'incomplete',
            membershipType: typeof metadata.membershipType === 'string' ? metadata.membershipType : 'paid',
            accessLevel: typeof metadata.accessLevel === 'string' ? metadata.accessLevel : 'paid',
            billingCycle: typeof metadata.billingCycle === 'string' ? metadata.billingCycle : 'monthly',
            metadata,
          },
        })
      }

      await strapi.documents('api::webhook-event-log.webhook-event-log').update({
        documentId: webhookLog.documentId,
        data: {
          status: 'processed',
        },
      })

      ctx.body = { received: true }
    } catch (error) {
      strapi.log.error(`[payment] stripeWebhook failed: ${(error as Error).message}`)
      ctx.status = 400
      ctx.body = { error: { message: 'Webhook 処理に失敗しました。' } }
    }
  },
})
