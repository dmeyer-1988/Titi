import { useEffect, useMemo, useState } from 'react'
import type { Attempt, Child, Exercise } from '../engine/types'
import { TYPE_LABEL } from '../engine/types'
import { fetchAttempts } from '../lib/store'

const fmtDay = new Intl.DateTimeFormat('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' })
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fr-CH')

function trap(a: Attempt): string | null {
  const e = Number(a.expected), g = Number(a.given)
  if (Number.isNaN(e) || Number.isNaN(g)) return null
  if (e >= 10 && e < 100 && g >= 10 && g < 100 && e !== g && String(e) === String(g).split('').reverse().join('')) return 'inversion'
  const d = Math.abs(e - g)
  if (d === 10) return 'dizaine'
  if (d > 0 && d <= 2) return 'unite'
  return null
}

export function Stats({ child, children, exercises, onPickChild }: {
  child: Child; children: Child[]; exercises: Exercise[]; onPickChild: (id: string) => void
}) {
  const [data, setData] = useState<Attempt[] | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    setData(null); setErr('')
    fetchAttempts({ childId: child.id, sinceDays: 30 })
      .then(setData)
      .catch(() => setErr('Le suivi ne peut pas être chargé hors ligne. Réessayez une fois connecté.'))
  }, [child.id])

  const s = useMemo(() => {
    if (!data) return null
    const firsts = data.filter(a => a.first_try)
    const good = firsts.filter(a => a.correct).length
    const week = new Set(data.filter(a => Date.now() - +new Date(a.created_at) < 7 * 864e5).map(a => dayKey(a.created_at)))
    const byEx = new Map<string, { n: number; ok: number; last: string }>()
    for (const a of firsts) {
      const k = a.exercise_id || 'deleted'
      const r = byEx.get(k) || { n: 0, ok: 0, last: a.created_at }
      r.n++; if (a.correct) r.ok++
      if (a.created_at > r.last) r.last = a.created_at
      byEx.set(k, r)
    }
    const wrong = data.filter(a => !a.correct)
    const traps = { inversion: 0, dizaine: 0, unite: 0 }
    for (const a of wrong) { const t = trap(a); if (t) traps[t as keyof typeof traps]++ }
    return { questions: firsts.length, rate: firsts.length ? Math.round((good / firsts.length) * 100) : 0, days: week.size, byEx, wrong: wrong.slice(0, 12), traps }
  }, [data])

  const title = (id: string | null) => exercises.find(e => e.id === id)?.title ?? 'Exercice supprimé'

  return (
    <div className="stats">
      {children.length > 1 && (
        <div className="seg kids" role="group" aria-label="Enfant">
          {children.map(c => <button key={c.id} aria-pressed={c.id === child.id} onClick={() => onPickChild(c.id)}>{c.name}</button>)}
        </div>
      )}
      <p className="period">{child.name} · 30 derniers jours</p>
      {err && <p className="error">{err}</p>}
      {!s && !err && <p className="muted">Chargement…</p>}
      {s && (
        <>
          <div className="tiles">
            <div className="tile"><span className="v">{s.questions}</span><span className="l">questions</span></div>
            <div className="tile"><span className="v">{s.rate}%</span><span className="l">justes du premier coup</span></div>
            <div className="tile"><span className="v">{s.days}<small>/7</small></span><span className="l">jours joués cette semaine</span></div>
          </div>

          {s.questions === 0 ? (
            <p className="empty-note">Aucune partie jouée sur cette période.</p>
          ) : (
            <>
              <h3>Par exercice</h3>
              <ul className="ex-stats">
                {[...s.byEx.entries()].sort((a, b) => b[1].last.localeCompare(a[1].last)).map(([id, r]) => {
                  const pct = Math.round((r.ok / r.n) * 100)
                  const ex = exercises.find(e => e.id === id)
                  return (
                    <li key={id}>
                      <div className="ex-line">
                        <span className="name">{title(id === 'deleted' ? null : id)}{ex && <span className="type"> · {TYPE_LABEL[ex.type]}</span>}</span>
                        <span className="num">{pct}% · {r.n} q.</span>
                      </div>
                      <div className="meter" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% justes du premier coup`}>
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <span className="when">Dernière partie : {fmtDay.format(new Date(r.last))}</span>
                    </li>
                  )
                })}
              </ul>

              <h3>Pièges fréquents</h3>
              <div className="traps">
                <div><b>{s.traps.inversion}</b><span>Dizaines et unités inversées<em>ex. 43 au lieu de 34</em></span></div>
                <div><b>{s.traps.dizaine}</b><span>Une dizaine de trop ou de moins<em>ex. 44 au lieu de 34</em></span></div>
                <div><b>{s.traps.unite}</b><span>Erreur de comptage des unités<em>ex. 35 au lieu de 34</em></span></div>
              </div>

              <h3>Dernières erreurs</h3>
              {s.wrong.length === 0 ? <p className="muted">Aucune erreur sur la période.</p> : (
                <ul className="errors">
                  {s.wrong.map(a => (
                    <li key={a.id}>
                      <span className="date">{fmtDay.format(new Date(a.created_at))}</span>
                      <span className="what">{title(a.exercise_id)}</span>
                      <span className="nums">attendu <b>{a.expected}</b> · répondu <b className="bad">{a.given}</b></span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
