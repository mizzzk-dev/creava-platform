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
    {
      method: 'GET',
      path: '/internal/bi/overview',
      handler: 'analytics-event.internalBiOverview',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/bi/cohorts',
      handler: 'analytics-event.internalBiCohorts',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/bi/export.csv',
      handler: 'analytics-event.internalBiExportCsv',
      config: { auth: false },
    },
  ],
}
