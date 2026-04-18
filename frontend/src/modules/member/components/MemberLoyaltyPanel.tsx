import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CampaignSummary } from '@/modules/campaign/types'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import { ROUTES } from '@/lib/routeConstants'
import type { LoyaltyProfile } from '../types'

interface Props {
  profile: LoyaltyProfile
  campaigns: CampaignSummary[]
}

const STATUS_TONE: Record<LoyaltyProfile['membershipStatus'], string> = {
  guest: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  grace_period: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  paused: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export default function MemberLoyaltyPanel({ profile, campaigns }: Props) {
  const { t } = useTranslation()

  const shortcuts = useMemo(() => [
    { key: 'member.loyaltyShortcutEarly', to: ROUTES.FANCLUB, event: 'early_access_click' },
    { key: 'member.loyaltyShortcutLimited', to: ROUTES.FANCLUB, event: 'limited_content_click' },
    { key: 'member.loyaltyShortcutStore', to: ROUTES.STORE, event: 'fc_to_store_loyalty_click' },
    { key: 'member.loyaltyShortcutSupport', to: ROUTES.SUPPORT_CENTER, event: 'support_to_membership_click' },
  ], [])

  return (
    <section className="rounded border border-violet-200/70 bg-violet-50/50 p-5 dark:border-violet-900/60 dark:bg-violet-950/20" aria-label={t('member.loyaltyTitle', { defaultValue: 'ロイヤルティステータス' })}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-violet-500">loyalty / retention</p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('member.loyaltyTitle', { defaultValue: '継続ステータスと会員価値' })}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('member.loyaltyLead', { defaultValue: '継続状況と利用可能な特典をまとめ、次に見るべき導線を提示します。' })}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[profile.membershipStatus] ?? STATUS_TONE.guest}`}>
          {t(`member.loyaltyStatus.${profile.membershipStatus}`, { defaultValue: profile.membershipStatus })}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <dt className="text-[11px] text-gray-500 dark:text-gray-400">{t('member.loyaltyPlan', { defaultValue: '会員プラン' })}</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{t(`member.loyaltyPlanValue.${profile.membershipPlan}`, { defaultValue: profile.membershipPlan })}</dd>
        </div>
        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <dt className="text-[11px] text-gray-500 dark:text-gray-400">{t('member.loyaltyTenure', { defaultValue: '継続期間' })}</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.loyaltyTenureValue', { months: profile.tenureMonths, defaultValue: `${profile.tenureMonths}か月` })}</dd>
        </div>
        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <dt className="text-[11px] text-gray-500 dark:text-gray-400">{t('member.loyaltyRenewal', { defaultValue: '次回更新日' })}</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(profile.renewalDate)}</dd>
        </div>
        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <dt className="text-[11px] text-gray-500 dark:text-gray-400">{t('member.loyaltyBadge', { defaultValue: 'ロイヤルティバッジ' })}</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{t(`member.loyaltyBadgeValue.${profile.loyaltyBadge}`, { defaultValue: profile.loyaltyBadge })}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('member.loyaltyBenefits', { defaultValue: '会員特典' })}</h3>
          <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-300">
            {profile.memberBenefits.map((benefit) => (
              <li key={benefit.id}>
                <p className="font-medium text-gray-900 dark:text-gray-100">{benefit.title}</p>
                <p className="mt-0.5">{benefit.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-violet-100 bg-white/80 p-3 dark:border-violet-900/50 dark:bg-gray-900/40">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('member.loyaltyCampaigns', { defaultValue: '対象キャンペーン' })}</h3>
          {campaigns.length > 0 ? (
            <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {campaigns.slice(0, 3).map((campaign) => (
                <li key={campaign.slug} className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                  <p>{campaign.title}</p>
                  <Link
                    to={campaign.ctaLink || `/campaigns/${campaign.slug}`}
                    className="text-violet-500 hover:text-violet-400"
                    onClick={() => trackMizzzEvent('member_campaign_click', { campaignSlug: campaign.slug, membershipState: profile.membershipStatus })}
                  >
                    {t('member.loyaltyCampaignCta', { defaultValue: '詳細' })} →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('member.loyaltyCampaignEmpty', { defaultValue: '現在表示できる会員向けキャンペーンはありません。' })}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.key}
            to={shortcut.to}
            onClick={() => trackMizzzEvent(shortcut.event, { membershipState: profile.membershipStatus, accessLevel: profile.accessLevel })}
            className="rounded-full border border-violet-200 px-3 py-1 text-xs text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-200 dark:hover:bg-violet-900/30"
          >
            {t(shortcut.key, { defaultValue: shortcut.key })}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{profile.engagementHint}</p>
    </section>
  )
}
