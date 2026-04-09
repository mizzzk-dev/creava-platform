import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  /** Base opacity (target) */
  baseOpacity: number
}

interface Props {
  /** Number of particles. Default: 80 */
  count?: number
  /** Connection line max distance. Default: 120 */
  connectionDistance?: number
  /** Mouse repulsion radius. Default: 100 */
  repulsionRadius?: number
  /** Mouse repulsion force. Default: 0.04 */
  repulsionForce?: number
  /** Particle color (r,g,b). Default: cyan "6,182,212" */
  color?: string
  /** Line color. Default uses same as particles */
  lineColor?: string
  className?: string
}

/**
 * Canvas-based interactive particle field.
 * Particles drift slowly, connect with thin lines when nearby,
 * and scatter from the mouse cursor.
 * Respects prefers-reduced-motion.
 */
export default function ParticleField({
  count = 70,
  connectionDistance = 120,
  repulsionRadius = 100,
  repulsionForce = 0.04,
  color = '6,182,212',
  lineColor,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const mouse = { x: -9999, y: -9999 }
    let particles: Particle[] = []

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      canvas.width  = rect?.width  ?? window.innerWidth
      canvas.height = rect?.height ?? window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = Array.from({ length: count }, () => ({
        x:           Math.random() * canvas.width,
        y:           Math.random() * canvas.height,
        vx:          (Math.random() - 0.5) * 0.25,
        vy:          (Math.random() - 0.5) * 0.25,
        radius:      Math.random() * 1.2 + 0.3,
        opacity:     0,
        baseOpacity: Math.random() * 0.45 + 0.15,
      }))
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    canvas.addEventListener('mouseleave', onMouseLeave)

    resize()
    window.addEventListener('resize', resize)

    const lc = lineColor ?? color

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < repulsionRadius && dist > 0) {
          const force = (repulsionRadius - dist) / repulsionRadius
          p.vx += (dx / dist) * force * repulsionForce
          p.vy += (dy / dist) * force * repulsionForce
        }

        // Damping
        p.vx *= 0.98
        p.vy *= 0.98

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.2) {
          p.vx = (p.vx / speed) * 1.2
          p.vy = (p.vy / speed) * 1.2
        }

        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Fade in
        p.opacity += (p.baseOpacity - p.opacity) * 0.02

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.opacity})`
        ctx.fill()
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.18
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${lc},${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
    }
  }, [count, connectionDistance, repulsionRadius, repulsionForce, color, lineColor])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  )
}
