import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_KEY = 'creava_loaded'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      setVisible(false)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
    }, 1400)
    return () => clearTimeout(timer)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
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

            {/* wordmark with stagger */}
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
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`text-lg font-medium tracking-tight ${
                    i >= 2
                      ? 'text-violet-400 dark:text-violet-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* progress bar */}
            <motion.div
              className="h-px w-24 overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-violet-400 to-violet-300"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.0, delay: 0.3, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
