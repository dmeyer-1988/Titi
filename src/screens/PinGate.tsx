import { useEffect, useState } from 'react'

/** Écran de code à 4 chiffres avant l'espace parent. */
export function PinGate({ pin, onOk, onCancel, onForgot }: { pin: string; onOk: () => void; onCancel: () => void; onForgot: () => void }) {
  const [v, setV] = useState('')
  const [bad, setBad] = useState(false)

  useEffect(() => {
    if (v.length < 4) return
    if (v === pin) onOk()
    else { setBad(true); setTimeout(() => { setBad(false); setV('') }, 500) }
  }, [v, pin, onOk])

  const press = (d: string) => setV(x => (d === 'del' ? x.slice(0, -1) : x.length < 4 ? x + d : x))

  return (
    <div className="sheet narrow center">
      <div className="eyebrow">Espace parent</div>
      <h2>Code parent</h2>
      <div className={'pin-dots' + (bad ? ' shake' : '')} aria-label={`${v.length} chiffres saisis`}>
        {[0, 1, 2, 3].map(i => <span key={i} className={i < v.length ? 'on' : ''} />)}
      </div>
      <div className="keypad small">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => <button key={d} className="key" onClick={() => press(d)}>{d}</button>)}
        <button className="key alt" onClick={onCancel}>Retour</button>
        <button className="key" onClick={() => press('0')}>0</button>
        <button className="key alt" onClick={() => press('del')} aria-label="Effacer">⌫</button>
      </div>
      <button className="text-link" onClick={onForgot}>Code oublié ? Se reconnecter par e-mail</button>
    </div>
  )
}
