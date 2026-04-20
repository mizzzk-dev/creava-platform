import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/hooks'
import { resolveBenefitExperienceState } from '@/lib/auth/benefitState'
import { ROUTES } from '@/lib/routeConstants'
import { trackMizzzEvent } from '@/modules/analytics/tracking'

type SourceSite = 'main' | 'store' | 'fc' | 'member'

interface Props {
  sourceSite: SourceSite
  compact?: boolean
}

const SITE_TO_SOURCE: Record<SourceSite, 'main' | 'store' | 'fc'> = {
  main: 'main',
  store: 'store',
  fc: 'fc',
  member: 'fc',
}

export default function MemberValueExperiencePanel({ sourceSite, compact = false }: Props) {
  const { t } = useTranslation()
  const { user, lifecycle } = useCurrentUser()
  const normalized = resolveBenefitExperienceState({
    user,
    lifecycle,
    sourceSite: SITE_TO_SOURCE[sourceSite],
  })

  const cards = useMemo(() => {
    const shared = {
      locale: t('common.localeCode', { defaultValue: 'ja' }),
      sourceSite,
      lifecycleStage: normalized.lifecycleStage,
      membershipStatus: normalized.membershipStatus,
      entitlementState: normalized.entitlementState,
      benefitVisibilityState: normalized.benefitVisibilityState,
    }

    return [
      {
        id: 'limited',
        title: t('memberValue.limitedTitle', { defaultValue: '限定公開コンテンツ' }),
        description:
          normalized.benefitVisibilityState === 'teaser'
            ? t('memberValue.limitedTeaserDesc', { defaultValue: '会員向け更新の見どころを先に確認できます。' })
            : t('memberValue.limitedOpenDesc', { defaultValue: '今見られる限定コンテンツを優先表示しています。' }),
        cta: normalized.benefitVisibilityState === 'teaser'
          ? t('memberValue.joinNow', { defaultValue: '会員特典を確認' })
          : t('memberValue.openNow', { defaultValue: '限定公開を見る' }),
        to: ROUTES.FANCLUB,
        event: 'member_only_teaser_view',
        payload: shared,
      },
      {
        id: 'early',
        title: t('memberValue.earlyAccessTitle', { defaultValue: '先行公開 / 先行販売' }),
        description:
          normalized.earlyAccessState === 'early_access'
            ? t('memberValue.earlyAccessEnabledDesc', { defaultValue: '先行公開中の情報・商品にアクセスできます。' })
            : t('memberValue.earlyAccessPreviewDesc', { defaultValue: '先行公開予定の内容をプレビューできます。' }),
        cta: t('memberValue.seeEarlyAccess', { defaultValue: '先行公開を確認' }),
        to: sourceSite === 'store' ? ROUTES.STORE : ROUTES.FANCLUB,
        event: 'early_access_block_view',
        payload: shared,
      },
      {
        id: 'rejoin',
        title: t('memberValue.rejoinTitle', { defaultValue: '継続・再開ガイド' }),
        description:
          normalized.membershipStatus === 'grace' || normalized.membershipStatus === 'expired' || normalized.membershipStatus === 'canceled'
            ? t('memberValue.rejoinDescUrgent', { defaultValue: '猶予期間・再開可能な特典を優先して案内しています。' })
            : t('memberValue.rejoinDescDefault', { defaultValue: '更新時期や次の特典を分かりやすく案内します。' }),
        cta: t('memberValue.openBenefitHub', { defaultValue: 'マイページで確認' }),
        to: ROUTES.MEMBER,
        event: 'rejoin_value_block_view',
        payload: shared,
      },
    ]
  }, [normalized, sourceSite, t])

  useEffect(() => {
    trackMizzzEvent('member_benefit_block_view', {
      sourceSite,
      lifecycleStage: normalized.lifecycleStage,
      membershipStatus: normalized.membershipStatus,
      entitlementState: normalized.entitlementState,
      benefitVisibilityState: normalized.benefitVisibilityState,
      earlyAccessState: normalized.earlyAccessState,
      accessGateState: normalized.accessGateState,
      personalizationState: normalized.personalizationState,
    })
  }, [normalized, sourceSite])

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-b from-violet-50/70 to-white p-4 dark:border-violet-900/60 dark:from-violet-950/20 dark:to-gray-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('memberValue.title', { defaultValue: '会員価値エクスペリエンス' })}
        </h2>
        <span className="rounded-full border border-violet-200 px-2 py-0.5 text-[11px] text-violet-700 dark:border-violet-800 dark:text-violet-300">
          {normalized.membershipStatus}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        {t('memberValue.subtitle', { defaultValue: '限定公開・先行公開・特典表示を同じ状態モデルで出し分けています。' })}
      </p>
      <ul className={`mt-3 grid gap-3 ${compact ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
        {cards.map((card) => (
          <li key={card.id} className="rounded-xl border border-violet-100 bg-white/80 p-3 dark:border-violet-900/40 dark:bg-gray-900/40">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.title}</p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{card.description}</p>
            <Link
              to={card.to}
              onClick={() => trackMizzzEvent('member_benefit_cta_click', {
                ...card.payload,
                eventLabel: card.event,
                cta: card.id,
              })}
              className="mt-2 inline-flex text-xs font-medium text-violet-700 underline dark:text-violet-300"
            >
              {card.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
