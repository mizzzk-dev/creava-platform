export default {
  routes: [
    {
      method: 'POST',
      path: '/analytics-events/public',
      handler: 'analytics-event.publicTrack',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/analytics-events/ops/summary',
      handler: 'analytics-event.opsSummary',
      config: { auth: false },
    },
  ],
}
