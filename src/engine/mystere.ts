import type { MystereConfig } from './types'

/**
 * Le château mystère : 36 cartes = 3 couleurs × 3 tours × 2 portes × 2 drapeaux.
 * L'enfant propose un château, on lui dit combien de critères sont corrects (sans dire lesquels),
 * et il ajuste UN seul critère à la fois.
 */
export const ATTRS = [
  { key: 'couleur', label: 'Couleur', values: ['jaune', 'bleu', 'rouge'] },
  { key: 'tour', label: 'Tours', values: ['pointues', 'arrondies', 'crénelées'] },
  { key: 'porte', label: 'Porte', values: ['carrée', 'arrondie'] },
  { key: 'drapeau', label: 'Drapeau', values: ['avec', 'sans'] },
] as const

/** Une carte : l'indice de la valeur choisie pour chaque critère. */
export type Castle = [number, number, number, number]

export interface MystereQuestion {
  kind: 'mystere'
  secret: Castle
  /** la première carte, tirée au hasard (étape 1) */
  start: Castle
  aide: boolean
  strict: boolean
}

const rnd = (n: number) => Math.floor(Math.random() * n)
export const randomCastle = (): Castle => ATTRS.map(a => rnd(a.values.length)) as Castle
export const score = (a: Castle, b: Castle) => a.reduce((n, v, i) => n + (v === b[i] ? 1 : 0), 0)
export const diff = (a: Castle, b: Castle) => a.map((v, i) => (v !== b[i] ? i : -1)).filter(i => i >= 0)
export const castleKey = (c: Castle) => c.join('')

export function mystereQuestion(c: MystereConfig): MystereQuestion {
  const secret = randomCastle()
  let start = randomCastle()
  // une première carte avec 1 ou 2 critères justes : il reste de quoi chercher
  for (let i = 0; i < 50 && (score(start, secret) > 2 || score(start, secret) < 1); i++) start = randomCastle()
  return { kind: 'mystere', secret, start, aide: c.aide !== false, strict: c.strict !== false }
}

/** « le bleu », « les tours pointues », « la porte carrée », « avec drapeau » */
export function valueName(attr: number, v: number): string {
  const x = ATTRS[attr].values[v]
  if (attr === 0) return `le ${x}`
  if (attr === 1) return `les tours ${x}`
  if (attr === 2) return `la porte ${x}`
  return x === 'avec' ? 'avec drapeau' : 'sans drapeau'
}

/** Ce que la loutre explique après un essai qui ne change qu'un critère. */
export function explain(prev: Castle, prevScore: number, cur: Castle, curScore: number): string {
  const d = diff(prev, cur)
  if (d.length !== 1) return `${curScore} critère${curScore > 1 ? 's' : ''} correct${curScore > 1 ? 's' : ''} sur 4.`
  const i = d[0]
  const now = valueName(i, cur[i]), before = valueName(i, prev[i])
  if (curScore > prevScore) return `Le score monte ! Donc ${now}, c'est juste. Garde-le et change un autre critère.`
  if (curScore < prevScore) {
    const back = i === 3 ? (prev[i] === 0 ? 'Remets le drapeau' : 'Enlève le drapeau') : `Remets ${before}`
    return `Le score baisse : ${before}, c'était juste ! ${back}, puis change un autre critère.`
  }
  const left = ATTRS[i].values.map((_, k) => k).filter(k => k !== prev[i] && k !== cur[i])
  return left.length === 1
    ? `Le score ne bouge pas : ni ${before}, ni ${now}. Il ne reste qu'une possibilité : ${valueName(i, left[0])} !`
    : `Le score ne bouge pas. Essaie autre chose.`
}
