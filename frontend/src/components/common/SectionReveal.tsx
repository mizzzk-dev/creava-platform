import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSeasonalTheme } from '@/modules/seasonal/context'

interface SectionRevealProps extends PropsWithChildren {
  className?: string
  delay?: number
}

export default function SectionReveal({ children, className, delay = 0 }: SectionRevealProps) {
  const reduceMotion = useReducedMotion()
  const { config } = useSeasonalTheme()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  const offset = config.scrollPreset === 'dramatic' ? 30 : 20
  const duration = config.scrollPreset === 'soft' ? 0.7 : 0.55

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}
