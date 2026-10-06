import type { CapaciteConfig } from './types'

/** Un récipient vu de face : largeur et hauteur intérieures (unités SVG). Sa capacité = w × h. */
export interface Pot { w: number; h: number; color: string; name: string }

export interface CapaciteQuestion {
  kind: 'capacite'
  /** 'verser' : l'enfant verse ; 'lire' : on montre le résultat */
  mode: 'verser' | 'lire'
  /** a est rempli puis versé dans b */
  a: Pot
  b: Pot
  /** 'a' | 'b' | 'pareil' : celui qui contient le plus */
  answer: 'a' | 'b' | 'pareil'
}

export const POT_COLORS = [
  { color: '#D6453A', name: 'rouge' },
  { color: '#2F8F55', name: 'vert' },
  { color: '#9B6FA8', name: 'violet' },
  { color: '#E07A4B', name: 'orange' },
]

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
export const cap = (p: Pot) => p.w * p.h

export function capaciteQuestion(c: CapaciteConfig): CapaciteQuestion {
  const mode = c.compare === 'mix' || !c.compare ? (Math.random() < 0.5 ? 'verser' : 'lire') : c.compare
  const cols = [...POT_COLORS].sort(() => Math.random() - 0.5)
  // un récipient haut et fin, un récipient bas et large : la hauteur ne suffit pas pour décider
  const tall = { w: rnd(36, 50), h: rnd(120, 150) }
  const target = Math.random()
  let wide: { w: number; h: number }
  const ww = rnd(95, 125)
  if (target < 0.15) wide = { w: ww, h: Math.round(cap({ ...tall, color: '', name: '' }) / ww) } // presque pareil
  else {
    // l'un ou l'autre plus grand d'environ 25 à 50 %
    const ratio = target < 0.575 ? rnd(125, 150) / 100 : rnd(55, 78) / 100
    wide = { w: ww, h: Math.max(28, Math.min(95, Math.round((tall.w * tall.h * ratio) / ww))) }
  }
  const tallFirst = Math.random() < 0.5
  const [pa, pb] = tallFirst ? [tall, wide] : [wide, tall]
  const a: Pot = { ...pa, ...cols[0] }, b: Pot = { ...pb, ...cols[1] }
  const ca = cap(a), cb = cap(b)
  const answer = Math.abs(ca - cb) / Math.max(ca, cb) < 0.03 ? 'pareil' : ca > cb ? 'a' : 'b'
  // « pareil » : on égalise exactement pour que le dessin soit juste
  if (answer === 'pareil') b.h = ca / b.w
  return { kind: 'capacite', mode, a, b, answer }
}

/** Ce qu'on observe après avoir versé a dans b, et ce qu'on en conclut. */
export function explainCapacite(q: CapaciteQuestion): string {
  const A = `le ${q.a.name}`, B = `le ${q.b.name}`
  if (q.answer === 'a') return `L'eau a débordé du ${q.b.name} : ${A} contient plus que ${B}.`
  if (q.answer === 'b') return `Le ${q.b.name} n'est pas plein : ${B} contient plus que ${A}.`
  return `Le ${q.b.name} est plein juste au bord : ils contiennent autant l'un que l'autre.`
}
