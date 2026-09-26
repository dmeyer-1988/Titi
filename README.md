# Les balles

Petits jeux de maths pour la 4e HarmoS, pensés pour l'iPad, avec un espace parent pour créer les exercices et suivre les progrès.

- **Enfant** : un menu de jeux, des étoiles, rien à saisir.
- **Parent** : créer / masquer / réordonner des exercices, les tester, voir le suivi (réussite du premier coup, pièges fréquents, dernières erreurs). Accessible derrière un code à 4 chiffres.
- **Hors ligne** : l'app se lance sans réseau, les réponses sont gardées et envoyées au retour de la connexion.
- **Synchronisation** : un exercice créé depuis votre téléphone apparaît sur l'iPad à la prochaine ouverture.

Stack : Vite + React + TypeScript, `vite-plugin-pwa`, Supabase (Auth + Postgres avec RLS), GitHub Pages.

## Types d'exercices

| Type | Ce que fait l'enfant | Réglages |
|---|---|---|
| `entoure` | Dessine un rond au doigt autour de la collection qui a le bon nombre de balles (4 choix) | dizaines seules ou dizaines + unités, bornes |
| `combien` | Compte une collection et choisit parmi 3 nombres (écrits aussi en lettres : septante, huitante, nonante) | idem |
| `suite` | Complète les cases vides d'une suite avec un clavier | pas (1, 2, 5, 10), sens, bornes, longueur, cases vides |

Les balles sont groupées en paquets de 10 (4-2-4) comme sur les fiches. Après une bonne réponse, le jeu compte à voix haute : 10, 20, 30… +4.

## Mise en place (≈ 15 minutes)

### 1. Supabase

1. Créez un projet sur supabase.com.
2. **SQL Editor** → collez `supabase/migrations/20260926000000_init.sql` → Run.
   (ou `supabase link` puis `supabase db push`)
3. **Authentication → Sign In / Providers → Email** : laissez l'e-mail activé.
4. **Authentication → Email Templates → Magic Link** : l'app se connecte avec un **code à 6 chiffres** (un lien magique s'ouvrirait dans Safari et pas dans l'app installée). Remplacez le corps du modèle par exemple par :

   ```html
   <h2>Votre code pour Les balles</h2>
   <p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
   ```

5. **Authentication → URL Configuration** : Site URL = l'adresse GitHub Pages (étape 2), par ex. `https://<owner>.github.io/<repo>/`.
6. **Project Settings → API** : notez l'URL du projet et la clé `anon` (publique, protégée par la RLS).

### 2. GitHub Pages

1. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. **Settings → Secrets and variables → Actions → onglet Variables** : ajoutez
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Poussez sur `main` (ou lancez le workflow « Déployer sur GitHub Pages » à la main). L'app est servie sur `https://<owner>.github.io/<repo>/`.

### 3. Sur l'iPad

1. Ouvrez l'adresse dans **Safari**, puis **Partager → Sur l'écran d'accueil**.
2. Lancez l'app depuis l'icône, connectez-vous avec votre e-mail et le code reçu, puis donnez le prénom de l'enfant et un code parent.
3. Conseillé : **Réglages → Accessibilité → Accès guidé** pour bloquer l'iPad dans le jeu (triple clic pour l'activer).

Sur votre téléphone, ouvrez la même adresse et connectez-vous avec le même e-mail pour créer des exercices à distance.

## Développement

```bash
cp .env.example .env   # URL + clé anon Supabase
npm install
npm run dev
```

`npm run build` vérifie les types puis génère `dist/` avec le service worker.

## Ajouter un type d'exercice

1. `src/engine/types.ts` : le type, sa config, son libellé, sa config par défaut.
2. `src/engine/generate.ts` : le générateur de questions.
3. `src/engine/<Nom>Q.tsx` : l'écran de la question (appelle `onAttempt` à chaque réponse, `onSolved` quand c'est réussi).
4. `src/engine/Runner.tsx` : la consigne et le branchement du composant.
5. `src/screens/Editor.tsx` : les réglages côté parent.
6. Nouvelle migration SQL pour étendre la contrainte `exercises.type`.

## Données

| Table | Contenu |
|---|---|
| `profiles` | code parent |
| `children` | prénoms (plusieurs enfants possibles) |
| `exercises` | type, titre, `config` JSON, visible, ordre |
| `attempts` | chaque réponse : attendu, donné, juste, du premier coup |

Toutes les tables sont en RLS : chaque compte ne voit que ses propres données.
