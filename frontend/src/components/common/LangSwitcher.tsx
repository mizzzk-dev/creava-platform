import { useTranslation } from 'react-i18next'

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
  }

  return (
    <div className="flex items-center gap-0.5">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLang(code)}
          className={`rounded px-1.5 py-1 font-mono text-[10px] font-medium transition-colors ${
            current === code
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400'
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
