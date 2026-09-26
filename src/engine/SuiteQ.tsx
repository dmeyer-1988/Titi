import { useEffect, useState } from 'react'
import type { SuiteQuestion } from './generate'
import type { QProps } from './EntoureQ'

/** "Complète la suite" — cases vides à remplir avec un clavier à chiffres. */
export function SuiteQ({ q, onAttempt, onSolved }: QProps<SuiteQuestion>) {
  const [filled, setFilled] = useState<Record<number, number>>({})
  const [entry, setEntry] = useState('')
  const [shake, setShake] = useState(false)
  const current = q.blanks.find(b => filled[b] === undefined)
  const done = current === undefined
  const down = q.seq[1] < q.seq[0]

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const press = (d: string) => {
    if (done) return
    if (d === 'del') return setEntry(e => e.slice(0, -1))
    if (d === 'ok') {
      if (!entry) return
      const v = Number(entry), expected = q.seq[current!]
      const ok = v === expected
      onAttempt(entry, String(expected), ok)
      if (ok) { setFilled(f => ({ ...f, [current!]: v })); setEntry('') }
      else { setShake(true); setTimeout(() => { setShake(false); setEntry('') }, 450) }
      return
    }
    setEntry(e => (e.length >= 3 ? e : (e === '0' ? d : e + d)))
  }

  return (
    <>
      <div className="suite">
        {q.seq.map((n, i) => {
          const blank = q.blanks.includes(i)
          const isCur = i === current
          const val = blank ? (filled[i] ?? (isCur ? entry : '')) : n
          return (
            <div key={i} className="suite-cell">
              <div className={'box' + (blank ? ' blank' : '') + (isCur ? ' current' : '') + (blank && filled[i] !== undefined ? ' ok' : '') + (isCur && shake ? ' shake' : '')}>
                {val}
              </div>
              {i < q.seq.length - 1 && <span className={'jump' + (done ? ' show' : '')}>{down ? '−' : '+'}{q.step}</span>}
            </div>
          )
        })}
      </div>
      <div className="keypad" aria-label="Clavier">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} className="key" onClick={() => press(d)} disabled={done}>{d}</button>
        ))}
        <button className="key alt" onClick={() => press('del')} disabled={done} aria-label="Effacer">⌫</button>
        <button className="key" onClick={() => press('0')} disabled={done}>0</button>
        <button className="key go" onClick={() => press('ok')} disabled={done || !entry}>OK</button>
      </div>
    </>
  )
}
