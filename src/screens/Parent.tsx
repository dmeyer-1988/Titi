import { useState } from 'react'
import type { Child, Exercise } from '../engine/types'
import { TYPE_LABEL } from '../engine/types'
import { addChild, deleteExercise, moveExercise, pendingCount, renameChild, setExerciseActive, setPin } from '../lib/store'
import { supabase } from '../lib/supabase'
import { Editor } from './Editor'
import { Thumb } from './Home'
import { Stats } from './Stats'

interface Props {
  uid: string
  email?: string
  children: Child[]
  child: Child
  exercises: Exercise[]
  pin: string
  onPickChild: (id: string) => void
  onChanged: () => Promise<void>
  onExit: () => void
}

type Tab = 'exercices' | 'suivi' | 'reglages'

export function Parent(p: Props) {
  const [tab, setTab] = useState<Tab>('exercices')
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  return (
    <div className="sheet">
      <header className="parent-head">
        <div>
          <div className="eyebrow">Espace parent</div>
          <h1>Les balles</h1>
        </div>
        <button className="btn small" onClick={p.onExit}>Retour au jeu</button>
      </header>

      {!editing && (
        <nav className="tabs" role="tablist">
          {([['exercices', 'Exercices'], ['suivi', 'Suivi'], ['reglages', 'Réglages']] as [Tab, string][]).map(([t, l]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}</button>
          ))}
        </nav>
      )}

      {editing ? (
        <Editor
          initial={editing === 'new' ? undefined : editing}
          nextPosition={p.exercises.length}
          onClose={() => setEditing(null)}
          onSaved={async () => { await p.onChanged(); setEditing(null) }}
        />
      ) : tab === 'exercices' ? (
        <ExerciseList {...p} onEdit={setEditing} />
      ) : tab === 'suivi' ? (
        <Stats child={p.child} children={p.children} exercises={p.exercises} onPickChild={p.onPickChild} />
      ) : (
        <Settings key={p.children.map(c => c.id + c.name).join()} {...p} />
      )}
    </div>
  )
}

function ExerciseList({ exercises, onChanged, onEdit }: Props & { onEdit: (e: Exercise | 'new') => void }) {
  const [confirm, setConfirm] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const run = async (f: () => Promise<unknown>) => {
    setErr('')
    try { await f(); await onChanged() } catch { setErr('La modification a échoué. Vérifiez la connexion puis réessayez.') }
  }

  return (
    <div>
      <div className="list-head">
        <p className="muted">{exercises.filter(e => e.active).length} visibles pour l'enfant, dans cet ordre.</p>
        <button className="btn" onClick={() => onEdit('new')}>Nouvel exercice</button>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
      <ul className="ex-list">
        {exercises.map((ex, i) => (
          <li key={ex.id} className={ex.active ? '' : 'off'}>
            <Thumb ex={ex} />
            <div className="ex-info">
              <b>{ex.title}</b>
              <span className="muted">{TYPE_LABEL[ex.type]} · {describe(ex)}</span>
            </div>
            <div className="ex-actions">
              <label className="switch" title={ex.active ? 'Visible' : 'Masqué'}>
                <input type="checkbox" id={`act-${ex.id}`} checked={ex.active} onChange={e => run(() => setExerciseActive(ex.id, e.target.checked))} />
                <span aria-hidden="true" />
                <span className="sr">{ex.active ? 'Visible' : 'Masqué'}</span>
              </label>
              <button className="icon-sm" onClick={() => run(() => moveExercise(exercises, ex.id, -1))} disabled={i === 0} aria-label="Monter">↑</button>
              <button className="icon-sm" onClick={() => run(() => moveExercise(exercises, ex.id, 1))} disabled={i === exercises.length - 1} aria-label="Descendre">↓</button>
              <button className="btn ghost small" onClick={() => onEdit(ex)}>Modifier</button>
              {confirm === ex.id ? (
                <span className="confirm">
                  <button className="btn danger small" onClick={() => run(() => deleteExercise(ex.id)).then(() => setConfirm(null))}>Supprimer</button>
                  <button className="btn ghost small" onClick={() => setConfirm(null)}>Garder</button>
                </span>
              ) : (
                <button className="btn ghost small" onClick={() => setConfirm(ex.id)} aria-label={`Supprimer ${ex.title}`}>Supprimer…</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {exercises.length === 0 && <p className="empty-note">Aucun exercice. Créez-en un avec « Nouvel exercice ».</p>}
    </div>
  )
}

function describe(ex: Exercise) {
  const c = ex.config as unknown as Record<string, number | boolean | string>
  if (ex.type === 'suite') return `de ${c.step} en ${c.step}, ${c.min}–${c.max}, ${c.blanks} case${Number(c.blanks) > 1 ? 's' : ''} vide${Number(c.blanks) > 1 ? 's' : ''}`
  return `${c.onlyTens ? 'dizaines' : 'dizaines + unités'}, ${c.min}–${c.max}`
}

function Settings({ uid, email, children, pin, onChanged }: Props) {
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(children.map(c => [c.id, c.name])))
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const pending = pendingCount()

  const run = async (f: () => Promise<unknown>, ok: string) => {
    setErr(''); setNote('')
    try { await f(); await onChanged(); setNote(ok) } catch { setErr("L'enregistrement a échoué. Vérifiez la connexion puis réessayez.") }
  }

  return (
    <div className="settings">
      <section>
        <h3>Enfants</h3>
        {children.map(c => (
          <div className="row" key={c.id}>
            <input id={`name-${c.id}`} aria-label="Prénom" value={names[c.id] ?? ''} maxLength={40} onChange={e => setNames(n => ({ ...n, [c.id]: e.target.value }))} />
            <button className="btn ghost small" disabled={!names[c.id]?.trim() || names[c.id] === c.name} onClick={() => run(() => renameChild(c.id, names[c.id]), 'Prénom enregistré.')}>Renommer</button>
          </div>
        ))}
        <div className="row">
          <input id="new-child" placeholder="Prénom d'un autre enfant" value={newName} maxLength={40} onChange={e => setNewName(e.target.value)} />
          <button className="btn ghost small" disabled={!newName.trim()} onClick={() => run(async () => { await addChild(newName); setNewName('') }, 'Enfant ajouté.')}>Ajouter</button>
        </div>
      </section>

      <section>
        <h3>Code parent</h3>
        <p className="muted">Code actuel : {pin.replace(/./g, '•')}</p>
        <div className="row">
          <input id="new-pin" className="code-input short" inputMode="numeric" maxLength={4} placeholder="Nouveau code" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn ghost small" disabled={newPin.length !== 4} onClick={() => run(async () => { await setPin(uid, newPin); setNewPin('') }, 'Code modifié.')}>Changer le code</button>
        </div>
      </section>

      <section>
        <h3>Compte</h3>
        <p className="muted">Connecté avec {email}. Les exercices créés depuis votre téléphone apparaissent sur l'iPad à la prochaine ouverture du jeu.</p>
        <p className="muted">{pending ? `${pending} réponse${pending > 1 ? 's' : ''} en attente d'envoi (hors ligne).` : 'Toutes les réponses sont synchronisées.'}</p>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Se déconnecter de cet appareil</button>
      </section>

      {note && <p className="ok-note" role="status">{note}</p>}
      {err && <p className="error" role="alert">{err}</p>}
    </div>
  )
}
