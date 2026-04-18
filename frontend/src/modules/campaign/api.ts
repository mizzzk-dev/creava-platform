import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { fetchBySlug, fetchCollection } from '@/lib/api/strapi'
import type { StrapiListResponse } from '@/types'
import { StrapiApiError } from '@/lib/api/client'
import type { CampaignDetail, CampaignSummary, CampaignType } from './types'

const ENDPOINT = API_ENDPOINTS.campaigns

function normalizeCampaignType(value: unknown): CampaignType {
  if (value === 'drop' || value === 'launch' || value === 'restock' || value === 'benefit' || value === 'announcement') return value
  return 'feature'
}

function normalizeCampaign(item: Partial<CampaignSummary>): CampaignSummary {
  const targetSitesRaw = Array.isArray(item.targetSites) ? item.targetSites : []
  const targetLocalesRaw = Array.isArray(item.targetLocales) ? item.targetLocales : []
  return {
    id: Number(item.id ?? 0),
    documentId: String(item.documentId ?? ''),
    slug: String(item.slug ?? ''),
    campaignSlug: typeof item.campaignSlug === 'string' ? item.campaignSlug : null,
    title: String(item.title ?? ''),
    campaignLabel: typeof item.campaignLabel === 'string' ? item.campaignLabel : null,
    campaignType: normalizeCampaignType(item.campaignType),
    heroCopy: typeof item.heroCopy === 'string' ? item.heroCopy : null,
    shortHighlight: typeof item.shortHighlight === 'string' ? item.shortHighlight : null,
    featured: Boolean(item.featured),
    pickup: Boolean(item.pickup),
    membersOnly: Boolean(item.membersOnly),
    earlyAccess: Boolean(item.earlyAccess),
    specialOffer: typeof item.specialOffer === 'string' ? item.specialOffer : null,
    sectionStyle: typeof item.sectionStyle === 'string' ? item.sectionStyle : null,
    badgeStyleVariant: typeof item.badgeStyleVariant === 'string' ? item.badgeStyleVariant : null,
    startAt: typeof item.startAt === 'string' ? item.startAt : null,
    endAt: typeof item.endAt === 'string' ? item.endAt : null,
    bannerLink: typeof item.bannerLink === 'string' ? item.bannerLink : null,
    ctaText: typeof item.ctaText === 'string' ? item.ctaText : null,
    ctaLink: typeof item.ctaLink === 'string' ? item.ctaLink : null,
    displayPriority: typeof item.displayPriority === 'number' ? item.displayPriority : 0,
    audience: item.audience === 'logged_in' || item.audience === 'member' || item.audience === 'premium' ? item.audience : 'public',
    accessLevel: item.accessLevel === 'logged_in' || item.accessLevel === 'member' || item.accessLevel === 'premium' ? item.accessLevel : 'public',
    targetSites: targetSitesRaw.filter((site): site is 'main' | 'store' | 'fc' => site === 'main' || site === 'store' || site === 'fc'),
    targetLocales: targetLocalesRaw.filter((locale): locale is string => typeof locale === 'string'),
    retentionSegment: typeof item.retentionSegment === 'string' ? item.retentionSegment : null,
    heroVisual: item.heroVisual ?? null,
  }
}

export async function getCampaignList(): Promise<StrapiListResponse<CampaignSummary>> {
  try {
    const res = await fetchCollection<CampaignSummary>(ENDPOINT, {
      fields: ['title', 'slug', 'campaignSlug', 'campaignLabel', 'campaignType', 'heroCopy', 'shortHighlight', 'featured', 'pickup', 'membersOnly', 'earlyAccess', 'specialOffer', 'sectionStyle', 'badgeStyleVariant', 'startAt', 'endAt', 'bannerLink', 'ctaText', 'ctaLink', 'displayPriority', 'audience', 'accessLevel', 'targetSites', 'targetLocales', 'retentionSegment'],
      populate: {
        heroVisual: { fields: ['url', 'alternativeText'] },
      },
      sort: ['displayPriority:desc', 'startAt:desc'],
      pagination: { pageSize: 24, withCount: false },
    })

    return {
      ...res,
      data: res.data.map((item) => normalizeCampaign(item)).filter((item) => item.id > 0 && item.slug && item.title),
    }
  } catch (error) {
    if (error instanceof StrapiApiError && [0, 404, 408, 500, 502, 503].includes(error.status)) {
      return { data: [], meta: { pagination: { page: 1, pageSize: 24, pageCount: 1, total: 0 } } }
    }
    throw error
  }
}

export async function getCampaignBySlug(slug: string, signal?: AbortSignal): Promise<CampaignDetail | null> {
  try {
    const campaign = await fetchBySlug<CampaignDetail>(ENDPOINT, slug, {
      fields: ['title', 'slug', 'campaignSlug', 'campaignLabel', 'campaignType', 'heroCopy', 'shortHighlight', 'featured', 'pickup', 'membersOnly', 'earlyAccess', 'specialOffer', 'sectionStyle', 'badgeStyleVariant', 'startAt', 'endAt', 'bannerLink', 'ctaText', 'ctaLink', 'displayPriority', 'body', 'audience', 'accessLevel', 'targetSites', 'targetLocales', 'retentionSegment'],
      populate: {
        heroVisual: { fields: ['url', 'alternativeText'] },
      },
    }, { signal })

    if (!campaign) return null
    return {
      ...normalizeCampaign(campaign),
      body: typeof campaign.body === 'string' ? campaign.body : null,
    }
  } catch (error) {
    if (error instanceof StrapiApiError && [0, 404, 408, 500, 502, 503].includes(error.status)) {
      return null
    }
    throw error
  }
}
