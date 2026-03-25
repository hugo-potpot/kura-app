# Story 1.5 : Authentification Offline avec JWT Local

Status: review

## Story

En tant qu'IDEL en zone blanche,
Je veux pouvoir m'authentifier sans connexion réseau après ma première connexion online,
Afin de continuer à utiliser l'app même sans 4G/5G pendant ma tournée.

## Acceptance Criteria

**AC1 — JWT valide + offline → accès direct :**
- Given un JWT valide stocké dans SecureStore (émis depuis moins de 7 jours)
- When j'ouvre l'app en mode avion / sans réseau
- Then la signature JWT est validée localement (vérification du claim `exp`) et j'accède à l'app sans réseau
- And toutes les fonctionnalités de l'app restent disponibles (aucune feature grisée)

**AC2 — JWT expiré + offline → message bloquant :**
- Given un JWT expiré (plus de 7 jours sans connexion online) stocké dans SecureStore
- When j'ouvre l'app en mode avion / sans réseau
- Then le message "Connexion internet requise pour renouveler votre session" s'affiche
- And un bouton "Réessayer" est présent pour relancer la vérification

**AC3 — JWT expiré + réseau disponible → renouvellement automatique transparent :**
- Given un refresh token valide (moins de 30 jours) et un réseau disponible
- When l'app détecte un JWT expiré au démarrage
- Then le JWT est renouvelé automatiquement via `POST /api/v1/auth/refresh-token`
- And l'utilisateur accède à l'app normalement sans intervention de sa part
- And le nouveau JWT + refresh token sont sauvegardés dans SecureStore

## Tasks / Subtasks

- [x] **T1 — Installer `expo-network` et créer le hook `useNetworkStatus`** (AC: 1, 2, 3)
  - [x] T1.1 — Installer `expo-network` : `pnpm --filter mobile add expo-network`
  - [x] T1.2 — Créer `apps/mobile/src/lib/useNetworkStatus.ts`
  - [x] T1.3 — `getIsOnline(): Promise<boolean>` → `Network.getNetworkStateAsync()` → `isConnected && isInternetReachable`
  - [x] T1.4 — Créer `apps/mobile/src/lib/useNetworkStatus.test.ts` — 4 tests (online, offline, null reachable, connected+unreachable)

- [x] **T2 — Créer les utilitaires JWT dans `useAuth.ts`** (AC: 1, 2, 3)
  - [x] T2.1 — Ajouter `isJwtExpired(token: string): boolean` dans `useAuth.ts`
  - [x] T2.2 — Ajouter `refreshJwt(): Promise<boolean>` dans `useAuth.ts`
  - [x] T2.3 — Mettre à jour `useAuth.ts` pour exporter les nouvelles fonctions
  - [x] T2.4 — Mettre à jour `apps/mobile/src/features/auth/hooks/useAuth.test.ts` — 14 tests passent

- [x] **T3 — Créer l'écran `(auth)/session-expired.tsx`** (AC: 2)
  - [x] T3.1 — Créer `apps/mobile/src/app/(auth)/session-expired.tsx`
  - [x] T3.2 — `SafeAreaView` + titre "Session expirée" + message complet
  - [x] T3.3 — Bouton "Réessayer" → `router.replace('/(app)/planning/index')`
  - [x] T3.4 — Bouton secondaire "Se reconnecter" → `router.replace('/(auth)/login')`
  - [x] T3.5 — `accessibilityLabel` + `minHeight: 48` sur les deux boutons
  - [x] T3.6 — `export default` (obligatoire pour page Expo Router)

- [x] **T4 — Modifier `(app)/_layout.tsx` pour gérer l'expiration JWT offline** (AC: 1, 2, 3)
  - [x] T4.1 — Logique JWT expiry : `isJwtExpired` → online check → `refreshJwt` → session-expired si échec
  - [x] T4.2 — Import `getIsOnline` + `isJwtExpired` + `refreshJwt`
  - [x] T4.3 — Logique biométrique (story 1.4) préservée intacte, s'exécute APRÈS validation JWT

- [x] **T5 — Créer l'endpoint API `POST /api/v1/auth/refresh-token`** (AC: 3)
  - [x] T5.1 — Créer `apps/web/src/app/api/v1/auth/refresh-token/route.ts`
  - [x] T5.2 — Lire `refreshToken` depuis le body JSON
  - [x] T5.3 — Valider via `auth.api.getSession` avec `Authorization: Bearer <token>`
  - [x] T5.4 — Retourner `{ data: { token, refreshToken } }` en cas de succès
  - [x] T5.5 — Retourner `{ error: { code: 'REFRESH_FAILED', ... } }` 401 si invalide
  - [x] T5.6 — Pas de middleware auth sur cette route

## Dev Notes

### Contexte Critique — Ce qui existe déjà

**SecureStore keys en usage (ne pas renommer) :**
| Clé | Type | Usage | Durée |
|-----|------|-------|-------|
| `kura_jwt` | string | JWT d'accès signé HMAC-SHA256 | 7 jours |
| `kura_refresh_token` | string | Token de renouvellement | 30 jours |
| `kura_biometric_enabled` | `'true'` / `'false'` / null | Biométrie activée (story 1.4) | persistant |

