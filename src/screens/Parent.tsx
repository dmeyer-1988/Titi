import { useState } from 'react'
import type { Child, Exercise } from '../engine/types'
import { TYPE_LABEL } from '../engine/types'
import { addChild, deleteExercise, moveExercise, pendingCount, renameChild, setExerciseActive, setPin } from '../lib/store'
import { supabase } from '../lib/supabase'
import { setPackPrice } from '../lib/albumStore'
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
  packPrice: number
  onPickChild: (id: string) => void
  onChanged: () => Promise<void>
  onExit: () => void
}

type Tab = 'exercices' | 'suivi' | 'profil'

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
          {([['exercices', 'Exercices'], ['suivi', 'Suivi'], ['profil', 'Profil']] as [Tab, string][]).map(([t, l]) => (
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
        <Profile key={p.children.map(c => c.id + c.name).join()} {...p} />
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
  if (ex.type === 'calcul') {
    const k = ex.config as unknown as { op: string; steps: number[]; digits: number; find: string }
    const ops = k.op === '+' ? 'additions' : k.op === '-' ? 'soustractions' : 'additions et soustractions'
    const f = k.find === 'resultat' ? 'trouver le résultat' : k.find === 'manquant' ? 'trouver le nombre manquant' : 'résultat ou nombre manquant'
    return `${ops}, ${[...k.steps].sort((a, b) => a - b).join(' ')}, ${k.digits} chiffre${k.digits > 1 ? 's' : ''}, ${f}`
  }
  if (ex.type === 'son') {
    const a = ex.config as unknown as { focus: string[]; extra: boolean }
    return `${a.focus.length} mot${a.focus.length > 1 ? 's' : ''} à travailler${a.extra ? ' + mots au hasard' : ''} : ${a.focus.slice(0, 5).join(', ')}${a.focus.length > 5 ? '…' : ''}`
  }
  if (ex.type === 'alphabet') {
    const a = ex.config as unknown as { skills: string[]; capitals: boolean }
    const L: Record<string, string> = { suite: 'lettre qui manque', position: 'avant/après/entre', voyelles: 'voyelles', ranger: 'ranger des mots' }
    return a.skills.map(k => L[k]).join(', ') + (a.capitals ? ', majuscules' : '')
  }
  if (ex.type === 'table') return `${c.size} × ${c.size}, nombres ${c.min}–${c.max}, ${c.mode === 'mixte' ? 'avec en-têtes à trouver' : 'sommes à trouver'}`
  if (ex.type === 'suite') return `de ${c.step} en ${c.step}, ${c.min}–${c.max}, ${c.blanks} case${Number(c.blanks) > 1 ? 's' : ''} vide${Number(c.blanks) > 1 ? 's' : ''}`
  return `${c.onlyTens ? 'dizaines' : 'dizaines + unités'}, ${c.min}–${c.max}`
}

function Profile({ uid, email, children, pin, packPrice, onChanged }: Props) {
  const [price, setPrice] = useState(packPrice)
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(children.map(c => [c.id, c.name])))
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [note, setNote] = useState<{ where: string; ok: boolean; text: string } | null>(null)
  const pending = pendingCount()

  const run = async (where: string, f: () => Promise<unknown>, ok: string) => {
    setNote(null)
    try { await f(); await onChanged(); setNote({ where, ok: true, text: ok }) }
    catch (e) {
      const msg = (e as { code?: string })?.code === 'weak_password' || (e as { code?: string })?.code === 'same_password'
        ? 'Choisissez un autre mot de passe (au moins 8 caractères, différent de l\'actuel).'
        : "L'enregistrement a échoué. Vérifiez la connexion puis réessayez."
      setNote({ where, ok: false, text: msg })
    }
  }
  const Note = ({ where }: { where: string }) =>
    note?.where === where ? <p className={note.ok ? 'ok-note' : 'error'} role={note.ok ? 'status' : 'alert'}>{note.text}</p> : null

  const pwOk = pw1.length >= 8 && pw1 === pw2

  return (
    <div className="settings">
      <section>
        <h3>Mon compte</h3>
        <p className="muted">Connecté avec <b>{email}</b></p>
      </section>

      <section>
        <h3>Mot de passe</h3>
        <p className="muted">Pour vous connecter sans attendre un code par e-mail.</p>
        <div className="form-grid">
          <label className="field" htmlFor="pw1"><span>Nouveau mot de passe</span>
            <input id="pw1" type="password" autoComplete="new-password" value={pw1} onChange={e => setPw1(e.target.value)} />
            <small>Au moins 8 caractères.</small>
          </label>
          <label className="field" htmlFor="pw2"><span>Confirmer</span>
            <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
            {pw2 && pw1 !== pw2 && <small className="error">Les deux mots de passe sont différents.</small>}
          </label>
        </div>
        <button className="btn ghost small" disabled={!pwOk} onClick={() => run('pw', async () => {
          const { error } = await supabase.auth.updateUser({ password: pw1 })
          if (error) throw error
          setPw1(''); setPw2('')
        }, 'Mot de passe modifié.')}>Changer le mot de passe</button>
        <Note where="pw" />
      </section>

      <section>
        <h3>Code parent</h3>
        <p className="muted">Les 4 chiffres qui protègent cet espace sur l'iPad. Code actuel : {pin.replace(/./g, '•')}</p>
        <div className="row">
          <input id="new-pin" className="code-input short" inputMode="numeric" maxLength={4} placeholder="Nouveau code" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
          <button className="btn ghost small" disabled={newPin.length !== 4} onClick={() => run('pin', async () => { await setPin(uid, newPin); setNewPin('') }, 'Code parent modifié.')}>Changer le code</button>
        </div>
        <Note where="pin" />
      </section>

      <section>
        <h3>Album de vignettes</h3>
        <p className="muted">Prix d'une pochette de 5 vignettes. Une question réussie du premier coup rapporte 1 étoile (environ 5 à 10 par partie). L'album compte 52 vignettes.</p>
        <div className="row">
          <div className="stepper">
            <button type="button" onClick={() => setPrice(p => Math.max(1, p - 1))} aria-label="Moins cher">−</button>
            <input id="pack-price" inputMode="numeric" value={price} onChange={e => { const n = Number(e.target.value.replace(/\D/g, '')); if (!Number.isNaN(n)) setPrice(Math.min(100, n)) }} />
            <button type="button" onClick={() => setPrice(p => Math.min(100, p + 1))} aria-label="Plus cher">+</button>
          </div>
          <span className="muted">étoiles</span>
          <button className="btn ghost small" disabled={price === packPrice || price < 1} onClick={() => run('price', () => setPackPrice(uid, price), 'Prix enregistré.')}>Enregistrer</button>
        </div>
        <Note where="price" />
      </section>

      <section>
        <h3>Enfants</h3>
        {children.map(c => (
          <div className="row" key={c.id}>
            <input id={`name-${c.id}`} aria-label="Prénom" value={names[c.id] ?? ''} maxLength={40} onChange={e => setNames(n => ({ ...n, [c.id]: e.target.value }))} />
            <button className="btn ghost small" disabled={!names[c.id]?.trim() || names[c.id] === c.name} onClick={() => run('kids', () => renameChild(c.id, names[c.id]), 'Prénom enregistré.')}>Renommer</button>
          </div>
        ))}
        <div className="row">
          <input id="new-child" placeholder="Prénom d'un autre enfant" value={newName} maxLength={40} onChange={e => setNewName(e.target.value)} />
          <button className="btn ghost small" disabled={!newName.trim()} onClick={() => run('kids', async () => { await addChild(newName); setNewName('') }, 'Enfant ajouté.')}>Ajouter</button>
        </div>
        <Note where="kids" />
      </section>

      <section>
        <h3>Synchronisation</h3>
        <p className="muted">Les exercices créés depuis votre téléphone apparaissent sur l'iPad à la prochaine ouverture du jeu.</p>
        <p className="muted">{pending ? `${pending} réponse${pending > 1 ? 's' : ''} en attente d'envoi (hors ligne).` : 'Toutes les réponses sont synchronisées.'}</p>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Se déconnecter de cet appareil</button>
      </section>
    </div>
  )
}
