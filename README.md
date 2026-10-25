# AfrikEdge — Test technique SEFS1026

Module de planification des transports développé dans le cadre du recrutement au poste de **Software Engineer Full-Stack
Senior**.

## 1. Installation et démarrage

### Prérequis

- Node.js et pnpm
- Docker et Docker Compose

### Installation des dépendances

Depuis la racine du projet :

```bash
pnpm install
```

### Configuration de l'environnement

Créer les fichiers `.env` du frontend et du backend à partir des exemples fournis :

```bash
cp ./apps/frontend/.env.example ./apps/frontend/.env
cp ./apps/backend/.env.example ./apps/backend/.env
```

Adapter les variables si nécessaire selon l'environnement local.

### Démarrage de la base de données

Lancer SQL Server avec Docker Compose :

```bash
docker compose up -d
```

### Démarrage de l'application

Depuis la racine du projet :

```bash
pnpm run dev
```

Cette commande démarre le frontend et le backend en mode développement.

## 2. Choix techniques

La stack principale étant imposée par l'énoncé, les choix techniques se sont essentiellement portés sur l'organisation
du code et les outils complémentaires.

- **NestJS et TypeScript :** organisation du backend en modules, contrôleurs, services et repositories, afin de séparer
  les responsabilités et faciliter la maintenance.
- **SQL Server et mssql :** utilisation de requêtes SQL paramétrées, sans ORM, conformément aux exigences du test. Les
  opérations nécessitant plusieurs écritures sont regroupées dans des transactions.
- **Vue 3 et Pinia :** gestion de l'interface utilisateur et des états partagés.
- **Tailwind CSS :** choisi pour sa simplicité et ma maîtrise de l'outil, qui me permettent de développer rapidement des
  interfaces cohérentes.
- **Zod :** validation des données entrantes avec des schémas explicites et réutilisables.

L'objectif était de conserver une architecture simple, lisible et adaptée au périmètre de l'exercice, sans introduire de
complexité inutile.

## 3. Limites et améliorations possibles

J'ai privilégié l'implémentation des fonctionnalités obligatoires et le respect des règles métier.

Certains éléments pourraient être complétés avec davantage de temps :

- **Tests :** étendre les tests unitaires aux autres modules, au-delà des ordres de transport.
- **Tests d'intégration :** vérifier les interactions réelles entre l'API et SQL Server, notamment les transactions et
  les accès concurrents.
- **Tests de bout en bout :** couvrir les principaux parcours utilisateur depuis l'interface.
- **Internationalisation :** ajouter la traduction anglaise de l'interface, proposée en bonus dans l'énoncé.

Ayant reçu le sujet un samedi soir, j'ai principalement disposé du week-end pour le réaliser. J'ai donc choisi de
concentrer mes efforts sur les fonctionnalités attendues, plutôt que sur les améliorations facultatives.

## 4. Temps réellement consacré

J'ai consacré **environ 8 à 10 heures** à ce projet.

Ce temps est notamment lié à mon niveau de familiarité avec NestJS. Bien que je comprenne son architecture et ses
principes, je suis plus rapide et plus à l'aise avec une approche Node.js / Express.js, qui me laisse davantage de
liberté dans l'organisation du code.

NestJS impose un cadre plus structuré auquel j'ai dû me réadapter pendant l'exercice.

J'ai néanmoins tenu à respecter les conventions du framework et à produire une implémentation compréhensible,
maintenable et cohérente avec les attentes du test.
