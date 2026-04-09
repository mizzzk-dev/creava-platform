import { useRef, useCallback, type RefObject } from 'react'

interface MagneticOptions {
  /** How far (px) the element moves toward the cursor. Default: 0.35 */
  strength?: number
  /** Extra scale-up on hover. Default: 1.04 */
  scale?: number
}

interface MagneticResult<T extends HTMLElement> {
  ref: RefObject<T>
  onMouseMove: (e: React.MouseEvent<T>) => void
  onMouseLeave: (e: React.MouseEvent<T>) => void
}

/**
 * Magnetic hover effect — element floats toward the cursor.
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave } = useMagneticHover<HTMLButtonElement>()
 *   <button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>...</button>
 */
export function useMagneticHover<T extends HTMLElement>(
  options: MagneticOptions = {},
): MagneticResult<T> {
  const { strength = 0.35, scale = 1.04 } = options
  const ref = useRef<T>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      const dx = (e.clientX - cx) * strength
      const dy = (e.clientY - cy) * strength
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
      el.style.transition = 'transform 0.15s cubic-bezier(0.22,1,0.36,1)'
    },
    [strength, scale],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate(0px, 0px) scale(1)'
    el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
