import { supabase } from './supabase'
import { drawPack } from '../album/catalog'

export interface Membership { team_id: string; pseudo: string; avatar: string; team: { name: string; code: string; goal: number; created_by: string } }
export interface BoardMember { child_id: string; pseudo: string; avatar: string; mine: boolean; days: number; stars: number }
export interface Board { goal: number; total: number; claimed: boolean; members: BoardMember[] }
export interface Offer { id: string; from_child: string; give_sticker: number; want_sticker: number; status: string; created_at: string }

/** Avatars proposés : des animaux de l'album. */
export const AVATARS = ['🦁', '🐯', '🐼', '🦊', '🐨', '🐸', '🦉', '🐬', '🦈', '🐢', '🦖', '🦄']

const msg = (e: unknown) => String((e as { message?: string })?.message || '')

export async function getMembership(childId: string): Promise<Membership | null> {
  const r = await supabase.from('team_members').select('team_id,pseudo,avatar,team:teams(name,code,goal,created_by)').eq('child_id', childId).maybeSingle()
  if (r.error) throw r.error
  return (r.data as unknown as Membership) ?? null
}

export async function createTeam(name: string, childId: string, pseudo: string, avatar: string) {
  const r = await supabase.rpc('create_team', { p_name: name, p_child: childId, p_pseudo: pseudo, p_avatar: avatar })
  if (r.error) throw new Error(explain(msg(r.error)))
}

export async function joinTeam(code: string, childId: string, pseudo: string, avatar: string) {
  const r = await supabase.rpc('join_team', { p_code: code, p_child: childId, p_pseudo: pseudo, p_avatar: avatar })
  if (r.error) throw new Error(explain(msg(r.error)))
}

export async function leaveTeam(teamId: string, childId: string) {
  const r = await supabase.from('team_members').delete().eq('team_id', teamId).eq('child_id', childId)
  if (r.error) throw r.error
}

export async function updateMember(teamId: string, childId: string, pseudo: string, avatar: string) {
  const r = await supabase.from('team_members').update({ pseudo, avatar }).eq('team_id', teamId).eq('child_id', childId)
  if (r.error) throw r.error
}

export async function setGoal(teamId: string, goal: number) {
  const r = await supabase.from('teams').update({ goal }).eq('id', teamId)
  if (r.error) throw r.error
}

export async function getBoard(teamId: string, childId: string): Promise<Board> {
  const r = await supabase.rpc('team_board', { p_team: teamId, p_child: childId })
  if (r.error) throw r.error
  return r.data as Board
}

export async function claimBonus(teamId: string, childId: string): Promise<number[]> {
  const ids = drawPack()
  const r = await supabase.rpc('claim_team_bonus', { p_team: teamId, p_child: childId, p_ids: ids })
  if (r.error) throw new Error(explain(msg(r.error)))
  return ids
}

export async function getOffers(teamId: string): Promise<Offer[]> {
  const r = await supabase.from('sticker_offers').select('id,from_child,give_sticker,want_sticker,status,created_at')
    .eq('team_id', teamId).eq('status', 'open').order('created_at', { ascending: false })
  if (r.error) throw r.error
  return r.data as Offer[]
}

export async function makeOffer(teamId: string, childId: string, give: number, want: number) {
  const r = await supabase.from('sticker_offers').insert({ team_id: teamId, from_child: childId, give_sticker: give, want_sticker: want })
  if (r.error) throw r.error
}

export async function cancelOffer(id: string) {
  const r = await supabase.from('sticker_offers').update({ status: 'cancelled', done_at: new Date().toISOString() }).eq('id', id)
  if (r.error) throw r.error
}

/** Renvoie le numéro reçu, ou -1 si le copain n'a plus son double (offre annulée). */
export async function acceptOffer(id: string, childId: string): Promise<number> {
  const r = await supabase.rpc('accept_offer', { p_offer: id, p_child: childId })
  if (r.error) throw new Error(explain(msg(r.error)))
  return r.data as number
}

function explain(m: string) {
  if (m.includes('code inconnu')) return "Ce code d'équipe n'existe pas. Vérifiez les 6 caractères."
  if (m.includes('deja dans une equipe')) return 'Cet enfant fait déjà partie d’une équipe.'
  if (m.includes('equipe complete')) return 'Cette équipe est complète (30 enfants au maximum).'
  if (m.includes('objectif pas atteint')) return "L'objectif de l'équipe n'est pas encore atteint."
  if (m.includes('duplicate') || m.includes('unique')) return 'La pochette bonus de cette semaine a déjà été ouverte.'
  if (m.includes('pas de double')) return "Tu n'as plus de double de cette vignette."
  if (m.includes('offre plus disponible')) return "Cette offre n'est plus disponible."
  return "Ça n'a pas marché. Vérifie la connexion puis réessaie."
}
