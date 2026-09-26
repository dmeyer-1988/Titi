import { useState } from 'react'
import { Runner } from '../engine/Runner'
import { defaultConfig, TYPE_HELP, TYPE_LABEL, type CollectionConfig, type Exercise, type ExerciseType, type SuiteConfig } from '../engine/types'
import { saveExercise } from '../lib/store'
import { Thumb } from './Home'

function Stepper({ id, label, value, min, max, step = 1, onChange, hint }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; hint?: string; onChange: (n: number) => void
}) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)))
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" onClick={() => set(value - step)} disabled={value <= min} aria-label={`${label} : moins`}>−</button>
        <input id={id} inputMode="numeric" value={value} onChange={e => { const n = Number(e.target.value.replace(/\D/g, '')); if (!Number.isNaN(n)) onChange(n) }} onBlur={() => set(value)} />
        <button type="button" onClick={() => set(value + step)} disabled={value >= max} aria-label={`${label} : plus`}>+</button>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  )
}

function Chips<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="seg">
        {options.map(o => <button type="button" key={String(o.v)} aria-pressed={o.v === value} onClick={() => onChange(o.v)}>{o.l}</button>)}
      </div>
    </div>
  )
}

function autoTitle(type: ExerciseType, c: CollectionConfig | SuiteConfig) {
  if (type === 'suite') {
    const s = c as SuiteConfig
    return `De ${s.step} en ${s.step}` + (s.direction === 'down' ? ' (à rebours)' : '')
  }
  const k = c as CollectionConfig
  const range = `${k.min} à ${k.max}`
  return type === 'entoure' ? `Entoure — ${k.onlyTens ? 'dizaines' : range}` : `Combien ? — ${k.onlyTens ? 'dizaines' : range}`
}

export function Editor({ initial, nextPosition, onClose, onSaved }: {
  initial?: Exercise; nextPosition: number; onClose: () => void; onSaved: () => void
}) {
  const [type, setType] = useState<ExerciseType>(initial?.type ?? 'entoure')
  const [config, setConfig] = useState<CollectionConfig | SuiteConfig>(initial?.config ?? defaultConfig('entoure'))
  const [title, setTitle] = useState(initial?.title ?? '')
  const [titleTouched, setTitleTouched] = useState(Boolean(initial))
  const [testing, setTesting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const shownTitle = titleTouched ? title : autoTitle(type, config)
  const draft: Exercise = { id: initial?.id ?? 'test', type, title: shownTitle || TYPE_LABEL[type], config, active: initial?.active ?? true, position: initial?.position ?? nextPosition }

  const changeType = (t: ExerciseType) => {
    setType(t)
    if ((t === 'suite') !== (type === 'suite')) setConfig(defaultConfig(t))
  }
  const upd = (patch: Partial<CollectionConfig & SuiteConfig>) => setConfig(c => ({ ...c, ...patch }) as CollectionConfig | SuiteConfig)

  const save = async () => {
    setBusy(true); setErr('')
    try { await saveExercise(draft); onSaved() }
    catch { setErr("L'exercice n'a pas pu être enregistré. Vérifiez la connexion puis réessayez.") }
    finally { setBusy(false) }
  }

  if (testing) return <Runner exercise={draft} test onExit={() => setTesting(false)} />

  const c = config as CollectionConfig & SuiteConfig
  const invalid = c.min >= c.max

  return (
    <div className="editor">
      <div className="editor-head">
        <h2>{initial ? "Modifier l'exercice" : 'Nouvel exercice'}</h2>
        <button className="btn ghost small" onClick={onClose}>Annuler</button>
      </div>

      <div className="types">
        {(['entoure', 'combien', 'suite'] as ExerciseType[]).map(t => (
          <button key={t} className={'type-card' + (t === type ? ' on' : '')} onClick={() => changeType(t)} aria-pressed={t === type}>
            <Thumb ex={{ ...draft, type: t, config: t === type ? config : defaultConfig(t) }} />
            <b>{TYPE_LABEL[t]}</b>
          </button>
        ))}
      </div>
      <p className="help">{TYPE_HELP[type]}</p>

      <div className="form-grid">
        {type !== 'suite' ? (
          <>
            <Chips label="Nombres" value={c.onlyTens ? 1 : 0} onChange={v => upd({ onlyTens: v === 1 })}
              options={[{ v: 1, l: 'Dizaines (10, 20…)' }, { v: 0, l: 'Dizaines + unités' }]} />
            <Stepper id="min" label="De" value={c.min} min={1} max={99} step={c.onlyTens ? 10 : 1} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="À" value={c.max} min={2} max={100} step={c.onlyTens ? 10 : 1} onChange={n => upd({ max: n })} />
          </>
        ) : (
          <>
            <Chips label="On avance de" value={c.step} onChange={v => upd({ step: v })}
              options={[1, 2, 5, 10].map(v => ({ v, l: String(v) }))} />
            <Chips label="Sens" value={c.direction} onChange={v => upd({ direction: v })}
              options={[{ v: 'up', l: 'En avant' }, { v: 'down', l: 'À rebours' }, { v: 'both', l: 'Les deux' }]} />
            <Stepper id="min" label="Nombre le plus petit" value={c.min} min={0} max={999} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="Nombre le plus grand" value={c.max} min={1} max={1000} onChange={n => upd({ max: n })} />
            <Stepper id="len" label="Nombres dans la suite" value={c.length} min={4} max={8} onChange={n => upd({ length: n })} />
            <Stepper id="blanks" label="Cases vides" value={c.blanks} min={1} max={Math.max(1, c.length - 2)} onChange={n => upd({ blanks: n })} />
          </>
        )}
        <Stepper id="q" label="Questions par partie" value={c.questions} min={3} max={20} onChange={n => upd({ questions: n })} hint="10 questions ≈ 5 minutes" />
        <div className="field wide">
          <label htmlFor="title">Nom affiché à l'enfant</label>
          <input id="title" maxLength={60} value={shownTitle} onChange={e => { setTitle(e.target.value); setTitleTouched(true) }} />
        </div>
      </div>

      {invalid && <p className="error">Le premier nombre doit être plus petit que le second.</p>}
      {err && <p className="error" role="alert">{err}</p>}
      <div className="row">
        <button className="btn" onClick={save} disabled={busy || invalid || !shownTitle.trim()}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        <button className="btn ghost" onClick={() => setTesting(true)} disabled={invalid}>Tester</button>
      </div>
    </div>
  )
}
