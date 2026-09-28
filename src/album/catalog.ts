// Catalogue des vignettes de l'album. Les numéros suivent l'ordre de l'album (comme un Panini).

export type SectionId = 'animaux' | 'dinos' | 'foot'

export interface StickerDef {
  id: number
  section: SectionId
  name: string
  fact: string
  /** vignette brillante : plus rare */
  shiny?: boolean
  /** Animaux : emoji ; Dinosaures : clé de dessin ; Football : club + écusson ou maillot */
  art: string
  club?: ClubId
  kind?: 'ecusson' | 'maillot'
}

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'animaux', label: 'Animaux' },
  { id: 'dinos', label: 'Dinosaures' },
  { id: 'foot', label: 'Football' },
]

type ClubId = 'tonnerre' | 'etoile' | 'lions' | 'cimes' | 'comete' | 'foret' | 'dragons' | 'soleil'

/** Clubs imaginaires : couleurs, motif du maillot, symbole de l'écusson. */
export const CLUBS: Record<ClubId, { name: string; short: string; c1: string; c2: string; pattern: 'rayures' | 'moitie' | 'uni' | 'echarpe' | 'cerceaux'; symbol: string; num: number; fact: string }> = {
  tonnerre: { name: 'FC Tonnerre', short: 'FCT', c1: '#F5C518', c2: '#1F2328', pattern: 'rayures', symbol: '⚡', num: 9, fact: 'Ses supporters tapent des pieds comme le tonnerre.' },
  etoile: { name: 'Étoile Bleue', short: 'EB', c1: '#1D5FB8', c2: '#FFFFFF', pattern: 'moitie', symbol: '⭐', num: 10, fact: 'Un club qui joue la nuit, sous les étoiles.' },
  lions: { name: 'Lions Rouges', short: 'LR', c1: '#D6453A', c2: '#FFFFFF', pattern: 'uni', symbol: '🦁', num: 7, fact: 'Ses joueurs rugissent après chaque but.' },
  cimes: { name: 'Olympique des Cimes', short: 'OC', c1: '#FFFFFF', c2: '#2F8F55', pattern: 'echarpe', symbol: '🏔️', num: 5, fact: 'Son stade est tout en haut de la montagne.' },
  comete: { name: 'Racing Comète', short: 'RC', c1: '#6A3DB8', c2: '#F6C945', pattern: 'cerceaux', symbol: '☄️', num: 11, fact: "L'attaquant le plus rapide du championnat." },
  foret: { name: 'Sporting Forêt', short: 'SF', c1: '#2F6B3A', c2: '#A9D18E', pattern: 'rayures', symbol: '🌲', num: 4, fact: 'Ses joueurs s\'entraînent en courant entre les arbres.' },
  dragons: { name: 'Dragons FC', short: 'DFC', c1: '#1F2328', c2: '#E8672C', pattern: 'moitie', symbol: '🐉', num: 1, fact: 'Son gardien arrête les ballons comme un dragon.' },
  soleil: { name: 'Atlético Soleil', short: 'AS', c1: '#F28C28', c2: '#FFFFFF', pattern: 'cerceaux', symbol: '☀️', num: 8, fact: 'Le club qui ne joue que quand il fait beau.' },
}

