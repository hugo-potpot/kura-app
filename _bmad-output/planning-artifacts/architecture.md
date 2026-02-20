---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
workflowStatus: complete
completedAt: 2026-02-20
inputDocuments:
  - type: prd
    path: '_bmad-output/planning-artifacts/prd.md'
    loaded: true
  - type: product-brief
    path: '_bmad-output/planning-artifacts/product-brief-idel-app-2026-01-21.md'
    loaded: true
  - type: validation-report
    path: '_bmad-output/planning-artifacts/validation-report-prd-2026-01-21.md'
    loaded: true
  - type: ux-design
    path: '_bmad-output/planning-artifacts/ux-design-specification.md'
    loaded: true
workflowType: 'architecture'
project_name: 'idel-app'
user_name: 'Potpot'
date: '2026-02-20'
---

# Architecture Decision Document — KURA (idel-app)

_Ce document se construit de manière collaborative, étape par étape. Les sections sont ajoutées au fur et à mesure des décisions architecturales prises ensemble._

---

## Section 1 — Analyse du Contexte Projet

### 1.1 — Vue d'Ensemble des Exigences

**Exigences Fonctionnelles — 84 FRs sur 8 domaines :**

| Domaine | FRs | Poids Architectural |
|---------|-----|-------------------|
| Authentification & Comptes | FR1–FR8 | 🔴 Critique — MFA/FIDO2 + JWT offline |
| Structures & Utilisateurs | FR9–FR15 | 🟠 Élevé — Multi-tenant RBAC |
| Gestion Patients | FR16–FR27 | 🟠 Élevé — Isolation HDS, CRUD + géolocalisation |
| Planning Intelligent | FR28–FR38 | 🔴 Critique — Algorithme TSP géo-optimisé |
| Transmissions & Documentation | FR39–FR48 | 🔴 Critique — IA vocale locale + audit trail |
| Mode Offline & Synchronisation | FR49–FR58 | 🔴 Critique — SQLite ↔ PostgreSQL bidirectionnel |
| Notifications & Alertes | FR59–FR67 | 🟡 Moyen — Firebase FCM |
| Back Office Web (Admin) | FR68–FR75 | 🟠 Élevé — Interface web + import CSV |

**Exigences Non-Fonctionnelles critiques :**

| NFR | Exigence | Impact Architectural |
|-----|---------|---------------------|
| NFR-PERF-2 | Planning généré < 5s pour 15 patients | Algorithme s'exécute en local (offline) |
| NFR-SEC-1 | AES-256 au repos + TLS 1.3 en transit | SQLCipher local + chiffrement serveur |
| NFR-SEC-7 | Hébergeur HDS certifié | Contrainte infrastructure (partenaire imposé) |
| NFR-REL-1 | 100% fonctionnel sans réseau | Offline-first comme pilier architectural |
| NFR-REL-2 | 0 perte de données (queue persistante) | Sync robuste avec retry exponentiel |
| NFR-SCAL-1 | Architecture 10x croissance | Services découplés, base de données scalable |

---

### 1.2 — Contraintes Techniques & Dépendances

**Stack imposée / fortement orientée :**
- **Mobile** : React Native + Expo (décision PRD, rapidité MVP)
- **Stockage local** : SQLite via Prisma ORM + SQLCipher (AES-256)
- **Serveur** : PostgreSQL (hébergeur HDS certifié)
- **Auth** : BetterAuth + FIDO2/WebAuthn
- **IA vocale** : Superwhisper / Whisper on-device (transcription locale obligatoire)
- **Notifications** : Firebase Cloud Messaging (iOS + Android)
- **Design System** : React Native Paper (UX Spec finalisée)

**Contraintes réglementaires (non négociables) :**
- Hébergeur HDS certifié pour PostgreSQL (AWS HDS, OVH HDS, ou équivalent)
- Logs d'audit immuables — 3 ans de rétention minimum
- Données médicales séparées des données administratives architecturalement
- Chiffrement bout en bout — données ne quittent jamais l'appareil non chiffrées
- Isolation multi-tenant stricte — étanchéité absolue entre structures

**Dépendances externes :**
- Service de géocodage : Nominatim/OpenStreetMap (gratuit, respecte RGPD) ou Google Maps Geocoding API
- Service de calcul de routes : OSRM ou OpenRouteService (open source, peut tourner offline/cache)
- Superwhisper SDK / librairie Whisper embarquée (on-device, 0 cloud)
- Firebase (FCM + Crashlytics + Performance Monitoring)
- `react-native-maps` (cartographie planning tournée)

---

### 1.3 — Contrainte Architecturale Clé : Algorithme de Planning Géo-Optimisé

L'algorithme d'optimisation du planning exploite les **coordonnées géographiques (latitude / longitude)** des adresses patients pour calculer les meilleurs parcours de tournée.

**Modèle de données Patient :**
- Champs `latitude: Float` et `longitude: Float` obligatoires sur l'entité `Patient`
- Géocodage déclenché à la création ou modification de l'adresse d'un patient
- Coordonnées stockées localement (SQLite) pour fonctionnement offline de l'algorithme

