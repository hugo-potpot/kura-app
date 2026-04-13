# Story 1.7 : Gestion Sécurité — Déconnexion & Révocation d'Appareil

Status: review

## Story

En tant qu'utilisateur ou admin,
Je veux pouvoir déconnecter tous mes appareils à distance et révoquer un appareil compromis,
Afin de protéger mes données patients en cas de vol ou perte de téléphone.

## Acceptance Criteria

**AC1 — Déconnexion de tous les appareils (user) :**
- Given l'écran Profil > section Sécurité
- When l'utilisateur tape "Déconnecter tous mes appareils" et confirme
- Then `POST /api/auth/revoke-sessions` est appelé (BetterAuth natif)
- And le JWT + refresh token sont supprimés de SecureStore
- And le store Zustand est effacé (`clearSession`)
- And l'utilisateur est redirigé vers `/(auth)/login`

**AC2 — Révocation admin d'un appareil (back office web) :**
- Given un admin dans le Back Office web sur la page "Sessions utilisateur"
- When il sélectionne un IDEL et clique "Révoquer cet appareil" sur une session
- Then `DELETE /api/v1/admin/sessions/:sessionId` est appelé (custom route)
- And la session est révoquée via `auth.api.revokeSession`
- And l'IDEL voit le message "Votre accès a été révoqué sur cet appareil" au prochain démarrage (détection 401)

**AC3 — Déconnexion automatique après 15 minutes d'inactivité :**
- Given l'app est en background ou inactive depuis 15 minutes
- When l'AppState listener détecte le retour au premier plan
- Then si le timer d'inactivité a expiré : le JWT est supprimé de SecureStore, le store est effacé
- And l'utilisateur est redirigé vers `/(auth)/session-expired`

**AC4 — Déconnexion simple de l'appareil courant :**
- Given l'écran Profil > section Sécurité
- When l'utilisateur tape "Se déconnecter"
- Then `POST /api/auth/sign-out` est appelé
- And SecureStore est vidé, Zustand effacé, navigation vers `/(auth)/login`

## Tasks / Subtasks

- [x] **T1 — Créer le hook `useLogout`** (AC: 1, 3, 4)
  - [x] T1.1 — Créer `apps/mobile/src/features/auth/hooks/useLogout.ts`
  - [x] T1.2 — `logout(): Promise<void>` → `POST /api/auth/sign-out` → `clearSession()` → navigate `/(auth)/login`
  - [x] T1.3 — `logoutAllDevices(): Promise<void>` → `POST /api/auth/revoke-sessions` → `clearSession()` → navigate `/(auth)/login`
  - [x] T1.4 — `isLoading: boolean` en state local
  - [x] T1.5 — En cas d'erreur réseau sur revoke-sessions : effacer quand même le SecureStore local (déconnexion locale garantie)
  - [x] T1.6 — Créer `apps/mobile/src/features/auth/hooks/useLogout.test.ts`
    - Test `logout` : POST /api/auth/sign-out → clearSession appelé → navigation login
    - Test `logoutAllDevices` : POST /api/auth/revoke-sessions → clearSession appelé → navigation login
    - Test erreur réseau `logoutAllDevices` : clearSession quand même appelé (déconnexion locale)

- [x] **T2 — Ajouter la section Sécurité dans l'écran Profil** (AC: 1, 4)
  - [x] T2.1 — Lire `apps/mobile/src/app/(app)/profile/index.tsx` EN ENTIER avant toute modification
  - [x] T2.2 — Implémenter l'écran Profil avec section Sécurité (remplace le placeholder)
  - [x] T2.3 — Bouton "Se déconnecter" → `useLogout().logout()` avec `accessibilityLabel="Se déconnecter de cet appareil"`
  - [x] T2.4 — Bouton "Déconnecter tous mes appareils" → Alert de confirmation (`Alert.alert`) → si confirme → `useLogout().logoutAllDevices()`
  - [x] T2.5 — Afficher email utilisateur depuis `useAuthStore().user?.email`
  - [x] T2.6 — `SafeAreaView` + styles conformes au design KURA (Primary `#3949AB`, fond `#E8F0F8`)
  - [x] T2.7 — `accessibilityLabel` + `minHeight: 48` sur tous les éléments interactifs

