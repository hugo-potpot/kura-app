# Story 3.1 : Création d'un Dossier Patient avec Géolocalisation

Status: review

## Story

En tant qu'IDEL ou admin,
Je veux créer un nouveau dossier patient avec ses informations administratives et son adresse géolocalisée automatiquement,
Afin que ce patient soit intégré dans mon planning et son suivi médical puisse commencer.

## Acceptance Criteria

1. **Given** l'écran "Nouveau patient" (web BO ou mobile)
   **When** je saisis nom, prénom, adresse, téléphone et médecin traitant, puis valide
   **Then** le dossier patient est créé avec un `patient_id` ULID (`generateId()` de `@kura/db`)
   **And** un géocodage automatique (Nominatim OSM) est déclenché pour obtenir `latitude` et `longitude`

2. **Given** le géocodage réussi
   **When** les coordonnées sont retournées par Nominatim
   **Then** `latitude` et `longitude` sont stockées dans la base (PostgreSQL côté web, SQLite côté mobile)

3. **Given** le géocodage échoue (adresse inconnue ou hors réseau)
   **When** la création est sauvegardée
   **Then** le patient est créé sans coordonnées GPS (`latitude: null`, `longitude: null`)
   **And** un avertissement visuel est affiché : "Adresse non géolocalisée — ce patient sera placé en fin de planning"

4. **Given** un IDEL ou admin authentifié qui crée un patient
   **When** la création est validée
   **Then** le patient est automatiquement isolé dans la structure de l'utilisateur (`structure_id` extrait de la session/JWT)
   **And** un rôle `doctor` ne peut PAS créer de patient (403)

5. **Given** l'API web POST `/api/v1/patients`
   **When** appelée sans session valide ou avec rôle `doctor`
   **Then** retourne `401 Unauthorized` ou `403 Forbidden` selon le cas

## Tasks / Subtasks

- [x] **T1** — Implémenter `POST /api/v1/patients` (web API) (AC: 1, 2, 3, 4, 5)
  - [x] T1.1 — Créer `apps/web/src/app/api/v1/patients/route.ts` : handler POST avec auth check
  - [x] T1.2 — Valider les inputs avec Zod (firstName, lastName, address obligatoires ; phone, treatingDoctor optionnels)
  - [x] T1.3 — Extraire `structureId` depuis la session Better Auth (`session.user.structureId`)
  - [x] T1.4 — Insérer le patient via Drizzle ORM (`patientsPg`) avec `generateId()` pour l'id
  - [x] T1.5 — Appeler le service Nominatim après insertion (non-bloquant, `Promise` séparée) et mettre à jour lat/lng si succès
  - [x] T1.6 — Retourner le patient créé (avec ou sans coordonnées selon résultat géocodage)

- [x] **T2** — Implémenter `GET /api/v1/patients` (web API) (AC: 4, 5)
  - [x] T2.1 — Handler GET avec auth check (idel ou admin uniquement)
  - [x] T2.2 — Filtrer par `structureId` de la session (isolation multi-tenant)
  - [x] T2.3 — Support query params : `?status=active|archived`, `?search=` (nom/adresse/médecin)
  - [x] T2.4 — Retourner liste ordonnée par `updatedAt DESC`

- [x] **T3** — Créer le service de géocodage Nominatim (AC: 2, 3)
  - [x] T3.1 — Créer `apps/web/src/lib/geocoding.ts` avec fonction `geocodeAddress(address: string): Promise<{lat, lng} | null>`
  - [x] T3.2 — Appel `https://nominatim.openstreetmap.org/search?q=<address>&format=json&limit=1`
  - [x] T3.3 — Header `User-Agent: KURA-App/1.0` obligatoire (politique Nominatim)
  - [x] T3.4 — Timeout de 5s, catch silencieux → retourner `null` en cas d'échec
  - [x] T3.5 — Même logique côté mobile : `apps/mobile/src/lib/geocoding.ts`

- [x] **T4** — Brancher l'UI web existante sur l'API réelle (AC: 1, 2, 3)
  - [x] T4.1 — Dans `apps/web/src/app/(admin)/patients/page.tsx` : la modal "Nouveau Patient" appelle déjà `POST /api/v1/patients` → vérifier que les champs correspondent au schéma Zod de l'API
  - [x] T4.2 — Afficher l'avertissement géolocalisation si le patient retourné a `latitude: null`
  - [x] T4.3 — Brancher `GET /api/v1/patients` pour charger la liste réelle (remplacer le state vide)

