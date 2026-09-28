import type { StickerDef } from './catalog'
import { StickerArt } from './Art'

/** Une vignette façon Panini : numéro, dessin, nom. */
export function Sticker({ s, count = 1, onClick, isNew }: { s: StickerDef; count?: number; onClick?: () => void; isNew?: boolean }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={'sticker ' + s.section + (s.shiny ? ' shiny' : '')} onClick={onClick} aria-label={s.name}>
      <span className="st-num">{s.id}</span>
      <span className="st-art"><StickerArt s={s} /></span>
      <span className={'st-name' + (s.name.length > 13 ? ' long' : '')} lang="fr">{s.name}</span>
      {count > 1 && <span className="st-dup">×{count}</span>}
      {isNew && <span className="st-new">Nouvelle !</span>}
    </Tag>
  )
}

/** Emplacement vide dans l'album. */
export function Slot({ s }: { s: StickerDef }) {
  return (
    <div className={'slot-empty ' + s.section} aria-label={`Vignette ${s.id} manquante`}>
      <span className="se-num">{s.id}</span>
      <span className="se-name">{s.name}</span>
    </div>
  )
}
