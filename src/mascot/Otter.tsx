// Mascotte de l'app : une petite loutre en bonnet bleu et marinière beige.
export type Mood = 'hello' | 'happy' | 'wow' | 'cheer' | 'think'

const C = {
  fur: '#5A3826', dark: '#47291B', face: '#9A6A47', nose: '#1F1612',
  cheek: '#E88A6A', hat: '#8FC3EA', hatDark: '#6FA9D6', stripe: '#CDB59C', shirt: '#FBF8F3', star: '#E58C93',
}

const Arm = ({ d }: { d: string }) => {
  const end = d.trim().split(/\s+/).slice(-2).map(Number)
  return (
    <g>
      <path d={d} stroke={C.fur} strokeWidth="18" strokeLinecap="round" fill="none" />
      <circle cx={end[0]} cy={end[1]} r="10" fill={C.dark} />
    </g>
  )
}

export function Otter({ mood = 'happy', className = '' }: { mood?: Mood; className?: string }) {
  const eyesClosed = mood === 'cheer'
  const big = mood === 'wow'
  return (
    <svg viewBox="0 0 220 240" className={'otter ' + mood + ' ' + className} aria-hidden="true">
      <defs>
        <clipPath id="otter-body"><ellipse cx="110" cy="174" rx="44" ry="52" /></clipPath>
        <clipPath id="otter-hat"><path d="M48 92 Q50 30 110 28 Q170 30 172 92 Z" /></clipPath>
      </defs>

      {/* queue */}
      <path d="M130 198 Q194 208 208 154 Q202 150 194 156 Q184 186 134 178 Z" fill={C.dark} />

      {/* corps : marinière à rayures beiges */}
      <g clipPath="url(#otter-body)">
        <rect x="60" y="118" width="100" height="112" fill={C.shirt} />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x="60" y={124 + i * 14} width="100" height="7" fill={C.stripe} />)}
      </g>
      {/* petite étoile cousue sur la marinière */}
      <path d="M110 160 l5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5 Z" fill={C.star} />

      {/* pattes arrière */}
      <ellipse cx="88" cy="226" rx="18" ry="9" fill={C.dark} />
      <ellipse cx="132" cy="226" rx="18" ry="9" fill={C.dark} />

      {/* bras au repos */}
      {mood !== 'cheer' && mood !== 'think' && <Arm d="M70 150 Q56 170 64 192" />}
      {mood !== 'cheer' && mood !== 'hello' && <Arm d="M150 150 Q164 170 156 192" />}

      {/* tête */}
      <ellipse cx="110" cy="96" rx="60" ry="54" fill={C.fur} />
      {/* masque clair autour du museau */}
      <path d="M110 84 Q148 84 152 112 Q150 140 110 142 Q70 140 68 112 Q72 84 110 84 Z" fill={C.face} />

      {/* bonnet bleu côtelé */}
      <g clipPath="url(#otter-hat)">
        <rect x="40" y="20" width="140" height="80" fill={C.hat} />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={52 + i * 10} y="20" width="3" height="80" fill={C.hatDark} opacity=".55" />)}
      </g>
      <path d="M46 92 Q110 74 174 92 L174 80 Q110 62 46 80 Z" fill={C.hatDark} />

      {/* yeux : grand blanc et pupille noire */}
      {eyesClosed ? (
        <g stroke={C.nose} strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d="M76 104 Q86 94 96 104" /><path d="M124 104 Q134 94 144 104" />
        </g>
      ) : (
        <g>
          <ellipse cx="86" cy="103" rx={big ? 14 : 12} ry={big ? 15 : 13} fill="#fff" stroke={C.dark} strokeWidth="2" />
          <ellipse cx="134" cy="103" rx={big ? 14 : 12} ry={big ? 15 : 13} fill="#fff" stroke={C.dark} strokeWidth="2" />
          <circle cx="88" cy="104" r={big ? 8 : 7} fill={C.nose} />
          <circle cx="132" cy="104" r={big ? 8 : 7} fill={C.nose} />
          <circle cx="90.5" cy="101" r="2.4" fill="#fff" />
          <circle cx="134.5" cy="101" r="2.4" fill="#fff" />
          {mood === 'think' && <path d="M72 88 Q86 82 98 88 M122 86 Q134 84 146 90" stroke={C.dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
        </g>
      )}

      {/* joues */}
      <ellipse cx="72" cy="126" rx="8" ry="5.5" fill={C.cheek} opacity=".85" />
      <ellipse cx="148" cy="126" rx="8" ry="5.5" fill={C.cheek} opacity=".85" />

      {/* truffe et moustaches */}
      <path d="M98 114 Q110 106 122 114 Q118 125 110 126 Q102 125 98 114 Z" fill={C.nose} />
      <g stroke="#F6EEE6" strokeWidth="1.6" strokeLinecap="round" opacity=".9">
        <path d="M80 122 L56 116 M80 128 L56 130" /><path d="M140 122 L164 116 M140 128 L164 130" />
      </g>

      {/* bouche */}
      {mood === 'wow'
        ? <ellipse cx="110" cy="134" rx="6" ry="7" fill={C.nose} />
        : mood === 'think'
          ? <path d="M103 134 Q110 131 117 135" stroke={C.nose} strokeWidth="3" fill="none" strokeLinecap="round" />
          : <path d="M110 125 Q104 135 97 130 M110 125 Q116 135 123 130" stroke={C.nose} strokeWidth="3" fill={mood === 'cheer' ? C.cheek : 'none'} strokeLinecap="round" />}

      {/* bras levés */}
      {mood === 'cheer' && <><Arm d="M72 150 Q46 128 36 100" /><Arm d="M148 150 Q174 128 184 100" /></>}
      {mood === 'hello' && <Arm d="M150 150 Q180 132 190 102" />}
      {mood === 'think' && <><Arm d="M74 156 Q84 150 96 142" /><Arm d="M150 150 Q164 170 156 192" /></>}
    </svg>
  )
}
