import { useState, useEffect, useRef } from 'react'

const CHARS = '!<>-_\\/[]{}—=+*^?#01アイウエオ'

interface ScrambleOptions {
  /** How many ms to run the scramble animation. Default: 800 */
  duration?: number
  /** ms delay before scramble starts. Default: 0 */
  delay?: number
  /** Trigger the scramble on mount or on hover toggle. Default: 'mount' */
  trigger?: 'mount' | 'manual'
}

/**
 * Text scramble / matrix decode effect.
 * Returns the currently-displayed text and a `scramble()` function to re-trigger.
 *
 * Usage:
 *   const { text, scramble } = useTextScramble('Hello World', { duration: 700 })
 *   <span onMouseEnter={scramble}>{text}</span>
 */
export function useTextScramble(
  target: string,
  options: ScrambleOptions = {},
) {
  const { duration = 800, delay = 0, trigger = 'mount' } = options
  const [text, setText] = useState(target)
  const frameRef   = useRef<number | null>(null)
  const startRef   = useRef<number | null>(null)
  const resolvedRef = useRef<boolean[]>([])

  const scramble = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    startRef.current = null
    resolvedRef.current = new Array(target.length).fill(false)

    const tick = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed  = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Resolve characters left→right as progress increases
      const resolvedCount = Math.floor(progress * target.length)

      let output = ''
      for (let i = 0; i < target.length; i++) {
        if (target[i] === ' ') {
          output += ' '
          continue
        }
        if (i < resolvedCount) {
          resolvedRef.current[i] = true
          output += target[i]
        } else {
          output += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setText(output)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setText(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (trigger !== 'mount') return
    const id = setTimeout(scramble, delay)
    return () => {
      clearTimeout(id)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  // When target string changes, always reset to new target
  useEffect(() => {
    setText(target)
  }, [target])

  return { text, scramble }
}
