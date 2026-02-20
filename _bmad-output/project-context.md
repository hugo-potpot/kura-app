---
project_name: 'idel-app (KURA)'
user_name: 'Potpot'
date: '2026-02-20'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
---

# Project Context for AI Agents — KURA (idel-app)

_Ce fichier contient les règles critiques et les patterns que les agents IA DOIVENT suivre lors de l'implémentation de code dans ce projet. Focus sur les détails non-évidents qu'un agent pourrait manquer._

---

## Stack Technique & Versions

| Technologie | Version | Usage |
|-------------|---------|-------|
| Expo SDK | 53 (stable) | App mobile React Native |
| React Native | 0.79 | Framework mobile |
| React | 19 | UI library |
| Next.js | 15 (App Router) | Back Office web + API |
| TypeScript | 5.x strict | Tout le codebase |
| Drizzle ORM | latest | ORM — SQLite (mobile) + PostgreSQL (serveur) |
| expo-sqlite | latest | SQLite local chiffré (offline-first) |
| BetterAuth | latest | Authentification + MFA/FIDO2 |
| Zustand | 5.x | State management mobile |
| TanStack Query | 5.x | Cache serveur + requêtes API |
| React Native Paper | 5.x | Design system mobile |
| React Hook Form | 7.x | Formulaires |
| Turborepo | latest | Monorepo build orchestration |
| pnpm | 9.x | Package manager (workspaces) |
| Expo Router | 4.x | Navigation mobile (file-based) |
| `ulidx` | latest | Génération ULID |
| Firebase (FCM) | latest | Push notifications |
| `react-native-maps` | latest | Carte tournée planning |

---

## Règles Critiques d'Implémentation

### Règles Langage (TypeScript)

- **TypeScript strict obligatoire** — `"strict": true` dans tous les `tsconfig.json`. Jamais de `any` implicite.
- **Imports absolus uniquement** via path aliases (`@/features/...`, `@kura/shared/...`). Jamais de `../../..` relatifs profonds.
- **Async/await exclusivement** — jamais de `.then().catch()` sauf pour les chaînes de Promise natives.
- **Types explicites sur les retours de fonctions** exposées — l'inférence est OK pour les variables locales.
- **Pas de `!` non-null assertion** — utiliser des guards ou l'opérateur optionnel `?.`.
- **Zod pour la validation** des données entrantes (formulaires, payloads API, données sync).

```typescript
// ✅ Correct
async function getPatient(id: string): Promise<Patient | null> {
  return db.query.patients.findFirst({ where: eq(patients.id, id) }) ?? null;
}

// ❌ Interdit
const getPatient = async (id) => db.query.patients.findFirst(...)
```

---

### Règles Framework — React Native / Expo

- **Expo Router v4 uniquement** pour la navigation — jamais `react-navigation` direct.
- **Route groups** : `(auth)/` pour écrans non-authentifiés, `(app)/` pour écrans authentifiés. Le guard auth se fait dans `(app)/_layout.tsx`.
- **`SafeAreaView`** obligatoire sur tous les écrans (encoche iOS + barre Android).
- **`KeyboardAvoidingView`** sur tous les écrans avec champs de saisie.
- **Touch targets ≥ 48px** — `minHeight: 48, minWidth: 48` sur tout élément `Pressable` / `TouchableOpacity`.
- **`allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}`** sur tous les `<Text>` — respect du Dynamic Type iOS.
- **`accessibilityLabel` obligatoire** sur tous les éléments interactifs (boutons, inputs, icônes).
- **Jamais `AsyncStorage` pour des données sensibles** — utiliser `expo-local-authentication` + `expo-secure-store` pour JWT et tokens.
- **`AppState` listener** dans le root layout pour déclencher le timeout de session (15 min inactivité).

```typescript
// ✅ Stockage JWT correct
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('jwt', token);

// ❌ Interdit pour données sensibles
await AsyncStorage.setItem('jwt', token);
```

---

### Règles Framework — Drizzle ORM (CRITIQUE)

