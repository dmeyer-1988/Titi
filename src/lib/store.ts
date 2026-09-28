import { supabase } from './supabase'
import type { AttemptDraft } from '../engine/Runner'
import { SEED_EXERCISES, type Attempt, type Child, type Exercise } from '../engine/types'

// ---------- cache local (l'app reste utilisable hors ligne) ----------

export interface Family {
  children: Child[]
  exercises: Exercise[]
  pin: string
  packPrice?: number
}

const cacheKey = (uid: string) => `balles-cache-${uid}`
const QUEUE_KEY = 'balles-queue'

export function readCache(uid: string): Family | null {
  try { return JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null') } catch { return null }
}
function writeCache(uid: string, f: Family) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(f)) } catch { /* plein ou bloqué */ }
}

// ---------- lecture ----------

export async function fetchFamily(uid: string): Promise<Family> {
  const [c, e, p] = await Promise.all([
    supabase.from('children').select('id,name').order('created_at'),
    supabase.from('exercises').select('id,type,title,config,active,position,updated_at').order('position').order('created_at'),
    supabase.from('profiles').select('parent_pin,pack_price').eq('user_id', uid).maybeSingle(),
  ])
  if (c.error) throw c.error
  if (e.error) throw e.error
  if (p.error) throw p.error
  const fam: Family = {
    children: c.data as Child[],
    exercises: e.data as Exercise[],
    pin: p.data?.parent_pin ?? '1234',
    packPrice: p.data?.pack_price ?? 10,
  }
  writeCache(uid, fam)
  return fam
}

/** Première utilisation : profil, enfant et trois exercices de départ. */
export async function setupFamily(uid: string, childName: string, pin: string) {
  const p = await supabase.from('profiles').upsert({ user_id: uid, parent_pin: pin })
  if (p.error) throw p.error
  const c = await supabase.from('children').insert({ name: childName.trim() })
  if (c.error) throw c.error
  const existing = await supabase.from('exercises').select('id', { count: 'exact', head: true })
  if (!existing.count) {
    const s = await supabase.from('exercises').insert(SEED_EXERCISES)
    if (s.error) throw s.error
  }
}

// ---------- exercices ----------

export async function saveExercise(ex: Partial<Exercise> & Pick<Exercise, 'type' | 'title' | 'config'>) {
  const row = { type: ex.type, title: ex.title.trim(), config: ex.config, active: ex.active ?? true, position: ex.position ?? 0 }
  const r = ex.id
    ? await supabase.from('exercises').update(row).eq('id', ex.id)
    : await supabase.from('exercises').insert(row)
  if (r.error) throw r.error
}

export async function setExerciseActive(id: string, active: boolean) {
  const r = await supabase.from('exercises').update({ active }).eq('id', id)
  if (r.error) throw r.error
}

export async function deleteExercise(id: string) {
  const r = await supabase.from('exercises').delete().eq('id', id)
  if (r.error) throw r.error
}

export async function moveExercise(list: Exercise[], id: string, dir: -1 | 1) {
  const i = list.findIndex(e => e.id === id), j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  await Promise.all(next.map((e, pos) => supabase.from('exercises').update({ position: pos }).eq('id', e.id)))
}

// ---------- enfants & réglages ----------

export async function addChild(name: string) {
  const r = await supabase.from('children').insert({ name: name.trim() })
  if (r.error) throw r.error
}
export async function renameChild(id: string, name: string) {
  const r = await supabase.from('children').update({ name: name.trim() }).eq('id', id)
  if (r.error) throw r.error
}
export async function setPin(uid: string, pin: string) {
  const r = await supabase.from('profiles').upsert({ user_id: uid, parent_pin: pin })
  if (r.error) throw r.error
}

// ---------- réponses de l'enfant (file d'attente hors ligne) ----------

function readQueue(): Attempt[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}
function writeQueue(q: Attempt[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-2000))) } catch { /* ignore */ }
}
export function pendingCount() { return readQueue().length }

const uuid = () =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

export function recordAttempt(childId: string, a: AttemptDraft) {
  const q = readQueue()
  q.push({ ...a, id: uuid(), child_id: childId, created_at: new Date().toISOString() })
  writeQueue(q)
  void flushQueue()
}

let flushing = false
export async function flushQueue() {
  if (flushing || !navigator.onLine) return
  const q = readQueue()
  if (!q.length) return
  flushing = true
  try {
    const batch = q.slice(0, 200)
    const r = await supabase.from('attempts').upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
    if (!r.error) {
      const sent = new Set(batch.map(b => b.id))
      writeQueue(readQueue().filter(x => !sent.has(x.id)))
    }
  } finally {
    flushing = false
  }
  if (readQueue().length && navigator.onLine) setTimeout(flushQueue, 500)
}

export async function fetchAttempts(opts: { childId?: string; sinceDays?: number } = {}): Promise<Attempt[]> {
  let query = supabase.from('attempts')
    .select('id,child_id,exercise_id,exercise_type,prompt,expected,given,correct,first_try,created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (opts.childId) query = query.eq('child_id', opts.childId)
  if (opts.sinceDays) query = query.gte('created_at', new Date(Date.now() - opts.sinceDays * 864e5).toISOString())
  const r = await query
  if (r.error) throw r.error
  // On y ajoute ce qui attend encore d'être envoyé.
  const pending = readQueue().filter(a => !opts.childId || a.child_id === opts.childId)
  const ids = new Set((r.data as Attempt[]).map(a => a.id))
  return [...pending.filter(a => !ids.has(a.id)).reverse(), ...(r.data as Attempt[])]
}
