import { describe, expect, it } from 'vitest'
import { cellValue, makeRound } from './generate'
import { nodeName } from './noeuds'
import { calcAnswer, calcQuestion } from './calcul'
import { hasSon, isTrap, ruleSays, SON_BANK } from './sons'
import { words } from './words'
import { type ConfigFor, type ExerciseOf, type ExerciseType } from './types'
import { TYPES } from './registry'

function mk<K extends ExerciseType>(type: K, config: ConfigFor[K] = TYPES[type].defaultConfig()): ExerciseOf<K> {
  const ex: ExerciseOf<K> = { id: 'test-ex', type, title: 'Test', config, active: true, position: 0 }
  return ex
}

describe('collections (entoure / combien)', () => {
  it('entoure : 4 options uniques dont la bonne réponse, dizaines seules respectées', () => {
    for (let i = 0; i < 50; i++) {
      for (const q of makeRound(mk('entoure', { min: 10, max: 90, onlyTens: true, questions: 10 }))) {
        if (q.kind !== 'collection') throw new Error(`kind ${q.kind}`)
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.target)
        expect(q.target % 10).toBe(0)
        expect(q.target).toBeGreaterThanOrEqual(10)
        expect(q.target).toBeLessThanOrEqual(90)
      }
    }
  })

  it('combien : 3 options uniques dont la bonne réponse, dans les bornes', () => {
    for (let i = 0; i < 50; i++) {
      for (const q of makeRound(mk('combien', { min: 11, max: 59, onlyTens: false, questions: 10 }))) {
        if (q.kind !== 'collection') throw new Error(`kind ${q.kind}`)
        expect(q.options).toHaveLength(3)
        expect(new Set(q.options).size).toBe(3)
        expect(q.options).toContain(q.target)
        expect(q.target).toBeGreaterThanOrEqual(11)
        expect(q.target).toBeLessThanOrEqual(59)
      }
    }
  })
})

describe('suite', () => {
  it('progression arithmétique, pas respecté, blanches jamais sur les deux premiers nombres', () => {
    for (let i = 0; i < 50; i++) {
      const qs = makeRound(mk('suite', { min: 10, max: 100, step: 10, length: 6, blanks: 2, direction: 'up', questions: 10 }))
      expect(qs).toHaveLength(10)
      for (const q of qs) {
        if (q.kind !== 'suite' || q.oral) throw new Error('pas une suite écrite')
        expect(q.seq).toHaveLength(6)
        for (let k = 1; k < q.seq.length; k++) expect(q.seq[k] - q.seq[k - 1]).toBe(q.step)
        expect(q.blanks.length).toBe(2)
        for (const b of q.blanks) expect(b).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('sens « down » : suite décroissante', () => {
    for (const q of makeRound(mk('suite', { min: 0, max: 100, step: 5, length: 5, blanks: 1, direction: 'down', questions: 5 }))) {
      if (q.kind !== 'suite') throw new Error(`kind ${q.kind}`)
      for (let k = 1; k < q.seq.length; k++) expect(q.seq[k] - q.seq[k - 1]).toBe(-5)
    }
  })

  it('oral : toutes les cases sont vides', () => {
    for (const q of makeRound(mk('suite', { min: 0, max: 100, step: 1, length: 6, blanks: 1, direction: 'up', oral: true, questions: 5 }))) {
      if (q.kind !== 'suite') throw new Error(`kind ${q.kind}`)
      expect(q.oral).toBe(true)
      expect(q.blanks).toHaveLength(q.seq.length)
    }
  })

  it('questions plafonnées à 20', () => {
    expect(makeRound(mk('suite', { min: 0, max: 1000, step: 1, length: 4, blanks: 1, direction: 'up', questions: 99 }))).toHaveLength(20)
  })
})

describe('table', () => {
  it('mode sommes : toutes les cases sont à compléter, les sommes sont exactes', () => {
    for (let i = 0; i < 20; i++) {
      for (const q of makeRound(mk('table', { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }))) {
        if (q.kind !== 'table') throw new Error(`kind ${q.kind}`)
        expect(q.blanks).toHaveLength(16)
        expect(new Set(q.rows).size).toBe(4)
        expect(new Set(q.cols).size).toBe(4)
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          expect(cellValue(q, r, c)).toBe(q.rows[r] + q.cols[c])
        }
      }
    }
  })

  it('mode mixte : des en-têtes à retrouver, sommes toujours cohérentes', () => {
    let sawHeader = false
    for (let i = 0; i < 40; i++) {
      for (const q of makeRound(mk('table', { min: 2, max: 9, size: 4, mode: 'mixte', questions: 2 }))) {
        if (q.kind !== 'table') throw new Error(`kind ${q.kind}`)
        for (const key of q.blanks) if (key.includes('-1')) sawHeader = true
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          expect(cellValue(q, r, c)).toBe(q.rows[r] + q.cols[c])
        }
      }
    }
    expect(sawHeader).toBe(true)
  })
})

describe('calcul', () => {
  it('l’équation est toujours vraie et calcAnswer renvoie la case vide', () => {
    const config = { op: 'mix' as const, steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], digits: 2 as const, find: 'mix' as const, questions: 10 }
    for (let i = 0; i < 200; i++) {
      const q = calcQuestion(config)
      expect(q.c).toBe(q.op === '+' ? q.a + q.b : q.a - q.b)
      expect(q.c).toBeGreaterThanOrEqual(0)
      expect(calcAnswer(q)).toBe(q[q.blank])
      expect(q.a).toBeGreaterThanOrEqual(10)
      expect(q.a).toBeLessThanOrEqual(99)
    }
  })

  it('steps respectés pour le nombre ajouté / enlevé', () => {
    for (let i = 0; i < 100; i++) {
      const q = calcQuestion({ op: '+', steps: [2, 5], digits: 2, find: 'resultat', questions: 10 })
      expect([2, 5]).toContain(q.b)
    }
  })

  it('astuces : une aide est toujours présente', () => {
    for (let i = 0; i < 50; i++) {
      expect(calcQuestion({ op: '+', steps: [1], digits: 2, find: 'resultat', astuces: true, questions: 10 }).tip).toBeTruthy()
    }
  })
})

describe('son on/om', () => {
  it('toute la banque contient le son et sans doublon', () => {
    expect(new Set(SON_BANK).size).toBe(SON_BANK.length)
    for (const w of SON_BANK) expect(hasSon(w)).toBe(true)
  })

  it('la règle m/b/p → om', () => {
    expect(ruleSays('m')).toBe('om')
    expect(ruleSays('b')).toBe('om')
    expect(ruleSays('p')).toBe('om')
    expect(ruleSays('t')).toBe('on')
    expect(ruleSays(null)).toBe('on')
  })

  it('mots pièges détectés', () => {
    expect(isTrap('bonbon')).toBe(true)
    expect(isTrap('prénom')).toBe(true)
    expect(isTrap('ballon')).toBe(false)
    expect(isTrap('tomber')).toBe(false)
    expect(hasSon('chat')).toBe(false)
  })

  it('une partie ne contient que des mots avec le son', () => {
    const qs = makeRound(mk('son'))
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      if (q.kind !== 'son') throw new Error(`kind ${q.kind}`)
      expect(hasSon(q.word)).toBe(true)
    }
  })
})

