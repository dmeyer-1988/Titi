import { useCallback, useEffect, useState } from 'react'
import { STICKER, STICKERS } from '../album/catalog'
import { Sticker } from '../album/Sticker'
import { PackOpening } from '../album/Album'
import { doublesOf, fetchAlbum, type AlbumState } from '../lib/albumStore'
import { acceptOffer, cancelOffer, claimBonus, getBoard, getOffers, makeOffer, type Board, type Membership, type Offer } from '../lib/teamStore'
import { sounds } from '../engine/audio'

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const countDays = (mask: number) => DAYS.reduce((n, _, i) => n + ((mask >> i) & 1), 0)

export function Team({ childId, membership, onExit }: { childId: string; membership: Membership; onExit: () => void }) {
  const [tab, setTab] = useState<'semaine' | 'echanges'>('semaine')
  const [board, setBoard] = useState<Board | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [album, setAlbum] = useState<AlbumState | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState<{ ids: number[]; before: Map<number, number>; trade: boolean } | null>(null)
  const [give, setGive] = useState<number | null>(null)
  const [want, setWant] = useState<number | null>(null)
  const teamId = membership.team_id

  const load = useCallback(async () => {
    try {
      const [b, o, a] = await Promise.all([getBoard(teamId, childId), getOffers(teamId), fetchAlbum(childId)])
      setBoard(b); setOffers(o); setAlbum(a); setErr('')
    } catch { setErr("L'équipe a besoin d'Internet. Vérifie la connexion puis réessaie.") }
  }, [teamId, childId])
  useEffect(() => { void load() }, [load])

  const run = async (f: () => Promise<void>) => {
    if (busy) return
    setBusy(true); setErr('')
    try { await f() } catch (e) { setErr((e as Error).message || "Ça n'a pas marché.") }
    finally { setBusy(false); void load() }
  }

  const head = (
    <header className="home-head">
      <div>
        <button className="back" onClick={onExit}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          Accueil
        </button>
        <h1 className="team-title">{membership.team.name}</h1>
      </div>
      <div className="me-chip"><span className="av">{membership.avatar}</span>{membership.pseudo}</div>
    </header>
  )

  if (!board || !album) {
    return <div className="sheet team">{head}{err ? <><p className="error">{err}</p><button className="btn" onClick={load}>Réessayer</button></> : <p className="muted">Chargement de l'équipe…</p>}</div>
  }

  const who = new Map(board.members.map(m => [m.child_id, m]))
  const ranked = [...board.members].sort((a, b) => countDays(b.days) - countDays(a.days) || b.stars - a.stars)
  const pct = Math.min(100, Math.round((board.total / board.goal) * 100))
  const reached = board.total >= board.goal
  const today = (new Date().getDay() + 6) % 7

  const myDoubles = STICKERS.filter(s => (album.counts.get(s.id) || 0) >= 2)
  const myMissing = STICKERS.filter(s => !album.counts.get(s.id))
  const mine = offers.filter(o => o.from_child === childId)
  const theirs = offers.filter(o => o.from_child !== childId)

  return (
    <div className="sheet team">
      {head}
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'semaine'} onClick={() => setTab('semaine')}>Cette semaine</button>
        <button role="tab" aria-selected={tab === 'echanges'} onClick={() => setTab('echanges')}>
          Échanges {theirs.length > 0 && <span className="count-badge">{theirs.length}</span>}
        </button>
      </nav>
      {err && <p className="error" role="alert">{err}</p>}

      {tab === 'semaine' ? (
        <>
          <section className="goal-card">
            <div className="goal-top">
              <b>Objectif de l'équipe</b>
              <span className="goal-num"><svg className="star" aria-hidden="true"><use href="#star" /></svg>{board.total} / {board.goal}</span>
            </div>
            <div className="goal-bar" role="meter" aria-valuenow={board.total} aria-valuemin={0} aria-valuemax={board.goal}><span style={{ width: `${pct}%` }} /></div>
            {reached ? (
              board.claimed
                ? <p className="goal-msg">Bravo l'équipe ! Ta pochette bonus est déjà dans ton album. Nouvel objectif lundi.</p>
                : <button className="btn bonus-btn" disabled={busy} onClick={() => run(async () => {
                    const before = new Map(album.counts)
                    const ids = await claimBonus(teamId, childId)
                    sounds.fanfare()
                    setOpening({ ids, before, trade: false })
                  })}>Bravo l'équipe ! Ouvrir ma pochette bonus</button>
            ) : (
              <p className="goal-msg">Encore {board.goal - board.total} étoiles tous ensemble, et chacun gagne une pochette bonus.</p>
            )}
          </section>

          <h3>Qui a joué cette semaine ?</h3>
          <ul className="board">
            {ranked.map(m => {
              const n = countDays(m.days)
              return (
                <li key={m.child_id} className={m.mine && m.child_id === childId ? 'me' : ''}>
                  <span className="av">{m.avatar}</span>
                  <span className="who">
                    <b>{m.pseudo}{m.child_id === childId && <small> (toi)</small>}</b>
                    {n >= 5 && <span className="champ">Champion de la régularité</span>}
                  </span>
                  <span className="days" aria-label={`${n} jours sur 7`}>
                    {DAYS.map((d, i) => <i key={i} className={((m.days >> i) & 1 ? 'on' : '') + (i === today ? ' today' : '')}>{d}</i>)}
                  </span>
                  <span className="mini-stars"><svg className="star" aria-hidden="true"><use href="#star" /></svg>{m.stars}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted">Le classement se fait sur les jours joués : un peu chaque jour, c'est ce qui compte. Tout recommence lundi.</p>
        </>
      ) : (
        <>
          <section className="trade-new">
            <h3>Proposer un échange</h3>
            {myDoubles.length === 0 ? (
              <p className="muted">Tu n'as pas encore de double à échanger. Ouvre des pochettes dans ton album !</p>
            ) : (
              <>
                <p className="step">1. Je donne un de mes doubles :</p>
                <div className="pick-row">
                  {myDoubles.map(s => (
                    <button key={s.id} className={'pick' + (give === s.id ? ' on' : '')} onClick={() => setGive(s.id)} aria-pressed={give === s.id}>
                      <Sticker s={s} count={album.counts.get(s.id)} />
                    </button>
                  ))}
                </div>
                <p className="step">2. Je voudrais une vignette qui me manque :</p>
                <div className="pick-row">
                  {myMissing.map(s => (
                    <button key={s.id} className={'pick missing' + (want === s.id ? ' on' : '')} onClick={() => setWant(s.id)} aria-pressed={want === s.id}>
                      <Sticker s={s} />
                    </button>
                  ))}
                </div>
                <button className="btn" disabled={busy || give === null || want === null} onClick={() => run(async () => {
                  await makeOffer(teamId, childId, give!, want!)
                  setGive(null); setWant(null)
                  sounds.good()
                })}>Proposer aux copains</button>
              </>
            )}
          </section>

          <h3>Les offres des copains</h3>
          {theirs.length === 0 ? <p className="muted">Pas d'offre pour le moment.</p> : (
            <ul className="offers">
              {theirs.map(o => {
                const m = who.get(o.from_child)
                const g = STICKER.get(o.give_sticker)!, w = STICKER.get(o.want_sticker)!
                const canGive = (album.counts.get(w.id) || 0) >= 2
                const has = (album.counts.get(g.id) || 0) >= 1
                return (
                  <li key={o.id}>
                    <span className="from"><span className="av">{m?.avatar ?? '🙂'}</span>{m?.pseudo ?? 'Un copain'}</span>
                    <span className="deal">
                      <span className="lbl">te donne</span><Sticker s={g} />
                      <span className="arrow" aria-hidden="true">⇄</span>
                      <span className="lbl">contre ton</span><Sticker s={w} />
                    </span>
                    <span className="act">
                      <button className="btn small" disabled={busy || !canGive} onClick={() => run(async () => {
                        const before = new Map(album.counts)
                        const got = await acceptOffer(o.id, childId)
                        if (got < 0) throw new Error("Ton copain n'a plus ce double : l'offre est annulée.")
                        setOpening({ ids: [got], before, trade: true })
                      })}>Échanger</button>
                      <small>{!canGive ? `Il te faut un double du n°${w.id}` : has ? 'Tu l’as déjà : ce sera un double' : ''}</small>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          {mine.length > 0 && (
            <>
              <h3>Mes offres en attente</h3>
              <ul className="offers">
                {mine.map(o => (
                  <li key={o.id}>
                    <span className="deal">
                      <span className="lbl">je donne</span><Sticker s={STICKER.get(o.give_sticker)!} />
                      <span className="arrow" aria-hidden="true">⇄</span>
                      <span className="lbl">contre</span><Sticker s={STICKER.get(o.want_sticker)!} />
                    </span>
                    <span className="act"><button className="btn ghost small" disabled={busy} onClick={() => run(() => cancelOffer(o.id))}>Annuler</button></span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="muted">{doublesOf(album.counts)} double{doublesOf(album.counts) > 1 ? 's' : ''} dans ton album.</p>
        </>
      )}

      {opening && <PackOpening ids={opening.ids} before={opening.before} trade={opening.trade} onDone={() => setOpening(null)} />}
    </div>
  )
}
