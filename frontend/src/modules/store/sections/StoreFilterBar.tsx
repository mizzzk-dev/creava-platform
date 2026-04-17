import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import { DISPLAY_CURRENCIES } from '@/modules/store/lib/currency'
import type { DisplayCurrency } from '@/modules/store/lib/currency'
import { getRegionCommercePolicy } from '@/modules/store/lib/commerceOptimization'

const STATUS_FILTERS = ['all', 'available', 'coming_soon', 'soldout'] as const
const SORT_OPTIONS = ['recommended', 'newest', 'priceAsc', 'priceDesc'] as const

export type StatusFilter = (typeof STATUS_FILTERS)[number]
export type SortOption = (typeof SORT_OPTIONS)[number]
export type StoreRegion = 'JP' | 'US' | 'EU' | 'ROW'

interface Props {
  statusFilter: StatusFilter
  onStatusFilterChange: (status: StatusFilter) => void
  hideSoldOut: boolean
  onHideSoldOutChange: (value: boolean) => void
  query: string
  onQueryChange: (value: string) => void
  sortBy: SortOption
  onSortByChange: (value: SortOption) => void
  selectedCategory: string
  onSelectedCategoryChange: (value: string) => void
  categories: string[]
  currency: DisplayCurrency
  onCurrencyChange: (value: DisplayCurrency) => void
  region: StoreRegion
  onRegionChange: (value: StoreRegion) => void
  resultCount: number
}

function StatusChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`interactive-chip ${active ? 'active' : ''}`}
    >
      {label}
    </button>
  )
}

export default function StoreFilterBar({
  statusFilter,
  onStatusFilterChange,
  hideSoldOut,
  onHideSoldOutChange,
  query,
  onQueryChange,
  sortBy,
  onSortByChange,
  selectedCategory,
  onSelectedCategoryChange,
  categories,
  currency,
  onCurrencyChange,
  region,
  onRegionChange,
  resultCount,
}: Props) {
  const { t } = useTranslation()
  const regionPolicy = getRegionCommercePolicy(region)

  return (
    <SectionReveal>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] p-5 shadow-sm">
        {/* ステータスフィルター */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--ds-color-border-subtle)]">
          {STATUS_FILTERS.map((status) => (
            <StatusChip
              key={status}
              active={statusFilter === status}
              onClick={() => onStatusFilterChange(status)}
              label={
                status === 'all' ? t('store.filterAll', { defaultValue: 'すべて' })
                : status === 'available' ? t('store.filterAvailable', { defaultValue: '販売中' })
                : status === 'coming_soon' ? t('store.filterComingSoon', { defaultValue: '販売準備中' })
                : t('store.filterSoldOut', { defaultValue: '完売' })
              }
            />
          ))}
          <span className="font-mono text-[10px] text-[var(--ds-color-fg-subtle)] ml-1">
            {resultCount} {t('store.resultUnit', { defaultValue: '件' })}
          </span>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--ds-color-fg-muted)]">
            <input
              type="checkbox"
              checked={hideSoldOut}
              onChange={(e) => onHideSoldOutChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-violet-600"
            />
            {t('store.hideSoldOut', { defaultValue: '完売を非表示' })}
          </label>
        </div>

        {/* 検索・ソート・カテゴリ */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-color-fg-subtle)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t('store.searchPlaceholder', { defaultValue: '商品名・カテゴリ・タグで検索' })}
              className="input-surface w-full py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="input-surface w-full px-3 py-2 text-sm"
            aria-label={t('store.sortLabel', { defaultValue: '並び替え' })}
          >
            <option value="recommended">{t('store.sortRecommended', { defaultValue: 'おすすめ順' })}</option>
            <option value="newest">{t('store.sortNewest', { defaultValue: '新着順' })}</option>
            <option value="priceAsc">{t('store.sortPriceAsc', { defaultValue: '価格が安い順' })}</option>
            <option value="priceDesc">{t('store.sortPriceDesc', { defaultValue: '価格が高い順' })}</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => onSelectedCategoryChange(e.target.value)}
            className="input-surface w-full px-3 py-2 text-sm"
            aria-label={t('store.categoryLabel', { defaultValue: 'カテゴリ' })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('store.filterAll', { defaultValue: 'すべて' }) : c}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as DisplayCurrency)}
              className="input-surface flex-1 px-3 py-2 text-sm"
              aria-label={t('store.currencyLabel', { defaultValue: '表示通貨' })}
            >
              {DISPLAY_CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <select
              value={region}
              onChange={(e) => onRegionChange(e.target.value as StoreRegion)}
              className="input-surface w-20 px-2 py-2 text-sm"
              aria-label={t('store.regionLabel', { defaultValue: '地域' })}
            >
              <option value="JP">JP</option>
              <option value="US">US</option>
              <option value="EU">EU</option>
              <option value="ROW">ROW</option>
            </select>
          </div>
        </div>

        <p className="mt-3 font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">
          {t('store.regionNotice', {
            defaultValue: `通貨:${regionPolicy.currency} / 送料:${regionPolicy.shippingFee} / 税率:${Math.round(regionPolicy.taxRate * 100)}% / 配送:${regionPolicy.canShip ? '可' : '不可'}`,
          })}
        </p>
      </div>
    </SectionReveal>
  )
}

export { STATUS_FILTERS, SORT_OPTIONS }
