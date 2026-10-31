// Registre des types d'exercices : métadonnées + générateur en un seul endroit.
// Ajouter un type = ajouter une entrée ici + son composant dans Runner.tsx +
// ses réglages dans Editor.tsx + une migration pour la contrainte SQL.

import type { Question, SuiteQuestion, TableQuestion } from './generate'
import { hasSon, SON_BANK, SON_FOCUS_DEFAULT } from './sons'
import { calcQuestion } from './calcul'
import { paquetsQuestion } from './paquets'
import { nodeName, noeudsQuestion, noeudsSkills } from './noeuds'
import { chateauxQuestion } from './chateaux'
import { castleKey, mystereQuestion } from './mystere'
import { capaciteQuestion } from './capacite'
import { alphaKey, alphaQuestion, alphaSkills } from './alphabet'
import type { CollectionConfig, ConfigFor, ExerciseOf, ExerciseType, SonConfig, Subject, SuiteConfig, TableConfig } from './types'

export const SUBJECTS: { id: Subject; label: string; tagline: string }[] = [
  { id: 'maths', label: 'Maths', tagline: 'Nombres et opérations' },
  { id: 'francais', label: 'Français', tagline: 'Lire et écrire' },
]

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export const cellKey = (r: number, c: number) => `${r},${c}`
export function cellValue(q: TableQuestion, r: number, c: number): number {
  if (r === -1) return q.cols[c]
  if (c === -1) return q.rows[r]
  return q.rows[r] + q.cols[c]
}

function key(q: Question) {
  if (q.kind === 'collection') return 'c' + q.target
  if (q.kind === 'alpha') return alphaKey(q)
  if (q.kind === 'son') return 'o' + q.word
  if (q.kind === 'calc') return 'k' + q.a + q.op + q.b + q.blank
  if (q.kind === 'paquets') return 'p' + q.target
  if (q.kind === 'noeuds') return 'n' + q.skill + nodeName(q.at) + nodeName(q.answer)
  if (q.kind === 'chateaux') return 'h' + q.answer.join(',') + q.rule
  if (q.kind === 'mystere') return 'm' + castleKey(q.secret)
  if (q.kind === 'capacite') return 'v' + Math.random()
  if (q.kind === 'table') return 't' + q.rows.join(',') + '|' + q.cols.join(',')
  return 's' + q.seq.join(',') + '|' + q.blanks.join(',')
}

function collectionTarget(c: CollectionConfig): number {
  const min = clamp(c.min, 1, 100), max = clamp(c.max, min, 100)
  if (c.onlyTens) {
    const lo = Math.max(1, Math.ceil(min / 10)), hi = Math.max(lo, Math.floor(max / 10))
    return rnd(lo, hi) * 10
  }
  let n = rnd(min, max)
  // Les dizaines entières sont plus faciles : on les garde rares en mode mixte.
  for (let i = 0; i < 3 && n % 10 === 0 && min !== max; i++) n = rnd(min, max)
  return n
}

function collectionOptions(t: number, c: CollectionConfig, count: number): number[] {
  const lo = 1, hi = 100
  const tens = Math.floor(t / 10), units = t % 10
  // Distracteurs "pédagogiques" : une dizaine de trop ou de moins,
  // une unité de trop ou de moins, dizaines et unités inversées.
  let cand = c.onlyTens
    ? [t - 10, t + 10, t - 20, t + 20, t + 5, t - 5]
    : [t + 10, t - 10, t + 1, t - 1, t + 2, t - 2, units * 10 + tens]
  cand = [...new Set(cand.filter(x => x >= lo && x <= hi && x !== t))]
  shuffle(cand)
  const picked = cand.slice(0, count - 1)
  let guard = 0
  while (picked.length < count - 1 && guard++ < 100) {
    const x = rnd(Math.max(lo, t - 25), Math.min(hi, t + 25))
    if (x !== t && !picked.includes(x)) picked.push(x)
  }
  return shuffle([t, ...picked])
}

