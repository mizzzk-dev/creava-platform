import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function getStripeApiVersion(): Stripe.LatestApiVersion {
  return '2025-03-31.basil'
}

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY が設定されていません。')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: getStripeApiVersion(),
      appInfo: {
        name: 'creava-platform',
        version: '1.0.0',
      },
      typescript: true,
    })
  }

  return stripeClient
}

export function getStripeMode(): 'test' | 'live' {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? ''
  return secretKey.startsWith('sk_live_') ? 'live' : 'test'
}
