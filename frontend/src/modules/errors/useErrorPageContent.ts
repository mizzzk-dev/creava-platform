import { useTranslation } from 'react-i18next'
import { useStrapiSingle } from '@/hooks'
import { getSiteSettings } from '@/modules/settings/api'
import type { SiteSettings } from '@/types'

export type ErrorPageVariant = '404' | '500' | '503' | '403'

export interface ResolvedErrorContent {
  title: string
  subcopy: string
  hint: string
  maintenanceBadge?: string
  illustrationUrl?: string | null
  animationStyle?: string | null
  backgroundVariant?: string | null
  ctaContactLabel: string
  ctaHomeLabel: string
}

function pickCopy<T extends string | null | undefined>(cms: T, fallback: string): string {
  const trimmed = typeof cms === 'string' ? cms.trim() : ''
  return trimmed.length > 0 ? trimmed : fallback
}

function resolveIllustrationUrl(settings?: SiteSettings | null): string | null {
  return settings?.errorPageIllustration?.url ?? null
}

/**
 * エラーページの文言を i18n + CMS 上書きで解決する。
 * 500/503 でバックエンド自体が不調な場合でも i18n にフォールバックする。
 */
export function useErrorPageContent(variant: ErrorPageVariant): ResolvedErrorContent {
  const { t } = useTranslation()
  const { item: settings } = useStrapiSingle<SiteSettings>(() => getSiteSettings({
    fields: [
      'errorPageNotFoundTitle', 'errorPageNotFoundSubcopy', 'errorPageNotFoundHint',
      'errorPageServerTitle', 'errorPageServerSubcopy', 'errorPageServerHint',
      'errorPageMaintenanceTitle', 'errorPageMaintenanceSubcopy', 'errorPageMaintenanceHint', 'errorPageMaintenanceBadge',
      'errorPageRestrictedTitle', 'errorPageRestrictedSubcopy', 'errorPageRestrictedHint',
      'errorPageCtaContactLabel', 'errorPageCtaHomeLabel',
      'errorPageAnimationStyle', 'errorPageBackgroundVariant',
    ],
  }))

  const fallbackHomeLabel = t('common.backToHome', { defaultValue: 'ホームへ戻る' })
  const fallbackContactLabel = t('nav.contact', { defaultValue: 'お問い合わせ' })
  const ctaHomeLabel = pickCopy(settings?.errorPageCtaHomeLabel, fallbackHomeLabel)
  const ctaContactLabel = pickCopy(settings?.errorPageCtaContactLabel, fallbackContactLabel)

  const illustrationUrl = resolveIllustrationUrl(settings)
  const animationStyle = settings?.errorPageAnimationStyle ?? null
  const backgroundVariant = settings?.errorPageBackgroundVariant ?? null

  if (variant === '404') {
    return {
      title: pickCopy(settings?.errorPageNotFoundTitle, t('error.404title', { defaultValue: 'ページが見つかりません' })),
      subcopy: pickCopy(settings?.errorPageNotFoundSubcopy, t('error.404sub', { defaultValue: 'お探しのページは移動または削除された可能性があります。' })),
      hint: pickCopy(settings?.errorPageNotFoundHint, t('error.404hint', { defaultValue: 'URLを確認するか、上のリンクからお探しください。' })),
      illustrationUrl,
      animationStyle,
      backgroundVariant,
      ctaContactLabel,
      ctaHomeLabel,
    }
  }

  if (variant === '503') {
    return {
      title: pickCopy(settings?.errorPageMaintenanceTitle, t('error.503title', { defaultValue: 'メンテナンス中です' })),
      subcopy: pickCopy(settings?.errorPageMaintenanceSubcopy, t('error.503sub', { defaultValue: 'ただいまシステムメンテナンス中です。しばらくしてから再度アクセスしてください。' })),
      hint: pickCopy(settings?.errorPageMaintenanceHint, t('error.503hint', { defaultValue: '復旧まで今しばらくお待ちください。' })),
      maintenanceBadge: pickCopy(settings?.errorPageMaintenanceBadge, t('error.503maintenance', { defaultValue: '復旧作業中です' })),
      illustrationUrl,
      animationStyle,
      backgroundVariant,
      ctaContactLabel,
      ctaHomeLabel,
    }
  }

  if (variant === '403') {
    return {
      title: pickCopy(settings?.errorPageRestrictedTitle, t('error.403title', { defaultValue: 'アクセスできません' })),
      subcopy: pickCopy(settings?.errorPageRestrictedSubcopy, t('error.403sub', { defaultValue: 'このコンテンツは mizzz Fanclub 会員限定です。' })),
      hint: pickCopy(settings?.errorPageRestrictedHint, t('error.403hint', { defaultValue: 'ログインまたはご入会のうえ、再度アクセスしてください。' })),
      illustrationUrl,
      animationStyle,
      backgroundVariant,
      ctaContactLabel,
      ctaHomeLabel,
    }
  }

  return {
    title: pickCopy(settings?.errorPageServerTitle, t('error.500title', { defaultValue: '予期しないエラーが発生しました' })),
    subcopy: pickCopy(settings?.errorPageServerSubcopy, t('error.500sub', { defaultValue: '一時的な問題が発生しました。時間をおいて再度お試しください。' })),
    hint: pickCopy(settings?.errorPageServerHint, t('error.500hint', { defaultValue: '問題が続く場合はお問い合わせください。' })),
    illustrationUrl,
    animationStyle,
    backgroundVariant,
    ctaContactLabel,
    ctaHomeLabel,
  }
}
