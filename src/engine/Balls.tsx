// Dessin des balles de tennis, regroupées en paquets de 10 (4-2-4) comme sur la fiche.

export function BallDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="felt" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#F2F59A" />
          <stop offset=".6" stopColor="#DCE54A" />
          <stop offset="1" stopColor="#B9C236" />
        </radialGradient>
        <symbol id="ball" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="url(#felt)" stroke="#6F7530" strokeWidth="1.6" />
          <path d="M7 11 C 17 15, 17 25, 7 30" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M33 10 C 23 15, 23 25, 33 30" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </symbol>
      </defs>
    </svg>
  )
}

export function Ball({ className = '' }: { className?: string }) {
  return (
    <svg className={'ball ' + className} aria-hidden="true">
      <use href="#ball" />
    </svg>
  )
}

export function Pack({ tag }: { tag?: string }) {
  return (
    <div className="pack">
      <Ball /><Ball /><Ball /><Ball />
      <Ball className="m1" /><Ball className="m2" />
      <Ball /><Ball /><Ball /><Ball />
      {tag && <span className="tag">{tag}</span>}
    </div>
  )
}

/**
 * Une collection de n balles : paquets de 10 + balles seules.
 * `counted` = nombre de paquets déjà étiquetés (10, 20, 30…) pendant le comptage.
 */
export function Collection({ n, counted = 0, showUnits = false }: { n: number; counted?: number; showUnits?: boolean }) {
  const packs = Math.floor(n / 10), units = n % 10
  return (
    <div className="coll" role="img" aria-label={`${n} balles`}>
      {Array.from({ length: packs }, (_, i) => (
        <Pack key={i} tag={i < counted ? String((i + 1) * 10) : undefined} />
      ))}
      {units > 0 && (
        <div className="loose">
          {Array.from({ length: units }, (_, i) => <Ball key={i} />)}
          {showUnits && <span className="tag u">+{units}</span>}
        </div>
      )}
    </div>
  )
}
