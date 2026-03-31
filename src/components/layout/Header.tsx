import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ROUTES } from '@/lib/routes'
import AuthButton from '@/components/auth/AuthButton'

const NAV_ITEMS = [
  { key: 'nav.works', to: ROUTES.WORKS },
  { key: 'nav.news', to: ROUTES.NEWS },
  { key: 'nav.blog', to: ROUTES.BLOG },
  { key: 'nav.fanclub', to: ROUTES.FANCLUB },
  { key: 'nav.contact', to: ROUTES.CONTACT },
] as const

export default function Header() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()

  // ルート変更時にメニューを閉じる
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // メニューを開いている間は背景スクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* ロゴ */}
        <NavLink
          to={ROUTES.HOME}
          className="text-lg font-semibold tracking-tight text-gray-900"
        >
          Creava
        </NavLink>

        {/* デスクトップナビ */}
        <div className="hidden items-center gap-6 md:flex">
          <nav>
            <ul className="flex items-center gap-6">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `text-sm transition-colors ${
                        isActive
                          ? 'font-medium text-gray-900'
                          : 'text-gray-500 hover:text-gray-900'
                      }`
                    }
                  >
                    {t(key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <AuthButton />
        </div>

        {/* ハンバーガーボタン（モバイルのみ） */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={isOpen}
        >
          <span
            className={`block h-px w-5 bg-gray-700 transition-transform duration-300 ${
              isOpen ? 'translate-y-[3px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-5 bg-gray-700 transition-opacity duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-px w-5 bg-gray-700 transition-transform duration-300 ${
              isOpen ? '-translate-y-[9px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* モバイルメニュードロワー */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100 bg-white md:hidden"
          >
            <nav className="px-4 pb-6 pt-4">
              <ul className="flex flex-col">
                {NAV_ITEMS.map(({ key, to }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `block py-3 text-sm transition-colors ${
                          isActive
                            ? 'font-medium text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                        }`
                      }
                    >
                      {t(key)}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <AuthButton />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
