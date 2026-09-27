// Types partagés entre le moteur, la base et les écrans.

export type ExerciseType = 'entoure' | 'combien' | 'suite' | 'table'

/** Matières affichées sur l'accueil. La matière d'un exercice découle de son type. */
export type Subject = 'maths' | 'francais'

export const SUBJECTS: { id: Subject; label: string; tagline: string }[] = [
  { id: 'maths', label: 'Maths', tagline: 'Nombres et opérations' },
  { id: 'francais', label: 'Français', tagline: 'Lire et écrire' },
]

export const TYPE_SUBJECT: Record<ExerciseType, Subject> = {
  entoure: 'maths',
  combien: 'maths',
  suite: 'maths',
  table: 'maths',
}

/** "Entoure la collection de N balles" et "Combien de balles ?" */
export interface CollectionConfig {
  min: number
  max: number
  /** true = seulement des dizaines entières (10, 20, 30…) */
  onlyTens: boolean
  questions: number
}

/** "Complète la suite" : 30, 40, __, 60 */
export interface SuiteConfig {
  min: number
  max: number
  step: number
  length: number
  blanks: number
  direction: 'up' | 'down' | 'both'
  questions: number
}

/** "Les nombres manquants" : tableau d'addition à compléter. */
export interface TableConfig {
  /** plus petit et plus grand nombre dans les en-têtes */
  min: number
  max: number
  /** 3 × 3 ou 4 × 4 */
  size: number
  /** 'sommes' = en-têtes donnés, toutes les sommes à trouver ;
   *  'mixte' = quelques sommes données, des en-têtes à retrouver */
  mode: 'sommes' | 'mixte'
  /** nombre de tableaux par partie */
  questions: number
}

export type ExerciseConfig = CollectionConfig | SuiteConfig | TableConfig

export interface Exercise {
  id: string
  type: ExerciseType
  title: string
  config: ExerciseConfig
  active: boolean
  position: number
  updated_at?: string
}

export interface Child {
  id: string
  name: string
}

export interface Attempt {
  id: string
  child_id: string
  exercise_id: string | null
  exercise_type: ExerciseType
  prompt: Record<string, unknown>
  expected: string
  given: string
  correct: boolean
  first_try: boolean
  created_at: string
}

export const TYPE_LABEL: Record<ExerciseType, string> = {
  entoure: 'Entoure',
  combien: 'Combien ?',
  suite: 'Complète la suite',
  table: "Tableau d'addition",
}

export const TYPE_HELP: Record<ExerciseType, string> = {
  entoure: "L'enfant dessine un rond autour de la collection qui a le bon nombre de balles.",
  combien: "L'enfant compte une collection (paquets de 10 et balles seules) et choisit le bon nombre.",
  suite: "L'enfant complète les cases vides d'une suite de nombres avec un clavier.",
  table: "L'enfant complète les cases vides d'un tableau d'addition. En mode mixte, il retrouve aussi des nombres des en-têtes à partir d'une somme.",
}

export function defaultConfig(type: ExerciseType): ExerciseConfig {
  if (type === 'suite') return { min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'up', questions: 10 }
  if (type === 'table') return { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }
  return { min: 10, max: 90, onlyTens: true, questions: 10 }
}

export const SEED_EXERCISES: Omit<Exercise, 'id'>[] = [
  { type: 'entoure', title: 'Les balles — dizaines', config: { min: 10, max: 90, onlyTens: true, questions: 10 }, active: true, position: 0 },
  { type: 'combien', title: 'Combien de balles ?', config: { min: 11, max: 59, onlyTens: false, questions: 10 }, active: true, position: 1 },
  { type: 'suite', title: 'De 10 en 10', config: { min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'up', questions: 10 }, active: true, position: 2 },
  { type: 'table', title: 'Les nombres manquants', config: { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }, active: true, position: 3 },
  { type: 'table', title: 'Les nombres manquants — défi', config: { min: 2, max: 9, size: 4, mode: 'mixte', questions: 2 }, active: true, position: 4 },
]
