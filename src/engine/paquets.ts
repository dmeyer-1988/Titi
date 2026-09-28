import type { PaquetsConfig } from './types'

/** Balles en vrac, positions en fraction (0-1) du terrain. */
export interface PaquetsQuestion {
  kind: 'paquets'
  target: number
  cols: number
  rows: number
  balls: [number, number][]
}

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export function paquetsQuestion(c: PaquetsConfig): PaquetsQuestion {
  const lo = Math.max(1, Math.min(c.min, 99)), hi = Math.max(lo, Math.min(c.max, 100))
  let target = rnd(lo, hi)
  // on évite les dizaines rondes trop souvent : l'intérêt est aussi dans les unités
  if (target % 10 === 0 && Math.random() < 0.6 && target < hi) target++
  const count = Math.min(100, c.extra ? target + rnd(4, 12) : target)
  const cols = count <= 24 ? 7 : count <= 50 ? 9 : 12
  const rows = Math.ceil(count / cols) + 1
  // grille mélangée + petit décalage aléatoire : ça a l'air en vrac mais les balles ne se chevauchent pas
  const cells = Array.from({ length: cols * rows }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]] }
  const balls = cells.slice(0, count).map(i => {
    const cx = i % cols, cy = Math.floor(i / cols)
    return [(cx + 0.5 + (Math.random() - 0.5) * 0.4) / cols, (cy + 0.5 + (Math.random() - 0.5) * 0.4) / rows] as [number, number]
  })
  return { kind: 'paquets', target, cols, rows, balls }
}
