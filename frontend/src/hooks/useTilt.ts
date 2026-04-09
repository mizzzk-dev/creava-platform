import { useRef, useCallback, type RefObject } from 'react'

interface TiltOptions {
  /** Max tilt angle in degrees. Default: 12 */
  maxTilt?: number
  /** Perspective distance in px. Default: 900 */
  perspective?: number
  /** Scale factor on hover. Default: 1.02 */
  scale?: number
}

interface TiltResult<T extends HTMLElement> {
  ref: RefObject<T>
  onMouseMove: (e: React.MouseEvent<T>) => void
  onMouseLeave: () => void
}

/**
 * 3D card tilt effect based on cursor position within the element.
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>()
 *   <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>...</div>
 */
export function useTilt<T extends HTMLElement>(
  options: TiltOptions = {},
): TiltResult<T> {
  const { maxTilt = 12, perspective = 900, scale = 1.02 } = options
  const ref = useRef<T>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Normalized -1 to 1
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2

      const rotateX = -ny * maxTilt
      const rotateY =  nx * maxTilt

      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
      el.style.transition = 'transform 0.1s ease'
    },
    [maxTilt, perspective, scale],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`
    el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'
  }, [perspective])

  return { ref, onMouseMove, onMouseLeave }
}
