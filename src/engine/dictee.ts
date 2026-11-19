// « Mes mots de dictée » : la liste de mots de la semaine, travaillée de 4 façons.
import type { DicteeConfig, DicteeMode } from './types'

/** Une entrée de la liste : ce qu'on écrit, et ce que la loutre dit (avec une petite phrase si besoin). */
export interface DicteeEntry { text: string; context?: string }

export type DicteeQuestion =
  | { kind: 'dictee'; mode: 'ecrire' | 'memo'; entry: DicteeEntry; retry?: boolean }
  | { kind: 'dictee'; mode: 'son'; entry: DicteeEntry; before: string; blank: string; after: string; options: string[]; retry?: boolean }
  | { kind: 'dictee'; mode: 'fin'; entry: DicteeEntry; stem: string; ending: string; options: string[]; retry?: boolean }

export const DICTEE_LISTE5 = [
  'mon train', 'sa main', 'un peintre', 'une peintre', 'une peintresse', 'le frein',
  'ton cousin', 'ta cousine', 'fin | un fil très fin', 'fine | une ficelle fine',
  'imperméable | un manteau imperméable', 'impressionner', 'il impressionne',
  'Ma cousine impressionne ce peintre.',
]

export const MODE_LABEL: Record<DicteeMode, string> = {
  ecrire: 'Dictée',
  memo: 'Regarde, cache, écris',
  son: 'Le bon son (ain, ein, in…)',
  fin: 'La lettre de la fin',
}

/** « fin | un fil très fin » → { text: 'fin', context: 'un fil très fin' } */
export function parseEntry(line: string): DicteeEntry | null {
  const [t, c] = line.split('|').map(s => s.trim().replace(/\s+/g, ' '))
  if (!t) return null
  return c ? { text: t, context: c } : { text: t }
}
export const parseList = (words: string[]) => words.map(parseEntry).filter((e): e is DicteeEntry => e !== null)

/** Ce que la loutre dit : le mot, la petite phrase, puis encore le mot. */
export function speech(e: DicteeEntry): string {
  return e.context ? `${e.text}. ${e.context}. ${e.text}.` : `${e.text}. ... ${e.text}.`
}

/** Comparaison indulgente : majuscules, espaces et point final ne comptent pas. */
export const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[.!?]+$/, '').replace(/\s+/g, ' ').trim()

const VOWEL = /[aeiouyéèêëàâîïôûù]/

/**
 * Le son [in] écrit ain, ein, in, im, aim, yn, ym. Il n'y a pas de son [in]
 * si la lettre suivante est une voyelle, un n ou un m (cousine, fine, inné).
 */
export interface SonSpot { start: number; g: string }
export function findIn(word: string): SonSpot | null {
  const w = word.toLowerCase()
  for (let i = 0; i < w.length; i++) {
    for (const g of ['ain', 'aim', 'ein', 'eim', 'in', 'im', 'yn', 'ym']) {
      if (!w.startsWith(g, i)) continue
      const next = w[i + g.length] ?? ''
      if (next && (VOWEL.test(next) || next === 'n' || next === 'm')) continue
      // « in » ou « im » déjà pris dans « ain » / « ein » : on garde la forme longue
      if ((g === 'in' || g === 'im') && i > 0 && 'ae'.includes(w[i - 1])) continue
      return { start: i, g }
    }
  }
  return null
}

/** Le dernier mot de l'entrée (là où se joue la fin muette). */
const lastWord = (t: string) => t.replace(/[.!?]+$/, '').split(' ').pop() ?? ''

/** La lettre muette de la fin : 'e' (cousine), 't' / 's' / 'd' / 'x' après une voyelle, ou '' (rien). null = mot ignoré. */
export function silentEnd(text: string): string | null {
  const w = lastWord(text).toLowerCase()
  if (w.length < 3 || text.trim().split(' ').length > 3) return null
  if (/er$|ez$|é$|ée?s?$/.test(w)) return null // fins en « é » : autre règle
  if (/[^aeiouy]e$/.test(w)) return 'e'
  if (/[aeiouyn][tsdx]$/.test(w) && !/(ss|ts)$/.test(w)) return w.slice(-1)
  const s = findIn(w)
  if (s && s.start + s.g.length === w.length) return '' // train, frein, cousin…
  return null
}

