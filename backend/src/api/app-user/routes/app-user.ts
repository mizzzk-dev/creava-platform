export default {
  routes: [
    {
      method: 'POST',
      path: '/user-sync/provision',
      handler: 'app-user.provision',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/user-sync/me',
      handler: 'app-user.me',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/user-sync/support/lookup',
      handler: 'app-user.supportLookup',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/users/lookup',
      handler: 'app-user.internalLookup',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/users/:authUserId/summary',
      handler: 'app-user.internalSummary',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/internal/users/:logtoUserId/summary',
      handler: 'app-user.internalSummary',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/users/:authUserId/account-status',
      handler: 'app-user.updateAccountStatus',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/users/:logtoUserId/account-status',
      handler: 'app-user.updateAccountStatus',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/users/:authUserId/notification-reset',
      handler: 'app-user.resetNotificationPreference',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/internal/users/:logtoUserId/notification-reset',
      handler: 'app-user.resetNotificationPreference',
      config: { auth: false },
    },
  ],
}
