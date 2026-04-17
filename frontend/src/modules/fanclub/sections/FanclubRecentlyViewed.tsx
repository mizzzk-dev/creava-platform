import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import { detailPath } from '@/lib/routeConstants'
import type { FanclubContent } from '@/types'

interface Props {
  items: FanclubContent[]
}

export default function FanclubRecentlyViewed({ items }: Props) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <SectionReveal delay={0.08}>
      <div className="overflow-hidden rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)]">
        <div className="border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ds-color-fg-subtle)]">
            {t('fanclub.recentlyViewed', { defaultValue: '最近見たコンテンツ' })}
          </span>
        </div>
        <ul className="divide-y divide-[var(--ds-color-border-subtle)]">
          {items.map((item) => (
            <li key={`recent-${item.id}`}>
              <Link
                to={detailPath.fanclub(item.slug)}
                className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--ds-color-bg-muted)]"
              >
                <span className="truncate text-sm text-[var(--ds-color-fg-default)] transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-300">
                  {item.title}
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
