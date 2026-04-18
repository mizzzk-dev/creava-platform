import { factories } from '@strapi/strapi'

const defaultRouter = factories.createCoreRouter('api::form-definition.form-definition')

const publicRoutes = [
  {
    method: 'GET',
    path: '/form-definitions/public',
    handler: 'form-definition.publicList',
    config: {
      auth: false,
    },
  },
]

export default {
  get prefix() {
    return (defaultRouter as any).prefix
  },
  get routes() {
    return [
      ...((defaultRouter as any).routes ?? []),
      ...publicRoutes,
    ]
  },
}
