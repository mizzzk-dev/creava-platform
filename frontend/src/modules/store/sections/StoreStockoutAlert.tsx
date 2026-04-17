import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import type { StockoutForecast } from '@/modules/store/lib/commerceOptimization'

interface Props {
  forecasts: StockoutForecast[]
}

export default function StoreStockoutAlert({ forecasts }: Props) {
  const { t } = useTranslation()
  if (forecasts.length === 0) return null

  return (
    <SectionReveal delay={0.05}>
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
            {t('store.stockoutTitle', { defaultValue: '在庫予測 / 欠品予防' })}
          </p>
        </div>
        <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
          {forecasts.map((row) => (
            <li key={row.productId} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{row.productTitle}</span>
              <span className="text-amber-700/80 dark:text-amber-200/70">
                {t('store.stockoutSummary', {
                  defaultValue: `${row.daysUntilStockout}日で欠品予測 (${row.estimatedStockoutDate})`,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  )
}
