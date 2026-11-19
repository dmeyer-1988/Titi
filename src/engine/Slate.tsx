import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface SlateHandle { clear: () => void; hasInk: () => boolean }

/**
 * Ardoise : on écrit au stylet ou au doigt sur des lignes d'écolier.
 * Dès qu'un stylet est utilisé, les touches du doigt (la paume posée sur l'écran) sont ignorées.
 */
export const Slate = forwardRef<SlateHandle, { disabled?: boolean; small?: boolean; onInk?: (has: boolean) => void }>(
  function Slate({ disabled, small, onInk }, ref) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const ink = useRef(false)
    const pen = useRef(false)
    const drawing = useRef<{ id: number; x: number; y: number } | null>(null)

    const ctx = () => canvas.current?.getContext('2d') ?? null

    const resize = () => {
      const c = canvas.current
      if (!c) return
      const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1
      if (c.width === Math.round(r.width * d) && c.height === Math.round(r.height * d)) return
      // on garde le dessin quand la taille change (rotation de l'iPad)
      const old = ink.current ? c.toDataURL() : null
      c.width = Math.round(r.width * d); c.height = Math.round(r.height * d)
      const g = c.getContext('2d')!
      g.scale(d, d)
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1F3A68'
      if (old) { const img = new Image(); img.onload = () => g.drawImage(img, 0, 0, r.width, r.height); img.src = old }
    }

    useEffect(() => {
      resize()
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useImperativeHandle(ref, () => ({
      clear: () => {
        const c = canvas.current, g = ctx()
        if (!c || !g) return
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.restore()
        ink.current = false
        onInk?.(false)
      },
      hasInk: () => ink.current,
    }))

    const pos = (e: React.PointerEvent) => {
      const r = canvas.current!.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return
      if (e.pointerType === 'pen') pen.current = true
      else if (pen.current && e.pointerType === 'touch') return // paume
      e.preventDefault()
      canvas.current!.setPointerCapture(e.pointerId)
      const p = pos(e)
      drawing.current = { id: e.pointerId, ...p }
      const g = ctx()!
      g.lineWidth = e.pointerType === 'pen' ? 3 + 3 * (e.pressure || 0.5) : 5
      g.beginPath(); g.arc(p.x, p.y, g.lineWidth / 2, 0, Math.PI * 2); g.fillStyle = '#1F3A68'; g.fill()
      if (!ink.current) { ink.current = true; onInk?.(true) }
    }
    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = drawing.current
      if (!d || d.id !== e.pointerId) return
      const g = ctx()!
      const events = (e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) as PointerEvent[]
      for (const ev of events) {
        const r = canvas.current!.getBoundingClientRect()
        const p = { x: ev.clientX - r.left, y: ev.clientY - r.top }
        if (ev.pointerType === 'pen') g.lineWidth = 3 + 3 * (ev.pressure || 0.5)
        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(p.x, p.y); g.stroke()
        d.x = p.x; d.y = p.y
      }
    }
    const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (drawing.current?.id === e.pointerId) drawing.current = null
    }

    return (
      <div className={'slate' + (small ? ' small' : '') + (disabled ? ' off' : '')}>
        <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          aria-label="Ardoise : écris avec le stylet ou le doigt" />
      </div>
    )
  },
)
