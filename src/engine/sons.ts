// Le son [on] : on / om. Règle : devant m, b, p on écrit « om ».

const VOWELS = 'aeiouyéèêëàâîïôûüœ'

export type SonPart = { text: string } | { blank: 'on' | 'om'; next: string | null }

/** Découpe un mot en morceaux, avec un trou pour chaque son [on] écrit « on » ou « om ». */
export function parseSon(word: string): SonPart[] {
  const w = word.toLowerCase().trim()
  const parts: SonPart[] = []
  let buf = ''
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1], after = w[i + 2]
    const nasal = c === 'o' && (n === 'n' || n === 'm') &&
      (after === undefined || (!VOWELS.includes(after) && after !== 'n' && after !== 'm' && after !== 'h'))
    if (nasal) {
      if (buf) parts.push({ text: buf })
      buf = ''
      parts.push({ blank: n === 'n' ? 'on' : 'om', next: after ?? null })
      i++
    } else buf += c
  }
  if (buf) parts.push({ text: buf })
  return parts
}

export const hasSon = (w: string) => parseSon(w).some(p => 'blank' in p)

/** Ce que la règle prédit pour ce trou. */
export const ruleSays = (next: string | null): 'on' | 'om' => (next && 'mbp'.includes(next) ? 'om' : 'on')

/** Un mot piège = au moins un trou qui ne suit pas la règle (bonbon, nom, prénom…). */
export function isTrap(word: string) {
  return parseSon(word).some(p => 'blank' in p && p.blank !== ruleSays(p.next))
}

/** Explication d'un trou, pour le message après la réponse. */
export function reason(p: { blank: 'on' | 'om'; next: string | null }, word: string): string {
  if (p.blank !== ruleSays(p.next)) {
    return p.blank === 'on'
      ? `Mot piège : « ${word} » s'écrit avec on, même devant ${p.next}.`
      : `Mot piège : « ${word} » se termine par om.`
  }
  if (p.blank === 'om') return `om, car il y a un ${p.next} juste après.`
  return p.next ? `on, car après il y a un ${p.next} (pas de m, b, p).` : 'on, à la fin du mot.'
}

export const SON_BANK = [
  // on
  'ballon', 'mouton', 'bonjour', 'maison', 'pont', 'rond', 'poisson', 'garçon', 'cochon', 'melon', 'crayon', 'oncle',
  'onze', 'montagne', 'savon', 'bouton', 'dragon', 'citron', 'long', 'blond', 'lion', 'avion', 'monde', 'conte',
  // om
  'ombre', 'tomber', 'pompon', 'nombre', 'pompier', 'trompette', 'bombe', 'colombe', 'concombre', 'sombre', 'tombe',
  'pompe', 'combien', 'ombrelle', 'compote',
  // pièges
  'bonbon', 'nom', 'prénom', 'surnom',
]

export const SON_FOCUS_DEFAULT = ['ombre', 'tomber', 'prénom', 'nom', 'ballon', 'pompon', 'bonbon']
