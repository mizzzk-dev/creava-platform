import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/common/ui/Button'
import { getOmikujiResult, isFirstNewYearVisit, markNewYearVisited, setOmikujiResult } from '@/modules/seasonal/storage'
import { useSeasonalTheme } from '@/modules/seasonal/context'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { SeasonalSite } from '@/modules/seasonal/types'

type OmikujiResult = 'great_blessing' | 'middle_blessing' | 'small_blessing' | 'blessing' | 'future_blessing' | 'curse'

const OMIKUJI: OmikujiResult[] = ['great_blessing', 'middle_blessing', 'small_blessing', 'blessing', 'future_blessing', 'curse']

export default function NewYearExperience({ site }: { site: SeasonalSite }) {
  const { t } = useTranslation()
  const { resolution } = useSeasonalTheme()
  const year = new Date().getFullYear()
  const [open, setOpen] = useState(() => resolution.theme === 'newyear' && resolution.newyearIntroEnabled && (!resolution.firstVisitOnlyEnabled || isFirstNewYearVisit(site, year)))
  const [result, setResult] = useState<OmikujiResult | null>(() => {
    const stored = getOmikujiResult(site, year)
    return stored && OMIKUJI.includes(stored as OmikujiResult) ? (stored as OmikujiResult) : null
  })

  const shouldShowDraw = resolution.omikujiEnabled && !result
  const resultMessage = useMemo(() => (result ? t(`seasonal.omikuji.${result}`) : ''), [result, t])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[220] grid place-items-center bg-black/55 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-md rounded-3xl border border-amber-300/50 bg-white p-6 shadow-2xl dark:border-amber-800/70 dark:bg-gray-900">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">happy new year {year}</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('seasonal.newyear.overlayTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('seasonal.newyear.overlayBody')}</p>

          {shouldShowDraw ? (
            <div className="mt-5">
              <Button
                variant="accent"
                onClick={() => {
                  const pick = OMIKUJI[Math.floor(Math.random() * OMIKUJI.length)]
                  setResult(pick)
                  setOmikujiResult(site, pick, year)
                  trackMizzzEvent('omikuji_draw', { site, year, result: pick })
                }}
              >
                {t('seasonal.newyear.drawOmikuji')}
              </Button>
            </div>
          ) : null}

          {result ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{resultMessage}</p> : null}

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={() => {
              markNewYearVisited(site, year)
              trackMizzzEvent('newyear_overlay_close', { site, year, hasResult: Boolean(result) })
              setOpen(false)
            }}>
              {t('common.close')}
            </Button>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
