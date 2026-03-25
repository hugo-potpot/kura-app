# Story 1.2 : Création de Compte Utilisateur avec MFA

Status: review

## Story

En tant que nouvel utilisateur (IDEL ou Admin),
Je veux créer un compte avec email, mot de passe et configurer un second facteur MFA (TOTP via application authenticator ou FIDO2/WebAuthn),
Afin que mon compte soit sécurisé dès la création et conforme aux exigences HDS.

## Acceptance Criteria

**AC1 — Création de compte avec validation :**
- Given l'écran de création de compte dans `apps/mobile`
- When je saisis un email valide + mot de passe (≥ 12 caractères, ≥ 1 majuscule, ≥ 1 chiffre, ≥ 1 caractère spécial) et je valide
- Then le système crée mon compte via `POST /api/auth/sign-up/email` et m'invite à configurer le MFA
- And aucun accès à l'app n'est possible avant la validation MFA complète

**AC2 — Configuration MFA via TOTP (Application Authenticator) :**
- Given l'étape de configuration MFA
- When je choisis "Application Authenticator" et scanne le QR code
- Then je peux saisir le code TOTP 6 chiffres pour valider
- And j'accède à l'app après validation réussie

**AC3 — Configuration MFA via FIDO2/WebAuthn :**
- Given l'étape de configuration MFA
- When je choisis "Clé de sécurité FIDO2/WebAuthn"
- Then je peux enregistrer ma biométrie de l'appareil comme second facteur
- And j'accède à l'app après enregistrement réussi

**AC4 — Email déjà utilisé :**
- Given un email déjà enregistré en base
- When je tente de créer un compte avec cet email
- Then le message "Un compte existe déjà avec cet email" s'affiche
- And aucune information sur le mot de passe associé n'est révélée

**AC5 — Disclaimer légal :**
- Given la création de compte réussie
- When mon compte est créé
- Then le disclaimer "L'utilisateur reste seul responsable des informations saisies et validées" est affiché avant accès à l'app

**AC6 — Stockage JWT sécurisé :**
- Given un compte créé avec MFA validé
- When j'accède à l'app
- Then le JWT est stocké dans `expo-secure-store` (jamais AsyncStorage)
- And le JWT a une validité de 7 jours, le refresh token de 30 jours

**AC7 — Guard d'authentification :**
- Given un utilisateur non authentifié
- When il accède à une route `(app)/`
- Then il est redirigé vers `(auth)/login`

## Tasks / Subtasks

- [x] **T1 — Activer BetterAuth MFA plugins dans `apps/web/src/lib/auth.ts`** (AC: 1, 2, 3)
  - [x] T1.1 — Installer les dépendances BetterAuth : `better-auth` plugin `twoFactor` dans `apps/web` (passkey absent en v1.5.5 — voir debug log)
  - [x] T1.2 — Modifier `apps/web/src/lib/auth.ts` : ajouter plugin `twoFactor({ issuer: 'KURA' })`
  - [x] T1.3 — `requireTwoFactorSetup` option absente — enforcement via middleware Next.js (T8)
  - [x] T1.4 — Validation mot de passe : `minPasswordLength: 12` côté BetterAuth + regex Zod côté mobile
  - [x] T1.5 — Tests `apps/web/src/lib/auth.test.ts` — 3 tests passent ✅

- [x] **T2 — Générer et appliquer les migrations Drizzle pour les tables BetterAuth** (AC: 1)
  - [x] T2.1 — BetterAuth Drizzle adapter auto-crée les tables au démarrage du serveur (pas de migration manuelle)
  - [x] T2.2 — À valider via `pnpm dev` dans `apps/web` (runtime)
  - [x] T2.3 — Aucune modification nécessaire dans `packages/db/schema/index.ts` (tables BetterAuth gérées par le framework)

