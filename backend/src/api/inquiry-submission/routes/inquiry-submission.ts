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
      path: '/inquiry-submissions/me/summary',
      handler: 'inquiry-submission.mySummary',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/me/history',
      handler: 'inquiry-submission.myHistory',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/me/:id',
      handler: 'inquiry-submission.myDetail',
      config: {
        auth: false,
      },
    },
    {
      method: 'PATCH',
      path: '/inquiry-submissions/me/:id/reopen',
      handler: 'inquiry-submission.reopenMyCase',
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
