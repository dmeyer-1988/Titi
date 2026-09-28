import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BallDefs } from './engine/Balls'
import { Runner } from './engine/Runner'
import type { Exercise, Subject } from './engine/types'
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

type View = { name: 'home' } | { name: 'play'; ex: Exercise } | { name: 'pin' } | { name: 'parent' } | { name: 'album' }

const CHILD_KEY = 'balles-child'

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
    } catch { /* hors ligne : on garde les étoiles affichées */ }
    try {
      const al = await fetchAlbum(child.id)
      setAlbum({ spent: al.spent, owned: STICKERS.filter(x => al.counts.get(x.id)).length })
    } catch { /* hors ligne */ }
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
  } else if (view.name === 'album') {
    screen = <Album childId={child.id} earned={earned} price={family.packPrice ?? 10} onExit={() => { setView({ name: 'home' }); void loadStars() }} />
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
        onChanged={refresh}
        onExit={() => setView({ name: 'home' })}
      />
    )
  } else {
    screen = (
      <Home
        children={family.children}
        child={child}
        exercises={family.exercises}
        stars={stars}
        wallet={Math.max(0, earned - (album?.spent ?? 0))}
        albumOwned={album?.owned ?? null}
        albumTotal={STICKERS.length}
        onAlbum={() => setView({ name: 'album' })}
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
