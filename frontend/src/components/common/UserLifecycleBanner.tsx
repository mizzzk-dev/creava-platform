import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import { fanclubLink } from '@/lib/siteLinks'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { AppUser } from '@/types'
import type { UserLifecycleSummary } from '@/lib/auth/lifecycle'

type Props = {
  user: AppUser | null
  lifecycle: UserLifecycleSummary | null
  context: 'main' | 'store' | 'fc' | 'member'
}

type LifecycleMessage = {
  title: string
  description: string
  ctaLabel: string
  ctaTo: string
  event: string
  reason: string
}

function resolveMessage(user: AppUser | null, lifecycle: UserLifecycleSummary | null, t: (key: string, opts?: Record<string, unknown>) => string): LifecycleMessage {
  if (!user || !lifecycle) {
    return {
      title: t('lifecycle.guestTitle', { defaultValue: 'ログインすると、main / store / fc を横断した体験が始まります。' }),
      description: t('lifecycle.guestDescription', { defaultValue: 'まずはログインして、マイページでステータスと次のおすすめアクションを確認してください。' }),
      ctaLabel: t('auth.signIn'),
      ctaTo: ROUTES.MEMBER,
      event: 'membership_cta_click',
      reason: 'guest',
    }
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'restricted' || user.membershipStatus === 'suspended') {
    return {
      title: t('lifecycle.suspendedTitle', { defaultValue: 'アカウント制限中です。' }),
      description: t('lifecycle.suspendedDescription', { defaultValue: '状況確認と再開手続きのため、サポートにお問い合わせください。' }),
      ctaLabel: t('nav.contact'),
      ctaTo: ROUTES.CONTACT,
      event: 'support_from_renewal_state',
      reason: 'suspended',
    }
  }

  if (lifecycle.renewalState === 'upcoming' || lifecycle.renewalState === 'due') {
    return {
      title: t('lifecycle.renewalSoonTitle', { defaultValue: '更新時期が近づいています。' }),
      description: t('lifecycle.renewalSoonDescription', { defaultValue: '次回更新日・会員特典・最近の更新内容を確認し、無理のない範囲で継続を検討してください。' }),
      ctaLabel: t('lifecycle.renewalSoonCta', { defaultValue: '更新内容を確認する' }),
      ctaTo: ROUTES.MEMBER,
      event: 'renewal_cta_click',
      reason: 'renewal_soon',
    }
  }

  if (user.membershipStatus === 'grace' || lifecycle.renewalState === 'grace') {
    return {
      title: t('lifecycle.graceTitle', { defaultValue: '会員猶予期間中です。' }),
      description: t('lifecycle.graceDescription', { defaultValue: '会員体験を継続するため、支払い方法の確認・更新手続きをご確認ください。' }),
      ctaLabel: t('lifecycle.graceCta', { defaultValue: '再開手続きを確認する' }),
      ctaTo: ROUTES.MEMBER,
      event: 'grace_recovery_cta_click',
      reason: 'grace',
    }
  }

  if (lifecycle.billingState === 'failed' || lifecycle.renewalState === 'failed') {
    return {
      title: t('lifecycle.paymentFailedTitle', { defaultValue: '決済確認が必要です。' }),
      description: t('lifecycle.paymentFailedDescription', { defaultValue: '支払い情報を更新すると、会員体験を中断せず再開できます。' }),
      ctaLabel: t('lifecycle.paymentFixCta', { defaultValue: '支払い情報を更新する' }),
      ctaTo: ROUTES.MEMBER,
      event: 'payment_fix_cta_click',
      reason: 'payment_failed',
    }
  }

  if (user.membershipStatus === 'expired' || user.membershipStatus === 'canceled' || lifecycle.renewalState === 'expired') {
    return {
      title: t('lifecycle.expiredTitle', { defaultValue: '会員ステータスが停止中です。' }),
      description: t('lifecycle.expiredDescription', { defaultValue: '再入会で限定コンテンツ・会員特典を再開できます。' }),
      ctaLabel: t('lifecycle.rejoin', { defaultValue: '再入会する' }),
      ctaTo: fanclubLink('/join'),
      event: 'rejoin_cta_click',
      reason: 'expired',
    }
  }

  if (lifecycle.renewalState === 'reactivated') {
    return {
      title: t('lifecycle.reactivatedTitle', { defaultValue: 'おかえりなさい。会員ステータスを再開しました。' }),
      description: t('lifecycle.reactivatedDescription', { defaultValue: '最近の更新・限定公開・特典を確認して、再開後の体験を活用してください。' }),
      ctaLabel: t('nav.member'),
      ctaTo: ROUTES.MEMBER,
      event: 'reactivation_success',
      reason: 'reactivated',
    }
  }

  if (user.membershipStatus === 'member') {
    return {
      title: t('lifecycle.memberTitle', { defaultValue: '会員ステータスが有効です。' }),
      description: t('lifecycle.memberDescription', { defaultValue: '限定コンテンツ・先行販売・会員向け案内を活用してください。' }),
      ctaLabel: t('nav.member'),
      ctaTo: ROUTES.MEMBER,
      event: 'member_value_block_view',
      reason: 'active_member',
    }
  }

  if (lifecycle.onboardingStatus !== 'completed') {
    return {
      title: t('lifecycle.onboardingTitle', { defaultValue: '初回設定を完了すると、体験が最適化されます。' }),
      description: t('lifecycle.onboardingDescription', { defaultValue: 'プロフィール・通知・興味カテゴリの設定を進めましょう（後で再開可能）。' }),
      ctaLabel: t('lifecycle.continueOnboarding', { defaultValue: '初期設定を続ける' }),
      ctaTo: ROUTES.MEMBER,
      event: 'onboarding_start',
      reason: 'onboarding',
    }
  }

  return {
    title: t('lifecycle.nonMemberTitle', { defaultValue: '会員登録でさらに深い体験を利用できます。' }),
    description: t('lifecycle.nonMemberDescription', { defaultValue: 'まずは main / store / fc を回遊し、気になる特典が見つかったら入会を検討してください。' }),
    ctaLabel: t('lifecycle.join', { defaultValue: '会員特典を見る' }),
    ctaTo: fanclubLink('/join'),
    event: 'member_conversion_start',
    reason: 'non_member',
  }
}

