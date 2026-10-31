import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Création de compte : e-mail + consentement du parent, puis code à 6 chiffres.
 * L'enfant et sa classe se configurent juste après (écran d'accueil).
 */
export function Signup({ onLogin, onPrivacy }: { onLogin: () => void; onPrivacy: () => void }) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) return
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (!error) setStep('code')
    else if (error.status === 429 || error.code === 'over_email_send_rate_limit')
      setErr("Trop d'e-mails envoyés récemment. Réessayez plus tard, ou saisissez le code d'un e-mail déjà reçu.")
    else if (error.code === 'email_address_invalid')
      setErr("Cette adresse e-mail n'est pas valide. Vérifiez l'orthographe.")
    else setErr("L'e-mail n'a pas pu être envoyé. Vérifiez l'adresse et réessayez dans une minute.")
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) { setErr('Ce code ne fonctionne pas. Vérifiez les 6 chiffres ou demandez un nouveau code.'); return }
    // Consentement daté, rattaché au compte (voir la politique de confidentialité).
    if (data.user) {
      void supabase.from('profiles').upsert({ user_id: data.user.id, consented_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.warn('consentement non enregistré', error) })
    }
  }

  return (
    <div className="sheet narrow">
      <div className="eyebrow">Créer un compte</div>
      <h1>Les balles</h1>
      {step === 'email' ? (
        <form onSubmit={send} className="form">
          <p className="lead">C'est votre compte à vous, parent : l'enfant n'aura rien à saisir ensuite.</p>
          <label className="field" htmlFor="su-email">
            <span>Votre e-mail</span>
            <input id="su-email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="check" htmlFor="su-consent">
            <input id="su-consent" type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span>Je suis <b>un adulte</b> et je crée ce compte pour mon ou mes enfants. J'accepte le traitement des données décrit dans la <button type="button" className="text-link inline" onClick={onPrivacy}>politique de confidentialité</button> (prénom, classe et réponses de l'enfant, sous mon compte).</span>
          </label>
          <div className="row">
            <button className="btn" disabled={busy || !consent}>{busy ? 'Envoi…' : 'Recevoir mon code'}</button>
            <button type="button" className="btn ghost" disabled={!email.includes('@')} onClick={() => { setErr(''); setStep('code') }}>J'ai déjà un code</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verify} className="form">
          <p>Saisissez le code à 6 chiffres reçu à <b>{email}</b>.</p>
          <label className="field" htmlFor="su-code">
            <span>Code reçu par e-mail</span>
            <input id="su-code" className="code-input" type="text" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </label>
          <div className="row">
            <button className="btn" disabled={busy || code.length !== 6}>{busy ? 'Vérification…' : 'Créer le compte'}</button>
            <button type="button" className="btn ghost" onClick={() => { setStep('email'); setCode('') }}>Changer d'e-mail</button>
          </div>
        </form>
      )}
      {err && <p className="error" role="alert">{err}</p>}
      <button type="button" className="text-link" onClick={onLogin}>Déjà un compte ? Se connecter</button>
    </div>
  )
}
