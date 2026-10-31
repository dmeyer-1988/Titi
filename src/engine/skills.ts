// Le chemin des jeux : compétences ordonnées, une par nœud de la carte.
// Chaque compétence réutilise un générateur existant (registry.ts) avec des
// réglages adaptés. L'ordre du tableau EST l'ordre du chemin (le prérequis
// d'un nœud est le nœud précédent).

import type { ExerciseOf, ExerciseType, Subject } from './types'

export interface SkillDef<K extends ExerciseType> {
  id: string
  subject: Subject
  /** année HarmoS visée (1P–8P) */
  level: number
  /** nom du nœud affiché sur la carte */
  label: string
  /** l'exercice qui entraîne la compétence (joué tel quel par le Runner) */
  exercise: ExerciseOf<K>
}

/** Compétence dont le type d'exercice et la config correspondent. */
export type Skill = { [K in ExerciseType]: SkillDef<K> }[ExerciseType]

export const SKILLS: Skill[] = [
  // ---------- Maths (4P) ----------
  { id: 'maths.compter.1', subject: 'maths', level: 4, label: 'Compter de 1 en 1',
    exercise: { id: 'skill:maths.compter.1', type: 'suite', title: 'Compter de 1 en 1', config: { min: 0, max: 100, step: 1, length: 6, blanks: 1, direction: 'both', questions: 8 }, active: true, position: 0 } },
  { id: 'maths.compter.10', subject: 'maths', level: 4, label: 'Compter de 10 en 10',
    exercise: { id: 'skill:maths.compter.10', type: 'suite', title: 'Compter de 10 en 10', config: { min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'both', questions: 8 }, active: true, position: 0 } },
  { id: 'maths.dizaines', subject: 'maths', level: 4, label: 'Dizaines et unités',
    exercise: { id: 'skill:maths.dizaines', type: 'combien', title: 'Dizaines et unités', config: { min: 11, max: 59, onlyTens: false, questions: 10 }, active: true, position: 0 } },
  { id: 'maths.entoure', subject: 'maths', level: 4, label: 'Entourer une collection',
    exercise: { id: 'skill:maths.entoure', type: 'entoure', title: 'Entoure la collection', config: { min: 11, max: 59, onlyTens: false, questions: 8 }, active: true, position: 0 } },
  { id: 'maths.paquets', subject: 'maths', level: 4, label: 'Faire des paquets de 10',
    exercise: { id: 'skill:maths.paquets', type: 'paquets', title: 'Paquets de 10', config: { min: 11, max: 49, extra: true, questions: 5 }, active: true, position: 0 } },
  { id: 'maths.suite.2', subject: 'maths', level: 4, label: 'Compter de 2 en 2',
    exercise: { id: 'skill:maths.suite.2', type: 'suite', title: 'Compter de 2 en 2', config: { min: 0, max: 60, step: 2, length: 6, blanks: 1, direction: 'up', questions: 8 }, active: true, position: 0 } },
  { id: 'maths.suite.5', subject: 'maths', level: 4, label: 'Compter de 5 en 5',
    exercise: { id: 'skill:maths.suite.5', type: 'suite', title: 'Compter de 5 en 5', config: { min: 0, max: 100, step: 5, length: 6, blanks: 1, direction: 'both', questions: 8 }, active: true, position: 0 } },
  { id: 'maths.additions', subject: 'maths', level: 4, label: 'Additions +0 à +10',
    exercise: { id: 'skill:maths.additions', type: 'calcul', title: 'Additions', config: { op: '+', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], digits: 2, find: 'resultat', questions: 10 }, active: true, position: 0 } },
  { id: 'maths.soustractions', subject: 'maths', level: 4, label: 'Soustractions −0 à −10',
    exercise: { id: 'skill:maths.soustractions', type: 'calcul', title: 'Soustractions', config: { op: '-', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], digits: 2, find: 'resultat', questions: 10 }, active: true, position: 0 } },
  { id: 'maths.manquant', subject: 'maths', level: 4, label: 'Le nombre manquant',
    exercise: { id: 'skill:maths.manquant', type: 'calcul', title: 'Le nombre manquant', config: { op: 'mix', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], digits: 2, find: 'manquant', questions: 10 }, active: true, position: 0 } },
  { id: 'maths.astuces', subject: 'maths', level: 4, label: 'Calculer efficacement',
    exercise: { id: 'skill:maths.astuces', type: 'calcul', title: 'Calculer efficacement', config: { op: '+', steps: [0, 1, 2], digits: 2, find: 'resultat', astuces: true, questions: 10 }, active: true, position: 0 } },
  { id: 'maths.noeuds.lire', subject: 'maths', level: 4, label: 'Lire les nœuds',
    exercise: { id: 'skill:maths.noeuds.lire', type: 'noeuds', title: 'Lire les nœuds', config: { size: 5, skills: ['lire'], questions: 8 }, active: true, position: 0 } },
  { id: 'maths.noeuds.placer', subject: 'maths', level: 4, label: 'Placer sur les nœuds',
    exercise: { id: 'skill:maths.noeuds.placer', type: 'noeuds', title: 'Placer sur les nœuds', config: { size: 5, skills: ['placer'], questions: 8 }, active: true, position: 0 } },
  { id: 'maths.noeuds.bouger', subject: 'maths', level: 4, label: 'Se déplacer sur les nœuds',
    exercise: { id: 'skill:maths.noeuds.bouger', type: 'noeuds', title: 'Se déplacer sur les nœuds', config: { size: 5, skills: ['bouger'], questions: 8 }, active: true, position: 0 } },
  { id: 'maths.tables', subject: 'maths', level: 4, label: 'Tableaux d’addition',
    exercise: { id: 'skill:maths.tables', type: 'table', title: 'Tableaux d’addition', config: { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }, active: true, position: 0 } },
  { id: 'maths.tables.défi', subject: 'maths', level: 4, label: 'Tableaux défi',
    exercise: { id: 'skill:maths.tables.défi', type: 'table', title: 'Tableaux défi', config: { min: 2, max: 9, size: 4, mode: 'mixte', questions: 2 }, active: true, position: 0 } },
  { id: 'maths.capacite', subject: 'maths', level: 4, label: 'Qui contient le plus ?',
    exercise: { id: 'skill:maths.capacite', type: 'capacite', title: 'Qui contient le plus ?', config: { compare: 'mix', questions: 6 }, active: true, position: 0 } },
  { id: 'maths.chateaux', subject: 'maths', level: 4, label: 'Ajustements (tours de cubes)',
    exercise: { id: 'skill:maths.chateaux', type: 'chateaux', title: 'Tours de cubes', config: { towers: 2, maxTotal: 20, questions: 5 }, active: true, position: 0 } },

  // ---------- Français (4P) ----------
  { id: 'fr.alphabet.suite', subject: 'francais', level: 4, label: 'La lettre qui manque',
    exercise: { id: 'skill:fr.alphabet.suite', type: 'alphabet', title: 'La lettre qui manque', config: { skills: ['suite'], words: 3, capitals: false, questions: 10 }, active: true, position: 0 } },
  { id: 'fr.alphabet.position', subject: 'francais', level: 4, label: 'Avant, après, entre',
    exercise: { id: 'skill:fr.alphabet.position', type: 'alphabet', title: 'Avant, après, entre', config: { skills: ['position'], words: 3, capitals: false, questions: 10 }, active: true, position: 0 } },
  { id: 'fr.voyelles', subject: 'francais', level: 4, label: 'Les voyelles',
    exercise: { id: 'skill:fr.voyelles', type: 'alphabet', title: 'Les voyelles', config: { skills: ['voyelles'], words: 3, capitals: false, questions: 8 }, active: true, position: 0 } },
  { id: 'fr.ranger', subject: 'francais', level: 4, label: 'Ranger les mots',
    exercise: { id: 'skill:fr.ranger', type: 'alphabet', title: 'Ranger les mots', config: { skills: ['ranger'], words: 3, capitals: false, questions: 8 }, active: true, position: 0 } },
  { id: 'fr.on.regle', subject: 'francais', level: 4, label: 'Le son on / om',
    exercise: { id: 'skill:fr.on.regle', type: 'son', title: 'Le son on / om', config: { focus: ['ombre', 'tomber', 'ballon', 'pompon', 'pompier'], extra: true, showRule: true, questions: 12 }, active: true, position: 0 } },
  { id: 'fr.on.pieges', subject: 'francais', level: 4, label: 'Les mots pièges on / om',
    exercise: { id: 'skill:fr.on.pieges', type: 'son', title: 'Les mots pièges', config: { focus: ['bonbon', 'nom', 'prénom', 'surnom'], extra: false, showRule: false, questions: 8 }, active: true, position: 0 } },
]

/** Le chemin d'une matière pour une classe (l'ordre du tableau = l'ordre des nœuds). */
export function skillsFor(subject: Subject, level: number): Skill[] {
  return SKILLS.filter(s => s.subject === subject && s.level === level)
}
