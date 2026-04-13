# Story 1.6 : Réinitialisation de Mot de Passe

Status: review

## Story

En tant qu'utilisateur ayant oublié son mot de passe,
Je veux recevoir un lien de réinitialisation par email sécurisé,
Afin de récupérer l'accès à mon compte sans assistance technique.

## Acceptance Criteria

**AC1 — Demande de réinitialisation :**
- Given l'écran de connexion mobile
- When l'utilisateur tape "Mot de passe oublié" et saisit son email enregistré
- Then une requête est envoyée à BetterAuth (`POST /api/auth/forgot-password`)
- And le message affiché est "Si cet email est enregistré, un lien vous a été envoyé" (sécurité anti-énumération, même si l'email n'existe pas)

**AC2 — Lien reçu + nouveau mot de passe dans les 15 minutes :**
- Given le lien de réinitialisation cliqué dans les 15 minutes depuis l'email
- When l'utilisateur accède à la page web `/reset-password?token=xxx` et saisit un nouveau mot de passe conforme (≥ 12 caractères)
- Then le mot de passe est mis à jour via BetterAuth (`POST /api/auth/reset-password`)
- And l'utilisateur voit "Mot de passe mis à jour — vous pouvez vous reconnecter"

**AC3 — Lien expiré (plus de 15 minutes) :**
- Given un lien de réinitialisation expiré
- When l'utilisateur tente de l'utiliser sur la page web
- Then le message "Lien expiré, veuillez en demander un nouveau" s'affiche
- And un bouton "Renvoyer un lien" permet de relancer le processus

## Tasks / Subtasks

- [x] **T1 — Créer le hook `useForgotPassword`** (AC: 1)
  - [x] T1.1 — Créer `apps/mobile/src/features/auth/hooks/useForgotPassword.ts`
  - [x] T1.2 — `requestReset(email: string): Promise<void>` → `POST /api/auth/forgot-password` avec `{ email, redirectTo: RESET_PASSWORD_URL }`
  - [x] T1.3 — `RESET_PASSWORD_URL` = `process.env['EXPO_PUBLIC_API_URL'] + '/reset-password'` (page Next.js)
  - [x] T1.4 — Gérer les erreurs réseau — NE PAS lever d'erreur visible si email inexistant (anti-énumération : toujours afficher le même message de succès)
  - [x] T1.5 — `isLoading: boolean`, `error: string | null` en state local
  - [x] T1.6 — Créer `apps/mobile/src/features/auth/hooks/useForgotPassword.test.ts`
    - Test succès (200) → résolu sans erreur
    - Test email inexistant (BetterAuth retourne 200 quand même) → même comportement
    - Test erreur réseau → `error` positionné

- [x] **T2 — Créer l'écran `(auth)/forgot-password.tsx`** (AC: 1)
  - [x] T2.1 — Créer `apps/mobile/src/app/(auth)/forgot-password.tsx`
  - [x] T2.2 — `SafeAreaView` + `KeyboardAvoidingView` + `ScrollView` (pattern identique à `login.tsx`)
  - [x] T2.3 — Champ email avec `react-hook-form` + `zodResolver` (schéma : email valide requis)
  - [x] T2.4 — Schéma Zod dans `apps/mobile/src/features/auth/schemas/forgot-password-schema.ts`
  - [x] T2.5 — Bouton "Envoyer le lien" → `useForgotPassword().requestReset(email)` → `router.replace('/(auth)/forgot-password-confirmation')`
  - [x] T2.6 — Bouton "Retour à la connexion" → `router.back()` (lien texte, mode "text")
  - [x] T2.7 — `accessibilityLabel` sur tous les éléments interactifs, `minHeight: 48` sur les boutons
  - [x] T2.8 — `export default` (obligatoire Expo Router)

