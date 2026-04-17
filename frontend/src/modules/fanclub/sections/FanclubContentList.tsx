import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import SectionReveal from '@/components/common/SectionReveal'
import { detailPath } from '@/lib/routeConstants'
import { formatDate } from '@/utils'
import { trackViewHistory } from '@/modules/store/lib/commerceOptimization'
import { trackEvent } from '@/modules/analytics'
import type { FanclubContent } from '@/types'

interface Props {
  items: FanclubContent[]
}

export default function FanclubContentList({ items }: Props) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <SectionReveal>
        <div className="rounded-2xl border border-dashed border-[var(--ds-color-border-default)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--ds-color-fg-subtle)]">
            {t('fanclub.emptyFiltered', { defaultValue: '条件に合うコンテンツがありません。' })}
          </p>
        </div>
      </SectionReveal>
    )
  }

  return (
    <SectionReveal delay={0.05}>
      <div className="overflow-hidden rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)]">
        <div className="flex items-center gap-2 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ds-color-fg-subtle)]">
            {t('fanclub.allContents', { defaultValue: 'すべてのコンテンツ' })}
          </span>
          <span className="ml-auto font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">
            {items.length}
          </span>
        </div>
        <ul className="divide-y divide-[var(--ds-color-border-subtle)]">
          {items.map((item, i) => {
            const category = (item as FanclubContent & { category?: string }).category
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: Math.min(i * 0.03, 0.3),
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={detailPath.fanclub(item.slug)}
                  className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--ds-color-bg-muted)]"
                  onClick={() => {
                    trackViewHistory('blog', item.slug)
                    trackEvent('fanclub_content_click', { slug: item.slug })
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ds-color-fg-default)] transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-300">
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--ds-color-fg-subtle)]">
                      {item.publishAt && <span>{formatDate(item.publishAt)}</span>}
                      {category && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-mono uppercase tracking-widest">
                            {t(`fanclub.category.${category}`, { defaultValue: category })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-[var(--ds-color-fg-subtle)] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </SectionReveal>
  )
}
