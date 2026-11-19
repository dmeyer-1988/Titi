# Bigou — app Flutter (iPad et iPhone)

Réécriture native de l'app web, branchée sur la même base Supabase (mêmes comptes, exercices et étoiles).

## Lancer l'app sur votre Mac

```bash
cd app_flutter
flutter pub get
open ios/Runner.xcworkspace   # 1re fois : Signing & Capabilities → choisir votre équipe Apple
flutter run                   # sur le simulateur iPad ou l'iPad branché en USB
```

Mode démo, sans compte ni réseau (une famille fictive) :

```bash
flutter run --dart-define=DEMO=true
```

## Ce qui est porté

| Lot | Contenu | État |
|---|---|---|
| 1 | Connexion (code e-mail ou mot de passe), première utilisation, accueil Maths / Français / Géographie, partie, étoiles, série 🔥, Bigou et sa voix, file d'attente hors ligne | ✅ |
| 1 | Jeux : Combien de balles, Calcul (+ astuces), Le son on / om, Les drapeaux | ✅ |
| 2 | Entoure, Paquets de 10, Suite, Tableau d'addition, Nœuds, Châteaux, Capacité | à faire |
| 3 | Alphabet, Dictée (clavier + ardoise Apple Pencil), Continents, Cantons | à faire |
| 4 | Album, équipes, défi du jour, espace parent | à faire |

Les jeux pas encore portés n'apparaissent pas dans l'app ; ils restent jouables dans la version web.

## CI

`.github/workflows/flutter.yml` : analyse, tests du moteur, captures d'écran (publiées sur la branche
`flutter-shots`) et compilation iOS sans signature à chaque modification de `app_flutter/`.
