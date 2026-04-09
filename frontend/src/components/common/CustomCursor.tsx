import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

type CursorVariant = 'default' | 'pointer' | 'view' | 'text' | 'drag'

/**
 * Custom cursor: small dot (exact) + larger ring (spring-lagged).
 * Morphs based on what the cursor is hovering.
 * Hidden on touch-only devices and when prefers-reduced-motion is set.
 */
export default function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [variant, setVariant] = useState<CursorVariant>('default')
  const [label, setLabel] = useState('')

  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)

  // Ring follows with spring lag
  const ringX = useSpring(mx, { stiffness: 180, damping: 22, mass: 0.5 })
  const ringY = useSpring(my, { stiffness: 180, damping: 22, mass: 0.5 })

  const rafRef = useRef<number | null>(null)

  const onMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      mx.set(e.clientX)
      my.set(e.clientY)
    })
    if (!visible) setVisible(true)
  }, [mx, my, visible])

  const onLeave = useCallback(() => setVisible(false), [])
  const onEnter = useCallback(() => setVisible(true), [])

  useEffect(() => {
    // Don't mount on touch-only or reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchOnly = window.matchMedia('(hover: none)').matches
    if (prefersReducedMotion || isTouchOnly) return

    // Hide the native cursor globally
    document.documentElement.style.cursor = 'none'

    const detectVariant = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return

      const el = target.closest('a, button, [data-cursor], [role="button"]')
      const isImg = target.closest('img, [data-cursor="view"]')
      const isText = target.closest('p, h1, h2, h3, h4, span, li')
      const isDrag = target.closest('[data-cursor="drag"]')

      if (isDrag) {
        setVariant('drag')
        setLabel('drag')
      } else if (isImg) {
        setVariant('view')
        setLabel('VIEW')
      } else if (el) {
        setVariant('pointer')
        setLabel('')
      } else if (isText) {
        setVariant('text')
        setLabel('')
      } else {
        setVariant('default')
        setLabel('')
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousemove', detectVariant, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      document.documentElement.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousemove', detectVariant)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onMove, onLeave, onEnter])

  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null

  /* ── Variant config ─────────────────────────────── */
  const ringSize = {
    default: 36,
    pointer: 52,
    view:    64,
    text:    4,
    drag:    52,
  }[variant]

  const ringColor = {
    default: 'rgba(6,182,212,0.5)',
    pointer: 'rgba(6,182,212,0.7)',
    view:    'rgba(245,158,11,0.7)',
    text:    'rgba(6,182,212,0.9)',
    drag:    'rgba(139,92,246,0.7)',
  }[variant]

  const ringBorder = {
    default: '1px solid rgba(6,182,212,0.35)',
    pointer: '1px solid rgba(6,182,212,0.5)',
    view:    '1px solid rgba(245,158,11,0.5)',
    text:    'none',
    drag:    '1px solid rgba(139,92,246,0.5)',
  }[variant]

  const dotSize = variant === 'text' ? 2 : 5

  return (
    <>
      {/* Dot — follows cursor exactly */}
      <motion.div
        className="pointer-events-none fixed z-[9999] rounded-full"
        style={{
          x: mx,
          y: my,
          translateX: '-50%',
          translateY: '-50%',
          width: dotSize,
          height: dotSize,
          backgroundColor: variant === 'view' ? 'rgba(245,158,11,0.9)' : 'rgba(6,182,212,0.9)',
          opacity: visible ? 1 : 0,
          transition: 'width 0.15s ease, height 0.15s ease, background-color 0.2s ease, opacity 0.2s ease',
        }}
      />

      {/* Ring — follows with spring lag */}
      <motion.div
        className="pointer-events-none fixed z-[9998] flex items-center justify-center rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          width: ringSize,
          height: ringSize,
          border: ringBorder,
          background: variant === 'view' || variant === 'drag'
            ? `${ringColor.replace('0.7', '0.08')}`
            : 'transparent',
          opacity: visible ? 1 : 0,
          mixBlendMode: 'normal',
          transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1), height 0.25s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s ease, opacity 0.2s ease',
        }}
      >
        {/* Label for view/drag variants */}
        {label && (
          <span
            className="font-mono tracking-widest"
            style={{
              fontSize: '9px',
              color: variant === 'view' ? 'rgba(245,158,11,0.9)' : 'rgba(139,92,246,0.9)',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            {label}
          </span>
        )}
      </motion.div>
    </>
  )
}
