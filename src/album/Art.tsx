import { CLUBS, type StickerDef } from './catalog'

/** Dessin de la vignette, selon sa section. */
export function StickerArt({ s }: { s: StickerDef }) {
  if (s.section === 'animaux') return <span className="art-emoji" aria-hidden="true">{s.art}</span>
  if (s.section === 'dinos') return <Dino kind={s.art} />
  return s.kind === 'ecusson' ? <Crest id={s.id} club={s.club!} /> : <Jersey id={s.id} club={s.club!} />
}

/* ---------- Dinosaures : dessins simples à partir de formes ---------- */

const Eye = ({ x, y, r = 3 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#fff" />
    <circle cx={x + r * 0.3} cy={y} r={r * 0.55} fill="#1F2328" />
  </g>
)

const Leg = ({ x, y, h, w = 9, c }: { x: number; y: number; h: number; w?: number; c: string }) => (
  <rect x={x} y={y} width={w} height={h} rx={w / 2.5} fill={c} />
)

function Dino({ kind }: { kind: string }) {
  const g = <ellipse cx="60" cy="90" rx="44" ry="4" fill="rgba(0,0,0,.12)" />
  switch (kind) {
    case 'trex': {
      const c = '#5E8C3A', d = '#476B2B'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M44 52 Q22 48 4 66 Q26 58 48 62 Z" fill={c} />
          <path d="M50 60 L44 88 L54 88 L60 62 Z" fill={d} />
          <ellipse cx="56" cy="54" rx="22" ry="15" transform="rotate(-22 56 54)" fill={c} />
          <path d="M60 60 L58 88 L68 88 L70 60 Z" fill={c} />
          <path d="M66 42 Q70 22 90 20 L110 23 Q114 28 110 33 L94 35 L108 39 Q104 47 90 47 L74 50 Z" fill={c} />
          <path d="M96 35 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
          <path d="M72 54 l9 3 l-2 4" stroke={d} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Eye x={90} y={27} />
        </svg>
      )
    }
    case 'tricera': {
      const c = '#C9793A', d = '#A9612A'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M36 56 Q18 58 6 70 Q24 66 38 66 Z" fill={c} />
          <Leg x={38} y={64} h={24} c={d} /><Leg x={70} y={64} h={24} c={d} />
          <ellipse cx="58" cy="58" rx="28" ry="17" fill={c} />
          <Leg x={48} y={66} h={22} c={c} /><Leg x={80} y={66} h={22} c={c} />
          <circle cx="88" cy="46" r="17" fill={d} />
          <ellipse cx="96" cy="58" rx="15" ry="11" fill={c} />
          <path d="M108 60 l8 3 l-8 4 Z" fill="#E9D8B4" />
          <path d="M90 47 l3 -18 l4 18 Z M100 48 l7 -15 l0 16 Z M108 54 l7 -6 l-2 9 Z" fill="#F4EBD7" />
          <Eye x={98} y={54} />
        </svg>
      )
    }
    case 'stego': {
      const c = '#5A8FB0', d = '#3F6F8E', p = '#E07A4B'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          {[[34, 50, 10], [44, 43, 13], [55, 40, 15], [66, 41, 14], [77, 46, 11]].map(([x, y, s], i) => (
            <path key={i} d={`M${x - s / 2} ${y + 8} L${x} ${y - s} L${x + s / 2} ${y + 8} Z`} fill={p} />
          ))}
          <path d="M32 60 Q16 54 6 44 Q14 60 30 68 Z" fill={c} />
          <path d="M8 46 l-4 -8 M12 50 l-2 -9" stroke="#F4EBD7" strokeWidth="3" strokeLinecap="round" />
          <Leg x={38} y={64} h={24} c={d} /><Leg x={70} y={64} h={24} c={d} />
          <ellipse cx="56" cy="60" rx="28" ry="15" fill={c} />
          <Leg x={48} y={66} h={22} c={c} /><Leg x={78} y={66} h={22} c={c} />
          <path d="M80 58 Q92 60 98 66 L94 72 Q86 68 78 66 Z" fill={c} />
          <ellipse cx="100" cy="68" rx="9" ry="6" fill={c} />
          <Eye x={102} y={66} r={2.2} />
        </svg>
      )
    }
    case 'diplo': {
      const c = '#8C7BB8', d = '#6F5F9A'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M36 58 Q16 60 2 48 Q14 64 36 68 Z" fill={c} />
          <Leg x={38} y={64} h={24} c={d} /><Leg x={62} y={64} h={24} c={d} />
          <ellipse cx="52" cy="60" rx="22" ry="14" fill={c} />
          <Leg x={46} y={66} h={22} c={c} /><Leg x={68} y={64} h={24} c={c} />
          <path d="M66 54 Q86 42 96 16 L104 19 Q96 46 74 66 Z" fill={c} />
          <ellipse cx="103" cy="15" rx="9" ry="6" fill={c} />
          <Eye x={104} y={13} r={2.2} />
        </svg>
      )
    }
    case 'brachio': {
      const c = '#6FA3A0', d = '#528583'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M38 62 Q24 66 12 74 Q26 72 40 70 Z" fill={c} />
          <Leg x={40} y={66} h={22} c={d} /><Leg x={70} y={60} h={28} c={d} />
          <ellipse cx="56" cy="60" rx="22" ry="14" transform="rotate(-12 56 60)" fill={c} />
          <Leg x={48} y={68} h={20} c={c} /><Leg x={78} y={58} h={30} c={c} />
          <path d="M68 52 Q80 24 84 8 L92 10 Q90 32 80 60 Z" fill={c} />
          <ellipse cx="91" cy="9" rx="10" ry="6" fill={c} />
          <circle cx="90" cy="4" r="4" fill={c} />
          <Eye x={93} y={8} r={2.2} />
        </svg>
      )
    }
    case 'raptor': {
      const c = '#B8864B', d = '#936A38'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M44 54 L4 46 L6 50 L46 60 Z" fill={c} />
          <path d="M50 58 L46 86 L54 86 L58 60 Z" fill={d} />
          <path d="M54 86 l-2 -5" stroke="#F4EBD7" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="58" cy="54" rx="18" ry="10" fill={c} />
          <path d="M60 58 L60 86 L68 86 L68 58 Z" fill={c} />
          <path d="M70 50 Q80 36 90 34 L104 38 Q106 42 102 44 L88 46 L74 58 Z" fill={c} />
          <path d="M72 58 l8 6 l4 -2" stroke={d} strokeWidth="3" fill="none" strokeLinecap="round" />
          {[40, 34, 28, 22].map((x, i) => <path key={i} d={`M${x} 50 l-4 -4`} stroke={d} strokeWidth="2" strokeLinecap="round" />)}
          <Eye x={92} y={39} r={2.4} />
        </svg>
      )
    }
    case 'ptera': {
      const c = '#D6453A', d = '#B0362D'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">
          <path d="M60 50 L4 28 Q20 46 30 62 Z" fill={d} />
          <path d="M60 50 L116 28 Q100 46 90 62 Z" fill={d} />
          <ellipse cx="60" cy="54" rx="10" ry="14" fill={c} />
          <path d="M60 36 L96 44 L62 46 Z" fill="#F4C27A" />
          <path d="M58 38 L36 22 L54 42 Z" fill={c} />
          <circle cx="62" cy="38" r="8" fill={c} />
          <Eye x={64} y={37} r={2.4} />
          <path d="M56 68 l-3 8 M64 68 l3 8" stroke={d} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    }
    case 'ankylo': {
      const c = '#8A7458', d = '#6E5A42'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M30 64 Q18 64 12 60 L14 68 Q22 70 32 70 Z" fill={c} />
          <circle cx="10" cy="62" r="8" fill={d} />
          <Leg x={36} y={70} h={18} w={10} c={d} /><Leg x={72} y={70} h={18} w={10} c={d} />
          <ellipse cx="58" cy="64" rx="32" ry="14" fill={c} />
          <Leg x={46} y={72} h={16} w={10} c={c} /><Leg x={80} y={72} h={16} w={10} c={c} />
          {[[36, 58], [46, 54], [58, 52], [70, 54], [80, 58], [42, 64], [56, 60], [70, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#D9C7A6" />)}
          {[30, 44, 58, 72, 86].map((x, i) => <path key={i} d={`M${x} 72 l3 7 l3 -7`} fill="#D9C7A6" />)}
          <ellipse cx="96" cy="66" rx="10" ry="8" fill={c} />
          <Eye x={99} y={64} r={2.2} />
        </svg>
      )
    }
    case 'spino': {
      const c = '#3F7A8C', d = '#2E5E6C', s = '#E07A4B'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M36 52 Q54 4 80 46 Z" fill={s} />
          {[44, 52, 60, 68].map((x, i) => <path key={i} d={`M${x} 50 L${x + 2} ${22 + Math.abs(i - 1.5) * 6}`} stroke="#B85A30" strokeWidth="1.5" />)}
          <path d="M40 56 Q20 54 4 68 Q24 62 44 64 Z" fill={c} />
          <path d="M50 62 L46 88 L54 88 L58 64 Z" fill={d} />
          <ellipse cx="58" cy="56" rx="24" ry="13" transform="rotate(-12 58 56)" fill={c} />
          <path d="M62 62 L60 88 L68 88 L70 62 Z" fill={c} />
          <path d="M72 46 Q80 36 92 38 L114 44 L112 48 L92 50 L78 56 Z" fill={c} />
          <path d="M74 58 l8 4 l-2 4" stroke={d} strokeWidth="3" fill="none" strokeLinecap="round" />
          <Eye x={90} y={42} r={2.4} />
        </svg>
      )
    }
    case 'para': {
      const c = '#D08A2E', d = '#AE7020', cr = '#8C3A2E'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M42 56 Q22 54 6 64 Q24 62 44 64 Z" fill={c} />
          <Leg x={48} y={60} h={28} c={d} />
          <ellipse cx="58" cy="56" rx="22" ry="13" transform="rotate(-18 58 56)" fill={c} />
          <Leg x={60} y={62} h={26} c={c} />
          <path d="M70 48 Q78 34 90 32 L104 38 Q104 44 98 44 L86 46 L76 58 Z" fill={c} />
          <path d="M88 32 Q76 18 58 16 L58 21 Q74 22 84 36 Z" fill={cr} />
          <path d="M72 58 l6 6" stroke={d} strokeWidth="3" strokeLinecap="round" />
          <Eye x={92} y={37} r={2.4} />
        </svg>
      )
    }
    case 'pachy': {
      const c = '#9B6FA8', d = '#7D548A'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M42 56 Q22 54 6 64 Q24 62 44 64 Z" fill={c} />
          <path d="M50 60 L46 88 L54 88 L58 62 Z" fill={d} />
          <ellipse cx="58" cy="56" rx="21" ry="13" transform="rotate(-18 58 56)" fill={c} />
          <path d="M62 60 L60 88 L68 88 L70 60 Z" fill={c} />
          <path d="M70 50 Q78 40 88 40 L102 44 Q102 50 96 52 L84 52 L76 60 Z" fill={c} />
          <circle cx="88" cy="36" r="11" fill="#E6D3EC" />
          {[[78, 30], [82, 26], [96, 28]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={d} />)}
          <Eye x={94} y={44} r={2.3} />
        </svg>
      )
    }
    case 'iguano': {
      const c = '#7A9A4A', d = '#5F7B36'
      return (
        <svg viewBox="0 0 120 96" className="art-svg" aria-hidden="true">{g}
          <path d="M40 60 Q22 58 6 70 Q24 66 42 68 Z" fill={c} />
          <Leg x={42} y={64} h={24} c={d} />
          <ellipse cx="56" cy="58" rx="24" ry="14" transform="rotate(-14 56 58)" fill={c} />
          <Leg x={54} y={66} h={22} c={c} />
          <path d="M72 64 L78 86 L86 86 L80 62 Z" fill={d} />
          <path d="M84 70 l6 -8" stroke="#F4EBD7" strokeWidth="3" strokeLinecap="round" />
          <path d="M70 50 Q80 36 92 36 L106 42 Q106 48 100 48 L88 50 L78 60 Z" fill={c} />
          <Eye x={94} y={41} r={2.4} />
        </svg>
      )
    }
  }
  return null
}

