import { useEffect, useMemo, useState } from 'react'
import { cellKey, cellValue, type TableQuestion } from './generate'
import type { QProps } from './EntoureQ'

// Couleurs pastel des tableaux de la fiche (violet, orange, bleu, rose, gris, vert).
const TINTS = [
  ['#D9D2EA', '#C7BDE0'],
  ['#F6C98F', '#F0B56E'],
  ['#C6D3E6', '#AFC2DD'],
  ['#F5CFCB', '#EEB8B2'],
  ['#D6DEE0', '#C2CDD0'],
  ['#D3DDA0', '#BFCD7F'],
]

/** "Complète les cases vides du tableau" — tableau d'addition avec clavier. */
export function TableQ({ q, onAttempt, onSolved }: QProps<TableQuestion>) {
  const size = q.rows.length
  const [filled, setFilled] = useState<Record<string, number>>({})
  const [current, setCurrent] = useState<string | null>(q.blanks[0] ?? null)
  const [entry, setEntry] = useState('')
  const [shake, setShake] = useState(false)
  const tint = useMemo(() => TINTS[(q.rows[0] * 7 + q.cols[0] * 3 + size) % TINTS.length], [q, size])
  const done = q.blanks.every(k => filled[k] !== undefined)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const isBlank = (k: string) => q.blanks.includes(k)
  const known = (r: number, c: number) => !isBlank(cellKey(r, c)) || filled[cellKey(r, c)] !== undefined

  const [cr, cc] = current ? current.split(',').map(Number) : [NaN, NaN]

  // Petite aide sous le tableau, comme le schéma en marge de la fiche.
  const hint = useMemo(() => {
    if (!current || done) return null
    if (cr >= 0 && cc >= 0) {
      if (known(cr, -1) && known(-1, cc)) return <><b>{q.rows[cr]}</b> + <b>{q.cols[cc]}</b> = <span className="q-mark">?</span></>
      return <>Trouve d'abord le nombre {known(cr, -1) ? 'en haut de la colonne' : 'au début de la ligne'}.</>
    }
    if (cr === -1) {
      const r = q.rows.findIndex((_, i) => known(i, -1) && known(i, cc))
      if (r >= 0) return <><b>{q.rows[r]}</b> + <span className="q-mark">?</span> = <b>{cellValue(q, r, cc)}</b></>
    } else {
      const c = q.cols.findIndex((_, i) => known(-1, i) && known(cr, i))
      if (c >= 0) return <><span className="q-mark">?</span> + <b>{q.cols[c]}</b> = <b>{cellValue(q, cr, c)}</b></>
    }
    return <>Cherche une case déjà remplie sur cette {cr === -1 ? 'colonne' : 'ligne'}.</>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, filled, done])

  const press = (d: string) => {
    if (done || !current) return
    if (d === 'del') return setEntry(e => e.slice(0, -1))
    if (d === 'ok') {
      if (!entry) return
      const expected = cellValue(q, cr, cc), v = Number(entry)
      const ok = v === expected
      onAttempt(entry, String(expected), ok)
      if (ok) {
        const next = { ...filled, [current]: v }
        setFilled(next)
        setEntry('')
        setCurrent(q.blanks.find(k => next[k] === undefined) ?? null)
      } else {
        setShake(true)
        setTimeout(() => { setShake(false); setEntry('') }, 450)
      }
      return
    }
    setEntry(e => (e.length >= 3 ? e : e === '0' ? d : e + d))
  }

  const pick = (k: string) => {
    if (done || !isBlank(k) || filled[k] !== undefined) return
    setCurrent(k)
    setEntry('')
  }

  const cell = (r: number, c: number) => {
    const k = cellKey(r, c)
    const head = r === -1 || c === -1
    const blank = isBlank(k)
    const ok = filled[k] !== undefined
    const cur = k === current
    const lit = !cur && current !== null && !done && ((r === -1 && c === cc && cr >= 0) || (c === -1 && r === cr && cc >= 0))
    const text = !blank ? cellValue(q, r, c) : ok ? filled[k] : cur ? entry : ''
    return (
      <button
        key={k}
        type="button"
        className={'tcell' + (head ? ' head' : '') + (blank ? ' blank' : '') + (ok ? ' ok' : '') + (cur ? ' current' : '') + (cur && shake ? ' shake' : '') + (lit ? ' lit' : '')}
        onClick={() => pick(k)}
        tabIndex={blank && !ok ? 0 : -1}
        aria-label={blank && !ok ? `Case vide, ligne ${r + 2}, colonne ${c + 2}` : undefined}
      >
        {text}
      </button>
    )
  }

  return (
    <div className="table-q">
      <div className="ttable" style={{ gridTemplateColumns: `repeat(${size + 1}, var(--tc))`, '--t1': tint[0], '--t2': tint[1] } as React.CSSProperties}>
        <div className="tcell head corner">+</div>
        {q.cols.map((_, c) => cell(-1, c))}
        {q.rows.map((_, r) => (
          <FragmentRow key={r}>
            {cell(r, -1)}
            {q.cols.map((_, c) => cell(r, c))}
          </FragmentRow>
        ))}
      </div>
      <div className="table-side">
        <div className="table-hint" aria-live="polite">{hint}</div>
        <div className="keypad" aria-label="Clavier">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button key={d} className="key" onClick={() => press(d)} disabled={done}>{d}</button>
          ))}
          <button className="key alt" onClick={() => press('del')} disabled={done} aria-label="Effacer">⌫</button>
          <button className="key" onClick={() => press('0')} disabled={done}>0</button>
          <button className="key go" onClick={() => press('ok')} disabled={done || !entry}>OK</button>
        </div>
      </div>
    </div>
  )
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
