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

export default function SubdomainAnnouncementBar({ site }: SubdomainAnnouncementBarProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1')
  const { item: settings } = useStrapiSingle(() => getSiteSettings({ fields: ['announcementText', 'announcementUrl', 'announcementLevel'] }))

  const announcement = useMemo(() => {
    const fromCms = settings?.announcementText?.trim()
    const text = fromCms || t(site === 'store' ? 'subdomain.storeAnnouncementDefault' : 'subdomain.fanclubAnnouncementDefault', {
      defaultValue: site === 'store'
        ? '新作ドロップと再販通知は毎週更新中。最新案内をチェックしてください。'
        : '今週の更新まとめと限定公開情報を公開中。見逃し防止にご活用ください。',
    })
    const href = settings?.announcementUrl?.trim() || (site === 'store' ? '/news' : '/member')
    const level = settings?.announcementLevel ?? 'info'
    return { text, href, level }
  }, [settings?.announcementLevel, settings?.announcementText, settings?.announcementUrl, site, t])

  if (dismissed || !announcement.text) return null

  return (
    <div className={`border-b px-4 py-2 text-center text-xs ${announcement.level === 'urgent'
      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200'
      : 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200'}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3">
        <span className="line-clamp-1">{announcement.text}</span>
        <SmartLink
          to={announcement.href}
          className="shrink-0 font-semibold underline underline-offset-2"
          onClick={() => trackEvent('subdomain_announcement_click', { site })}
        >
          {t('common.viewDetails', { defaultValue: '詳細を見る' })}
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
  )
}
