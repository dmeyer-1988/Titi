import { useEffect, useMemo, useState } from 'react'
import type { SonQuestion } from './generate'
import type { QProps } from './EntoureQ'
import { isTrap, parseSon, reason } from './sons'
import { say } from './audio'

/** Choisis « on » ou « om » pour chaque trou du mot. */
export function SonQ({ q, onAttempt, onSolved }: QProps<SonQuestion>) {
  const parts = useMemo(() => parseSon(q.word), [q.word])
  const blanks = parts.map((p, i) => ('blank' in p ? i : -1)).filter(i => i >= 0)
  const [filled, setFilled] = useState<number[]>([])
  const [shake, setShake] = useState<'on' | 'om' | null>(null)
  const [missed, setMissed] = useState(false)
  const current = blanks.find(i => !filled.includes(i))
  const done = current === undefined
  const trap = isTrap(q.word)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const choose = (v: 'on' | 'om') => {
    if (done) return
    const p = parts[current!] as { blank: 'on' | 'om'; next: string | null }
    const ok = v === p.blank
    onAttempt(v, p.blank, ok)
    if (ok) setFilled(f => [...f, current!])
    else { setShake(v); setMissed(true); setTimeout(() => setShake(null), 450) }
  }

  // La lettre qui suit chaque trou est mise en couleur une fois le trou rempli.
  let colorNext = false
  return (
    <div className="son-q">
      <div className="son-word-row">
        <button className="icon-btn" onClick={() => say(q.word)} aria-label="Écouter le mot">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
        </button>
        <div className="son-word" aria-label={done ? q.word : 'mot à compléter'}>
          {parts.map((p, i) => {
            if ('blank' in p) {
              const isFilled = filled.includes(i)
              colorNext = isFilled && p.blank === 'om'
              return (
                <span key={i} className={'son-gap' + (isFilled ? ' ok ' + p.blank : '') + (i === current ? ' current' : '')}>
                  {isFilled ? p.blank : ''}
                </span>
              )
            }
            const first = p.text[0], rest = p.text.slice(1)
            const hl = colorNext && 'mbp'.includes(first)
            colorNext = false
            return <span key={i}>{hl ? <b className="son-mbp">{first}</b> : first}{rest}</span>
          })}
        </div>
        {trap && (done || missed) && <span className="trap-badge">Mot piège</span>}
      </div>

      <div className="son-choices">
        {(['on', 'om'] as const).map(v => (
          <button key={v} className={'son-choice ' + v + (shake === v ? ' wrong-now' : '')} disabled={done} onClick={() => choose(v)}>
            {v}
          </button>
        ))}
      </div>

      {done && (
        <ul className="son-why">
          {blanks.map(i => <li key={i}>{reason(parts[i] as { blank: 'on' | 'om'; next: string | null }, q.word)}</li>)}
        </ul>
      )}
    </div>
  )
}

/** La règle, montrée au début de la partie et à la demande. */
export function SonRule({ onClose, cta = "J'ai compris, on joue !" }: { onClose: () => void; cta?: string }) {
  return (
    <div className="son-rule">
      <div className="eyebrow">La règle</div>
      <h2>Le son <span className="sound">[on]</span></h2>

      <div className="rule-block plain">
        <p>En général, il s'écrit <span className="chip on">on</span></p>
        <p className="ex">un ball<b>on</b> · un mout<b>on</b> · b<b>on</b>jour</p>
      </div>

      <div className="rule-block main">
        <p>Devant <span className="chip l">m</span> <span className="chip l">b</span> <span className="chip l">p</span> il s'écrit <span className="chip om">om</span></p>
        <p className="ex">une <b>om</b><i>b</i>re · t<b>om</b><i>b</i>er · un p<b>om</b><i>p</i>on</p>
      </div>

      <div className="rule-block trap">
        <p><span className="trap-badge">Mots pièges</span> à apprendre par cœur</p>
        <p className="ex">un b<b>on</b>b<b>on</b> <small>(on devant b !)</small> · un n<b>om</b> · un prén<b>om</b> <small>(om à la fin)</small></p>
      </div>

      <div className="rule-actions">
        <button className="btn ghost" onClick={() => say("Le son on. En général, il s'écrit o, n. Devant m, b, p, il s'écrit o, m. Attention aux mots pièges : bonbon, nom et prénom.")}>Écouter la règle</button>
        <button className="btn" onClick={onClose}>{cta}</button>
      </div>
    </div>
  )
}
