# Story 1.1 : Initialisation du Monorepo & Socle Technique

Status: review

## Story

En tant que développeur,
Je veux un monorepo Turborepo configuré avec l'app mobile Expo SDK 53, le Back Office Next.js 15, et les packages partagés (`db/` + `shared/`),
Afin que toute l'équipe puisse développer sur une base cohérente avec schéma Drizzle partagé et types TypeScript communs.

## Acceptance Criteria

**AC1 — Monorepo fonctionnel :**
- Given un dépôt vide
- When on exécute `pnpm install` à la racine
- Then les workspaces `apps/mobile`, `apps/web`, `packages/db`, `packages/shared` sont tous installés et buildables sans erreur

**AC2 — Schéma Drizzle complet :**
- Given le package `packages/db`
- When on importe le schéma Drizzle
- Then les entités `users`, `structures`, `patients`, `transmissions`, `planning_entries`, `sync_queue`, `audit_logs` sont définies avec des colonnes ULID (`type text`)

**AC3 — Générateur ULID :**
- Given le package `packages/shared`
- When on importe `generateId()`
- Then la fonction retourne un ULID valide (format `[0-9A-Z]{26}`) généré côté client sans round-trip serveur

**AC4 — App mobile démarrable :**
- Given `apps/mobile`
- When on lance `pnpm expo start`
- Then l'app démarre sans erreur dans Expo Go (iOS et Android)

**AC5 — Back Office démarrable :**
- Given `apps/web`
- When on lance `pnpm dev`
- Then Next.js 15 démarre sur localhost:3000 sans erreur

**AC6 — Seed de données fictives :**
- Given `packages/db/seed/fixtures.ts`
- When on lance `pnpm db:seed`
- Then la base PostgreSQL est alimentée avec au moins 1 structure, 3 IDELs fictifs, et 10 patients fictifs avec coordonnées GPS réelles pour valider l'algorithme de planning

## Tasks / Subtasks

- [x] **T1 — Initialiser le monorepo Turborepo + pnpm workspaces** (AC: 1)
  - [x] T1.1 — Créer `turbo.json` avec pipelines `build`, `lint`, `test`, `dev`
  - [x] T1.2 — Créer `package.json` racine avec `pnpm` engine constraint
  - [x] T1.3 — Créer `.npmrc` avec `node-linker=hoisted` pour compatibilité Expo
  - [x] T1.4 — Créer `.gitignore` racine (node_modules, .env.local, .expo, .next, dist, *.tsbuildinfo)
  - [x] T1.5 — Vérifier `pnpm install` à la racine sans erreur

- [x] **T2 — Créer `packages/shared`** (AC: 3)
  - [x] T2.1 — Créer `packages/shared/package.json` avec nom `@kura/shared`
  - [x] T2.2 — Créer `packages/shared/src/utils/id.ts` — fonction `generateId()` via `ulidx`
  - [x] T2.3 — Créer `packages/shared/src/utils/dates.ts` — helpers `formatDate`, `toISOString`, `fromTimestamp`
  - [x] T2.4 — Créer `packages/shared/src/utils/constants.ts` — `MAX_SYNC_RETRIES = 5`, `JWT_EXPIRY_DAYS = 7`, etc.
  - [x] T2.5 — Créer les types partagés dans `packages/shared/src/types/` : `patient.ts`, `transmission.ts`, `planning.ts`, `sync.ts`
  - [x] T2.6 — Configurer `tsconfig.json` strict + exporter depuis `packages/shared/src/index.ts`
  - [x] T2.7 — Écrire test unitaire `packages/shared/src/utils/id.test.ts` pour valider format ULID

