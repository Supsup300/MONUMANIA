# MONUMANIA — projet Android

Ce dossier est une application Android Studio native qui embarque la version complète de MONUMANIA. Le jeu fonctionne localement dans une WebView sécurisée : aucune connexion n'est nécessaire pour jouer, la progression reste sauvegardée sur l'appareil et l'interface est verrouillée en portrait.

## Configuration

- Application ID : `fr.adriansalard.monumania`
- Version : `1.0.0` (`versionCode 1`)
- Android minimum : API 26 (Android 8)
- Cible : API 36
- Java : 17
- Android Gradle Plugin : 8.13.2
- Gradle : 8.13

## Ouvrir et tester

1. Décompresser le projet.
2. Dans Android Studio, choisir **Open** puis sélectionner ce dossier.
3. Laisser Gradle installer les composants manquants.
4. Lancer la configuration `app` sur un téléphone ou un émulateur en mode portrait.

Depuis un terminal avec le SDK Android configuré :

```bash
./gradlew assembleDebug
```

L'APK de test sera créé dans `app/build/outputs/apk/debug/`.

## Créer le fichier Google Play

Pour une première publication, utiliser **Build > Generate Signed Bundle / APK > Android App Bundle** dans Android Studio. Le résultat attendu est un fichier `.aab` signé.

Une configuration en ligne de commande est également prévue :

1. Copier `keystore.properties.example` vers `keystore.properties`.
2. Créer votre propre keystore et renseigner ses quatre valeurs.
3. Lancer `./gradlew bundleRelease`.

Ne jamais versionner le keystore ni `keystore.properties`.

## Publicités : comportement actuel

La version fournie conserve exactement la logique de jeu actuelle :

- récompense volontaire `+5 mouvements` après un échec ;
- récompense volontaire `+1 vie` ;
- récompense volontaire `+60 pièces` dans la boutique ;
- interstitiel court seulement après chaque quatrième nouvelle victoire ;
- aucune publicité pendant une partie ;
- aucun visionnage obligatoire.

Par défaut, ces publicités sont **simulées localement**. Aucun SDK publicitaire, identifiant AdMob, suivi ou collecte de données n'est activé.

## Brancher AdMob plus tard

Les points d'extension sont déjà séparés du jeu :

- `ads/AdsGateway.java` : contrat récompensé/interstitiel ;
- `ads/NativeAdsBridge.java` : pont entre le jeu et Android ;
- `ads/NoOpAdsGateway.java` : mode sûr actuel, qui déclenche la simulation locale ;
- `ads/AdConfig.java` : emplacement des futurs identifiants ;
- `consent/ConsentGateway.java` et `NativeConsentBridge.java` : emplacement du futur flux de consentement.

Avant d'activer de vraies publicités :

1. ajouter le SDK Google Mobile Ads et le SDK UMP de consentement ;
2. utiliser exclusivement les identifiants de test Google pendant le développement ;
3. créer une implémentation `AdMobAdsGateway` et une implémentation UMP de `ConsentGateway` ;
4. remplacer les deux implémentations `NoOp` dans `MainActivity` ;
5. renseigner l'App ID dans le manifeste et les unités dans `AdConfig` ;
6. vérifier le consentement EEE/Royaume-Uni, la politique de confidentialité, la section Sécurité des données et la classification du contenu ;
7. tester les récompenses, la fermeture, l'absence de remplissage et les erreurs réseau avant publication.

Le JavaScript détecte automatiquement si le pont publicitaire natif est prêt. S'il ne l'est pas ou échoue, il revient au mode simulé sans bloquer le joueur.

## Mettre à jour le jeu embarqué

Le contenu jouable se trouve dans :

`app/src/main/assets/public/`

Il suffit de remplacer ce dossier par une nouvelle version web compilée, tout en conservant l'interface `window.MONUMANIA` ajoutée à `app.mjs`.

## Vérifications avant publication

- incrémenter `versionCode` à chaque mise à jour ;
- tester sur petit et grand écran Android ;
- tester mode avion, retour système, mise en arrière-plan et restauration ;
- vérifier les sons, vibrations et sauvegarde locale ;
- remplacer les publicités simulées uniquement lorsque consentement et identifiants de test sont prêts ;
- générer un AAB signé puis le déposer d'abord sur la piste de test interne de Google Play.
