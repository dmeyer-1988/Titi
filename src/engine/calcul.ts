import type { CalculConfig } from './types'

/** a op b = c ; `blank` = la case que l'enfant doit trouver. */
export interface CalcQuestion {
  kind: 'calc'
  op: '+' | '-'
  a: number
  b: number
  c: number
  blank: 'a' | 'b' | 'c'
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const RANGE: Record<number, [number, number]> = { 1: [0, 9], 2: [10, 99], 3: [100, 999] }

export const MINUS = '−'
export const opSign = (op: '+' | '-') => (op === '+' ? '+' : MINUS)

export function calcQuestion(c: CalculConfig): CalcQuestion {
  const steps = c.steps?.length ? c.steps : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const b = steps[rnd(0, steps.length - 1)]
  const op: '+' | '-' = c.op === 'mix' ? (Math.random() < 0.5 ? '+' : '-') : c.op
  const [lo, hi] = RANGE[c.digits] ?? RANGE[2]
  // Soustraction : jamais de résultat négatif. Le résultat reste dans la taille choisie quand c'est possible.
  const a = op === '-' ? rnd(Math.max(lo, b + (c.digits > 1 ? lo : 0)), hi) : rnd(lo, hi)
  const res = op === '+' ? a + b : a - b
  const find = c.find === 'mix' ? (Math.random() < 0.5 ? 'resultat' : 'manquant') : c.find
  const blank = find === 'resultat' ? 'c' : Math.random() < 0.7 ? 'b' : 'a'
  return { kind: 'calc', op, a, b, c: res, blank }
}

export const calcAnswer = (q: CalcQuestion) => q[q.blank]

/** Titre automatique : « Additions +0 à +10 », « Soustractions −2, −5 »… */
export function calcTitle(c: CalculConfig): string {
  const s = [...(c.steps || [])].sort((x, y) => x - y)
  const sign = c.op === '-' ? MINUS : c.op === '+' ? '+' : '±'
  const contiguous = s.length > 1 && s.every((v, i) => i === 0 || v === s[i - 1] + 1)
  const range = s.length === 0 ? '' : contiguous ? `${sign}${s[0]} à ${sign}${s[s.length - 1]}` : s.map(v => sign + v).join(', ')
  const name = c.find === 'manquant' ? 'Le nombre manquant' : c.op === '+' ? 'Additions' : c.op === '-' ? 'Soustractions' : 'Calculs'
  return `${name} ${range}${c.digits === 3 ? ' (3 chiffres)' : c.digits === 1 ? ' (petits nombres)' : ''}`.trim()
}
