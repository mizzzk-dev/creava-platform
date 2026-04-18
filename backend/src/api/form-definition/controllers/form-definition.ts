import { factories } from '@strapi/strapi'
import { mergeWithDefaults } from '../../../utils/form-definitions'

export default factories.createCoreController('api::form-definition.form-definition', ({ strapi }) => ({
  async publicList(ctx) {
    const sourceSite = String(ctx.query.sourceSite ?? '').trim().toLowerCase()
    const locale = String(ctx.query.locale ?? '').trim().toLowerCase()

    const rows = await strapi.entityService.findMany('api::form-definition.form-definition', {
      fields: [
        'formType', 'formKey', 'formTitle', 'formDescription', 'sourceSite', 'isPublic', 'requiresAuth', 'fields', 'confirmEnabled',
        'attachmentEnabled', 'allowedMimeTypes', 'maxFiles', 'maxFileSize', 'notificationTarget', 'autoReplyEnabled',
        'successMessage', 'failureMessage', 'locale', 'displayPriority', 'isActive', 'defaultCategory', 'initialStatus', 'initialPriority',
      ],
      filters: {
        isActive: true,
        isPublic: true,
      },
      sort: ['displayPriority:asc'],
      publicationState: 'live',
      limit: 200,
    })

    const merged = mergeWithDefaults(rows as any[]).filter((row) => {
      const siteMatched = !sourceSite || row.sourceSite === 'all' || row.sourceSite === sourceSite
      const localeMatched = !locale || !Array.isArray(row.locale) || row.locale.length === 0 || row.locale.includes(locale)
      return siteMatched && localeMatched
    })

    ctx.body = { data: merged }
  },
}))
