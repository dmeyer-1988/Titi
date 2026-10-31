import { useState } from 'react'
import { setupFamily } from '../lib/store'

/** Première connexion : prénom de l'enfant + code de l'espace parent. */
export function Setup({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [level, setLevel] = useState(4)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await setupFamily(uid, name, pin, level); onDone() }
    catch { setErr("L'enregistrement a échoué. Vérifiez la connexion et que le schéma Supabase est bien installé (voir README).") }
    finally { setBusy(false) }
  }

  return (
    <div className="sheet narrow">
      <div className="eyebrow">Première utilisation</div>
      <h1>Bienvenue</h1>
      <p className="lead">Trois exercices de départ seront créés : entourer des dizaines, compter des balles, compléter une suite de 10 en 10.</p>
      <form onSubmit={submit} className="form">
        <label className="field" htmlFor="child">
          <span>Prénom de l'enfant</span>
          <input id="child" required maxLength={40} autoCapitalize="words" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <div className="field">
          <span className="label">Classe</span>
          <div className="seg" role="group" aria-label="Classe">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
              <button type="button" key={n} aria-pressed={level === n} onClick={() => setLevel(n)}>{n}P</button>
            ))}
          </div>
          <small>Les exercices de départ conviennent surtout à la 4e HarmoS ; vous pourrez les ajuster dans l'espace parent.</small>
        </div>
        <label className="field" htmlFor="pin">
          <span>Code parent (4 chiffres)</span>
          <input id="pin" className="code-input" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} />
          <small>Il protège l'espace parent sur l'iPad. Choisissez un code que votre enfant ne connaît pas.</small>
        </label>
        <button className="btn" disabled={busy || !name.trim() || pin.length !== 4}>{busy ? 'Création…' : 'Commencer'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
    </div>
  )
}
