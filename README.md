# JTI — Algeria Retail Pulse

Application Next.js / React / TypeScript, avec Tailwind CSS, shadcn/ui, Animated Tabs de Smooth UI, Animated Group de Tailark. Interface française, anglaise et arabe, avec RTL, polices locales, navigation clavier et mouvements réduits.

## Démarrage

```sh
npm ci
npm run dev
```

L’application est accessible sur http://localhost:3001.

```sh
npm run check
npm run test
npm run build
```

Le build génère `out/`, déployable sur un hébergement statique. Webpack est utilisé : Turbopack ne peut pas ouvrir les ports nécessaires à ses workers dans l’environnement de création.

Pour les tests de parcours, servir `out/` sur le port 3002, puis `npx playwright test`. Un Chromium déjà installé peut être indiqué avec `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Questionnaire

Source : `Algeria_OOS_Questionnaire_Workbook V2_Translated_ EN FR DZ.xlsx`, fourni dans la conversation. Les libellés français et arabes sont repris du classeur ; les annotations SA/MA restent des consignes enquêteur. Les codes consommateur internes de V1 sont conservés pour WinDev, avec la correspondance V2 dans `tests/fixtures/translations-v2.json`. Les consignes de l’onglet Instructions sont utilisées comme spécification de questionnaire uniquement.

- Les deux parcours, leurs questions et les 18 références du classement sont dans `lib/questionnaire.ts`.
- Les réponses utilisent des codes identiques dans les trois langues.
- Les sections se terminent avant un embranchement ; les questions multiréponses terminent aussi leur section.
- Q2b : uniquement si Q2 = les deux formats.
- Q6b/Q7 : uniquement si Q5 indique un achat, y compris une autre catégorie, conformément au routage du classeur.
- Q7a : unité ou les deux, entier 5–15. Q7b : paquet ou les deux, entier 1–10.
- Q8 : produit acheté différent de Q1, maximum trois réponses. Q11/Q12 : même condition.
- Q9 et Q10 : posées à tous, le classeur ne mentionnant aucun saut. Ce choix littéral peut être à confirmer pour les non-acheteurs.
- R3 : 18 statuts obligatoires, dont « Disponible uniquement en paquet » (`pack`, export anglais « Available only by pack »). R8 : uniquement rupture ou unité, huit premières références selon le classement de ventes. « Aucun substitut / repart sans achat » est conservé ; deuxième choix facultatif et distinct du premier.
- R10 : uniquement si R9 indique une recommandation.
- Les réponses masquées après modification sont conservées pendant la session, puis exclues de l’entretien final.
- Q15 : téléphone du consommateur obligatoire, dans les informations du consommateur. La validation exige un numéro valide ; les numéros sont transmis comme chaînes, avec le zéro initial ou le préfixe international.
- Q13/Q14 : sexe et tranche d’âge du consommateur rétablis, réponses obligatoires. La localisation est rétablie au début des deux parcours : Q0 consommateur / R1 détaillant, avec région, wilaya et commune. R2 propose uniquement Bureau Tabac et Kiosque.
- `lib/locations.ts` reprend les 98 combinaisons distinctes de `Communes_List_DTC.xlsx` (3 régions, 17 wilayas). Seules les lignes exactement identiques sont dédupliquées ; les variantes orthographiques sont conservées. Les listes sont liées et les choix incompatibles sont rejetés.

## Session et transmission à WinDev

Les réponses restent en mémoire pendant la saisie et repartent de zéro à chaque réouverture, rechargement ou retour par l’historique du navigateur. Aucun brouillon ni entretien n’est sauvegardé par le formulaire. Les anciens enregistrements locaux ne sont ni utilisés ni supprimés.

Les deux URLs ouvrent le même écran de choix Consommateur / Détaillant, puis une introduction propre au parcours en français, anglais ou darija. « Oui » ouvre la localisation puis les questions. « Non » transmet immédiatement un refus à WinDev et affiche un remerciement. Le premier champ du JSON est `participation: "oui"` ou `participation: "non"`, quelle que soit la langue du formulaire.

L’en-tête contient le logo JTI et un stepper compact pendant le questionnaire. Le choix de langue reste dans le contenu. Aucun export de brouillon ni entretien local.

Après vérification, le bouton « Valider les réponses » transmet un entretien complet via `WL.Execute("Reponse", json)`, puis reste désactivé sur le récapitulatif. Chaque code de question contient directement sa réponse, sans intitulé ni langue. Les choix codés sont toujours exportés en anglais ; les noms de produits, wilayas et communes et les textes libres restent inchangés. Les régions sont exportées comme Central / East / West. WinDev gère la sauvegarde et la suite du parcours. En cas d’erreur du pont, le bouton permet de renvoyer le même JSON sans perdre la saisie tant que la page reste ouverte.

## Photo du consommateur

Uniquement sur le lien `https://jti-details.esi-maint.com` (branche `retailer`), dans le parcours Consommateur : à la fin des informations du client, une nouvelle photo du consommateur est obligatoire. Le formulaire ouvre un aperçu vidéo de la caméra, puis capture une image en direct ; aucun sélecteur de fichier ni accès à la galerie n’est proposé. La photo peut être prévisualisée, remplacée ou retirée, mais une photo reste requise pour valider. Le navigateur redessine la photo en JPEG (sans les métadonnées du fichier source), avec un côté maximal de 1 024 pixels, puis réduit la qualité et les dimensions jusqu’à obtenir au maximum 262 144 caractères Base64 (192 Kio de JPEG).

