import { useState } from 'react'
import { Runner } from '../engine/Runner'
import { type AlphabetConfig, type AlphaSkill, type SonConfig, type CalculConfig, type PaquetsConfig, type NoeudsConfig, type NoeudSkill, type ChateauxConfig, type MystereConfig, type CapaciteConfig, type DicteeConfig, type DicteeMode, type DrapeauxConfig, type ContinentsConfig, type CantonsConfig, type CollectionConfig, type Exercise, type ExerciseType, type SuiteConfig, type TableConfig, SKILL_LABEL } from '../engine/types'
import { SUBJECTS, TYPES } from '../engine/registry'
import { saveExercise } from '../lib/store'
import { hasSon, isTrap } from '../engine/sons'
import { calcTitle } from '../engine/calcul'
import { MODE_LABEL, canMode, parseList } from '../engine/dictee'
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

type AnyConfig = DrapeauxConfig | ContinentsConfig | CantonsConfig | DicteeConfig | MystereConfig | NoeudsConfig | ChateauxConfig | CapaciteConfig | PaquetsConfig | CollectionConfig | SuiteConfig | TableConfig | AlphabetConfig | SonConfig | CalculConfig
const family = (t: ExerciseType) => (t === 'entoure' || t === 'combien' ? 'collection' : t)

