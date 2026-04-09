import { Link } from 'react-router-dom'
import type { CampaignSummary } from '@/modules/campaign/types'
import { toCampaignCountdown } from '@/modules/campaign/lib'
import { trackCtaClick } from '@/modules/analytics/tracking'

interface Props {
  campaign: CampaignSummary
  location: string
}

export default function CampaignHero({ campaign, location }: Props) {
  const countdown = toCampaignCountdown(campaign.endAt)
  const ctaHref = campaign.ctaLink || `/campaigns/${campaign.slug}`

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-gray-100 p-6 dark:border-violet-900/50 dark:from-violet-950/30 dark:via-gray-900 dark:to-gray-950 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{campaign.campaignLabel ?? campaign.campaignType}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">{campaign.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{campaign.heroCopy ?? campaign.shortHighlight ?? 'キャンペーンの詳細をご確認ください。'}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={ctaHref} onClick={() => trackCtaClick(location, 'campaign_cta_click', { slug: campaign.slug, type: campaign.campaignType })} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900">
          {campaign.ctaText ?? '特集を見る'}
        </Link>
        {campaign.bannerLink && (
          <Link to={campaign.bannerLink} onClick={() => trackCtaClick(location, 'campaign_banner_click', { slug: campaign.slug })} className="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
            関連導線へ
          </Link>
        )}
        {countdown && (
          <span className={`rounded-full border px-3 py-1 text-xs ${countdown.urgent ? 'border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300' : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}>
            {countdown.label}
          </span>
        )}
      </div>
    </section>
  )
}
