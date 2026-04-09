export default {
  routes: [
    {
      method: 'POST',
      path: '/payments/store/checkout-session',
      handler: 'payment.createStoreCheckout',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/payments/fanclub/checkout-session',
      handler: 'payment.createFanclubCheckout',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/payments/customer-portal/session',
      handler: 'payment.createPortalSession',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/payments/stripe/webhook',
      handler: 'payment.stripeWebhook',
      config: {
        auth: false,
      },
    },
  ],
}
