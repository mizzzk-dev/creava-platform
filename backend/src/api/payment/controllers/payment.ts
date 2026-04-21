import { hasRequiredScopes, verifyAccessToken, type AuthenticatedUser } from '../../../lib/auth/provider'
import { parseStripeWebhookEvent } from '../../../lib/stripe/webhook'
import { normalizeStripeSubscriptionState } from '../../../lib/billing/subscription-state'
import { upsertRevenueRecord } from '../../../lib/finance/revenue'
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
    return await verifyAccessToken(ctx.request.headers.authorization)
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

function toPlanAccessLevel(raw: unknown): 'member' | 'premium' {
  return raw === 'premium' ? 'premium' : 'member'
}

async function syncAppUserMembership(strapi: any, authUserId: string | null, input: {
  membershipStatus: 'guest' | 'active' | 'grace_period' | 'paused' | 'cancelled'
  accessLevel: 'public' | 'logged_in' | 'member' | 'premium' | 'admin'
  membershipPlan: 'free' | 'standard' | 'premium'
}) {
  if (!authUserId) return

  const appUser = await strapi.documents('api::app-user.app-user').findFirst({
    filters: { logtoUserId: { $eq: authUserId } },
  })

  if (!appUser) return

  await strapi.documents('api::app-user.app-user').update({
    documentId: appUser.documentId,
    data: {
      membershipStatus: input.membershipStatus,
      membershipPlan: input.membershipPlan,
      accessLevel: appUser.accessLevel === 'admin' ? 'admin' : input.accessLevel,
      loyaltyState: input.membershipStatus === 'active' ? 'member_active' : appUser.loyaltyState,
      lastSyncedAt: new Date().toISOString(),
    },
  })
}



function toOrderNumber(sessionId: string): string {
  return `MZ-${sessionId.replace('cs_', '').slice(0, 12).toUpperCase()}`
}

function toIsoDateFromUnix(raw: unknown): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return new Date(raw * 1000).toISOString()
  }
  return new Date().toISOString()
}

async function commitInventoryForStoreOrder(strapi: any, metadata: Record<string, unknown>): Promise<{ status: string; reason?: string | null }> {
  const productDocumentId = typeof metadata.productDocumentId === 'string' ? metadata.productDocumentId : null
  const quantity = Number(metadata.quantity ?? 1)
  if (!productDocumentId || !Number.isFinite(quantity) || quantity <= 0) {
    return { status: 'none', reason: 'missing_product_or_quantity' }
  }

  const product = await strapi.documents('api::store-product.store-product').findOne({ documentId: productDocumentId, status: 'published' })
  if (!product) {
    return { status: 'failed', reason: 'product_not_found' }
  }

  const currentStock = Number(product.stock ?? 0)
  if (currentStock < quantity) {
    return { status: 'failed', reason: 'insufficient_stock' }
  }

  const nextStock = Math.max(0, currentStock - quantity)
  await strapi.documents('api::store-product.store-product').update({
    documentId: product.documentId,
    data: {
      stock: nextStock,
      stockStatus: nextStock <= 0 ? 'out_of_stock' : nextStock <= 5 ? 'low_stock' : 'in_stock',
    },
    status: 'published',
  })

  return { status: 'committed' }
}