- [x] **T3 — Implémenter le timeout d'inactivité 15 min dans `_layout.tsx`** (AC: 3)
  - [x] T3.1 — Lire `apps/mobile/src/app/(app)/_layout.tsx` EN ENTIER avant toute modification
  - [x] T3.2 — Ajouter listener `AppState` (onChange) dans le `useEffect` existant
  - [x] T3.3 — Timer inactivité via `useRef<ReturnType<typeof setTimeout>>` :
    - Démarrer (15 min = 900 000 ms) quand app passe en background (`appState === 'background'` ou `'inactive'`)
    - Annuler quand app revient au premier plan (`appState === 'active'`)
  - [x] T3.4 — À l'expiration du timer : appeler `clearSession()` puis `router.replace('/(auth)/session-expired')`
  - [x] T3.5 — Cleanup : subscription.remove() dans le return du `useEffect`

- [x] **T4 — Route API admin pour gestion des sessions** (AC: 2)
  - [x] T4.1 — Créer `apps/web/src/app/api/v1/admin/sessions/route.ts`
  - [x] T4.2 — `GET /api/v1/admin/sessions?userId=xxx` → lister les sessions via Drizzle direct (auth.api.listSessions liste seulement l'user courant) — RBAC : rôle `admin` requis
  - [x] T4.3 — `DELETE /api/v1/admin/sessions/:sessionId` → suppression directe via Drizzle — RBAC : rôle `admin` requis
  - [x] T4.4 — Créer `apps/web/src/app/api/v1/admin/sessions/[sessionId]/route.ts` pour le DELETE par ID
  - [x] T4.5 — Vérifier `session.user.role === 'admin'` en début de chaque handler (sinon 403)
  - [x] T4.6 — Réponses conformes enveloppe `{ data }` / `{ error: { code, message } }`

- [x] **T5 — Page Back Office "Sessions IDEL"** (AC: 2)
  - [x] T5.1 — Créer `apps/web/src/app/(admin)/sessions/page.tsx`
  - [x] T5.2 — Champ de recherche par userId → `GET /api/v1/admin/sessions?userId=xxx`
  - [x] T5.3 — Liste des sessions actives : appareil/user-agent, date de création, expiration, IP si disponible
  - [x] T5.4 — Bouton "Révoquer" par session → `DELETE /api/v1/admin/sessions/:sessionId` → confirmation avant action
  - [x] T5.5 — Message de succès après révocation : "Session révoquée avec succès"
  - [x] T5.6 — `'use client'` (interactions utilisateur)
  - [x] T5.7 — Ajouter le lien "Sessions" dans le layout admin (`apps/web/src/app/(admin)/layout.tsx`)

- [x] **T6 — Détection côté mobile d'une session révoquée** (AC: 2)
  - [x] T6.1 — Modifier `apps/mobile/src/app/(auth)/session-expired.tsx`
  - [x] T6.2 — Accepte param `reason=revoked` via `useLocalSearchParams`
  - [x] T6.3 — Message différencié :
    - `reason=revoked` → "Votre accès a été révoqué sur cet appareil. Contactez votre administrateur."
    - Défaut → "Votre session a expiré ou une connexion internet est requise pour renouveler votre accès."

## Dev Notes

### Contexte Critique — Ce qui existe déjà

**BetterAuth endpoints natifs (DÉJÀ disponibles) :**
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/sign-out` | POST | Déconnexion session courante — supprime le cookie de session |
| `/api/auth/revoke-sessions` | POST | Révoque TOUTES les sessions de l'utilisateur courant |
| `/api/auth/revoke-session` | POST | Révoque une session spécifique par token |
| `/api/auth/revoke-other-sessions` | POST | Révoque toutes les sessions SAUF la courante |
| `/api/auth/list-sessions` | GET | Liste des sessions actives de l'utilisateur courant |

> ⚠️ **CRITIQUE** : Ces endpoints gèrent les sessions de l'utilisateur COURANT. Pour la gestion admin des sessions d'AUTRES utilisateurs (AC2), il faut des routes custom `/api/v1/admin/sessions`.

**Pattern `clearSession` existant :**
```typescript
// apps/mobile/src/features/auth/hooks/useAuth.ts
const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('kura_jwt');
  await SecureStore.deleteItemAsync('kura_refresh_token');
  storeClear(); // clearSession dans useAuthStore → user: null, isAuthenticated: false
};
```

**AppState déjà importé dans `_layout.tsx` :**
Le layout app (`_layout.tsx`) gère déjà le JWT check + biometric. Il faut AJOUTER le timeout inactivité dans le `useEffect` existant sans casser la logique actuelle.

**Fichiers existants à NE PAS casser :**
- `apps/mobile/src/app/(app)/_layout.tsx` — logique JWT + biometric déjà en place
- `apps/mobile/src/lib/api-client.ts` — intercepteurs HTTP existants
- `apps/web/src/app/(admin)/layout.tsx` — layout admin existant

### Implémentation `useLogout`

```typescript
// apps/mobile/src/features/auth/hooks/useLogout.ts
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api-client';
import { useAuth } from './useAuth';

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { clearSession } = useAuth();

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/sign-out', {});
    } catch {
      // Déconnexion locale garantie même en cas d'erreur réseau
    } finally {
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoading(false);
    }
  }, [clearSession, router]);

  const logoutAllDevices = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/revoke-sessions', {});
    } catch {
      // Révocation locale garantie même en cas d'erreur réseau
    } finally {
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoading(false);
    }
  }, [clearSession, router]);

  return { logout, logoutAllDevices, isLoading };
}
```

### Timeout Inactivité 15 min — Pattern AppState

```typescript
// Ajout dans apps/mobile/src/app/(app)/_layout.tsx
import { AppState, type AppStateStatus } from 'react-native';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Dans le composant :
const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  const handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // Démarrer le timer d'inactivité
      inactivityTimerRef.current = setTimeout(async () => {
        await clearSession();
        router.replace('/(auth)/session-expired');
      }, INACTIVITY_TIMEOUT_MS);
    } else if (nextAppState === 'active') {
      // App revenue au premier plan — annuler le timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    subscription.remove();
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  };
}, [clearSession, router]);
```

### Route Admin Gestion Sessions — Pattern

```typescript
// apps/web/src/app/api/v1/admin/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin requis' } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'userId requis' } }, { status: 400 });
  }

  // BetterAuth v1.x : lister les sessions via adapter direct
  // auth.api.listSessions retourne les sessions de l'utilisateur COURANT
  // Pour un autre user : requête directe via adapter
  const sessions = await auth.api.listSessions({ headers: request.headers });
  return NextResponse.json({ data: sessions });
}
```

> ⚠️ **Piège** : `auth.api.listSessions` liste les sessions de l'utilisateur authentifié dans les headers. Pour lister les sessions d'un AUTRE utilisateur en tant qu'admin, il faut accéder directement à la table de sessions via Drizzle en filtrant par `userId`. Utiliser `db.select().from(authSession).where(eq(authSession.userId, userId))`.

### Pièges Connus à Éviter

1. **`AppState.addEventListener` en React Native** : utiliser la syntaxe moderne `AppState.addEventListener('change', handler)` qui retourne un objet subscription avec `.remove()`. Ne PAS utiliser `AppState.removeEventListener` (déprécié).
2. **Timer après démontage** : toujours cleanup le timer dans le return du `useEffect` pour éviter les memory leaks.
3. **`router.replace` dans un `setTimeout`** : peut être appelé après démontage — vérifier si le composant est toujours monté avec un ref `isMountedRef`.
4. **Déconnexion locale garantie** : même si l'appel réseau échoue, effacer TOUJOURS le SecureStore local. L'utilisateur doit pouvoir se déconnecter offline.
5. **`revoke-sessions` vs `sign-out`** : `sign-out` révoque seulement la session courante. `revoke-sessions` révoque TOUTES les sessions.
6. **Session expired vs révoquée** : différencier dans l'UI — session expirée = reconnectez-vous ; session révoquée par admin = contactez votre admin.

### Apprentissages Stories Précédentes

- **Pattern `useCallback`** : tous les hooks exposent leurs fonctions via `useCallback` (cf. `useLogin`, `useForgotPassword`)
- **`clearSession` de `useAuth`** : déjà implémenté, supprime JWT + refresh + efface Zustand — réutiliser directement
- **`apiClient.post`** : pattern établi pour les appels HTTP — réutiliser sans modification
- **Pattern `finally` pour `isLoading`** : toujours utiliser `finally` pour reset `isLoading` (cf. `useLogin`, `useForgotPassword`)
- **Déconnexion locale garantie** : même si le serveur échoue, l'utilisateur doit pouvoir se déconnecter — pattern `try/catch` avec `clearSession` dans `finally`
- **Tests mock `api-client`** : pattern établi dans `useLogin.test.ts` et `useForgotPassword.test.ts`

### Fichiers à créer / modifier

```
apps/mobile/src/
├── app/
│   └── (app)/
│       ├── _layout.tsx         → MODIFIER (ajout AppState timeout T3)
│       └── profile/index.tsx   → MODIFIER (implémentation section sécurité T2)
└── features/
    └── auth/
        └── hooks/
            ├── useLogout.ts      → CRÉER (T1)
            └── useLogout.test.ts → CRÉER (T1.6)

