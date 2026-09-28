import { useEffect, useRef, useState } from 'react'
import { sounds } from '../engine/audio'

/**
 * Case à gratter : une couche argentée au-dessus du contenu.
 * Le doigt efface la couche ; au-delà de 55 % grattés, tout se dévoile.
 */
export function ScratchCard({ children, revealed, onReveal }: { children: React.ReactNode; revealed: boolean; onReveal: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)
  const moves = useRef(0)
  const [gone, setGone] = useState(false)
  const goneRef = useRef(false)

  // Dessine la couche argentée.
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d)
    const g = c.getContext('2d')!
    g.scale(d, d)
    const w = r.width, h = r.height
    const grad = g.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#C9CED6'); grad.addColorStop(0.35, '#F1F3F6'); grad.addColorStop(0.55, '#AEB5BF'); grad.addColorStop(0.8, '#E4E7EC'); grad.addColorStop(1, '#9EA6B1')
    g.fillStyle = grad
    g.beginPath()
    if (g.roundRect) g.roundRect(0, 0, w, h, 10); else g.rect(0, 0, w, h)
    g.fill()
    // petites stries comme sur un vrai ticket
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1
    for (let x = -h; x < w; x += 7) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.stroke() }
    // étoiles et texte
    g.fillStyle = 'rgba(120,128,140,.55)'
    for (let i = 0; i < 14; i++) star(g, (i * 53) % w, (i * 37) % h, 5)
    g.fillStyle = '#5E6B7A'
    g.font = `800 ${Math.round(w / 6)}px "Baloo 2", system-ui, sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('Gratte !', w / 2, h / 2)
    g.font = `700 ${Math.round(w / 11)}px system-ui, sans-serif`
    g.fillText('☝️', w / 2, h / 2 + w / 5)
  }, [])

  // Dévoilé de l'extérieur (bouton « Tout gratter »).
  useEffect(() => { if (revealed) { goneRef.current = true; setGone(true) } }, [revealed])

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const scratch = (p: [number, number]) => {
    const g = canvas.current!.getContext('2d')!
    g.globalCompositeOperation = 'destination-out'
    g.lineCap = 'round'; g.lineJoin = 'round'
    g.lineWidth = canvas.current!.getBoundingClientRect().width / 5.5
    g.beginPath()
    const [x0, y0] = last.current ?? p
    g.moveTo(x0, y0); g.lineTo(p[0], p[1]); g.stroke()
    g.beginPath(); g.arc(p[0], p[1], g.lineWidth / 2, 0, Math.PI * 2); g.fill()
    last.current = p
    if (++moves.current % 4 === 0) sounds.scratch()
    if (moves.current % 8 === 0) check()
  }

  const check = () => {
    const c = canvas.current
    if (!c || goneRef.current) return
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    let clear = 0, total = 0
    for (let i = 3; i < data.length; i += 4 * 12) { total++; if (data[i] < 40) clear++ }
    if (clear / total > 0.55) { goneRef.current = true; setGone(true); onReveal() }
  }

  return (
    <div className="scratch">
      <div className="scratch-under">{children}</div>
      <canvas
        ref={canvas}
        className={'scratch-foil' + (gone ? ' gone' : '')}
        aria-label="Gratte avec ton doigt pour découvrir la vignette"
        onPointerDown={e => { drawing.current = true; last.current = null; canvas.current!.setPointerCapture(e.pointerId); scratch(pos(e)) }}
        onPointerMove={e => { if (drawing.current) scratch(pos(e)) }}
        onPointerUp={() => { drawing.current = false; check() }}
        onPointerCancel={() => { drawing.current = false }}
      />
    </div>
  )
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r / 2.2 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath(); g.fill()
}