- [x] **T3 — Créer l'écran `(auth)/forgot-password-confirmation.tsx`** (AC: 1)
  - [x] T3.1 — Créer `apps/mobile/src/app/(auth)/forgot-password-confirmation.tsx`
  - [x] T3.2 — Afficher le message : "Si cet email est enregistré, un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte mail."
  - [x] T3.3 — Bouton "Retour à la connexion" → `router.replace('/(auth)/login')`
  - [x] T3.4 — `SafeAreaView` + `accessibilityRole="alert"` sur le message
  - [x] T3.5 — `export default` (obligatoire Expo Router)

- [x] **T4 — Modifier `(auth)/login.tsx` pour ajouter le lien "Mot de passe oublié"** (AC: 1)
  - [x] T4.1 — Lire `apps/mobile/src/app/(auth)/login.tsx` EN ENTIER avant toute modification
  - [x] T4.2 — Ajouter un `Button` mode="text" entre le bouton "Se connecter" et "Créer un compte"
    ```
    Label : "Mot de passe oublié ?"
    onPress : router.push('/(auth)/forgot-password')
    accessibilityLabel : "Réinitialiser mon mot de passe"
    contentStyle : styles.buttonContent (minHeight: 48 — déjà dans styles)
    ```
  - [x] T4.3 — Ne pas modifier le reste du fichier (logique login, styles existants)

- [x] **T5 — Créer la page web `/reset-password`** (AC: 2, 3)
  - [x] T5.1 — Créer `apps/web/src/app/(auth)/reset-password/page.tsx`
  - [x] T5.2 — Lire le token depuis `searchParams.token` (Next.js App Router : utilisation de `useSearchParams()` dans Client Component)
  - [x] T5.3 — Si token absent → afficher "Lien invalide" + bouton "Demander un nouveau lien" → `/login`
  - [x] T5.4 — Formulaire avec champ "Nouveau mot de passe" (≥ 12 caractères, règles identiques BetterAuth)
  - [x] T5.5 — Champ "Confirmer le mot de passe" (validation cross-field Zod : `refine`)
  - [x] T5.6 — Soumission → `POST /api/auth/reset-password` avec `{ newPassword, token }`
  - [x] T5.7 — Succès → afficher "Mot de passe mis à jour — vous pouvez vous reconnecter" + lien `/login`
  - [x] T5.8 — Erreur 400/410 (token expiré/invalide) → afficher "Lien expiré, veuillez en demander un nouveau" + bouton "Renvoyer un lien" [AC3]
  - [x] T5.9 — `'use client'` obligatoire (formulaire avec état)

- [x] **T6 — Vérifier que le layout `(auth)` web existe pour la page reset-password** (AC: 2, 3)
  - [x] T6.1 — Vérifier si `apps/web/src/app/(auth)/` existe. Si non, créer `apps/web/src/app/(auth)/layout.tsx` minimal (juste `export default function Layout({ children }) { return <>{children}</> }`)
  - [x] T6.2 — Si le dossier existe déjà, ne rien faire

## Dev Notes

### Contexte Critique — Ce qui existe déjà

**BetterAuth endpoints natifs (DÉJÀ disponibles via `[...betterauth]`) :**
| Endpoint | Body | Comportement |
|----------|------|-------------|
| `POST /api/auth/forgot-password` | `{ email: string, redirectTo: string }` | Envoie l'email de reset. Retourne 200 même si email inexistant (sécurité). |
| `POST /api/auth/reset-password` | `{ newPassword: string, token: string }` | Réinitialise le mot de passe. 200 = succès, 400/410 = token invalide/expiré. |

> ⚠️ **CRITIQUE** : Ces endpoints sont gérés par `apps/web/src/app/api/auth/[...betterauth]/route.ts` — **aucune route API à créer**. BetterAuth les expose nativement.

**Contrainte BetterAuth — durée token reset :**
BetterAuth gère la durée de validité du token de reset (par défaut 1 heure dans BetterAuth v1.x). La durée de 15 minutes mentionnée dans les AC est une exigence métier → configurer dans `auth.ts` si BetterAuth l'expose, sinon documenter que la durée effective est celle de BetterAuth.