**Algorithme offline-first :**
- Exécution 100% locale sur l'appareil mobile (pas de dépendance serveur)
- Entrées : `[{ patientId, lat, lng, careDuration, timeWindowStart, timeWindowEnd, priority }]`
- Calcul de distance : formule **Haversine** (MVP — simple, offline, précis sur courtes distances)
- Contraintes métier IDEL intégrées au-delà de la distance géographique pure :
  - Fenêtres horaires patients (patient à jeun → visite ≤ 9h)
  - Durée variable des soins (toilette 45 min vs injection 10 min)
  - Préférences IDEL (zones géographiques prioritaires, FR36)
  - Insertion optimale d'urgences en temps réel (FR33)
- Heuristique MVP : **Nearest Neighbor + 2-opt** (performant < 5s pour 15 patients, NFR-PERF-2)
- Post-MVP : matrice de temps de trajet réels (OSRM/OpenRouteService) + ML adaptatif

**Pipeline de géocodage :**
```
Adresse patient saisie
  → Appel API géocodage (Nominatim OSM, gratuit/RGPD-safe)
  → Stockage lat/lng dans SQLite local
  → Disponible offline pour l'algorithme de planification
  → Affiché sur react-native-maps (carte tournée, FR34)
```

**Fallback si géocodage impossible (hors ligne / adresse inconnue) :**
- Patient sans coordonnées → placé en fin de liste avec avertissement visuel
- IDEL peut réordonner manuellement via drag & drop (FR30)

---

### 1.4 — Périmètre & Complexité

**Domaine primaire :** Mobile healthcare (iOS + Android) + Back Office web

**Niveau de complexité : Élevé**

| Indicateur | Détail |
|-----------|--------|
| Réglementation | HDS + RGPD + déontologie infirmière française |
| Offline-first sécurisé | SQLite chiffré + sync bidirectionnelle données de santé |
| Algorithme géo-spatial local | TSP adapté IDEL, exécuté on-device |
| IA vocale embarquée | Whisper on-device, 0 cloud |
| Multi-tenant strict | Isolation complète entre structures |
| Double plateforme | Mobile natif React Native + Web back office |
| RBAC multi-rôles | Admin / IDEL collaborateur / Médecin prescripteur |

**Composants architecturaux identifiés (10) :**
1. App mobile React Native/Expo (offline-first)
2. API backend REST/JSON (Node.js)
3. Base PostgreSQL HDS (données médicales)
4. Base SQLite locale chiffrée (SQLCipher — on-device)
5. Service de synchronisation bidirectionnelle
6. Module algorithme planning (TSP géo-optimisé, local)
7. Module transcription vocale (Whisper embarqué, local)
8. Back Office web (React/Next.js)
9. Firebase (FCM, Crashlytics, Performance)
10. Service géocodage (Nominatim OSM)

---

### 1.5 — Préoccupations Transversales Identifiées

| Préoccupation | Portée | Orientation Architecturale |
|--------------|--------|---------------------------|
| Sécurité & chiffrement | Tout le système | AES-256, TLS 1.3, SQLCipher |
| Offline-first | App mobile entière | SQLite = source de vérité locale |
| Multi-tenancy | API + BDD + logs | Isolation dès le modèle de données |
| Audit logging | Toutes mutations données santé | Middleware immuable, append-only |
| RBAC | API + UI + Back Office | Guards centralisés (rôle + structure) |
| Performance algorithme planning | Module planning local | Haversine + Nearest Neighbor + 2-opt |
| Géocodage | Entité Patient | Pipeline async avec fallback gracieux |

---

## Section 2 — Stack Technique & Starters Sélectionnés

### 2.1 — Architecture Monorepo (Turborepo)

**Justification :** KURA comprend deux applications distinctes (mobile + web) qui partagent des domaines métier identiques (Patient, Transmission, Planning). Un monorepo Turborepo permet le partage de types TypeScript et du schéma Drizzle entre les deux surfaces, garantissant la cohérence sans duplication.

**Structure du monorepo :**

```
kura-app/
├── apps/
│   ├── mobile/          → App React Native / Expo SDK 53
│   └── web/             → Back Office Next.js 15 + API Routes
├── packages/
│   ├── shared/          → Types TypeScript partagés (Patient, Transmission, etc.)
│   ├── db/              → Schéma Drizzle ORM partagé (SQLite local + PostgreSQL serveur)
│   └── ui/              → Composants partagés (optionnel post-MVP)
├── turbo.json
└── package.json         → Workspaces pnpm
```

---

### 2.2 — App Mobile : Expo SDK 53

**Version :** Expo SDK 53 (stable — React Native 0.79 + React 19)

**Commande d'initialisation :**

```bash
npx create-expo-app@latest apps/mobile --template blank-typescript
```

**Décisions architecturales fournies par le starter :**

| Domaine | Décision |
|---------|----------|
| Langage | TypeScript strict |
| Navigation | Expo Router v4 (file-based routing) |
| Architecture | New Architecture (Fabric + JSI) activée par défaut SDK 53 |
| Build | Expo EAS Build (iOS + Android) |
| OTA Updates | Expo Updates (hotfixes sans revalidation store) |
| Tests | Jest + React Native Testing Library |

**Modules Expo critiques pour KURA :**