/** Explications affichées sous la correction. */
export function tips(e: DicteeEntry, all: DicteeEntry[]): string[] {
  const out: string[] = []
  for (const w of e.text.replace(/[.!?]+$/, '').split(' ')) {
    const s = findIn(w)
    if (s) {
      if (s.g === 'im') out.push(`« ${w} » : devant p, b, m, le son [in] s'écrit im (comme om dans pompon).`)
      else if (s.g === 'ain' || s.g === 'ein') out.push(`« ${w} » s'écrit avec ${s.g}. Il n'y a pas de règle : retiens-le par cœur !`)
    }
  }
  const lw = lastWord(e.text)
  const end = silentEnd(e.text)
  if (end === 'e') {
    const masc = lw.slice(0, -1).toLowerCase()
    const pair = all.some(o => lastWord(o.text).toLowerCase() === masc)
    out.push(pair
      ? `Au féminin, on ajoute un e : ${masc} → ${lw}.`
      : `« ${lw} » finit par un e qu'on n'entend pas, mais qu'on écrit !`)
  } else if (end && end.length === 1) out.push(`« ${lw} » finit par un ${end} muet : on ne l'entend pas, mais on l'écrit.`)
  else if (end === '') out.push(`« ${lw} » ne prend pas de e ni de t à la fin.`)
  if (/^[A-ZÀÉÈ]/.test(e.text) && /[.!?]$/.test(e.text)) out.push('Une phrase commence par une majuscule et finit par un point.')
  return [...new Set(out)]
}

const rnd = (n: number) => Math.floor(Math.random() * n)
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const DETS = /^(un|une|le|la|les|mon|ma|ton|ta|sa|son|il|elle)$/i

function sonOptions(g: string): string[] {
  return g === 'im' || g === 'in' ? ['in', 'im'] : ['ain', 'ein', 'in']
}

export function canMode(mode: DicteeMode, e: DicteeEntry): boolean {
  if (mode === 'son') return e.text.split(' ').some(w => !DETS.test(w) && findIn(w) !== null)
  if (mode === 'fin') return silentEnd(e.text) !== null
  return true
}

export function makeQuestion(mode: DicteeMode, e: DicteeEntry): DicteeQuestion {
  if (mode === 'son') {
    // on cherche le son dans le mot principal (pas dans « un », « mon »…)
    const words = e.text.split(' ')
    let offset = 0
    for (const w of words) {
      const s = findIn(w)
      if (s && !DETS.test(w)) {
        const start = offset + s.start
        return {
          kind: 'dictee', mode, entry: e,
          before: e.text.slice(0, start), blank: s.g, after: e.text.slice(start + s.g.length),
          options: sonOptions(s.g),
        }
      }
      offset += w.length + 1
    }
  }
  if (mode === 'fin') {
    const end = silentEnd(e.text)
    if (end !== null) {
      const stem = end ? e.text.slice(0, -end.length) : e.text
      const opts = ['', 'e', 't', 's']
      if (end && !opts.includes(end)) opts[3] = end
      return { kind: 'dictee', mode, entry: e, stem, ending: end, options: opts }
    }
  }
  return { kind: 'dictee', mode: mode === 'memo' ? 'memo' : 'ecrire', entry: e }
}

/** Une partie : chaque mot à tour de rôle, les façons de travailler tournent. */
export function dicteeRound(c: DicteeConfig): DicteeQuestion[] {
  const list = parseList(c.list?.length ? c.list : DICTEE_LISTE5)
  const modes: DicteeMode[] = c.modes?.length ? c.modes : ['memo', 'ecrire', 'son', 'fin']
  const n = Math.max(1, Math.min(30, c.questions || 12))
  if (!list.length) return []
  const out: DicteeQuestion[] = []
  let pool: DicteeEntry[] = []
  for (let i = 0; i < n; i++) {
    const mode = modes[i % modes.length]
    if (!pool.length) pool = shuffle([...list])
    // un mot qui convient à cette façon de travailler, sinon on écrit le mot
    const k = pool.findIndex(e => canMode(mode, e))
    const e = k >= 0 ? pool.splice(k, 1)[0] : pool.shift()!
    out.push(makeQuestion(k >= 0 ? mode : (mode === 'son' || mode === 'fin' ? 'ecrire' : mode), e))
  }
  // regarder-cacher-écrire d'abord, la dictée pure ensuite
  const order: Record<string, number> = { memo: 0, son: 1, fin: 1, ecrire: 2 }
  return out.sort((a, b) => order[a.mode] - order[b.mode] || Math.random() - 0.5)
}

/** Lettres justes / fausses / oubliées (miss), pour colorier la réponse de l'enfant. */
export function diffLetters(given: string, right: string): { ch: string; ok: boolean; miss?: boolean }[] {
  const a = given, b = right
  const n = a.length, m = b.length
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out: { ch: string; ok: boolean; miss?: boolean }[] = []
  let i = 0, j = 0
  while (i < n) {
    if (j < m && a[i].toLowerCase() === b[j].toLowerCase()) { out.push({ ch: a[i], ok: true }); i++; j++ }
    else if (j < m && L[i][j + 1] >= L[i + 1][j]) { if (b[j] !== ' ') out.push({ ch: '_', ok: false, miss: true }); j++ }
    else { out.push({ ch: a[i], ok: false }); i++ }
  }
  // lettres oubliées à la fin (le e muet !)
  while (j < m) { if (b[j] !== ' ' && !/[.!?]/.test(b[j])) out.push({ ch: '_', ok: false, miss: true }); j++ }
  return out
}
