# KURA — Simplifions le quotidien des IDEL

**KURA** est une solution numérique **offline-first** destinée aux **infirmières et infirmiers libéraux (IDEL)**. Elle se compose d'une **application mobile** pour l'usage terrain (tournées, dossiers patients, transmissions) et d'un **back office web** pour la gestion de la structure (comptes, patients, supervision).

L'objectif est simple : **faire gagner du temps** sur l'administratif et l'organisation des tournées, y compris dans les zones à faible couverture réseau, tout en respectant les exigences propres aux **données de santé** (RGPD, trajectoire HDS).

> Projet étudiant — M2 DEV, ECV. Réalisé en binôme (Hugo Potier & Sacha Debusschère).

---

## ✨ Fonctionnalités principales

- **Authentification sécurisée** — email + mot de passe, MFA, biométrie (Face ID / Touch ID), session offline (JWT local).
- **Gestion des patients** — dossiers, géolocalisation, isolation multi-tenant par structure, conformité RGPD.
- **Planning intelligent** — optimisation de tournée (algorithme TSP / nearest-neighbor + 2-opt), réordonnancement manuel (drag & drop), ajout d'urgences, pause déjeuner, navigation GPS vers le prochain patient.
- **Transmissions** — saisie par texte (templates) ou dictée vocale (transcription IA Whisper), validation humaine obligatoire, historique / audit trail.
- **Constantes vitales** — saisie et visualisation graphique (tension, glycémie, poids, température, SpO₂).
- **Mode offline-first** — l'application reste fonctionnelle sans réseau (SQLite local chiffré), avec synchronisation bidirectionnelle dès le retour de la connexion.
- **Back office web** — gestion des structures, des IDEL, des patients, et supervision des tournées.

---

## 🏗️ Architecture

Monorepo géré avec **Turborepo** + **pnpm workspaces** :

```
idel-app/
├── apps/
│   ├── mobile/        # Application mobile (Expo / React Native)
│   └── web/           # Back office + API REST (Next.js App Router)
├── packages/
│   ├── db/            # Schémas Drizzle, migrations, seeds (SQLite mobile + PostgreSQL serveur)
│   └── shared/        # Types & utilitaires partagés (ex. génération d'ULID)
└── _bmad-output/      # Livrables de cadrage (PRD, architecture, epics & user stories)
```

- **Base de données partagée** : un même schéma Drizzle décline une version **SQLite** (mobile, offline) et **PostgreSQL** (serveur, hébergé sur Neon).
- **API REST** exposée par le back office Next.js (`/api/v1/...`), consommée par le mobile.

---

## 🧰 Stack technique

| Domaine | Technologies |
|---|---|
| Mobile | Expo SDK 53, React Native 0.79, React 19, Expo Router v4, React Native Paper |
| Web / API | Next.js 15 (App Router), React 19 |
| Langage | TypeScript 5 (strict) |
| Base de données | Drizzle ORM — SQLite (`expo-sqlite`) côté mobile, PostgreSQL (Neon) côté serveur |
| Authentification | BetterAuth (MFA / FIDO2) |
| État & données | Zustand, TanStack Query |
| IA embarquée | Whisper (transcription vocale on-device) |
| Géocodage | Nominatim (OpenStreetMap) |
| Notifications | Firebase Cloud Messaging |
| Outillage | Turborepo, pnpm, ESLint, Jest (mobile), Vitest (web) |

---

## ✅ Prérequis

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`corepack enable` recommandé)
- Une base **PostgreSQL** (ex. [Neon](https://neon.tech))
- Pour le mobile : l'application **Expo Go** ou un simulateur **iOS / Android**

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-depot> idel-app
cd idel-app

# 2. Installer les dépendances (tout le monorepo)
pnpm install
```

---

## ⚙️ Configuration

Chaque package/app possède son fichier d'environnement. Copiez les exemples et renseignez vos valeurs.

### `packages/db/.env.local`
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

### `apps/web/.env.local`
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
BETTER_AUTH_URL=http://localhost:3000
# RESEND_API_KEY=...   # (optionnel) envoi d'emails
```

### `apps/mobile/.env` (voir `apps/mobile/.env.example`)
```env
# Origine du backend Next.js (sans /api/v1)
# Émulateur Android : http://10.0.2.2:3000  |  Appareil physique : http://<IP_LAN>:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
```

---

## 🗄️ Base de données

```bash
# Appliquer les migrations Drizzle
pnpm --filter @kura/db db:migrate

# Jeu de données de démonstration (structure, IDEL, patients — zone Lille)
pnpm --filter @kura/db db:seed

# Jeu de données de démonstration zone Béthune (patients, planning du jour,
# transmissions, constantes, candidats d'urgence)
pnpm --filter @kura/db db:seed:bethune

# Explorer la base avec Drizzle Studio
pnpm --filter @kura/db db:studio
```

> Le seed Béthune accepte deux variables optionnelles : `STRUCTURE_ID` et `IDEL_EMAIL` pour cibler une structure / un IDEL précis.

---

## ▶️ Lancement

### Tout le monorepo (Turborepo)
```bash
pnpm dev
```

### Back office web uniquement
```bash
pnpm --filter web dev     # http://localhost:3000
```

### Application mobile uniquement
```bash
pnpm --filter mobile start   # puis i (iOS) / a (Android) / scan QR avec Expo Go
# ou directement :
pnpm --filter mobile ios
pnpm --filter mobile android
```

> ⚠️ Le mobile a besoin que le back office web tourne et que `EXPO_PUBLIC_API_URL` pointe vers une URL **accessible depuis l'appareil** (utilisez l'IP de votre machine sur le réseau local pour un téléphone physique, et non `localhost`).

---

## 🧪 Tests

```bash
pnpm test                    # tous les tests (via Turbo)
pnpm --filter mobile test    # tests mobile (Jest)
pnpm --filter web test       # tests web (Vitest)
```

---

## 🔐 Sécurité & conformité

- **Données de santé** : RGPD respecté dès la conception, trajectoire vers un hébergement **HDS** certifié pour la production.
- **Isolation multi-tenant** stricte : toute requête est bornée par `structure_id`.
- **Chiffrement** des données locales au repos (SQLite), authentification forte (MFA / biométrie).
- **Validation humaine obligatoire** des transcriptions IA avant enregistrement.

---

## 📜 Scripts utiles (récapitulatif)

| Commande | Description |
|---|---|
| `pnpm dev` | Lance tout le monorepo |
| `pnpm build` | Build de production |
| `pnpm lint` | Lint de l'ensemble |
| `pnpm test` | Lance tous les tests |
| `pnpm --filter @kura/db db:migrate` | Migrations base de données |
| `pnpm --filter @kura/db db:seed` | Données de démo (Lille) |
| `pnpm --filter @kura/db db:seed:bethune` | Données de démo (Béthune) |
| `pnpm --filter @kura/db db:studio` | Drizzle Studio |

---

## 📄 Licence

Projet étudiant — usage pédagogique.
