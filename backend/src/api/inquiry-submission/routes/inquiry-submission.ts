export default {
  routes: [
    {
      method: 'POST',
      path: '/inquiry-submissions/public',
      handler: 'inquiry-submission.publicSubmit',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/ops/summary',
      handler: 'inquiry-submission.opsSummary',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/ops/list',
      handler: 'inquiry-submission.opsList',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/ops/export.csv',
      handler: 'inquiry-submission.opsExportCsv',
      config: {
        auth: false,
      },
    },
    {
      method: 'PATCH',
      path: '/inquiry-submissions/ops/bulk-update',
      handler: 'inquiry-submission.opsBulkUpdate',
      config: {
        auth: false,
      },
    },
  ],
}
