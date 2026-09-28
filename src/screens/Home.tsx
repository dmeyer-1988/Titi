import { Pack } from '../engine/Balls'
import type { Child, Exercise, Subject } from '../engine/types'
import { SUBJECTS, TYPE_LABEL, TYPE_SUBJECT } from '../engine/types'

export function Thumb({ ex }: { ex: Exercise }) {
  if (ex.type === 'son') {
    return (
      <div className="thumb son-thumb" aria-hidden="true">
        <span className="w">p<b>om</b>p<b className="on">on</b></span>
      </div>
    )
  }
  if (ex.type === 'alphabet') {
    const k = (ex.config as { skills?: string[] }).skills || []
    const letters = k.length === 1 && k[0] === 'voyelles' ? ['a', 'b', 'e'] : k.length === 1 && k[0] === 'ranger' ? ['arbre'] : ['a', 'b', '']
    return (
      <div className="thumb alpha-thumb" aria-hidden="true">
        {letters.map((l, i) => <span key={i} className={(l === '' ? 'empty' : '') + (l.length > 1 ? ' word' : '') + (k.length === 1 && k[0] === 'voyelles' && l !== 'b' ? ' on' : '')}>{l}</span>)}
      </div>
    )
  }
  if (ex.type === 'table') {
    const cells = ['+', '3', '7', '6', '9', '', '4', '', '11']
    return (
      <div className="thumb table-thumb" aria-hidden="true">
        {cells.map((t, i) => <span key={i} className={(i < 3 || i % 3 === 0 ? 'h' : '') + (t === '' ? ' empty' : '')}>{t}</span>)}
      </div>
    )
  }
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

/** Illustration de chaque matière, dessinée avec les éléments des fiches. */
function SubjectArt({ id }: { id: Subject }) {
  if (id === 'maths') {
    return (
      <div className="subject-art maths" aria-hidden="true">
        <Pack />
        <span className="op">+</span>
        <span className="num">7</span>
      </div>
    )
  }
  return (
    <div className="subject-art francais" aria-hidden="true">
      <span className="letter">A</span><span className="letter">b</span><span className="letter">c</span>
    </div>
  )
}

interface Props {
  children: Child[]
  child: Child
  exercises: Exercise[]
  stars: Record<string, number>
  offline: boolean
  subject: Subject | null
  onSubject: (s: Subject | null) => void
  onPickChild: (id: string) => void
  onPlay: (ex: Exercise) => void
  onParent: () => void
}

export function Home({ children, child, exercises, stars, offline, subject, onSubject, onPickChild, onPlay, onParent }: Props) {
  const active = exercises.filter(e => e.active)
  const total = Object.values(stars).reduce((a, b) => a + b, 0)
  const bySubject = (s: Subject) => active.filter(e => TYPE_SUBJECT[e.type] === s)
  const starsFor = (list: Exercise[]) => list.reduce((a, e) => a + (stars[e.id] || 0), 0)
  const current = subject ? SUBJECTS.find(s => s.id === subject)! : null
  const games = subject ? bySubject(subject) : []

  return (
    <div className="sheet">
      <header className="home-head">
        <div>
          {current ? (
            <>
              <button className="back" onClick={() => onSubject(null)}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
                Matières
              </button>
              <h1 className={'subject-title ' + current.id}>{current.label}</h1>
            </>
          ) : (
            <>
              <div className="eyebrow">4<sup>e</sup> HarmoS</div>
              <h1>Salut {child.name} !</h1>
            </>
          )}
        </div>
        <div className="total-stars" aria-label={`${total} étoiles`}>
          <svg className="ball" aria-hidden="true"><use href="#ball" /></svg>
          <span>{total}</span>
        </div>
      </header>

      {!current && children.length > 1 && (
        <div className="seg kids" role="group" aria-label="Qui joue ?">
          {children.map(c => (
            <button key={c.id} aria-pressed={c.id === child.id} onClick={() => onPickChild(c.id)}>{c.name}</button>
          ))}
        </div>
      )}

      {!current ? (
        <>
          <p className="lead">Qu'est-ce qu'on travaille aujourd'hui ?</p>
          <div className="subjects">
            {SUBJECTS.map(s => {
              const list = bySubject(s.id)
              const empty = list.length === 0
              return (
                <button key={s.id} className={'subject ' + s.id} disabled={empty} onClick={() => onSubject(s.id)}>
                  <SubjectArt id={s.id} />
                  <span className="subject-name">{s.label}</span>
                  <span className="subject-meta">
                    {empty ? <span>Bientôt</span> : (
                      <>
                        <span>{list.length} jeu{list.length > 1 ? 'x' : ''}</span>
                        <span className="mini-stars"><svg className="ball" aria-hidden="true"><use href="#ball" /></svg>{starsFor(list)}</span>
                      </>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <p className="lead">Choisis un jeu.</p>
          {games.length === 0 ? (
            <p className="empty-note">Pas encore de jeu ici. Demande à papa ou maman d'en ajouter un.</p>
          ) : (
            <div className="games">
              {games.map(ex => (
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
        </>
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