/* ---------- Football : clubs imaginaires ---------- */

function Crest({ id, club }: { id: number; club: keyof typeof CLUBS }) {
  const k = CLUBS[club], clip = `crest-${id}`
  const shield = 'M50 6 L90 16 L86 58 Q80 80 50 94 Q20 80 14 58 L10 16 Z'
  return (
    <svg viewBox="0 0 100 100" className="art-svg" aria-hidden="true">
      <defs><clipPath id={clip}><path d={shield} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="100" height="100" fill={k.c1} />
        {k.pattern === 'rayures' && [22, 44, 66].map(x => <rect key={x} x={x} y="0" width="11" height="100" fill={k.c2} />)}
        {k.pattern === 'moitie' && <rect x="50" y="0" width="50" height="100" fill={k.c2} />}
        {k.pattern === 'echarpe' && <path d="M0 20 L20 0 L100 80 L80 100 Z" fill={k.c2} />}
        {k.pattern === 'cerceaux' && [30, 56].map(y => <rect key={y} x="0" y={y} width="100" height="12" fill={k.c2} />)}
        {k.pattern === 'uni' && <rect x="0" y="62" width="100" height="40" fill={k.c2} />}
      </g>
      <path d={shield} fill="none" stroke="#1F2328" strokeWidth="3" />
      <circle cx="50" cy="44" r="18" fill="#fff" stroke="#1F2328" strokeWidth="2" />
      <text x="50" y="52" textAnchor="middle" fontSize="22">{k.symbol}</text>
      <rect x="26" y="68" width="48" height="14" rx="3" fill="#1F2328" />
      <text x="50" y="79" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">{k.short}</text>
    </svg>
  )
}

