import { useEffect, useState } from 'react'
import type { QProps } from './EntoureQ'
import { ATTRS, diff, explain, score, type Castle, type MystereQuestion } from './mystere'
import { sounds } from './audio'

const FILL = ['#F2C230', '#2D6A9F', '#D6453A']
const EDGE = ['#B38A12', '#1F4E77', '#9E2F27']

function Tower({ x, kind, fill, edge }: { x: number; kind: number; fill: string; edge: string }) {
  const w = 24, top = 38
  return (
    <g>
      <rect x={x} y={top} width={w} height={100 - top} fill={fill} stroke={edge} strokeWidth={2} />
      {kind === 0 && <polygon points={`${x - 4},${top} ${x + w / 2},${top - 26} ${x + w + 4},${top}`} fill={edge} />}
      {kind === 1 && <path d={`M${x - 3} ${top} A ${w / 2 + 3} ${w / 2 + 3} 0 0 1 ${x + w + 3} ${top} Z`} fill={edge} />}
      {kind === 2 && [0, 1, 2].map(k => <rect key={k} x={x + k * 9} y={top - 8} width={6} height={9} fill={fill} stroke={edge} strokeWidth={2} />)}
      <rect x={x + 8} y={top + 14} width={8} height={11} rx={4} fill="#fff" opacity={0.85} />
    </g>
  )
}

/** Une carte château dessinée à partir de ses 4 critères. */
export function CastleArt({ c, className = '' }: { c: Castle; className?: string }) {
  const [col, tour, porte, drapeau] = c
  const fill = FILL[col], edge = EDGE[col]
  return (
    <svg className={'castle-art ' + className} viewBox="0 0 120 108" aria-hidden="true">
      {drapeau === 0 && (
        <g>
          <line x1={60} y1={52} x2={60} y2={18} stroke="#3A3F47" strokeWidth={2.5} />
          <polygon points="61,18 82,24 61,31" fill="#2F8F55" />
        </g>
      )}
      <rect x={30} y={52} width={60} height={48} fill={fill} stroke={edge} strokeWidth={2} />
      <Tower x={8} kind={tour} fill={fill} edge={edge} />
      <Tower x={88} kind={tour} fill={fill} edge={edge} />
      {porte === 0
        ? <rect x={50} y={72} width={20} height={28} fill="#5B3A29" />
        : <path d="M50 100 V82 A10 10 0 0 1 70 82 V100 Z" fill="#5B3A29" />}
      <line x1={2} y1={101} x2={118} y2={101} stroke="#9AA7B4" strokeWidth={2} />
    </svg>
  )
}

/** Petit dessin pour chaque bouton de critère. */
function OptionIcon({ attr, v }: { attr: number; v: number }) {
  if (attr === 0) return <span className="swatch" style={{ background: FILL[v], borderColor: EDGE[v] }} />
  if (attr === 1) return (
    <svg viewBox="0 0 40 40" className="opt-svg"><Tower x={8} kind={v} fill="#C9D3DC" edge="#5E6B7A" /></svg>
  )
  if (attr === 2) return (
    <svg viewBox="0 0 30 30" className="opt-svg">
      <rect x={2} y={2} width={26} height={26} fill="#E7EFF6" />
      {v === 0 ? <rect x={9} y={8} width={12} height={20} fill="#5B3A29" /> : <path d="M9 28 V15 A6 6 0 0 1 21 15 V28 Z" fill="#5B3A29" />}
    </svg>
  )
  return (
    <svg viewBox="0 0 30 30" className="opt-svg">
      <line x1={10} y1={28} x2={10} y2={4} stroke="#3A3F47" strokeWidth={2.5} />
      {v === 0 ? <polygon points="11,4 26,9 11,14" fill="#2F8F55" /> : <line x1={6} y1={6} x2={26} y2={26} stroke="#C4453B" strokeWidth={3} />}
    </svg>
  )
}