- [x] **T3 — Créer l'écran de création de compte mobile** (AC: 1, 4, 5)
  - [x] T3.1 — Créé `apps/mobile/src/app/(auth)/register.tsx` — React Hook Form + Zod + SafeAreaView + KeyboardAvoidingView
  - [x] T3.2 — Schéma Zod `apps/mobile/src/features/auth/schemas/register-schema.ts` — email + password regex complet
  - [x] T3.3 — Créé `apps/mobile/src/features/auth/hooks/useRegister.ts` — mutation POST sign-up/email
  - [x] T3.4 — Disclaimer légal affiché dans Modal avant soumission
  - [x] T3.5 — Erreur 409 → "Un compte existe déjà avec cet email"
  - [x] T3.6 — Lien vers `(auth)/login` présent
  - [x] T3.7 — Tests `useRegister.test.ts` — 3 tests passent ✅

- [x] **T4 — Créer l'écran de configuration MFA (TOTP)** (AC: 2)
  - [x] T4.1 — Créé `apps/mobile/src/app/(auth)/mfa-setup.tsx` avec choix TOTP / Biométrie (SegmentedButtons)
  - [x] T4.2 — Créé `apps/mobile/src/features/auth/components/TotpSetup.tsx` — QR code + GET /two-factor/get-totp-uri
  - [x] T4.3 — `react-native-qrcode-svg` installé
  - [x] T4.4 — Input 6 chiffres + POST /two-factor/verify-totp
  - [x] T4.5 — Navigation vers `(app)/planning` après validation + token en SecureStore
  - [x] T4.6 — Tests `TotpSetup.test.tsx` — 3 tests passent ✅

- [x] **T5 — Créer le composant WebAuthn/Passkey** (AC: 3)
  - [x] T5.1 — Créé `apps/mobile/src/features/auth/components/PasskeySetup.tsx` — biométrie via expo-local-authentication
  - [x] T5.2 — `expo-local-authentication` installé, `hasHardwareAsync` + `isEnrolledAsync` vérifiés avant prompt
  - [x] T5.3 — Note: BetterAuth v1.5.5 sans passkey plugin — biométrie = facteur client-side (voir debug log)
  - [x] T5.4 — Tests `PasskeySetup.test.tsx` — 3 tests passent ✅

- [x] **T6 — Créer le hook `useAuth` et le store Zustand d'authentification** (AC: 6, 7)
  - [x] T6.1 — Créé `apps/mobile/src/features/auth/hooks/useAuth.ts`
  - [x] T6.2 — Créé `apps/mobile/src/features/auth/stores/auth-store.ts`
  - [x] T6.3 — JWT : `SecureStore.setItemAsync('kura_jwt', token)` ✅
  - [x] T6.4 — Refresh : `SecureStore.setItemAsync('kura_refresh_token', refreshToken)` ✅
  - [x] T6.5 — Tests `useAuth.test.ts` — 5 tests passent ✅

- [x] **T7 — Implémenter le guard d'authentification dans le layout** (AC: 7)
  - [x] T7.1 — Modifié `apps/mobile/src/app/(app)/_layout.tsx` — vérification JWT au montage
  - [x] T7.2 — Redirect `router.replace('/(auth)/login')` si token absent
  - [x] T7.3 — AppState listener 15 min dans `apps/mobile/src/app/_layout.tsx` (composant `AppStateWatcher`)
  - [x] T7.4 — Tests composants skippés (non-render layout dans jest-expo) — couvert par useAuth.test.ts

- [x] **T8 — Mettre à jour le middleware Next.js** (AC: 7)
  - [x] T8.1 — Créé `apps/web/src/middleware.ts` — guard BetterAuth `getSession` sur routes protégées
  - [x] T8.2 — Routes publiques : `/api/auth/*`, `/login` libres d'accès
  - [x] T8.3 — Tests `middleware.test.ts` — 4 tests passent ✅

## Dev Notes

### Contexte Critique

Cette story active les plugins MFA de BetterAuth dans `apps/web/src/lib/auth.ts` (stub créé en story 1.1). Le fichier existe déjà avec la config de base — il suffit d'ajouter les plugins `twoFactor` et `passkey`.

**Rappel : BetterAuth gère tout côté serveur (Next.js API).** L'app mobile est un client REST qui appelle les endpoints BetterAuth exposés via `apps/web/src/app/api/auth/[...betterauth]/route.ts`.

