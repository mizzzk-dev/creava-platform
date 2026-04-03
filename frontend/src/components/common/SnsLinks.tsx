import { useTranslation } from 'react-i18next'

const SNS_ACCOUNTS = [
  {
    id: 'x',
    label: 'X',
    href: import.meta.env.VITE_SNS_X_URL as string | undefined,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: import.meta.env.VITE_SNS_INSTAGRAM_URL as string | undefined,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'note',
    label: 'note',
    href: import.meta.env.VITE_SNS_NOTE_URL as string | undefined,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 4h10v2H7V9zm0 4h7v2H7v-2z"/>
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: import.meta.env.VITE_SNS_YOUTUBE_URL as string | undefined,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
] as const

interface Props {
  compact?: boolean
}

export default function SnsLinks({ compact = false }: Props) {
  const { t } = useTranslation()

  const activeLinks = SNS_ACCOUNTS.filter((a) => Boolean(a.href))

  if (activeLinks.length === 0 && !import.meta.env.DEV) return null

  const demoLinks = import.meta.env.DEV ? SNS_ACCOUNTS : activeLinks

  return (
    <div className={compact ? '' : 'py-12 border-t border-gray-100 dark:border-gray-800'}>
      {!compact && (
        <div className="mb-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {t('sns.follow')}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">{t('sns.followSub')}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {demoLinks.map((sns) => (
          <a
            key={sns.id}
            href={sns.href ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={sns.label}
            className="group flex items-center gap-2 rounded border border-gray-200 dark:border-gray-800 px-3 py-2 text-gray-500 dark:text-gray-500 transition-all hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              {sns.icon}
            </span>
            <span className="font-mono text-[11px]">{sns.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
