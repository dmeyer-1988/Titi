import type { AlphabetConfig, AlphaSkill } from './types'

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')
export const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y']

/** Nom des lettres pour la lecture à voix haute. */
export const LETTER_NAME: Record<string, string> = {
  a: 'a', b: 'bé', c: 'cé', d: 'dé', e: 'e', f: 'èf', g: 'gé', h: 'hache', i: 'i', j: 'ji', k: 'ka', l: 'èl', m: 'èm',
  n: 'èn', o: 'o', p: 'pé', q: 'ku', r: 'èr', s: 'èss', t: 'té', u: 'u', v: 'vé', w: 'double vé', x: 'iks', y: 'i grec', z: 'zèd',
}

/** Mots simples, sans accent sur la première lettre, au moins un par lettre. */
export const WORDS = [
  'arbre', 'avion', 'abeille', 'ballon', 'bateau', 'banane', 'chat', 'citron', 'cheval', 'dauphin', 'dragon', 'dent',
  'escargot', 'enfant', 'feuille', 'fleur', 'fraise', 'girafe', 'gâteau', 'gomme', 'hibou', 'hérisson', 'igloo', 'image',
  'jardin', 'jupe', 'jouet', 'koala', 'kiwi', 'lapin', 'loup', 'lune', 'maison', 'mouton', 'moto', 'nuage', 'nid', 'neige',
  'orange', 'ours', 'oiseau', 'pomme', 'poisson', 'papillon', 'quille', 'renard', 'racine', 'robot', 'soleil', 'sapin',
  'souris', 'tortue', 'tigre', 'train', 'usine', 'vélo', 'vache', 'volcan', 'wagon', 'xylophone', 'yaourt', 'yoyo', 'zèbre', 'zoo',
]

export type AlphaQuestion =
  | { kind: 'alpha'; skill: 'suite'; seq: string[]; blank: number; options: string[] }
  | { kind: 'alpha'; skill: 'position'; rel: 'avant' | 'apres' | 'entre'; a: string; b?: string; answer: string; options: string[] }
  | { kind: 'alpha'; skill: 'voyelles'; letters: string[] }
  | { kind: 'alpha'; skill: 'ranger'; words: string[] }

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 3 lettres pièges : les voisines de la bonne réponse, puis au hasard. */
function letterOptions(answer: string, exclude: string[] = []): string[] {
  const i = ALPHABET.indexOf(answer)
  const near = [i - 1, i + 1, i - 2, i + 2].filter(k => k >= 0 && k < 26).map(k => ALPHABET[k])
  const pool = shuffle(near.filter(l => l !== answer && !exclude.includes(l)))
  const picked = pool.slice(0, 3)
  while (picked.length < 3) {
    const l = ALPHABET[rnd(0, 25)]
    if (l !== answer && !picked.includes(l) && !exclude.includes(l)) picked.push(l)
  }
  return shuffle([answer, ...picked])
}

export function alphaQuestion(skill: AlphaSkill, c: AlphabetConfig): AlphaQuestion {
  if (skill === 'suite') {
    const len = 5
    const start = rnd(0, 26 - len)
    const seq = ALPHABET.slice(start, start + len)
    const blank = rnd(1, len - 1)
    return { kind: 'alpha', skill, seq, blank, options: letterOptions(seq[blank], seq.filter((_, i) => i !== blank)) }
  }
  if (skill === 'position') {
    const rel = (['avant', 'apres', 'entre'] as const)[rnd(0, 2)]
    if (rel === 'entre') {
      const i = rnd(1, 24)
      return { kind: 'alpha', skill, rel, a: ALPHABET[i - 1], b: ALPHABET[i + 1], answer: ALPHABET[i], options: letterOptions(ALPHABET[i], [ALPHABET[i - 1], ALPHABET[i + 1]]) }
    }
    const i = rel === 'avant' ? rnd(1, 25) : rnd(0, 24)
    const answer = ALPHABET[rel === 'avant' ? i - 1 : i + 1]
    return { kind: 'alpha', skill, rel, a: ALPHABET[i], answer, options: letterOptions(answer, [ALPHABET[i]]) }
  }
  if (skill === 'voyelles') {
    const nv = rnd(2, 4)
    const vowels = shuffle([...VOWELS]).slice(0, nv)
    const cons = shuffle(ALPHABET.filter(l => !VOWELS.includes(l))).slice(0, 8 - nv)
    return { kind: 'alpha', skill, letters: shuffle([...vowels, ...cons]) }
  }
  // ranger : des mots qui commencent tous par une lettre différente
  const n = Math.max(3, Math.min(5, c.words || 3))
  const byFirst = new Map<string, string[]>()
  for (const w of WORDS) byFirst.set(w[0], [...(byFirst.get(w[0]) || []), w])
  const firsts = shuffle([...byFirst.keys()]).slice(0, n)
  const words = firsts.map(f => { const l = byFirst.get(f)!; return l[rnd(0, l.length - 1)] })
  // jamais déjà dans l'ordre
  if (words.every((w, i) => i === 0 || words[i - 1][0] < w[0])) words.reverse()
  return { kind: 'alpha', skill, words }
}

export function alphaSkills(c: AlphabetConfig): AlphaSkill[] {
  const s = (c.skills || []).filter(Boolean)
  return s.length ? s : ['suite', 'position', 'voyelles', 'ranger']
}

export function alphaKey(q: AlphaQuestion): string {
  switch (q.skill) {
    case 'suite': return 'as' + q.seq.join('') + q.blank
    case 'position': return 'ap' + q.rel + q.a + (q.b || '')
    case 'voyelles': return 'av' + q.letters.join('')
    case 'ranger': return 'ar' + q.words.join(',')
  }
}