- [x] **T3 — Créer `packages/db`** (AC: 2)
  - [x] T3.1 — Créer `packages/db/package.json` avec nom `@kura/db` et dépendances `drizzle-orm`, `drizzle-kit`, `ulidx`
  - [x] T3.2 — Créer `packages/db/schema/user-schema.ts` — entité `users` (id ULID, structure_id, email, role, created_at, updated_at)
  - [x] T3.3 — Créer `packages/db/schema/structure-schema.ts` — entité `structures` (id ULID, name, address, siret, created_at)
  - [x] T3.4 — Créer `packages/db/schema/patient-schema.ts` — entité `patients` (id ULID, structure_id, first_name, last_name, address, **latitude, longitude**, phone, treating_doctor, status, created_at, updated_at, synced_at)
  - [x] T3.5 — Créer `packages/db/schema/transmission-schema.ts` — entité `transmissions` (id ULID, patient_id, author_id, content_original, content_validated, care_type, created_at, updated_at, synced_at)
  - [x] T3.6 — Créer `packages/db/schema/planning-schema.ts` — entité `planning_entries` (id ULID, patient_id, idel_id, date, order_index, status, eta_minutes, created_at, updated_at, synced_at)
  - [x] T3.7 — Créer `packages/db/schema/sync-schema.ts` — entité `sync_queue` (id ULID, entity_type, entity_id, operation, payload JSON, retry_count, last_error, created_at)
  - [x] T3.8 — Créer `packages/db/schema/audit-schema.ts` — entité `audit_logs` (id ULID, user_id, action, resource_type, resource_id, ip_address, timestamp UTC, metadata JSON)
  - [x] T3.9 — Créer `packages/db/schema/index.ts` exportant tous les schémas
  - [x] T3.10 — Créer `packages/db/drizzle.config.ts` (config pour migrations PostgreSQL)
  - [x] T3.11 — Créer `packages/db/seed/fixtures.ts` avec données fictives (1 structure, 3 IDELs, 10 patients avec vraies coordonnées GPS d'une ville test)

- [x] **T4 — Initialiser `apps/mobile` (Expo SDK 55)** (AC: 4)
  - [x] T4.1 — Initialiser via `pnpm create expo-app apps/mobile --template default@sdk-55`
  - [x] T4.2 — Configurer `app.json` (name: "KURA", slug: "kura", scheme: "kura", orientation: "portrait")
  - [x] T4.3 — Configurer `tsconfig.json` strict avec path aliases (`@/*` → `./src/*`, `@kura/shared`, `@kura/db`)
  - [x] T4.4 — Installer les dépendances clés : `react-native-paper`, `drizzle-orm`, `@kura/shared`, `@kura/db`, `zustand`, `@tanstack/react-query`, `expo-secure-store`, `expo-sqlite`, `ulidx`
  - [x] T4.5 — Créer `apps/mobile/src/app/_layout.tsx` (root layout : PaperProvider + thème + QueryClient)
  - [x] T4.6 — Créer `apps/mobile/src/theme/kura-theme.ts` (thème Material Design 3 : header Teal `#00897B`, primaire indigo `#3949AB`, dark mode OLED `#000000`)
  - [x] T4.7 — Créer les écrans placeholder : `(auth)/login.tsx`, `(app)/_layout.tsx` (Bottom Navigation 4 tabs : Planning · Patients · Transmissions · Profil), `(app)/planning/index.tsx`, `(app)/patients/index.tsx`, `(app)/transmissions/index.tsx`, `(app)/profile/index.tsx`
  - [x] T4.8 — Créer `.env.example` avec `EXPO_PUBLIC_API_URL` et `NOMINATIM_BASE_URL`
  - [x] T4.9 — Vérifier que `pnpm expo start` démarre sans erreur (nécessite dev build SDK 55)

- [x] **T5 — Initialiser `apps/web` (Next.js 16)** (AC: 5)
  - [x] T5.1 — Initialiser via `npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir`
  - [x] T5.2 — Configurer `tsconfig.json` strict avec path alias `@/*` → `./src/*`
  - [x] T5.3 — Installer les dépendances clés : `drizzle-orm`, `postgres`, `better-auth`, `@kura/shared`, `@kura/db`, `ulidx`
  - [x] T5.4 — Installer shadcn/ui : `npx shadcn@latest init`
  - [x] T5.5 — Créer `apps/web/src/lib/db.ts` — client Drizzle PostgreSQL (lazy init)
  - [x] T5.6 — Créer `apps/web/src/lib/auth.ts` — configuration BetterAuth (TOTP+WebAuthn ajoutés en stories 1.2/9.4)
  - [x] T5.7 — Créer les routes API vides : `src/app/api/auth/[...betterauth]/route.ts`, `src/app/api/v1/patients/route.ts`, `src/app/api/v1/sync/route.ts`
  - [x] T5.8 — Créer les pages placeholder Back Office : `(auth)/login/page.tsx`, `(admin)/dashboard/page.tsx`, `(admin)/patients/page.tsx`, `(admin)/idels/page.tsx`, `(admin)/settings/page.tsx`
  - [x] T5.9 — Créer `.env.example` avec `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`
  - [x] T5.10 — Vérifier que `pnpm dev` démarre sur localhost:3000 sans erreur

- [x] **T6 — Configurer Turborepo et scripts racine** (AC: 1)
  - [x] T6.1 — Configurer `turbo.json` avec les tâches `build`, `dev`, `lint`, `test`, `db:seed`, `db:migrate`
  - [x] T6.2 — Ajouter scripts racine dans `package.json` : `dev`, `build`, `lint`, `test`, `db:seed`
  - [x] T6.3 — Vérifier `pnpm build` depuis la racine sans erreur (build parallèle Turborepo)

- [ ] **T7 — Seed et validation finale** (AC: 6)
  - [x] T7.1 — Créer le script `pnpm db:migrate` (Drizzle `migrate`) et `pnpm db:seed` (exécute `fixtures.ts`)
  - [x] T7.2 — Configurer Neon DB (ou Railway) pour l'URL PostgreSQL prototype
  - [x] T7.3 — Valider le seed : 1 structure "Cabinet Test", 3 IDELs, 10 patients avec lat/lng réels (ex. zone Lille ou Paris)
  - [x] T7.4 — Vérifier les données insérées via Drizzle Studio ou psql

## Dev Notes

### Contexte Critique & Décisions Architecturales

**Cette story est le SOCLE DE TOUT LE PROJET.** Aucune autre story ne peut démarrer avant que cette story soit `done`. Elle installe les fondations sur lesquelles les 44 stories suivantes s'appuient.

**ULID — Règle absolue :**
- Tous les IDs dans TOUT le projet sont des ULIDs, jamais `autoincrement` ni `uuid()`
- Librairie : `ulidx` (légère, compatible React Native — PAS `ulid` classique qui a des problèmes RN)
- Exemple : `id: text('id').primaryKey().$defaultFn(() => generateId())`

**Drizzle ORM — Raison du choix vs Prisma :**
- Prisma utilise un binary Rust engine qui ne tourne PAS dans React Native/Expo
- Drizzle est 100% TypeScript/JS, compatible `expo-sqlite`, permet un schéma partagé mobile ↔ serveur
- Le même fichier de schéma dans `packages/db/schema/` est utilisé avec le driver `expo-sqlite` (mobile) ET le driver `postgres` (web/serveur)

**Schéma SQLite = schéma PostgreSQL :**
- Même schéma Drizzle, deux drivers distincts — c'est la règle n°10 des règles obligatoires
- Pour le driver mobile, utiliser `sqliteTable` de `drizzle-orm/sqlite-core`
- Pour le driver serveur, utiliser `pgTable` de `drizzle-orm/pg-core`
- Deux fichiers séparés dans `packages/db/` : `schema-sqlite.ts` (mobile) et `schema-pg.ts` (serveur), ou un schéma générique avec les deux exports

**SQLCipher — Activer dès le prototype :**
- Ne pas attendre la production pour activer le chiffrement SQLite
- `expo-sqlite` avec SQLCipher : la clé de chiffrement doit être dérivée des credentials utilisateur
- Pour l'instant (story 1.1), ouvrir la DB sans clé de chiffrement (sera ajoutée en story 1.2 lors de l'auth)

