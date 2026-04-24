export default {
  routes: [
    {
      method: 'POST',
      path: '/cms-sync/strapi-webhook',
      handler: 'cms-sync.strapiWebhook',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/cms-sync/preview/verify',
      handler: 'cms-sync.verifyPreview',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/cms-sync/revalidate',
      handler: 'cms-sync.manualRevalidate',
      config: {
        auth: false,
      },
    },
  ],
}
