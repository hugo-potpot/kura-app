# Story 1.4 : Authentification Biométrique (Face ID / Touch ID)

Status: review

## Story

En tant qu'utilisateur IDEL,
Je veux activer l'authentification biométrique pour les sessions suivantes,
Afin d'accéder à l'app en moins d'une seconde sans ressaisir mon mot de passe + MFA à chaque ouverture.

## Acceptance Criteria

**AC1 — Proposition biométrique après première connexion :**
- Given la première connexion réussie avec email + MFA (sortie de `mfa-verify.tsx`)
- When l'appareil supporte Face ID / Touch ID / empreinte digitale (`hasHardwareAsync` + `isEnrolledAsync`)
- Then l'app navigue vers `(auth)/biometric-setup` et propose d'activer la biométrie (bouton "Activer" + "Plus tard")
- And si l'appareil ne supporte pas la biométrie, l'app navigue directement vers `(app)/planning` sans afficher d'écran ni d'erreur

**AC2 — Biométrie activée → prompt à l'ouverture de l'app :**
- Given la biométrie activée (`kura_biometric_enabled = 'true'` dans SecureStore)
- When l'app démarre (cold start) avec un JWT valide en SecureStore
- Then le prompt Face ID / Touch ID s'affiche immédiatement via `LocalAuthentication.authenticateAsync()`
- And l'accès est accordé en cas de succès sans ressaisir les credentials

**AC3 — 2 échecs biométriques → fallback email + MFA :**
- Given la biométrie activée et le prompt affiché
- When je rate l'authentification biométrique 2 fois consécutives
- Then l'app redirige vers `(auth)/login` pour une connexion classique
- And le compteur d'échecs est remis à zéro

**AC4 — Appareil sans biométrie → ignoré silencieusement :**
- Given un appareil sans hardware biométrique ou sans biométrie enregistrée
- When je me connecte pour la première fois
- Then l'étape de proposition biométrique est ignorée silencieusement (aucun écran affiché, aucune erreur)

## Tasks / Subtasks

- [x] **T1 — Créer le hook `useBiometric`** (AC: 1, 2, 3, 4)
  - [x] T1.1 — Créer `apps/mobile/src/features/auth/hooks/useBiometric.ts`
  - [x] T1.2 — `checkAvailability()` → `hasHardwareAsync()` + `isEnrolledAsync()` — retourne `boolean`
  - [x] T1.3 — `enable()` → `SecureStore.setItemAsync('kura_biometric_enabled', 'true')`
  - [x] T1.4 — `disable()` → `SecureStore.setItemAsync('kura_biometric_enabled', 'false')`
  - [x] T1.5 — `isEnabled()` → `SecureStore.getItemAsync('kura_biometric_enabled')` — retourne `boolean`
  - [x] T1.6 — `authenticate()` → `LocalAuthentication.authenticateAsync()` — retourne `boolean`
  - [x] T1.7 — Tests `useBiometric.test.ts` — 6 tests passent ✅

- [x] **T2 — Créer l'écran `(auth)/biometric-setup.tsx`** (AC: 1, 4)
  - [x] T2.1 — Créer `apps/mobile/src/app/(auth)/biometric-setup.tsx`
  - [x] T2.2 — Afficher titre + description + bouton "Activer" + bouton "Plus tard"
  - [x] T2.3 — "Activer" → `enable()` + `router.replace('/(app)/planning')`
  - [x] T2.4 — "Plus tard" → `disable()` + `router.replace('/(app)/planning')`
  - [x] T2.5 — `SafeAreaView` + `accessibilityLabel` + `minHeight: 48` ✅

- [x] **T3 — Modifier `useMfaVerify.ts` pour router vers `biometric-setup`** (AC: 1, 4)
  - [x] T3.1 — Après `verify-totp` réussi, appeler `checkAvailability()`
  - [x] T3.2 — Si disponible ET `kura_biometric_enabled === null` → `router.replace('/(auth)/biometric-setup')`
  - [x] T3.3 — Sinon → `router.replace('/(app)/planning')` (comportement préservé)
  - [x] T3.4 — Tests `useMfaVerify.test.ts` — 4/4 ✅ (1 nouveau test routing biometric-setup)

