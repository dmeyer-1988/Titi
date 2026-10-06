import type { ChateauxConfig } from './types'

/**
 * Les châteaux : des tours de cubes qui doivent respecter deux conditions.
 * L'enfant essaie, vérifie, puis ajuste (ajustements d'essais successifs).
 */
export interface ChateauxQuestion {
  kind: 'chateaux'
  towers: number
  total: number
  /** 'plus' : chaque tour a `d` cubes de plus que la tour à sa gauche ; 'double' : la tour de droite a 2 fois plus de cubes */
  rule: 'plus' | 'double'
  d: number
  /** la solution, de gauche à droite */
  answer: number[]
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export function chateauxQuestion(c: ChateauxConfig): ChateauxQuestion {
  const towers = c.towers === 3 ? 3 : 2
  const maxTotal = Math.max(8, Math.min(40, c.maxTotal || 20))
  for (let guard = 0; guard < 200; guard++) {
    if (towers === 2) {
      if (Math.random() < 0.2) {
        const x = rnd(2, Math.min(6, Math.floor(maxTotal / 3)))
        return { kind: 'chateaux', towers, total: 3 * x, rule: 'double', d: 0, answer: [x, 2 * x] }
      }
      const x = rnd(2, 9), d = rnd(1, 5), total = 2 * x + d
      if (total <= maxTotal && x + d <= 12) return { kind: 'chateaux', towers, total, rule: 'plus', d, answer: [x, x + d] }
    } else {
      const x = rnd(1, 6), d = rnd(1, 2), total = 3 * x + 3 * d
      if (total <= maxTotal && x + 2 * d <= 12) return { kind: 'chateaux', towers, total, rule: 'plus', d, answer: [x, x + d, x + 2 * d] }
    }
  }
  return { kind: 'chateaux', towers: 2, total: 11, rule: 'plus', d: 3, answer: [4, 7] }
}

/** Le texte de la deuxième condition. */
export function ruleText(q: ChateauxQuestion): string {
  if (q.rule === 'double') return 'La tour de droite a 2 fois plus de cubes que la tour de gauche.'
  const cubes = `${q.d} cube${q.d > 1 ? 's' : ''}`
  return q.towers === 2
    ? `La tour de droite a ${cubes} de plus que la tour de gauche.`
    : `Chaque tour a ${cubes} de plus que la tour à sa gauche.`
}

/** Les deux conditions sont-elles respectées ? */
export function checkChateau(q: ChateauxQuestion, h: number[]) {
  const sum = h.reduce((a, b) => a + b, 0)
  const totalOk = sum === q.total
  const ruleOk = q.rule === 'double'
    ? h[1] === 2 * h[0] && h[0] > 0
    : h.every((v, i) => i === 0 || v - h[i - 1] === q.d)
  return { sum, totalOk, ruleOk }
}
