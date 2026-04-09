import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface SectionRevealProps extends PropsWithChildren {
  className?: string
  delay?: number
}

export default function SectionReveal({ children, className, delay = 0 }: SectionRevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}