function suiteQuestion(c: SuiteConfig): SuiteQuestion {
  if (c.oral) {
    // « Compte de 1 en 1 de 47 jusqu'à 53 » : l'enfant écrit tous les nombres.
    const len = clamp(c.length || 6, 4, 8)
    const lo = Math.max(0, c.min), hi = Math.max(lo + len, Math.min(100, c.max))
    const start = rnd(lo, hi - len + 1)
    let seq = Array.from({ length: len }, (_, i) => start + i)
    const dir = c.direction === 'both' ? (Math.random() < 0.3 ? 'down' : 'up') : c.direction
    if (dir === 'down') seq = seq.reverse()
    return { kind: 'suite', seq, blanks: seq.map((_, i) => i), step: 1, oral: true }
  }
  const step = Math.max(1, c.step)
  let len = clamp(c.length, 3, 10)
  const min = Math.max(0, c.min), max = Math.max(min + step * 2, c.max)
  while (len > 3 && (len - 1) * step > max - min) len--
  const span = (len - 1) * step
  let start = rnd(min, Math.max(min, max - span))
  // Une fois sur deux, on part d'un multiple du pas (30, 40, 50…).
  if (Math.random() < 0.5) start = Math.min(max - span, Math.ceil(start / step) * step)
  start = Math.max(min, start)
  let seq = Array.from({ length: len }, (_, i) => start + i * step)
  const dir = c.direction === 'both' ? (Math.random() < 0.5 ? 'up' : 'down') : c.direction
  if (dir === 'down') seq = seq.reverse()
  // On laisse toujours les deux premiers nombres visibles pour que l'enfant voie le pas.
  const possible = shuffle(Array.from({ length: len - 2 }, (_, i) => i + 2))
  const blanks = possible.slice(0, clamp(c.blanks, 1, len - 2)).sort((a, b) => a - b)
  return { kind: 'suite', seq, blanks, step }
}

function distinct(n: number, lo: number, hi: number): number[] {
  const pool = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i))
  const out = pool.slice(0, n)
  // S'il n'y a pas assez de nombres différents, on complète avec des répétitions.
  while (out.length < n) out.push(rnd(lo, hi))
  return out
}

function tableQuestion(c: TableConfig): TableQuestion {
  const size = clamp(c.size, 2, 5)
  const lo = clamp(c.min, 0, 50), hi = clamp(c.max, lo + 1, 50)
  const rows = distinct(size, lo, hi), cols = distinct(size, lo, hi)
  const all: string[] = []
  for (let r = 0; r < size; r++) for (let k = 0; k < size; k++) all.push(cellKey(r, k))

  if (c.mode !== 'mixte') return { kind: 'table', rows, cols, blanks: all }

  // Mode mixte (comme les derniers tableaux de la fiche) :
  // 1 ou 2 en-têtes de ligne et 1 ou 2 en-têtes de colonne cachés,
  // chacun retrouvable grâce à une somme donnée avec un en-tête visible.
  const hideR = shuffle(Array.from({ length: size }, (_, i) => i)).slice(0, rnd(1, Math.max(1, size - 2)))
  const hideC = shuffle(Array.from({ length: size }, (_, i) => i)).slice(0, rnd(1, Math.max(1, size - 2)))
  const visR = rows.map((_, i) => i).filter(i => !hideR.includes(i))
  const visC = cols.map((_, i) => i).filter(i => !hideC.includes(i))
  const given = new Set<string>()
  for (const r of hideR) given.add(cellKey(r, visC[rnd(0, visC.length - 1)]))
  for (const k of hideC) given.add(cellKey(visR[rnd(0, visR.length - 1)], k))
  // Quelques sommes données en plus, pour ressembler à la fiche.
  for (const key of shuffle([...all]).slice(0, Math.floor(size / 2))) given.add(key)
  const blanks = [
    ...hideC.map(k => cellKey(-1, k)),
    ...hideR.map(r => cellKey(r, -1)),
    ...all.filter(k => !given.has(k)),
  ]
  return { kind: 'table', rows, cols, blanks }
}

