// Géographie : drapeaux, continents, cantons suisses.
// Les cartes viennent de src/geo/*.json (générés par scripts/build-geo.mjs).
import countriesData from '../geo/countries.json'
import continentsData from '../geo/continents.json'
import cantonsData from '../geo/cantons.json'
import type { CantonsConfig, ContinentsConfig, DrapeauxConfig } from './types'

export interface Country { code: string; name: string; cont: string; flag: string; easy?: boolean }
export interface Continent { id: string; name: string; de: string; d: string; label: [number, number] }
export interface Canton { code: string; name: string; de: string; romand?: boolean; d: string; c: [number, number]; b: [number, number, number, number]; area: number }

export const COUNTRIES = countriesData as Country[]
export const WORLD = continentsData as { w: number; h: number; continents: Continent[] }
export const SWISS = cantonsData as { w: number; h: number; lakes: string; cantons: Canton[] }

export const continentById = (id: string) => WORLD.continents.find(c => c.id === id)!
export const cantonByCode = (code: string) => SWISS.cantons.find(c => c.code === code)!

export interface DrapeauQuestion { kind: 'drapeau'; sens: 'nom' | 'drapeau'; answer: Country; options: Country[] }
export interface ContinentQuestion { kind: 'continent'; mode: 'trouver' | 'nommer'; id: string; options: string[] }
export interface CantonQuestion {
  kind: 'canton'
  mode: 'puzzle' | 'trouver' | 'nommer'
  region: 'romands' | 'suisse'
  code: string
  /** puzzle : les cantons déjà posés avant celui-ci */
  placed: string[]
  options: string[]
}

const rnd = (n: number) => Math.floor(Math.random() * n)
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const pick = <T,>(a: T[]) => a[rnd(a.length)]

// ---------- Drapeaux ----------
export function flagPool(c: DrapeauxConfig): Country[] {
  if (c.niveau === 'facile') return COUNTRIES.filter(x => x.easy)
  if (c.niveau === 'europe') return COUNTRIES.filter(x => x.cont === 'EU')
  return COUNTRIES
}

export function drapeauxRound(c: DrapeauxConfig): DrapeauQuestion[] {
  const pool = flagPool(c)
  const n = Math.max(1, Math.min(30, c.questions || 10))
  const answers = shuffle([...pool])
  while (answers.length < n) answers.push(...shuffle([...pool]))
  return answers.slice(0, n).map((answer, i) => {
    const sens = c.sens === 'mix' ? (i % 2 ? 'drapeau' : 'nom') : c.sens
    // distracteurs : de préférence du même continent (drapeaux plus proches), dans la même liste
    const near = shuffle(pool.filter(x => x.code !== answer.code && x.cont === answer.cont))
    const far = shuffle(pool.filter(x => x.code !== answer.code && x.cont !== answer.cont))
    const others = [...near.slice(0, 2), ...far].filter((x, k, a) => a.indexOf(x) === k).slice(0, 3)
    while (others.length < 3) {
      const x = pick(COUNTRIES)
      if (x.code !== answer.code && !others.includes(x)) others.push(x)
    }
    return { kind: 'drapeau', sens, answer, options: shuffle([answer, ...others]) }
  })
}

// ---------- Continents ----------
export function continentsRound(c: ContinentsConfig): ContinentQuestion[] {
  const ids = WORLD.continents.map(x => x.id).filter(id => c.antarctique !== false || id !== 'AN')
  const n = Math.max(1, Math.min(20, c.questions || 8))
  const order: string[] = []
  while (order.length < n) order.push(...shuffle([...ids]).filter(id => id !== order[order.length - 1]))
  return order.slice(0, n).map((id, i) => {
    const mode = c.jeu === 'mix' ? (i % 2 ? 'nommer' : 'trouver') : c.jeu
    const options = shuffle([id, ...shuffle(ids.filter(x => x !== id)).slice(0, 3)])
    return { kind: 'continent', mode, id, options }
  })
}

// ---------- Cantons ----------
export function cantonsOf(region: 'romands' | 'suisse'): Canton[] {
  return region === 'romands' ? SWISS.cantons.filter(c => c.romand) : SWISS.cantons
}

/** Le cadre de la carte : toute la Suisse, ou la Suisse romande agrandie. */
export function cantonView(region: 'romands' | 'suisse'): [number, number, number, number] {
  if (region === 'suisse') return [0, 0, SWISS.w, SWISS.h]
  const b = cantonsOf('romands').reduce((a, c) => [Math.min(a[0], c.b[0]), Math.min(a[1], c.b[1]), Math.max(a[2], c.b[2]), Math.max(a[3], c.b[3])], [Infinity, Infinity, -Infinity, -Infinity])
  const m = 14
  return [b[0] - m, b[1] - m, b[2] - b[0] + 2 * m, b[3] - b[1] + 2 * m]
}

export function cantonsRound(c: CantonsConfig): CantonQuestion[] {
  const list = cantonsOf(c.region)
  const codes = list.map(x => x.code)
  if (c.jeu === 'puzzle') {
    const n = Math.max(1, Math.min(codes.length, c.questions || codes.length))
    const order = shuffle([...codes]).slice(0, n)
    return order.map((code, i) => ({ kind: 'canton', mode: 'puzzle', region: c.region, code, placed: order.slice(0, i), options: [] }))
  }
  const n = Math.max(1, Math.min(30, c.questions || 8))
  const order: string[] = []
  while (order.length < n) order.push(...shuffle([...codes]).filter(x => x !== order[order.length - 1]))
  return order.slice(0, n).map((code, i) => {
    const mode = c.jeu === 'mix' ? (i % 2 ? 'nommer' : 'trouver') : c.jeu
    // distracteurs : les cantons les plus proches (on les confond plus facilement)
    const me = cantonByCode(code)
    const near = list.filter(x => x.code !== code).sort((a, b) => Math.hypot(a.c[0] - me.c[0], a.c[1] - me.c[1]) - Math.hypot(b.c[0] - me.c[0], b.c[1] - me.c[1]))
    const options = shuffle([code, ...shuffle(near.slice(0, 5)).slice(0, 3).map(x => x.code)])
    return { kind: 'canton', mode, region: c.region, code, placed: [], options }
  })
}

/** Distance à partir de laquelle une pièce du puzzle « s'aimante » à sa place. */
export const snapDistance = (c: Canton) => 14 + 0.35 * Math.sqrt(c.area)