**`useAuth.ts` actuel :** `saveSession`, `clearSession`, `getToken` — ne PAS modifier les signatures existantes, seulement ajouter `isJwtExpired` et `refreshJwt`.

**`(app)/_layout.tsx` actuel :** Déjà modifié en story 1.4 pour le prompt biométrique. Le bloc `useEffect` complet doit être relu avant modification pour ne pas casser AC2/AC3 de story 1.4.

**`auth-store.ts`** : Zustand store avec `user`, `isAuthenticated`, `setSession`, `clearSession`. Pas de modification nécessaire.

### Architecture Offline JWT (Section 3.3 architecture.md)

```
Flux d'authentification offline :
───────────────────────────────────────────────────────────
App démarre (cold start)
  │
  ├── getToken() → null
  │     └── router.replace('/(auth)/login')
  │
  ├── getToken() → JWT présent
  │     ├── isJwtExpired(token) === false  ← JWT valide (< 7 jours)
  │     │     ├── Prompt biométrique si activé (story 1.4)
  │     │     └── Accès app [AC1]
  │     │
  │     └── isJwtExpired(token) === true   ← JWT expiré (≥ 7 jours)
  │           ├── getIsOnline() → true
  │           │     ├── refreshJwt() → succès
  │           │     │     └── Accès app (nouveau JWT) [AC3]
  │           │     └── refreshJwt() → échec
  │           │           └── router.replace('/(auth)/session-expired') [AC2]
  │           └── getIsOnline() → false
  │                 └── router.replace('/(auth)/session-expired') [AC2]

Écran session-expired :
  ├── "Réessayer"      → router.replace('/(app)/planning/index') [re-déclenche le layout]
  └── "Se reconnecter" → router.replace('/(auth)/login')
```

### Note Implementation — BetterAuth Refresh

BetterAuth v1.5.x n'a pas de `refreshSession` API. Le refresh token stocké est en réalité le même token de session BetterAuth. L'endpoint `/api/v1/auth/refresh-token` valide la session via `auth.api.getSession` avec `Authorization: Bearer <token>`. Si la session BetterAuth est encore valide côté serveur, le token est retourné. Si la session a expiré (après 7 jours), l'utilisateur doit se reconnecter.

### Références

- Architecture Section 3.3 : Auth JWT + SecureStore + flux offline [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.3`]
- Project Context : Règles SecureStore, API envelope, TypeScript strict [Source: `_bmad-output/project-context.md`]
- Story 1.4 : `useBiometric.ts`, `(app)/_layout.tsx` modifié, pattern SecureStore [Source: `_bmad-output/implementation-artifacts/1-4-authentification-biometrique-face-id-touch-id.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **T2 / Path fix** : `useAuth.ts` utilisait `/api/auth/refresh-token` (sans `/v1/`). Corrigé en `/api/v1/auth/refresh-token` pour respecter project-context.md. Test mis à jour en conséquence.
- **T5 / BetterAuth API** : `auth.api.refreshSession` n'existe pas en BetterAuth v1.5.x. Utilisation de `auth.api.getSession` avec `Authorization: Bearer <token>` à la place. Le token retourné est le même (BetterAuth gère le TTL via `updateAge`).
- **TotpSetup.test.tsx** : 3 failures pré-existantes avant story 1.5 — non liées à cette implémentation. Aucune régression introduite.

### Completion Notes List

- **T1** : `useNetworkStatus.ts` — `getIsOnline()` via `expo-network`. Tests 4/4 ✅
- **T2** : `useAuth.ts` — `isJwtExpired()` (décodage `atob` natif, check `exp`) + `refreshJwt()` (POST `/api/v1/auth/refresh-token`). Tests 14/14 ✅
- **T3** : `session-expired.tsx` — SafeAreaView + message + boutons "Réessayer" + "Se reconnecter". accessibilityLabel + minHeight 48px ✅
- **T4** : `(app)/_layout.tsx` — logique JWT expiry insérée avant le prompt biométrique. Logique story 1.4 préservée ✅
- **T5** : `apps/web/src/app/api/v1/auth/refresh-token/route.ts` — validation via `auth.api.getSession`, enveloppe `{ data }` / `{ error }` ✅
- **Total tests mobile** : 37/37 (hors TotpSetup pré-existant) — 0 régression ✅
- **Tests web** : 7/7 ✅

### File List

- `apps/mobile/src/lib/useNetworkStatus.ts` — créé
- `apps/mobile/src/lib/useNetworkStatus.test.ts` — créé
- `apps/mobile/src/features/auth/hooks/useAuth.ts` — modifié (ajout isJwtExpired + refreshJwt)
- `apps/mobile/src/features/auth/hooks/useAuth.test.ts` — modifié (9 tests ajoutés)
- `apps/mobile/src/app/(auth)/session-expired.tsx` — créé
- `apps/mobile/src/app/(app)/_layout.tsx` — modifié (logique JWT expiry offline)
- `apps/web/src/app/api/v1/auth/refresh-token/route.ts` — créé
- `apps/mobile/package.json` — modifié (expo-network ajouté)
- `pnpm-lock.yaml` — modifié
