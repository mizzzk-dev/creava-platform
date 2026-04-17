import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import Badge from '@/components/common/Badge'
import { detailPath } from '@/lib/routeConstants'
import type { StoreProductSummary } from '@/modules/store/types'
import type { RankingRange } from '@/modules/store/lib/ranking'

interface Props {
  products: StoreProductSummary[]
  range: RankingRange
  onRangeChange: (range: RankingRange) => void
  variant: 'A' | 'B'
}

export default function StoreRankingSection({ products, range, onRangeChange, variant }: Props) {
  const { t } = useTranslation()
  if (products.length === 0) return null

  return (
    <SectionReveal delay={0.05}>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="store-featured-badge">
            {variant === 'A'
              ? t('store.rankingTitle', { defaultValue: '売上ランキング' })
              : t('store.rankingTitleB', { defaultValue: '人気トレンド' })}
          </span>
          <div className="inline-flex items-center rounded-full border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-muted)] p-0.5">
            {(['7d', '30d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={`rounded-full px-3 py-1 text-[11px] font-mono transition-all ${
                  range === r
                    ? 'bg-[var(--ds-color-fg-default)] text-[var(--ds-color-bg-surface)]'
                    : 'text-[var(--ds-color-fg-muted)] hover:text-[var(--ds-color-fg-default)]'
                }`}
              >
                {r === '7d'
                  ? t('store.ranking7d', { defaultValue: '直近7日' })
                  : t('store.ranking30d', { defaultValue: '直近30日' })}
              </button>
            ))}
          </div>
        </div>
        <ol className="divide-y divide-[var(--ds-color-border-subtle)]">
          {products.map((p, i) => (
            <li key={`rank-${p.id}`}>
              <Link
                to={detailPath.product(p.slug)}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--ds-color-bg-muted)]"
              >
                <span
                  className={`font-display text-2xl font-bold w-7 shrink-0 tabular-nums ${
                    i === 0
                      ? 'text-amber-500 dark:text-amber-300'
                      : i === 1
                        ? 'text-violet-500 dark:text-violet-300'
                        : 'text-[var(--ds-color-fg-subtle)]'
                  }`}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-sm font-medium text-[var(--ds-color-fg-default)] transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-300">
                  {p.title}
                </span>
                <span className="shrink-0">
                  <Badge
                    variant={p.purchaseStatus === 'soldout' ? 'soldout' : p.purchaseStatus === 'coming_soon' ? 'coming_soon' : 'new'}
                    size="sm"
                  />
                </span>
                <span className="shrink-0 font-mono text-xs text-[var(--ds-color-fg-subtle)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </SectionReveal>
  )
}
