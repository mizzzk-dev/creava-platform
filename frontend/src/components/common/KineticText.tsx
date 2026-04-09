import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

/* ── SplitChars: renders text as individually animated spans ── */

interface SplitCharsProps {
  text: string
  /** framer-motion MotionValue<number> 0→1 controlling reveal */
  progress?: ReturnType<typeof useTransform>
  /** Stagger delay per character in ms. Default: 30 */
  staggerMs?: number
  className?: string
  charClassName?: string
}

/**
 * Renders each character as a `<motion.span>` that reveals
 * upward with a clip-path as `progress` goes 0 → 1.
 */
export function SplitChars({ text, staggerMs = 30, className = '', charClassName = '' }: SplitCharsProps) {
  const chars = text.split('')
  return (
    <span className={`inline-block overflow-hidden ${className}`} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className={`inline-block ${charClassName}`}
          initial={{ y: '110%', opacity: 0 }}
          whileInView={{ y: '0%', opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.55,
            delay: i * (staggerMs / 1000),
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

/* ── SplitWords: word-level reveal ─────────────────────────── */

interface SplitWordsProps {
  text: string
  staggerMs?: number
  className?: string
  wordClassName?: string
}

export function SplitWords({ text, staggerMs = 60, className = '', wordClassName = '' }: SplitWordsProps) {
  const words = text.split(' ')
  return (
    <span className={`inline ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden" style={{ marginRight: '0.25em' }}>
          <motion.span
            aria-hidden="true"
            className={`inline-block ${wordClassName}`}
            initial={{ y: '110%', opacity: 0 }}
            whileInView={{ y: '0%', opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.6,
              delay: i * (staggerMs / 1000),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ── KineticScroll: scroll-velocity distortion ──────────────── */

interface KineticScrollProps {
  children: ReactNode
  /** How strongly velocity affects skew. Default: 0.5 */
  intensity?: number
  className?: string
}

/**
 * Wraps children and applies a scroll-velocity-driven skewX.
 * As the user scrolls fast, the element skews; at rest it snaps back.
 */
export function KineticScroll({ children, intensity = 0.5, className = '' }: KineticScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  // Velocity → skew (via spring for smooth return)
  const prevY = useRef(0)
  const skew = useSpring(
    useTransform(scrollY, (v) => {
      const vel = (v - prevY.current) * intensity * 0.05
      prevY.current = v
      return Math.max(-8, Math.min(8, vel))
    }),
    { stiffness: 80, damping: 20, mass: 0.5 }
  )

  return (
    <motion.div ref={ref} style={{ skewX: skew }} className={className}>
      {children}
    </motion.div>
  )
}

/* ── ParallaxText: marquee that reacts to scroll ────────────── */

interface ParallaxTextProps {
  children: string
  /** Speed multiplier. Default: 5 */
  speed?: number
  className?: string
}

/**
 * Horizontally scrolling marquee text that accelerates/decelerates
 * based on scroll direction and velocity.
 */
export function ParallaxText({ children, speed = 5, className = '' }: ParallaxTextProps) {
  const { scrollY } = useScroll()
  const x = useTransform(scrollY, [0, 3000], [0, -speed * 300])
  const smoothX = useSpring(x, { stiffness: 60, damping: 20 })

  const doubled = `${children}  ·  ${children}  ·  ${children}  ·  `

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div style={{ x: smoothX }} className="whitespace-nowrap">
        <span className="font-display text-[clamp(3rem,10vw,8rem)] font-bold tracking-tight select-none">
          {doubled}
        </span>
      </motion.div>
    </div>
  )
}
