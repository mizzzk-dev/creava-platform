import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import { ROUTES } from '@/lib/routeConstants'

export default function StoreFooterCta() {
  const { t } = useTranslation()

  return (
    <SectionReveal delay={0.05}>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--ds-color-border-default)] bg-gradient-to-br from-[var(--ds-color-bg-surface)] via-[var(--ds-color-bg-surface)] to-violet-50/40 px-6 py-5 dark:to-violet-950/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-500/10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ds-color-fg-default)]">{t('store.fcNote')}</p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">{t('store.stripeNote')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={ROUTES.CART}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--ds-color-fg-default)] transition-all hover:border-[var(--ds-color-border-strong)] hover:shadow-sm"
            >
              {t('cart.goToCart', { defaultValue: 'カートを見る' })} →
            </Link>
            <Link
              to={ROUTES.FANCLUB}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-md dark:bg-violet-700 dark:hover:bg-violet-600"
            >
              {t('home.fanclub.joinButton')} <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
