export default {
  routes: [
    {
      method: 'GET',
      path: '/orders/me',
      handler: 'order.myOrders',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/orders/me/shipments',
      handler: 'order.myShipments',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/orders/lookup',
      handler: 'order.internalLookup',
      config: { auth: false },
    },
  ],
}
