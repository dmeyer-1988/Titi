import { supabase } from './supabase'
import { makeRound } from '../engine/generate'
import type { RoundItem } from '../engine/Runner'
import type { Attempt, Exercise } from '../engine/types'

export const DAILY_SIZE = 6
export const DAILY_BONUS = 2

/** Date du jour en Suisse, AAAA-MM-JJ. */
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date())

/**
 * Défi du jour : 6 questions tirées des jeux visibles,
 * avec plus de chances pour les jeux où l'enfant s'est trompé ces 14 derniers jours.
 * Les tableaux d'addition (trop longs) sont exclus.
 */
export function buildDaily(exercises: Exercise[], attempts: Attempt[]): RoundItem[] {
  const pool = exercises.filter(e => e.active && e.type !== 'table')
  if (!pool.length) return []
  const since = Date.now() - 14 * 864e5
  const stat = new Map<string, { n: number; bad: number }>()
  for (const a of attempts) {
    if (!a.exercise_id || +new Date(a.created_at) < since) continue
    const s = stat.get(a.exercise_id) || { n: 0, bad: 0 }
    s.n++; if (!a.correct) s.bad++
    stat.set(a.exercise_id, s)
  }
  const weight = (e: Exercise) => {
    const s = stat.get(e.id)
    return 1 + (s && s.n ? (s.bad / s.n) * 4 : 0.5)
  }
  const items: RoundItem[] = []
  let guard = 0
  while (items.length < DAILY_SIZE && guard++ < 60) {
    const total = pool.reduce((a, e) => a + weight(e), 0)
    let r = Math.random() * total, pick = pool[0]
    for (const e of pool) { r -= weight(e); if (r <= 0) { pick = e; break } }
    // au plus 2 questions du même jeu
    if (items.filter(i => i.ex.id === pick.id).length >= 2 && pool.length > 2) continue
    const q = makeRound(pick)[0]
    if (q) items.push({ ex: pick, q })
  }
  return items
}

export async function fetchDaily(childId: string): Promise<{ doneToday: boolean; bonus: number }> {
  const r = await supabase.from('daily_challenges').select('day,bonus').eq('child_id', childId)
  if (r.error) throw r.error
  const rows = r.data as { day: string; bonus: number }[]
  return { doneToday: rows.some(x => x.day === today()), bonus: rows.reduce((a, x) => a + x.bonus, 0) }
}

export async function completeDaily(childId: string) {
  const r = await supabase.from('daily_challenges').upsert({ child_id: childId, day: today(), bonus: DAILY_BONUS }, { onConflict: 'child_id,day', ignoreDuplicates: true })
  if (r.error) throw r.error
}

export async function setMascotName(childId: string, name: string) {
  const r = await supabase.from('children').update({ mascot_name: name.trim() }).eq('id', childId)
  if (r.error) throw r.error
}
