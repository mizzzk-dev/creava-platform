import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import { ROUTES } from '@/lib/routeConstants'

interface GuideLink {
  to: string
  labelKey: string
  defaultLabel: string
  descKey: string
  defaultDesc: string
  iconPath: string
}

const LINKS: GuideLink[] = [
  {
    to: '/store/guide',
    labelKey: 'store.guideShipping',
    defaultLabel: '配送・発送について',
    descKey: 'store.guideShippingDesc',
    defaultDesc: '発送日数・送料・追跡の案内',
    iconPath: 'M3 7h13l5 5v5h-3a3 3 0 0 1-6 0H8a3 3 0 0 1-6 0V7z',
  },
  {
    to: '/store/guide',
    labelKey: 'store.guideReturns',
    defaultLabel: '返品・交換',
    descKey: 'store.guideReturnsDesc',
    defaultDesc: '不良品・誤配送時の対応手順',
    iconPath: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  },
  {
    to: ROUTES.FAQ,
    labelKey: 'store.guideFaq',
    defaultLabel: 'よくある質問',
    descKey: 'store.guideFaqDesc',
    defaultDesc: '購入前の疑問をまとめています',
    iconPath: 'M9 9a3 3 0 1 1 4 2.8c-.8.3-1 .8-1 1.7V14m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  },
  {
    to: ROUTES.NEWS,
    labelKey: 'store.guideNews',
    defaultLabel: '販売・再販ニュース',
    descKey: 'store.guideNewsDesc',
    defaultDesc: 'ドロップ・再販・キャンペーン情報',
    iconPath: 'M4 6h16M4 10h16M4 14h10M4 18h10',
  },
]

export default function StoreGuideLinks() {
  const { t } = useTranslation()

  return (
    <SectionReveal delay={0.05}>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
          <span className="store-featured-badge">
            {t('store.guideSectionTitle', { defaultValue: '購入前のご案内' })}
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-[var(--ds-color-border-subtle)] sm:divide-y-0 sm:divide-x">
          {LINKS.map((item) => (
            <li key={item.labelKey}>
              <Link
                to={item.to}
                className="group flex h-full items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--ds-color-bg-muted)]"
              >
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-bg-muted)] text-[var(--ds-color-fg-muted)] transition-colors group-hover:border-cyan-300/60 group-hover:text-cyan-600 dark:group-hover:border-cyan-700 dark:group-hover:text-cyan-300"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.iconPath} />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--ds-color-fg-default)] transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                    {t(item.labelKey, { defaultValue: item.defaultLabel })}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--ds-color-fg-subtle)]">
                    {t(item.descKey, { defaultValue: item.defaultDesc })}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-[var(--ds-color-fg-subtle)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  )
}