- **Drizzle, pas Prisma** — Prisma ne fonctionne pas dans React Native (engine binaire natif incompatible).
- **Schéma défini dans `packages/db/schema/`** — jamais dupliquer les définitions dans `apps/`.
- **Deux drivers distincts** selon le contexte :
  - Mobile : `import { drizzle } from 'drizzle-orm/expo-sqlite'`
  - Serveur : `import { drizzle } from 'drizzle-orm/postgres-js'`
- **snake_case pour les colonnes** dans le schéma Drizzle — camelCase uniquement côté TypeScript via mapping.
- **ULID pour tous les IDs** — `import { ulid } from 'ulidx'` — jamais d'auto-increment, jamais d'UUID v4 brut.
- **`synced_at`** (nullable timestamp) sur toutes les tables mobiles — `null` = jamais synchronisé.
- **Index obligatoires** sur `structure_id` et `synced_at` pour les performances offline.

```typescript
// ✅ Création d'une entité avec ULID
import { ulid } from 'ulidx';

const newPatient = {
  id: ulid(),              // ex: "01ARZ3NDEKTSV4RRFFQ69G5FAV"
  structureId: user.structureId,
  firstName: data.firstName,
  createdAt: new Date(),
  syncedAt: null,          // pas encore synchronisé
};
```

---

### Règles Framework — API Next.js (Back Office)

- **Toujours `apps/web/src/app/api/v1/`** — préfixe `/v1/` sur toutes les routes API.
- **Enveloppe JSON uniforme** sur toutes les réponses :
  ```typescript
  // Succès
  return NextResponse.json({ data: result, meta: { total } }, { status: 200 });
  // Erreur
  return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND', message: '...' } }, { status: 404 });
  ```
- **Jamais de réponse directe** sans enveloppe `{ data }` ou `{ error }`.
- **Middleware `apps/web/src/middleware.ts`** gère l'auth globalement — ne pas dupliquer les guards dans chaque route.
- **RBAC** : vérifier `session.user.role` ET `session.user.structureId` sur chaque requête qui accède à des données patients.
- **Pagination cursor-based** (ULID) pour toutes les listes : `GET /api/v1/patients?after=01ARZ...&limit=20`.
- **Rate limiting** : 100 req/min/utilisateur via middleware Next.js.

---

### Règles Framework — Zustand + TanStack Query

- **Zustand = état UI et queue de sync offline uniquement** — jamais pour mettre en cache des données serveur.
- **TanStack Query = cache des données serveur** — invalider via `queryClient.invalidateQueries` après chaque mutation.
- **Optimistic updates** obligatoires pour toutes les mutations fréquentes (créer transmission, marquer absent) :
  ```typescript
  useMutation({
    mutationFn: createTransmission,
    onMutate: async (newData) => {
      // Mettre à jour l'UI immédiatement (offline-first)
      await queryClient.cancelQueries({ queryKey: ['transmissions'] });
      const previous = queryClient.getQueryData(['transmissions']);
      queryClient.setQueryData(['transmissions'], old => [...old, newData]);
      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['transmissions'], context?.previous);
    },
  });
  ```
- **`useNetworkStatus` hook** doit conditionner toutes les requêtes réseau :
  ```typescript
  const { isOnline } = useNetworkStatus();
  const { data } = useQuery({ enabled: isOnline, ... });
  ```

---

### Règles de Sécurité (CRITIQUE)

- **Jamais de données patient dans les notifications push** — uniquement `{ type: 'new_patient' }` sans nom ni détail médical.
- **Jamais de secrets dans le code source** — `.env.local` jamais commité (vérifier `.gitignore`).
- **`structure_id` sur toutes les requêtes Drizzle** — toujours filtrer par la structure de l'utilisateur :
  ```typescript
  // ✅ Toujours isoler par structure
  db.select().from(patients).where(eq(patients.structureId, session.user.structureId));

  // ❌ Interdit — accès cross-tenant
  db.select().from(patients);
  ```
- **Audit log** sur toute mutation de données de santé :
  ```typescript
  await auditLogger.log({ userId, action: 'UPDATE', entity: 'patient', entityId, data });
  ```
- **`expo-secure-store`** pour JWT — durée de validité 7 jours, refresh token 30 jours.

---

### Règles de Tests

