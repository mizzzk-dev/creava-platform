import { factories } from '@strapi/strapi'

const defaultRouter = factories.createCoreRouter('api::form-definition.form-definition')

export default {
  ...defaultRouter,
  routes: [
    ...(defaultRouter as any).routes,
    {
      method: 'GET',
      path: '/form-definitions/public',
      handler: 'form-definition.publicList',
      config: {
        auth: false,
      },
    },
  ],
}
