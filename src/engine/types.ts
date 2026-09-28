// Types partagés entre le moteur, la base et les écrans.

export type ExerciseType = 'entoure' | 'combien' | 'suite' | 'table' | 'alphabet' | 'son'

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
  alphabet: 'francais',
  son: 'francais',
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

/** Alphabet : ordre des lettres, voyelles, ranger des mots. */
export type AlphaSkill = 'suite' | 'position' | 'voyelles' | 'ranger'
export interface AlphabetConfig {
  skills: AlphaSkill[]
  /** nombre de mots à ranger (3 ou 4) */
  words: number
  capitals: boolean
  questions: number
}

export const SKILL_LABEL: Record<AlphaSkill, string> = {
  suite: 'La lettre qui manque',
  position: 'Avant, après, entre',
  voyelles: 'Les voyelles',
  ranger: 'Ranger des mots',
}

/** Le son [on] : choisir « on » ou « om ». */
export interface SonConfig {
  /** mots sur lesquels insister : présents à chaque partie */
  focus: string[]
  /** compléter avec d'autres mots de la banque */
  extra: boolean
  /** afficher la règle au début de la partie */
  showRule: boolean
  questions: number
}

export type ExerciseConfig = CollectionConfig | SuiteConfig | TableConfig | AlphabetConfig | SonConfig

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
  alphabet: "L'alphabet",
  son: 'Le son on / om',
}

export const TYPE_HELP: Record<ExerciseType, string> = {
  entoure: "L'enfant dessine un rond autour de la collection qui a le bon nombre de balles.",
  combien: "L'enfant compte une collection (paquets de 10 et balles seules) et choisit le bon nombre.",
  suite: "L'enfant complète les cases vides d'une suite de nombres avec un clavier.",
  table: "L'enfant complète les cases vides d'un tableau d'addition. En mode mixte, il retrouve aussi des nombres des en-têtes à partir d'une somme.",
  alphabet: "Lettre qui manque dans l'alphabet, lettre avant / après / entre, trouver les voyelles, ranger des mots selon l'ordre alphabétique (1re lettre). Les questions sont tirées au hasard parmi les parties choisies.",
  son: "La règle (m devant m, b, p) s'affiche au début, puis l'enfant choisit « on » ou « om » pour compléter chaque mot. Les mots à travailler reviennent à chaque partie ; les mots pièges (bonbon, nom, prénom…) sont repérés automatiquement.",
}

export function defaultConfig(type: ExerciseType): ExerciseConfig {
  if (type === 'suite') return { min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'up', questions: 10 }
  if (type === 'table') return { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }
  if (type === 'son') return { focus: ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon'], extra: true, showRule: true, questions: 12 }
  if (type === 'alphabet') return { skills: ['suite', 'position', 'voyelles', 'ranger'], words: 3, capitals: false, questions: 12 }
  return { min: 10, max: 90, onlyTens: true, questions: 10 }
}

export const ALPHABET_SEED: Omit<Exercise, 'id'>[] = [
  { type: 'alphabet', title: 'Entraînement au test', config: { skills: ['suite', 'position', 'voyelles', 'ranger'], words: 3, capitals: false, questions: 12 }, active: true, position: 0 },
  { type: 'alphabet', title: "L'ordre des lettres", config: { skills: ['suite', 'position'], words: 3, capitals: false, questions: 10 }, active: true, position: 1 },
  { type: 'alphabet', title: 'Les voyelles', config: { skills: ['voyelles'], words: 3, capitals: false, questions: 6 }, active: true, position: 2 },
  { type: 'alphabet', title: 'Ranger les mots', config: { skills: ['ranger'], words: 3, capitals: false, questions: 8 }, active: true, position: 3 },
]

export const SON_SEED: Omit<Exercise, 'id'>[] = [
  { type: 'son', title: 'Le son on / om', config: { focus: ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon'], extra: true, showRule: true, questions: 12 }, active: true, position: 0 },
  { type: 'son', title: 'Mes 7 mots on / om', config: { focus: ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon'], extra: false, showRule: false, questions: 7 }, active: true, position: 1 },
]

export const SEED_EXERCISES: Omit<Exercise, 'id'>[] = [
  { type: 'entoure', title: 'Les balles — dizaines', config: { min: 10, max: 90, onlyTens: true, questions: 10 }, active: true, position: 0 },
  { type: 'combien', title: 'Combien de balles ?', config: { min: 11, max: 59, onlyTens: false, questions: 10 }, active: true, position: 1 },
  { type: 'suite', title: 'De 10 en 10', config: { min: 10, max: 100, step: 10, length: 6, blanks: 1, direction: 'up', questions: 10 }, active: true, position: 2 },
  { type: 'table', title: 'Les nombres manquants', config: { min: 2, max: 9, size: 4, mode: 'sommes', questions: 2 }, active: true, position: 3 },
  { type: 'table', title: 'Les nombres manquants — défi', config: { min: 2, max: 9, size: 4, mode: 'mixte', questions: 2 }, active: true, position: 4 },
  ...ALPHABET_SEED.map((e, i) => ({ ...e, position: 5 + i })),
  ...SON_SEED.map((e, i) => ({ ...e, position: 9 + i })),
]
