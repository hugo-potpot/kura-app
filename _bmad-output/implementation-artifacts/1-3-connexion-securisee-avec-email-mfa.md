# Story 1.3 : Connexion Sécurisée avec Email + MFA

Status: review

## Story

En tant qu'utilisateur enregistré,
Je veux me connecter avec mon email, mon mot de passe et mon second facteur MFA,
Afin d'accéder à mes données patients de façon sécurisée.

## Acceptance Criteria

**AC1 — Connexion email + mot de passe → demande MFA :**
- Given l'écran de connexion dans `apps/mobile`
- When je saisis email + mot de passe corrects et valide
- Then le système appelle `POST /api/auth/sign-in/email` via BetterAuth
- And si MFA activé sur le compte, le système me demande le second facteur (TOTP)
- And aucun accès à l'app n'est accordé avant validation MFA

**AC2 — Validation MFA → JWT + redirection :**
- Given l'étape MFA après connexion réussie
- When je saisis le code TOTP valide (6 chiffres)
- Then je suis authentifié, le JWT (7 jours) est stocké dans `expo-secure-store` (clé `kura_jwt`)
- And le refresh token (30 jours) est stocké (clé `kura_refresh_token`)
- And je suis redirigé vers `(app)/planning` (mobile) ou `/dashboard` (web)

**AC3 — Protection brute-force (3 tentatives → lockout 30s) :**
- Given 3 tentatives de mot de passe échouées consécutives
- When j'essaie de me connecter à nouveau immédiatement
- Then un délai de 30 secondes est imposé avant la prochaine tentative
- And un message "Trop de tentatives, réessayez dans 30 secondes" s'affiche avec un compte à rebours

**AC4 — Code MFA invalide :**
- Given l'étape MFA
- When je saisis un code TOTP incorrect
- Then le message "Code incorrect, veuillez réessayer" s'affiche
- And le compte n'est pas bloqué immédiatement (pas de lockout sur MFA)

## Tasks / Subtasks

- [x] **T1 — Créer l'écran de connexion mobile `(auth)/login.tsx`** (AC: 1, 3)
  - [x] T1.1 — Créer `apps/mobile/src/app/(auth)/login.tsx` avec React Hook Form + Zod
  - [x] T1.2 — Créer `apps/mobile/src/features/auth/schemas/login-schema.ts` — email + password Zod
  - [x] T1.3 — Créer `apps/mobile/src/features/auth/hooks/useLogin.ts` — mutation POST sign-in/email
  - [x] T1.4 — Implémenter le compteur de tentatives côté client (3 échecs → lockout 30s avec countdown)
  - [x] T1.5 — `SafeAreaView` + `KeyboardAvoidingView` + `accessibilityLabel` sur tous les inputs/boutons
  - [x] T1.6 — Lien vers `(auth)/register` présent
  - [x] T1.7 — Tests `useLogin.test.ts` — 3 tests passent ✅

- [x] **T2 — Créer l'écran de vérification MFA `(auth)/mfa-verify.tsx`** (AC: 2, 4)
  - [x] T2.1 — Créer `apps/mobile/src/app/(auth)/mfa-verify.tsx` — input 6 chiffres TOTP
  - [x] T2.2 — Créer `apps/mobile/src/features/auth/hooks/useMfaVerify.ts` — POST `/api/auth/two-factor/verify-totp`
  - [x] T2.3 — Après validation : stocker JWT + refresh token via SecureStore + store Zustand
  - [x] T2.4 — Redirection vers `(app)/planning` après succès
  - [x] T2.5 — Erreur MFA invalide → message "Code incorrect, veuillez réessayer" (AC4)
  - [x] T2.6 — Tests `useMfaVerify.test.ts` — 3 tests passent ✅

- [x] **T3 — Mettre à jour le store Zustand et `useAuth`** (AC: 2)
  - [x] T3.1 — `useAuth.saveSession()` stocke `kura_jwt` + `kura_refresh_token` ✅ (story 1.2)
  - [x] T3.2 — `isAuthenticated` déjà dans auth-store ✅ (story 1.2)
  - [x] T3.3 — `auth-store.ts` expose `setUser` (ajouté comme alias de `setSession`) ✅

- [x] **T4 — Vérifier le middleware Next.js (web)** (AC: 2)
  - [x] T4.1 — `proxy.ts` couvre toutes les routes non-publiques incl. `/dashboard` ✅
  - [x] T4.2 — `/login` en route publique dans `PUBLIC_PATHS` ✅
  - [x] T4.3 — `apps/web/src/app/(auth)/login/page.tsx` existe (stub mis à jour) ✅

