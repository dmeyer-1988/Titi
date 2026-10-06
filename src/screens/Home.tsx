import { Pack } from '../engine/Balls'
import { CastleArt } from '../engine/MystereQ'
import type { Child, Exercise, Subject } from '../engine/types'
import { SUBJECTS, TYPE_LABEL, TYPE_SUBJECT } from '../engine/types'
import { Mascot } from '../mascot/Mascot'
import type { Mood } from '../mascot/Otter'

export function Thumb({ ex }: { ex: Exercise }) {
  if (ex.type === 'calcul' && (ex.config as { astuces?: boolean }).astuces) {
    return <div className="thumb calc-thumb" aria-hidden="true"><span>7</span><i>+</i><span className="q">?</span><i>=</i><span>10</span></div>
  }
  if (ex.type === 'calcul') {
    const c = ex.config as { op?: string; find?: string }
    const sign = c.op === '-' ? '−' : '+'
    const miss = c.find === 'manquant'
    return (
      <div className="thumb calc-thumb" aria-hidden="true">
        <span>34</span><i>{sign}</i><span className={miss ? 'q' : ''}>{miss ? '?' : '3'}</span><i>=</i>
        <span className={miss ? '' : 'q'}>{miss ? (sign === '+' ? '37' : '31') : '?'}</span>
      </div>
    )
  }
  if (ex.type === 'noeuds') {
    return (
      <div className="thumb noeud-thumb" aria-hidden="true">
        <svg viewBox="0 0 90 70">
          {[0, 1, 2, 3].map(i => <g key={i}><line x1={14 + i * 22} y1={6} x2={14 + i * 22} y2={58} /><line x1={14} y1={6 + i * 17.3} x2={80} y2={6 + i * 17.3} /></g>)}
          <text x="58" y="30" fontSize="20" textAnchor="middle">🐱</text>
          <text x="58" y="69" className="lab" textAnchor="middle">C</text>
        </svg>
      </div>
    )
  }
  if (ex.type === 'mystere') {
    return <div className="thumb myst-thumb" aria-hidden="true"><CastleArt c={[1, 0, 1, 0]} /><span className="q">?</span></div>
  }
  if (ex.type === 'chateaux') {
    return (
      <div className="thumb chateau-thumb" aria-hidden="true">
        {[3, 5].map((h, i) => <span key={i} className={'t' + i}>{Array.from({ length: h }, (_, k) => <i key={k} />)}</span>)}
      </div>
    )
  }
  if (ex.type === 'capacite') {
    return (
      <div className="thumb cap-thumb" aria-hidden="true">
        <svg viewBox="0 0 96 70">
          <rect x="14" y="16" width="18" height="48" fill="#6FB7E8" />
          <path d="M12 8 V66 H34 V8" fill="none" stroke="#D6453A" strokeWidth="4" />
          <rect x="48" y="44" width="40" height="20" fill="#6FB7E8" />
          <path d="M46 34 V66 H90 V34" fill="none" stroke="#2F8F55" strokeWidth="4" />
        </svg>
      </div>
    )
  }
  if (ex.type === 'suite' && (ex.config as { oral?: boolean }).oral) {
    return <div className="thumb suite-thumb oral" aria-hidden="true"><span>🔊</span><span className="empty" /><span className="empty" /></div>
  }
  if (ex.type === 'paquets') {
    const pos: [number, number][] = [[18, 22], [34, 16], [50, 26], [22, 44], [40, 40], [60, 46], [30, 66], [48, 62], [16, 76], [64, 72], [80, 30], [84, 62]]
    return (
      <div className="thumb paq-thumb" aria-hidden="true">
        <svg viewBox="0 0 100 100"><path d="M10 30 C 8 8, 60 6, 66 30 C 74 60, 66 84, 40 82 C 12 80, 12 56, 10 30 Z" fill="none" stroke="#2D6A9F" strokeWidth="3.5" strokeLinecap="round" /></svg>
        {pos.map(([x, y], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%` }} />)}
      </div>
    )
  }
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
  wallet: number
  packPrice: number
  mascotName: string
  weekDays: number
  dailyDone: boolean
  dailyReady: boolean
  onDaily: () => void
  albumOwned: number | null
  albumTotal: number
  onAlbum: () => void
  team: { name: string; avatar: string } | null
  onTeam: () => void
  offline: boolean
  subject: Subject | null
  onSubject: (s: Subject | null) => void
  onPickChild: (id: string) => void
  onPlay: (ex: Exercise) => void
  onRevision: (s: Subject) => void
  onParent: () => void
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Ce que dit la loutre en arrivant : on choisit le message le plus utile du moment. */
function greeting(p: Props): { text: string; mood: Mood } {
  const h = new Date().getHours()
  const hello = h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir'
  const days = DAYS.reduce((n, _, i) => n + ((p.weekDays >> i) & 1), 0)
  const missing = p.packPrice - p.wallet
  if (!p.dailyDone && p.dailyReady) return { mood: 'hello', text: `${hello} ${p.child.name} ! C'est moi, ${p.mascotName}. Ton défi du jour t'attend !` }
  if (p.wallet >= p.packPrice) return { mood: 'cheer', text: `Tu as ${p.wallet} étoiles : tu peux ouvrir une pochette dans ton album !` }
  if (days >= 3) return { mood: 'cheer', text: `Déjà ${days} jours cette semaine, bravo ${p.child.name} !` }
  if (missing > 0 && missing <= 5) return { mood: 'happy', text: `Plus que ${missing} étoile${missing > 1 ? 's' : ''} pour une nouvelle pochette !` }
  return { mood: 'hello', text: `${hello} ${p.child.name} ! On joue ensemble ?` }
}

export function Home(p: Props) {
  const { children, child, exercises, stars, wallet, packPrice, weekDays, dailyDone, dailyReady, onDaily, albumOwned, albumTotal, onAlbum, team, onTeam, offline, subject, onSubject, onPickChild, onPlay, onRevision, onParent } = p
  const active = exercises.filter(e => e.active)
  const bySubject = (s: Subject) => active.filter(e => TYPE_SUBJECT[e.type] === s)
  const starsFor = (list: Exercise[]) => list.reduce((a, e) => a + (stars[e.id] || 0), 0)
  const current = subject ? SUBJECTS.find(s => s.id === subject)! : null
  const games = subject ? bySubject(subject) : []
  const g = greeting(p)
  const todayIdx = (new Date().getDay() + 6) % 7
  const packPct = Math.min(100, Math.round((wallet / packPrice) * 100))

  const starIcon = <svg className="star" aria-hidden="true"><use href="#star" /></svg>

  if (current) {
    return (
      <div className="sheet">
        <header className="home-head">
          <div>
            <button className="back" onClick={() => onSubject(null)}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
              Accueil
            </button>
            <h1 className={'subject-title ' + current.id}>{current.label}</h1>
          </div>
          <div className="total-stars" aria-label={`${wallet} étoiles`}>{starIcon}<span>{wallet}</span></div>
        </header>
        <p className="lead">Choisis un jeu.</p>
        {games.some(e => (e.config as { revision?: boolean }).revision) && (
          <button className="daily revision" onClick={() => onRevision(current.id)}>
            <span className="daily-text">
              <span className="eyebrow-light">Révision du test</span>
              <b>Un peu de tout, comme le jour du test</b>
              <span className="daily-reward">{games.filter(e => (e.config as { revision?: boolean }).revision).length} jeux mélangés</span>
            </span>
            <span className="daily-go" aria-hidden="true">▶</span>
          </button>
        )}
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
                  <span className="mini-stars">{starIcon}{stars[ex.id] || 0}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="sheet home2">
      <header className="hello-row">
        <Mascot mood={g.mood} text={g.text} speak={g.text} size="md" />
        <div className="hello-side">
          <div className="total-stars" aria-label={`${wallet} étoiles à dépenser`}>{starIcon}<span>{wallet}</span></div>
          {children.length > 1 && (
            <div className="seg kids" role="group" aria-label="Qui joue ?">
              {children.map(c => <button key={c.id} aria-pressed={c.id === child.id} onClick={() => onPickChild(c.id)}>{c.name}</button>)}
            </div>
          )}
        </div>
      </header>

      {dailyReady && (
        <button className={'daily' + (dailyDone ? ' done' : '')} onClick={onDaily}>
          <span className="daily-text">
            <span className="eyebrow-light">{dailyDone ? 'Défi du jour réussi' : 'Défi du jour'}</span>
            <b>{dailyDone ? 'Bravo ! Tu peux le rejouer pour t’entraîner.' : '6 questions surprises'}</b>
            <span className="daily-reward">{dailyDone ? 'Nouveau défi demain' : <>+2 {starIcon} bonus</>}</span>
          </span>
          <span className="daily-go" aria-hidden="true">{dailyDone ? '✓' : '▶'}</span>
        </button>
      )}

      <div className="htiles">
        {SUBJECTS.map(s => {
          const list = bySubject(s.id)
          const empty = list.length === 0
          return (
            <button key={s.id} className={'htile ' + s.id} disabled={empty} onClick={() => onSubject(s.id)}>
              <SubjectArt id={s.id} />
              <span className="htile-name">{s.label}</span>
              <span className="htile-meta">{empty ? 'Bientôt' : <>{list.length} jeu{list.length > 1 ? 'x' : ''} · <span className="mini-stars">{starIcon}{starsFor(list)}</span></>}</span>
            </button>
          )
        })}
        <button className="htile album" onClick={onAlbum}>
          <span className="album-art" aria-hidden="true">
            <span className="mini-sticker a">🦁</span><span className="mini-sticker b">🦖</span><span className="mini-sticker c">⚽</span>
          </span>
          <span className="htile-name">Mon album</span>
          <span className="htile-meta">{albumOwned === null ? 'Vignettes à collectionner' : `${albumOwned} / ${albumTotal} vignettes`}</span>
        </button>
        {team && (
          <button className="htile team" onClick={onTeam}>
            <span className="team-art" aria-hidden="true"><span>{team.avatar}</span><span>🤝</span></span>
            <span className="htile-name">Mon équipe</span>
            <span className="htile-meta">{team.name}</span>
          </button>
        )}
      </div>

      <section className="progress-strip">
        <div className="week">
          <span className="ps-label">Ma semaine</span>
          <span className="days">
            {DAYS.map((d, i) => <i key={i} className={((weekDays >> i) & 1 ? 'on' : '') + (i === todayIdx ? ' today' : '')}>{d}</i>)}
          </span>
        </div>
        <button className="next-pack" onClick={onAlbum}>
          <span className="ps-label">Prochaine pochette</span>
          <span className="pack-gauge" role="meter" aria-valuenow={Math.min(wallet, packPrice)} aria-valuemin={0} aria-valuemax={packPrice}>
            <span style={{ width: `${packPct}%` }} />
          </span>
          <span className="pack-count">{Math.min(wallet, packPrice)} / {packPrice} {starIcon}</span>
        </button>
      </section>

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