- [x] **T4 — Modifier `(app)/_layout.tsx` pour le prompt biométrique au démarrage** (AC: 2, 3)
  - [x] T4.1 — Sur montage : JWT présent ET `isEnabled()` → déclencher `authenticate()`
  - [x] T4.2 — Compteur d'échecs via `useRef<number>` (MAX = 2)
  - [x] T4.3 — Succès → `biometricFailsRef.current = 0`, accès accordé
  - [x] T4.4 — 2 échecs → `router.replace('/(auth)/login')` + reset compteur
  - [x] T4.5 — Si `isEnabled() === false` → comportement JWT seul (inchangé)

## Dev Notes

### Contexte Critique

Cette story s'appuie massivement sur les artefacts existants :

- **`expo-local-authentication`** déjà installé (story 1.2, `PasskeySetup.tsx`)
- **`PasskeySetup.tsx`** — contient déjà le pattern `hasHardwareAsync` + `isEnrolledAsync` + `authenticateAsync` — réutiliser ce pattern dans `useBiometric.ts`
- **`useMfaVerify.ts`** — actuellement navigue directement vers `(app)/planning` — à modifier (T3)
- **`(app)/_layout.tsx`** — a déjà le guard JWT — à étendre avec le prompt biométrique (T4)
- **SecureStore keys existantes** : `kura_jwt`, `kura_refresh_token`
- **Nouvelle clé SecureStore** : `kura_biometric_enabled` (`'true'` | `'false'` | `null` si jamais demandé)

### Architecture Biométrique

```
Flux post-login (première fois) :
──────────────────────────────────
mfa-verify.tsx
  → verify-totp success
  → useBiometric().checkAvailability()
    ├── true  → kura_biometric_enabled === null ?
    │           ├── oui → router.replace('/(auth)/biometric-setup')
    │           └── non → router.replace('/(app)/planning')
    └── false → router.replace('/(app)/planning')   // AC4 : silencieux

biometric-setup.tsx
  → "Activer"    → enable() → kura_biometric_enabled = 'true'  → planning
  → "Plus tard"  → disable() → kura_biometric_enabled = 'false' → planning

Flux cold start (app ouverte avec JWT valide) :
───────────────────────────────────────────────
(app)/_layout.tsx mount
  → getToken() → JWT présent
  → isEnabled() → 'true' ?
    ├── oui → authenticate()
    │         ├── success  → accès accordé (pas de redirection)
    │         └── échec    → failsRef.current++
    │                        ≥ 2 → router.replace('/(auth)/login')
    └── non → comportement actuel (JWT check seul)
```

### Clé SecureStore Biométrique

| Valeur | Signification |
|--------|--------------|
| `null` | Jamais demandé (première connexion pas encore faite) |
| `'true'` | Biométrie activée par l'utilisateur |
| `'false'` | Utilisateur a choisi "Plus tard" / désactivé |

### Fichiers à créer / modifier

```
apps/mobile/src/
├── app/
│   ├── (auth)/
│   │   └── biometric-setup.tsx     → CRÉER
│   └── (app)/
│       └── _layout.tsx             → MODIFIER (T4)
└── features/
    └── auth/
        └── hooks/
            ├── useBiometric.ts     → CRÉER
            ├── useBiometric.test.ts → CRÉER
            ├── useMfaVerify.ts     → MODIFIER (T3)
            └── useMfaVerify.test.ts → MODIFIER (T3.4)
```

### Règles Critiques

1. **`expo-secure-store`** pour `kura_biometric_enabled` — jamais `AsyncStorage`
2. **`expo-local-authentication`** uniquement — pas d'autre lib biométrique
3. **Silencieux si pas de biométrie** — AC4 : aucune erreur, aucun log visible utilisateur
4. **Compteur d'échecs en mémoire** (`useRef`) — remis à zéro après succès ou redirection
5. **SafeAreaView + accessibilityLabel** sur `biometric-setup.tsx`
6. **Touch targets ≥ 48px** sur tous les boutons
7. **TypeScript strict** — pas de `any`
8. **Exports nommés** sauf page Expo Router (export default)
9. **Tests co-localisés** avec le fichier source

