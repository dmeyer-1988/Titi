import { Mascot } from '../mascot/Mascot'
import { Thumb } from './Home'
import { SEED_EXERCISES, type Exercise } from '../engine/types'

const PREVIEWS: Exercise[] = [0, 1, 2, 3, 5, 16].map(i => ({ ...SEED_EXERCISES[i], id: 'apercu-' + i }) as Exercise)

const FEATURES: [string, string][] = [
  ['🎯', "Des jeux calés sur le programme HarmoS : nombres, calcul, suites, alphabet, sons… réglés classe par classe."],
  ['🦦', "Une loutre de compagnie qui lit les consignes à voix haute, encourage et fête les séries réussies."],
  ['📴', "Marche sans réseau dans la voiture ou au chalet : les réponses sont envoyées au retour de la connexion."],
  ['👨‍👩‍👧', "Un espace parent pour créer, masquer et réordonner des exercices, les tester et suivre les progrès."],
  ['🤝', "Des équipes de copains pour s'encourager entre enfants, sans messagerie ni contenu public."],
  ['🔒', "Sans publicité, sans pistage, sans requête tierce. Un prénom et une classe, rien de plus."],
]

export function Landing({ onLogin, onSignup, onPrivacy }: {
  onLogin: () => void; onSignup: () => void; onPrivacy: () => void
}) {
  return (
    <div className="landing">
      <header className="land-hero">
        <div className="land-hero-text">
          <div className="eyebrow light">Maths et français · 1P à 8P</div>
          <h1>Les balles</h1>
          <p className="lead">Les petits jeux d'entraînement de votre enfant, pensés pour l'iPad : rien à saisir pour lui, tout à suivre pour vous.</p>
          <div className="row">
            <button className="btn big" onClick={onSignup}>Commencer gratuitement</button>
            <button className="btn ghost big" onClick={onLogin}>Se connecter</button>
          </div>
          <p className="land-note">Un e-mail, un code, le prénom de l'enfant. Deux minutes, pas de carte bancaire.</p>
        </div>
        <Mascot mood="hello" size="lg" text={<>Salut ! Moi c'est <b>Bigou</b>. On joue ensemble ?</>} speak="Salut ! Moi c'est Bigou. On joue ensemble ?" />
      </header>

      <section className="land-section">
        <h2>Des jeux qui ressemblent à la classe</h2>
        <p className="muted">Paquets de 10, tableaux d'addition, lettres, sons… les mêmes manipulations que sur les fiches, avec la voix pour les consignes.</p>
        <div className="land-games">
          {PREVIEWS.map(ex => (
            <div className="land-game" key={ex.id}>
              <Thumb ex={ex} />
              <span>{ex.title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <h2>Ce que la famille y gagne</h2>
        <div className="land-features">
          {FEATURES.map(([icon, text]) => (
            <div className="land-feature" key={icon}>
              <span aria-hidden="true">{icon}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <h2>Comment ça marche</h2>
        <ol className="land-steps">
          <li><b>1.</b> Créez votre compte avec votre e-mail : vous recevez un code à 6 chiffres.</li>
          <li><b>2.</b> Donnez le prénom et la classe de l'enfant (ex. 4P). Quelques exercices de départ sont créés.</li>
          <li><b>3.</b> L'enfant joue sur l'iPad ; vous créez des exercices et suivez sa réussite depuis votre téléphone.</li>
        </ol>
      </section>

      <section className="land-cta">
        <h2>Prêt à essayer ?</h2>
        <div className="row">
          <button className="btn big" onClick={onSignup}>Créer notre compte</button>
          <button className="btn ghost big" onClick={onLogin}>J'ai déjà un compte</button>
        </div>
      </section>

      <footer className="land-foot">
        <span>Les balles — petits jeux d'entraînement pour le primaire.</span>
        <button type="button" className="text-link light" onClick={onPrivacy}>Politique de confidentialité</button>
      </footer>
    </div>
  )
}
