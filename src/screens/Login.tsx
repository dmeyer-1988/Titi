import { useState } from 'react'
import { supabase } from '../lib/supabase'

/** Connexion du parent par e-mail + code à 6 chiffres (fonctionne dans l'app installée). */
export function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [password, setPassword] = useState('')

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setErr("E-mail ou mot de passe incorrect.")
  }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (!error) setStep('code')
    else if (error.status === 429 || error.code === 'over_email_send_rate_limit')
      setErr("Trop d'e-mails envoyés récemment. Supabase en autorise quelques-uns par heure : réessayez plus tard, ou saisissez le code d'un e-mail déjà reçu.")
    else if (error.code === 'email_address_invalid')
      setErr("Cette adresse e-mail n'est pas valide. Vérifiez l'orthographe.")
    else setErr("L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez dans une minute.")
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
          <div className="row">
            <button className="btn" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir un code'}</button>
            <button type="button" className="btn ghost" disabled={!email.includes('@')} onClick={() => { setErr(''); setStep('code') }}>J'ai déjà un code</button>
          </div>
          <button type="button" className="text-link" onClick={() => { setErr(''); setStep('password') }}>Se connecter avec un mot de passe</button>
        </form>
      ) : step === 'password' ? (
        <form onSubmit={withPassword} className="form">
          <label className="field" htmlFor="email-pw">
            <span>Votre e-mail</span>
            <input id="email-pw" type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field" htmlFor="password">
            <span>Mot de passe</span>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn" disabled={busy || !password}>{busy ? 'Connexion…' : 'Se connecter'}</button>
            <button type="button" className="btn ghost" onClick={() => { setErr(''); setStep('email') }}>Recevoir un code à la place</button>
          </div>
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