- [x] **T5** — Implémenter la création patient mobile (AC: 1, 2, 3, 4)
  - [x] T5.1 — Créer `apps/mobile/src/features/patients/hooks/useCreatePatient.ts` avec TanStack Query mutation
  - [x] T5.2 — Créer `apps/mobile/src/features/patients/components/CreatePatientForm.tsx` (React Native Paper : TextInput, Button)
  - [x] T5.3 — Créer `apps/mobile/src/features/patients/screens/NewPatientScreen.tsx`
  - [x] T5.4 — Insérer dans SQLite local via Drizzle (`patients` table SQLite) avec `generateId()`
  - [x] T5.5 — Appel Nominatim depuis mobile (même service `geocoding.ts`) après sauvegarde locale
  - [x] T5.6 — Ajouter entrée dans `syncQueue` pour synchronisation future vers le serveur
  - [x] T5.7 — Afficher le warning "Adresse non géolocalisée" via `Snackbar` de React Native Paper si lat/lng null

- [x] **T6** — Brancher le nouvel écran dans la navigation mobile (AC: 1)
  - [x] T6.1 — Ajouter route `/(app)/patients/new` dans Expo Router
  - [x] T6.2 — Bouton FAB (+) sur l'écran Patients existant qui navigue vers `NewPatientScreen`

## Dev Notes

### Architecture critique — Règles absolues

- **Isolation multi-tenant OBLIGATOIRE** : Chaque requête API doit extraire `structureId` de `session.user.structureId` (jamais du body de la requête). Voir `apps/web/src/lib/auth.ts` pour le pattern de session.
- **IDs patients** : Utiliser impérativement `generateId()` de `@kura/db` (ULID). Ne jamais utiliser `crypto.randomUUID()` ni autre générateur.
- **Deux drivers Drizzle distincts** : PostgreSQL côté web (`patientsPg` de `@kura/db`), SQLite côté mobile (`patients` de `@kura/db`). Ne pas mélanger.
- **Schéma patient existant** — ne PAS recréer, utiliser tel quel :

```typescript
// PostgreSQL (web)
import { patientsPg } from '@kura/db';

// SQLite (mobile)
import { patients } from '@kura/db';
```

- **Auth web** : Pattern exact pour récupérer la session :

```typescript
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { structureId?: string; role?: string };
  if (user.role === 'doctor') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });
  // ...
}
```

- **Géocodage non-bloquant** : Créer le patient d'abord, puis lancer le géocodage en background avec `void geocodeAndUpdate(patientId, address)`. Éviter de bloquer la réponse HTTP.

### Service Nominatim — Implémentation exacte

```typescript
// apps/web/src/lib/geocoding.ts
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'KURA-App/1.0 (contact@kura.fr)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
```

### Schéma de validation Zod (API web POST)

```typescript
const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address: z.string().min(5).max(300),
  phone: z.string().optional(),
  treatingDoctor: z.string().optional(),
});
```

### Synchronisation mobile (syncQueue)

