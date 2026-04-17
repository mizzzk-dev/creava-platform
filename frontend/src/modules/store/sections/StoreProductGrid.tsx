import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import SkeletonProductCard from '@/components/common/SkeletonProductCard'
import ProductCard from '@/modules/store/components/ProductCard'
import { trackEvent } from '@/modules/analytics'
import { ROUTES } from '@/lib/routeConstants'
import type { StoreProductSummary } from '@/modules/store/types'
import type { DisplayCurrency } from '@/modules/store/lib/currency'

interface Props {
  products: StoreProductSummary[]
  loading: boolean
  error: string | null
  currency: DisplayCurrency
  totalCount: number
  onResetFilters?: () => void
}

export default function StoreProductGrid({ products, loading, error, currency, totalCount, onResetFilters }: Props) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div id="store-products" className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-mono text-sm text-red-500 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        ! {t('common.error')}
      </p>
    )
  }

  if (products.length === 0) {
    return (
      <SectionReveal>
        <div className="rounded-2xl border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-muted)] px-8 py-16 text-center">
          <p className="font-mono text-sm text-[var(--ds-color-fg-subtle)]">
            {totalCount === 0
              ? t('home.store.comingSoon')
              : t('store.emptyFiltered', { defaultValue: '条件に合う商品が見つかりません。' })}
          </p>
          <p className="mt-2 text-xs text-[var(--ds-color-fg-subtle)]">
            {totalCount === 0 ? t('store.empty') : t('store.emptyFilteredHint', { defaultValue: 'フィルターをリセットするか、他のキーワードをお試しください。' })}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {totalCount > 0 && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--ds-color-fg-default)] transition-all hover:border-[var(--ds-color-border-strong)] hover:shadow-sm"
              >
                {t('store.resetFilters', { defaultValue: 'フィルターをリセット' })}
              </button>
            )}
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--ds-color-fg-default)] transition-all hover:border-[var(--ds-color-border-strong)] hover:shadow-sm"
            >
              {t('store.requestCta')} →
            </Link>
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center gap-1 font-mono text-xs text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              {t('store.emptySubCta')} →
            </Link>
          </div>
        </div>
      </SectionReveal>
    )
  }

  return (
    <div id="store-products" className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} onClick={() => trackEvent('store_product_card_click', { slug: p.slug })}>
          <ProductCard product={p} displayCurrency={currency} />
        </div>
      ))}
    </div>
  )
}
