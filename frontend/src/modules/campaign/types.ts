export type CampaignType = 'feature' | 'drop' | 'launch' | 'restock' | 'benefit' | 'announcement'

export interface CampaignSummary {
  id: number
  documentId: string
  slug: string
  campaignSlug: string | null
  title: string
  campaignLabel: string | null
  campaignType: CampaignType
  heroCopy: string | null
  shortHighlight: string | null
  featured: boolean
  pickup: boolean
  membersOnly: boolean
  earlyAccess: boolean
  specialOffer: string | null
  sectionStyle: string | null
  badgeStyleVariant: string | null
  startAt: string | null
  endAt: string | null
  bannerLink: string | null
  ctaText: string | null
  ctaLink: string | null
  displayPriority: number
  heroVisual: { url: string; alt: string | null } | null
}

export interface CampaignDetail extends CampaignSummary {
  body: string | null
}
