import type Stripe from 'stripe'
import { getStripeClient } from './client'

function resolveRawBody(ctx: any): string | Buffer {
  const unparsed = ctx.request.body?.[Symbol.for('unparsedBody')]
  if (unparsed) return unparsed
  if (typeof ctx.request.rawBody === 'string') return ctx.request.rawBody
  if (Buffer.isBuffer(ctx.request.rawBody)) return ctx.request.rawBody
  throw new Error('Webhook署名検証のための raw body を取得できませんでした。')
}

export function parseStripeWebhookEvent(ctx: any): Stripe.Event {
  const signature = ctx.request.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    throw new Error('Stripe-Signature ヘッダーが不足しています。')
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET が未設定です。')
  }

  const rawBody = resolveRawBody(ctx)
  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret)
}
