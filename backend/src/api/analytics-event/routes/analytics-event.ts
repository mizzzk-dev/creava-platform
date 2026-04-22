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
    {
      method: 'GET',
      path: '/internal/bi/alerts',
      handler: 'analytics-event.internalBiAlerts',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/bi/report',
      handler: 'analytics-event.internalBiReport',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/automation/playbooks',
      handler: 'analytics-event.internalAutomationPlaybooks',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/operations/dashboard',
      handler: 'analytics-event.internalOperationsDashboard',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/operations/safe-action',
      handler: 'analytics-event.internalOperationsSafeAction',
      config: { auth: false },
    },

    {
      method: 'POST',
      path: '/internal/operations/scheduled-checks/run',
      handler: 'analytics-event.internalScheduledChecksRun',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/incidents/dashboard',
      handler: 'analytics-event.internalIncidentDashboard',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/incidents/triage',
      handler: 'analytics-event.internalIncidentTriageAction',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/operations/approval',
      handler: 'analytics-event.internalApprovalAction',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/operations/batch',
      handler: 'analytics-event.internalBatchOperationAction',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/automation/runs',
      handler: 'analytics-event.internalAutomationRuns',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/automation/run',
      handler: 'analytics-event.internalAutomationRun',
      config: { auth: false },
    },
  ],
}