| Module | Usage KURA |
|--------|-----------|
| `expo-sqlite` | Base SQLite locale offline-first |
| `expo-location` | GPS pour géocodage et carte planning |
| `expo-av` | Enregistrement audio (transmissions vocales) |
| `expo-local-authentication` | Face ID / Touch ID / empreinte digitale |
| `@react-native-firebase/messaging` | Push notifications FCM |
| `react-native-paper` | Design system (UX Spec finalisée) |
| `react-native-maps` | Carte tournée (MapToggleSection C7) |
| `drizzle-orm` + `expo-sqlite` | ORM local offline |

---

### 2.3 — Back Office & API : Next.js 15

**Version :** Next.js 15 (App Router, React 19)

**Commande d'initialisation :**

```bash
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir
```

**Décisions architecturales fournies par le starter :**

| Domaine | Décision |
|---------|----------|
| Langage | TypeScript strict |
| Routing | App Router (layouts, server components) |
| Styling | Tailwind CSS + shadcn/ui (Back Office admin) |
| API | Next.js API Routes (REST/JSON) |
| Auth | BetterAuth (FIDO2/WebAuthn + MFA) |
| ORM serveur | Drizzle ORM → PostgreSQL HDS |
| Tests | Jest + Playwright (E2E) |

---

### 2.4 — Pourquoi Drizzle ORM plutôt que Prisma

Prisma repose sur un engine binaire natif Rust qui ne peut pas être embarqué dans une app React Native. Drizzle est 100% TypeScript/JS, compatible `expo-sqlite`, et permet de partager le même schéma entre le SQLite local (mobile offline) et le PostgreSQL serveur (HDS), avec deux drivers distincts.

| Critère | Prisma | Drizzle |
|---------|--------|---------|
| React Native / Expo SQLite | ❌ Non supporté | ✅ Natif |
| Bundle JavaScript pur | ❌ Binaire Rust externe | ✅ 100% TS/JS |
| Mode offline on-device | ❌ Impossible | ✅ Requêtes SQL directes |
| Schéma partagé mobile ↔ serveur | ⚠️ Deux setups distincts | ✅ Même schéma, deux drivers |
| Taille bundle | ❌ Lourd | ✅ ~7kb |

---

### 2.5 — Package Partagé : Schéma Drizzle

Définition unique des entités dans `packages/db/`, utilisée par l'app mobile (driver `expo-sqlite`) ET le backend web (driver `postgres`) :

```typescript
// packages/db/schema/patient.ts
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  structureId: text('structure_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude'),    // Coordonnées pour l'algorithme de planning
  longitude: real('longitude'),
  phone: text('phone'),
  treatingDoctor: text('treating_doctor'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});
```

---

### 2.6 — Gestionnaire de Paquets & Build

| Outil | Choix | Raison |
|-------|-------|--------|
| Package manager | `pnpm` workspaces | Performance, support monorepo natif |
| Build orchestration | `Turborepo` | Cache build parallèle, pipelines CI |
| Linter | ESLint + Prettier | Standard écosystème React/TypeScript |
| CI/CD mobile | Expo EAS Build | Build cloud iOS + Android sans Mac local |
| CI/CD web | Vercel ou Railway | Next.js (Railway si contrainte HDS européenne) |

**Note :** La première story d'implémentation sera la mise en place du monorepo Turborepo avec les deux apps initialisées et les packages partagés configurés.

---

## Section 3 — Décisions Architecturales Critiques

### 3.1 — Analyse des Priorités