const ANIMALS: [string, string, string, boolean?][] = [
  ['🦁', 'Lion', 'Le lion peut se reposer jusqu’à 20 heures par jour.', true],
  ['🐘', 'Éléphant', 'C’est le plus grand animal qui vit sur la terre ferme.'],
  ['🦒', 'Girafe', 'Sa langue peut mesurer presque 50 cm.'],
  ['🦓', 'Zèbre', 'Chaque zèbre a des rayures différentes.'],
  ['🐯', 'Tigre', 'C’est le plus grand de tous les félins.'],
  ['🦍', 'Gorille', 'C’est le plus grand des singes.'],
  ['🐼', 'Panda', 'Il passe presque toute la journée à manger du bambou.'],
  ['🐨', 'Koala', 'Il dort environ 20 heures par jour.'],
  ['🦘', 'Kangourou', 'Le bébé grandit dans la poche de sa maman.'],
  ['🐻‍❄️', 'Ours polaire', 'Sous sa fourrure blanche, sa peau est noire.', true],
  ['🐧', 'Manchot', 'Il ne vole pas, mais il nage très vite.'],
  ['🐬', 'Dauphin', 'Il respire de l’air, comme nous.'],
  ['🐳', 'Baleine', 'La baleine bleue est le plus grand animal du monde.', true],
  ['🦈', 'Requin', 'Il a plusieurs rangées de dents.'],
  ['🐙', 'Pieuvre', 'Elle a 8 bras et 3 cœurs.'],
  ['🐢', 'Tortue', 'Certaines tortues vivent plus de 100 ans.'],
  ['🐊', 'Crocodile', 'Il peut rester très longtemps sous l’eau sans respirer.'],
  ['🦉', 'Hibou', 'Il peut tourner la tête presque jusque derrière lui.'],
  ['🦜', 'Perroquet', 'Certains perroquets savent imiter la voix humaine.'],
  ['🦊', 'Renard', 'Il entend une souris qui bouge sous la neige.'],
  ['🐺', 'Loup', 'Les loups vivent en groupe : une meute.'],
  ['🦋', 'Papillon', 'Il goûte avec ses pattes.'],
  ['🐝', 'Abeille', 'Elle danse pour montrer où sont les fleurs.'],
  ['🐄', 'Vache', 'Son estomac a 4 parties.'],
]

const DINOS: [string, string, string, boolean?][] = [
  ['trex', 'Tyrannosaure', 'Ses dents étaient aussi grandes que des bananes.', true],
  ['tricera', 'Tricératops', 'Il avait 3 cornes sur la tête.'],
  ['stego', 'Stégosaure', 'Il avait de grandes plaques sur le dos.'],
  ['diplo', 'Diplodocus', 'Il mesurait plus de 25 mètres de long.'],
  ['brachio', 'Brachiosaure', 'Il était aussi haut qu’un immeuble de 4 étages.'],
  ['raptor', 'Vélociraptor', 'Il était à peu près grand comme un gros dindon.'],
  ['ptera', 'Ptéranodon', 'Ce n’était pas un dinosaure, mais un reptile volant.'],
  ['ankylo', 'Ankylosaure', 'Sa queue se terminait par une grosse massue.'],
  ['spino', 'Spinosaure', 'Il avait une grande voile sur le dos et mangeait des poissons.', true],
  ['para', 'Parasaurolophus', 'Sa longue crête lui servait peut-être à faire du bruit.'],
  ['pachy', 'Pachycéphalosaure', 'Le haut de son crâne était très épais, comme un casque.'],
  ['iguano', 'Iguanodon', 'Il avait une pointe à la place du pouce.'],
]

let n = 0
export const STICKERS: StickerDef[] = [
  ...ANIMALS.map(([art, name, fact, shiny]) => ({ id: ++n, section: 'animaux' as const, art, name, fact, shiny })),
  ...DINOS.map(([art, name, fact, shiny]) => ({ id: ++n, section: 'dinos' as const, art, name, fact, shiny })),
  ...(Object.keys(CLUBS) as ClubId[]).flatMap(club => [
    { id: ++n, section: 'foot' as const, art: club, club, kind: 'ecusson' as const, name: CLUBS[club].name, fact: CLUBS[club].fact, shiny: true },
    { id: ++n, section: 'foot' as const, art: club, club, kind: 'maillot' as const, name: `Maillot ${CLUBS[club].name}`, fact: `Le numéro ${CLUBS[club].num} de l'équipe.` },
  ]),
]

export const STICKER = new Map(STICKERS.map(s => [s.id, s]))
export const PACK_SIZE = 5

/** Tire les vignettes d'une pochette : jamais deux fois la même, les brillantes sont 3 fois plus rares. */
export function drawPack(): number[] {
  const out: number[] = []
  while (out.length < PACK_SIZE) {
    const pool = STICKERS.filter(s => !out.includes(s.id))
    const total = pool.reduce((a, s) => a + (s.shiny ? 1 : 3), 0)
    let r = Math.random() * total
    for (const s of pool) { r -= s.shiny ? 1 : 3; if (r <= 0) { out.push(s.id); break } }
  }
  return out
}
