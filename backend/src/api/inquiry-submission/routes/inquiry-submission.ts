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
  ],
}
