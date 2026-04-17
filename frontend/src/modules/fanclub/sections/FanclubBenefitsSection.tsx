import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'

interface Benefit {
  key: string
  titleKey: string
  titleDefault: string
  descKey: string
  descDefault: string
  tone: 'violet' | 'cyan' | 'amber' | 'rose'
  iconPath: string
}

const BENEFITS: Benefit[] = [
  {
    key: 'exclusive',
    titleKey: 'fanclub.benefit.exclusiveTitle',
    titleDefault: '限定コンテンツ',
    descKey: 'fanclub.benefit.exclusiveDesc',
    descDefault: '会員限定の動画・写真・音源を毎週公開します。',
    tone: 'violet',
    iconPath: 'M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 15.7 7 18.2l1-5.5-4-3.9 5.5-.8L12 3z',
  },
  {
    key: 'earlyAccess',
    titleKey: 'fanclub.benefit.earlyAccessTitle',
    titleDefault: '先行アクセス',
    descKey: 'fanclub.benefit.earlyAccessDesc',
    descDefault: '新作・ドロップ・イベントは会員が先に知れます。',
    tone: 'cyan',
    iconPath: 'M12 4l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V8l8-4z',
  },
  {
    key: 'storeDiscount',
    titleKey: 'fanclub.benefit.storeDiscountTitle',
    titleDefault: 'ストア特典',
    descKey: 'fanclub.benefit.storeDiscountDesc',
    descDefault: '会員価格・限定バンドル・再販優先案内を提供します。',
    tone: 'amber',
    iconPath: 'M3 8h18l-2 11H5L3 8zm4-4h10l1 4H6l1-4z',
  },
  {
    key: 'qa',
    titleKey: 'fanclub.benefit.qaTitle',
    titleDefault: 'Q&A / コミュニティ',
    descKey: 'fanclub.benefit.qaDesc',
    descDefault: '毎月のQ&Aと、会員同士のゆるやかな交流の場。',
    tone: 'rose',
    iconPath: 'M4 5h16v10H8l-4 4V5zm4 4h8M8 12h5',
  },
]

const TONE_BG: Record<Benefit['tone'], string> = {
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
}

export default function FanclubBenefitsSection() {
  const { t } = useTranslation()

  return (
    <SectionReveal delay={0.05}>
      <div className="rounded-2xl border border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[var(--ds-color-border-subtle)] px-5 py-3.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="store-featured-badge">
            {t('fanclub.benefitsTitle', { defaultValue: '会員特典' })}
          </span>
          <span className="ml-2 hidden sm:inline font-mono text-[10px] text-[var(--ds-color-fg-subtle)]">
            — {t('fanclub.benefitsSubtitle', { defaultValue: 'あなたの応援が、次の制作に繋がります' })}
          </span>
        </div>
        <ul className="grid grid-cols-1 divide-y divide-[var(--ds-color-border-subtle)] sm:grid-cols-2 sm:divide-y-0 sm:[&>li:nth-child(n+3)]:border-t">
          {BENEFITS.map((b, idx) => (
            <li
              key={b.key}
              className={`flex items-start gap-3 px-5 py-4 ${idx % 2 === 0 ? 'sm:border-r sm:border-[var(--ds-color-border-subtle)]' : ''}`}
            >
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_BG[b.tone]}`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={b.iconPath} />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--ds-color-fg-default)]">
                  {t(b.titleKey, { defaultValue: b.titleDefault })}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--ds-color-fg-muted)]">
                  {t(b.descKey, { defaultValue: b.descDefault })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionReveal>
  )
}
