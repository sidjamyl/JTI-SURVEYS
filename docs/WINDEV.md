# WinDev Mobile — JTI Surveys

## Pont repris de Camel

Référence consultée : `sidjamyl/camel`, `app/lib/windev.ts`. Camel envoie `WL.Execute("Score", score)` et expose `window.gift(id)` pour le retour natif. JTI utilise le même pont natif, avec une chaîne JSON à la place du score. Le dépôt Camel n'a pas été modifié.

## Déroulement

1. L'application WinDev choisit le parcours et charge l'URL du service `consumer` ou `retailer` dans son champ d'affichage HTML.
2. Dans ce champ, autoriser JavaScript et « Autoriser l'appel de WLangage depuis le code HTML (fonction JavaScript WL.Execute) ». Charger uniquement l'URL de confiance du formulaire JTI dans ce champ.
3. Le site ouvre directement Q1 ou R2, affiche le stepper et gère les validations et les langues. La confirmation de participation consommateur est intégrée au début du formulaire.
4. L'utilisateur vérifie les réponses, puis appuie sur « Enregistrer l'entretien ».
5. Le site valide, sauvegarde sur l'appareil, puis appelle exactement :

   ```js
   window.WL.Execute("Reponse", JSON.stringify(interview));
   ```

6. Une procédure WLangage nommée `Reponse` reçoit **un paramètre chaîne**, contenant **un entretien objet** (pas un tableau d'entretiens). Exemple de réception :

   ```wlanguage
   PROCÉDURE Reponse(sJSON est une chaîne)
   vEntretien est un Variant = JSONVersVariant(sJSON)
   // Valider le schéma, le mode et les réponses dans votre application.
   // Sauvegarder le JSON, puis envoyer au serveur métier si nécessaire.
   // Utiliser vEntretien.id pour éviter les doublons.
   ```

7. WinDev doit enregistrer durablement l'entretien et gérer son envoi métier. Le site n'appelle aucun serveur de collecte. Le simple retour de `WL.Execute` ne prouve pas que WinDev a sauvegardé les données.

## Lecture demandée par WinDev

Le site expose aussi `window.reponse()` : elle renvoie la même chaîne JSON après validation finale, ou `null` avant celle-ci. WinDev peut l'évaluer dans le champ HTML avec `ExécuteJS`, en utilisant la procédure de récupération du résultat adaptée à votre version de WinDev Mobile.

Autre façon de demander la réponse depuis WinDev, sans dépendre du type de retour d'`ExécuteJS` :

```wlanguage
ExécuteJS(HTM_Survey, "const json = window.reponse(); if (json !== null) WL.Execute('Reponse', json);")
```

Ce rappel provoque une nouvelle réception du même entretien : dédupliquer par `id`. La première transmission est automatique ; ce rappel est facultatif.

`window.reponse()` ne lit pas un brouillon et ne termine pas un formulaire. La réponse est remise à `null` au nouvel entretien ou au rechargement de la page. Les entretiens enregistrés restent dans le stockage du navigateur et sont exportables depuis la liste.

## JSON

Voir `docs/example-response.json`. Chaque réponse contient `question`, `answer` et `language` (`fr`, `en`, `ar`, ou `null` pour les anciens entretiens sans historique). La langue correspond au dernier changement de la réponse, pas à la langue de l'écran final.

- Une réponse simple : chaîne de libellé ; un produit : nom de la référence.
- Plusieurs réponses : tableau de libellés.
- R3 : objet nom de produit → libellé de disponibilité.
- R8 : objet nom de produit → `{primary, secondary?}`, noms des références ou choix explicites, avec la précision saisie pour « Autre ».
- Les réponses de branches masquées, Q13/Q14 et R1 sont exclues.
- L'export JSON de plusieurs entretiens est un **tableau** de ces objets ; le pont WinDev reçoit **un seul objet**.

## Erreurs et limites

Dans un navigateur ordinaire sans `WL`, le formulaire fonctionne et reste exportable. Si `WL.Execute` lève une erreur, le site garde l'entretien enregistré et affiche « Réessayer l'envoi ». Ce renvoi conserve le même `id`. Aucun accusé de réception ou envoi HTTP métier n'est inventé : WinDev reste responsable de sa sauvegarde et de son traitement des doublons.

La chaîne peut contenir de l'arabe, des guillemets et des retours ligne : transmettre le JSON tel quel à la procédure et utiliser `JSONVersVariant`, sans concaténer ses réponses dans du code JavaScript.

Tests : pont simulé, conservation de `this` pour `WL`, rappel, échec, parcours navigateur. La version WinDev de votre application et les appareils Android/iOS ne sont pas accessibles ici ; valider un entretien réel dans le champ HTML avant terrain.

Documentation PC SOFT : [champ d'affichage HTML / WL.Execute](https://doc.pcsoft.fr/fr-FR/?1410087141=).