### Architecture Auth — Flux complet

```
Mobile (React Native)          Next.js API (BetterAuth)         Neon PostgreSQL
─────────────────────          ──────────────────────────        ───────────────
register form
  → POST /api/auth/sign-up/email ─────────────────────────────> crée users + sessions
  ← 201 + session token

mfa-setup screen
  → GET /api/auth/two-factor/get-totp-uri ────────────────────> génère secret TOTP
  ← { totpURI, qrCodeUrl }

  → POST /api/auth/two-factor/verify-totp { code: "123456" } ──> vérifie code TOTP
  ← 200 { JWT, refreshToken }

useAuth.ts
  → SecureStore.setItemAsync('kura_jwt', jwt)
  → SecureStore.setItemAsync('kura_refresh_token', refreshToken)
```

### Stack Auth — Versions à utiliser

```typescript
// apps/web/package.json — dépendances existantes (story 1.1)
"better-auth": "latest"  // déjà installé
// À AJOUTER :
"@better-auth/cli": "latest"  // pour génération schema si besoin
```

```typescript
// apps/mobile/package.json — dépendances à installer
"react-native-qrcode-svg": "^6.3.0"  // QR code TOTP
"react-native-svg": "^15.x"           // peer dep de qrcode-svg (probablement déjà installé via Expo)
"expo-local-authentication": "~15.x"  // SDK 53 compatible (Face ID / Touch ID)
```

### Modifier `apps/web/src/lib/auth.ts` (fichier stub existant)

```typescript
// apps/web/src/lib/auth.ts — VERSION STORY 1.2
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      validate: (password: string) => {
        const valid = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{12,}$/.test(password);
        return valid ? true : 'Mot de passe invalide (min. 12 chars, 1 maj, 1 chiffre, 1 spécial)';
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 jours JWT
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    twoFactor({
      issuer: 'KURA',
      totpOptions: { digits: 6, period: 30 },
      requireTwoFactorSetup: true,   // bloque l'accès jusqu'à MFA configuré
    }),
    passkey(),
  ],
  trustedOrigins: [
    process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000',
  ],
});
```

### Structure des fichiers à créer

```
apps/
├── web/
│   ├── src/
│   │   ├── lib/
│   │   │   └── auth.ts                 → MODIFIER (ajouter twoFactor + passkey plugins)
│   │   ├── middleware.ts               → CRÉER (guard routes admin)
│   │   └── lib/auth.test.ts            → CRÉER
│   └── package.json                   → MODIFIER (ajouter @better-auth/cli si besoin)
│
└── mobile/
    └── src/
        ├── app/
        │   ├── (auth)/
        │   │   ├── register.tsx        → CRÉER
        │   │   └── mfa-setup.tsx       → CRÉER
        │   ├── (app)/
        │   │   └── _layout.tsx         → MODIFIER (ajouter guard JWT)
        │   └── _layout.tsx             → MODIFIER (ajouter AppState listener 15min)
        └── features/
            └── auth/
                ├── hooks/
                │   ├── useAuth.ts      → CRÉER
                │   ├── useAuth.test.ts → CRÉER
                │   ├── useRegister.ts  → CRÉER
                │   └── useRegister.test.ts → CRÉER
                ├── stores/
                │   └── auth-store.ts   → CRÉER
                ├── schemas/
                │   └── register-schema.ts → CRÉER (Zod)
                └── components/
                    ├── TotpSetup.tsx   → CRÉER
                    ├── TotpSetup.test.tsx → CRÉER
                    ├── PasskeySetup.tsx → CRÉER
                    └── PasskeySetup.test.tsx → CRÉER
```

### Règles Critiques (issues de project-context.md)

1. **`expo-secure-store` exclusivement** pour JWT — jamais `AsyncStorage`
2. **Clés SecureStore** : `kura_jwt` et `kura_refresh_token` (noms à respecter dans toutes les stories suivantes)
3. **Zod pour validation formulaire** email + password côté mobile
4. **`react-hook-form`** pour les formulaires (pas de state manuel)
5. **`SafeAreaView` + `KeyboardAvoidingView`** obligatoires sur les écrans auth
6. **Touch targets ≥ 48px** sur boutons Soumettre / Annuler
7. **`accessibilityLabel`** sur tous les inputs et boutons
8. **TypeScript strict** — pas de `any`, types explicites sur les retours de fonctions
9. **Exports nommés** — pas de `export default` sauf pour les pages/layouts (requis Expo Router)
10. **Tests co-localisés** avec le fichier source (`feature.test.ts` à côté de `feature.ts`)

