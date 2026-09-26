import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type Pt = [number, number]
export interface DrawPadHandle { clear(): void }

/**
 * Zone de dessin au doigt posée par-dessus les collections.
 * À la fin du geste, renvoie les points du tracé (coordonnées relatives à la zone).
 */
export const DrawPad = forwardRef<DrawPadHandle, { disabled?: boolean; onStroke: (pts: Pt[]) => void }>(
  function DrawPad({ disabled, onStroke }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const pts = useRef<Pt[]>([])
    const drawing = useRef(false)

    const ctx = () => canvas.current?.getContext('2d') || null

    const size = () => {
      const c = canvas.current
      if (!c) return
      const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1
      c.width = Math.round(r.width * d)
      c.height = Math.round(r.height * d)
      const g = ctx()!
      g.setTransform(d, 0, 0, d, 0, 0)
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.lineWidth = 4
      g.strokeStyle = '#3A3F47'
    }

    useImperativeHandle(ref, () => ({
      clear() {
        const c = canvas.current
        if (c) ctx()?.clearRect(0, 0, c.width, c.height)
      },
    }))

    useEffect(() => {
      size()
      const c = canvas.current
      if (!c) return
      const ro = new ResizeObserver(() => { if (!drawing.current) size() })
      ro.observe(c)
      return () => ro.disconnect()
    }, [])

    const pos = (e: React.PointerEvent): Pt => {
      const r = canvas.current!.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }

    return (
      <canvas
        ref={canvas}
        className="drawpad"
        style={{ pointerEvents: disabled ? 'none' : 'auto' }}
        aria-label="Zone de dessin : entoure une collection avec ton doigt"
        onPointerDown={e => {
          if (disabled) return
          drawing.current = true
          pts.current = [pos(e)]
          canvas.current!.setPointerCapture(e.pointerId)
          const g = ctx()!, c = canvas.current!
          g.clearRect(0, 0, c.width, c.height)
          g.beginPath()
          g.moveTo(...pts.current[0])
        }}
        onPointerMove={e => {
          if (!drawing.current) return
          const p = pos(e)
          pts.current.push(p)
          const g = ctx()!
          g.lineTo(...p)
          g.stroke()
        }}
        onPointerUp={() => { if (drawing.current) { drawing.current = false; onStroke(pts.current) } }}
        onPointerCancel={() => { if (drawing.current) { drawing.current = false; onStroke(pts.current) } }}
      />
    )
  },
)

export function pointInPolygon(x: number, y: number, poly: Pt[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
