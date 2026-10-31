// Télécharge les polices (Andika, Baloo 2) pour l'auto-hébergement : aucune
// requête vers Google Fonts au chargement (confidentialité, hors ligne).
// Subsets latin et latin-ext uniquement (le français, y compris « œ »).
// Usage : node scripts/fetch-fonts.mjs

import { createWriteStream, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { get } from 'node:https'

const URLS = 'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Baloo+2:wght@600;800&display=swap'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const OUT = new URL('../public/fonts/', import.meta.url)

const css = await new Promise((resolve, reject) => {
  get(URLS, { headers: { 'User-Agent': UA } }, res => {
    let body = ''
    res.on('data', c => { body += c })
    res.on('end', () => resolve(body))
  }).on('error', reject)
})

const blocks = [...css.matchAll(/\/\* ([a-z0-9-]+) \*\/\s*@font-face \{([\s\S]*?)\}/g)]
const kept = blocks.filter(([, subset]) => subset === 'latin' || subset === 'latin-ext')
if (kept.length < 4) throw new Error(`CSS inattendu : ${kept.length} blocs latin/latin-ext`)

await mkdir(OUT, { recursive: true })
let out = '/* Auto-hébergé — scripts/fetch-fonts.mjs. Ne pas éditer à la main. */\n'
for (const [, subset, body] of kept) {
  const fam = body.match(/font-family: '([^']+)'/)[1]
  const wgt = body.match(/font-weight: (\d+)/)[1]
  const url = body.match(/src: url\(([^)]+)\)/)[1]
  const range = body.match(/unicode-range: ([^;]+);/)[1].trim()
  const file = `${fam.replace(/ /g, '')}-${wgt}-${subset}.woff2`
  await new Promise((resolve, reject) => {
    get(url, res => {
      res.pipe(createWriteStream(new URL(file, OUT))).on('finish', resolve).on('error', reject)
    }).on('error', reject)
  })
  out += `@font-face {\n  font-family: '${fam}';\n  font-style: normal;\n  font-weight: ${wgt};\n  font-display: swap;\n  src: url(${file}) format('woff2');\n  unicode-range: ${range};\n}\n`
}
writeFileSync(new URL('fonts.css', OUT), out)
console.log(`${kept.length} polices → public/fonts/`)
