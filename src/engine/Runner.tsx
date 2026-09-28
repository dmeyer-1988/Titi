import { useMemo, useRef, useState } from 'react'
import { Star } from './Balls'
import { CombienQ } from './CombienQ'
import { EntoureQ } from './EntoureQ'
import { makeRound, type Question } from './generate'
import { SuiteQ } from './SuiteQ'
import { TableQ } from './TableQ'
import { AlphaQ } from './AlphaQ'
import { SonQ, SonRule } from './SonQ'
import { CalcQ } from './CalcQ'
import { calcAnswer, opSign } from './calcul'
import { isTrap } from './sons'
import { LETTER_NAME } from './alphabet'
import { say, sounds } from './audio'
import type { AlphabetConfig, Exercise, SonConfig } from './types'
import { words } from './words'
import { Mascot } from '../mascot/Mascot'

export interface AttemptDraft {
  exercise_id: string | null
  exercise_type: Exercise['type']
  prompt: Record<string, unknown>
  expected: string
  given: string
  correct: boolean
  first_try: boolean
}

export interface RoundItem { ex: Exercise; q: Question }

interface Props {
  exercise: Exercise
  /** Défi du jour : questions venant de plusieurs exercices. */
  items?: RoundItem[]
  /** Appelé une fois à la fin de la partie. */
  onFinished?: (stars: number, total: number) => void
  childName?: string
  /** Mode test (espace parent) : rien n'est enregistré. */
  test?: boolean
  onRecord?: (a: AttemptDraft) => void
  onExit: () => void
}

const PRAISE = ['Bravo', 'Super', 'Génial', 'Parfait', 'Excellent']

