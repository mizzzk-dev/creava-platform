import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_KEY = 'mizzz_loaded'

/**
 * ロード種別を判定する
 * - 'first'  : 初回アクセス（sessionStorage に記録なし かつ navigate タイプ）
 * - 'reload' : F5 / ブラウザリロード（performance API で判定）
 * - 'none'   : SPA ナビゲーション（何も表示しない）
 */
function getLoadType(): 'first' | 'reload' | 'none' {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    if (nav?.type === 'reload') return 'reload'
    if (!sessionStorage.getItem(SESSION_KEY)) return 'first'
    return 'none'
  } catch {
    return 'none'
  }
}

/** 初回アクセス用：フル演出（〜1.4 s） */
function FullLoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onDone()
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
    }, 1400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      key="loading-full"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-gray-950"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-5">
        {/* logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <img src="/logo.svg" alt="" width={36} height={36} />
        </motion.div>

        {/* wordmark stagger */}
        <motion.div
          className="flex items-baseline gap-0.5 font-mono"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
          }}
        >
          {['m', 'i', 'z', 'z', 'z'].map((char, i) => (
            <motion.span
              key={i}
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`text-lg font-medium tracking-tight ${
                i >= 2
                  ? 'text-violet-400'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* progress bar */}
        <div className="h-px w-24 overflow-hidden bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-400 to-violet-300"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.0, delay: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/** リロード用：軽量演出（〜0.5 s） */
function ReloadLoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      key="loading-reload"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-gray-950"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.img
          src="/logo.svg"
          alt=""
          width={28}
          height={28}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        {/* slim progress bar only */}
        <div className="h-px w-16 overflow-hidden bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-violet-400/60"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function LoadingScreen() {
  const [loadType] = useState<'first' | 'reload' | 'none'>(() => getLoadType())
  const [visible, setVisible] = useState(loadType !== 'none')

  if (!visible || loadType === 'none') return null

  return (
    <AnimatePresence>
      {visible && loadType === 'first' && (
        <FullLoadingScreen onDone={() => setVisible(false)} />
      )}
      {visible && loadType === 'reload' && (
        <ReloadLoadingScreen onDone={() => setVisible(false)} />
      )}
    </AnimatePresence>
  )
}
