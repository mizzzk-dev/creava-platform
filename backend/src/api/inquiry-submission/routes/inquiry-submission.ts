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
      path: '/inquiry-submissions/public/track',
      handler: 'inquiry-submission.publicTrack',
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
      method: 'POST',
      path: '/inquiry-submissions/me/:id/replies',
      handler: 'inquiry-submission.postMyReply',
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
      path: '/inquiry-submissions/ops/queue',
      handler: 'inquiry-submission.opsQueue',
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
    {
      method: 'GET',
      path: '/inquiry-submissions/ops/:id/messages',
      handler: 'inquiry-submission.opsCaseMessages',
      config: {
        auth: false,
      },
    },
    {
      method: 'PATCH',
      path: '/inquiry-submissions/ops/:id',
      handler: 'inquiry-submission.opsCaseUpdate',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inquiry-submissions/ops/:id/template-suggestions',
      handler: 'inquiry-submission.opsTemplateSuggestions',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inquiry-submissions/ops/:id/reply',
      handler: 'inquiry-submission.opsReply',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inquiry-submissions/ops/:id/internal-note',
      handler: 'inquiry-submission.opsInternalNote',
      config: {
        auth: false,
      },
    },
  ],
}