**Décisions Critiques (bloquent l'implémentation) :**
- Stratégie d'identification des entités (IDs offline → serveur)
- Gestion des sessions JWT en mode offline
- Pattern API mobile ↔ backend
- Infrastructure de prototype (données fictives)

**Décisions Importantes (structurent l'architecture) :**
- State management app mobile
- Organisation des routes API

**Décisions Différées (post-MVP) :**
- Migration vers hébergeur HDS certifié réel
- ML adaptatif pour l'algorithme de planning
- Intégration CPAM / DMP

---

### 3.2 — Architecture de Données

**Décision : ULID comme identifiant universel**

Tous les enregistrements (Patient, Transmission, PlanningEntry, Structure, User) utilisent des **ULID** (Universally Unique Lexicographically Sortable Identifier) générés côté client au moment de la création.

**Avantages pour KURA :**
- Généré offline sur l'appareil, valide immédiatement sans round-trip serveur
- Triable lexicographiquement = chronologiquement (`WHERE id > lastSyncedUlid` pour sync incrémentale)
- Aucune collision possible entre appareils offline simultanés
- Compatible SQLite (stocké comme `TEXT`) et PostgreSQL (stocké comme `UUID` ou `TEXT`)

```typescript
// packages/shared/utils/id.ts
import { ulid } from 'ulidx';  // lib légère, compatible RN

export const generateId = () => ulid();
// ex: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
```

**Stratégie de synchronisation incrémentale :**
```
GET /api/sync?since=01ARZ3NDEKTSV4RRFFQ69G5FAV
→ Retourne uniquement les enregistrements créés/modifiés après ce ULID
```

---

### 3.3 — Authentification & Sécurité

**Décision : JWT offline via BetterAuth + Expo SecureStore**

**Flux d'authentification :**
1. Connexion online → BetterAuth émet un JWT signé (HMAC-SHA256) + refresh token
2. JWT stocké dans **Expo SecureStore** (keychain iOS chiffré / keystore Android chiffré par l'OS)
3. En mode offline → JWT validé localement (vérification signature + expiration)
4. Durée de validité JWT : **7 jours** (couvre une semaine de tournées sans reconnexion obligatoire)
5. Refresh token : **30 jours**, renouvellement automatique au prochain passage online
6. Révocation d'appareil : liste noire de JTI (JWT ID) maintenue côté serveur, vérifiée à chaque sync

**Stockage des secrets (prototype) :**
```
Expo SecureStore → JWT + refresh token (chiffré par l'OS)
Variables d'environnement → BETTER_AUTH_SECRET, DATABASE_URL
.env.local → jamais commité (gitignore)
```

**MFA / FIDO2 :**
- BetterAuth gère TOTP (application authenticator) et WebAuthn pour le MVP prototype
- Biométrie : `expo-local-authentication` comme deuxième facteur rapide (après première auth MFA complète)

**Déconnexion automatique :**
- 15 minutes d'inactivité → `AppState` listener + timer → suppression JWT de SecureStore

---

### 3.4 — API & Communication

**Décision : REST/JSON via Next.js API Routes**

**Justification :** REST est idéal pour l'offline-first — chaque requête est indépendante, sérialisable dans la queue de sync, et rejouable avec retry automatique.

**Structure des routes API :**

```
apps/web/src/app/api/
├── auth/[...betterauth]/    → BetterAuth (login, MFA, sessions)
├── patients/
│   ├── route.ts             → GET (liste) / POST (créer)
│   └── [id]/route.ts        → GET / PATCH / DELETE
├── transmissions/
│   ├── route.ts             → GET (liste) / POST (créer)
│   └── [id]/route.ts        → GET / PATCH / DELETE
├── planning/
│   └── [date]/route.ts      → GET planning du jour / PATCH (réordonner)
├── sync/
│   └── route.ts             → POST (push mutations offline) / GET (pull nouveautés)
└── structures/
    └── route.ts             → GET / POST (admin)
```

**Standards :**
- Réponses JSON avec enveloppe `{ data, error, meta }`
- Codes HTTP sémantiques (200, 201, 400, 401, 403, 404, 409, 500)
- Pagination cursor-based (ULID) pour les listes longues
- Rate limiting : 100 req/min/utilisateur (middleware Next.js)
- Versioning : préfixe `/api/v1/` anticipé pour post-MVP

**Gestion des erreurs (standard) :**
```typescript
// Format d'erreur uniforme
{ error: { code: 'PATIENT_NOT_FOUND', message: '...', details?: {} } }
```

---

### 3.5 — State Management Mobile

**Décision : Zustand + TanStack Query**

**Répartition des responsabilités :**

| Couche | Outil | Données gérées |
|--------|-------|---------------|
| Source de vérité locale | Drizzle + `expo-sqlite` | Toutes les données persistées offline |
| Cache serveur & sync | TanStack Query v5 | Requêtes API, invalidation, optimistic updates |
| État UI global | Zustand | Filtres actifs, sélections, queue de sync, statut offline |
| État formulaires | React Hook Form | Formulaires transmission, patient |

**Store Zustand (structure) :**
```typescript
// apps/mobile/src/store/app-store.ts
interface AppStore {
  // Sync
  isOnline: boolean;
  syncQueue: SyncMutation[];
  syncStatus: 'idle' | 'syncing' | 'error';

  // UI State
  activePlanningDate: string;
  selectedPatientId: string | null;
  planningFilters: PlanningFilter[];

  // Actions
  addToSyncQueue: (mutation: SyncMutation) => void;
  processSync: () => Promise<void>;
}
```

---

### 3.6 — Infrastructure & Déploiement (Prototype)

**Contexte : projet étudiant — prototype de soutenance avec données fictives**

L'architecture est **conçue pour être conforme HDS** (isolation multi-tenant, chiffrement, audit logging) mais le prototype tourne sur une infrastructure standard sans hébergeur HDS certifié réel.

**Infrastructure prototype :**

| Composant | Solution Prototype | Solution Production Future |
|-----------|-------------------|--------------------------|
| PostgreSQL | **Neon DB** (serverless, free tier) ou **Railway** | Hébergeur HDS certifié (Scaleway HDS / OVH HDS) |
| API Next.js | **Vercel** (free tier, EU region) | Railway EU ou Scaleway |
| Données | **Fixtures TypeScript** (seed script) | Vraies données patients conformes RGPD |
| Chiffrement SQLite | SQLCipher activé (même en prototype) | Idem |
| Audit logs | Table `audit_logs` en DB (même en prototype) | Logs immuables HDS |

**Seed de données fictives :**
```typescript
// packages/db/seed/fixtures.ts
// Patients fictifs avec coordonnées GPS réelles (zone test)
// Transmissions fictives par type de soin
// Structures et IDELs de test
// Coordonnées lat/lng basées sur une ville réelle pour valider l'algorithme
```

**Variables d'environnement (prototype) :**
```bash
# apps/web/.env.local
DATABASE_URL="postgresql://..."        # Neon DB ou Railway
BETTER_AUTH_SECRET="..."               # Généré avec openssl rand -hex 32
NEXT_PUBLIC_API_URL="http://localhost:3000"

# apps/mobile/.env.local
EXPO_PUBLIC_API_URL="http://localhost:3000"
NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"
```

---

### 3.7 — Analyse d'Impact des Décisions

**Séquence d'implémentation recommandée (dépendances) :**

```
1. Monorepo setup (Turborepo + pnpm)
2. packages/db — Schéma Drizzle + ULID + migrations
3. apps/web — Next.js + BetterAuth + Drizzle PostgreSQL
4. apps/mobile — Expo + Drizzle SQLite + Zustand + BetterAuth
5. Sync engine (queue Zustand → POST /api/sync)
6. Module planning (algorithme Haversine + ULID sort)
7. Module transmissions (Whisper + audit trail)
```

**Dépendances croisées critiques :**
- Le schéma ULID dans `packages/db` doit être finalisé **avant** toute autre implémentation
- BetterAuth doit être configuré **avant** le développement des écrans authentifiés
- La queue de sync Zustand doit être implémentée **avant** tout écran de saisie offline

---

## Section 4 — Patterns d'Implémentation & Règles de Cohérence

### 4.1 — Naming Patterns

**Base de données (Drizzle — snake_case strict) :**

```typescript
// ✅ Correct
const patients = sqliteTable('patients', {        // table : pluriel, snake_case
  id: text('id').primaryKey(),
  structure_id: text('structure_id').notNull(),
  first_name: text('first_name').notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }),
  synced_at: integer('synced_at', { mode: 'timestamp' }),
});

// ❌ Interdit
const Patient = sqliteTable('Patient', { firstName: text('firstName') });
```

**API REST (kebab-case URLs, camelCase JSON) :**
```
✅ GET  /api/v1/patients
✅ GET  /api/v1/patients/:patientId
✅ POST /api/v1/planning-entries
❌ /api/v1/getPatients
❌ /api/v1/patient/:patient_id
```

**Conventions par couche :**

| Contexte | Convention | Exemple |
|----------|-----------|---------|
| Fichiers composants React/RN | PascalCase | `PlanningCard.tsx` |
| Fichiers utilitaires / hooks | camelCase | `useSync.ts`, `formatDate.ts` |
| Fichiers schéma Drizzle | kebab-case | `patient-schema.ts` |
| Routes API Next.js | kebab-case dossier | `planning-entries/route.ts` |
| Stores Zustand | camelCase + `-store` | `app-store.ts`, `sync-store.ts` |
| Colonnes DB | snake_case | `structure_id`, `created_at` |
| Champs JSON API | camelCase | `{ firstName, structureId }` |
| Variables TypeScript | camelCase | `const patientId = ...` |
| Constantes | SCREAMING_SNAKE | `const MAX_SYNC_RETRIES = 5` |

---

### 4.2 — Structure Patterns

**Feature-Based Architecture (mobile + web) :**

```
apps/mobile/src/
├── features/
│   ├── auth/
│   │   ├── components/       → LoginForm.tsx, MFAScreen.tsx
│   │   ├── hooks/            → useAuth.ts
│   │   └── screens/          → LoginScreen.tsx
│   ├── planning/
│   │   ├── components/       → PlanningCard.tsx, MapToggleSection.tsx
│   │   ├── hooks/            → usePlanning.ts
│   │   ├── screens/          → PlanningScreen.tsx
│   │   └── algorithm/        → tsp-optimizer.ts, haversine.ts
│   ├── patients/
│   ├── transmissions/
│   └── sync/
│       ├── queue.ts
│       └── sync-engine.ts
├── store/
│   ├── app-store.ts
│   └── sync-store.ts
├── components/               → Composants vraiment partagés uniquement
├── hooks/
└── theme/
    └── kura-theme.ts
```

**Tests co-localisés :**
```
features/planning/algorithm/tsp-optimizer.ts
features/planning/algorithm/tsp-optimizer.test.ts  ← co-localisé
```

---

### 4.3 — Format Patterns

**Réponse API — enveloppe uniforme :**
```typescript
// ✅ Succès
{ "data": { "id": "01ARZ...", "firstName": "Marie" }, "meta": { "total": 45 } }

// ✅ Erreur
{ "error": { "code": "PATIENT_NOT_FOUND", "message": "Patient introuvable" } }

// ❌ Interdit — réponse directe sans enveloppe
{ "id": "01ARZ...", "firstName": "Marie" }
```

**Codes HTTP sémantiques :**

| Situation | Code |
|-----------|------|
| Création réussie | `201 Created` |
| Lecture / mise à jour | `200 OK` |
| Suppression réussie | `204 No Content` |
| Données invalides | `400 Bad Request` |
| Non authentifié | `401 Unauthorized` |
| Accès interdit (RBAC) | `403 Forbidden` |
| Ressource introuvable | `404 Not Found` |
| Conflit de sync | `409 Conflict` |
| Erreur serveur | `500 Internal Server Error` |

**Dates — ISO 8601 strict :**
```typescript
// ✅ API JSON
{ "createdAt": "2026-02-20T08:30:00.000Z" }
// ✅ SQLite
createdAt: integer('created_at', { mode: 'timestamp' })
// ✅ Affichage UI
format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
```

---

### 4.4 — Patterns de Communication & État

**Queue de synchronisation offline — mutation type :**
```typescript
interface SyncMutation {
  id: string;           // ULID de la mutation
  entityType: 'patient' | 'transmission' | 'planning_entry';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: string;    // ISO 8601
  retryCount: number;   // max 5
  lastError?: string;
}
```

**États de chargement — pattern uniforme :**
```typescript
// ✅ TanStack Query
const { data, isLoading, isError, error } = useQuery(...)
// ✅ Skeleton avant spinner (UX Spec S12.6)
if (isLoading) return <PlanningCardSkeleton />
if (isError)   return <ErrorState error={error} onRetry={refetch} />
```

---

### 4.5 — Patterns de Gestion d'Erreurs

```typescript
// ✅ Toute erreur user-facing a une action (UX Spec S12.2)
<Snackbar
  visible={syncError}
  action={{ label: 'Réessayer', onPress: () => processSync() }}
>Synchronisation échouée</Snackbar>

// ✅ Async — try/catch avec logging
try {
  await syncEngine.push(queue);
} catch (error) {
  logger.error('sync_failed', { error, queueSize: queue.length });
  setSyncStatus('error');
}
```

---

### 4.6 — Règles Obligatoires (Tous Agents)

1. **ULID pour tous les IDs** — jamais auto-increment ni UUID v4 nu
2. **snake_case colonnes DB, camelCase JSON API** — transformation via Drizzle
3. **Enveloppe `{ data, error, meta }` sur toutes les routes API**
4. **Feature-based** — pas de dossiers `components/` globaux sauf composants vraiment partagés
5. **Tests co-localisés** — `feature.test.ts` à côté de `feature.ts`
6. **Dates ISO 8601** en JSON, Unix timestamp en SQLite
7. **Skeleton avant ActivityIndicator** pour les états de chargement
8. **Toute erreur user-facing a une action** (Réessayer ou Annuler minimum)
9. **SecureStore exclusivement** pour JWT et secrets (jamais AsyncStorage)
10. **Schéma SQLite identique à PostgreSQL** — même schéma Drizzle, deux drivers

---

## Section 5 — Structure du Projet & Frontières Architecturales

### 5.1 — Arborescence Complète du Monorepo

```
kura-app/
├── .github/
│   └── workflows/
│       ├── ci-mobile.yml          → EAS Build + tests mobile
│       └── ci-web.yml             → Tests + deploy Next.js
├── apps/
│   ├── mobile/                    → App React Native / Expo SDK 53
│   │   ├── app.json
│   │   ├── eas.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.local
│   │   ├── .env.example
│   │   └── src/
│   │       ├── app/               → Expo Router (file-based routing)
│   │       │   ├── _layout.tsx    → Root layout (Paper Provider, Auth gate)
│   │       │   ├── (auth)/
│   │       │   │   ├── login.tsx
│   │       │   │   └── mfa.tsx
│   │       │   └── (app)/         → Écrans authentifiés
│   │       │       ├── _layout.tsx → Bottom Navigation 4 tabs
│   │       │       ├── planning/
│   │       │       │   ├── index.tsx          → FR28 Planning du jour
│   │       │       │   └── [date].tsx         → Planning date spécifique
│   │       │       ├── patients/
│   │       │       │   ├── index.tsx          → FR25-FR26 Liste + recherche
│   │       │       │   └── [id].tsx           → FR17-FR23 Fiche patient
│   │       │       ├── transmissions/
│   │       │       │   ├── index.tsx          → FR45 Historique
│   │       │       │   └── new.tsx            → FR39-FR42 Saisie
│   │       │       └── profile/
│   │       │           └── index.tsx          → FR15 Profil + FR66 Notifications
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── components/
│   │       │   │   │   └── BiometricPrompt.tsx
│   │       │   │   └── hooks/
│   │       │   │       └── useAuth.ts         → FR2-FR4 Auth + offline JWT
│   │       │   ├── planning/
│   │       │   │   ├── components/
│   │       │   │   │   ├── PlanningCard.tsx        → C1 UX Spec
│   │       │   │   │   ├── CircularProgressRing.tsx → C2 UX Spec
│   │       │   │   │   └── MapToggleSection.tsx     → C7 UX Spec (FR34)
│   │       │   │   ├── hooks/
│   │       │   │   │   └── usePlanning.ts           → FR28-FR38
│   │       │   │   └── algorithm/
│   │       │   │       ├── tsp-optimizer.ts         → FR29 Algorithme TSP
│   │       │   │       ├── tsp-optimizer.test.ts
│   │       │   │       ├── haversine.ts             → Calcul distance lat/lng
│   │       │   │       ├── haversine.test.ts
│   │       │   │       └── geocoding.ts             → Pipeline adresse → lat/lng
│   │       │   ├── patients/
│   │       │   │   ├── components/
│   │       │   │   │   └── ConstantesLineChart.tsx  → C6 UX Spec (FR23)
│   │       │   │   └── hooks/
│   │       │   │       └── usePatients.ts           → FR16-FR27
│   │       │   ├── transmissions/
│   │       │   │   ├── components/
│   │       │   │   │   ├── VoiceRecorderButton.tsx  → C3 UX Spec (FR39)
│   │       │   │   │   └── TranscriptionViewer.tsx  → C4 UX Spec (FR40)
│   │       │   │   └── hooks/
│   │       │   │       └── useTransmissions.ts      → FR39-FR48
│   │       │   ├── notifications/
│   │       │   │   └── notification-handler.ts      → FR59-FR67 Firebase FCM
│   │       │   └── sync/
│   │       │       ├── sync-engine.ts               → FR49-FR58 Sync bidi
│   │       │       ├── sync-engine.test.ts
│   │       │       └── queue.ts                     → Queue mutations offline
│   │       ├── store/
│   │       │   ├── app-store.ts                     → Zustand global
│   │       │   └── sync-store.ts                    → Queue + statut sync
│   │       ├── components/
│   │       │   ├── SyncStatusIndicator.tsx          → C5 UX Spec
│   │       │   ├── TimeSavedWidget.tsx               → C8 UX Spec
│   │       │   ├── ErrorState.tsx
│   │       │   └── Skeleton/
│   │       │       ├── PlanningCardSkeleton.tsx
│   │       │       └── PatientListSkeleton.tsx
│   │       ├── hooks/
│   │       │   ├── useNetworkStatus.ts              → Détection offline/online
│   │       │   └── useHaptics.ts                    → Haptic feedback
│   │       └── theme/
│   │           └── kura-theme.ts                    → Tokens Paper (UX Spec S8)
│   │
│   └── web/                       → Back Office Next.js 15
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── .env.local
│       ├── .env.example
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── (auth)/
│           │   │   └── login/page.tsx
│           │   ├── (admin)/
│           │   │   ├── layout.tsx
│           │   │   ├── dashboard/page.tsx  → FR73 Stats utilisation
│           │   │   ├── patients/
│           │   │   │   ├── page.tsx        → FR69-FR71 Liste + import CSV
│           │   │   │   └── [id]/page.tsx
│           │   │   ├── idels/
│           │   │   │   └── page.tsx        → FR70 Liste IDELs
│           │   │   └── settings/
│           │   │       └── page.tsx        → FR9-FR14 Structure & rôles
│           │   └── api/
│           │       ├── auth/
│           │       │   └── [...betterauth]/route.ts → FR1-FR8 BetterAuth
│           │       └── v1/
│           │           ├── patients/
│           │           │   ├── route.ts             → GET/POST
│           │           │   └── [id]/route.ts        → GET/PATCH/DELETE
│           │           ├── transmissions/
│           │           │   ├── route.ts
│           │           │   └── [id]/route.ts
│           │           ├── planning/
│           │           │   └── [date]/route.ts
│           │           ├── structures/
│           │           │   └── route.ts
│           │           └── sync/
│           │               └── route.ts             → FR49-FR58
│           ├── lib/
│           │   ├── db.ts                  → Drizzle + PostgreSQL client
│           │   ├── auth.ts                → BetterAuth config
│           │   ├── audit-logger.ts        → FR78 Audit logging
│           │   └── rbac.ts               → FR12 Guards RBAC
│           └── middleware.ts              → Auth guard global + RBAC
│
├── packages/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── index.ts
│   │   │   ├── user-schema.ts
│   │   │   ├── structure-schema.ts
│   │   │   ├── patient-schema.ts      → lat/lng inclus
│   │   │   ├── transmission-schema.ts
│   │   │   ├── planning-schema.ts
│   │   │   ├── sync-schema.ts
│   │   │   └── audit-schema.ts
│   │   ├── migrations/
│   │   └── seed/
│   │       └── fixtures.ts            → Données fictives prototype
│   │
│   └── shared/
│       └── src/
│           ├── types/
│           │   ├── patient.ts
│           │   ├── transmission.ts
│           │   ├── planning.ts
│           │   └── sync.ts
│           └── utils/
│               ├── id.ts              → generateId() → ULID
│               ├── dates.ts
│               └── constants.ts
│
├── turbo.json
├── package.json                   → pnpm workspaces
├── .gitignore
└── README.md
```

---

### 5.2 — Flux de Données Principal (Offline-First)

```
[IDEL saisit une transmission]
  → Drizzle INSERT dans expo-sqlite local (instantané, offline)
  → SyncMutation ajoutée à la queue Zustand
  → UI badge "non synchronisé" (SyncStatusIndicator)
  → Réseau disponible → sync-engine.ts POST /api/v1/sync
  → Serveur INSERT dans PostgreSQL + audit_log
  → Réponse 200 → mutation retirée de la queue
  → UI badge "synchronisé"
```

---

### 5.3 — Frontières des Services Externes

| Service | Frontière | Fichier responsable |
|---------|-----------|-------------------|
| Firebase FCM | `features/notifications/` | `notification-handler.ts` |
| Nominatim OSM | `features/planning/algorithm/` | `geocoding.ts` |
| Whisper on-device | `features/transmissions/` | `VoiceRecorderButton.tsx` |
| BetterAuth | `apps/web/src/lib/auth.ts` | Config serveur |
| Expo SecureStore | `features/auth/hooks/useAuth.ts` | JWT storage mobile |

---

### 5.4 — Mapping FRs → Fichiers Clés

| FRs | Fichier principal |
|-----|------------------|
| FR1–FR8 Auth | `api/auth/[...betterauth]/` + `useAuth.ts` |
| FR16–FR27 Patients | `packages/db/schema/patient-schema.ts` + `/api/v1/patients/` |
| FR28–FR38 Planning | `features/planning/algorithm/tsp-optimizer.ts` |
| FR39–FR48 Transmissions | `features/transmissions/` + `VoiceRecorderButton.tsx` |
| FR49–FR58 Sync | `features/sync/sync-engine.ts` + `/api/v1/sync/route.ts` |
| FR59–FR67 Notifications | `features/notifications/notification-handler.ts` |
| FR68–FR75 Back Office | `apps/web/src/app/(admin)/` |
| FR76–FR84 Conformité | `audit-schema.ts` + `audit-logger.ts` |

---

## Section 6 — Validation de l'Architecture

### 6.1 — Validation de Cohérence ✅

| Décision A | Décision B | Compatible ? |
|-----------|-----------|-------------|
| Expo SDK 53 New Architecture | Drizzle + expo-sqlite | ✅ Module officiel Expo, New Arch supporté |
| ULID offline | Sync incrémentale `since=ULID` | ✅ Tri lexicographique = tri chronologique |
| BetterAuth + FIDO2 | JWT offline SecureStore | ✅ BetterAuth émet des JWTs standards |
| Next.js App Router | REST/JSON API Routes | ✅ Pattern natif Next.js 15 |
| Zustand + TanStack Query | Drizzle local | ✅ Drizzle = source de vérité, TQ = cache serveur |
| React Native Paper | Expo SDK 53 | ✅ Paper v5+ supporte React Native 0.79 |
| Turborepo + pnpm | Expo EAS Build | ✅ EAS Build supporte les monorepos pnpm |

**Résultat :** Aucune incompatibilité. Toutes les versions sont compatibles.

---

### 6.2 — Couverture des Exigences Fonctionnelles ✅

| Domaine | FRs | Couverture |
|---------|-----|-----------|
| Auth & Comptes | FR1–FR8 | ✅ BetterAuth + FIDO2 + JWT SecureStore |
| Structures & Rôles | FR9–FR15 | ✅ structure-schema + RBAC guards + Back Office |
| Gestion Patients | FR16–FR27 | ✅ patient-schema (lat/lng) + CRUD API + isolation |
| Planning Intelligent | FR28–FR38 | ✅ tsp-optimizer (Haversine + Nearest Neighbor + 2-opt) |
| Transmissions | FR39–FR48 | ✅ Whisper on-device + audit trail immuable |
| Offline & Sync | FR49–FR58 | ✅ expo-sqlite + sync-engine + retry exponentiel |
| Notifications | FR59–FR67 | ✅ Firebase FCM + notification-handler |
| Back Office | FR68–FR75 | ✅ Next.js (admin) + import CSV + dashboard |
| Conformité HDS/RGPD | FR76–FR84 | ✅ audit-logger + séparation données + wipe sécurisé |

**Résultat : 84/84 FRs couverts architecturalement.**

---

### 6.3 — Couverture des NFRs ✅

| NFR | Exigence | Solution |
|-----|---------|---------|
| NFR-PERF-2 | Planning < 5s | Haversine local + Nearest Neighbor (O(n²), ~1ms pour 15 patients) |
| NFR-SEC-1 | AES-256 | SQLCipher (expo-sqlite) + PostgreSQL chiffré |
| NFR-SEC-2 | MFA obligatoire | BetterAuth + FIDO2/WebAuthn |
| NFR-SEC-4 | Audit logs immuables | audit-schema append-only + audit-logger.ts |
| NFR-SEC-5 | Isolation multi-tenant | `structure_id` sur toutes les tables + guards RBAC |
| NFR-REL-1 | 100% offline | expo-sqlite source de vérité locale |
| NFR-REL-2 | 0 perte de données | Queue Zustand persistante + retry exponentiel |
| NFR-INT-2 | Transcription < 3s | Whisper on-device (modèle tiny/base) |

---

### 6.4 — Analyse des Lacunes

**Lacunes critiques : Aucune.**

**Lacunes importantes (sprint 1) :**
- Choix du modèle Whisper embarqué (tiny vs base) — impacte taille bundle vs qualité transcription
- Stratégie des migrations Drizzle sur SQLite mobile lors des mises à jour OTA

**Lacunes mineures (post-MVP) :**
- Monitoring production : Sentry + Firebase Performance (documenté dans PRD)
- Rotation clés JWT tous les 90 jours (documenté dans PRD NFR-SEC-3)

---

### 6.5 — Statut Final

**Architecture Status : PRÊTE POUR L'IMPLÉMENTATION ✅**

**Niveau de confiance : Élevé**

**Points forts :**
- Offline-first natif — 100% fonctionnel sans réseau
- Schéma Drizzle partagé mobile ↔ serveur — cohérence garantie
- ULID + sync incrémentale — performance optimale
- Feature-based architecture — développement parallèle par feature

---

## Section 7 — Résumé de Complétion

### Workflow Architecture — COMPLÉTÉ ✅

**Date :** 2026-02-20
**Document :** `_bmad-output/planning-artifacts/architecture.md`

**Livrables :**
- 5 catégories de décisions architecturales documentées
- 10 règles d'implémentation obligatoires
- Arborescence complète du monorepo (10 composants)
- 84 FRs mappés à des fichiers spécifiques
- Validation de cohérence complète

**Commandes d'initialisation :**

```bash
# 1. Monorepo Turborepo
npx create-turbo@latest kura-app

# 2. App mobile
npx create-expo-app@latest apps/mobile --template blank-typescript

# 3. Back Office web
npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir
```

**Prochaine phase recommandée :** Création des Epics & Stories (`create-epics-and-stories`)