function Jersey({ id, club }: { id: number; club: keyof typeof CLUBS }) {
  const k = CLUBS[club], clip = `shirt-${id}`
  const shirt = 'M30 12 L42 8 Q50 16 58 8 L70 12 L92 28 L82 44 L72 37 L72 92 L28 92 L28 37 L18 44 L8 28 Z'
  const dark = ['#1F2328', '#2F6B3A', '#6A3DB8', '#1D5FB8', '#D6453A'].includes(k.c1)
  return (
    <svg viewBox="0 0 100 100" className="art-svg" aria-hidden="true">
      <defs><clipPath id={clip}><path d={shirt} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="100" height="100" fill={k.c1} />
        {k.pattern === 'rayures' && [34, 48, 62].map(x => <rect key={x} x={x} y="0" width="7" height="100" fill={k.c2} />)}
        {k.pattern === 'moitie' && <rect x="50" y="0" width="50" height="100" fill={k.c2} />}
        {k.pattern === 'echarpe' && <path d="M20 0 L36 0 L90 100 L74 100 Z" fill={k.c2} />}
        {k.pattern === 'cerceaux' && [34, 56, 78].map(y => <rect key={y} x="0" y={y} width="100" height="9" fill={k.c2} />)}
        {k.pattern === 'uni' && <><rect x="0" y="0" width="100" height="8" fill={k.c2} /><rect x="0" y="36" width="28" height="100" fill={k.c1} /></>}
      </g>
      <path d={shirt} fill="none" stroke="#1F2328" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M42 8 Q50 16 58 8" fill="none" stroke={k.c2 === '#FFFFFF' && !dark ? '#1F2328' : k.c2} strokeWidth="3" />
      <circle cx="50" cy="56" r="15" fill="#fff" opacity=".92" />
      <text x="50" y="63" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1F2328" fontFamily="system-ui, sans-serif">{k.num}</text>
    </svg>
  )
}
