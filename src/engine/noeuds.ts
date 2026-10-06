import type { NoeudsConfig, NoeudSkill } from './types'

/** Un nœud : colonne (0 = A) et ligne (0 = 1, en bas). */
export type Node = [number, number]

export interface Thing { emoji: string; name: string }
export const THINGS: Thing[] = [
  { emoji: '🐱', name: 'le chat' },
  { emoji: '🐶', name: 'le chien' },
  { emoji: '🐰', name: 'le lapin' },
  { emoji: '🦊', name: 'le renard' },
  { emoji: '🐸', name: 'la grenouille' },
  { emoji: '🐢', name: 'la tortue' },
  { emoji: '🐭', name: 'la souris' },
  { emoji: '🐻', name: "l'ours" },
  { emoji: '🍎', name: 'la pomme' },
  { emoji: '⭐', name: "l'étoile" },
]

export interface NoeudsQuestion {
  kind: 'noeuds'
  skill: NoeudSkill
  size: number
  /** l'objet de la question */
  thing: Thing
  /** où il est au départ (lire, bouger) */
  at: Node
  /** autres objets posés sur le quadrillage (pour ne pas tout donner) */
  others: { thing: Thing; at: Node }[]
  /** bouger : déplacement en nœuds (dx > 0 = à droite, dy > 0 = en haut) */
  move?: [number, number]
  /** le nœud à trouver */
  answer: Node
  /** lire : les 4 réponses proposées */
  options?: string[]
}

export const COLS = 'ABCDEF'
export const nodeName = ([c, r]: Node) => `${COLS[c]}${r + 1}`
export const sameNode = (a: Node, b: Node) => a[0] === b[0] && a[1] === b[1]

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/** « 2 nœuds à droite et 1 nœud vers le haut » */
export function moveText([dx, dy]: [number, number]): string {
  const part = (n: number, pos: string, neg: string) => n === 0 ? '' : `${Math.abs(n)} nœud${Math.abs(n) > 1 ? 's' : ''} ${n > 0 ? pos : neg}`
  return [part(dx, 'à droite', 'à gauche'), part(dy, 'vers le haut', 'vers le bas')].filter(Boolean).join(' et ')
}

export function noeudsQuestion(skill: NoeudSkill, c: NoeudsConfig): NoeudsQuestion {
  const size = Math.max(4, Math.min(6, c.size || 5))
  const things = shuffle([...THINGS])
  const thing = things[0]
  const node = (): Node => [rnd(0, size - 1), rnd(0, size - 1)]
  let at = node()
  // le quadrillage n'est pas symétrique : on évite les nœuds où colonne = ligne (A1, B2…) qui ne piègent pas l'inversion
  for (let i = 0; i < 5 && at[0] === at[1]; i++) at = node()

  let answer: Node = at
  let move: [number, number] | undefined
  if (skill === 'bouger') {
    const ok = (n: Node) => n[0] >= 0 && n[1] >= 0 && n[0] < size && n[1] < size
    move = [at[0] < size - 1 ? 1 : -1, 0]
    for (let guard = 0; guard < 60; guard++) {
      const m: [number, number] = [rnd(-3, 3), rnd(-2, 2)]
      if (Math.random() < 0.35) m[Math.random() < 0.5 ? 0 : 1] = 0
      if ((m[0] || m[1]) && ok([at[0] + m[0], at[1] + m[1]])) { move = m; break }
    }
    answer = [at[0] + move[0], at[1] + move[1]]
  } else if (skill === 'placer') {
    answer = at
  }

  // autres objets : 3 en lecture, 2 sinon, jamais sur un nœud utile
  const others: { thing: Thing; at: Node }[] = []
  const busy = [at, answer]
  for (const t of things.slice(1, skill === 'lire' ? 4 : 3)) {
    let n = node(), g = 0
    while (busy.some(b => sameNode(b, n)) && g++ < 30) n = node()
    busy.push(n)
    others.push({ thing: t, at: n })
  }

  let options: string[] | undefined
  if (skill === 'lire') {
    const right = nodeName(at)
    // pièges : colonne et ligne inversées, une case à côté
    const cand = [
      at[1] < size && at[0] < size ? `${COLS[at[1]]}${at[0] + 1}` : '',
      nodeName([at[0], Math.min(size - 1, at[1] + 1)]),
      nodeName([at[0], Math.max(0, at[1] - 1)]),
      nodeName([Math.min(size - 1, at[0] + 1), at[1]]),
      nodeName([Math.max(0, at[0] - 1), at[1]]),
    ].filter(x => x && x !== right)
    const opts = [...new Set(cand)]
    const first = opts[0] && opts[0] !== right ? [opts[0]] : []
    options = shuffle([right, ...first, ...shuffle(opts.slice(1)).slice(0, 3 - first.length)])
  }

  return { kind: 'noeuds', skill, size, thing, at, others, move, answer, options }
}

export function noeudsSkills(c: NoeudsConfig): NoeudSkill[] {
  return c.skills?.length ? c.skills : ['lire', 'placer', 'bouger']
}
