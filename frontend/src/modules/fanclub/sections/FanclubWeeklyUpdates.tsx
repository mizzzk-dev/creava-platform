import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import SectionReveal from '@/components/common/SectionReveal'
import { detailPath } from '@/lib/routeConstants'
import { formatDate } from '@/utils'
import type { FanclubContent } from '@/types'

interface Props {
  items: FanclubContent[]
}

export default function FanclubWeeklyUpdates({ items }: Props) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <SectionReveal delay={0.05}>
      <div className="overflow-hidden rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-500 dark:text-violet-400">
            {t('fanclub.weeklyUpdates', { defaultValue: '今週の更新' })}
          </span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-[var(--ds-color-fg-subtle)]">
            {items.length}
          </span>
        </div>
        <ul className="divide-y divide-[var(--ds-color-border-subtle)]">
          {items.map((item, i) => (
            <motion.li
              key={`weekly-${item.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={detailPath.fanclub(item.slug)}
                className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--ds-color-bg-muted)]"
              >
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--ds-color-fg-default)] transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-300">
                    {item.title}
                  </span>
                  {item.publishAt && (
                    <span className="mt-0.5 block font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">
                      {formatDate(item.publishAt)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-xs text-[var(--ds-color-fg-subtle)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  )
}
