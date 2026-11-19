import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { QProps } from './EntoureQ'
import {
  SWISS, WORLD, cantonByCode, cantonView, continentById, snapDistance,
  type CantonQuestion, type ContinentQuestion, type DrapeauQuestion,
} from './geo'
import { sounds } from './audio'

const CONT_COLOR: Record<string, string> = {
  EU: '#2D6A9F', AS: '#D6453A', AF: '#2F8F55', NA: '#E07A4B', SA: '#9B6FA8', OC: '#B7791F', AN: '#7FA3C4',
}

function useSolvedAfter(done: boolean, onSolved: () => void, ms = 900) {
  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])
}

// ---------------------------------------------------------------- Drapeaux

/** Un drapeau (emoji : sur iPad, ce sont les vrais drapeaux en couleur). */
export const Flag = ({ f, big }: { f: string; big?: boolean }) => <span className={'flag' + (big ? ' big' : '')} aria-hidden="true">{f}</span>

export function DrapeauQ({ q, onAttempt, onSolved }: QProps<DrapeauQuestion>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [done, setDone] = useState(false)
  useSolvedAfter(done, onSolved)

  const choose = (code: string) => {
    if (done) return
    const ok = code === q.answer.code
    const given = q.options.find(o => o.code === code)!
    onAttempt(given.name, q.answer.name, ok)
    if (ok) setDone(true)
    else setWrong(w => [...w, code])
  }

  return (
    <div className="geo-q drapeau-q">
      {q.sens === 'nom'
        ? <div className="flag-card"><Flag f={q.answer.flag} big /></div>
        : <div className="country-name">{q.answer.name}</div>}
      <div className={'answers ' + (q.sens === 'nom' ? 'name-answers' : 'flag-answers')}>
        {q.options.map(o => (
          <button key={o.code} className={'answer' + (wrong.includes(o.code) ? ' wrong' : '') + (done && o.code === q.answer.code ? ' right' : '')}
            disabled={done || wrong.includes(o.code)} onClick={() => choose(o.code)} aria-label={q.sens === 'drapeau' ? `Drapeau ${wrong.includes(o.code) ? o.name : ''}` : o.name}>
            {q.sens === 'nom' ? <span className="n small">{o.name}</span> : <><Flag f={o.flag} />{(wrong.includes(o.code) || done) && <small>{o.name}</small>}</>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Continents

export function ContinentQ({ q, onAttempt, onSolved }: QProps<ContinentQuestion>) {
  const [wrong, setWrong] = useState<string[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  useSolvedAfter(done, onSolved, 1000)
  const target = continentById(q.id)

  const tap = (id: string) => {
    if (done || q.mode !== 'trouver') return
    const ok = id === q.id
    onAttempt(continentById(id).name, target.name, ok)
    if (ok) setDone(true)
    else { setFlash(id); setTimeout(() => setFlash(f => (f === id ? null : f)), 1400) }
  }
  const choose = (id: string) => {
    if (done) return
    const ok = id === q.id
    onAttempt(continentById(id).name, target.name, ok)
    if (ok) setDone(true)
    else setWrong(w => [...w, id])
  }

  const fill = (id: string) => {
    if (q.mode === 'nommer') return id === q.id ? CONT_COLOR[id] : '#CFD8C2'
    if (done && id === q.id) return CONT_COLOR[id]
    if (flash === id) return '#E9A39C'
    return '#B9CDA6'
  }
  const flashed = flash ? continentById(flash) : null

  return (
    <div className="geo-q">
      <svg className={'worldmap' + (q.mode === 'trouver' && !done ? ' tappable' : '') + (q.mode === 'nommer' ? ' with-answers' : '')} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} role="img" aria-label="Carte du monde">
        <rect width={WORLD.w} height={WORLD.h} fill="#DCEEFB" rx="18" />
        {WORLD.continents.map(c => (
          <path key={c.id} data-id={c.id} d={c.d} fill={fill(c.id)} stroke="#fff" strokeWidth="0.6" onClick={() => tap(c.id)} className="cont" />
        ))}
        {done && <text x={target.label[0]} y={target.label[1]} className="map-label" textAnchor="middle">{target.name}</text>}
        {flashed && !done && <text x={flashed.label[0]} y={flashed.label[1]} className="map-label no" textAnchor="middle">{flashed.name}</text>}
      </svg>
      {q.mode === 'nommer' && (
        <div className="answers name-answers">
          {q.options.map(id => (
            <button key={id} className={'answer' + (wrong.includes(id) ? ' wrong' : '') + (done && id === q.id ? ' right' : '')}
              disabled={done || wrong.includes(id)} onClick={() => choose(id)}>
              <span className="n small">{continentById(id).name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Cantons

const PLACED = '#F6C945'

export function CantonQ({ q, onAttempt, onSolved }: QProps<CantonQuestion>) {
  const target = cantonByCode(q.code)
  const [vx, vy, vw, vh] = cantonView(q.region)
  const romands = q.region === 'romands'
  const [wrong, setWrong] = useState<string[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  useSolvedAfter(done, onSolved, q.mode === 'puzzle' ? 700 : 1000)

  // ---- puzzle : la pièce attend sous la carte, on la glisse à sa place
  const tb = target.b
  const pw = tb[2] - tb[0], ph = tb[3] - tb[1]
  const trayH = q.mode === 'puzzle' ? Math.max(ph, vh * 0.14) + 34 : 0
  const home = useMemo<[number, number]>(() => {
    // centre de la pièce au milieu du plateau, sous la carte
    const cx = vx + vw / 2, cy = vy + vh + trayH / 2
    return [cx - (tb[0] + pw / 2), cy - (tb[1] + ph / 2)]
  }, [vx, vy, vw, vh, trayH, tb, pw, ph])
  const [off, setOff] = useState<[number, number]>(home)
  const [dragging, setDragging] = useState(false)
  const [back, setBack] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const grab = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null)

  const toMap = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    return [p.x, p.y]
  }
  const down = (e: React.PointerEvent<SVGPathElement>) => {
    if (done) return
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const [x, y] = toMap(e)
    grab.current = { id: e.pointerId, x, y, ox: off[0], oy: off[1] }
    setDragging(true); setBack(false)
    sounds.tick(4)
  }
  const move = (e: React.PointerEvent) => {
    const g = grab.current
    if (!g || g.id !== e.pointerId) return
    const [x, y] = toMap(e)
    setOff([g.ox + x - g.x, g.oy + y - g.y])
  }
  const up = (e: React.PointerEvent) => {
    const g = grab.current
    if (!g || g.id !== e.pointerId) return
    grab.current = null
    setDragging(false)
    const dist = Math.hypot(off[0], off[1])
    if (dist < snapDistance(target)) {
      setOff([0, 0]); setDone(true)
      onAttempt('à sa place', target.name, true)
    } else if (Math.hypot(off[0] - home[0], off[1] - home[1]) > 20) {
      // posée au mauvais endroit : retour sur le plateau
      onAttempt('à côté', target.name, false)
      setBack(true); setOff(home)
    }
  }

  // ---- trouver / nommer
  const tap = (code: string) => {
    if (done || q.mode !== 'trouver') return
    const c = cantonByCode(code)
    if (romands && !c.romand) { onAttempt(c.name, target.name, false); setFlash(code); setTimeout(() => setFlash(f => (f === code ? null : f)), 1400); return }
    const ok = code === q.code
    onAttempt(c.name, target.name, ok)
    if (ok) setDone(true)
    else { setFlash(code); setTimeout(() => setFlash(f => (f === code ? null : f)), 1400) }
  }
  const choose = (code: string) => {
    if (done) return
    const ok = code === q.code
    onAttempt(cantonByCode(code).name, target.name, ok)
    if (ok) setDone(true)
    else setWrong(w => [...w, code])
  }

  const fill = (code: string, romand?: boolean) => {
    const inGame = !romands || romand
    if (!inGame) return '#E8ECEF'
    if (q.mode === 'puzzle') return q.placed.includes(code) ? PLACED : '#FFFFFF'
    if (q.mode === 'nommer') return code === q.code ? '#2D6A9F' : '#F3F1E6'
    if (done && code === q.code) return '#2F8F55'
    if (flash === code) return '#E9A39C'
    return '#F3F1E6'
  }
  const flashed = flash ? cantonByCode(flash) : null
  const labelSize = vw / 34
  const clip = 'sw' + useId().replace(/:/g, '')

  const label = (code: string, cls = '') => {
    const c = cantonByCode(code)
    const big = c.area > (romands ? 900 : 2500)
    return <text key={'l' + code} x={c.c[0]} y={c.c[1] + labelSize * 0.35} className={'map-label ' + cls} fontSize={labelSize * (big ? 1 : 0.8)} textAnchor="middle">{big ? c.name : c.code}</text>
  }

  return (
    <div className="geo-q">
      <svg ref={svg} className={'swissmap' + (q.mode === 'trouver' && !done ? ' tappable' : '') + (q.mode === 'nommer' ? ' with-answers' : '')} viewBox={`${vx} ${vy} ${vw} ${vh + trayH}`}
        onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Carte de la Suisse">
        <defs><clipPath id={clip}><rect x={vx} y={vy} width={vw} height={vh} rx={vw / 60} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}>
        <rect x={vx} y={vy} width={vw} height={vh} fill="#EEF5EA" />        {SWISS.cantons.map(c => (
          <path key={c.code} data-code={c.code} d={c.d} fill={fill(c.code, c.romand)} stroke={!romands || c.romand ? '#7C8A99' : '#C7CFD6'} strokeWidth={vw / 700}
            strokeDasharray={q.mode === 'puzzle' && !q.placed.includes(c.code) && (!romands || c.romand) ? `${vw / 200} ${vw / 300}` : undefined}
            onClick={() => tap(c.code)} className="cant" />
        ))}
        <path d={SWISS.lakes} fill="#9CCBEE" pointerEvents="none" />
        {q.mode === 'puzzle' && q.placed.map(code => label(code, 'small'))}
        {q.mode !== 'puzzle' && done && label(q.code)}
        {flashed && !done && label(flashed.code, 'no')}
        </g>
        {q.mode === 'puzzle' && <rect x={vx} y={vy + vh + 6} width={vw} height={trayH - 6} fill="#F2F5F8" rx={vw / 60} stroke="#DCE3EA" strokeDasharray="6 6" />}
        {q.mode === 'puzzle' && (
          <g style={{ transform: `translate(${off[0]}px, ${off[1]}px)` }} className={'piece' + (dragging ? ' drag' : '') + (back ? ' back' : '') + (done ? ' snapped' : '')}>
            <path d={target.d} fill={done ? PLACED : '#2D6A9F'} stroke="#1F4E77" strokeWidth={vw / 450}
              onPointerDown={down} style={{ cursor: done ? 'default' : 'grab', touchAction: 'none' }} />
          </g>
        )}
        {q.mode === 'puzzle' && done && label(q.code)}
      </svg>
      {q.mode === 'nommer' && (
        <div className="answers name-answers">
          {q.options.map(code => (
            <button key={code} className={'answer' + (wrong.includes(code) ? ' wrong' : '') + (done && code === q.code ? ' right' : '')}
              disabled={done || wrong.includes(code)} onClick={() => choose(code)}>
              <span className="n small">{cantonByCode(code).name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
