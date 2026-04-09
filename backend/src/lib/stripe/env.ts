export type StripeCheckoutKind = 'store' | 'fanclub'

const requiredEnvNames = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CHECKOUT_SUCCESS_URL',
  'STRIPE_CHECKOUT_CANCEL_URL',
  'STRIPE_PORTAL_RETURN_URL',
] as const

export function assertStripeEnv(): void {
  const missing = requiredEnvNames.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(`Stripe環境変数が不足しています: ${missing.join(', ')}`)
  }
}

export function getCheckoutUrlByKind(kind: StripeCheckoutKind): { successUrl: string; cancelUrl: string } {
  if (kind === 'fanclub') {
    return {
      successUrl: process.env.STRIPE_FC_CHECKOUT_SUCCESS_URL ?? process.env.STRIPE_CHECKOUT_SUCCESS_URL!,
      cancelUrl: process.env.STRIPE_FC_CHECKOUT_CANCEL_URL ?? process.env.STRIPE_CHECKOUT_CANCEL_URL!,
    }
  }

  return {
    successUrl: process.env.STRIPE_STORE_CHECKOUT_SUCCESS_URL ?? process.env.STRIPE_CHECKOUT_SUCCESS_URL!,
    cancelUrl: process.env.STRIPE_STORE_CHECKOUT_CANCEL_URL ?? process.env.STRIPE_CHECKOUT_CANCEL_URL!,
  }
}

export function getPortalReturnUrl(): string {
  return process.env.STRIPE_PORTAL_RETURN_URL!
}