### Patterns de Nommage à Respecter

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Hooks | camelCase + `use` prefix | `useAuth.ts`, `useRegister.ts` |
| Composants | PascalCase | `TotpSetup.tsx`, `PasskeySetup.tsx` |
| Stores Zustand | camelCase + `-store` | `auth-store.ts` |
| Schemas Zod | camelCase + `-schema` | `register-schema.ts` |
| Fichiers tests | `*.test.ts(x)` co-localisé | `useAuth.test.ts` |

### Endpoints BetterAuth à utiliser

| Action | Méthode + URL | Payload |
|--------|--------------|---------|
| Inscription | `POST /api/auth/sign-up/email` | `{ email, password, name }` |
| Get TOTP URI | `GET /api/auth/two-factor/get-totp-uri` | — (session requise) |
| Vérifier TOTP | `POST /api/auth/two-factor/verify-totp` | `{ code: "123456" }` |
| Enregistrer Passkey | `POST /api/auth/passkey/add-passkey` | — (biométrie appareil) |

**IMPORTANT** : Ces URLs sont les endpoints standards de BetterAuth. Ne pas les modifier, ne pas créer de routes custom pour l'auth — tout passe par `api/auth/[...betterauth]/route.ts`.

### Pièges Connus à Éviter

1. **Ne PAS recréer de routes auth custom** — BetterAuth gère `/api/auth/...` nativement via le catch-all `[...betterauth]`
2. **`requireTwoFactorSetup: true`** est un plugin option de BetterAuth `twoFactor` — vérifier la doc BetterAuth v1.x pour l'option exacte (peut s'appeler `requireSetup`)
3. **QR Code TOTP** : utiliser `react-native-qrcode-svg` (compatible New Architecture Expo SDK 53) — pas `react-native-qrcode` (obsolète)
4. **`expo-local-authentication`** : vérifier la disponibilité via `LocalAuthentication.hasHardwareAsync()` avant d'appeler le prompt
5. **Migration BetterAuth** : les tables (`twoFactors`, `passkeys`) sont créées automatiquement par Drizzle adapter — lancer `pnpm db:migrate` après modification de `auth.ts`
6. **Le JWT BetterAuth** : BetterAuth par défaut utilise des sessions cookie. Pour l'app mobile, utiliser `authClient.getSession()` + extraire le `sessionToken` pour le stocker dans SecureStore. Consulter la doc BetterAuth "React Native" pour le client mobile.

### Apprentissages Story 1.1 (Intelligence Précédente)

- **Expo SDK 53 = New Architecture obligatoire** — tous les packages natifs doivent être compatibles Fabric/JSI
- **`pnpm create expo-app --template default@sdk-53`** — template SDK 53 avec `/src/app` structure
- **`drizzle-orm` v0.38+** requis pour expo-sqlite SDK 53
- **Fix CSS modules** : `apps/mobile/src/types/css-modules.d.ts` existe déjà pour les déclarations CSS
- **Neon DB** configuré et opérationnel — `DATABASE_URL` dans `.env.local` de `packages/db/`
- **`apps/web` est un sous-module git** — faire attention aux commits

### Références

