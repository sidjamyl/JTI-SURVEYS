# Dokploy — deux services JTI Surveys

## Installation sur ce VPS

Le projet **JTI Surveys**, environnement **production**, est créé et déployé dans Dokploy avec deux applications.

| Service | URL HTTPS temporaire | Branche |
| --- | --- | --- |
| consumer | https://jti-surveys-consumer-romd1a-8efbe1-169-58-156-78.sslip.io | `consumer` |
| retailer | https://jti-surveys-retailer-klatnh-49454f-169-58-156-78.sslip.io | `retailer` |

Les services utilisent le fournisseur Git public et le Dockerfile du dépôt. Pour publier une mise à jour, pousser sur la branche correspondante puis cliquer **Deploy** dans son application Dokploy ; aucun webhook automatique n’est configuré. Aucun compte, jeton ou clé API n’a été créé pour cette installation : les fonctions locales de Dokploy ont été appelées depuis son conteneur sur le VPS.

Ces adresses générées par Dokploy peuvent être remplacées dans **Domains** par vos domaines métier. Le stockage navigateur est propre à chaque origine : exporter les entretiens avant un changement de domaine.

## Projet et services

Créer le projet **JTI Surveys**, environnement **production**, puis deux applications :

| Réglage | Consommateur | Détaillant |
| --- | --- | --- |
| Nom | consumer | retailer |
| Dépôt Git | https://github.com/sidjamyl/JTI-SURVEYS.git | identique |
| Branche | consumer | retailer |
| Build path | / | / |
| Type de build | Dockerfile | Dockerfile |
| Dockerfile | Dockerfile | Dockerfile |
| Docker context | . | . |
| Port du domaine | 8080 | 8080 |

Dans chaque application, ajouter votre domaine dans **Domains**, chemin `/`, port **8080**, activer HTTPS/Let's Encrypt après avoir pointé le DNS sur ce VPS, puis **Deploy**. Choisir deux hôtes différents pour séparer les données locales des deux parcours. Ne pas définir `NEXT_PUBLIC_BASE_PATH` : les services sont servis à la racine. Aucun token Dokploy ne doit être placé dans le dépôt ou dans le navigateur.

Les branches fixent le parcours dans `lib/deployment.ts` : aucune variable de sélection n'est requise. Les deux branches contiennent le Dockerfile complet.

## Image

Le build Node 22 installe depuis le lockfile, vérifie TypeScript et les tests, puis produit l'export statique Next. Le conteneur final Nginx fonctionne sans root, sert les fichiers et dispose d'un healthcheck HTTP. Aucun service Node, base de données ou volume n'est nécessaire à ce formulaire statique. Le HTTPS est terminé par le proxy Dokploy.

Vérification manuelle :

```sh
# Dans la branche consumer ou retailer
 docker build -t jti-survey .
 docker run --rm -p 8080:8080 jti-survey
```

Les dossiers de développement, les secrets `.env*` et les fichiers Git sont exclus du contexte Docker par `.dockerignore`.

## Mises à jour

Déployer chaque branche dans son application. Pour ajouter une modification commune, la reporter dans les deux branches en conservant leur valeur `fixedMode`. Les données du navigateur sont propres au domaine : changer d'hôte ne les transfère pas. WinDev doit récupérer et sauvegarder le JSON via le pont décrit dans `WINDEV.md`.
