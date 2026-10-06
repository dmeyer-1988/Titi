import { useEffect, useRef, useState } from 'react'
import type { QProps } from './EntoureQ'
import { cap, type CapaciteQuestion, type Pot } from './capacite'
import { sounds } from './audio'

const BASE = 205, XA = 100, XB = 270, WATER = '#6FB7E8'

function PotShape({ p, cx, level, overflow }: { p: Pot; cx: number; level: number; overflow: number }) {
  const x0 = cx - p.w / 2, x1 = cx + p.w / 2, top = BASE - p.h
  const lh = Math.min(1, level) * p.h
  return (
    <g>
      {overflow > 0 && (
        <>
          <rect x={x0 - 6} y={top - 2} width={4} height={(BASE - top) * Math.min(1, overflow * 3)} fill={WATER} rx={2} />
          <rect x={x1 + 2} y={top - 2} width={4} height={(BASE - top) * Math.min(1, overflow * 3)} fill={WATER} rx={2} />
          <ellipse cx={cx} cy={BASE + 9} rx={p.w / 2 + 12 + overflow * 40} ry={5 + overflow * 3} fill={WATER} opacity={0.8} />
        </>
      )}
      <rect x={x0} y={BASE - lh} width={p.w} height={lh} fill={WATER} />
      {lh > 0 && <rect x={x0} y={BASE - lh} width={p.w} height={3} fill="#fff" opacity={0.6} />}
      <path d={`M${x0 - 3} ${top - 6} V${BASE + 3} H${x1 + 3} V${top - 6}`} fill="none" stroke={p.color} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

/** Comparer deux récipients : on remplit le premier et on le verse dans le second. */
export function CapaciteQ({ q, onAttempt, onSolved }: QProps<CapaciteQuestion>) {
  const ca = cap(q.a), cb = cap(q.b)
  const [t, setT] = useState(q.mode === 'lire' ? 1 : 0)
  const [pouring, setPouring] = useState(false)
  const [wrong, setWrong] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  useEffect(() => {
    if (!done) return
    const k = setTimeout(onSolved, 700)
    return () => clearTimeout(k)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const pour = () => {
    setPouring(true)
    sounds.tick(3)
    const start = performance.now(), dur = 2000
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur)
      setT(k)
      if (k < 1) raf.current = requestAnimationFrame(step)
      else { setPouring(false); if (ca > cb) sounds.bad() }
    }
    raf.current = requestAnimationFrame(step)
  }

  // pendant le versement : on transfère jusqu'à vider a, en débordant si b est trop petit
  const poured = t * ca
  const inB = Math.min(cb, poured)
  const levelA = (ca - poured) / ca
  const overflow = poured > cb ? (poured - cb) / ca : 0
  const shownA = Math.max(0, levelA)
  const shownB = inB / cb
  const after = t === 1

  const answer = (g: 'a' | 'b' | 'pareil') => {
    if (done) return
    const ok = g === q.answer
    onAttempt(g === 'a' ? q.a.name : g === 'b' ? q.b.name : 'pareil', q.answer === 'a' ? q.a.name : q.answer === 'b' ? q.b.name : 'pareil', ok)
    if (ok) setDone(true)
    else setWrong(w => [...w, g])
  }

  return (
    <div className="capacite-q">
      <svg className="capacite" viewBox="0 0 370 230" role="img" aria-label={`Récipient ${q.a.name} et récipient ${q.b.name}`}>
        <line x1={10} y1={BASE + 4} x2={360} y2={BASE + 4} stroke="#C9D3DC" strokeWidth={3} />
        <PotShape p={q.a} cx={XA} level={shownA} overflow={0} />
        <PotShape p={q.b} cx={XB} level={shownB} overflow={overflow} />
        {pouring && t < 1 && (
          <path d={`M${XA} ${BASE - q.a.h - 8} Q${(XA + XB) / 2} ${BASE - 190} ${XB} ${BASE - q.b.h - 4}`} fill="none" stroke={WATER} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 8" className="stream" />
        )}
        {after && overflow > 0 && <text x={XB} y={BASE - q.b.h - 18} textAnchor="middle" className="cap-note">Ça déborde !</text>}
      </svg>

      {q.mode === 'lire' && <p className="cap-say">On a rempli le <b style={{ color: q.a.color }}>{q.a.name}</b> jusqu'en haut, puis on l'a versé dans le <b style={{ color: q.b.color }}>{q.b.name}</b>. Regarde bien !</p>}

      {!after ? (
        <div className="row center">
          <button className="btn" onClick={pour} disabled={pouring}>
            {pouring ? 'Ça coule…' : <>Verser le <span style={{ textDecoration: 'underline', textDecorationColor: q.a.color, textDecorationThickness: 4 }}>{q.a.name}</span> dans le {q.b.name}</>}
          </button>
        </div>
      ) : (
        <>
          <p className="cap-q">Lequel contient le plus ?</p>
          <div className="answers cap-answers">
            {(['a', 'b', 'pareil'] as const).map(g => (
              <button key={g} className={'answer' + (wrong.includes(g) ? ' wrong' : '') + (done && g === q.answer ? ' right' : '')}
                disabled={done || wrong.includes(g)} onClick={() => answer(g)}>
                {g === 'pareil'
                  ? <span className="n small">Pareil</span>
                  : <span className="n small" style={{ color: (g === 'a' ? q.a : q.b).color }}>Le {(g === 'a' ? q.a : q.b).name}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
