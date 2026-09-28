import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BallDefs } from './engine/Balls'
import { Runner, type RoundItem } from './engine/Runner'
import type { Attempt, Exercise, Subject } from './engine/types'
import { fetchAttempts, fetchFamily, flushQueue, readCache, recordAttempt, type Family } from './lib/store'
import { configured, supabase } from './lib/supabase'
import { Home } from './screens/Home'
import { Login } from './screens/Login'
import { Parent } from './screens/Parent'
import { PinGate } from './screens/PinGate'
import { Setup } from './screens/Setup'
import { Album } from './album/Album'
import { STICKERS } from './album/catalog'
import { fetchAlbum } from './lib/albumStore'
import { getMembership, type Membership } from './lib/teamStore'
import { Team } from './screens/Team'
import { buildDaily, completeDaily, fetchDaily } from './lib/daily'

type View = { name: 'home' } | { name: 'play'; ex: Exercise } | { name: 'pin' } | { name: 'parent' } | { name: 'album' } | { name: 'team' } | { name: 'daily'; items: RoundItem[] }

const CHILD_KEY = 'balles-child'

/** Jours joués cette semaine (lundi = bit 0), heure locale. */
function weekMask(attempts: Attempt[]) {
  const now = new Date(), monday = new Date(now)
  monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7))
  let m = 0
  for (const a of attempts) {
    const d = new Date(a.created_at)
    if (d >= monday) m |= 1 << ((d.getDay() + 6) % 7)
  }
  return m
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [family, setFamily] = useState<Family | null>(null)
  const [loadErr, setLoadErr] = useState(false)
  const [view, setView] = useState<View>({ name: 'home' })
  const [childId, setChildId] = useState<string | null>(() => { try { return localStorage.getItem(CHILD_KEY) } catch { return null } })
  const [stars, setStars] = useState<Record<string, number>>({})
  // Porte-monnaie : étoiles gagnées (toutes) − étoiles dépensées en pochettes.
  const [earned, setEarned] = useState(0)
  const [album, setAlbum] = useState<{ spent: number; owned: number } | null>(null)
  const [team, setTeam] = useState<Membership | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [daily, setDaily] = useState<{ doneToday: boolean; bonus: number }>({ doneToday: false, bonus: 0 })
  const [offline, setOffline] = useState(!navigator.onLine)
  const [subject, setSubject] = useState<Subject | null>(null)

  const uid = session?.user.id

  useEffect(() => {
    if (!configured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    if (!uid) return
    try { setFamily(await fetchFamily(uid)); setLoadErr(false) }
    catch { setLoadErr(true) }
  }, [uid])

  // Au démarrage : le cache d'abord (instantané, marche hors ligne), puis le serveur.
  useEffect(() => {
    if (!uid) { setFamily(null); return }
    const cached = readCache(uid)
    if (cached) setFamily(cached)
    void refresh()
    void flushQueue()
  }, [uid, refresh])

  // Quand l'app revient au premier plan : nouveaux exercices du parent + envoi des réponses.
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') { void refresh(); void flushQueue() } }
    const on = () => { setOffline(false); void flushQueue(); void refresh() }
    const off = () => setOffline(true)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [refresh])

  const child = family?.children.find(c => c.id === childId) ?? family?.children[0] ?? null

  const loadStars = useCallback(async () => {
    if (!child) return
    try {
      const all = await fetchAttempts({ childId: child.id })
      const s: Record<string, number> = {}
      let e = 0
      for (const a of all) if (a.first_try && a.correct) { e++; if (a.exercise_id) s[a.exercise_id] = (s[a.exercise_id] || 0) + 1 }
      setStars(s)
      setEarned(e)
      setAttempts(all)
    } catch { /* hors ligne : on garde les étoiles affichées */ }
    try { setDaily(await fetchDaily(child.id)) } catch { /* hors ligne */ }
    try {
      const al = await fetchAlbum(child.id)
      setAlbum({ spent: al.spent, owned: STICKERS.filter(x => al.counts.get(x.id)).length })
    } catch { /* hors ligne */ }
    try { setTeam(await getMembership(child.id)) } catch { /* hors ligne */ }
  }, [child?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadStars() }, [loadStars])

  const pickChild = (id: string) => {
    setChildId(id)
    try { localStorage.setItem(CHILD_KEY, id) } catch { /* ignore */ }
  }

  let screen: React.ReactNode
  if (!configured) {
    screen = (
      <div className="sheet narrow">
        <h1>Les balles</h1>
        <p className="lead">Supabase n'est pas encore configuré.</p>
        <p>Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> (fichier <code>.env</code> en local, variables du dépôt GitHub pour la mise en ligne). Les étapes sont dans le README.</p>
      </div>
    )
  } else if (session === undefined) {
    screen = <div className="splash"><svg className="ball big-ball" aria-hidden="true"><use href="#ball" /></svg></div>
  } else if (!session) {
    screen = <Login />
  } else if (!family) {
    screen = loadErr
      ? <div className="sheet narrow"><h2>Pas de connexion</h2><p>Connectez l'iPad à Internet pour la première ouverture. Ensuite le jeu marche aussi hors ligne.</p><button className="btn" onClick={refresh}>Réessayer</button></div>
      : <div className="splash"><svg className="ball big-ball" aria-hidden="true"><use href="#ball" /></svg></div>
  } else if (!child) {
    screen = <Setup uid={session.user.id} onDone={refresh} />
  } else if (view.name === 'play') {
    screen = (
      <div className="sheet">
        <Runner
          exercise={view.ex}
          childName={child.name}
          onRecord={a => {
            recordAttempt(child.id, a)
            if (a.first_try && a.correct) {
              setEarned(e => e + 1)
              if (a.exercise_id) setStars(s => ({ ...s, [a.exercise_id!]: (s[a.exercise_id!] || 0) + 1 }))
            }
          }}
          onExit={() => { setView({ name: 'home' }); void loadStars() }}
        />
      </div>
    )
  } else if (view.name === 'daily') {
    const dailyEx: Exercise = { id: 'daily', type: 'calcul', title: 'Défi du jour', config: family.exercises[0]?.config, active: true, position: 0 } as Exercise
    screen = (
      <div className="sheet">
        <Runner
          exercise={dailyEx}
          items={view.items}
          childName={child.name}
          onRecord={a => {
            recordAttempt(child.id, a)
            if (a.first_try && a.correct) setEarned(e => e + 1)
          }}
          onFinished={() => {
            if (daily.doneToday) return
            setDaily(d => ({ doneToday: true, bonus: d.bonus + 2 }))
            completeDaily(child.id).catch(() => { /* hors ligne : réessayé à la prochaine partie */ })
          }}
          onExit={() => { setView({ name: 'home' }); void loadStars() }}
        />
      </div>
    )
  } else if (view.name === 'album') {
    screen = <Album childId={child.id} earned={earned + daily.bonus} price={family.packPrice ?? 10} onExit={() => { setView({ name: 'home' }); void loadStars() }} />
  } else if (view.name === 'team' && team) {
    screen = <Team childId={child.id} membership={team} onExit={() => { setView({ name: 'home' }); void loadStars() }} />
  } else if (view.name === 'pin') {
    screen = (
      <PinGate
        pin={family.pin}
        onOk={() => setView({ name: 'parent' })}
        onCancel={() => setView({ name: 'home' })}
        onForgot={() => supabase.auth.signOut()}
      />
    )
  } else if (view.name === 'parent') {
    screen = (
      <Parent
        uid={session.user.id}
        email={session.user.email}
        children={family.children}
        child={child}
        exercises={family.exercises}
        pin={family.pin}
        packPrice={family.packPrice ?? 10}
        onPickChild={pickChild}
        onChanged={async () => { await refresh(); void loadStars() }}
        onExit={() => { setView({ name: 'home' }); void loadStars() }}
      />
    )
  } else {
    screen = (
      <Home
        children={family.children}
        child={child}
        exercises={family.exercises}
        stars={stars}
        wallet={Math.max(0, earned + daily.bonus - (album?.spent ?? 0))}
        packPrice={family.packPrice ?? 10}
        mascotName={child.mascot_name || 'Loulou'}
        weekDays={weekMask(attempts)}
        dailyDone={daily.doneToday}
        dailyReady={family.exercises.some(e => e.active && e.type !== 'table')}
        onDaily={() => setView({ name: 'daily', items: buildDaily(family.exercises, attempts) })}
        albumOwned={album?.owned ?? null}
        albumTotal={STICKERS.length}
        onAlbum={() => setView({ name: 'album' })}
        team={team ? { name: team.team.name, avatar: team.avatar } : null}
        onTeam={() => setView({ name: 'team' })}
        offline={offline}
        subject={subject}
        onSubject={setSubject}
        onPickChild={pickChild}
        onPlay={ex => setView({ name: 'play', ex })}
        onParent={() => setView({ name: 'pin' })}
      />
    )
  }

  return (
    <>
      <BallDefs />
      <main className="court">{screen}</main>
    </>
  )
}
