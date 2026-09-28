import { useEffect, useState } from 'react'
import type { Child } from '../engine/types'
import { AVATARS, createTeam, getMembership, joinTeam, leaveTeam, setGoal, updateMember, type Membership } from '../lib/teamStore'

/** Espace parent : créer, rejoindre ou quitter une équipe de copains. */
export function TeamSettings({ uid, child, onChanged }: { uid: string; child: Child; onChanged: () => void }) {
  const [m, setM] = useState<Membership | null | undefined>(undefined)
  const [mode, setMode] = useState<'create' | 'join'>('join')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [goal, setGoalV] = useState(200)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const r = await getMembership(child.id)
      setM(r)
      if (r) { setPseudo(r.pseudo); setAvatar(r.avatar); setGoalV(r.team.goal) }
    } catch { setM(null) }
  }
  useEffect(() => { void load() }, [child.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (f: () => Promise<unknown>, ok: string) => {
    setBusy(true); setNote(null)
    try { await f(); await load(); onChanged(); setNote({ ok: true, text: ok }) }
    catch (e) { setNote({ ok: false, text: (e as Error).message || "Ça n'a pas marché. Vérifiez la connexion." }) }
    finally { setBusy(false) }
  }

  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setNote({ ok: true, text: 'Code copié.' }) }
    catch { setNote({ ok: true, text: `Code : ${t}` }) }
  }

  const avatarPicker = (
    <div className="field wide">
      <span className="label">Avatar</span>
      <div className="avatars">
        {AVATARS.map(a => <button type="button" key={a} className={'avatar' + (a === avatar ? ' on' : '')} onClick={() => setAvatar(a)} aria-pressed={a === avatar}>{a}</button>)}
      </div>
    </div>
  )
  const pseudoField = (
    <label className="field" htmlFor="pseudo">
      <span>Pseudo visible par l'équipe</span>
      <input id="pseudo" maxLength={20} value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="ex. Tigre rapide" />
      <small>Évitez le prénom complet : les autres familles le verront.</small>
    </label>
  )

  if (m === undefined) return <p className="muted">Chargement…</p>

  if (m) {
    const creator = m.team.created_by === uid
    return (
      <div className="team-settings">
        <p><b>{child.name}</b> fait partie de l'équipe <b>{m.team.name}</b>.</p>
        <div className="code-box">
          <span>Code à donner aux autres parents</span>
          <b className="team-code">{m.team.code}</b>
          <button className="btn ghost small" onClick={() => copy(m.team.code)}>Copier</button>
        </div>
        <p className="muted">Les autres familles voient seulement le pseudo, l'avatar, les jours joués et les étoiles de la semaine. Jamais les réponses ni les exercices.</p>
        <div className="form-grid">
          {pseudoField}
          {creator && (
            <label className="field" htmlFor="goal">
              <span>Objectif d'étoiles de l'équipe, par semaine</span>
              <input id="goal" inputMode="numeric" value={goal} onChange={e => setGoalV(Number(e.target.value.replace(/\D/g, '')) || 0)} />
              <small>Environ 30 à 50 étoiles par enfant et par semaine.</small>
            </label>
          )}
          {avatarPicker}
        </div>
        <div className="row">
          <button className="btn ghost small" disabled={busy || !pseudo.trim()} onClick={() => run(async () => {
            await updateMember(m.team_id, child.id, pseudo.trim(), avatar)
            if (creator && goal !== m.team.goal) await setGoal(m.team_id, Math.max(10, Math.min(10000, goal)))
          }, 'Enregistré.')}>Enregistrer</button>
          {confirmLeave ? (
            <span className="confirm">
              <button className="btn danger small" disabled={busy} onClick={() => run(() => leaveTeam(m.team_id, child.id), "Vous avez quitté l'équipe.")}>Quitter l'équipe</button>
              <button className="btn ghost small" onClick={() => setConfirmLeave(false)}>Rester</button>
            </span>
          ) : <button className="btn ghost small" onClick={() => setConfirmLeave(true)}>Quitter l'équipe…</button>}
        </div>
        {note && <p className={note.ok ? 'ok-note' : 'error'} role="status">{note.text}</p>}
      </div>
    )
  }

  return (
    <div className="team-settings">
      <p className="muted">Une équipe réunit quelques copains qui utilisent aussi l'app : objectif commun de la semaine, jours joués, et échanges de doubles. Chaque famille garde son propre compte.</p>
      <div className="seg">
        <button aria-pressed={mode === 'join'} onClick={() => setMode('join')}>Rejoindre avec un code</button>
        <button aria-pressed={mode === 'create'} onClick={() => setMode('create')}>Créer une équipe</button>
      </div>
      <div className="form-grid">
        {mode === 'join' ? (
          <label className="field" htmlFor="team-code">
            <span>Code reçu d'un autre parent</span>
            <input id="team-code" className="code-input short" maxLength={6} autoCapitalize="characters" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
          </label>
        ) : (
          <label className="field" htmlFor="team-name">
            <span>Nom de l'équipe</span>
            <input id="team-name" maxLength={40} value={name} onChange={e => setName(e.target.value)} placeholder="ex. Les copains de Saint-Prex" />
          </label>
        )}
        {pseudoField}
        {avatarPicker}
      </div>
      <button className="btn" disabled={busy || !pseudo.trim() || (mode === 'join' ? code.length !== 6 : !name.trim())}
        onClick={() => run(
          () => mode === 'join' ? joinTeam(code, child.id, pseudo.trim(), avatar) : createTeam(name.trim(), child.id, pseudo.trim(), avatar),
          mode === 'join' ? 'Bienvenue dans l’équipe !' : 'Équipe créée. Donnez le code aux autres parents.',
        )}>
        {mode === 'join' ? "Rejoindre l'équipe" : "Créer l'équipe"}
      </button>
      {note && <p className={note.ok ? 'ok-note' : 'error'} role="status">{note.text}</p>}
    </div>
  )
}