async function upsertStoreOrderFromCheckout(strapi: any, input: {
  sessionObject: Record<string, unknown>
  metadata: Record<string, unknown>
  authUserId: string | null
  webhookEventId: string
}): Promise<void> {
  const sessionId = typeof input.sessionObject.id === 'string' ? input.sessionObject.id : ''
  if (!sessionId) return

  const existingOrder = await strapi.documents('api::order.order').findFirst({
    filters: { checkoutSessionId: { $eq: sessionId } },
  })

  const now = new Date().toISOString()
  const quantity = Number(input.metadata.quantity ?? 1)
  const lineItems = [
    {
      productDocumentId: input.metadata.productDocumentId ?? null,
      productId: input.metadata.productId ?? null,
      title: typeof input.metadata.productTitle === 'string' ? input.metadata.productTitle : 'store item',
      quantity: Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1,
      itemType: 'physical',
      unitPrice: Number(input.sessionObject.amount_total ?? 0),
    },
  ]

  const inventoryResult: { status: string; reason?: string | null } = existingOrder
    ? { status: existingOrder.inventoryCommitState ?? 'none', reason: null }
    : await commitInventoryForStoreOrder(strapi, input.metadata)

  const orderPayload = {
    provider: 'stripe',
    sourceSite: 'store',
    orderNumber: existingOrder?.orderNumber ?? toOrderNumber(sessionId),
    orderStatus: inventoryResult.status === 'failed' ? 'exception' : 'confirmed',
    paymentStatus: 'paid',
    fulfillmentStatus: inventoryResult.status === 'failed' ? 'failed' : 'preparing',
    shipmentStatus: 'not_shipped',
    returnStatus: 'none',
    refundStatus: 'none',
    inventoryReservationState: 'none',
    inventoryCommitState: inventoryResult.status === 'committed' ? 'committed' : inventoryResult.status === 'failed' ? 'rolled_back' : 'none',
    userId: input.authUserId,
    billingCustomerId: typeof input.sessionObject.customer === 'string' ? input.sessionObject.customer : null,
    customerId: typeof input.sessionObject.customer === 'string' ? input.sessionObject.customer : null,
    email: typeof input.sessionObject.customer_details === 'object' && input.sessionObject.customer_details && typeof (input.sessionObject.customer_details as any).email === 'string'
      ? (input.sessionObject.customer_details as any).email
      : null,
    checkoutSessionId: sessionId,
    paymentIntentId: typeof input.sessionObject.payment_intent === 'string' ? input.sessionObject.payment_intent : null,
    currency: typeof input.sessionObject.currency === 'string' ? input.sessionObject.currency.toUpperCase() : 'JPY',
    amountTotal: Number(input.sessionObject.amount_total ?? 0),
    subtotal: Number(input.sessionObject.amount_subtotal ?? 0),
    totalAmount: Number(input.sessionObject.amount_total ?? 0),
    lineItems,
    fulfillmentMethod: 'shipping',
    locale: typeof input.metadata.locale === 'string' ? input.metadata.locale : 'ja',
    syncState: inventoryResult.status === 'failed' ? 'needs_manual_review' : 'in_sync',
    auditMetadata: {
      sourceOfTruth: 'stripe_webhook',
      lastWebhookEventId: input.webhookEventId,
      inventoryReason: inventoryResult.reason ?? null,
    },
    metadata: input.metadata,
    orderedAt: now,
    paidAt: now,
    webhookSyncedAt: now,
  }

  if (existingOrder?.documentId) {
    await strapi.documents('api::order.order').update({
      documentId: existingOrder.documentId,
      data: {
        ...orderPayload,
        syncVersion: Number(existingOrder.syncVersion ?? 1) + 1,
      },
    })
    return
  }

  await strapi.documents('api::order.order').create({ data: orderPayload })
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
    let webhookLog: any = null
    try {
      const event = parseStripeWebhookEvent(ctx)

      const alreadyHandled = await strapi.documents('api::webhook-event-log.webhook-event-log').findFirst({
        filters: { provider: { $eq: 'stripe' }, eventId: { $eq: event.id } },
      })
      if (alreadyHandled) {
        ctx.body = { received: true, duplicated: true }
        return
      }

      webhookLog = await strapi.documents('api::webhook-event-log.webhook-event-log').create({
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
        const amountTotal = Number(object.amount_total ?? 0)
        const amountSubtotal = Number(object.amount_subtotal ?? amountTotal)
        const amountTax = Number(object.total_details && typeof object.total_details === 'object' ? (object.total_details as Record<string, unknown>).amount_tax ?? 0 : 0)
        const amountDiscount = Number(object.total_details && typeof object.total_details === 'object' ? (object.total_details as Record<string, unknown>).amount_discount ?? 0 : 0)
        const currency = typeof object.currency === 'string' ? object.currency.toUpperCase() : 'JPY'
        const checkoutKind = metadata.checkoutKind === 'fanclub' ? 'fanclub' : 'store'
        const sourceSite = checkoutKind === 'fanclub' ? 'fc' : 'store'

        await strapi.documents('api::payment-record.payment-record').create({
          data: {
            provider: 'stripe',
            paymentStatus: 'succeeded',
            checkoutSessionId: String(object.id ?? ''),
            customerId: typeof object.customer === 'string' ? object.customer : null,
            authUserId,
            clerkUserId: authUserId,
            paymentIntentId: typeof object.payment_intent === 'string' ? object.payment_intent : null,
            amountTotal,
            currency,
            metadata,
          },
        })

        await upsertRevenueRecord(strapi, {
          eventIdempotencyKey: `stripe:${event.id}:${String(object.id ?? '')}:checkout-completed`,
          revenueType: checkoutKind === 'fanclub' ? 'fc_subscription' : 'store_order',
          revenueSource: checkoutKind,
          revenueStatus: 'recognized',
          financialEventType: event.type,
          financialEventAt: new Date().toISOString(),
          sourceSite,
          grossAmount: amountTotal,
          netAmount: amountTotal,
          discountAmount: amountDiscount,
          shippingFee: Number(metadata.shippingFee ?? 0),
          taxAmount: amountTax,
          refundAmount: 0,
          partialRefundAmount: 0,
          currency,
          orderId: checkoutKind === 'store' ? String(object.id ?? '') : null,
          subscriptionId: checkoutKind === 'fanclub' ? String(object.subscription ?? '') : null,
          paymentId: typeof object.payment_intent === 'string' ? object.payment_intent : null,
          userId: authUserId,
          campaignId: typeof metadata.campaignId === 'string' ? metadata.campaignId : null,
          couponId: typeof metadata.couponId === 'string' ? metadata.couponId : null,
          loyaltyImpactState: typeof metadata.loyaltyImpactState === 'string' ? metadata.loyaltyImpactState : null,
          metadata,
        })

        if (metadata.checkoutKind === 'store') {
          await upsertStoreOrderFromCheckout(strapi, {
            sessionObject: object,
            metadata,
            authUserId,
            webhookEventId: event.id,
          })
        }
      }

      if (event.type === 'charge.refunded') {
        const amountRefunded = Number(object.amount_refunded ?? 0)
        const amountCharged = Number(object.amount ?? 0)
        const isPartialRefund = amountRefunded > 0 && amountRefunded < amountCharged
        const paymentIntentId = typeof object.payment_intent === 'string' ? object.payment_intent : null
        const currency = typeof object.currency === 'string' ? object.currency.toUpperCase() : 'JPY'

        if (paymentIntentId) {
          const targetOrders = await strapi.documents('api::order.order').findMany({
            filters: { paymentIntentId: { $eq: paymentIntentId } },
            limit: 5,
            sort: ['createdAt:desc'],
          })

          for (const order of targetOrders) {
            await strapi.documents('api::order.order').update({
              documentId: order.documentId,
              data: {
                paymentStatus: isPartialRefund ? 'partially_refunded' : 'refunded',
                refundStatus: isPartialRefund ? 'partially_refunded' : 'refunded',
                returnStatus: order.returnStatus === 'none' ? order.returnStatus : 'refunded',
                syncState: 'in_sync',
                webhookSyncedAt: new Date().toISOString(),
                metadata: {
                  ...(order.metadata ?? {}),
                  latestRefundEventId: event.id,
                  latestRefundId: String(object.id ?? ''),
                },
              },
            })
          }
        }

        await upsertRevenueRecord(strapi, {
          eventIdempotencyKey: `stripe:${event.id}:${String(object.id ?? '')}:charge-refunded`,
          revenueType: isPartialRefund ? 'partial_refund' : 'refund',
          revenueSource: 'store',
          revenueStatus: 'reversed',
          financialEventType: event.type,
          financialEventAt: toIsoDateFromUnix(object.created),
          sourceSite: 'store',
          grossAmount: 0,
          netAmount: -Math.abs(amountRefunded),
          refundAmount: isPartialRefund ? 0 : Math.abs(amountRefunded),
          partialRefundAmount: isPartialRefund ? Math.abs(amountRefunded) : 0,
          currency,
          paymentId: paymentIntentId,
          refundId: String(object.id ?? ''),
          userId: authUserId,
          metadata,
        })
      }

      if (event.type === 'invoice.payment_failed') {
        const subscriptionId = typeof object.subscription === 'string' ? object.subscription : null
        const amountDue = Number(object.amount_due ?? 0)
        const currency = typeof object.currency === 'string' ? object.currency.toUpperCase() : 'JPY'
        await upsertRevenueRecord(strapi, {
          eventIdempotencyKey: `stripe:${event.id}:${String(object.id ?? '')}:invoice-payment-failed`,
          revenueType: 'fc_subscription',
          revenueSource: 'fanclub',
          revenueStatus: 'failed',
          financialEventType: event.type,
          financialEventAt: toIsoDateFromUnix(object.created),
          sourceSite: 'fc',
          grossAmount: amountDue,
          netAmount: 0,
          currency,
          subscriptionId,
          paymentId: typeof object.payment_intent === 'string' ? object.payment_intent : null,
          userId: authUserId,
          metadata,
        })
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const planAccessLevel = toPlanAccessLevel(metadata.accessLevel)
        const normalized = normalizeStripeSubscriptionState(object, planAccessLevel)
        const subscriptionId = typeof object.id === 'string' ? object.id : null
        const filters: Record<string, unknown> = { provider: { $eq: 'stripe' } }
        if (subscriptionId) filters.subscriptionId = { $eq: subscriptionId }

        const lastRecord = await strapi.documents('api::subscription-record.subscription-record').findFirst({
          filters,
          sort: ['createdAt:desc'],
        })

        const payload = {
          provider: 'stripe',
          authUserId,
          clerkUserId: authUserId,
          customerId: typeof object.customer === 'string' ? object.customer : null,
          subscriptionId,
          subscriptionPlan: typeof metadata.subscriptionPlan === 'string' ? metadata.subscriptionPlan : null,
          subscriptionStatus: normalized.subscriptionStatus,
          billingStatus: normalized.billingStatus,
          entitlementState: normalized.entitlementState,
          entitlementSet: {
            fanclub_core: normalized.entitlementState !== 'inactive',
            fanclub_limited: normalized.entitlementState === 'active',
          },
          membershipType: planAccessLevel === 'premium' ? 'premium' : 'paid',
          accessLevel: planAccessLevel,
          billingCycle: typeof metadata.billingCycle === 'string' ? metadata.billingCycle : 'monthly',
          currentPeriodStart: normalized.currentPeriodStart,
          currentPeriodEnd: normalized.currentPeriodEnd,
          startAt: normalized.currentPeriodStart,
          endAt: normalized.currentPeriodEnd,
          cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
          canceledAt: normalized.canceledAt,
          trialState: normalized.subscriptionStatus === 'trialing' ? 'active' : 'none',
          gracePeriodState: normalized.gracePeriodState,
          syncState: 'in_sync',
          sourceOfTruth: 'stripe_webhook',
          syncVersion: Number(lastRecord?.syncVersion ?? 0) + 1,
          lastBillingEventAt: new Date().toISOString(),
          metadata,
        }

        if (lastRecord?.documentId) {
          await strapi.documents('api::subscription-record.subscription-record').update({
            documentId: lastRecord.documentId,
            data: payload,
          })
        } else {
          await strapi.documents('api::subscription-record.subscription-record').create({ data: payload })
        }

        if (authUserId) {
          const existingEntitlement = await strapi.documents('api::entitlement-record.entitlement-record').findFirst({
            filters: {
              authUserId: { $eq: authUserId },
              billingProvider: { $eq: 'stripe' },
              ...(subscriptionId ? { subscriptionId: { $eq: subscriptionId } } : {}),
            },
            sort: ['createdAt:desc'],
          })

          const entitlementPayload = {
            authUserId,
            billingProvider: 'stripe',
            subscriptionId,
            subscriptionPlan: typeof metadata.subscriptionPlan === 'string' ? metadata.subscriptionPlan : null,
            entitlementState: normalized.entitlementState,
            entitlementSet: {
              fanclub_core: normalized.entitlementState !== 'inactive',
              fanclub_limited: normalized.entitlementState === 'active',
            },
            accessLevel: normalized.accessLevel,
            membershipStatus: normalized.membershipStatus,
            campaignEligibility: {
              lifecycle: normalized.membershipStatus,
              billingStatus: normalized.billingStatus,
            },
            earlyAccessEligibility: normalized.entitlementState === 'active',
            sourceOfTruth: 'stripe_webhook',
            syncState: 'in_sync',
            syncVersion: Number(existingEntitlement?.syncVersion ?? 0) + 1,
            lastBillingEventAt: new Date().toISOString(),
            currentPeriodStart: normalized.currentPeriodStart,
            currentPeriodEnd: normalized.currentPeriodEnd,
            renewalDate: normalized.renewalDate,
            metadata,
          }

          if (existingEntitlement?.documentId) {
            await strapi.documents('api::entitlement-record.entitlement-record').update({
              documentId: existingEntitlement.documentId,
              data: entitlementPayload,
            })
          } else {
            await strapi.documents('api::entitlement-record.entitlement-record').create({ data: entitlementPayload })
          }
        }

        await syncAppUserMembership(strapi, authUserId, {
          membershipStatus: normalized.membershipStatus,
          accessLevel: normalized.accessLevel,
          membershipPlan: planAccessLevel === 'premium' ? 'premium' : 'standard',
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
      const message = (error as Error).message
      strapi.log.error(`[payment] stripeWebhook failed: ${message}`)
      if (webhookLog?.documentId) {
        await strapi.documents('api::webhook-event-log.webhook-event-log').update({
          documentId: webhookLog.documentId,
          data: {
            status: 'failed',
            errorMessage: message,
          },
        })
      }
      ctx.status = 400
      ctx.body = { error: { message: 'Webhook 処理に失敗しました。' } }
    }
  },
})
