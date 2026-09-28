import { useCallback, useEffect, useState } from 'react'
import { SECTIONS, STICKER, STICKERS, type SectionId, type StickerDef } from './catalog'
import { Slot, Sticker } from './Sticker'
import { StickerArt } from './Art'
import { doublesOf, fetchAlbum, openPack, tradeDoubles, type AlbumState } from '../lib/albumStore'
import { say, sounds } from '../engine/audio'

interface Props {
  childId: string
  earned: number
  price: number
  onExit: () => void
}

export function Album({ childId, earned, price, onExit }: Props) {
  const [album, setAlbum] = useState<AlbumState | null>(null)
  const [err, setErr] = useState('')
  const [section, setSection] = useState<SectionId>('animaux')
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState<{ ids: number[]; before: Map<number, number> } | null>(null)
  const [detail, setDetail] = useState<StickerDef | null>(null)
  const [fresh, setFresh] = useState<number[]>([])

  const load = useCallback(async () => {
    try { setAlbum(await fetchAlbum(childId)); setErr('') }
    catch { setErr("L'album a besoin d'Internet pour s'ouvrir. Vérifie la connexion puis réessaie.") }
  }, [childId])
  useEffect(() => { void load() }, [load])

  if (!album) {
    return (
      <div className="sheet album">
        <AlbumHead onExit={onExit} wallet={null} />
        {err ? <><p className="error">{err}</p><button className="btn" onClick={load}>Réessayer</button></> : <p className="muted">Chargement de l'album…</p>}
      </div>
    )
  }

  const wallet = Math.max(0, earned - album.spent)
  const owned = STICKERS.filter(s => album.counts.get(s.id)).length
  const doubles = doublesOf(album.counts)
  const complete = owned === STICKERS.length

  const buy = async () => {
    if (busy || wallet < price) return
    setBusy(true); setErr('')
    try {
      const before = new Map(album.counts)
      const ids = await openPack(childId, price)
      setOpening({ ids, before })
      await load()
    } catch { setErr("La pochette n'a pas pu être ouverte. Vérifie la connexion puis réessaie.") }
    finally { setBusy(false) }
  }

  const trade = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      const before = new Map(album.counts)
      const id = await tradeDoubles(childId, album)
      setOpening({ ids: [id], before })
      await load()
    } catch { setErr("L'échange n'a pas marché. Vérifie la connexion puis réessaie.") }
    finally { setBusy(false) }
  }

  const list = STICKERS.filter(s => s.section === section)

  return (
    <div className="sheet album">
      <AlbumHead onExit={onExit} wallet={wallet} />

      <div className="album-bar">
        <button className={'pack-btn' + (wallet >= price ? ' ready' : '')} onClick={buy} disabled={busy || wallet < price || complete}>
          <span className="pack-mini" aria-hidden="true"><Star /></span>
          <span className="pb-text">
            <b>Ouvrir une pochette</b>
            <small>{complete ? 'Album complet !' : wallet >= price ? `${price} étoiles · 5 vignettes` : `Encore ${price - wallet} étoile${price - wallet > 1 ? 's' : ''} à gagner`}</small>
          </span>
        </button>
        <button className="trade-btn" onClick={trade} disabled={busy || doubles < 3 || complete}>
          <b>Échanger 3 doubles</b>
          <small>{doubles < 3 ? `Tu as ${doubles} double${doubles > 1 ? 's' : ''}` : `contre 1 vignette qui te manque (${doubles} doubles)`}</small>
        </button>
      </div>
      {err && <p className="error" role="alert">{err}</p>}

      <div className="album-progress">
        <span>{owned} / {STICKERS.length} vignettes</span>
        <div className="meter"><span style={{ width: `${(owned / STICKERS.length) * 100}%` }} /></div>
      </div>

      <nav className="tabs album-tabs" role="tablist">
        {SECTIONS.map(sec => {
          const all = STICKERS.filter(s => s.section === sec.id)
          const got = all.filter(s => album.counts.get(s.id)).length
          return <button key={sec.id} role="tab" aria-selected={section === sec.id} onClick={() => setSection(sec.id)}>{sec.label} <small>{got}/{all.length}</small></button>
        })}
      </nav>

      <div className={'album-page ' + section}>
        {list.map(s => (album.counts.get(s.id)
          ? <Sticker key={s.id} s={s} count={album.counts.get(s.id)} isNew={fresh.includes(s.id)} onClick={() => { setDetail(s); say(`${s.name}. ${s.fact}`) }} />
          : <Slot key={s.id} s={s} />))}
      </div>

      {opening && (
        <PackOpening
          ids={opening.ids}
          before={opening.before}
          trade={opening.ids.length === 1}
          onDone={() => {
            setFresh(opening.ids.filter(id => !opening.before.get(id)))
            const first = STICKER.get(opening.ids[0])
            if (first) setSection(first.section)
            setOpening(null)
          }}
        />
      )}
      {detail && <Detail s={detail} count={album.counts.get(detail.id) || 1} onClose={() => setDetail(null)} />}
    </div>
  )
}

