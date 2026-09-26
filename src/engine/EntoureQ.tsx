import { useRef, useState } from 'react'
import { Collection, Pack } from './Balls'
import { DrawPad, pointInPolygon, type DrawPadHandle, type Pt } from './DrawPad'
import type { CollectionQuestion } from './generate'
import { useCountAlong } from './useCountAlong'

export interface QProps<Q> {
  q: Q
  onAttempt: (given: string, expected: string, correct: boolean) => void
  onSolved: () => void
  onNudge: (msg: string) => void
}

/** "Entoure la collection de N balles" — au doigt, ou d'un simple toucher. */
export function EntoureQ({ q, onAttempt, onSolved, onNudge }: QProps<CollectionQuestion>) {
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState<number | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const pad = useRef<DrawPadHandle>(null)
  const { counted, showUnits } = useCountAlong(q.target, right !== null, onSolved)

  const choose = (i: number) => {
    const n = q.options[i]
    const ok = n === q.target
    onAttempt(String(n), String(q.target), ok)
    if (ok) setRight(i)
    else {
      setWrong(w => [...w, i])
      setTimeout(() => pad.current?.clear(), 450)
    }
  }

  const onStroke = (pts: Pt[]) => {
    const box = wrap.current!.getBoundingClientRect()
    const open = q.options.map((_, i) => i).filter(i => !wrong.includes(i))
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys)
    let hits: number[]
    if (w < 30 && h < 30) {
      // simple toucher
      const [x, y] = pts[0]
      hits = open.filter(i => {
        const r = cards.current[i]!.getBoundingClientRect()
        return x >= r.left - box.left && x <= r.right - box.left && y >= r.top - box.top && y <= r.bottom - box.top
      })
      pad.current?.clear()
    } else {
      hits = open.filter(i => {
        const r = cards.current[i]!.getBoundingClientRect()
        return pointInPolygon(r.left - box.left + r.width / 2, r.top - box.top + r.height / 2, pts)
      })
    }
    if (hits.length === 1) choose(hits[0])
    else {
      onNudge(hits.length > 1 ? "Fais un rond autour d'une seule collection." : 'Fais un grand rond tout autour des balles.')
      setTimeout(() => pad.current?.clear(), 450)
    }
  }

  return (
    <>
      <div className="ref">Voici 10 balles de tennis : <Pack /></div>
      <div className="draw-wrap" ref={wrap}>
        <div className="grid">
          {q.options.map((n, i) => (
            <div
              key={i}
              ref={el => { cards.current[i] = el }}
              className={'card' + (wrong.includes(i) ? ' wrong' : '') + (right === i ? ' right' : '')}
            >
              <Collection n={n} counted={right === i ? counted : 0} showUnits={right === i && showUnits} />
            </div>
          ))}
        </div>
        <DrawPad ref={pad} disabled={right !== null} onStroke={onStroke} />
      </div>
    </>
  )
}