La photo reste uniquement en mémoire et est transmise via le même appel WinDev dans le champ `photo: {mimeType: "image/jpeg", base64: "…"}`. Ce champ est requis pour un entretien consommateur accepté et absent pour un refus ou un entretien détaillant. La validation attend la fin de la préparation ; un réessai transmet exactement le même JSON. Le WebView WinDev cible doit autoriser la caméra et prendre en charge `getUserMedia` en HTTPS. Sans accès caméra, la validation consommateur reste bloquée. L’ouverture réelle de la caméra et la taille acceptée par le pont doivent être vérifiées sur l’appareil cible.

## Photos produit

Le logo et les 18 photos fournis via Drive sont intégrés localement dans `public/brand/` et `public/products/`. Le formulaire ne dépend pas de Drive à l’exécution. Le logo original est affiché sans les marges vides de son fichier, via CSS.

Le manifeste `public/products/images.json` associe les photos aux identifiants suivants :

| Identifiant | Photo fournie |
| --- | --- |
| mbo-red | 1 MBO Red.jpg |
| mbo-beyond | 1.2 MBO Beyond.jpg |
| mbo-gold | 1.3 MBO Gold.jpg |
| gauloises-blue | 2 Gauloises Blondes Blue.jpg |
| lm-red | 3 LM Red Label.jpg |
| rym | 4 Rym.jpg |
| winston-red | 5 Winston Filsters Red.jpg |
| pm-blue | 6 Philip Morris Blue.jpg |
| pm-silver | 6.1 Philip Morris Silver.jpg |
| ld-red | 7 LD Red.jpg |
| ld-club | 7.3 LD Club Red.jpg |
| lucky-original | 8 Lucky Strike Original.jpg |
| camel-yellow | 11 Camel Filters Yellow.jpg |
| nassim | 12 Nassim.jpg |
| business-royals | Business Royals.jpg |
| esse | Esse .jpg |
| hp-silver | HP Silver.jpg |
| rothmans | Rothmans Signature.jpg |

Exemple de manifeste : `{ "mbo-red": "/products/mbo-red.jpg" }`.

Les noms commerciaux affichés sont ceux du classement du classeur (orthographe Winston corrigée). La photo Esse visible indique « Sense 5mg », tandis que le classeur indique « Edge 5Mg » : faire confirmer la correspondance avant terrain.

## Direction visuelle et références

Vert #00BB31, noir #101111, blanc et blanc cassé #F6F5F0. La palette contemporaine est référencée sur [Brandfetch JTI](https://brandfetch.com/jti.com). La page [JTI Afrique du Nord et de l’Ouest](https://www.jti.com/en/our-company/where-we-operate/northern-western-africa) est la référence utilisateur ; son téléchargement direct a présenté un checkpoint de sécurité. Le logo est celui fourni par l’utilisateur dans le dossier Drive.

La demande de simplification privilégie des titres sans empattements, deux choix de parcours et un stepper fixe. Les polices locales sont Manrope et Noto Sans Arabic, distribuées via Google Fonts. Le skill `ux-writing-arabic` du dépôt demandé est installé dans `.agents/skills/ux-writing-arabic`. Les recommandations consultées proviennent de Ponytail, Arabic Design, UX Writing Arabic, UI UX Pro Max, Codebase Design de Matt Pocock et Impeccable (passe de finition).

Sources composants : [shadcn/ui](https://ui.shadcn.com/), [Smooth UI](https://smoothui.dev/r/animated-tabs.json), [Tailark](https://tailark.com/r/motion-primitives-animated-group.json). Les composants copiés conservent leur structure ; les tabs sont adaptés aux libellés accessibles et au clavier RTL.

## GitHub et Vercel

Le projet Next.js est à la racine du dépôt GitHub `sidjamyl/JTI-SURVEYS` (le checkout local est dans `survey/`). Importer ce dépôt dans Vercel, framework Next.js, commande `npm run build`, sortie `out`. Ces réglages sont versionnés dans `vercel.json`. Aucun secret ni variable d’environnement n’est nécessaire au formulaire statique.

Les entretiens sont transmis à WinDev, qui est responsable de leur sauvegarde.

## Vérification du questionnaire

`tests/fixtures/questionnaire.json` est extrait du classeur source : 17 questions consommateur, 13 questions détaillant, 18 références ordonnées. Les tests vérifient les codes, le nombre de choix, les routages, les limites numériques, les exports et les trois langues. Voir `AUDIT.md` pour les points du classeur qui restent à confirmer.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` compile et publie automatiquement `main` sur GitHub Pages. `NEXT_PUBLIC_BASE_PATH` est défini au build Pages à partir du sous-chemin du dépôt ; il reste vide pour Vercel et pour le développement local. Les scripts Next.js, les polices, le logo et les photos utilisent ce sous-chemin.

Les tests navigateur acceptent `SURVEY_TEST_URL` pour vérifier la version déployée.

## Versions dédiées et WinDev Mobile

Les branches `consumer` et `retailer` servent le même formulaire avec choix de parcours, avec un Dockerfile complet pour Dokploy. Le pont reprend `WL.Execute` du dépôt Camel : à la validation finale, `Reponse(json)` reçoit un entretien avec les réponses en clair en anglais. `window.reponse()` permet aussi la lecture depuis WinDev. Voir [le flow WinDev](docs/WINDEV.md), [les réglages Dokploy](docs/DOKPLOY.md) et [un exemple JSON](docs/example-response.json).
