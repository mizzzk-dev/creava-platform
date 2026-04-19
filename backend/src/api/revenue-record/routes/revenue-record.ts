export default {
  routes: [
    {
      method: 'GET',
      path: '/internal/revenue/summary',
      handler: 'revenue-record.internalSummary',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/revenue/records',
      handler: 'revenue-record.internalRecords',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/revenue/export.csv',
      handler: 'revenue-record.internalExportCsv',
      config: { auth: false },
    },
  ],
}