function Star() {
  return <svg className="star" aria-hidden="true"><use href="#star" /></svg>
}

function AlbumHead({ onExit, wallet }: { onExit: () => void; wallet: number | null }) {
  return (
    <header className="home-head">
      <div>
        <button className="back" onClick={onExit}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          Accueil
        </button>
        <h1 className="album-title">Mon album</h1>
      </div>
      {wallet !== null && (
        <div className="total-stars" aria-label={`${wallet} étoiles à dépenser`}><Star /><span>{wallet}</span></div>
      )}
    </header>
  )
}

/** Ouverture de pochette : on déchire, puis chaque vignette se retourne. */
export function PackOpening({ ids, before, trade, onDone }: { ids: number[]; before: Map<number, number>; trade: boolean; onDone: () => void }) {
  const [stage, setStage] = useState<'closed' | 'open'>(trade ? 'open' : 'closed')
  const [shown, setShown] = useState(trade ? 1 : 0)
  const seen = new Map(before)
  const flags = ids.map(id => { const isNew = !seen.get(id); seen.set(id, (seen.get(id) || 0) + 1); return isNew })

  useEffect(() => {
    if (stage !== 'open' || shown >= ids.length) return
    const t = setTimeout(() => {
      setShown(n => n + 1)
      const s = STICKER.get(ids[shown])
      if (s?.shiny) sounds.fanfare(); else sounds.tick(shown + 2)
    }, shown === 0 ? 350 : 700)
    return () => clearTimeout(t)
  }, [stage, shown, ids])

  useEffect(() => { if (trade) { sounds.good(); say('Échange réussi !') } }, [trade])

  return (
    <div className="overlay" role="dialog" aria-label="Pochette de vignettes">
      {stage === 'closed' ? (
        <button className="packet" onClick={() => { setStage('open'); sounds.good() }}>
          <span className="pack-top" />
          <span className="pack-body">
            <Star />
            <b>Les balles</b>
            <small>5 vignettes</small>
          </span>
          <span className="pack-hint">Touche pour ouvrir</span>
        </button>
      ) : (
        <div className="reveal">
          <h2>{trade ? 'Échange réussi !' : 'Ta pochette'}</h2>
          <div className="reveal-cards">
            {ids.map((id, i) => {
              const s = STICKER.get(id)!
              return (
                <div key={i} className={'flip' + (i < shown ? ' on' : '')}>
                  <div className="flip-back"><Star /></div>
                  <div className="flip-front">
                    <Sticker s={s} />
                    <span className={'tag-new ' + (flags[i] ? 'new' : 'dup')}>{flags[i] ? 'Nouvelle !' : 'Double'}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <button className="btn" onClick={onDone} disabled={shown < ids.length}>Coller dans mon album</button>
        </div>
      )}
    </div>
  )
}

function Detail({ s, count, onClose }: { s: StickerDef; count: number; onClose: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-label={s.name} onClick={onClose}>
      <div className="detail" onClick={e => e.stopPropagation()}>
        <div className={'detail-card ' + s.section + (s.shiny ? ' shiny' : '')}>
          <span className="st-num">{s.id}</span>
          <div className="detail-art"><StickerArt s={s} /></div>
        </div>
        <h2>{s.name}</h2>
        <p>{s.fact}</p>
        {count > 1 && <p className="muted">Tu l'as en {count} exemplaires : {count - 1} double{count > 2 ? 's' : ''} à échanger.</p>}
        <div className="row">
          <button className="btn ghost" onClick={() => say(`${s.name}. ${s.fact}`)}>Écouter</button>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
