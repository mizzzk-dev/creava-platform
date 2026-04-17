import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import SectionReveal from '@/components/common/SectionReveal'
import ProductCard from '@/modules/store/components/ProductCard'
import type { StoreProductSummary } from '@/modules/store/types'
import type { DisplayCurrency } from '@/modules/store/lib/currency'

interface Props {
  title: string
  subtitle?: string
  products: StoreProductSummary[]
  currency: DisplayCurrency
  accent?: 'violet' | 'subtle'
  itemKeyPrefix?: string
  trackingLocation?: string
}

export default function StoreEditorialPickup({
  title,
  subtitle,
  products,
  currency,
  accent = 'violet',
  itemKeyPrefix = 'editorial',
  trackingLocation,
}: Props) {
  const { t } = useTranslation()
  if (products.length === 0) return null

  const dotClass = accent === 'violet' ? 'bg-violet-500' : 'bg-[var(--ds-color-fg-subtle)]'
  const titleTone = accent === 'subtle' ? 'text-[var(--ds-color-fg-subtle)]' : undefined

  return (
    <SectionReveal>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
            <span className={`store-featured-badge ${titleTone ?? ''}`}>{title}</span>
            {subtitle && (
              <span className="hidden sm:inline font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">
                — {subtitle}
              </span>
            )}
          </div>
          <span className="font-mono text-[9px] text-[var(--ds-color-fg-subtle)] uppercase tracking-widest">
            {products.length} {t('store.itemsUnit', { defaultValue: 'items' })}
          </span>
        </div>
        <div className="p-4 sm:p-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <motion.div
              key={`${itemKeyPrefix}-${p.id}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard
                product={p}
                displayCurrency={currency}
                trackingLocation={trackingLocation ?? `store_${itemKeyPrefix}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionReveal>
  )
}