export default function UserLifecycleBanner({ user, lifecycle, context }: Props) {
  const { t, i18n } = useTranslation()
  const message = resolveMessage(user, lifecycle, t)

  useEffect(() => {
    const event = lifecycle?.renewalState === 'upcoming' || lifecycle?.renewalState === 'due'
      ? 'renewal_banner_view'
      : lifecycle?.renewalState === 'grace' || user?.membershipStatus === 'grace'
        ? 'grace_notice_view'
        : lifecycle?.renewalState === 'expired' || user?.membershipStatus === 'expired' || user?.membershipStatus === 'canceled'
          ? 'rejoin_banner_view'
          : user?.membershipStatus === 'member'
            ? 'member_value_block_view'
            : null
    if (!event) return
    trackMizzzEvent(event, {
      sourceSite: context,
      locale: i18n.resolvedLanguage,
      lifecycleStage: lifecycle?.lifecycleStage ?? 'guest',
      membershipStatus: user?.membershipStatus ?? 'guest',
      renewalState: lifecycle?.renewalState ?? 'not_applicable',
    })
  }, [context, i18n.resolvedLanguage, lifecycle?.lifecycleStage, lifecycle?.renewalState, user?.membershipStatus])

  return (
    <div className="mb-6 rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-4 text-sm dark:border-cyan-900/40 dark:bg-cyan-950/25">
      <p className="font-semibold text-cyan-900 dark:text-cyan-200">{message.title}</p>
      <p className="mt-1 text-cyan-800/90 dark:text-cyan-100/90">{message.description}</p>
      <Link
        to={message.ctaTo}
        className="mt-3 inline-flex rounded-full bg-cyan-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-600"
        onClick={() => trackMizzzEvent(message.event, {
          sourceSite: context,
          locale: i18n.resolvedLanguage,
          userState: lifecycle?.lifecycleStage ?? 'guest',
          lifecycleStage: lifecycle?.lifecycleStage ?? 'guest',
          membershipStatus: user?.membershipStatus ?? 'guest',
          renewalState: lifecycle?.renewalState ?? 'not_applicable',
          reason: message.reason,
        })}
      >
        {message.ctaLabel}
      </Link>
    </div>
  )
}
