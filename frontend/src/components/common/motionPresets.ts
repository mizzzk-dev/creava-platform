import type { Variants, Transition } from 'framer-motion'

/* ── Shared easings ────────────────────────────────── */
const EASE_OUT: [number, number, number, number]    = [0.22, 1, 0.36, 1]
const EASE_SPRING: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
const EASE_SMOOTH: [number, number, number, number] = [0.4, 0, 0.2, 1]

/* ── Shared transitions ─────────────────────────────── */
export const motionTransition = {
  base:   { duration: 0.45, ease: EASE_OUT } as Transition,
  soft:   { duration: 0.6,  ease: EASE_OUT } as Transition,
  hover:  { duration: 0.22, ease: 'easeOut' } as Transition,
  spring: { duration: 0.5,  ease: EASE_SPRING } as Transition,
  smooth: { duration: 0.4,  ease: EASE_SMOOTH } as Transition,
  fast:   { duration: 0.18, ease: 'easeOut' } as Transition,
}

/* ── Preset variants ────────────────────────────────── */
export const motionPresets: Record<string, Variants> = {

  /* ── Legacy (keep existing names working) ─────── */
  heroReveal: {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: motionTransition.soft },
  },
  sectionFadeIn: {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: motionTransition.base },
  },
  cardLift: {
    rest:  { y: 0 },
    hover: { y: -4, transition: motionTransition.hover },
  },
  badgePulseSoft: {
    rest:  { scale: 1,    opacity: 0.88 },
    hover: { scale: 1.04, opacity: 1,   transition: motionTransition.hover },
  },
  illustrationFloatSoft: {
    rest:    { y: 0 },
    animate: {
      y: [0, -6, 0],
      transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },


  /* ── Cyber-editorial: Entrance ────────────────── */

  /** Clip-path reveal from bottom — cinematic */
  textReveal: {
    hidden:  {
      opacity: 0,
      y: 28,
      clipPath: 'inset(100% 0% 0% 0%)',
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0% 0% 0% 0%)',
      transition: { duration: 0.65, ease: EASE_OUT },
    },
  },

  /** Soft fade up — subtler than textReveal */
  fadeUp: {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
  },

  /** Scale + fade in */
  scaleIn: {
    hidden:  { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1,   transition: { duration: 0.5, ease: EASE_OUT } },
  },

  /** Slide in from left */
  slideInLeft: {
    hidden:  { opacity: 0, x: -32 },
    visible: { opacity: 1, x: 0,   transition: { duration: 0.55, ease: EASE_OUT } },
  },

  /** Slide in from right */
  slideInRight: {
    hidden:  { opacity: 0, x: 32 },
    visible: { opacity: 1, x: 0,  transition: { duration: 0.55, ease: EASE_OUT } },
  },

  /** Card entrance — deeper lift + slight scale */
  cardReveal: {
    hidden:  { opacity: 0, y: 40, scale: 0.96 },
    visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.6, ease: EASE_OUT } },
  },

  /** Glitch-style reveal — x-jitter then settle */
  glitchReveal: {
    hidden:  { opacity: 0, x: -6, filter: 'blur(2px)' },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: EASE_OUT },
    },
  },

  /** Blur to sharp — depth of field effect */
  focusIn: {
    hidden:  { opacity: 0, filter: 'blur(8px)', scale: 1.04 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: { duration: 0.7, ease: EASE_SMOOTH },
    },
  },

  /** Cyber scan: fade in with slight Y float, no clip */
  cyberFadeIn: {
    hidden:  { opacity: 0, y: 12, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.5, ease: EASE_OUT },
    },
  },


  /* ── Stagger containers ───────────────────────── */

  /** Stagger wrapper — children animate with offset */
  staggerContainer: {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  },

  /** Faster stagger — for tight lists */
  staggerFast: {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.02,
      },
    },
  },

  /** Slower stagger — for hero sequences */
  staggerSlow: {
    hidden:  {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  },


  /* ── Hover states ────────────────────────────── */

  /** Card lift with subtle glow preparation */
  cardHoverLift: {
    rest:  { y: 0, scale: 1 },
    hover: { y: -6, scale: 1.01, transition: motionTransition.hover },
  },

  /** Subtle scale — for badges, icons */
  scalePop: {
    rest:  { scale: 1 },
    hover: { scale: 1.06, transition: { ...motionTransition.hover, ease: EASE_SPRING } },
  },

  /** Arrow nudge right */
  arrowNudge: {
    rest:  { x: 0 },
    hover: { x: 4, transition: motionTransition.hover },
  },

  /** Underline expand */
  underlineExpand: {
    rest:  { scaleX: 0, originX: 0 },
    hover: { scaleX: 1, originX: 0, transition: motionTransition.hover },
  },


  /* ── Continuous animations ───────────────────── */

  /** Continuous vertical float */
  floatContinuous: {
    animate: {
      y: [0, -8, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  /** Slow float */
  floatSlow: {
    animate: {
      y: [0, -14, 0],
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  /** Pulse opacity */
  pulseOpacity: {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  /** Spin continuous — for loader rings etc */
  spinContinuous: {
    animate: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: 'linear' },
    },
  },
}

export type MotionPresetName = keyof typeof motionPresets
