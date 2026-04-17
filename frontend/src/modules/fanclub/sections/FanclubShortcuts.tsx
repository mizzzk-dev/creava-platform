import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SectionReveal from '@/components/common/SectionReveal'
import { ROUTES } from '@/lib/routeConstants'
import { storeLink } from '@/lib/siteLinks'

interface Shortcut {
  to: string
  labelKey: string
  defaultLabel: string
  descKey: string
  defaultDesc: string
  tone: 'violet' | 'default'
  iconPath: string
}

const SHORTCUTS: Shortcut[] = [
  {
    to: ROUTES.MEMBER,
    labelKey: 'nav.member',
    defaultLabel: 'マイページ',
    descKey: 'fanclub.shortcut.memberDesc',
    defaultDesc: '会員情報・視聴履歴・特典状況を確認',
    tone: 'violet',
    iconPath: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
  },
  {
    to: storeLink(ROUTES.STORE),
    labelKey: 'fanclub.shortcut.storeLabel',
    defaultLabel: 'ストアで特典を使う',
    descKey: 'fanclub.shortcut.storeDesc',
    defaultDesc: '会員向け先行・限定販売・特典価格をチェック',
    tone: 'default',
    iconPath: 'M3 7h3l2 12h10l2-9H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  },
  {
    to: ROUTES.NEWS,
    labelKey: 'fanclub.shortcut.newsLabel',
    defaultLabel: '最新ニュース',
    descKey: 'fanclub.shortcut.newsDesc',
    defaultDesc: 'ドロップ・公開・更新案内',
    tone: 'default',
    iconPath: 'M4 6h16M4 10h16M4 14h10M4 18h10',
  },
  {
    to: ROUTES.FAQ,
    labelKey: 'fanclub.shortcut.faqLabel',
    defaultLabel: 'FAQ / ヘルプ',
    descKey: 'fanclub.shortcut.faqDesc',
    defaultDesc: '入会・決済・特典の質問をまとめています',
    tone: 'default',
    iconPath: 'M9 9a3 3 0 1 1 4 2.8c-.8.3-1 .8-1 1.7V14m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  },
]

export default function FanclubShortcuts() {
  const { t } = useTranslation()

  return (
    <SectionReveal delay={0.05}>
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-indigo-50/40 p-5 dark:border-violet-900/30 dark:from-violet-950/30 dark:via-transparent dark:to-indigo-950/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-500/10" />
        <div className="relative">
          <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
            {t('fanclub.ctaLead', { defaultValue: '会員向けショートカット' })}
          </p>
          <p className="mt-0.5 text-xs text-violet-700/70 dark:text-violet-300/70">
            {t('fanclub.ctaLeadSub', { defaultValue: '次に行きたい場所へ、最短で。' })}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SHORTCUTS.map((s) => {
              const toneClasses =
                s.tone === 'violet'
                  ? 'border-violet-300 bg-white text-violet-700 hover:border-violet-400 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200'
                  : 'border-[var(--ds-color-border-default)] bg-[var(--ds-color-bg-surface)] text-[var(--ds-color-fg-default)] hover:border-[var(--ds-color-border-strong)]'
              return (
                <Link
                  key={s.labelKey}
                  to={s.to}
                  className={`group flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${toneClasses}`}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100/60 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.iconPath} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {t(s.labelKey, { defaultValue: s.defaultLabel })}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--ds-color-fg-muted)] dark:text-violet-200/60">
                      {t(s.descKey, { defaultValue: s.defaultDesc })}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs opacity-60 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </SectionReveal>
  )
}