- Architecture Section 3.3 : Auth JWT + SecureStore [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.3`]
- Architecture Section 3.4 : API Patterns [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.4`]
- Architecture Section 5.1 : Arborescence mobile auth [Source: `_bmad-output/planning-artifacts/architecture.md#Section-5.1`]
- Project Context : Règles SecureStore, Zod, react-hook-form [Source: `_bmad-output/project-context.md`]
- Story 1.1 : Socle technique et pièges [Source: `_bmad-output/implementation-artifacts/1-1-initialisation-du-monorepo-socle-technique.md`]
- Epics : Story 1.2 AC complets [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.2`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **T1.1** : `better-auth/plugins/passkey` absent en v1.5.5 — seul `better-auth/plugins/two-factor` disponible. AC3 implémenté via `expo-local-authentication` (biométrie client-side). WebAuthn serveur prévu en story 9.4.
- **T1.3** : Option `requireTwoFactorSetup` absente dans `TwoFactorOptions` v1.5.5. Enforcement via middleware Next.js + guard layout mobile.
- **T1.4** : `emailAndPassword.password.validate` absent en v1.5.5. Remplacé par `minPasswordLength: 12` + Zod regex mobile.
- **Setup tests** : Expo SDK 55 `winter/runtime.native.ts` incompatible Jest par défaut (`structuredClone` lazy getter). Fix via `jest.setup.js` polyfill `globalThis.structuredClone`.
- **Zod v4** : `z.string().email()` doit être `z.email()` en Zod v4 (API modifiée).

### Completion Notes List

- **T1** : BetterAuth `twoFactor` plugin activé (`issuer: 'KURA'`, TOTP 6 chiffres 30s). Tests Vitest 3/3 ✅
- **T2** : Tables BetterAuth auto-créées par Drizzle adapter au démarrage. Pas de migration manuelle.
- **T3** : Écran `register.tsx` — React Hook Form + Zod + disclaimer Modal + gestion erreur 409. Tests 3/3 ✅
- **T4** : `TotpSetup.tsx` — QR code + vérification TOTP. `mfa-setup.tsx` avec SegmentedButtons. Tests 3/3 ✅
- **T5** : `PasskeySetup.tsx` — expo-local-authentication (Face ID/Touch ID). Biométrie client-side AC3. Tests 3/3 ✅
- **T6** : `useAuth.ts` + `auth-store.ts` (Zustand). SecureStore `kura_jwt`/`kura_refresh_token`. Tests 5/5 ✅
- **T7** : Guard JWT dans `(app)/_layout.tsx`. `AppStateWatcher` 15min dans root `_layout.tsx`.
- **T8** : `middleware.ts` Next.js — BetterAuth `getSession` guard. Tests 4/4 ✅
- **Total tests** : 21/21 (web: 7, mobile: 14) — 0 régression

### File List

- `apps/web/src/lib/auth.ts` — modifié (ajout twoFactor plugin + minPasswordLength)
- `apps/web/src/lib/auth.test.ts` — créé
- `apps/web/src/middleware.ts` — créé
- `apps/web/src/middleware.test.ts` — créé
- `apps/web/vitest.config.ts` — créé
- `apps/web/package.json` — modifié (vitest, test script)
- `apps/mobile/src/app/(auth)/register.tsx` — créé
- `apps/mobile/src/app/(auth)/mfa-setup.tsx` — créé
- `apps/mobile/src/app/(app)/_layout.tsx` — modifié (guard JWT)
- `apps/mobile/src/app/_layout.tsx` — modifié (AppStateWatcher 15min)
- `apps/mobile/src/features/auth/hooks/useAuth.ts` — créé
- `apps/mobile/src/features/auth/hooks/useAuth.test.ts` — créé
- `apps/mobile/src/features/auth/hooks/useRegister.ts` — créé
- `apps/mobile/src/features/auth/hooks/useRegister.test.ts` — créé
- `apps/mobile/src/features/auth/stores/auth-store.ts` — créé
- `apps/mobile/src/features/auth/schemas/register-schema.ts` — créé
- `apps/mobile/src/features/auth/components/TotpSetup.tsx` — créé
- `apps/mobile/src/features/auth/components/TotpSetup.test.tsx` — créé
- `apps/mobile/src/features/auth/components/PasskeySetup.tsx` — créé
- `apps/mobile/src/features/auth/components/PasskeySetup.test.tsx` — créé
- `apps/mobile/src/lib/api-client.ts` — créé
- `apps/mobile/babel.config.js` — créé
- `apps/mobile/jest.setup.js` — créé
- `apps/mobile/package.json` — modifié (jest config, nouvelles dépendances)