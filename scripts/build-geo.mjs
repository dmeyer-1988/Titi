// Génère les données de géographie de l'app (à relancer seulement pour changer les cartes) :
//   node scripts/build-geo.mjs
// - src/geo/continents.json : la carte du monde, un tracé SVG par continent
// - src/geo/cantons.json    : la carte de la Suisse, un tracé par canton + les lacs
// - src/geo/countries.json  : les pays (nom français, continent, drapeau)
// Sources : Natural Earth via world-atlas (domaine public), OFS/swisstopo via swiss-maps,
// countries-list (MIT), i18n-iso-countries (MIT).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as topojson from 'topojson-client'
import { presimplify, simplify } from 'topojson-simplify'
import { geoMercator, geoPath, geoArea } from 'd3-geo'
import { geoMiller } from 'd3-geo-projection'

const require = createRequire(import.meta.url)
const iso = require('i18n-iso-countries')
const cl = require('countries-list')
const out = new URL('../src/geo/', import.meta.url)
mkdirSync(out, { recursive: true })

// Arrondit les nombres d'un tracé SVG pour alléger le fichier.
const round = d => d.replace(/-?\d+\.\d+/g, n => String(Math.round(Number(n) * 10) / 10))

// ---------- Pays ----------
const world = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))
const NOT_COUNTRY = new Set(['EH', 'FK', 'GL', 'TF', 'PR', 'NC', 'PS', 'TW', 'AQ'])
const SMALL = ['AD', 'LI', 'MC', 'SM', 'VA', 'MT', 'SG']
const NAMES = {
  US: 'États-Unis', GB: 'Royaume-Uni', TZ: 'Tanzanie', CD: 'RD Congo', CG: 'Congo', DO: 'République dominicaine',
  CF: 'Centrafrique', CZ: 'Tchéquie', SZ: 'Eswatini', CI: "Côte d'Ivoire", AE: 'Émirats arabes unis', SA: 'Arabie saoudite',
  BN: 'Brunei', VA: 'Vatican', MK: 'Macédoine du Nord', NG: 'Nigeria', RU: 'Russie', KR: 'Corée du Sud', KP: 'Corée du Nord',
}
const EASY = ['CH', 'FR', 'DE', 'IT', 'AT', 'LI', 'ES', 'PT', 'GB', 'IE', 'BE', 'NL', 'LU', 'DK', 'SE', 'NO', 'FI', 'PL', 'GR', 'HR',
  'TR', 'US', 'CA', 'MX', 'BR', 'AR', 'JP', 'CN', 'KR', 'IN', 'AU', 'NZ', 'EG', 'MA', 'ZA', 'RU', 'UA', 'IS', 'SN', 'CM', 'CO', 'TH']
const codes = new Set(world.objects.countries.geometries.map(g => g.id && iso.numericToAlpha2(g.id)).filter(c => c && !NOT_COUNTRY.has(c)))
SMALL.forEach(c => codes.add(c))
const countries = [...codes].map(code => ({
  code,
  name: NAMES[code] ?? iso.getName(code, 'fr'),
  cont: cl.countries[code].continent,
  flag: cl.getEmojiFlag(code),
  easy: EASY.includes(code) || undefined,
})).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
writeFileSync(new URL('countries.json', out), JSON.stringify(countries))
console.log('pays :', countries.length, '— faciles :', countries.filter(c => c.easy).length)

// ---------- Continents ----------
const W = 1000
const CONT_OF = id => {
  if (!id) return null
  const a2 = iso.numericToAlpha2(id)
  return a2 ? cl.countries[a2]?.continent ?? null : null
}
const geoms0 = world.objects.countries.geometries.map(g => ({
  ...g,
  cont: CONT_OF(g.id) ?? ({ Kosovo: 'EU', Somaliland: 'AF', 'N. Cyprus': 'AS' })[g.properties.name] ?? null,
}))
// La Guyane fait partie de la France, mais elle est en Amérique du Sud : on sépare les morceaux lointains.
const geoms = geoms0.flatMap(g => {
  if (g.id !== '250' || g.type !== 'MultiPolygon') return [g]
  return g.arcs.map(arcs => {
    const poly = { type: 'Polygon', arcs, id: g.id, properties: g.properties }
    const [lon] = geoPath().centroid(topojson.feature(world, poly))
    return { ...poly, cont: lon < -30 ? 'SA' : 'EU' }
  })
})
const proj = geoMiller().fitWidth(W, { type: 'Sphere' })
// On coupe le bas de l'Antarctique et le haut de l'Arctique pour garder une carte compacte.
const yTop = proj([0, 84])[1], yBot = proj([0, -74])[1]
proj.clipExtent([[0, yTop], [W, yBot]])
const H = Math.round(yBot - yTop)
proj.translate([proj.translate()[0], proj.translate()[1] - yTop]).clipExtent([[0, 0], [W, H]])
const path = geoPath(proj)
const xUral = proj([60, 50])[0] // la Russie est coupée à l'Oural (60° E)
const RU = geoms.find(g => g.id === '643')

