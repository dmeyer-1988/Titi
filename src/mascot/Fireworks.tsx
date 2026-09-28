import { useEffect, useRef } from 'react'
import { Mascot } from './Mascot'
import { sounds } from '../engine/audio'

const COLORS = ['#F5B82E', '#D6453A', '#2D6A9F', '#2F8F55', '#E07A4B', '#9B6FA8', '#FFFFFF']

/** Feux d'artifice sur toute la fenêtre (canvas, sans bloquer les touches). */
export function Fireworks({ duration = 2600, bursts = 6 }: { duration?: number; bursts?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const c = ref.current!, g = c.getContext('2d')!
    const d = window.devicePixelRatio || 1
    const W = window.innerWidth, H = window.innerHeight
    c.width = W * d; c.height = H * d; g.scale(d, d)
    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
    const parts: P[] = []
    const boom = () => {
      const x = W * (0.15 + Math.random() * 0.7), y = H * (0.12 + Math.random() * 0.4)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      for (let i = 0; i < 46; i++) {
        const a = (Math.PI * 2 * i) / 46, sp = 2.2 + Math.random() * 3.2
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: Math.random() < 0.25 ? '#fff' : color, size: 2 + Math.random() * 2.5 })
      }
      sounds.tick(8 + Math.floor(Math.random() * 6))
    }
    const timers = Array.from({ length: bursts }, (_, i) => window.setTimeout(boom, i * (duration / (bursts + 1))))
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      g.clearRect(0, 0, W, H)
      for (const p of parts) {
        if (p.life <= 0) continue
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.985; p.life -= 0.012
        g.globalAlpha = Math.max(0, p.life)
        g.fillStyle = p.color
        g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill()
      }
      g.globalAlpha = 1
      if (t - start < duration + 1500) raf = requestAnimationFrame(tick)
      else g.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) }
  }, [duration, bursts])
  return <canvas ref={ref} className="fireworks" aria-hidden="true" />
}

/** Grande fête : feux d'artifice + la loutre qui saute au milieu de l'écran. */
export function Celebrate({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    sounds.fanfare()
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="celebrate" aria-live="polite">
      <Fireworks duration={2200} bursts={5} />
      <div className="celebrate-card">
        <Mascot mood="cheer" size="lg" text={text} speak={false} />
      </div>
    </div>
  )
}