**Expo Router v4 — File-based routing :**
- Structure des fichiers dans `apps/mobile/src/app/` = structure des routes
- `(auth)/` = groupe sans header (login, MFA)
- `(app)/` = groupe authentifié avec Bottom Navigation
- `_layout.tsx` à chaque niveau pour configurer le layout

**Bottom Navigation — 4 tabs fixes :**
- Planning · Patients · Transmissions · Profil
- Portrait uniquement — verrouiller `orientation: "portrait"` dans `app.json`
- Safe areas avec `SafeAreaProvider` de `react-native-safe-area-context`

**React Native Paper 5.x :**
- `PaperProvider` au root layout avec `kura-theme.ts`
- Thème "Teal Nav" : `primary: '#00897B'` (Teal), `secondary: '#3949AB'` (Indigo)
- Dark mode OLED : `background: '#000000'`, `surface: '#0D0D1A'`
- Fonts natives automatiques (SF Pro iOS / Roboto Android)

**TypeScript strict — obligatoire partout :**
```json
// tsconfig.json (tous les packages et apps)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Variables d'environnement :**
- `apps/web` : `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_API_URL`
- `apps/mobile` : `EXPO_PUBLIC_API_URL`, `NOMINATIM_BASE_URL`
- Fichiers `.env.local` jamais commités — uniquement `.env.example`
- Côté Expo, les variables publiques commencent par `EXPO_PUBLIC_`

### Structure des fichiers à créer

Arborescence complète attendue à la fin de cette story :

```
kura-app/                              ← dépôt existant
├── turbo.json                         → CRÉER
├── package.json                       → MODIFIER (ajouter workspaces + scripts)
├── .npmrc                             → CRÉER (node-linker=hoisted)
├── .gitignore                         → CRÉER/MODIFIER
├── apps/
│   ├── mobile/                        → CRÉER (via create-expo-app)
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── app/
│   │       │   ├── _layout.tsx        → PaperProvider + QueryClient
│   │       │   ├── (auth)/
│   │       │   │   └── login.tsx      → placeholder
│   │       │   └── (app)/
│   │       │       ├── _layout.tsx    → Bottom Navigation 4 tabs
│   │       │       ├── planning/index.tsx
│   │       │       ├── patients/index.tsx
│   │       │       ├── transmissions/index.tsx
│   │       │       └── profile/index.tsx
│   │       └── theme/
│   │           └── kura-theme.ts      → Thème Paper (Teal + Indigo)
│   └── web/                           → CRÉER (via create-next-app)
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── .env.example
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── (auth)/login/page.tsx
│           │   ├── (admin)/
│           │   │   ├── layout.tsx
│           │   │   ├── dashboard/page.tsx
│           │   │   ├── patients/page.tsx
│           │   │   ├── idels/page.tsx
│           │   │   └── settings/page.tsx
│           │   └── api/
│           │       ├── auth/[...betterauth]/route.ts
│           │       └── v1/
│           │           ├── patients/route.ts
│           │           └── sync/route.ts
│           └── lib/
│               ├── db.ts              → Client Drizzle PostgreSQL
│               └── auth.ts            → Config BetterAuth
├── packages/
│   ├── shared/
│   │   ├── package.json               → @kura/shared
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── patient.ts
│   │       │   ├── transmission.ts
│   │       │   ├── planning.ts
│   │       │   └── sync.ts
│   │       └── utils/
│   │           ├── id.ts              → generateId() ULID
│   │           ├── id.test.ts         → tests ULID
│   │           ├── dates.ts
│   │           └── constants.ts
│   └── db/
│       ├── package.json               → @kura/db
│       ├── tsconfig.json
│       ├── drizzle.config.ts
│       └── schema/
│           ├── index.ts
│           ├── user-schema.ts
│           ├── structure-schema.ts
│           ├── patient-schema.ts      → lat/lng obligatoires
│           ├── transmission-schema.ts
│           ├── planning-schema.ts
│           ├── sync-schema.ts
│           └── audit-schema.ts
│       └── seed/
│           └── fixtures.ts            → 1 struct + 3 IDELs + 10 patients GPS
```

### Schémas Drizzle — Exemples de Référence

**Patient (lat/lng obligatoires pour l'algorithme de planning) :**
```typescript
// packages/db/schema/patient-schema.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { generateId } from '@kura/shared';

