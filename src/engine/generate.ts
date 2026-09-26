import type { CollectionConfig, Exercise, SuiteConfig } from './types'

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
export type Question = CollectionQuestion | SuiteQuestion

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

export function makeRound(ex: Exercise): Question[] {
  const n = clamp((ex.config as { questions?: number }).questions ?? 10, 3, 20)
  const out: Question[] = []
  const seen = new Set<string>()
  for (let i = 0; i < n; i++) {
    let q: Question
    let guard = 0
    do {
      if (ex.type === 'suite') q = suiteQuestion(ex.config as SuiteConfig)
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
  return q.kind === 'collection' ? 'c' + q.target : 's' + q.seq.join(',') + '|' + q.blanks.join(',')
}