function sonRound(c: SonConfig): Question[] {
  const n = clamp(c.questions ?? 12, 3, 30)
  const focus = [...new Set((c.focus || []).map(w => w.trim().toLowerCase()).filter(hasSon))]
  const words = shuffle([...focus]).slice(0, n)
  if (c.extra !== false) {
    const pool = shuffle(SON_BANK.filter(w => !words.includes(w)))
    while (words.length < n && pool.length) words.push(pool.pop()!)
  }
  // Moins de mots que de questions : on répète les mots à travailler.
  let i = 0
  while (words.length < n && focus.length) words.push(focus[i++ % focus.length])
  return shuffle(words).map(word => ({ kind: 'son', word }))
}

/** n questions générées sans doublon (au prix de quelques essais). */
function uniqueRound(n: number, gen: (i: number) => Question): Question[] {
  const out: Question[] = []
  const seen = new Set<string>()
  for (let i = 0; i < n; i++) {
    let q: Question
    let guard = 0
    do {
      q = gen(i)
    } while (seen.has(key(q)) && guard++ < 20)
    seen.add(key(q))
    out.push(q)
  }
  return out
}

/** Les parties choisies tournent, dans un ordre mélangé. */
function rotating<T>(n: number, items: T[]): T[] {
  return shuffle(Array.from({ length: n }, (_, i) => items[i % items.length]))
}

export interface TypeDef<K extends ExerciseType> {
  subject: Subject
  label: string
  help: string
  /** nombre minimum de questions par partie (le parent peut monter jusqu'à 20) */
  min: number
  defaultConfig: () => ConfigFor[K]
  make: (config: ConfigFor[K]) => Question[]
}