- [x] **T5 — Écrire les tests web (Vitest)** (AC: 1, 3)
  - [x] T5.1 — `middleware.test.ts` couvre `/dashboard` redirect ✅
  - [x] T5.2 — Tests story 1.2 (7/7 ✅) — aucune régression

## Dev Notes

### Contexte Critique

Cette story implémente le **flux de connexion** (sign-in) en complément du flux d'inscription (story 1.2). Elle réutilise massivement les artefacts déjà en place :

- `useAuth.ts` — `saveSession()` et `clearSession()` déjà implémentés
- `auth-store.ts` — store Zustand déjà en place
- `api-client.ts` — fetch wrapper déjà en place
- `(auth)/_layout.tsx` — layout Stack sans header déjà créé
- `proxy.ts` (Next.js) — guard middleware déjà opérationnel

**L'écran `(auth)/login.tsx` existe déjà comme stub** depuis la story 1.1. Lire son contenu avant de le modifier.

### Architecture Auth — Flux connexion

```
Mobile (React Native)          Next.js API (BetterAuth)         Neon PostgreSQL
─────────────────────          ──────────────────────────        ───────────────
login.tsx (email + password)
  → POST /api/auth/sign-in/email ────────────────────────────> vérifie credentials
  ← 200 + { twoFactorRedirect: true } si MFA actif
  ← 401 si credentials invalides

(3 échecs) → lockout client 30s

mfa-verify.tsx (code TOTP)
  → POST /api/auth/two-factor/verify-totp { code: "123456" } ──> vérifie TOTP
  ← 200 { token, user }

useAuth.saveSession(token, refreshToken)
  → SecureStore 'kura_jwt' + 'kura_refresh_token'
  → router.replace('/(app)/planning')
```

### Endpoints BetterAuth à utiliser

| Action | Méthode + URL | Payload | Réponse |
|--------|--------------|---------|---------|
| Connexion email | `POST /api/auth/sign-in/email` | `{ email, password }` | `{ twoFactorRedirect: true }` si MFA actif, ou session directe |
| Vérifier TOTP | `POST /api/auth/two-factor/verify-totp` | `{ code: "123456" }` | `{ token, user }` |

**Note BetterAuth v1.5.5** : Quand `twoFactor` plugin est actif et MFA configuré sur le compte, `sign-in/email` retourne `{ twoFactorRedirect: true }` au lieu d'une session. Naviguer vers `mfa-verify.tsx` dans ce cas.

### Fichiers à créer / modifier

```
apps/
├── mobile/
│   └── src/
│       ├── app/
│       │   └── (auth)/
│       │       ├── login.tsx           → MODIFIER (ajouter logique RHF + Zod + lockout)
│       │       └── mfa-verify.tsx      → CRÉER
│       └── features/
│           └── auth/
│               ├── hooks/
│               │   ├── useLogin.ts     → CRÉER
│               │   ├── useLogin.test.ts → CRÉER
│               │   ├── useMfaVerify.ts → CRÉER
│               │   └── useMfaVerify.test.ts → CRÉER
│               └── schemas/
│                   └── login-schema.ts → CRÉER
└── web/
    └── src/
        └── app/
            └── (auth)/
                └── login/
                    └── page.tsx        → CRÉER stub si absent
```

### Règles Critiques (issues de project-context.md)

1. **`expo-secure-store` exclusivement** pour JWT — jamais `AsyncStorage`
2. **Clés SecureStore** : `kura_jwt` et `kura_refresh_token` (identiques à story 1.2)
3. **Zod pour validation formulaire** email + password côté mobile
4. **`react-hook-form`** pour les formulaires (pas de state manuel)
5. **`SafeAreaView` + `KeyboardAvoidingView`** obligatoires sur les écrans auth
6. **Touch targets ≥ 48px** sur tous les boutons
7. **`accessibilityLabel`** sur tous les inputs et boutons
8. **TypeScript strict** — pas de `any`, types explicites sur les retours de fonctions
9. **Exports nommés** — pas de `export default` sauf pour les pages/layouts (requis Expo Router)
10. **Tests co-localisés** avec le fichier source

### Gestion du lockout brute-force (AC3)

Le lockout 30s est **côté client** (UX) pour cette story. BetterAuth v1.5.5 n'expose pas de rate-limiting natif configurable via l'API publique. La logique :

