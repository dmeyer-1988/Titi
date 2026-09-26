import { Pack } from '../engine/Balls'
import type { Child, Exercise } from '../engine/types'
import { TYPE_LABEL } from '../engine/types'

export function Thumb({ ex }: { ex: Exercise }) {
  if (ex.type === 'suite') {
    const s = (ex.config as { step: number }).step || 10
    return (
      <div className="thumb suite-thumb" aria-hidden="true">
        <span>{s * 2}</span><span>{s * 3}</span><span className="empty" />
      </div>
    )
  }
  return (
    <div className={'thumb ' + ex.type} aria-hidden="true">
      <Pack />
      {ex.type === 'combien' && <span className="q">?</span>}
      {ex.type === 'entoure' && <span className="loop" />}
    </div>
  )
}

interface Props {
  children: Child[]
  child: Child
  exercises: Exercise[]
  stars: Record<string, number>
  offline: boolean
  onPickChild: (id: string) => void
  onPlay: (ex: Exercise) => void
  onParent: () => void
}

export function Home({ children, child, exercises, stars, offline, onPickChild, onPlay, onParent }: Props) {
  const active = exercises.filter(e => e.active)
  const total = Object.values(stars).reduce((a, b) => a + b, 0)
  return (
    <div className="sheet">
      <header className="home-head">
        <div>
          <div className="eyebrow">4<sup>e</sup> / <b>Nombres</b></div>
          <h1>Salut {child.name} !</h1>
        </div>
        <div className="total-stars" aria-label={`${total} étoiles`}>
          <svg className="ball" aria-hidden="true"><use href="#ball" /></svg>
          <span>{total}</span>
        </div>
      </header>

      {children.length > 1 && (
        <div className="seg kids" role="group" aria-label="Qui joue ?">
          {children.map(c => (
            <button key={c.id} aria-pressed={c.id === child.id} onClick={() => onPickChild(c.id)}>{c.name}</button>
          ))}
        </div>
      )}

      <p className="lead">Choisis un jeu.</p>
      {active.length === 0 ? (
        <p className="empty-note">Pas encore de jeu. Demande à papa ou maman d'en ajouter un.</p>
      ) : (
        <div className="games">
          {active.map(ex => (
            <button key={ex.id} className="game" onClick={() => onPlay(ex)}>
              <Thumb ex={ex} />
              <span className="game-title">{ex.title}</span>
              <span className="game-meta">
                <span className="type">{TYPE_LABEL[ex.type]}</span>
                <span className="mini-stars"><svg className="ball" aria-hidden="true"><use href="#ball" /></svg>{stars[ex.id] || 0}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <footer className="home-foot">
        {offline && <span className="pill muted">Hors ligne · les réponses seront envoyées plus tard</span>}
        <button className="parent-link" onClick={onParent}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Espace parent
        </button>
      </footer>
    </div>
  )
}
