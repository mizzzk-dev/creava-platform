import type { BenefitExperienceState } from './benefitState'

export interface BenefitPresentation {
  title: string
  description: string
  primaryAction: 'join' | 'renew' | 'reactivate' | 'explore'
}

export function buildBenefitPresentation(
  state: Pick<
    BenefitExperienceState,
    'membershipStatus' | 'benefitVisibilityState' | 'earlyAccessState' | 'memberPerkState'
  >,
): BenefitPresentation {
  if (state.membershipStatus === 'grace') {
    return {
      title: '会員特典はまだ使えます',
      description: '猶予期間中に更新すると、限定公開・先行公開・履歴連携をそのまま継続できます。',
      primaryAction: 'renew',
    }
  }

  if (state.membershipStatus === 'expired' || state.membershipStatus === 'canceled') {
    return {
      title: '再開で特典をすぐ復元できます',
      description: '再開後は member-only コンテンツ、先行公開、会員向け通知を優先表示します。',
      primaryAction: 'reactivate',
    }
  }

  if (state.membershipStatus === 'member') {
    return {
      title: state.memberPerkState === 'expiring_soon' ? '次の更新で特典を維持できます' : '会員限定体験を優先表示中です',
      description:
        state.earlyAccessState === 'early_access'
          ? '先行公開・先行販売を利用できる状態です。見逃し防止の通知設定も確認してください。'
          : '限定公開・先行公開の対象を状態に応じておすすめ表示しています。',
      primaryAction: 'explore',
    }
  }

  if (state.benefitVisibilityState === 'teaser') {
    return {
      title: '会員向け特典をプレビュー中です',
      description: 'いまは teaser 表示です。会員になると限定公開と先行公開にアクセスできます。',
      primaryAction: 'join',
    }
  }

  return {
    title: '会員価値体験を確認できます',
    description: '現在の状態に応じて、利用できる特典と次のおすすめ行動を案内します。',
    primaryAction: 'explore',
  }
}