### Pièges Connus à Éviter

1. **Ne pas bloquer le montage** du layout sur `LocalAuthentication` — utiliser `useEffect` + `async` IIFE
2. **`authenticateAsync` peut être annulé** par l'utilisateur → résultat `{ success: false, error: 'user_cancel' }` → NE PAS compter comme un échec
3. **`hasHardwareAsync` ≠ `isEnrolledAsync`** — les deux sont nécessaires : le hardware peut exister sans empreinte enregistrée
4. **`useMfaVerify.ts`** : lire le fichier actuel avant de le modifier pour ne pas casser les tests existants (3/3 ✅)
5. **Pas de `router.replace` en dehors de `useEffect`** dans les layouts Expo Router (provoque des warnings)

### Apprentissages Stories Précédentes

- **`expo-local-authentication` v55** : API stable, `authenticateAsync({ promptMessage, cancelLabel })` fonctionne
- **`PasskeySetup.tsx`** : pattern déjà validé — réutiliser `hasHardwareAsync` + `isEnrolledAsync`
- **jest-expo SDK 55** : `globalThis.structuredClone` polyfill dans `jest.setup.js` ✅
- **`jest.useFakeTimers()`** pour les tests avec timers (pattern validé en `useLogin.test.ts`)
- **`expo-secure-store` mock** : `jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), getItemAsync: jest.fn(), deleteItemAsync: jest.fn() }))` (pattern de `useMfaVerify.test.ts`)

### Références

- Architecture Section 3.3 : Auth JWT + SecureStore [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.3`]
- Story 1.2 : `PasskeySetup.tsx`, `expo-local-authentication` pattern [Source: `_bmad-output/implementation-artifacts/1-2-creation-de-compte-utilisateur-avec-mfa.md`]
- Story 1.3 : `useMfaVerify.ts`, `useAuth.ts`, `auth-store.ts` [Source: `_bmad-output/implementation-artifacts/1-3-connexion-securisee-avec-email-mfa.md`]
- Project Context : Règles SecureStore, accessibilityLabel, touch targets [Source: `_bmad-output/project-context.md`]
- Epics : Story 1.4 AC complets [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.4`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **T3** : `useMfaVerify.test.ts` — ajout de mocks `expo-local-authentication` et extraction de `mockReplace` en variable de module pour pouvoir asserter l'appel cross-hook.
- **T4** : `(app)/_layout.tsx` — le prompt biométrique ne compte pas `user_cancel` comme un échec (comportement `authenticateAsync` : `{ success: false, error: 'user_cancel' }`). Le compteur `biometricFailsRef` est en `useRef` pour ne pas déclencher de re-render.
- **useBiometric** : `authenticate()` retourne directement `boolean` (pas `{ success: boolean }`) pour simplifier la consommation dans le layout.

### Completion Notes List

- **T1** : `useBiometric.ts` — 5 fonctions (checkAvailability, enable, disable, isEnabled, authenticate). Tests 6/6 ✅
- **T2** : `biometric-setup.tsx` — SafeAreaView + 2 boutons (Activer/Plus tard) avec accessibilityLabel + minHeight 48px ✅
- **T3** : `useMfaVerify.ts` — routing vers `/(auth)/biometric-setup` si biométrie dispo et jamais configurée. Tests 4/4 ✅
- **T4** : `(app)/_layout.tsx` — prompt biométrique au cold start, 2 échecs max → redirect login ✅
- **Total tests** : 34/34 (web: 7, mobile: 27) — 0 régression

### File List

- `apps/mobile/src/features/auth/hooks/useBiometric.ts` — créé
- `apps/mobile/src/features/auth/hooks/useBiometric.test.ts` — créé
- `apps/mobile/src/features/auth/hooks/useMfaVerify.ts` — modifié (routing biometric-setup)
- `apps/mobile/src/features/auth/hooks/useMfaVerify.test.ts` — modifié (1 test ajouté)
- `apps/mobile/src/app/(auth)/biometric-setup.tsx` — créé
- `apps/mobile/src/app/(app)/_layout.tsx` — modifié (prompt biométrique cold start)
