import { Otter } from '../mascot/Otter'
import { skillsFor, type Skill } from '../engine/skills'
import { pathNodes } from '../lib/mastery'
import type { Attempt, Subject } from '../engine/types'

// Tracé en coordonnées fixes (largeur de référence 430) : tout est dans un
// SVG qui se met à l'échelle, la loutre est positionnée en % pour suivre.
const W = 430
const X = [215, 72, 215, 358]
const Y0 = 120
const STEP = 132
const R = 34

const coord = (i: number): [number, number] => [X[i % 4], Y0 + i * STEP]

export function Path({ subject, childName, level, attempts, onPlay, onExit }: {
  subject: Subject
  childName: string
  level: number
  attempts: Attempt[]
  onPlay: (skill: Skill) => void
  onExit: () => void
}) {
  const skills = skillsFor(subject, level)
  const label = subject === 'maths' ? 'Maths' : 'Français'

  if (skills.length === 0) {
    return (
      <div className="sheet narrow">
        <button className="back" onClick={onExit}>Retour</button>
        <h1>Le chemin des jeux</h1>
        <p className="lead">La carte arrive bientôt pour la {level}P ! En attendant, les jeux classiques vous attendent sur l'accueil.</p>
      </div>
    )
  }

  const nodes = pathNodes(skills, attempts)
  const done = nodes.filter(n => n.state === 'done').length
  const current = nodes.find(n => n.state === 'current')
  const h = Y0 + (skills.length - 1) * STEP + R + 74
  const points = nodes.map((_, i) => coord(i).join(',')).join(' ')

  return (
    <div className="sheet">
      <header className="parent-head">
        <div>
          <button className="back" onClick={onExit}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
            Accueil
          </button>
          <div className="eyebrow">Le chemin des jeux · {label}</div>
          <h1>{done} / {nodes.length} nœuds</h1>
        </div>
      </header>
      <p className="muted path-hint">
        {current
          ? <>Nœud en cours pour <b>{childName}</b> : <b>{current.skill.label}</b>. Termine-le pour que la loutre avance !</>
          : <>Toutes les compétences sont validées — bravo {childName} ! Rejoue un nœud pour t'entraîner.</>}
      </p>

      <div className="pathmap" style={{ height: h }}>
        <svg viewBox={`0 0 ${W} ${h}`} aria-hidden="true">
          <polyline points={points} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 16" />
        </svg>
        {nodes.map((n, i) => {
          const [x, y] = coord(i)
          const playable = n.state !== 'locked'
          return (
            <button
              key={n.skill.id}
              className={`pnode ${n.state}`}
              style={{ left: `${(x / W) * 100}%`, top: `${(y / h) * 100}%` }}
              disabled={!playable}
              onClick={() => playable && onPlay(n.skill)}
              aria-label={n.state === 'locked' ? `${n.skill.label} (verrouillé)` : `Jouer : ${n.skill.label}`}
            >
              <span className="pnode-num">{n.state === 'locked' ? '🔒' : i + 1}</span>
              {n.state === 'done' && (
                <span className="pnode-stars" aria-label={`${n.stars} étoile${n.stars > 1 ? 's' : ''}`}>
                  {'★'.repeat(n.stars)}{'☆'.repeat(3 - n.stars)}
                </span>
              )}
              <span className="pnode-label">{n.skill.label}</span>
            </button>
          )
        })}
        {current && (
          <div className="path-otter" style={{ left: `${(coord(nodes.indexOf(current))[0] / W) * 100}%`, top: `${(coord(nodes.indexOf(current))[1] / h) * 100}%` }}>
            <Otter mood="hello" />
          </div>
        )}
      </div>
    </div>
  )
}