function Dots({ n }: { n: number }) {
  return <span className="score-dots" aria-label={`${n} sur 4`}>{[0, 1, 2, 3].map(i => <i key={i} className={i < n ? 'on' : ''} />)}</span>
}

/** Le château mystère : trouver la carte secrète en changeant un seul critère à la fois. */
export function MystereQ({ q, onAttempt, onSolved, onNudge }: QProps<MystereQuestion>) {
  const [tries, setTries] = useState<{ c: Castle; s: number }[]>(() => [{ c: q.start, s: score(q.start, q.secret) }])
  // Le château de référence = le meilleur essai (le plus récent à score égal).
  // Après un score qui baisse, on revient à lui : changer un autre critère compte alors pour un seul changement.
  const ref = tries.reduce((b, t) => (t.s >= b.s ? t : b), tries[0])
  const [cur, setCur] = useState<Castle>(q.start)
  const [done, setDone] = useState(false)
  const changed = diff(ref.c, cur)
  const atRef = changed.length === 0

  useEffect(() => {
    const s = tries[0].s
    onNudge(`Voici ta première carte : ${s} critère${s > 1 ? 's' : ''} correct${s > 1 ? 's' : ''} sur 4. Change UN seul critère et regarde si le score monte ou baisse.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const pick = (attr: number, v: number) => {
    if (done) return
    const next = [...cur] as Castle
    next[attr] = v
    setCur(next)
    sounds.tick(4)
  }

  const propose = () => {
    if (done || changed.length === 0) return
    if (q.strict && changed.length > 1) {
      sounds.bad()
      onNudge(`Tu as changé ${changed.length} critères. Change UN seul critère à la fois, sinon tu ne sauras pas lequel a fait bouger le score !`)
      return
    }
    const s = score(cur, q.secret)
    setTries(t => [...t, { c: cur, s }])
    if (s === 4) {
      onAttempt(`${tries.length + 1} essais`, 'trouvé', true)
      setDone(true)
      return
    }
    sounds.tick(s > ref.s ? 9 : 2)
    onNudge(q.aide ? explain(ref.c, ref.s, cur, s) : `${s} critère${s > 1 ? 's' : ''} correct${s > 1 ? 's' : ''} sur 4.`)
  }

  return (
    <div className="mystere-q">
      <div className="myst-top">
        <div className={'myst-card secret' + (done ? ' found' : '')}>
          {done ? <CastleArt c={q.secret} /> : <span className="qmark">?</span>}
          <span className="cap">Château mystère</span>
        </div>
        <div className="myst-card mine">
          <CastleArt c={cur} />
          <span className="cap">Mon château</span>
        </div>
      </div>

      <div className="myst-pick">
        {ATTRS.map((a, i) => (
          <div key={a.key} className={'myst-row' + (changed.includes(i) ? ' changed' : '')}>
            <span className="myst-label">{a.label}{changed.includes(i) && <em>changé</em>}</span>
            <div className="myst-opts">
              {a.values.map((v, k) => (
                <button key={v} className="myst-opt" aria-pressed={cur[i] === k} onClick={() => pick(i, k)} disabled={done}>
                  <OptionIcon attr={i} v={k} />
                  <span>{v}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="row center">
        {!atRef && !done && tries.length > 1 && (
          <button className="btn ghost small" onClick={() => setCur(ref.c)}>↩ Revenir à mon meilleur essai</button>
        )}
        <button className="btn" onClick={propose} disabled={done || changed.length === 0}>Proposer ce château</button>
      </div>

      <div className="myst-history" aria-label="Mes essais">
        {tries.map((t, k) => {
          const prev = tries[k - 1]
          const trend = !prev ? '' : t.s > prev.s ? 'up' : t.s < prev.s ? 'down' : 'same'
          return (
            <div key={k} className={'myst-try ' + trend + (t.s === 4 ? ' win' : '')}>
              {trend && <span className="trend" aria-hidden="true">{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '='}</span>}
              <span className="n">Essai {k + 1}</span>
              <CastleArt c={t.c} />
              <Dots n={t.s} />
              <span className="sc">{t.s} / 4</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
