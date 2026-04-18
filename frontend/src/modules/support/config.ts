import type { FormDefinition } from '@/modules/contact/lib/formDefinitions'
import type { FaqCategory, SourceSite } from '@/types'

export interface SupportCategoryDef {
  key: FaqCategory
  labelKey: string
  site: SourceSite
  formTypes?: string[]
}

export const SUPPORT_CATEGORIES: SupportCategoryDef[] = [
  { key: 'general', labelKey: 'support.categories.mainGeneral', site: 'main', formTypes: ['contact'] },
  { key: 'site_usage', labelKey: 'support.categories.mainSiteUsage', site: 'main', formTypes: ['contact'] },
  { key: 'events', labelKey: 'support.categories.mainEvents', site: 'main', formTypes: ['event'] },
  { key: 'profile_activity', labelKey: 'support.categories.mainProfile', site: 'main', formTypes: ['request', 'collaboration'] },
  { key: 'news', labelKey: 'support.categories.mainNews', site: 'main', formTypes: ['contact'] },
  { key: 'contact_precheck', labelKey: 'support.categories.mainPrecheck', site: 'main', formTypes: ['contact', 'request', 'collaboration', 'event'] },

  { key: 'store_order', labelKey: 'support.categories.storeOrder', site: 'store', formTypes: ['store_support'] },
  { key: 'store_payment', labelKey: 'support.categories.storePayment', site: 'store', formTypes: ['store_support'] },
  { key: 'store_shipping', labelKey: 'support.categories.storeShipping', site: 'store', formTypes: ['store_support'] },
  { key: 'store_returns', labelKey: 'support.categories.storeReturns', site: 'store', formTypes: ['store_support'] },
  { key: 'store_digital', labelKey: 'support.categories.storeDigital', site: 'store', formTypes: ['store_support'] },
  { key: 'store_error', labelKey: 'support.categories.storeError', site: 'store', formTypes: ['store_support'] },
  { key: 'store_product', labelKey: 'support.categories.storeProduct', site: 'store', formTypes: ['store_support'] },
  { key: 'store_legal', labelKey: 'support.categories.storeLegal', site: 'store', formTypes: ['store_support'] },

  { key: 'fc_signup', labelKey: 'support.categories.fcSignup', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_login', labelKey: 'support.categories.fcLogin', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_payment', labelKey: 'support.categories.fcPayment', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_benefit', labelKey: 'support.categories.fcBenefit', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_content', labelKey: 'support.categories.fcContent', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_cancel', labelKey: 'support.categories.fcCancel', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_error', labelKey: 'support.categories.fcError', site: 'fc', formTypes: ['fc_support'] },
  { key: 'fc_members_only', labelKey: 'support.categories.fcMembersOnly', site: 'fc', formTypes: ['fc_support'] },
]

export const siteScopedCategories = (site: SourceSite): SupportCategoryDef[] => {
  if (site === 'all') return SUPPORT_CATEGORIES
  return SUPPORT_CATEGORIES.filter((category) => category.site === site || category.site === 'all')
}

export const resolveSiteByForm = (form?: FormDefinition): SourceSite => {
  if (!form) return 'all'
  if (form.sourceSite === 'all') return 'all'
  return form.sourceSite
}

export const normalizeSiteForFilter = (site: 'main' | 'store' | 'fanclub'): SourceSite => {
  if (site === 'fanclub') return 'fc'
  return site
}