- **Tests co-localisés** — `feature.test.ts` dans le même dossier que `feature.ts`. Jamais de dossier `__tests__/` global.
- **Tester l'algorithme de planning obligatoirement** — `tsp-optimizer.test.ts` avec cas limites : 0 patient, 1 patient, patients sans coordonnées.
- **Tester le sync engine** — `sync-engine.test.ts` avec cas offline, conflit, retry.
- **Mocks Drizzle** via `drizzle-orm/mock` pour les tests unitaires — jamais une vraie base de données en test unitaire.
- **Pas de `console.log` dans les tests** — utiliser `vi.spyOn` ou supprimer explicitement.
- **Nomenclature** : `describe('ComponentName', () => { it('should [behavior] when [condition]', ...) })`.

---

### Règles de Qualité & Style

- **ESLint + Prettier** — configuration à la racine du monorepo, appliquée à tous les packages.
- **Pas de commentaires qui décrivent CE QUE fait le code** — uniquement pourquoi (décisions non-évidentes).
- **Imports organisés** : 1) stdlib/Node, 2) packages externes, 3) packages internes (`@kura/`), 4) imports relatifs. Séparés par une ligne vide.
- **Exports nommés uniquement** — jamais `export default` sauf pour les pages Next.js et les layouts Expo Router (obligatoire par le framework).
- **Skeleton screens** avant tout `ActivityIndicator` — jamais de spinner nu pour un chargement > 300ms.

---

### Anti-Patterns Critiques (NE JAMAIS FAIRE)

| Anti-pattern | Raison | Alternative |
|-------------|--------|-------------|
| `AsyncStorage` pour JWT | Non chiffré, accessible | `expo-secure-store` |
| `Prisma` dans apps/mobile | Engine binaire incompatible RN | `drizzle-orm/expo-sqlite` |
| Auto-increment IDs | Conflit offline ↔ serveur | ULID via `ulidx` |
| Réponse API sans enveloppe | Incohérence client/serveur | `{ data, error, meta }` |
| `any` TypeScript | Perd la sécurité de typage | Types explicites ou `unknown` |
| Requête sans `structure_id` | Fuite de données cross-tenant | Toujours filtrer par structure |
| Données patient dans notif push | Violation HDS/RGPD | Notification générique uniquement |
| `export default` hors framework | Rend les refactors difficiles | `export const` nommé |
| Spinner seul pour chargement | UX dégradée (UX Spec S12.6) | Skeleton screen |
| Erreur sans action | Frustration utilisateur (UX Spec S12.2) | Bouton Réessayer / Annuler |
| `../../..` imports profonds | Maintenance difficile | Path aliases `@/` |

---

### Règles Workflow Git

- **Branches** : `feat/feature-name`, `fix/bug-name`, `chore/task-name`
- **Commits** : Conventional Commits — `feat(planning): add haversine distance calculation`
- **Jamais commiter** : `.env.local`, `*.sqlite`, `node_modules/`, `ios/`, `android/` (générés par EAS)
- **PR** : description + lien vers FR concerné (ex: "Implémente FR29 — algorithme TSP")

---

### Règles Spécifiques KURA

- **Algorithme planning exécuté localement sur l'appareil** — jamais d'appel serveur pour calculer le planning.
- **Géocodage asynchrone** lors de la création/modification d'adresse patient — stocker `lat/lng` dans SQLite immédiatement.
- **Fallback si `lat/lng` null** — patient placé en fin de liste avec badge `⚠️ Adresse non localisée`.
- **Validation humaine obligatoire avant enregistrement** de toute transcription vocale Whisper — jamais d'enregistrement automatique.
- **Queue Zustand persistée** dans `expo-sqlite` pour survivre aux fermetures d'app — jamais en mémoire uniquement.
- **`syncedAt: null`** = donnée locale non synchronisée → afficher `SyncStatusIndicator` orange.
- **Palette couleurs** : Primary `#3949AB` (indigo), Secondary `#00897B` (teal), Error `#E53935` (rouge) — voir `kura-theme.ts`.
- **Bottom Navigation** : 4 tabs fixes (Planning, Patients, Transmissions, Profil) — jamais plus, jamais moins.
- **Règle "serveur gagne"** pour la résolution de conflits de sync — données serveur écrasent local en cas de conflit.