export const TYPES: { [K in ExerciseType]: TypeDef<K> } = {
  entoure: {
    subject: 'maths', label: 'Entoure', min: 3,
    help: "L'enfant dessine un rond autour de la collection qui a le bon nombre de balles.",
    defaultConfig: () => ({ min: 10, max: 90, onlyTens: true, questions: 10 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 3, 20), () => {
      const t = collectionTarget(cfg)
      return { kind: 'collection', target: t, options: collectionOptions(t, cfg, 4) }
    }),
  },
  combien: {
    subject: 'maths', label: 'Combien ?', min: 3,
    help: "L'enfant compte une collection (paquets de 10 et balles seules) et choisit le bon nombre.",
    defaultConfig: () => ({ min: 10, max: 90, onlyTens: true, questions: 10 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 3, 20), () => {
      const t = collectionTarget(cfg)
      return { kind: 'collection', target: t, options: collectionOptions(t, cfg, 3) }
    }),
  },
  paquets: {
    subject: 'maths', label: 'Paquets de 10', min: 1,
    help: "Des balles en vrac : l'enfant entoure au doigt des paquets de 10, puis touche des balles seules pour obtenir le nombre demandé (ex. 34 = 3 paquets et 4 balles).",
    defaultConfig: () => ({ min: 11, max: 49, extra: true, questions: 5 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 1, 20), () => paquetsQuestion(cfg)),
  },
  suite: {
    subject: 'maths', label: 'Complète la suite', min: 3,
    help: "L'enfant complète les cases vides d'une suite de nombres avec un clavier.",
    defaultConfig: () => ({ min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'up', questions: 10 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 3, 20), () => suiteQuestion(cfg)),
  },
  table: {
    subject: 'maths', label: "Tableau d'addition", min: 1,
    help: "L'enfant complète les cases vides d'un tableau d'addition. En mode mixte, il retrouve aussi des nombres des en-têtes à partir d'une somme.",
    defaultConfig: () => ({ min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 1, 20), () => tableQuestion(cfg)),
  },
  calcul: {
    subject: 'maths', label: 'Calcul', min: 3,
    help: "Additions et soustractions du type 34 + 3 ou 47 − 5. Choisissez les nombres à ajouter ou enlever (+0 à +10), la taille du grand nombre, et si l'enfant cherche le résultat ou le nombre manquant (34 + ? = 37).",
    defaultConfig: () => ({ op: '+', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], digits: 2, find: 'resultat', questions: 10 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 3, 20), () => calcQuestion(cfg)),
  },
  noeuds: {
    subject: 'maths', label: 'Les nœuds', min: 3,
    help: "Un quadrillage avec des colonnes (A, B, C…) et des lignes (1, 2, 3…). L'enfant lit sur quel nœud se trouve un objet, place un objet sur un nœud, ou le déplace (« 2 nœuds à droite »).",
    defaultConfig: () => ({ size: 5, skills: ['lire', 'placer', 'bouger'], questions: 8 }),
    make: (cfg) => {
      const n = clamp(cfg.questions ?? 10, 3, 20)
      const order = rotating(n, shuffle(noeudsSkills(cfg)))
      return uniqueRound(n, i => noeudsQuestion(order[i], cfg))
    },
  },
  chateaux: {
    subject: 'maths', label: 'Tours de cubes', min: 1,
    help: "Stratégie « ajustements d'essais successifs » : l'enfant construit des tours de cubes qui respectent deux conditions (ex. 15 cubes en tout, la tour de droite a 3 cubes de plus). Il essaie, vérifie, puis ajuste.",
    defaultConfig: () => ({ towers: 2, maxTotal: 20, questions: 5 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 1, 20), () => chateauxQuestion(cfg)),
  },
  mystere: {
    subject: 'maths', label: 'Le château mystère', min: 1,
    help: "Jeu des 36 cartes château (3 couleurs × 3 tours × 2 portes × 2 drapeaux). L'enfant propose un château, on lui dit combien de critères sont corrects sans dire lesquels, et il ajuste un seul critère à la fois jusqu'à trouver le château mystère (ajustements d'essais successifs).",
    defaultConfig: () => ({ aide: true, strict: true, questions: 3 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 1, 20), () => mystereQuestion(cfg)),
  },
  capacite: {
    subject: 'maths', label: 'Qui contient le plus ?', min: 1,
    help: "Comparaison directe : on remplit un récipient et on le verse dans l'autre. S'il déborde, le premier contient plus ; s'il n'est pas plein, il contient moins. Les récipients ont des formes trompeuses (haut et fin, bas et large).",
    defaultConfig: () => ({ compare: 'mix', questions: 6 }),
    make: (cfg) => uniqueRound(clamp(cfg.questions ?? 10, 1, 20), () => capaciteQuestion(cfg)),
  },
  alphabet: {
    subject: 'francais', label: "L'alphabet", min: 3,
    help: "Lettre qui manque dans l'alphabet, lettre avant / après / entre, trouver les voyelles, ranger des mots selon l'ordre alphabétique (1re lettre). Les questions sont tirées au hasard parmi les parties choisies.",
    defaultConfig: () => ({ skills: ['suite', 'position', 'voyelles', 'ranger'], words: 3, capitals: false, questions: 12 }),
    make: (cfg) => {
      const n = clamp(cfg.questions ?? 10, 3, 20)
      const order = rotating(n, shuffle(alphaSkills(cfg)))
      return uniqueRound(n, i => alphaQuestion(order[i], cfg))
    },
  },
  son: {
    subject: 'francais', label: 'Le son on / om', min: 3,
    help: "La règle (m devant m, b, p) s'affiche au début, puis l'enfant choisit « on » ou « om » pour compléter chaque mot. Les mots à travailler reviennent à chaque partie ; les mots pièges (bonbon, nom, prénom…) sont repérés automatiquement.",
    defaultConfig: () => ({ focus: [...SON_FOCUS_DEFAULT], extra: true, showRule: true, questions: 12 }),
    make: (cfg) => sonRound(cfg),
  },
}

export function makeRound<K extends ExerciseType>(ex: ExerciseOf<K>): Question[] {
  return TYPES[ex.type].make(ex.config)
}
