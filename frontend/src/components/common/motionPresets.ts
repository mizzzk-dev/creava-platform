import type { Variants, Transition } from 'framer-motion'

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const motionTransition = {
  base: { duration: 0.45, ease: EASE_OUT } as Transition,
  soft: { duration: 0.6, ease: EASE_OUT } as Transition,
  hover: { duration: 0.22, ease: 'easeOut' } as Transition,
}

export const motionPresets: Record<string, Variants> = {
  heroReveal: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: motionTransition.soft },
  },
  sectionFadeIn: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: motionTransition.base },
  },
  cardLift: {
    rest: { y: 0 },
    hover: { y: -4, transition: motionTransition.hover },
  },
  badgePulseSoft: {
    rest: { scale: 1, opacity: 0.88 },
    hover: { scale: 1.04, opacity: 1, transition: motionTransition.hover },
  },
  illustrationFloatSoft: {
    rest: { y: 0 },
    animate: {
      y: [0, -6, 0],
      transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
}

export type MotionPresetName = keyof typeof motionPresets
