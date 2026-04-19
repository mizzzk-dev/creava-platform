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

function resolveMessage(user: AppUser | null, lifecycle: UserLifecycleSummary | null, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (!user || !lifecycle) {
    return {
      title: t('lifecycle.guestTitle', { defaultValue: 'ログインすると、main / store / fc を横断した体験が始まります。' }),
      description: t('lifecycle.guestDescription', { defaultValue: 'まずはログインして、マイページでステータスと次のおすすめアクションを確認してください。' }),
      ctaLabel: t('auth.signIn'),
      ctaTo: ROUTES.MEMBER,
      event: 'membership_cta_click',
    }
  }

  if (user.accountStatus === 'suspended' || user.accountStatus === 'restricted' || user.membershipStatus === 'suspended') {
    return {
      title: t('lifecycle.suspendedTitle', { defaultValue: 'アカウント制限中です。' }),
      description: t('lifecycle.suspendedDescription', { defaultValue: '状況確認と再開手続きのため、サポートにお問い合わせください。' }),
      ctaLabel: t('nav.contact'),
      ctaTo: ROUTES.CONTACT,
      event: 'support_from_status_block',
    }
  }

  if (user.membershipStatus === 'grace') {
    return {
      title: t('lifecycle.graceTitle', { defaultValue: '会員猶予期間中です。' }),
      description: t('lifecycle.graceDescription', { defaultValue: '会員体験を継続するため、更新手続きをご確認ください。' }),
      ctaLabel: t('lifecycle.renew', { defaultValue: '更新を確認する' }),
      ctaTo: ROUTES.MEMBER,
      event: 'renew_cta_click',
    }
  }

  if (user.membershipStatus === 'expired' || user.membershipStatus === 'canceled') {
    return {
      title: t('lifecycle.expiredTitle', { defaultValue: '会員ステータスが停止中です。' }),
      description: t('lifecycle.expiredDescription', { defaultValue: '再入会で限定コンテンツ・会員特典を再開できます。' }),
      ctaLabel: t('lifecycle.rejoin', { defaultValue: '再入会する' }),
      ctaTo: fanclubLink('/join'),
      event: 'rejoin_cta_click',
    }
  }

  if (user.membershipStatus === 'member') {
    return {
      title: t('lifecycle.memberTitle', { defaultValue: '会員ステータスが有効です。' }),
      description: t('lifecycle.memberDescription', { defaultValue: '限定コンテンツ・先行販売・会員向け案内を活用してください。' }),
      ctaLabel: t('nav.member'),
      ctaTo: ROUTES.MEMBER,
      event: 'status_based_banner_click',
    }
  }

  if (lifecycle.onboardingStatus !== 'completed') {
    return {
      title: t('lifecycle.onboardingTitle', { defaultValue: '初回設定を完了すると、体験が最適化されます。' }),
      description: t('lifecycle.onboardingDescription', { defaultValue: 'プロフィール・通知・興味カテゴリの設定を進めましょう（後で再開可能）。' }),
      ctaLabel: t('lifecycle.continueOnboarding', { defaultValue: '初期設定を続ける' }),
      ctaTo: ROUTES.MEMBER,
      event: 'onboarding_start',
    }
  }

  return {
    title: t('lifecycle.nonMemberTitle', { defaultValue: '会員登録でさらに深い体験を利用できます。' }),
    description: t('lifecycle.nonMemberDescription', { defaultValue: 'まずは main / store / fc を回遊し、気になる特典が見つかったら入会を検討してください。' }),
    ctaLabel: t('lifecycle.join', { defaultValue: '会員特典を見る' }),
    ctaTo: fanclubLink('/join'),
    event: 'member_conversion_start',
  }
}

export default function UserLifecycleBanner({ user, lifecycle, context }: Props) {
  const { t } = useTranslation()
  const message = resolveMessage(user, lifecycle, t)

  return (
    <div className="mb-6 rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-4 text-sm dark:border-cyan-900/40 dark:bg-cyan-950/25">
      <p className="font-semibold text-cyan-900 dark:text-cyan-200">{message.title}</p>
      <p className="mt-1 text-cyan-800/90 dark:text-cyan-100/90">{message.description}</p>
      <Link
        to={message.ctaTo}
        className="mt-3 inline-flex rounded-full bg-cyan-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-600"
        onClick={() => trackMizzzEvent(message.event, {
          sourceSite: context,
          userState: lifecycle?.lifecycleStage ?? 'guest',
          membershipStatus: user?.membershipStatus ?? 'guest',
        })}
      >
        {message.ctaLabel}
      </Link>
    </div>
  )
}
