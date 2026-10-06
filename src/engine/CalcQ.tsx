import { useEffect, useState } from 'react'
import { calcAnswer, opSign, type CalcQuestion } from './calcul'
import type { QProps } from './EntoureQ'

/** Calcul « 34 + 3 = ? » ou « 34 + ? = 37 », avec un clavier à chiffres. */
export function CalcQ({ q, onAttempt, onSolved }: QProps<CalcQuestion>) {
  const [entry, setEntry] = useState('')
  const [done, setDone] = useState(false)
  const [shake, setShake] = useState(false)
  const [help, setHelp] = useState(false)
  const answer = calcAnswer(q)

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
      const ok = Number(entry) === answer
      onAttempt(entry, String(answer), ok)
      if (ok) setDone(true)
      else { setShake(true); setHelp(true); setTimeout(() => { setShake(false); setEntry('') }, 450) }
      return
    }
    setEntry(e => (e.length >= 4 ? e : e === '0' ? d : e + d))
  }

  const box = (key: 'a' | 'b' | 'c') => {
    const blank = q.blank === key
    return (
      <span className={'cbox' + (blank ? ' blank' : '') + (blank && done ? ' ok' : '') + (blank && shake ? ' shake' : '')}>
        {blank ? (done ? answer : entry || '?') : q[key]}
      </span>
    )
  }

  // Aide après une erreur : on compte les bonds de 1 depuis le premier nombre.
  const hops = help && !q.tip && q.blank !== 'a' && q.b > 0 && q.b <= 10
    ? Array.from({ length: q.b + 1 }, (_, i) => (q.op === '+' ? q.a + i : q.a - i))
    : null

  return (
    <div className="calc-q">
      <div className="calc-eq" aria-label="Calcul">
        {box('a')}
        <span className="cop">{opSign(q.op)}</span>
        {box('b')}
        <span className="cop">=</span>
        {box('c')}
      </div>

      {help && (
        <div className="calc-help">
          {q.tip ? (
            <p>Astuce : {q.tip}</p>
          ) : hops ? (
            <div className="hops" aria-label="Compter les bonds">
              {hops.map((n, i) => (
                <span key={i} className={'hop' + (i === 0 ? ' start' : '')}>
                  {i > 0 && <i>{opSign(q.op)}1</i>}
                  <b>{q.blank === 'c' && i === hops.length - 1 && !done ? '?' : n}</b>
                </span>
              ))}
            </div>
          ) : (
            <p>Astuce : fais le calcul à l'envers. {q.op === '+' ? `${q.c} ${opSign('-')} ${q.b} = ?` : `${q.c} + ${q.b} = ?`}</p>
          )}
        </div>
      )}

      <div className="keypad" aria-label="Clavier">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} className="key" onClick={() => press(d)} disabled={done}>{d}</button>
        ))}
        <button className="key alt" onClick={() => press('del')} disabled={done} aria-label="Effacer">⌫</button>
        <button className="key" onClick={() => press('0')} disabled={done}>0</button>
        <button className="key go" onClick={() => press('ok')} disabled={done || !entry}>OK</button>
      </div>
    </div>
  )
}
