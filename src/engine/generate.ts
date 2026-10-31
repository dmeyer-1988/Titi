// Types des questions produites par le moteur.
// Les générateurs et le dispatch par type d'exercice vivent dans registry.ts.

import type { MystereQuestion } from './mystere'
import type { NoeudsQuestion } from './noeuds'
import type { ChateauxQuestion } from './chateaux'
import type { CapaciteQuestion } from './capacite'
import type { PaquetsQuestion } from './paquets'
import type { CalcQuestion } from './calcul'
import type { AlphaQuestion } from './alphabet'

export interface CollectionQuestion {
  kind: 'collection'
  target: number
  options: number[]
}
export interface SuiteQuestion {
  kind: 'suite'
  seq: number[]
  blanks: number[]
  step: number
  /** consigne seulement à l'oral : toutes les cases sont vides */
  oral?: boolean
}
/**
 * Tableau d'addition. Les cases sont repérées par "r,c" :
 * r = -1 pour la ligne d'en-tête, c = -1 pour la colonne d'en-tête.
 */
export interface TableQuestion {
  kind: 'table'
  rows: number[]
  cols: number[]
  /** cases à compléter par l'enfant */
  blanks: string[]
}
export interface SonQuestion {
  kind: 'son'
  word: string
}
export type Question = MystereQuestion | NoeudsQuestion | ChateauxQuestion | CapaciteQuestion | CollectionQuestion | SuiteQuestion | TableQuestion | AlphaQuestion | SonQuestion | CalcQuestion | PaquetsQuestion

export { makeRound, cellKey, cellValue, shuffle } from './registry'
