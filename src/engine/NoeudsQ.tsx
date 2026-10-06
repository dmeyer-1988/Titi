import { useEffect, useRef, useState } from 'react'
import type { QProps } from './EntoureQ'
import { COLS, nodeName, sameNode, type Node, type NoeudsQuestion } from './noeuds'

const U = 64 // écart entre deux nœuds (unités SVG)
const ML = 64, MT = 34, MB = 58, MR = 34

/** Quadrillage : colonnes A, B, C… en bas, lignes 1, 2, 3… à gauche (1 en bas). */
export function NoeudsQ({ q, onAttempt, onSolved }: QProps<NoeudsQuestion>) {
  const svg = useRef<SVGSVGElement>(null)
  const [tapped, setTapped] = useState<{ n: Node; ok: boolean } | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const n = q.size
  const W = ML + (n - 1) * U + MR, H = MT + (n - 1) * U + MB
  const X = (c: number) => ML + c * U
  const Y = (r: number) => MT + (n - 1 - r) * U

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, q.skill === 'bouger' ? 1100 : 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const tap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done || q.skill === 'lire') return
    const r = svg.current!.getBoundingClientRect()
    const sx = ((e.clientX - r.left) / r.width) * W, sy = ((e.clientY - r.top) / r.height) * H
    const c = Math.round((sx - ML) / U), row = n - 1 - Math.round((sy - MT) / U)
    if (c < 0 || row < 0 || c >= n || row >= n) return
    if (Math.hypot(sx - X(c), sy - Y(row)) > U * 0.48) return
    const node: Node = [c, row]
    const ok = sameNode(node, q.answer)
    setTapped({ n: node, ok })
    onAttempt(nodeName(node), nodeName(q.answer), ok)
    if (ok) setDone(true)
  }

  const choose = (o: string) => {
    if (done) return
    const ok = o === nodeName(q.at)
    onAttempt(o, nodeName(q.at), ok)
    if (ok) setDone(true)
    else setPicked(p => [...p, o])
  }

  // où dessiner l'objet de la question
  const thingAt: Node | null = q.skill === 'placer' ? (done ? q.answer : null) : q.skill === 'bouger' && done ? q.answer : q.at

  return (
    <div className="noeuds-q">
      <svg ref={svg} className="noeuds" viewBox={`0 0 ${W} ${H}`} onPointerDown={tap} role="img" aria-label="Quadrillage">
        {/* lignes */}
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <line x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(n - 1)} className="gl" />
            <line x1={X(0)} y1={Y(i)} x2={X(n - 1)} y2={Y(i)} className="gl" />
            <text x={X(i)} y={Y(0) + 40} className="lab" textAnchor="middle">{COLS[i]}</text>
            <text x={X(0) - 34} y={Y(i) + 9} className="lab" textAnchor="middle">{i + 1}</text>
          </g>
        ))}
        {/* nœuds */}
        {Array.from({ length: n * n }, (_, k) => {
          const c = k % n, r = Math.floor(k / n)
          return <circle key={k} cx={X(c)} cy={Y(r)} r={5} className="node" />
        })}
        {/* trajet après un déplacement réussi */}
        {q.skill === 'bouger' && q.move && (
          <path className={'trail' + (done ? ' show' : '')}
            d={`M${X(q.at[0])} ${Y(q.at[1])} H${X(q.at[0] + q.move[0])} V${Y(q.at[1] + q.move[1])}`} />
        )}
        {/* départ fantôme pour « bouger » */}
        {q.skill === 'bouger' && <text x={X(q.at[0])} y={Y(q.at[1]) + 14} className="thing ghost" textAnchor="middle">{q.thing.emoji}</text>}
        {q.others.map((o, i) => (
          <text key={i} x={X(o.at[0])} y={Y(o.at[1]) + 14} className="thing" textAnchor="middle">{o.thing.emoji}</text>
        ))}
        {tapped && !tapped.ok && !done && (
          <circle key={nodeName(tapped.n)} cx={X(tapped.n[0])} cy={Y(tapped.n[1])} r={22} className="miss" />
        )}
        {thingAt && (
          <text x={X(thingAt[0])} y={Y(thingAt[1]) + 14} className={'thing main' + (done ? ' win' : '')} textAnchor="middle">{q.thing.emoji}</text>
        )}
        {done && <circle cx={X(q.answer[0])} cy={Y(q.answer[1])} r={30} className="hit" />}
      </svg>

      {q.skill === 'lire' && q.options && (
        <div className="answers noeud-answers">
          {q.options.map(o => (
            <button key={o} className={'answer' + (picked.includes(o) ? ' wrong' : '') + (done && o === nodeName(q.at) ? ' right' : '')}
              disabled={done || picked.includes(o)} onClick={() => choose(o)}>
              <span className="n">{o}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
