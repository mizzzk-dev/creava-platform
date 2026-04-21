import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useCurrentUser } from '@/hooks'
import { resolveCampaignPersonalizationState } from '@/lib/auth/campaignPersonalizationState'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

type SourceSite = 'main' | 'store' | 'fc' | 'member' | 'support' | 'admin'

export default function CampaignPersonalizationPanel({ sourceSite }: { sourceSite: SourceSite }) {
  const { user, lifecycle } = useCurrentUser()
  const state = resolveCampaignPersonalizationState({ user, lifecycle, sourceSite })

  useEffect(() => {
    trackMizzzEvent('personalized_block_view', {
      sourceSite,
      lifecycleStage: state.lifecycleStage,
      membershipStatus: state.membershipStatus,
      entitlementState: state.entitlementState,
      memberRankState: state.memberRankState,
      perkState: state.perkState,
      campaignEligibilityState: state.campaignEligibilityState,
      personalizationState: state.personalizationState,
    })
    trackMizzzEvent('seasonal_perk_view', {
      sourceSite,
      lifecycleStage: state.lifecycleStage,
      membershipStatus: state.membershipStatus,
      seasonalEligibilityState: state.seasonalEligibilityState,
      seasonalPerkState: state.seasonalPerkState,
      campaignWindowState: state.campaignWindowState,
    })
    trackMizzzEvent('campaign_banner_view', {
      sourceSite,
      membershipStatus: state.membershipStatus,
      campaignEligibilityState: state.campaignEligibilityState,
      offerVisibilityState: state.offerVisibilityState,
    })
    trackMizzzEvent('recommendation_block_view', {
      sourceSite,
      recommendationState: state.recommendationState,
      personalizationState: state.personalizationState,
    })
    if (state.campaignEligibilityState === 'eligible' || state.campaignEligibilityState === 'prioritized') {
      trackMizzzEvent('eligible_offer_view', {
        sourceSite,
        campaignEligibilityState: state.campaignEligibilityState,
        seasonalPerkState: state.seasonalPerkState,
      })
    }
    if (state.offerVisibilityState === 'member_priority') {
      trackMizzzEvent('member_priority_block_view', {
        sourceSite,
        memberRankState: state.memberRankState,
        campaignEligibilityState: state.campaignEligibilityState,
      })
    }
    trackMizzzEvent('next_best_action_view', {
      sourceSite,
      membershipStatus: state.membershipStatus,
      campaignEligibilityState: state.campaignEligibilityState,
      recommendationState: state.recommendationState,
      nextBestActionHref: state.nextBestActionHref,
    })
  }, [sourceSite, state])

  return (
    <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/70 to-white p-4 dark:border-emerald-900/60 dark:from-emerald-950/20 dark:to-gray-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">施策パーソナライズハブ</h2>
        <span className="rounded-full border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700 dark:border-emerald-900 dark:text-emerald-300">
          {state.campaignEligibilityState}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        {state.personalizationReason} / {state.recommendationReason}
      </p>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-emerald-100 bg-white/90 p-2 text-xs dark:border-emerald-900/50 dark:bg-gray-900/50">
          <dt className="text-gray-500">seasonal</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{state.seasonalEligibilityState}</dd>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-white/90 p-2 text-xs dark:border-emerald-900/50 dark:bg-gray-900/50">
          <dt className="text-gray-500">offer visibility</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{state.offerVisibilityState}</dd>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-white/90 p-2 text-xs dark:border-emerald-900/50 dark:bg-gray-900/50">
          <dt className="text-gray-500">recommendation</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{state.recommendationState}</dd>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-white/90 p-2 text-xs dark:border-emerald-900/50 dark:bg-gray-900/50">
          <dt className="text-gray-500">member rank</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{state.memberRankState}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-lg border border-emerald-100 bg-white/90 p-3 text-xs dark:border-emerald-900/50 dark:bg-gray-900/40">
        <p className="font-medium text-gray-900 dark:text-gray-100">next best action</p>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{state.nextBestActionLabel}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to={state.nextBestActionHref}
            onClick={() => {
              trackMizzzEvent('next_best_action_click', {
                sourceSite,
                membershipStatus: state.membershipStatus,
                campaignEligibilityState: state.campaignEligibilityState,
                personalizationState: state.personalizationState,
                href: state.nextBestActionHref,
              })
              trackMizzzEvent('personalized_cta_click', {
                sourceSite,
                lifecycleStage: state.lifecycleStage,
                recommendationState: state.recommendationState,
                cta: state.nextBestActionLabel,
              })
              if (state.campaignEligibilityState === 'eligible' || state.campaignEligibilityState === 'prioritized') {
                trackMizzzEvent('eligible_offer_click', {
                  sourceSite,
                  membershipStatus: state.membershipStatus,
                  campaignEligibilityState: state.campaignEligibilityState,
                })
              }
            }}
            className="text-emerald-700 underline dark:text-emerald-300"
          >
            {state.nextBestActionLabel}
          </Link>
          <Link
            to="/campaigns"
            onClick={() => trackMizzzEvent('campaign_banner_click', {
              sourceSite,
              membershipStatus: state.membershipStatus,
              campaignEligibilityState: state.campaignEligibilityState,
              campaignWindowState: state.campaignWindowState,
            })}
            className="text-gray-500 underline dark:text-gray-300"
          >
            キャンペーン一覧を見る
          </Link>
          {state.rejoinRecommended && (
            <Link
              to="/fanclub/join"
              onClick={() => {
                trackMizzzEvent('rejoin_offer_view', {
                  sourceSite,
                  membershipStatus: state.membershipStatus,
                  lifecycleStage: state.lifecycleStage,
                })
                trackMizzzEvent('rejoin_offer_click', {
                  sourceSite,
                  membershipStatus: state.membershipStatus,
                  eligibilityReason: state.eligibilityReason,
                })
              }}
              className="text-rose-600 underline dark:text-rose-300"
            >
              再開オファーを見る
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
