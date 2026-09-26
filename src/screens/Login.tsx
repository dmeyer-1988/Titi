import { useState } from 'react'
import { supabase } from '../lib/supabase'

/** Connexion du parent par e-mail + code à 6 chiffres (fonctionne dans l'app installée). */
export function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (error) setErr("L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez dans une minute.")
    else setStep('code')
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setErr('Ce code ne fonctionne pas. Vérifiez les 6 chiffres ou demandez un nouveau code.')
  }

  return (
    <div className="sheet narrow">
      <div className="eyebrow">Espace parent</div>
      <h1>Les balles</h1>
      <p className="lead">Connectez-vous une fois sur cet appareil. L'enfant n'aura plus rien à saisir ensuite.</p>
      {step === 'email' ? (
        <form onSubmit={send} className="form">
          <label className="field" htmlFor="email">
            <span>Votre e-mail</span>
            <input id="email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir un code'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="form">
          <p>Un code à 6 chiffres a été envoyé à <b>{email}</b>.</p>
          <label className="field" htmlFor="code">
            <span>Code reçu par e-mail</span>
            <input id="code" className="code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <div className="row">
            <button className="btn" disabled={busy || code.length !== 6}>{busy ? 'Vérification…' : 'Se connecter'}</button>
            <button type="button" className="btn ghost" onClick={() => { setStep('email'); setCode('') }}>Changer d'e-mail</button>
          </div>
        </form>
      )}
      {err && <p className="error" role="alert">{err}</p>}
    </div>
  )
}