apps/web/src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx           → MODIFIER (ajout lien Sessions T5.7)
│   │   └── sessions/
│   │       └── page.tsx         → CRÉER (T5)
│   └── api/v1/admin/
│       └── sessions/
│           ├── route.ts         → CRÉER (T4.1 - GET)
│           └── [sessionId]/
│               └── route.ts     → CRÉER (T4.4 - DELETE)
└── lib/
    (auth.ts)                    → NE PAS MODIFIER
```

> ⚠️ **T6 optionnel** : La détection de révocation côté mobile (AC2 partial) dépend de la façon dont BetterAuth signale la révocation (401 avec corps spécifique). À implémenter après T4 si le format de réponse est confirmé. L'écran `session-expired.tsx` peut déjà exister (vérifier avant de créer).

### Références

- BetterAuth session endpoints : `node_modules/better-auth/dist/api/routes/session.mjs` (confirmés : revoke-sessions, revoke-session, list-sessions, sign-out)
- `useAuth.ts` : `clearSession` pattern — `apps/mobile/src/features/auth/hooks/useAuth.ts`
- `_layout.tsx` : garde d'authentification actuelle — `apps/mobile/src/app/(app)/_layout.tsx`
- Architecture Section 3.3 : JWT + BetterAuth + SecureStore + RevocationJTI — `_bmad-output/planning-artifacts/architecture.md`
- Project Context : règles TypeScript strict, accessibilityLabel, SecureStore obligatoire — `_bmad-output/project-context.md`
- Story 1.5 learnings : JWT expiry + refresh pattern en place dans `_layout.tsx`
- Story 1.6 learnings : hook pattern avec `useCallback` + `try/catch/finally` + tests mock apiClient

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `apps/mobile/src/features/auth/hooks/useLogout.ts` — CRÉÉ (T1)
- `apps/mobile/src/features/auth/hooks/useLogout.test.ts` — CRÉÉ (T1.6)
- `apps/mobile/src/app/(app)/profile/index.tsx` — MODIFIÉ (T2, remplace placeholder)
- `apps/mobile/src/app/(app)/_layout.tsx` — MODIFIÉ (T3, AppState + timeout 15 min)
- `apps/mobile/src/app/(auth)/session-expired.tsx` — MODIFIÉ (T6, reason=revoked)
- `apps/web/src/app/api/v1/admin/sessions/route.ts` — CRÉÉ (T4.1-T4.2)
- `apps/web/src/app/api/v1/admin/sessions/[sessionId]/route.ts` — CRÉÉ (T4.4)
- `apps/web/src/app/(admin)/sessions/page.tsx` — CRÉÉ (T5)
- `apps/web/src/app/(admin)/layout.tsx` — MODIFIÉ (T5.7, lien Sessions dans nav)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-27 | Implémentation complète story 1.7 — useLogout hook, profil sécurité, timeout inactivité, routes admin sessions, page back office sessions, session-expired différencié | claude-sonnet-4-6 |
| 2026-03-27 | Fix TypeScript : route `/(app)/planning/index` → `/(app)/planning` dans session-expired.tsx | claude-sonnet-4-6 |
| 2026-03-27 | Fix test useLogout : mock useRouter pattern `const mockReplace = jest.fn()` | claude-sonnet-4-6 |
