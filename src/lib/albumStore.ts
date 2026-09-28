import { supabase } from './supabase'
import { drawPack, STICKERS } from '../album/catalog'

export interface StickerRow { id: string; sticker_id: number; traded: boolean; created_at: string }
export interface AlbumState {
  rows: StickerRow[]
  spent: number
  /** combien de chaque vignette l'enfant possède (échanges déduits) */
  counts: Map<number, number>
}

export function countsOf(rows: StickerRow[]) {
  const m = new Map<number, number>()
  for (const r of rows) if (!r.traded) m.set(r.sticker_id, (m.get(r.sticker_id) || 0) + 1)
  return m
}
export const doublesOf = (counts: Map<number, number>) => [...counts.values()].reduce((a, n) => a + Math.max(0, n - 1), 0)

export async function fetchAlbum(childId: string): Promise<AlbumState> {
  const [s, p] = await Promise.all([
    supabase.from('stickers').select('id,sticker_id,traded,created_at').eq('child_id', childId).order('created_at'),
    supabase.from('sticker_packs').select('price').eq('child_id', childId),
  ])
  if (s.error) throw s.error
  if (p.error) throw p.error
  const rows = s.data as StickerRow[]
  return { rows, spent: (p.data as { price: number }[]).reduce((a, r) => a + r.price, 0), counts: countsOf(rows) }
}

/** Achète une pochette et renvoie les numéros tirés. */
export async function openPack(childId: string, price: number): Promise<number[]> {
  const ids = drawPack()
  const pack = await supabase.from('sticker_packs').insert({ child_id: childId, price }).select('id').single()
  if (pack.error) throw pack.error
  const ins = await supabase.from('stickers').insert(ids.map(sticker_id => ({ child_id: childId, sticker_id, source: 'pack', pack_id: pack.data.id })))
  if (ins.error) {
    await supabase.from('sticker_packs').delete().eq('id', pack.data.id)
    throw ins.error
  }
  return ids
}

/** Échange 3 doubles contre une vignette qui manque (au hasard). Renvoie son numéro. */
export async function tradeDoubles(childId: string, album: AlbumState): Promise<number> {
  const missing = STICKERS.filter(s => !album.counts.get(s.id)).map(s => s.id)
  if (!missing.length) throw new Error('album complet')
  // Les doubles à donner : on garde toujours le premier exemplaire de chaque vignette.
  const seen = new Set<number>()
  const give: string[] = []
  for (const r of album.rows) {
    if (r.traded) continue
    if (seen.has(r.sticker_id)) give.push(r.id)
    else seen.add(r.sticker_id)
  }
  if (give.length < 3) throw new Error('pas assez de doubles')
  const pick = missing[Math.floor(Math.random() * missing.length)]
  const up = await supabase.from('stickers').update({ traded: true }).in('id', give.slice(0, 3))
  if (up.error) throw up.error
  const ins = await supabase.from('stickers').insert({ child_id: childId, sticker_id: pick, source: 'echange' })
  if (ins.error) throw ins.error
  return pick
}

export async function setPackPrice(uid: string, price: number) {
  const r = await supabase.from('profiles').update({ pack_price: price }).eq('user_id', uid)
  if (r.error) throw r.error
}
