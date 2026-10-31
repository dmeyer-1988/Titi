import { describe, expect, it } from 'vitest'
import { masteryFor, pathNodes, MASTERY_MIN } from './mastery'
import { skillsFor } from '../engine/skills'
import type { Attempt } from '../engine/types'

let n = 0
const att = (skillId: string | null, correct: boolean, firstTry: boolean): Attempt => ({
  id: 'a' + n++, child_id: 'c', exercise_id: null, exercise_type: 'suite', skill_id: skillId,
  prompt: {}, expected: 'x', given: 'x', correct, first_try: firstTry,
  created_at: new Date(2026, 0, 1, 12, 0, 0 - n).toISOString(),
})

// attempts les plus récentes d'abord
const round = (skillId: string, okFirstTry: number, total: number): Attempt[] =>
  Array.from({ length: total }, (_, i) => att(skillId, i < okFirstTry, i < okFirstTry))

describe('masteryFor', () => {
  it('pas de réponses : pas maîtrisé', () => {
    expect(masteryFor([], 's').done).toBe(false)
    expect(masteryFor([], 's').stars).toBe(0)
  })

  it('trop peu de réponses : pas maîtrisé, même à 100 %', () => {
    const m = masteryFor(round('s', MASTERY_MIN - 1, MASTERY_MIN - 1), 's')
    expect(m.firstTryRate).toBe(1)
    expect(m.done).toBe(false)
  })

  it('≥ seuil et ≥ 80 % du premier coup : maîtrisé', () => {
    expect(masteryFor(round('s', 8, 10), 's').done).toBe(true)
    expect(masteryFor(round('s', 7, 10), 's').done).toBe(false)
  })

  it('étoiles : 1 à 80 %, 2 à 90 %, 3 à 95 %', () => {
    expect(masteryFor(round('s', 8, 10), 's').stars).toBe(1)
    expect(masteryFor(round('s', 9, 10), 's').stars).toBe(2)
    expect(masteryFor(round('s', 10, 10), 's').stars).toBe(3)
  })

  it('seules les réponses de la compétence comptent', () => {
    const mixed = [...round('s', 8, 10), ...round('autre', 0, 10)]
    expect(masteryFor(mixed, 's').done).toBe(true)
    expect(masteryFor(mixed, 'autre').done).toBe(false)
  })
})

describe('pathNodes', () => {
  const maths = skillsFor('maths', 4)

  it('sans réponses : premier nœud en cours, le reste verrouillé', () => {
    const nodes = pathNodes(maths, [])
    expect(nodes[0].state).toBe('current')
    expect(nodes[1].state).toBe('locked')
    expect(nodes.every(x => x.stars === 0)).toBe(true)
  })

  it('une compétence maîtrisée débloque la suivante', () => {
    const nodes = pathNodes(maths, round(maths[0].id, 10, 10))
    expect(nodes[0].state).toBe('done')
    expect(nodes[0].stars).toBe(3)
    expect(nodes[1].state).toBe('current')
    expect(nodes[2].state).toBe('locked')
  })

  it('trous interdits : une compétence non validée bloque la suite', () => {
    const attempts = [...round(maths[0].id, 10, 10), ...round(maths[2].id, 10, 10)]
    const nodes = pathNodes(maths, attempts)
    expect(nodes[0].state).toBe('done')
    expect(nodes[1].state).toBe('current')
    expect(nodes[2].state).toBe('done')
    expect(nodes[3].state).toBe('locked')
  })
})