describe('autres jeux', () => {
  it('paquets : la cible est dans les bornes', () => {
    for (const q of makeRound(mk('paquets', { min: 11, max: 49, extra: true, questions: 5 }))) {
      if (q.kind !== 'paquets') throw new Error(`kind ${q.kind}`)
      expect(q.target).toBeGreaterThanOrEqual(11)
      expect(q.target).toBeLessThanOrEqual(49)
    }
  })

  it('noeuds : réponse au format colonne+ligne, compétence choisie dans la config', () => {
    for (const q of makeRound(mk('noeuds', { size: 5, skills: ['lire', 'placer'], questions: 8 }))) {
      if (q.kind !== 'noeuds') throw new Error(`kind ${q.kind}`)
      expect(nodeName(q.answer)).toMatch(/^[A-Z][1-9]$/)
      expect(['lire', 'placer']).toContain(q.skill)
    }
  })

  it('chateaux : les tours totalisent le bon nombre de cubes', () => {
    for (const q of makeRound(mk('chateaux', { towers: 2, maxTotal: 20, questions: 5 }))) {
      if (q.kind !== 'chateaux') throw new Error(`kind ${q.kind}`)
      expect(q.answer).toHaveLength(2)
      expect(q.answer.reduce((a, b) => a + b, 0)).toBe(q.total)
    }
  })

  it('mystere : 4 critères (couleur, tours, porte, drapeau)', () => {
    for (const q of makeRound(mk('mystere'))) {
      if (q.kind !== 'mystere') throw new Error(`kind ${q.kind}`)
      expect(q.secret).toHaveLength(4)
      for (const v of q.secret) {
        expect(Number.isInteger(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(2)
      }
    }
  })

  it('capacite : deux récipients différents', () => {
    for (const q of makeRound(mk('capacite'))) {
      if (q.kind !== 'capacite') throw new Error(`kind ${q.kind}`)
      expect(q.a.name).not.toBe(q.b.name)
    }
  })

  it('alphabet : compétence parmi celles choisies', () => {
    for (const q of makeRound(mk('alphabet', { skills: ['suite', 'voyelles'], words: 3, capitals: false, questions: 12 }))) {
      if (q.kind !== 'alpha') throw new Error(`kind ${q.kind}`)
      expect(['suite', 'voyelles']).toContain(q.skill)
    }
  })
})

describe('words (nombres en lettres, romand)', () => {
  it('valeurs connues', () => {
    expect(words(0)).toBe('zéro')
    expect(words(16)).toBe('seize')
    expect(words(21)).toBe('vingt-et-un')
    expect(words(34)).toBe('trente-quatre')
    expect(words(80)).toBe('huitante')
    expect(words(100)).toBe('cent')
    expect(words(172)).toBe('cent-septante-deux')
  })
})
