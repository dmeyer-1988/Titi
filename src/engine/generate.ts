import type { AlphabetConfig, CollectionConfig, Exercise, SuiteConfig, TableConfig } from './types'
import { alphaKey, alphaQuestion, alphaSkills, type AlphaQuestion } from './alphabet'

export interface CollectionQuestion {
  kind: 'collection'
  target: number
  options: number[]
}
export interface SuiteQuestion {
  kind: 'suite'
  seq: number[]
  blanks: number[]
  step: number
}
/**
 * Tableau d'addition. Les cases sont repérées par "r,c" :
 * r = -1 pour la ligne d'en-tête, c = -1 pour la colonne d'en-tête.
 */
export interface TableQuestion {
  kind: 'table'
  rows: number[]
  cols: number[]
  /** cases à compléter par l'enfant */
  blanks: string[]
}
export type Question = CollectionQuestion | SuiteQuestion | TableQuestion | AlphaQuestion

export const cellKey = (r: number, c: number) => `${r},${c}`
export function cellValue(q: TableQuestion, r: number, c: number): number {
  if (r === -1) return q.cols[c]
  if (c === -1) return q.rows[r]
  return q.rows[r] + q.cols[c]
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

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

export function makeRound(ex: Exercise): Question[] {
  const n = clamp((ex.config as { questions?: number }).questions ?? 10, ex.type === 'table' ? 1 : 3, 20)
  const out: Question[] = []
  const seen = new Set<string>()
  // Alphabet : les parties choisies tournent (suite, position, voyelles, ranger…), dans un ordre mélangé.
  const skillOrder = ex.type === 'alphabet'
    ? shuffle(Array.from({ length: n }, (_, i) => alphaSkills(ex.config as AlphabetConfig)[i % alphaSkills(ex.config as AlphabetConfig).length]))
    : []
  for (let i = 0; i < n; i++) {
    let q: Question
    let guard = 0
    do {
      if (ex.type === 'suite') q = suiteQuestion(ex.config as SuiteConfig)
      else if (ex.type === 'table') q = tableQuestion(ex.config as TableConfig)
      else if (ex.type === 'alphabet') q = alphaQuestion(skillOrder[i], ex.config as AlphabetConfig)
      else {
        const cfg = ex.config as CollectionConfig
        const t = collectionTarget(cfg)
        q = { kind: 'collection', target: t, options: collectionOptions(t, cfg, ex.type === 'entoure' ? 4 : 3) }
      }
    } while (seen.has(key(q)) && guard++ < 20)
    seen.add(key(q))
    out.push(q)
  }
  return out
}

function key(q: Question) {
  if (q.kind === 'collection') return 'c' + q.target
  if (q.kind === 'alpha') return alphaKey(q)
  if (q.kind === 'table') return 't' + q.rows.join(',') + '|' + q.cols.join(',')
  return 's' + q.seq.join(',') + '|' + q.blanks.join(',')
}