export function Runner({ exercise, items, onFinished, childName, test, onRecord, onExit }: Props) {
  const build = (): RoundItem[] => items ?? makeRound(exercise).map(q => ({ ex: exercise, q }))
  const [round, setRound] = useState<RoundItem[]>(build)
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [phase, setPhase] = useState<'play' | 'solved' | 'end'>('play')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'no'; title: string; sub?: string } | null>(null)
  // Règle affichée avant la partie (son on/om) ou à la demande.
  const [rule, setRule] = useState(!items && exercise.type === 'son' && (exercise.config as SonConfig).showRule !== false)
  // tries = erreurs sur la case en cours ; misses = erreurs sur toute la question (pour l'étoile)
  const tries = useRef(0)
  const misses = useRef(0)
  const q = round[idx]?.q
  const ex = round[idx]?.ex ?? exercise
  const name = childName?.trim()
  const caps = ex.type === 'alphabet' && Boolean((ex.config as AlphabetConfig).capitals)
  const L = (l: string) => (caps ? l.toUpperCase() : l)

  const prompt = useMemo(() => {
    if (!q) return { text: '', speech: '' }
    if (ex.type === 'entoure' && q.kind === 'collection')
      return { text: <>Entoure la collection de <strong>{q.target}</strong> balles de tennis.</>, speech: `Entoure la collection de ${words(q.target)} balles de tennis.` }
    if (ex.type === 'combien')
      return { text: <>Combien de balles de tennis ?</>, speech: 'Combien de balles de tennis ?' }
    if (q.kind === 'calc') {
      const W = (k: 'a' | 'b' | 'c') => (q.blank === k ? 'combien' : words(q[k]))
      const text = q.blank === 'c' ? <>Calcule.</> : <>Trouve le nombre qui manque.</>
      return { text, speech: `${W('a')} ${q.op === '+' ? 'plus' : 'moins'} ${W('b')}, égale ${W('c')} ?` }
    }
    if (q.kind === 'son') return { text: <>Complète le mot avec <strong>on</strong> ou <strong>om</strong>.</>, speech: `Complète le mot ${q.word} avec o, n, ou o, m.` }
    if (q.kind === 'alpha') {
      if (q.skill === 'suite') return { text: <>Quelle lettre manque ?</>, speech: "Quelle lettre manque dans l'alphabet ?" }
      if (q.skill === 'position') {
        if (q.rel === 'entre') return { text: <>Quelle lettre vient entre <strong>{L(q.a)}</strong> et <strong>{L(q.b!)}</strong> ?</>, speech: `Quelle lettre vient entre ${LETTER_NAME[q.a]} et ${LETTER_NAME[q.b!]} ?` }
        const w = q.rel === 'avant' ? 'juste avant' : 'juste après'
        return { text: <>Quelle lettre vient {w} <strong>{L(q.a)}</strong> ?</>, speech: `Quelle lettre vient ${w} ${LETTER_NAME[q.a]} ?` }
      }
      if (q.skill === 'voyelles') return { text: <>Touche toutes les <strong>voyelles</strong>.</>, speech: 'Touche toutes les voyelles.' }
      return { text: <>Range les mots dans l'ordre alphabétique.</>, speech: "Range les mots dans l'ordre alphabétique. Regarde bien la première lettre de chaque mot." }
    }
    if (q.kind === 'table')
      return { text: <>Complète les cases vides du tableau.</>, speech: 'Complète les cases vides du tableau. Touche une case vide, puis écris le nombre.' }
    return { text: <>Complète la suite.</>, speech: 'Complète la suite. Trouve les nombres qui manquent.' }
  }, [q, ex.type])

  const onAttempt = (given: string, expected: string, correct: boolean) => {
    const first = tries.current === 0
    if (!test && onRecord) {
      onRecord({
        exercise_id: ex.id,
        exercise_type: ex.type,
        prompt: q as unknown as Record<string, unknown>,
        expected, given, correct, first_try: first,
      })
    }
    if (correct) {
      sounds.good()
      if (q.kind !== 'collection') setMsg(null)
      // Questions à plusieurs cases : chaque case repart « du premier coup ».
      if (q.kind === 'table' || q.kind === 'alpha' || q.kind === 'son') tries.current = 0
    } else {
      tries.current++
      misses.current++
      sounds.bad()
      const hint = q.kind === 'calc'
        ? (q.blank === 'a' ? "Fais le calcul à l'envers pour retrouver le premier nombre." : q.op === '+' ? 'Compte en avançant de 1 en 1 depuis le premier nombre.' : 'Compte en reculant de 1 en 1 depuis le premier nombre.')
        : q.kind === 'son'
        ? (isTrap(q.word) ? "C'est un mot piège : il ne suit pas la règle !" : 'Regarde la lettre juste après : est-ce un m, un b ou un p ?')
        : q.kind === 'alpha'
        ? (q.skill === 'voyelles' ? "Ce n'est pas une voyelle. Cherche encore !"
          : q.skill === 'ranger' ? "Regarde la première lettre de chaque mot. Laquelle vient en premier dans l'alphabet ?"
          : "Récite l'alphabet dans ta tête : a, b, c, d…")
        : q.kind === 'table'
        ? 'Additionne le nombre de la ligne et celui de la colonne.'
        : q.kind === 'suite'
        ? `Regarde de combien on avance à chaque fois.`
        : ex.type === 'entoure' ? 'Compte les paquets de 10.' : "Compte d'abord les paquets de 10, puis les balles seules."
      setMsg({ kind: 'no', title: 'Essaie encore !', sub: hint })
    }
  }

  const onSolved = () => {
    const first = misses.current === 0
    setResults(r => { const x = [...r]; x[idx] = first; return x })
    setPhase('solved')
    const praise = (first ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'Bien joué') + (name ? ' ' + name : '') + ' !'
    let sub = ''
    if (q.kind === 'collection') {
      const t = q.target, p = Math.floor(t / 10), u = t % 10
      sub = `${p} paquet${p > 1 ? 's' : ''} de 10${u ? ` et ${u} balle${u > 1 ? 's' : ''}` : ''} = ${t} (${words(t)})`
      say(`${words(t)} balles ! ${first ? praise : ''}`)
    } else if (q.kind === 'calc') {
      sub = `${q.a} ${opSign(q.op)} ${q.b} = ${q.c}`
      say(`${words(calcAnswer(q))} ! ${praise}`)
    } else if (q.kind === 'son') {
      sub = isTrap(q.word) ? `« ${q.word} » est un mot piège : apprends-le par cœur.` : `« ${q.word} »`
      say(`${q.word}. ${praise}`)
    } else if (q.kind === 'alpha') {
      if (q.skill === 'suite') sub = q.seq.map(L).join('  ')
      else if (q.skill === 'position') sub = q.rel === 'entre' ? `Entre ${L(q.a)} et ${L(q.b!)}, il y a ${L(q.answer)}.` : q.rel === 'avant' ? `Avant ${L(q.a)}, il y a ${L(q.answer)}.` : `Après ${L(q.a)}, il y a ${L(q.answer)}.`
      else if (q.skill === 'voyelles') sub = `Les voyelles : ${['a', 'e', 'i', 'o', 'u', 'y'].map(L).join(' ')}`
      else { const o = [...q.words].sort((a, b) => a[0].localeCompare(b[0])); sub = `${o.join(', ')} (${o.map(w => L(w[0])).join(', ')})` }
      say(praise)
    } else if (q.kind === 'table') {
      sub = first ? 'Tableau complet, sans une seule erreur !' : `Tableau complet ! ${misses.current} erreur${misses.current > 1 ? 's' : ''} corrigée${misses.current > 1 ? 's' : ''}.`
      say(praise)
    } else {
      const down = q.seq[1] < q.seq[0]
      sub = `On ${down ? 'recule' : 'avance'} de ${q.step} à chaque fois.`
      say(praise)
    }
    setMsg({ kind: 'ok', title: praise, sub })
  }

  const next = () => {
    tries.current = 0
    misses.current = 0
    setMsg(null)
    if (idx + 1 < round.length) { setIdx(idx + 1); setPhase('play') }
    else {
      setPhase('end')
      sounds.fanfare()
      const s = results.filter(Boolean).length
      say(endMessage(s, round.length, name))
      onFinished?.(s, round.length)
    }
  }

  const restart = () => {
    setRound(build()); setIdx(0); setResults([]); setPhase('play'); setMsg(null); tries.current = 0; misses.current = 0
  }

  const stars = results.filter(Boolean).length

  return (
    <div className="runner">
      <div className="runner-top">
        <button className="back" onClick={onExit} aria-label="Retour au menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          Menu
        </button>
        <div className="runner-title">{exercise.title}{test && <span className="pill">Test</span>}</div>
        {items && ex && <span className="pill muted from-game">{ex.title}</span>}
      </div>

      <div className="progress" aria-label={`Question ${Math.min(idx + 1, round.length)} sur ${round.length}`}>
        {round.map((_, i) => (
          results[i] ? <Star key={i} className="dot-star" />
            : <span key={i} className={'dot' + (results[i] === false ? ' done' : '') + (i === idx && phase !== 'end' ? ' now' : '')} />
        ))}
        <span className="count">{Math.min(idx + 1, round.length)} / {round.length}</span>
      </div>

      {rule ? (
        <SonRule onClose={() => setRule(false)} cta={idx === 0 && phase === 'play' && results.length === 0 ? "J'ai compris, on joue !" : 'Revenir au jeu'} />
      ) : phase === 'end' ? (
        <div className="end">
          <Mascot size="lg" mood="cheer" text={endMessage(stars, round.length, name)} />
          <div className="stars">
            {Array.from({ length: stars }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.12}s` }}><Star /></span>)}
          </div>
          <div className="big">{stars} / {round.length}</div>
          <div className="end-actions">
            {!items && <button className="btn" onClick={restart}>Rejouer</button>}
            <button className="btn ghost" onClick={onExit}>Menu</button>
          </div>
        </div>
      ) : (
        <>
          <div className="prompt">
            <button className="icon-btn" onClick={() => say(prompt.speech)} aria-label="Écouter la consigne">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
            </button>
            <span>{prompt.text}</span>
            {ex.type === 'son' && <button className="btn ghost small rule-btn" onClick={() => setRule(true)}>La règle</button>}
          </div>
          {ex.type === 'entoure' && q.kind === 'collection' && (
            <>
              <div className="hint">Dessine un rond avec ton doigt autour de la bonne collection.</div>
              <EntoureQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={s => setMsg({ kind: 'no', title: 'Presque !', sub: s })} />
            </>
          )}
          {ex.type === 'combien' && q.kind === 'collection' && (
            <CombienQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          {q.kind === 'calc' && (
            <CalcQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          {q.kind === 'son' && (
            <SonQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          {q.kind === 'alpha' && (
            <AlphaQ key={idx} q={q} capitals={caps} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          {q.kind === 'table' && (
            <TableQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          {q.kind === 'suite' && (
            <SuiteQ key={idx} q={q} onAttempt={onAttempt} onSolved={onSolved} onNudge={() => {}} />
          )}
          <div className="feedback" aria-live="polite">
            {msg ? (
              <Mascot
                size="sm"
                mood={msg.kind === 'ok' ? 'cheer' : 'think'}
                text={<><b className={'msg ' + msg.kind}>{msg.title}</b>{msg.sub && <small>{msg.sub}</small>}</>}
                speak={msg.kind === 'no' && msg.sub ? msg.sub : false}
              />
            ) : <span />}
            {phase === 'solved' && (
              <button className="btn" onClick={next} autoFocus>{idx + 1 < round.length ? 'Suivant' : 'Voir mes étoiles'}</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function endMessage(s: number, total: number, name?: string) {
  const n = name ? `, ${name}` : ''
  const r = s / total
  return r >= 0.9 ? `Champion${n} !` : r >= 0.6 ? `Très bien joué${n} !` : `Bon match${n}, on rejoue ?`
}