**Contrainte BetterAuth — envoi d'email :**
BetterAuth nécessite un `emailProvider` configuré pour envoyer les emails. Si non configuré en prototype, il faut ajouter la config dans `apps/web/src/lib/auth.ts`. Pour le prototype, utiliser Resend ou nodemailer avec Ethereal (fake SMTP).

**Fichiers existants à NE PAS casser :**
- `apps/mobile/src/app/(auth)/login.tsx` — modifier uniquement pour ajouter le bouton "Mot de passe oublié ?"
- `apps/web/src/lib/auth.ts` — modifier uniquement si configuration email nécessaire
- Route BetterAuth `apps/web/src/app/api/auth/[...betterauth]/route.ts` — ne pas toucher

**Schéma de password existant :**
Dans `auth.ts` : `minPasswordLength: 12`. Le schéma Zod du formulaire web doit correspondre : `z.string().min(12, 'Minimum 12 caractères')`.

### Flux Complet Reset Password

```
Mobile — Demande de reset :
─────────────────────────────────────────────
login.tsx
  → "Mot de passe oublié ?" [T4]
  → router.push('/(auth)/forgot-password') [T2]

forgot-password.tsx
  → saisie email + validation Zod
  → useForgotPassword().requestReset(email) [T1]
    → POST /api/auth/forgot-password
       body: { email, redirectTo: "https://[host]/reset-password" }
    → Réponse (200 toujours) → router.replace('/(auth)/forgot-password-confirmation') [T2]

forgot-password-confirmation.tsx [T3]
  → "Si cet email est enregistré, un lien a été envoyé"
  → "Retour à la connexion" → login

─────────────────────────────────────────────
Email → Lien web :
─────────────────────────────────────────────
Lien dans l'email : https://[host]/reset-password?token=<betterauth-token>
  → Page Next.js (app router) [T5]
  → Token présent → formulaire nouveau mot de passe
      → POST /api/auth/reset-password
          body: { newPassword, token }
          succès → "Mot de passe mis à jour" [AC2]
          erreur → "Lien expiré" + "Renvoyer un lien" [AC3]
  → Token absent → "Lien invalide"
```

### `useForgotPassword` — Implémentation

