import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import Badge from '@/components/common/Badge'

export default function StoreStatusGuide() {
  const { t } = useTranslation()

  return (
    <SectionReveal delay={0.05}>
      <div className="rounded-2xl border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-bg-muted)] px-5 py-4">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[var(--ds-color-fg-subtle)]">
          status guide
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              AVAILABLE
            </span>
            <span className="text-[var(--ds-color-fg-muted)]">
              {t('store.statusAvailable', { defaultValue: '購入可能' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="coming_soon" size="sm" />
            <span className="text-[var(--ds-color-fg-muted)]">
              {t('store.statusComingSoon', { defaultValue: '販売準備中' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="soldout" size="sm" />
            <span className="text-[var(--ds-color-fg-muted)]">
              {t('store.statusSoldout', { defaultValue: '完売。再販情報はNews/FCで案内' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="fc" size="sm" label="MEMBERS" />
            <span className="text-[var(--ds-color-fg-muted)]">
              {t('store.statusMembersShort', { defaultValue: '会員限定商品' })}
            </span>
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