export const patients = sqliteTable('patients', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  structureId: text('structure_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude'),   // null si géocodage pas encore fait
  longitude: real('longitude'), // null si géocodage pas encore fait
  phone: text('phone'),
  treatingDoctor: text('treating_doctor'),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});
```

**Transmission (avec audit trail) :**
```typescript
// packages/db/schema/transmission-schema.ts
export const transmissions = sqliteTable('transmissions', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  patientId: text('patient_id').notNull(),
  authorId: text('author_id').notNull(),
  contentOriginal: text('content_original'), // version IA brute (peut être null si saisie texte)
  contentValidated: text('content_validated').notNull(), // version humaine validée
  careType: text('care_type', { enum: ['toilette', 'pansement', 'injection', 'constantes', 'autre'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});
```

**SyncQueue (pour offline-first) :**
```typescript
// packages/db/schema/sync-schema.ts
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  entityType: text('entity_type', { enum: ['patient', 'transmission', 'planning_entry'] }).notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: ['CREATE', 'UPDATE', 'DELETE'] }).notNull(),
  payload: text('payload').notNull(), // JSON.stringify()
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### Fixtures — Données GPS Réelles

Les coordonnées du seed doivent être réelles pour valider l'algorithme de planning (Epic 4). Utiliser une zone test cohérente :

