// Maîtrise d'une compétence, calculée depuis les réponses (attempts.skill_id).
// Pas de table d'état : on recompte, ce qui marche aussi hors ligne avec la
// file d'attente locale (fetchAttempts fusionne les deux).

import type { Attempt } from '../engine/types'
import type { Skill } from '../engine/skills'

export interface Mastery {
  /** réponses prises en compte (les MAX derniers essais de la compétence) */
  count: number
  /** part de réponses justes du premier coup */
  firstTryRate: number
  done: boolean
  stars: 0 | 1 | 2 | 3
}

/** Combien de réponses on regarde, au plus, pour juger une compétence. */
export const MASTERY_WINDOW = 10
/** Il faut au moins autant de réponses pour valider la compétence. */
export const MASTERY_MIN = 5
/** Part de réussite du premier coup à atteindre sur la fenêtre. */
export const MASTERY_RATE = 0.8

/** attempts : les plus récentes d'abord (ordre de fetchAttempts). */
export function masteryFor(attempts: Attempt[], skillId: string): Mastery {
  const last = attempts.filter(a => a.skill_id === skillId).slice(0, MASTERY_WINDOW)
  const count = last.length
  const rate = count ? last.filter(a => a.correct && a.first_try).length / count : 0
  const done = count >= MASTERY_MIN && rate >= MASTERY_RATE
  const stars: Mastery['stars'] = !done ? 0 : rate >= 0.95 ? 3 : rate >= 0.9 ? 2 : 1
  return { count, firstTryRate: rate, done, stars }
}

export interface PathNode {
  skill: Skill
  state: 'done' | 'current' | 'locked'
  stars: 0 | 1 | 2 | 3
}

/**
 * État de chaque nœud du chemin : la première compétence non validée dont
 * toutes les précédentes le sont devient « en cours », les suivantes sont
 * verrouillées. Jamais de impasse : rejouer le nœud en cours reste possible.
 */
export function pathNodes(skills: Skill[], attempts: Attempt[]): PathNode[] {
  let reached = true
  return skills.map(skill => {
    const m = masteryFor(attempts, skill.id)
    if (m.done) return { skill, state: 'done', stars: m.stars }
    const state = reached ? 'current' : 'locked'
    reached = false
    return { skill, state, stars: 0 }
  })
}
