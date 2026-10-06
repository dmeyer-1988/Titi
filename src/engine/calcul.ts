import type { CalculConfig } from './types'

/** a op b = c ; `blank` = la case que l'enfant doit trouver. */
export interface CalcQuestion {
  kind: 'calc'
  op: '+' | '-'
  a: number
  b: number
  c: number
  blank: 'a' | 'b' | 'c'
  /** « Calculer efficacement » : l'astuce montrée après une erreur */
  tip?: string
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const RANGE: Record<number, [number, number]> = { 1: [0, 9], 2: [10, 99], 3: [100, 999] }

export const MINUS = '−'
export const opSign = (op: '+' | '-') => (op === '+' ? '+' : MINUS)

/** Calculs « astuces » : amis de 10, doubles, presque-doubles, +9, ±10, dizaines, passage de la dizaine. */
export function astuceQuestion(): CalcQuestion {
  const kind = ['amis10', 'amis10', 'double', 'presque', 'plus10', 'moins10', 'plus9', 'dizaines', 'passage', 'dizaineSup'][rnd(0, 9)]
  if (kind === 'amis10') { const a = rnd(1, 9); return { kind: 'calc', op: '+', a, b: 10 - a, c: 10, blank: 'b', tip: 'Les amis de 10 : 1 et 9, 2 et 8, 3 et 7, 4 et 6, 5 et 5.' } }
  if (kind === 'double') { const a = rnd(2, 10); return { kind: 'calc', op: '+', a, b: a, c: 2 * a, blank: 'c', tip: `C'est un double : ${a} + ${a}. Tu le connais par cœur ?` } }
  if (kind === 'presque') { const a = rnd(3, 9); return { kind: 'calc', op: '+', a, b: a + 1, c: 2 * a + 1, blank: 'c', tip: `Presque un double : ${a} + ${a + 1}, c'est ${a} + ${a} = ${2 * a}, puis + 1.` } }
  if (kind === 'plus10') { const a = rnd(11, 89); return { kind: 'calc', op: '+', a, b: 10, c: a + 10, blank: 'c', tip: 'Avec + 10, seul le chiffre des dizaines change : il augmente de 1.' } }
  if (kind === 'moins10') { const a = rnd(20, 99); return { kind: 'calc', op: '-', a, b: 10, c: a - 10, blank: 'c', tip: 'Avec − 10, seul le chiffre des dizaines change : il diminue de 1.' } }
  if (kind === 'plus9') { const a = rnd(11, 80); return { kind: 'calc', op: '+', a, b: 9, c: a + 9, blank: 'c', tip: `+ 9, c'est + 10 puis − 1 : ${a} + 10 = ${a + 10}, puis − 1.` } }
  if (kind === 'dizaines') { const x = rnd(1, 6), y = rnd(1, 9 - x); return { kind: 'calc', op: '+', a: x * 10, b: y * 10, c: (x + y) * 10, blank: 'c', tip: `${x} dizaines + ${y} dizaines = ${x + y} dizaines.` } }
  if (kind === 'passage') { const a = rnd(6, 9), b = rnd(11 - a, 9); return { kind: 'calc', op: '+', a, b, c: a + b, blank: 'c', tip: `Passe par 10 : ${a} + ${10 - a} = 10, puis + ${b - (10 - a)}.` } }
  const a = rnd(1, 8) * 10 + rnd(1, 9), up = Math.ceil(a / 10) * 10
  return { kind: 'calc', op: '+', a, b: up - a, c: up, blank: 'b', tip: `Combien pour aller jusqu'à ${up} ? Pense aux amis de 10 avec le ${a % 10}.` }
}

export function calcQuestion(c: CalculConfig): CalcQuestion {
  if (c.astuces) return astuceQuestion()
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
  if (c.astuces) return 'Calculer efficacement'
  const s = [...(c.steps || [])].sort((x, y) => x - y)
  const sign = c.op === '-' ? MINUS : c.op === '+' ? '+' : '±'
  const contiguous = s.length > 1 && s.every((v, i) => i === 0 || v === s[i - 1] + 1)
  const range = s.length === 0 ? '' : contiguous ? `${sign}${s[0]} à ${sign}${s[s.length - 1]}` : s.map(v => sign + v).join(', ')
  const name = c.find === 'manquant' ? 'Le nombre manquant' : c.op === '+' ? 'Additions' : c.op === '-' ? 'Soustractions' : 'Calculs'
  return `${name} ${range}${c.digits === 3 ? ' (3 chiffres)' : c.digits === 1 ? ' (petits nombres)' : ''}`.trim()
}