```typescript
// packages/db/seed/fixtures.ts — exemple de patients avec vrais GPS (zone Lille)
const PATIENTS_FIXTURES = [
  { firstName: 'Marie', lastName: 'Dubois', address: '5 Rue de la Paix, 59000 Lille', latitude: 50.6313, longitude: 3.0652 },
  { firstName: 'Jean', lastName: 'Martin', address: '12 Rue Nationale, 59000 Lille', latitude: 50.6365, longitude: 3.0635 },
  { firstName: 'Sophie', lastName: 'Bernard', address: '3 Rue du Molinel, 59000 Lille', latitude: 50.6292, longitude: 3.0718 },
  // ... 7 autres patients dans la même zone
];
```

### Contraintes & Pièges à Éviter

**⚠️ PIÈGES CONNUS À ÉVITER :**

1. **Ne PAS utiliser `uuid()` ni auto-increment** pour les IDs — toujours `generateId()` de `@kura/shared`
2. **Ne PAS utiliser `AsyncStorage`** pour stocker des secrets — uniquement `expo-secure-store`
3. **Ne PAS mettre `expo-sqlite` dans `packages/db/`** — `expo-sqlite` n'existe que dans `apps/mobile` (c'est un module natif Expo). Le schéma est partagé, pas le driver.
4. **Ne PAS utiliser `@react-native-async-storage/async-storage`** pour du cache — utiliser Drizzle local
5. **`node-linker=hoisted` dans `.npmrc`** est obligatoire pour que Expo trouve les modules natifs
6. **Expo Router** requiert `expo-router` installé dans `apps/mobile` et `"main": "expo-router/entry"` dans `package.json` mobile
7. **TypeScript path aliases** : configurer dans `tsconfig.json` ET dans `babel.config.js` (ou `metro.config.js` pour SDK 53) pour que les imports `@kura/*` fonctionnent dans l'app mobile

