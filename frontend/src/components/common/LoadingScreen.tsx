import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSeasonalTheme } from '@/modules/seasonal/context'

const SESSION_KEY = 'mizzz_loaded'

function getLoadType(): 'first' | 'reload' | 'none' {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type === 'reload') return 'reload'
    if (!sessionStorage.getItem(SESSION_KEY)) return 'first'
    return 'none'
  } catch {
    return 'none'
  }
}

function SeasonWordmark({ theme }: { theme: string }) {
  const palette = theme === 'christmas'
    ? 'from-emerald-400 to-rose-300'
    : theme === 'halloween'
      ? 'from-orange-400 to-violet-400'
      : theme === 'newyear'
        ? 'from-amber-400 to-rose-400'
        : 'from-violet-400 to-violet-300'

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <img src="/logo.svg" alt="" width={36} height={36} />
      </motion.div>
      <motion.div className="flex items-baseline gap-0.5 font-mono" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } } }}>
        {['m', 'i', 'z', 'z', 'z'].map((char, i) => (
          <motion.span key={i} variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.3, ease: 'easeOut' }} className={`text-lg font-medium tracking-tight ${i >= 2 ? 'bg-gradient-to-r bg-clip-text text-transparent' : 'text-gray-900 dark:text-gray-100'} ${i >= 2 ? palette : ''}`}>
            {char}
          </motion.span>
        ))}
      </motion.div>
      <div className="h-px w-24 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <motion.div className={`h-full bg-gradient-to-r ${palette}`} initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.0, delay: 0.2, ease: 'easeInOut' }} />
      </div>
    </>
  )
}

export default function LoadingScreen() {
  const { config, resolution } = useSeasonalTheme()
  const [loadType] = useState<'first' | 'reload' | 'none'>(() => getLoadType())
  const [visible, setVisible] = useState(loadType !== 'none')

  const duration = useMemo(() => {
    if (loadType === 'reload') return 450
    if (resolution.theme === 'newyear' && resolution.newyearIntroEnabled) return 1700
    return 1300
  }, [loadType, resolution.newyearIntroEnabled, resolution.theme])

  useEffect(() => {
    if (!visible || loadType === 'none') return
    const timer = window.setTimeout(() => {
      setVisible(false)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
    }, duration)
    return () => window.clearTimeout(timer)
  }, [duration, loadType, visible])

  if (!visible || loadType === 'none') return null

  return (
    <AnimatePresence>
      <motion.div key={`loading-${loadType}`} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: loadType === 'reload' ? 0.2 : 0.35, ease: 'easeOut' }} className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-gray-950" aria-hidden="true">
        <div className="flex flex-col items-center gap-5">
          {resolution.theme === 'newyear' && loadType === 'first' && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500">happy new year</p>}
          <SeasonWordmark theme={config.loadingPreset} />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
