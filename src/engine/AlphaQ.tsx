import { useEffect, useState } from 'react'
import { ALPHABET, VOWELS, type AlphaQuestion } from './alphabet'
import type { QProps } from './EntoureQ'

type Props = QProps<AlphaQuestion> & { capitals: boolean }

export function AlphaQ(p: Props) {
  switch (p.q.skill) {
    case 'suite':
    case 'position': return <PickLetter {...p} />
    case 'voyelles': return <Vowels {...p} />
    case 'ranger': return <Sort {...p} />
  }
}

const show = (l: string, caps: boolean) => (caps ? l.toUpperCase() : l)

function useSolvedAfter(done: boolean, onSolved: () => void, ms = 650) {
  useEffect(() => {
    if (!done) return
    const t = setTimeout(onSolved, ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])
}

/** Lettre qui manque / avant / après / entre : une rangée de lettres avec un trou, 4 lettres à choisir. */
function PickLetter({ q, capitals, onAttempt, onSolved }: Props) {
  const [wrong, setWrong] = useState<string[]>([])
  const [done, setDone] = useState(false)
  useSolvedAfter(done, onSolved)
  if (q.skill !== 'suite' && q.skill !== 'position') return null

  let row: (string | null)[]
  let answer: string
  if (q.skill === 'suite') { row = q.seq.map((l, i) => (i === q.blank ? null : l)); answer = q.seq[q.blank] }
  else {
    answer = q.answer
    row = q.rel === 'avant' ? [null, q.a] : q.rel === 'apres' ? [q.a, null] : [q.a, null, q.b!]
  }

  return (
    <>
      <div className="letter-row">
        {row.map((l, i) => (
          <span key={i} className={'ltile' + (l === null ? ' hole' + (done ? ' ok' : '') : '')}>
            {l === null ? (done ? show(answer, capitals) : '?') : show(l, capitals)}
          </span>
        ))}
      </div>
      <div className="letter-options">
        {q.options.map(l => (
          <button
            key={l}
            className={'ltile big' + (wrong.includes(l) ? ' wrong' : '') + (done && l === answer ? ' right' : '')}
            disabled={done || wrong.includes(l)}
            onClick={() => {
              const ok = l === answer
              onAttempt(l, answer, ok)
              if (ok) setDone(true)
              else setWrong(w => [...w, l])
            }}
          >
            {show(l, capitals)}
          </button>
        ))}
      </div>
    </>
  )
}

/** Touche toutes les voyelles. */
function Vowels({ q, capitals, onAttempt, onSolved }: Props) {
  const [found, setFound] = useState<number[]>([])
  const [wrong, setWrong] = useState<number[]>([])
  const letters = q.skill === 'voyelles' ? q.letters : []
  const total = letters.filter(l => VOWELS.includes(l)).length
  const done = found.length === total
  useSolvedAfter(done, onSolved)

  return (
    <>
      <div className="letter-grid">
        {letters.map((l, i) => (
          <button
            key={i}
            className={'ltile big' + (found.includes(i) ? ' right' : '') + (wrong.includes(i) ? ' wrong' : '')}
            disabled={done || found.includes(i) || wrong.includes(i)}
            onClick={() => {
              const ok = VOWELS.includes(l)
              onAttempt(l, ok ? l : 'voyelle', ok)
              if (ok) setFound(f => [...f, i])
              else setWrong(w => [...w, i])
            }}
          >
            {show(l, capitals)}
          </button>
        ))}
      </div>
      <p className="alpha-count">{done ? 'Toutes les voyelles sont trouvées !' : `Voyelles trouvées : ${found.length} sur ${total}`}</p>
    </>
  )
}

/** Range les mots dans l'ordre alphabétique, en regardant la première lettre. */
function Sort({ q, capitals, onAttempt, onSolved }: Props) {
  const words = q.skill === 'ranger' ? q.words : []
  const sorted = [...words].sort((a, b) => a[0].localeCompare(b[0]))
  const [placed, setPlaced] = useState<string[]>([])
  const [shake, setShake] = useState<string | null>(null)
  const [helped, setHelped] = useState(false)
  const done = placed.length === words.length
  useSolvedAfter(done, onSolved, 800)

  const word = (w: string) => (
    <>
      <span className="first">{show(w[0], capitals)}</span>{capitals ? w.slice(1).toUpperCase() : w.slice(1)}
    </>
  )

  return (
    <>
      <ol className="slots">
        {sorted.map((_, i) => (
          <li key={i} className={'slot' + (placed[i] ? ' filled' : '') + (i === placed.length && !done ? ' next' : '')}>
            <span className="slot-n">{i + 1}</span>
            {placed[i] ? <span className="word">{word(placed[i])}</span> : <span className="word empty" />}
          </li>
        ))}
      </ol>
      <div className="word-pool">
        {words.map(w => (
          <button
            key={w}
            className={'word-card' + (placed.includes(w) ? ' used' : '') + (shake === w ? ' wrong-now' : '')}
            disabled={done || placed.includes(w)}
            onClick={() => {
              const expected = sorted[placed.length]
              const ok = w === expected
              onAttempt(w, expected, ok)
              if (ok) setPlaced(p => [...p, w])
              else { setShake(w); setHelped(true); setTimeout(() => setShake(null), 450) }
            }}
          >
            {word(w)}
          </button>
        ))}
      </div>
      {helped && (
        <div className="frieze" aria-label="Alphabet">
          {ALPHABET.map(l => (
            <span key={l} className={words.some(w => w[0] === l) ? 'on' : ''}>{show(l, capitals)}</span>
          ))}
        </div>
      )}
    </>
  )
}
