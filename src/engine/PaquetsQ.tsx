import { useRef, useState } from 'react'
import { Ball } from './Balls'
import { DrawPad, pointInPolygon, type DrawPadHandle, type Pt } from './DrawPad'
import type { PaquetsQuestion } from './paquets'
import type { QProps } from './EntoureQ'
import { sounds } from './audio'

const GROUP_COLORS = ['#2D6A9F', '#D6453A', '#2F8F55', '#9B6FA8', '#E07A4B', '#B7791F', '#3F7A8C', '#C4602A', '#6A3DB8', '#1F2328']

/**
 * « Fais des paquets de 10 » : on entoure 10 balles au doigt pour faire un paquet,
 * on touche des balles seules pour les unités, puis on valide.
 */
export function PaquetsQ({ q: raw, onAttempt, onSolved, onNudge }: QProps<PaquetsQuestion>) {
  // Sur téléphone (écran étroit), on tourne le terrain en portrait pour garder de grosses balles.
  const [q] = useState<PaquetsQuestion>(() =>
    window.innerWidth < 640 && raw.cols > raw.rows
      ? { ...raw, cols: raw.rows, rows: raw.cols, balls: raw.balls.map(([x, y]) => [y, x] as [number, number]) }
      : raw)
  const field = useRef<HTMLDivElement>(null)
  const pad = useRef<DrawPadHandle>(null)
  const [groups, setGroups] = useState<{ ids: number[]; path: Pt[] }[]>([])
  const [singles, setSingles] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const grouped = new Set(groups.flatMap(g => g.ids))
  const tens = groups.length, units = singles.length, total = tens * 10 + units

  const toPx = () => {
    const f = field.current!
    return { w: f.clientWidth, h: f.clientHeight }
  }

  const onStroke = (pts: Pt[]) => {
    if (done) return
    const { w, h } = toPx()
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const small = Math.max(...xs) - Math.min(...xs) < 26 && Math.max(...ys) - Math.min(...ys) < 26
    pad.current?.clear()

    if (small) {
      const [x, y] = pts[0]
      // toucher un paquet le défait
      const gi = groups.findIndex(g => pointInPolygon(x / w, y / h, g.path))
      if (gi >= 0) { setGroups(g => g.filter((_, i) => i !== gi)); sounds.tick(1); return }
      // sinon on choisit la balle la plus proche
      let best = -1, bd = Infinity
      q.balls.forEach(([bx, by], i) => {
        if (grouped.has(i)) return
        const d = Math.hypot(bx * w - x, by * h - y)
        if (d < bd) { bd = d; best = i }
      })
      if (best < 0 || bd > (w / q.cols) * 0.6) return
      if (singles.includes(best)) { setSingles(s => s.filter(i => i !== best)); sounds.tick(2); return }
      if (singles.length >= 9) { onNudge('Pas plus de 9 balles seules : avec 10, fais plutôt un paquet !'); sounds.bad(); return }
      setSingles(s => [...s, best]); sounds.tick(4)
      return
    }

    const poly = pts.map(([x, y]) => [x / w, y / h] as Pt)
    const inside = q.balls.map((_, i) => i).filter(i => !grouped.has(i) && pointInPolygon(q.balls[i][0], q.balls[i][1], poly))
    if (inside.length === 10) {
      setGroups(g => [...g, { ids: inside, path: poly }])
      setSingles(s => s.filter(i => !inside.includes(i)))
      sounds.good()
    } else if (inside.length > 0) {
      onNudge(`Il y a ${inside.length} balle${inside.length > 1 ? 's' : ''} dans ton rond. Il en faut exactement 10 pour un paquet.`)
      sounds.bad()
    }
  }

  const check = () => {
    const ok = total === q.target
    onAttempt(String(total), String(q.target), ok)
    if (ok) { setDone(true); setTimeout(onSolved, 500) }
  }

  const reset = () => { setGroups([]); setSingles([]) }

  const groupOf = (i: number) => groups.findIndex(g => g.ids.includes(i))

  return (
    <div className="paquets-q">
      <div className="paq-field" ref={field} style={{ aspectRatio: `${q.cols} / ${q.rows}`, maxWidth: `min(760px, calc((100dvh - 330px) * ${q.cols} / ${q.rows}))`, ['--bs' as string]: `${(100 / q.cols) * 0.64}%` } as React.CSSProperties}>
        <svg className="paq-loops" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {groups.map((g, gi) => (
            <polygon key={gi} points={g.path.map(([x, y]) => `${x * 100},${y * 100}`).join(' ')}
              fill={GROUP_COLORS[gi % GROUP_COLORS.length]} fillOpacity=".1"
              stroke={GROUP_COLORS[gi % GROUP_COLORS.length]} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          ))}
        </svg>
        {q.balls.map(([x, y], i) => {
          const g = groupOf(i)
          return (
            <span key={i} className={'paq-ball' + (g >= 0 ? ' in-group' : '') + (singles.includes(i) ? ' single' : '')}
              style={{ left: `${x * 100}%`, top: `${y * 100}%`, ['--gc' as string]: g >= 0 ? GROUP_COLORS[g % GROUP_COLORS.length] : undefined } as React.CSSProperties}>
              <Ball />
            </span>
          )
        })}
        {groups.map((g, gi) => {
          const cx = g.ids.reduce((a, i) => a + q.balls[i][0], 0) / 10, cy = g.ids.reduce((a, i) => a + q.balls[i][1], 0) / 10
          return <span key={'t' + gi} className="paq-tag" style={{ left: `${cx * 100}%`, top: `${cy * 100}%`, background: GROUP_COLORS[gi % GROUP_COLORS.length] }}>10</span>
        })}
        <DrawPad ref={pad} disabled={done} onStroke={onStroke} />
      </div>

      <div className="paq-bar">
        <div className="paq-sum" aria-live="polite">
          <span className="paq-chip tens"><b>{tens}</b> paquet{tens > 1 ? 's' : ''} de 10</span>
          <span className="op">+</span>
          <span className="paq-chip units"><b>{units}</b> balle{units > 1 ? 's' : ''}</span>
          <span className="op">=</span>
          <span className={'paq-total' + (total === q.target ? ' ok' : '')}>{total}</span>
        </div>
        <div className="row">
          <button className="btn ghost small" onClick={reset} disabled={done || (!tens && !units)}>Recommencer</button>
          <button className="btn" onClick={check} disabled={done || total === 0}>C'est bon !</button>
        </div>
      </div>
    </div>
  )
}