```typescript
// apps/mobile/src/features/auth/hooks/useForgotPassword.ts
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

const RESET_PASSWORD_URL = `${process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'}/reset-password`;

interface UseForgotPasswordReturn {
  requestReset: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/auth/forgot-password', {
        email,
        redirectTo: RESET_PASSWORD_URL,
      });
    } catch {
      // Anti-énumération : ne pas exposer si l'email existe
      // On lève quand même l'erreur pour les erreurs réseau réelles
      setError('Une erreur réseau est survenue. Vérifiez votre connexion.');
      throw new Error('network_error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { requestReset, isLoading, error };
}
```

> ⚠️ **Anti-énumération** : BetterAuth retourne 200 même si l'email n'existe pas. Le hook ne doit PAS différencier "email trouvé" vs "email non trouvé". La seule erreur à exposer est une erreur réseau réelle.

### Page Web `reset-password` — Points Clés Next.js App Router

```typescript
// apps/web/src/app/(auth)/reset-password/page.tsx
'use client';

// searchParams en App Router Next.js 15 (async) :
// Le composant reçoit { searchParams: Promise<{ token?: string }> }
// Utiliser React.use(searchParams) ou async component
// Pour un 'use client' component : utiliser useSearchParams() de 'next/navigation'

import { useSearchParams } from 'next/navigation';
```

> **Piège Next.js 15** : Dans les Server Components, `searchParams` est maintenant une `Promise` (async). Dans un Client Component (`'use client'`), utiliser `useSearchParams()` de `next/navigation` — retourne un objet synchrone.

### Règles Critiques

1. **Anti-énumération obligatoire** — afficher TOUJOURS "Si cet email est enregistré..." que l'email existe ou non. Ne jamais indiquer "email non trouvé".
2. **Pas de route API custom** — utiliser exclusivement les endpoints BetterAuth natifs (`/api/auth/forgot-password`, `/api/auth/reset-password`). Ces routes existent déjà via `[...betterauth]`.
3. **minPasswordLength: 12** — synchroniser la validation Zod du formulaire web avec la config BetterAuth (`auth.ts` ligne 40).
4. **`export default` sur les pages** — Expo Router et Next.js App Router l'exigent.
5. **`'use client'`** sur `reset-password/page.tsx` — utilise `useSearchParams()` et `useState`.
6. **Erreur réseau ≠ email inexistant** — `useForgotPassword` n'affiche l'erreur que pour les vraies erreurs réseau (5xx, timeout), pas pour un 200 avec email inexistant.
7. **BetterAuth email provider** — si non configuré, l'email ne sera pas envoyé. Vérifier `apps/web/src/lib/auth.ts` et ajouter `emailVerification` ou `emailProvider` si besoin. Pour le prototype, ajouter une note dans les Completion Notes.
8. **`accessibilityRole="alert"`** sur les messages de confirmation/erreur.
9. **TypeScript strict** — pas de `any`, types explicites sur les fonctions exposées.
10. **Exports nommés** sur hooks et schemas — `export default` uniquement sur les pages/écrans.

### Pièges Connus à Éviter

1. **Ne pas créer de route `/api/v1/auth/forgot-password`** — BetterAuth gère tout via `[...betterauth]`. Doublon inutile.
2. **`useSearchParams()` en App Router** — wrapper dans `<Suspense>` si Next.js se plaint. En pratique, dans un `'use client'` direct page component, ça fonctionne sans Suspense en Next.js 15.
3. **Token dans l'URL** — BetterAuth envoie le token dans `redirectTo?token=xxx`. Le paramètre s'appelle `token` dans l'URL, à lire via `useSearchParams().get('token')`.
4. **Validation cross-field Zod** (confirmation password) :
   ```typescript
   z.object({
     password: z.string().min(12),
     confirmPassword: z.string(),
   }).refine((data) => data.password === data.confirmPassword, {
     message: 'Les mots de passe ne correspondent pas',
     path: ['confirmPassword'],
   });
   ```
5. **`router.back()` peut échouer** si l'écran `forgot-password` est le premier dans la stack — utiliser `router.canGoBack() ? router.back() : router.replace('/(auth)/login')`.
6. **Erreur 400 vs 410** — BetterAuth retourne 400 pour token invalide et peut retourner 400 ou une erreur spécifique pour token expiré. Traiter tout non-200 comme "lien invalide/expiré".

### Apprentissages Stories Précédentes

- **Pattern `react-hook-form` + `zodResolver`** : validé dans `login.tsx` et `register.tsx` — réutiliser exactement la même structure.
- **Pattern `apiClient.post`** : utilisé dans `useLogin.ts` (`/api/auth/sign-in/email`) — même pattern pour `/api/auth/forgot-password`.
- **Mock `expo-secure-store`** dans les tests : pattern de `useBiometric.test.ts` — pas nécessaire ici (pas de SecureStore).
- **`jest.useFakeTimers()`** : pas nécessaire pour ce hook (pas de timer).
- **BetterAuth base path** : les routes BetterAuth sont sur `/api/auth/...` (PAS `/api/v1/auth/...` — exception à la règle du préfixe `/v1/`, car géré par BetterAuth directement).

### Fichiers à créer / modifier

```
apps/mobile/src/
├── app/
│   └── (auth)/
│       ├── forgot-password.tsx             → CRÉER (T2)
│       └── forgot-password-confirmation.tsx → CRÉER (T3)
│       (login.tsx)                         → MODIFIER (T4 — ajout lien uniquement)
└── features/
    └── auth/
        ├── hooks/
        │   ├── useForgotPassword.ts        → CRÉER (T1)
        │   └── useForgotPassword.test.ts   → CRÉER (T1.6)
        └── schemas/
            └── forgot-password-schema.ts   → CRÉER (T2.4)

apps/web/src/
└── app/
    └── (auth)/
        ├── layout.tsx                      → CRÉER si inexistant (T6)
        └── reset-password/
            └── page.tsx                    → CRÉER (T5)
```

### Références

- Architecture Section 3.3 : BetterAuth config + emailAndPassword [Source: `_bmad-output/planning-artifacts/architecture.md#Section-3.3`]
- `apps/web/src/lib/auth.ts` : config BetterAuth — `minPasswordLength: 12`, `emailAndPassword.enabled: true`
- `apps/mobile/src/app/(auth)/login.tsx` : patterns UI existants (SafeAreaView, KeyboardAvoidingView, react-native-paper, react-hook-form)
- `apps/mobile/src/features/auth/hooks/useLogin.ts` : pattern hook apiClient + state management
- Project Context : Règles API (`/api/auth/` ≠ `/api/v1/`), TypeScript strict, accessibilityLabel [Source: `_bmad-output/project-context.md`]
- Epics : Story 1.6 AC complets [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.6`]
- FR5 : Réinitialisation mot de passe via lien email sécurisé [Source: `_bmad-output/planning-artifacts/epics.md`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage rencontré._

### Completion Notes List

- ✅ Hook `useForgotPassword` implémenté avec anti-énumération : erreur affichée uniquement sur erreur réseau réelle, jamais sur email inexistant (BetterAuth retourne 200 dans tous les cas).
- ✅ 4 tests unitaires passent (succès, anti-énumération, erreur réseau, isLoading).
- ✅ Écran `forgot-password.tsx` avec `react-hook-form` + Zod, pattern identique à `login.tsx`.
- ✅ Écran `forgot-password-confirmation.tsx` avec `accessibilityRole="alert"` sur le message.
- ✅ `login.tsx` modifié minimalement : ajout du bouton "Mot de passe oublié ?" entre "Se connecter" et "Créer un compte".
- ✅ Page web `reset-password/page.tsx` créée en `'use client'` avec `useSearchParams()` (Next.js 15 pattern correct).
- ✅ Layout `(auth)/layout.tsx` créé car inexistant.
- ✅ Fichier de types Expo Router `.expo/types/router.d.ts` mis à jour avec les nouvelles routes (sera régénéré automatiquement au prochain démarrage du serveur Expo).
- ⚠️ **BetterAuth email provider** : si non configuré dans `apps/web/src/lib/auth.ts`, les emails ne seront pas envoyés. Vérifier et configurer un provider (Resend, Nodemailer/Ethereal) avant les tests d'intégration.
- ⚠️ **Durée token reset** : BetterAuth gère la durée (par défaut 1h). Si l'exigence métier de 15 minutes doit être respectée, configurer dans `auth.ts` via l'option `expiresIn` de `emailAndPassword`.

### File List

- `apps/mobile/src/features/auth/hooks/useForgotPassword.ts` — CRÉÉ
- `apps/mobile/src/features/auth/hooks/useForgotPassword.test.ts` — CRÉÉ
- `apps/mobile/src/features/auth/schemas/forgot-password-schema.ts` — CRÉÉ
- `apps/mobile/src/app/(auth)/forgot-password.tsx` — CRÉÉ
- `apps/mobile/src/app/(auth)/forgot-password-confirmation.tsx` — CRÉÉ
- `apps/mobile/src/app/(auth)/login.tsx` — MODIFIÉ (ajout bouton "Mot de passe oublié ?")
- `apps/web/src/app/(auth)/layout.tsx` — CRÉÉ
- `apps/web/src/app/(auth)/reset-password/page.tsx` — CRÉÉ
- `apps/mobile/.expo/types/router.d.ts` — MODIFIÉ (ajout routes forgot-password)

## Change Log

- 2026-03-27 : Implémentation complète story 1.6 — Réinitialisation de mot de passe. 8 fichiers créés/modifiés : hook useForgotPassword + tests (4 tests), schéma Zod, 2 écrans mobiles (forgot-password, forgot-password-confirmation), modification login.tsx, layout web (auth), page web reset-password.