Après insertion SQLite, ajouter dans `syncQueue` :
```typescript
await db.insert(syncQueue).values({
  id: generateId(),
  entityType: 'patient',
  entityId: patientId,
  operation: 'create',
  payload: JSON.stringify(patientData),
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Structure des fichiers à créer/modifier

**Web (à modifier) :**
- `apps/web/src/app/api/v1/patients/route.ts` — Remplacer le stub par l'implémentation complète
- `apps/web/src/lib/geocoding.ts` — Nouveau fichier
- `apps/web/src/app/(admin)/patients/page.tsx` — Brancher sur l'API réelle (déjà implémenté côté UI)

**Mobile (à créer) :**
- `apps/mobile/src/lib/geocoding.ts` — Nouveau
- `apps/mobile/src/features/patients/hooks/useCreatePatient.ts` — Nouveau
- `apps/mobile/src/features/patients/components/CreatePatientForm.tsx` — Nouveau
- `apps/mobile/src/features/patients/screens/NewPatientScreen.tsx` — Nouveau
- `apps/mobile/src/app/(app)/patients/new.tsx` — Nouvelle route Expo Router

**Packages (ne pas modifier) :**
- `packages/db/schema/patient-schema.ts` — Déjà complet, NE PAS TOUCHER
- `packages/shared/src/types/patient.ts` — Types déjà définis

### Project Structure Notes

- Pattern des hooks existants à suivre : `apps/mobile/src/features/auth/hooks/useLogin.ts` (TanStack Query + zustand)
- Pattern API existant à suivre : `apps/web/src/app/api/v1/invitations/route.ts` (auth check + Drizzle + NextResponse)
- Pattern de form mobile : `apps/mobile/src/features/auth/` pour les composants React Native Paper
- L'UI web (`apps/web/src/app/(admin)/patients/page.tsx`) a déjà le formulaire de création — vérifier que les champs `firstName`, `lastName`, `address`, `phone`, `treatingDoctor` sont bien envoyés dans le `POST /api/v1/patients`

### Contraintes liées aux stories suivantes

- **Story 3.2** (modification) : La mise à jour d'adresse doit aussi déclencher un re-géocodage — prévoir la fonction `geocodeAndUpdate` réutilisable
- **Story 3.3** (attribution) : Le champ `assignedTo` (userId IDEL) n'est PAS dans le schéma actuel → ne pas l'ajouter dans cette story
- **Story 3.4** (liste/recherche) : L'implémentation du GET avec `?search=` dans T2 prépare déjà cette story
- **Epic 4** (planning) : Les champs `latitude/longitude` stockés ici alimenteront l'algorithme Haversine + Nearest Neighbor

### Références

- Schéma patient : `packages/db/schema/patient-schema.ts`
- Types patient : `packages/shared/src/types/patient.ts`
- Architecture géolocalisation : `_bmad-output/planning-artifacts/architecture.md#1.3`
- Epics story 3.1 : `_bmad-output/planning-artifacts/epics.md` (ligne ~747)
- Pattern auth API web : `apps/web/src/app/api/v1/invitations/route.ts`
- Pattern hook mobile : `apps/mobile/src/features/auth/hooks/useLogin.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage majeur. `TotpSetup.test.tsx` (3 tests) était déjà en échec avant cette story — régression pré-existante non liée._

### Completion Notes List

- API web `POST /api/v1/patients` : auth (idel/admin only, 401/403), validation Zod, insertion Drizzle PG, géocodage Nominatim non-bloquant
- API web `GET /api/v1/patients` : filtrage multi-tenant par `structureId`, support `?status` et `?search`, tri `updatedAt DESC`
- Service `geocodeAddress` (web + mobile) : Nominatim OSM, timeout 5s, User-Agent conforme, catch silencieux → null
- UI web `patients/page.tsx` : fetch branché sur l'API réelle, avertissement géolocalisation affiché si `latitude: null`
- SQLite mobile (`lib/db.ts`) : initialisation tables `patients` et `sync_queue` via `execSync` si inexistantes
- Hook `useCreatePatient` (TanStack Query mutation) : insert SQLite, syncQueue, géocodage non-bloquant
- `CreatePatientForm` (React Native Paper) : validation inline, champs firstName/lastName/address/phone/treatingDoctor
- `NewPatientScreen` : Snackbar géolocalisation si `latitude: null`, navigation retour automatique
- Route Expo Router `/(app)/patients/new` + FAB sur l'écran Patients
- Tests : 13 tests Vitest web (100% pass) + 2 tests Jest mobile (100% pass)

### File List

**Web (modifiés) :**
- `apps/web/src/app/api/v1/patients/route.ts`
- `apps/web/src/app/(admin)/patients/page.tsx`

**Web (nouveaux) :**
- `apps/web/src/lib/geocoding.ts`
- `apps/web/src/lib/geocoding.test.ts`
- `apps/web/src/app/api/v1/patients/route.test.ts`

**Mobile (nouveaux) :**
- `apps/mobile/src/lib/db.ts`
- `apps/mobile/src/lib/geocoding.ts`
- `apps/mobile/src/features/patients/hooks/useCreatePatient.ts`
- `apps/mobile/src/features/patients/hooks/useCreatePatient.test.ts`
- `apps/mobile/src/features/patients/components/CreatePatientForm.tsx`
- `apps/mobile/src/features/patients/screens/NewPatientScreen.tsx`
- `apps/mobile/src/app/(app)/patients/new.tsx`

**Mobile (modifiés) :**
- `apps/mobile/src/app/(app)/_layout.tsx`
- `apps/mobile/src/app/(app)/patients/index.tsx`

**Sprint :**
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