const CONT = [
  { id: 'EU', name: 'Europe', de: "l'Europe" },
  { id: 'AS', name: 'Asie', de: "l'Asie" },
  { id: 'AF', name: 'Afrique', de: "l'Afrique" },
  { id: 'NA', name: 'Amérique du Nord', de: "l'Amérique du Nord" },
  { id: 'SA', name: 'Amérique du Sud', de: "l'Amérique du Sud" },
  { id: 'OC', name: 'Océanie', de: "l'Océanie" },
  { id: 'AN', name: 'Antarctique', de: "l'Antarctique" },
]
const continents = CONT.map(c => {
  const parts = geoms.filter(g => g.cont === c.id && g !== RU)
  const merged = topojson.merge(world, parts)
  let d = path(merged) ?? ''
  if (c.id === 'EU' || c.id === 'AS') {
    const ru = topojson.feature(world, RU)
    // l'Europe s'arrête à l'Oural ; la pointe de la Sibérie (de l'autre côté de 180°) reste en Asie
    const clips = c.id === 'EU' ? [[[proj([-30, 0])[0], 0], [xUral, H]]] : [[[xUral, 0], [W, H]], [[0, 0], [proj([-150, 0])[0], H]]]
    for (const clip of clips) {
      const p2 = geoMiller().scale(proj.scale()).translate(proj.translate()).clipExtent(clip)
      d += geoPath(p2)(ru) ?? ''
    }
  }
  // point pour l'étiquette : centre du plus grand morceau
  const polys = merged.coordinates.map(cs => ({ type: 'Polygon', coordinates: cs }))
  const biggest = polys.sort((a, b) => geoArea(b) - geoArea(a))[0]
  let [lx, ly] = path.centroid(biggest)
  if (c.id === 'EU') [lx, ly] = proj([15, 52])
  if (c.id === 'AS') [lx, ly] = proj([90, 45])
  if (c.id === 'AN') [lx, ly] = [W / 2, H - 14]
  return { ...c, d: round(d), label: [Math.round(lx), Math.round(ly)] }
})
writeFileSync(new URL('continents.json', out), JSON.stringify({ w: W, h: H, continents }))
console.log('continents :', W, '×', H, Math.round(JSON.stringify(continents).length / 1024), 'ko')

// ---------- Cantons ----------
const ch0 = JSON.parse(readFileSync(require.resolve('swiss-maps/2026/ch-combined.json'), 'utf8'))
const ch = simplify(presimplify(ch0), 4e-7)
const CANTONS = [
  [1, 'ZH', 'Zurich', 'de Zurich'], [2, 'BE', 'Berne', 'de Berne'], [3, 'LU', 'Lucerne', 'de Lucerne'], [4, 'UR', 'Uri', "d'Uri"],
  [5, 'SZ', 'Schwytz', 'de Schwytz'], [6, 'OW', 'Obwald', "d'Obwald"], [7, 'NW', 'Nidwald', 'de Nidwald'], [8, 'GL', 'Glaris', 'de Glaris'],
  [9, 'ZG', 'Zoug', 'de Zoug'], [10, 'FR', 'Fribourg', 'de Fribourg'], [11, 'SO', 'Soleure', 'de Soleure'], [12, 'BS', 'Bâle-Ville', 'de Bâle-Ville'],
  [13, 'BL', 'Bâle-Campagne', 'de Bâle-Campagne'], [14, 'SH', 'Schaffhouse', 'de Schaffhouse'], [15, 'AR', 'Appenzell Rhodes-Extérieures', "d'Appenzell Rhodes-Extérieures"],
  [16, 'AI', 'Appenzell Rhodes-Intérieures', "d'Appenzell Rhodes-Intérieures"], [17, 'SG', 'Saint-Gall', 'de Saint-Gall'], [18, 'GR', 'Grisons', 'des Grisons'],
  [19, 'AG', 'Argovie', "d'Argovie"], [20, 'TG', 'Thurgovie', 'de Thurgovie'], [21, 'TI', 'Tessin', 'du Tessin'], [22, 'VD', 'Vaud', 'de Vaud'],
  [23, 'VS', 'Valais', 'du Valais'], [24, 'NE', 'Neuchâtel', 'de Neuchâtel'], [25, 'GE', 'Genève', 'de Genève'], [26, 'JU', 'Jura', 'du Jura'],
]
const ROMANDS = ['GE', 'VD', 'VS', 'NE', 'JU', 'FR']
const cantonsFC = topojson.feature(ch, ch.objects.cantons)
const pc = geoMercator().fitWidth(W, cantonsFC)
const pathC = geoPath(pc)
const HC = Math.ceil(pathC.bounds(cantonsFC)[1][1])
const cantons = CANTONS.map(([id, code, name, de]) => {
  const f = cantonsFC.features.find(x => Number(x.id) === id)
  const [[x0, y0], [x1, y1]] = pathC.bounds(f)
  const [cx, cy] = pathC.centroid(f)
  return { code, name, de, romand: ROMANDS.includes(code) || undefined, d: round(pathC(f)), c: [Math.round(cx), Math.round(cy)], b: [x0, y0, x1, y1].map(Math.round), area: Math.round(pathC.area(f)) }
})
// Les lacs : seulement les grands, pour se repérer (Léman, Neuchâtel, Constance…).
const lakesFC = topojson.feature(ch, ch.objects.lakes)
const lakes = lakesFC.features.filter(f => pathC.area(f) > 120).map(f => round(pathC(f))).join('')
writeFileSync(new URL('cantons.json', out), JSON.stringify({ w: W, h: HC, lakes, cantons }))
console.log('cantons :', W, '×', HC, Math.round(JSON.stringify(cantons).length / 1024), 'ko')