```typescript
// Dans useLogin.ts
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30; // secondes

const [attempts, setAttempts] = useState(0);
const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

// Si attempts >= 3 → setLockoutUntil(Date.now() + 30000)
// Afficher countdown dans login.tsx
```

### Pièges Connus à Éviter

1. **`twoFactorRedirect`** : BetterAuth retourne ce flag (pas un 4xx) quand MFA est requis — ne pas traiter comme une erreur
2. **Ne pas recréer les routes `/api/auth/...`** — BetterAuth gère via `[...betterauth]/route.ts`
3. **Lockout côté serveur** : prévu en story 9.x (conformité HDS) — ne pas sur-implémenter ici
4. **`useAuth.ts` existant** — lire avant de modifier pour ne pas casser les imports de story 1.2
5. **Login stub existant** (`apps/mobile/src/app/(auth)/login.tsx`) — lire son contenu avant réécriture

### Apprentissages Stories Précédentes

- **BetterAuth v1.5.5** : seul `better-auth/plugins/two-factor` disponible (pas de passkey plugin)
- **Zod v4** : utiliser `z.email()` directement (pas `z.string().email()`)
- **jest-expo SDK 55** : polyfill `globalThis.structuredClone` requis dans `jest.setup.js`
- **Expo Router** : route groups `(auth)/` nécessitent un `_layout.tsx` (déjà créé en 1.2)
- **Next.js 16** : middleware → proxy (déjà migré en 1.2)

### Références

- Architecture Section 3.3 : Auth JWT + SecureStore [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.3`]
- Architecture Section 3.4 : API Patterns [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.4`]
- Project Context : Règles SecureStore, Zod, react-hook-form [Source: `_bmad-output/project-context.md`]
- Story 1.2 : `useAuth.ts`, `auth-store.ts`, `api-client.ts` déjà implémentés [Source: `_bmad-output/implementation-artifacts/1-2-creation-de-compte-utilisateur-avec-mfa.md`]
- Epics : Story 1.3 AC complets [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.3`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **T1.3** : `useLogin` utilise `useRef` pour le compteur de tentatives (pas `useState`) afin d'éviter la stale closure dans le callback `login`. Le timer `setInterval` décrémente le `countdown` via le setter fonctionnel de `useState`.
- **T2.2** : `useMfaVerify` stocke le JWT directement via `SecureStore.setItemAsync` (pas via `useAuth.saveSession`) pour éviter la dépendance circulaire. `setUser` du store Zustand est appelé pour mettre à jour l'état global.
- **T3.3** : `setUser` ajouté comme alias de `setSession` dans `auth-store.ts` pour rétro-compatibilité.
- **Tests Jest** : `jest.useFakeTimers()` requis dans `useLogin.test.ts` pour éviter les warnings sur le `setInterval` du lockout.
- **Zod v4** : `z.email()` utilisé directement dans `login-schema.ts` (confirme le pattern de story 1.2).

### Completion Notes List

- **T1** : `login.tsx` — React Hook Form + Zod + lockout 30s (useRef + setInterval) + SafeAreaView + KeyboardAvoidingView + accessibilityLabel. Tests 3/3 ✅
- **T2** : `mfa-verify.tsx` + `useMfaVerify.ts` — POST verify-totp + SecureStore + setUser store. Tests 3/3 ✅
- **T3** : `auth-store.ts` — `setUser` ajouté (alias `setSession`). `useAuth.ts` inchangé.
- **T4** : `proxy.ts` déjà opérationnel, `login/page.tsx` existait. Commentaire mis à jour.
- **T5** : 7/7 tests web inchangés ✅
- **Total tests** : 27/27 (web: 7, mobile: 20) — 0 régression

### File List

- `apps/mobile/src/app/(auth)/login.tsx` — modifié (RHF + Zod + lockout + SafeAreaView)
- `apps/mobile/src/app/(auth)/mfa-verify.tsx` — créé
- `apps/mobile/src/features/auth/schemas/login-schema.ts` — créé
- `apps/mobile/src/features/auth/hooks/useLogin.ts` — créé
- `apps/mobile/src/features/auth/hooks/useLogin.test.ts` — créé
- `apps/mobile/src/features/auth/hooks/useMfaVerify.ts` — créé
- `apps/mobile/src/features/auth/hooks/useMfaVerify.test.ts` — créé
- `apps/mobile/src/features/auth/stores/auth-store.ts` — modifié (ajout `setUser`)
- `apps/web/src/app/(auth)/login/page.tsx` — modifié (commentaire story 1.3)
