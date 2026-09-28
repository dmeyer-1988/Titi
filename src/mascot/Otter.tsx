// Mascotte originale de l'app : une petite loutre.
export type Mood = 'hello' | 'happy' | 'wow' | 'cheer' | 'think'

const C = { fur: '#9A6240', dark: '#6E4128', cream: '#F4E4CB', nose: '#3A2418', cheek: '#F2A7A0' }

const Arm = ({ d }: { d: string }) => {
  const end = d.trim().split(/\s+/).slice(-2).map(Number)
  return (
    <g>
      <path d={d} stroke={C.fur} strokeWidth="17" strokeLinecap="round" fill="none" />
      <circle cx={end[0]} cy={end[1]} r="10" fill={C.dark} />
    </g>
  )
}

export function Otter({ mood = 'happy', className = '' }: { mood?: Mood; className?: string }) {
  const eyesClosed = mood === 'cheer'
  const big = mood === 'wow'
  return (
    <svg viewBox="0 0 220 240" className={'otter ' + mood + ' ' + className} aria-hidden="true">
      {/* grosse queue de loutre, épaisse à la base et pointue */}
      <path d="M130 196 Q196 206 210 150 Q204 146 196 152 Q186 184 134 176 Z" fill={C.dark} />
      {/* corps allongé */}
      <ellipse cx="110" cy="172" rx="46" ry="56" fill={C.fur} />
      <ellipse cx="110" cy="180" rx="30" ry="42" fill={C.cream} />
      {/* pattes arrière palmées */}
      <ellipse cx="88" cy="226" rx="18" ry="8" fill={C.dark} />
      <ellipse cx="132" cy="226" rx="18" ry="8" fill={C.dark} />
      {/* bras au repos (le long du corps) */}
      {mood !== 'cheer' && mood !== 'think' && <Arm d="M70 152 Q58 170 66 190" />}
      {mood !== 'cheer' && mood !== 'hello' && <Arm d="M150 152 Q162 170 154 190" />}
      {/* petites oreilles basses sur les côtés */}
      <ellipse cx="54" cy="84" rx="10" ry="9" fill={C.dark} />
      <ellipse cx="166" cy="84" rx="10" ry="9" fill={C.dark} />
      {/* tête large et un peu aplatie */}
      <ellipse cx="110" cy="96" rx="60" ry="52" fill={C.fur} />
      {/* grand museau clair de loutre */}
      <ellipse cx="110" cy="116" rx="44" ry="28" fill={C.cream} />
      <ellipse cx="92" cy="118" rx="20" ry="15" fill="#FAF0DF" />
      <ellipse cx="128" cy="118" rx="20" ry="15" fill="#FAF0DF" />
      {/* yeux */}
      {eyesClosed ? (
        <g stroke={C.nose} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d="M78 100 Q86 90 94 100" /><path d="M126 100 Q134 90 142 100" />
        </g>
      ) : (
        <g>
          <circle cx="86" cy="99" r={big ? 12 : 9} fill={C.nose} />
          <circle cx="134" cy="99" r={big ? 12 : 9} fill={C.nose} />
          <circle cx={big ? 90 : 89} cy={big ? 94 : 95.5} r={big ? 4.2 : 3.2} fill="#fff" />
          <circle cx={big ? 138 : 137} cy={big ? 94 : 95.5} r={big ? 4.2 : 3.2} fill="#fff" />
          {mood === 'think' && <path d="M74 86 Q86 80 96 86 M124 84 Q134 82 144 88" stroke={C.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
        </g>
      )}
      <ellipse cx="68" cy="118" rx="8" ry="5" fill={C.cheek} opacity=".6" />
      <ellipse cx="152" cy="118" rx="8" ry="5" fill={C.cheek} opacity=".6" />
      {/* truffe et moustaches */}
      <path d="M99 108 Q110 101 121 108 Q117 117 110 118 Q103 117 99 108 Z" fill={C.nose} />
      {[[90, 120], [86, 126], [130, 120], [134, 126]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill={C.dark} />)}
      <g stroke={C.dark} strokeWidth="1.6" strokeLinecap="round" opacity=".7">
        <path d="M76 118 L50 112 M76 124 L50 126" /><path d="M144 118 L170 112 M144 124 L170 126" />
      </g>
      {/* bouche */}
      {mood === 'wow'
        ? <ellipse cx="110" cy="132" rx="7" ry="8" fill={C.nose} />
        : mood === 'think'
          ? <path d="M102 131 Q110 128 118 132" stroke={C.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
          : <path d="M110 118 Q103 131 95 125 M110 118 Q117 131 125 125" stroke={C.nose} strokeWidth="3" fill={mood === 'cheer' ? C.cheek : 'none'} strokeLinecap="round" />}
      {/* bras levés, dessinés devant */}
      {mood === 'cheer' && <><Arm d="M72 150 Q46 128 36 100" /><Arm d="M148 150 Q174 128 184 100" /></>}
      {mood === 'hello' && <Arm d="M150 150 Q180 132 190 102" />}
      {mood === 'think' && <><Arm d="M74 156 Q84 150 96 142" /><Arm d="M150 152 Q162 170 154 190" /></>}
    </svg>
  )
}
