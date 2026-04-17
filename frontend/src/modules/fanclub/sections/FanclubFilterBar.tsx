import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'

export const CATEGORY_KEYS = [
  'all',
  'diary',
  'exclusive',
  'qa',
  'behind_scenes',
  'teaser',
  'live_archive',
  'tips',
  'info',
] as const

export type FanclubCategory = (typeof CATEGORY_KEYS)[number]

interface Props {
  query: string
  onQueryChange: (value: string) => void
  category: FanclubCategory
  onCategoryChange: (value: FanclubCategory) => void
  resultCount: number
}

export default function FanclubFilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  resultCount,
}: Props) {
  const { t } = useTranslation()

  return (
    <SectionReveal>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-color-fg-subtle)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t('fanclub.searchPlaceholder', { defaultValue: 'タイトルで検索' })}
              className="input-surface w-full py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as FanclubCategory)}
            className="input-surface min-w-[140px] px-3 py-2 text-sm"
            aria-label={t('fanclub.categoryLabel', { defaultValue: 'カテゴリ' })}
          >
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`fanclub.category.${key}`, { defaultValue: key === 'all' ? 'すべて' : key })}
              </option>
            ))}
          </select>
          <span className="font-mono text-[10px] text-[var(--ds-color-fg-subtle)] sm:text-right">
            {resultCount} {t('fanclub.resultUnit', { defaultValue: '件' })}
          </span>
        </div>
      </div>
    </SectionReveal>
  )
}