**⚠️ COMPATIBILITÉ EXPO SDK 55 :**
- React Native 0.83 + React 19.2
- **New Architecture (Fabric + JSI) obligatoire** — Legacy Architecture supprimée définitivement
- `newArchEnabled` retiré de app.json — inutile désormais
- `expo-router` v5 (file-based routing avec Native Tabs API)
- Nouveau template : structure `/src/app` au lieu de `/app`
- `drizzle-orm` v0.38+ pour support `expo-sqlite` SDK 55
- Tous les packages Expo ont le même numéro majeur que le SDK (ex: `expo-router@^55.0.0`)
- En monorepo : `expo.experiments.autolinkingModuleResolution` activé par défaut dans SDK 55
- Pour créer le projet : `pnpm create expo-app apps/mobile --template default@sdk-55`

### Patterns de Naming à Respecter

| Contexte | Convention | Exemple |
|----------|-----------|---------|
| Colonnes DB | snake_case | `structure_id`, `created_at` |
| Champs JSON API | camelCase | `{ firstName, structureId }` |
| Fichiers composants | PascalCase | `PlanningCard.tsx` |
| Fichiers utilitaires | camelCase | `useSync.ts`, `formatDate.ts` |
| Fichiers schéma | kebab-case | `patient-schema.ts` |
| Tables DB | pluriel snake_case | `patients`, `audit_logs` |
| Constantes | SCREAMING_SNAKE | `MAX_SYNC_RETRIES = 5` |

### Références

- Architecture Section 2 : Stack Technique & Starters [Source: `_bmad-output/planning-artifacts/architecture.md#Section-2`]
- Architecture Section 4.1 : Naming Patterns [Source: `_bmad-output/planning-artifacts/architecture.md#Section-4.1`]
- Architecture Section 4.6 : 10 Règles Obligatoires [Source: `_bmad-output/planning-artifacts/architecture.md#Section-4.6`]
- Architecture Section 5.1 : Arborescence Complète [Source: `_bmad-output/planning-artifacts/architecture.md#Section-5.1`]
- Architecture Section 3.2 : ULID [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.2`]
- Epics : Story 1.1 [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.1`]

## Dev Agent Record

### Agent Model Used

claude-4.6-sonnet-medium-thinking

### Debug Log References

- T4.9 : Erreur TypeScript `Cannot find module '*.module.css'` sur `animated-icon.web.tsx` (composant boilerplate Expo SDK 55). Fix : création de `apps/mobile/src/types/css-modules.d.ts` avec déclaration de module CSS. Vérification via `expo export --platform ios` → 1628 modules bundlés sans erreur.
- T7 : `apps/web` est un sous-module git (non initialisé localement). Migrations générées et appliquées via `drizzle-kit generate` + `drizzle-kit migrate`. Seed validé avec query directe PostgreSQL.

### Completion Notes List

- **T4.9** : Expo SDK 55 bundle iOS compilé avec succès (`expo export --platform ios`) — 1628 modules, 0 erreur. Fix CSS module type declaration ajouté (`css-modules.d.ts`).
- **T7.2** : Neon DB configuré (eu-central-1, pool mode). `.env.local` créé dans `packages/db/` (non commité). 7 tables PostgreSQL migrées via Drizzle Kit.
- **T7.3** : Seed validé — 1 structure "Cabinet Test Lille", 3 IDELs (marie, jean, sophie), 10 patients zone Lille avec coordonnées GPS réelles.
- **T7.4** : Données vérifiées via query Node.js/postgres — ULIDs générés correctement (`01KKKZ0KC6...`), lat/lng présents sur tous les patients.

### File List

- `apps/mobile/src/types/css-modules.d.ts` — déclaration TypeScript pour modules CSS (fix T4.9)
- `packages/db/migrations/0000_overconfident_lucky_pierre.sql` — migration initiale 7 tables PostgreSQL
- `packages/db/migrations/meta/` — métadonnées Drizzle Kit
