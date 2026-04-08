import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStrapiSingle } from '@/hooks'
import { getSiteSettings } from '@/modules/settings/api'
import SmartLink from '@/components/common/SmartLink'
import { trackEvent } from '@/modules/analytics'

const DISMISS_KEY = 'creava.subdomain.announcement.dismissed'

interface SubdomainAnnouncementBarProps {
  site: 'store' | 'fanclub'
}

const BADGE_STYLE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  important: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
  members: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  early: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
}

const BADGE_LABEL_KEY: Record<string, string> = {
  new: 'common.badgeNew',
  important: 'common.badgeImportant',
  members: 'common.badgeMembersOnly',
  early: 'common.badgeEarlyAccess',
}

export default function SubdomainAnnouncementBar({ site }: SubdomainAnnouncementBarProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1')
  const { item: settings } = useStrapiSingle(() => getSiteSettings({
    fields: ['announcementText', 'announcementUrl', 'announcementLevel', 'announcementBadge', 'announcementSecondaryText', 'weeklyHighlightTitle', 'weeklyHighlightText', 'weeklyHighlightUrl'],
  }))

  const announcement = useMemo(() => {
    const fromCms = settings?.announcementText?.trim()
    const text = fromCms || t(site === 'store' ? 'subdomain.storeAnnouncementDefault' : 'subdomain.fanclubAnnouncementDefault', {
      defaultValue: site === 'store'
        ? '新作ドロップと再販通知は毎週更新中。最新案内をチェックしてください。'
        : '今週の更新まとめと限定公開情報を公開中。見逃し防止にご活用ください。',
    })
    const href = settings?.announcementUrl?.trim() || (site === 'store' ? '/news' : '/mypage')
    const level = settings?.announcementLevel ?? 'info'
    const badge = settings?.announcementBadge ?? (site === 'store' ? 'new' : 'members')
    const secondary = settings?.announcementSecondaryText?.trim()
    const weeklyHighlightTitle = settings?.weeklyHighlightTitle?.trim() || t('common.weeklyHighlight', { defaultValue: '今週の注目' })
    const weeklyHighlightText = settings?.weeklyHighlightText?.trim()
      || (site === 'store' ? '限定・先行情報を見逃さないために、毎週の更新をまとめて確認。' : '限定コンテンツ・先行受付を一画面でチェック。')
    const weeklyHighlightUrl = settings?.weeklyHighlightUrl?.trim() || (site === 'store' ? '/products' : '/mypage')
    return { text, href, level, badge, secondary, weeklyHighlightTitle, weeklyHighlightText, weeklyHighlightUrl }
  }, [settings, site, t])

  if (dismissed || !announcement.text) return null

  return (
    <div className={`border-b px-4 py-2 text-xs ${announcement.level === 'urgent'
      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
      : 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200'}`}
    >
      <div className="mx-auto grid max-w-6xl gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLE[announcement.badge] ?? BADGE_STYLE.new}`}>
            {t(BADGE_LABEL_KEY[announcement.badge] ?? BADGE_LABEL_KEY.new, { defaultValue: announcement.badge })}
          </span>
          <span className="line-clamp-1">{announcement.text}</span>
          {announcement.secondary ? <span className="hidden text-[11px] opacity-80 md:inline">/ {announcement.secondary}</span> : null}
          <SmartLink
            to={announcement.href}
            className="shrink-0 font-semibold underline underline-offset-2"
            onClick={() => trackEvent('subdomain_announcement_click', { site, badge: announcement.badge })}
          >
            {t('common.viewDetails', { defaultValue: '詳細を見る' })}
          </SmartLink>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <SmartLink
            to={announcement.weeklyHighlightUrl}
            className="line-clamp-1 rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-medium"
            onClick={() => trackEvent('subdomain_weekly_highlight_click', { site })}
          >
            {announcement.weeklyHighlightTitle}: {announcement.weeklyHighlightText}
          </SmartLink>
          <button
            type="button"
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] opacity-70 transition hover:opacity-100"
            onClick={() => {
              setDismissed(true)
              if (typeof window !== 'undefined') window.localStorage.setItem(DISMISS_KEY, '1')
            }}
            aria-label={t('common.close', { defaultValue: '閉じる' })}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
