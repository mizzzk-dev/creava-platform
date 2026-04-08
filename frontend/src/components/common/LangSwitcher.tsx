import { useTranslation } from 'react-i18next'
import { trackCtaClick } from '@/modules/analytics/tracking'

const LANGS = [
  { code: 'ja', label: 'JA' },
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
] as const

export default function LangSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2) ?? 'ja'

  function switchLang(code: string) {
    i18n.changeLanguage(code)
    trackCtaClick('global', 'language_switch', { language: code })
  }

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200/80 bg-white/80 p-0.5 text-[11px] shadow-sm shadow-gray-200/40 dark:border-gray-700 dark:bg-gray-900/80 dark:shadow-black/20">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLang(code)}
          className={`rounded-full px-2.5 py-1 font-mono tracking-wide transition-all ${
            current === code
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
          aria-label={`Switch to ${label}`}
          aria-pressed={current === code}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