function autoTitle(type: ExerciseType, c: AnyConfig) {
  if (type === 'calcul') return calcTitle(c as CalculConfig)
  if (type === 'noeuds') return 'Les nœuds'
  if (type === 'chateaux') return (c as ChateauxConfig).towers === 3 ? 'Les châteaux à 3 tours' : 'Les châteaux'
  if (type === 'capacite') return 'Qui contient le plus ?'
  if (type === 'mystere') return 'Le château mystère'
  if (type === 'dictee') return 'Mes mots de dictée'
  if (type === 'drapeaux') { const d = c as DrapeauxConfig; return d.niveau === 'europe' ? "Les drapeaux d'Europe" : d.niveau === 'monde' ? 'Les drapeaux du monde' : 'Les drapeaux' }
  if (type === 'continents') return 'Les continents'
  if (type === 'cantons') { const k = c as CantonsConfig; return (k.jeu === 'puzzle' ? 'Puzzle : ' : '') + (k.region === 'romands' ? 'les cantons romands' : 'les cantons suisses') }
  if (type === 'paquets') return (c as PaquetsConfig).extra ? 'Fais des paquets de 10' : 'Compte avec des paquets'
  if (type === 'son') return (c as SonConfig).extra ? 'Le son on / om' : 'Mes mots on / om'
  if (type === 'alphabet') {
    const k = (c as AlphabetConfig).skills
    return k.length === 1 ? SKILL_LABEL[k[0]] : k.length >= 4 ? 'Entraînement au test' : "L'alphabet"
  }
  if (type === 'table') {
    const t = c as TableConfig
    return t.mode === 'mixte' ? 'Les nombres manquants — défi' : 'Les nombres manquants'
  }
  if (type === 'suite') {
    const s = c as SuiteConfig
    if (s.oral) return 'Compter de 1 en 1 (à l’oral)'
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
  const [config, setConfig] = useState<AnyConfig>(initial?.config ?? TYPES.entoure.defaultConfig())
  const [title, setTitle] = useState(initial?.title ?? '')
  const [titleTouched, setTitleTouched] = useState(Boolean(initial))
  const [testing, setTesting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [focusText, setFocusText] = useState<string | null>(null)
  const [wordsText, setWordsText] = useState<string | null>(null)

  const shownTitle = titleTouched ? title : autoTitle(type, config)
  // L'éditeur mélange type et config librement (brouillon) ; la cohérence est
  // garantie à l'enregistrement, quand le type ne change plus.
  const draft = { id: initial?.id ?? 'test', type, title: shownTitle || TYPES[type].label, config, active: initial?.active ?? true, position: initial?.position ?? nextPosition } as Exercise

  const changeType = (t: ExerciseType) => {
    setType(t)
    if (family(t) !== family(type)) setConfig(TYPES[t].defaultConfig())
  }
  const upd = (patch: object) => setConfig(c => ({ ...c, ...patch }) as AnyConfig)

  const save = async () => {
    setBusy(true); setErr('')
    try { await saveExercise(draft); onSaved() }
    catch { setErr("L'exercice n'a pas pu être enregistré. Vérifiez la connexion puis réessayez.") }
    finally { setBusy(false) }
  }

  if (testing) return <Runner exercise={draft} test onExit={() => setTesting(false)} />

  const c = config as DrapeauxConfig & ContinentsConfig & CantonsConfig & DicteeConfig & MystereConfig & NoeudsConfig & ChateauxConfig & CapaciteConfig & PaquetsConfig & CollectionConfig & SuiteConfig & TableConfig & AlphabetConfig & SonConfig & CalculConfig
  const invalid = type === 'drapeaux' || type === 'continents' || type === 'cantons' ? false : type === 'dictee' ? parseList(c.list).length === 0 : type === 'son' ? !c.focus.some(hasSon) && !c.extra : type === 'calcul' ? !c.astuces && c.steps.length === 0 : type === 'noeuds' ? !c.skills?.length : type === 'chateaux' || type === 'capacite' || type === 'mystere' ? false : type !== 'alphabet' && c.min >= c.max

  return (
    <div className="editor">
      <div className="editor-head">
        <h2>{initial ? "Modifier l'exercice" : 'Nouvel exercice'}</h2>
        <button className="btn ghost small" onClick={onClose}>Annuler</button>
      </div>

      {SUBJECTS.map(sub => (
        <div key={sub.id}>
          <div className="types-label">{sub.label}</div>
          <div className="types">
            {(['entoure', 'combien', 'paquets', 'suite', 'table', 'calcul', 'noeuds', 'mystere', 'chateaux', 'capacite', 'alphabet', 'son', 'dictee', 'drapeaux', 'continents', 'cantons'] as ExerciseType[]).filter(t => TYPES[t].subject === sub.id).map(t => (
              <button key={t} className={'type-card' + (t === type ? ' on' : '')} onClick={() => changeType(t)} aria-pressed={t === type}>
                <Thumb ex={{ ...draft, type: t, config: family(t) === family(type) ? config : TYPES[t].defaultConfig() } as Exercise} />
                <b>{TYPES[t].label}</b>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="help">{TYPES[type].help}</p>

      <div className="form-grid">
        {type === 'drapeaux' ? (
          <>
            <Chips label="Pays" value={c.niveau} onChange={v => upd({ niveau: v })}
              options={[{ v: 'facile', l: 'Faciles (42 pays connus)' }, { v: 'europe', l: 'Europe' }, { v: 'monde', l: 'Le monde entier' }]} />
            <Chips label="L'enfant voit" value={c.sens} onChange={v => upd({ sens: v })}
              options={[{ v: 'nom', l: 'Le drapeau → il choisit le pays' }, { v: 'drapeau', l: 'Le pays → il choisit le drapeau' }, { v: 'mix', l: 'Les deux' }]} />
          </>
        ) : type === 'continents' ? (
          <>
            <Chips label="Jeu" value={c.jeu} onChange={v => upd({ jeu: v })}
              options={[{ v: 'trouver', l: 'Toucher le continent' }, { v: 'nommer', l: 'Dire son nom' }, { v: 'mix', l: 'Les deux' }]} />
            <Chips label="Antarctique" value={c.antarctique ? 1 : 0} onChange={v => upd({ antarctique: v === 1 })}
              options={[{ v: 1, l: 'Avec' }, { v: 0, l: 'Sans' }]} />
          </>
        ) : type === 'cantons' ? (
          <>
            <Chips label="Cantons" value={c.region} onChange={v => upd({ region: v, questions: (config as CantonsConfig).jeu === 'puzzle' ? (v === 'romands' ? 6 : 26) : c.questions })}
              options={[{ v: 'romands', l: 'Les 6 cantons romands' }, { v: 'suisse', l: 'Les 26 cantons' }]} />
            <Chips label="Jeu" value={c.jeu} onChange={v => upd({ jeu: v, questions: v === 'puzzle' ? (c.region === 'romands' ? 6 : 26) : 8 })}
              options={[{ v: 'puzzle', l: 'Puzzle (glisser à sa place)' }, { v: 'trouver', l: 'Toucher le canton' }, { v: 'nommer', l: 'Dire son nom' }, { v: 'mix', l: 'Toucher + nommer' }]} />
          </>
        ) : type === 'dictee' ? (
          <>
            <div className="field wide">
              <label htmlFor="dwords">Les mots de la liste (un par ligne)</label>
              <textarea id="dwords" rows={10} value={wordsText ?? c.list.join('\n')}
                onChange={e => { setWordsText(e.target.value); upd({ list: e.target.value.split('\n').map(w => w.trim()).filter(Boolean) }) }} />
              <small>Pour un mot court, ajoutez une petite phrase après une barre, elle sera dite pour aider : <code>fin | un fil très fin</code></small>
              {(() => {
                const l = parseList(c.list)
                const son = l.filter(e => canMode('son', e)).length, fin = l.filter(e => canMode('fin', e)).length
                return <small>{l.length} mot{l.length > 1 ? 's' : ''} · {son} pour « le bon son » · {fin} pour « la lettre de la fin »</small>
              })()}
            </div>
            <Chips label="Pour écrire" value={c.ardoise ? 1 : 0} onChange={v => upd({ ardoise: v === 1 })}
              options={[{ v: 1, l: "L'ardoise (stylet ou doigt)" }, { v: 0, l: 'Le clavier' }]} />
            <div className="field wide">
              <span className="label">Façons de travailler</span>
              <div className="seg">
                {(['memo', 'ecrire', 'son', 'fin'] as DicteeMode[]).map(k => {
                  const md = (config as DicteeConfig).modes
                  const on = md.includes(k)
                  return <button type="button" key={k} aria-pressed={on} disabled={on && md.length === 1}
                    onClick={() => upd({ modes: on ? md.filter(x => x !== k) : [...md, k] })}>{MODE_LABEL[k]}</button>
                })}
              </div>
            </div>
          </>
        ) : type === 'noeuds' ? (
          <>
            <div className="field wide">
              <span className="label">Parties à travailler</span>
              <div className="seg">
                {([['lire', 'Lire le nœud'], ['placer', 'Placer un objet'], ['bouger', 'Déplacer (2 à droite…)']] as [NoeudSkill, string][]).map(([k, l]) => {
                  const sk = (config as NoeudsConfig).skills
                  const on = sk.includes(k)
                  return <button type="button" key={k} aria-pressed={on} disabled={on && sk.length === 1}
                    onClick={() => upd({ skills: on ? sk.filter(x => x !== k) : [...sk, k] })}>{l}</button>
                })}
              </div>
            </div>
            <Chips label="Quadrillage" value={c.size} onChange={v => upd({ size: v })}
              options={[{ v: 4, l: '4 × 4 (A-D)' }, { v: 5, l: '5 × 5 (A-E)' }, { v: 6, l: '6 × 6 (A-F)' }]} />
          </>
        ) : type === 'chateaux' ? (
          <>
            <Chips label="Tours" value={c.towers} onChange={v => upd({ towers: v })}
              options={[{ v: 2, l: '2 tours' }, { v: 3, l: '3 tours (plus dur)' }]} />
            <Stepper id="maxTotal" label="Cubes en tout, au maximum" value={c.maxTotal} min={8} max={40} onChange={n => upd({ maxTotal: n })} />
          </>
        ) : type === 'mystere' ? (
          <>
            <Chips label="Aide de la loutre" value={c.aide ? 1 : 0} onChange={v => upd({ aide: v === 1 })}
              options={[{ v: 1, l: 'Explique le score (monte, baisse, pareil)' }, { v: 0, l: 'Donne seulement le score' }]} />
            <Chips label="Un seul critère à la fois" value={c.strict ? 1 : 0} onChange={v => upd({ strict: v === 1 })}
              options={[{ v: 1, l: 'Obligatoire' }, { v: 0, l: 'Libre' }]} />
          </>
        ) : type === 'capacite' ? (
          <Chips label="Comparaison" value={c.compare} onChange={v => upd({ compare: v })}
            options={[{ v: 'verser', l: "L'enfant verse" }, { v: 'lire', l: 'On montre le résultat' }, { v: 'mix', l: 'Les deux' }]} />
        ) : type === 'paquets' ? (
          <>
            <Chips label="Balles" value={c.extra ? 1 : 0} onChange={v => upd({ extra: v === 1 })}
              options={[{ v: 1, l: 'Plus que nécessaire' }, { v: 0, l: 'Juste le bon nombre' }]} />
            <Stepper id="min" label="Nombre le plus petit" value={c.min} min={1} max={99} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="Nombre le plus grand" value={c.max} min={2} max={100} onChange={n => upd({ max: n })} hint="Au-delà de 60, beaucoup de balles à l'écran" />
          </>
        ) : type === 'calcul' ? (
          <>
            <Chips label="Genre de calculs" value={c.astuces ? 1 : 0} onChange={v => upd({ astuces: v === 1 })}
              options={[{ v: 0, l: 'Je choisis (+n, −n)' }, { v: 1, l: 'Calculer efficacement (astuces)' }]} />
            {!c.astuces && <>
            <Chips label="Opération" value={c.op} onChange={v => upd({ op: v })}
              options={[{ v: '+', l: 'Additions' }, { v: '-', l: 'Soustractions' }, { v: 'mix', l: 'Les deux' }]} />
            <Chips label="L'enfant cherche" value={c.find} onChange={v => upd({ find: v })}
              options={[{ v: 'resultat', l: 'Le résultat (34 + 3 = ?)' }, { v: 'manquant', l: 'Le nombre manquant (34 + ? = 37)' }, { v: 'mix', l: 'Les deux' }]} />
            <div className="field wide">
              <span className="label">Nombres à {c.op === '-' ? 'enlever' : c.op === '+' ? 'ajouter' : 'ajouter ou enlever'}</span>
              <div className="seg steps">
                {Array.from({ length: 11 }, (_, n) => {
                  const on = c.steps.includes(n)
                  return (
                    <button type="button" key={n} aria-pressed={on} disabled={on && c.steps.length === 1}
                      onClick={() => upd({ steps: on ? c.steps.filter(x => x !== n) : [...c.steps, n].sort((a, b) => a - b) })}>
                      {c.op === '-' ? '−' : c.op === '+' ? '+' : '±'}{n}
                    </button>
                  )
                })}
                <button type="button" className="all" onClick={() => upd({ steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] })}>Tout</button>
              </div>
            </div>
            <Chips label="Le grand nombre" value={c.digits} onChange={v => upd({ digits: v })}
              options={[{ v: 1, l: '1 chiffre (0-9)' }, { v: 2, l: '2 chiffres (10-99)' }, { v: 3, l: '3 chiffres (100-999)' }]} />
            </>}
          </>
        ) : type === 'son' ? (
          <>
            <div className="field wide">
              <label htmlFor="focus">Mots à travailler (un par ligne ou séparés par des virgules)</label>
              <textarea id="focus" rows={4} value={focusText ?? c.focus.join(', ')}
                onChange={e => { setFocusText(e.target.value); upd({ focus: e.target.value.split(/[\n,;]+/).map(w => w.trim().toLowerCase()).filter(Boolean) }) }} />
              {(() => {
                const bad = c.focus.filter(w => !hasSon(w))
                const traps = c.focus.filter(w => hasSon(w) && isTrap(w))
                return <>
                  {traps.length > 0 && <small>Mots pièges repérés : {traps.join(', ')}</small>}
                  {bad.length > 0 && <small className="error">Sans son [on] écrit on/om, ignorés : {bad.join(', ')}</small>}
                </>
              })()}
            </div>
            <Chips label="Autres mots" value={c.extra ? 1 : 0} onChange={v => upd({ extra: v === 1 })}
              options={[{ v: 1, l: 'Ajouter des mots au hasard' }, { v: 0, l: 'Seulement mes mots' }]} />
            <Chips label="La règle" value={c.showRule ? 1 : 0} onChange={v => upd({ showRule: v === 1 })}
              options={[{ v: 1, l: 'Montrer au début' }, { v: 0, l: 'Sur demande' }]} />
          </>
        ) : type === 'alphabet' ? (
          <>
            <div className="field wide">
              <span className="label">Parties à travailler</span>
              <div className="seg">
                {(['suite', 'position', 'voyelles', 'ranger'] as AlphaSkill[]).map(k => {
                  const sk = (config as AlphabetConfig).skills
                  const on = sk.includes(k)
                  return (
                    <button type="button" key={k} aria-pressed={on} disabled={on && sk.length === 1}
                      onClick={() => upd({ skills: on ? sk.filter(x => x !== k) : [...sk, k] })}>
                      {SKILL_LABEL[k]}
                    </button>
                  )
                })}
              </div>
            </div>
            <Chips label="Mots à ranger" value={c.words} onChange={v => upd({ words: v })}
              options={[{ v: 3, l: '3 mots' }, { v: 4, l: '4 mots' }, { v: 5, l: '5 mots' }]} />
            <Chips label="Lettres" value={c.capitals ? 1 : 0} onChange={v => upd({ capitals: v === 1 })}
              options={[{ v: 0, l: 'minuscules' }, { v: 1, l: 'MAJUSCULES' }]} />
          </>
        ) : type === 'table' ? (
          <>
            <Chips label="Cases à trouver" value={c.mode} onChange={v => upd({ mode: v })}
              options={[{ v: 'sommes', l: 'Les sommes' }, { v: 'mixte', l: 'Sommes + en-têtes (défi)' }]} />
            <Chips label="Taille" value={c.size} onChange={v => upd({ size: v })}
              options={[{ v: 3, l: '3 × 3' }, { v: 4, l: '4 × 4' }]} />
            <Stepper id="min" label="Plus petit nombre des en-têtes" value={c.min} min={0} max={49} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="Plus grand nombre des en-têtes" value={c.max} min={1} max={50} onChange={n => upd({ max: n })} hint="2 à 9 comme sur la fiche : sommes jusqu'à 18" />
          </>
        ) : type !== 'suite' ? (
          <>
            <Chips label="Nombres" value={c.onlyTens ? 1 : 0} onChange={v => upd({ onlyTens: v === 1 })}
              options={[{ v: 1, l: 'Dizaines (10, 20…)' }, { v: 0, l: 'Dizaines + unités' }]} />
            <Stepper id="min" label="De" value={c.min} min={1} max={99} step={c.onlyTens ? 10 : 1} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="À" value={c.max} min={2} max={100} step={c.onlyTens ? 10 : 1} onChange={n => upd({ max: n })} />
          </>
        ) : (
          <>
            <Chips label="Consigne" value={c.oral ? 1 : 0} onChange={v => upd(v === 1 ? { oral: true, step: 1 } : { oral: false })}
              options={[{ v: 0, l: 'Écrite : compléter la suite' }, { v: 1, l: 'Orale : « compte de 47 à 53 »' }]} />
            {!c.oral && <Chips label="On avance de" value={c.step} onChange={v => upd({ step: v })}
              options={[1, 2, 5, 10].map(v => ({ v, l: String(v) }))} />}
            <Chips label="Sens" value={c.direction} onChange={v => upd({ direction: v })}
              options={[{ v: 'up', l: 'En avant' }, { v: 'down', l: 'À rebours' }, { v: 'both', l: 'Les deux' }]} />
            <Stepper id="min" label="Nombre le plus petit" value={c.min} min={0} max={999} onChange={n => upd({ min: n })} />
            <Stepper id="max" label="Nombre le plus grand" value={c.max} min={1} max={1000} onChange={n => upd({ max: n })} />
            <Stepper id="len" label="Nombres dans la suite" value={c.length} min={4} max={8} onChange={n => upd({ length: n })} />
            {!c.oral && <Stepper id="blanks" label="Cases vides" value={c.blanks} min={1} max={Math.max(1, c.length - 2)} onChange={n => upd({ blanks: n })} />}
          </>
        )}
        {type === 'cantons' && (config as CantonsConfig).jeu === 'puzzle'
          ? <Stepper id="q" label="Cantons à placer" value={c.questions} min={1} max={c.region === 'romands' ? 6 : 26} onChange={n => upd({ questions: n })} hint={c.region === 'romands' ? 'Les 6 = la Suisse romande complète' : '26 = la Suisse complète'} />
          : type === 'dictee'
          ? <Stepper id="q" label="Mots par partie" value={c.questions} min={4} max={30} onChange={n => upd({ questions: n })} hint="12 mots ≈ 10 minutes (les mots ratés reviennent en plus)" />
          : type === 'paquets' || type === 'chateaux' || type === 'capacite' || type === 'mystere'
          ? <Stepper id="q" label={type === 'paquets' ? 'Nombres par partie' : 'Questions par partie'} value={c.questions} min={1} max={10} onChange={n => upd({ questions: n })} hint={type === 'chateaux' || type === 'mystere' ? 'Un château ≈ 2 minutes' : '5 questions ≈ 4 minutes'} />
          : type === 'table'
          ? <Stepper id="q" label="Tableaux par partie" value={c.questions} min={1} max={6} onChange={n => upd({ questions: n })} hint="Un tableau 4 × 4 ≈ 3 minutes" />
          : <Stepper id="q" label="Questions par partie" value={c.questions} min={3} max={20} onChange={n => upd({ questions: n })} hint="10 questions ≈ 5 minutes" />}
        <Chips label="Révision du test" value={(config as { revision?: boolean }).revision ? 1 : 0} onChange={v => upd({ revision: v === 1 })}
          options={[{ v: 1, l: 'Inclure dans la révision' }, { v: 0, l: 'Non' }]} />
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
