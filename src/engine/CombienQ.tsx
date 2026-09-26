import { useState } from 'react'
import { Collection } from './Balls'
import type { CollectionQuestion } from './generate'
import type { QProps } from './EntoureQ'
import { useCountAlong } from './useCountAlong'
import { words } from './words'

/** "Combien de balles ?" — une collection, trois réponses. */
export function CombienQ({ q, onAttempt, onSolved }: QProps<CollectionQuestion>) {
  const [wrong, setWrong] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const { counted, showUnits } = useCountAlong(q.target, done, onSolved)

  return (
    <>
      <div className="solo"><Collection n={q.target} counted={counted} showUnits={showUnits} /></div>
      <div className="answers">
        {q.options.map((n, i) => (
          <button
            key={i}
            className={'answer' + (wrong.includes(i) ? ' wrong' : '') + (done && n === q.target ? ' right' : '')}
            disabled={done || wrong.includes(i)}
            onClick={() => {
              const ok = n === q.target
              onAttempt(String(n), String(q.target), ok)
              if (ok) setDone(true)
              else setWrong(w => [...w, i])
            }}
          >
            <span className="n">{n}</span>
            <span className="w">{words(n)}</span>
          </button>
        ))}
      </div>
    </>
  )
}
