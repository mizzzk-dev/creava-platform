import { hasRequiredScopes, verifyLogtoToken, type AuthenticatedUser } from '../../../lib/auth/logto'
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

function parseStripeMetadata(object: Record<string, unknown>): Record<string, unknown> {
  return (object.metadata as Record<string, unknown>) ?? {}
}

async function requireAuthenticatedUser(ctx: any): Promise<AuthenticatedUser> {
  try {
    return await verifyLogtoToken(ctx.request.headers.authorization)
  } catch (error) {
    throw new Error(`本人認証に失敗しました: ${(error as Error).message}`)
  }
}

function requireScopes(user: AuthenticatedUser, requiredScopes: string[], actionLabel: string): void {
  if (hasRequiredScopes(user.scopes, requiredScopes)) return
  throw new Error(`権限不足です: ${actionLabel} には ${requiredScopes.join(', ')} scope が必要です。`)
}

function toAuthUserId(metadata: Record<string, unknown>): string | null {
  const userId = metadata.authUserId ?? metadata.userId ?? metadata.clerkUserId
  return typeof userId === 'string' && userId && userId !== 'guest' ? userId : null
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
      const { planId, locale } = ctx.request.body ?? {}
      if (!planId) return ctx.badRequest('planId は必須です。')

      const authUser = await requireAuthenticatedUser(ctx)
      requireScopes(authUser, ['fanclub:checkout'], 'fanclub checkout')

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
        userId: authUser.userId,
        userEmail: authUser.email,
        locale: normalizeLocale(locale),
      })

      await strapi.documents('api::checkout-attempt.checkout-attempt').create({
        data: {
          checkoutType: 'fanclub',
          provider: 'stripe',
          status: 'created',
          locale: normalizeLocale(locale),
          userId: authUser.userId,
          idempotencyKey: `fanclub:${plan.documentId}:${authUser.userId}`,
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
      const message = (error as Error).message
      strapi.log.error(`[payment] createFanclubCheckout failed: ${message}`)
      if (message.includes('本人認証')) return ctx.unauthorized(message)
      if (message.includes('権限不足')) return ctx.forbidden(message)
      ctx.internalServerError('ファンクラブ決済セッション生成に失敗しました。')
    }
  },

  async createPortalSession(ctx) {
    try {
      const authUser = await requireAuthenticatedUser(ctx)
      requireScopes(authUser, ['fanclub:portal'], 'customer portal')

      const latestSubscription = await strapi.documents('api::subscription-record.subscription-record').findFirst({
        filters: {
          provider: { $eq: 'stripe' },
          $or: [
            { authUserId: { $eq: authUser.userId } },
            { clerkUserId: { $eq: authUser.userId } },
          ],
          customerId: { $notNull: true },
        },
        sort: ['createdAt:desc'],
      })

      if (!latestSubscription?.customerId) {
        return ctx.badRequest('customerId が未紐付けです。Webhook 同期完了後に再試行してください。')
      }

      const session = await createCustomerPortalSession(latestSubscription.customerId)
      ctx.body = { url: session.url }
    } catch (error) {
      const message = (error as Error).message
      strapi.log.error(`[payment] createPortalSession failed: ${message}`)
      if (message.includes('本人認証')) return ctx.unauthorized(message)
      if (message.includes('権限不足')) return ctx.forbidden(message)
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

      const object = event.data.object as unknown as Record<string, unknown>
      const metadata = parseStripeMetadata(object)
      const authUserId = toAuthUserId(metadata)

      if (event.type === 'checkout.session.completed') {
        await strapi.documents('api::payment-record.payment-record').create({
          data: {
            provider: 'stripe',
            paymentStatus: 'succeeded',
            checkoutSessionId: String(object.id ?? ''),
            customerId: typeof object.customer === 'string' ? object.customer : null,
            authUserId,
            clerkUserId: authUserId,
            paymentIntentId: typeof object.payment_intent === 'string' ? object.payment_intent : null,
            amountTotal: Number(object.amount_total ?? 0),
            currency: typeof object.currency === 'string' ? object.currency.toUpperCase() : 'JPY',
            metadata,
          },
        })
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        await strapi.documents('api::subscription-record.subscription-record').create({
          data: {
            provider: 'stripe',
            authUserId,
            clerkUserId: authUserId,
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
