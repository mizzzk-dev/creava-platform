import { useTheme } from '@/lib/theme'
import { trackCtaClick } from '@/modules/analytics/tracking'

const ICONS = {
  light: (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
  dark: (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  ),
  system: (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  ),
}

const CYCLE = ['system', 'light', 'dark'] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function toggle() {
    const idx = CYCLE.indexOf(theme as typeof CYCLE[number])
    const nextTheme = CYCLE[(idx + 1) % CYCLE.length]
    setTheme(nextTheme)
    trackCtaClick('global', 'theme_switch', { from: theme, to: nextTheme })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Theme: ${theme}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 text-gray-500 shadow-sm shadow-gray-200/40 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:shadow-black/20 dark:hover:border-gray-500 dark:hover:text-gray-100"
    >
      {ICONS[theme as keyof typeof ICONS] ?? ICONS.system}
    </button>
  )
}
