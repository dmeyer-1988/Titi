// Politique de confidentialité. Texte à faire relire avant l'ouverture au public,
// puis tenir à jour (données collectées, hébergeur, contact).

// TODO : adresse de contact réelle, lue par un humain.
const CONTACT_EMAIL = 'contact@example.com'
const CONTACT = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

export function Privacy({ onExit }: { onExit: () => void }) {
  return (
    <div className="sheet narrow">
      <div className="eyebrow">Les balles</div>
      <h1>Confidentialité</h1>
      <p className="lead">Une application d'entraînement pour votre enfant, sans pub ni pistage. Voici, en clair, ce qui est stocké et pourquoi.</p>

      <h2>En bref</h2>
      <ul>
        <li>Pas de publicité, pas de traceurs, pas de cookies tiers.</li>
        <li>Aucune requête vers des services tiers : les polices et tout le reste sont servis par l'application.</li>
        <li>Aucune photo, aucun nom complet, aucune localisation.</li>
        <li>Vos données vous appartiennent : exportez-les ou supprimez-les à tout moment ({CONTACT}).</li>
      </ul>

      <h2>Ce qui est stocké</h2>
      <ul>
        <li>Votre adresse e-mail et votre mot de passe (gérés par le service d'authentification).</li>
        <li>Le code parent à 4 chiffres.</li>
        <li>Le prénom et la classe (1P–8P) de chaque enfant.</li>
        <li>Les exercices que vous créez ou masquez.</li>
        <li>Chaque réponse de l'enfant : la question posée, la réponse attendue, la réponse donnée, juste ou faux, du premier coup ou non.</li>
        <li>La progression du jeu : étoiles, album de vignettes, défi du jour, équipe de copains.</li>
      </ul>

      <h2>Pourquoi</h2>
      <p>Ces données sont le service lui-même : la synchronisation entre l'iPad et votre téléphone, le suivi des progrès dans l'espace parent, le mode hors ligne. Rien d'autre n'est fait de ces informations.</p>

      <h2>Où sont les données</h2>
      <p>Les données sont conservées dans une base de données PostgreSQL hébergée chez Supabase (région Europe), chiffrées en transit (HTTPS). Chaque compte ne peut lire et modifier que ses propres données.</p>

      <h2>Sur votre appareil</h2>
      <p>L'application garde en local le cache des exercices et les réponses en attente d'envoi, pour fonctionner sans réseau. Le code parent est un verrou contre la curiosité des enfants : ce n'est pas un chiffrement — quiconque contrôle l'appareil peut lire le stockage local.</p>

      <h2>Les enfants</h2>
      <p>L'application est utilisée sous le compte et la responsabilité du parent. On demande seulement un prénom et une classe ; jamais un nom complet, un âge exact, une photo ou un quelconque identifiant publicitaire. Il n'y a pas de messagerie, pas de contenu public et aucun échange avec d'autres utilisateurs.</p>

      <h2>Vos droits (RGPD / nLPD)</h2>
      <p>Vous pouvez demander à tout moment l'accès à vos données, leur rectification, leur export ou leur suppression complète en écrivant à {CONTACT}. La suppression efface le compte, les enfants, les exercices et toutes les réponses.</p>

      <h2>Modifications</h2>
      <p className="muted">Dernière mise à jour : octobre 2026. Si cette politique change, la nouvelle version sera publiée ici avant toute modification du traitement.</p>

      <div className="row">
        <button className="btn ghost" onClick={onExit}>Retour</button>
      </div>
    </div>
  )
}
