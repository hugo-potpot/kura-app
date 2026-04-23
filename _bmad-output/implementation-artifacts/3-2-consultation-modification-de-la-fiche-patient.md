# Story 3.2 : Consultation & Modification de la Fiche Patient

Status: review

## Story

En tant qu'IDEL ou admin,
Je veux consulter la fiche complète d'un patient et modifier ses informations,
Afin de maintenir son dossier à jour au fil du temps.

## Acceptance Criteria

1. **Given** la liste des patients (web ou mobile)
   **When** je clique/tape sur un patient
   **Then** sa fiche s'affiche avec : informations administratives (nom, prénom, adresse, téléphone, médecin traitant), statut, coordonnées GPS si disponibles, et lien vers l'historique des transmissions

2. **Given** la fiche patient ouverte
   **When** je modifie l'adresse et enregistre
   **Then** un nouveau géocodage est déclenché automatiquement pour mettre à jour `latitude` et `longitude`
   **And** la modification est enregistrée (PostgreSQL côté web, SQLite côté mobile) puis synchronisée via la queue

3. **Given** un IDEL collaborateur
   **When** il tente d'accéder à un patient d'une autre structure via l'URL directe ou l'API
   **Then** le serveur retourne `404 Not Found` (le patient n'existe pas dans sa structure — isolation multi-tenant, indépendante de l'UI)

4. **Given** un utilisateur avec rôle `doctor`
   **When** il accède à la fiche patient
   **Then** il voit les informations en lecture seule, sans bouton "Modifier" ni "Archiver"

5. **Given** la fiche patient modifiée
   **When** la sauvegarde est confirmée (web : bouton "Enregistrer", mobile : bouton "Sauvegarder")
   **Then** un message de succès confirme la mise à jour
   **And** si l'adresse a changé et que le géocodage échoue, un avertissement "Adresse non géolocalisée" est affiché

## Tasks / Subtasks

- [x] **T1** — Créer `GET /api/v1/patients/[id]` (AC: 1, 3, 4)
  - [x] T1.1 — Créer `apps/web/src/app/api/v1/patients/[id]/route.ts`
  - [x] T1.2 — Auth check : session requise (401 si absent), role `doctor` autorisé en lecture
  - [x] T1.3 — Récupérer le patient par `id` ET `structureId` de la session (double filtre = isolation)
  - [x] T1.4 — Si patient introuvable ou mauvaise structure → `404 Not Found`
  - [x] T1.5 — Retourner `{ data: { patient } }` avec enveloppe standard

- [x] **T2** — Créer `PATCH /api/v1/patients/[id]` (AC: 2, 3, 5)
  - [x] T2.1 — Dans `apps/web/src/app/api/v1/patients/[id]/route.ts`, ajouter handler PATCH
  - [x] T2.2 — Auth check : role `doctor` → `403 Forbidden`
  - [x] T2.3 — Valider body avec Zod (tous les champs optionnels : `firstName?`, `lastName?`, `address?`, `phone?`, `treatingDoctor?`)
  - [x] T2.4 — Récupérer patient avec double filtre `id + structureId` → `404` si absent
  - [x] T2.5 — Mettre à jour via Drizzle : `db.update(patientsPg).set({ ...updates, updatedAt: new Date() }).where(eq(patientsPg.id, id))`
  - [x] T2.6 — Si `address` a changé → appeler `geocodeAndUpdate(id, newAddress)` de façon non-bloquante
  - [x] T2.7 — Retourner le patient mis à jour avec `{ data: { patient } }`

- [x] **T3** — Créer la page détail patient web (AC: 1, 2, 4, 5)
  - [x] T3.1 — Créer `apps/web/src/app/(admin)/patients/[id]/page.tsx` (Server Component ou Client Component)
  - [x] T3.2 — Afficher les sections : Informations personnelles, Coordonnées GPS, Médecin traitant, Statut
  - [x] T3.3 — Formulaire de modification inline (react-hook-form + Zod), champs : firstName, lastName, address, phone, treatingDoctor
  - [x] T3.4 — Si `latitude === null` → afficher badge d'avertissement "Adresse non géolocalisée"
  - [x] T3.5 — Bouton "Enregistrer" → `PATCH /api/v1/patients/[id]`
  - [x] T3.6 — Pour les `doctor` : afficher les champs en lecture seule (`disabled`), masquer le bouton "Enregistrer"
  - [x] T3.7 — Lien "← Retour à la liste" vers `/patients`
  - [x] T3.8 — Breadcrumb : Application > Patients > [Nom du patient]

- [x] **T4** — Créer l'écran de détail patient mobile (AC: 1, 2, 5)
  - [x] T4.1 — Créer `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx`
  - [x] T4.2 — Créer `apps/mobile/src/features/patients/hooks/usePatient.ts` (TanStack Query, lecture depuis SQLite local)
  - [x] T4.3 — Créer `apps/mobile/src/features/patients/hooks/useUpdatePatient.ts` (TanStack Query mutation, UPDATE SQLite + syncQueue)
  - [x] T4.4 — Afficher les infos patient en mode lecture par défaut, bouton "Modifier" pour passer en mode édition
  - [x] T4.5 — En mode édition : TextInput React Native Paper pour chaque champ modifiable
  - [x] T4.6 — Sauvegarde offline : mettre à jour SQLite local d'abord via Drizzle, puis ajouter dans `syncQueue`
  - [x] T4.7 — Si `latitude === null` après sauvegarde → `Snackbar` d'avertissement "Adresse non géolocalisée"
  - [x] T4.8 — Créer route `apps/mobile/src/app/(app)/patients/[id].tsx` (Expo Router dynamic route)

- [x] **T5** — Brancher la navigation depuis la liste patients web (AC: 1)
  - [x] T5.1 — Dans `apps/web/src/app/(admin)/patients/page.tsx` : rendre chaque ligne de tableau cliquable avec `onClick` → `router.push(/patients/${patient.id})`
  - [x] T5.2 — Utiliser `next/navigation` `useRouter` pour la navigation côté client

- [x] **T6** — Brancher la navigation depuis la liste patients mobile (AC: 1)
  - [x] T6.1 — Route dynamique `apps/mobile/src/app/(app)/patients/[id].tsx` créée ; le pattern `router.push(\`/patients/${patient.id}\`)` est prêt pour Story 3.4 qui implémentera la liste

## Dev Notes

### Règles absolues héritées de Story 3.1

- **Double filtre obligatoire sur toutes les requêtes** : toujours filtrer par `id` ET `structureId` de la session. Ne JAMAIS faire `WHERE id = ?` seul.
- **IDs** : `generateId()` de `@kura/db` uniquement (déjà fait à la création, ne pas régénérer).
- **Deux drivers Drizzle** : `patientsPg` (web/PostgreSQL), `patients` (mobile/SQLite). Ne pas mélanger.
- **Enveloppe de réponse** : `{ data: { patient } }` pour succès, `{ error: { code, message } }` pour erreurs.
- **Géocodage non-bloquant** : ne jamais `await` le géocodage avant de répondre au client.

### Pattern GET + PATCH — Route `[id]`

```typescript
// apps/web/src/app/api/v1/patients/[id]/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg } from '@kura/db';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  return NextResponse.json({ data: { patient } });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { structureId?: string; role?: string };
  if (user.role === 'doctor') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  // Valider avec Zod (voir schema ci-dessous)
  // Vérifier existence + isolation
  const [existing] = await db.select().from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));
  if (!existing) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });

  const addressChanged = body.address !== undefined && body.address !== existing.address;

  await db.update(patientsPg)
    .set({ ...validatedUpdates, updatedAt: new Date() })
    .where(eq(patientsPg.id, id));

  if (addressChanged) {
    void geocodeAndUpdate(id, body.address as string);
  }

  const [updated] = await db.select().from(patientsPg).where(eq(patientsPg.id, id));
  return NextResponse.json({ data: { patient: updated } });
}
```

### Schéma Zod PATCH

```typescript
const UpdatePatientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  address: z.string().min(5).max(300).optional(),
  phone: z.string().optional().nullable(),
  treatingDoctor: z.string().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni',
});
```

### Fonction `geocodeAndUpdate` (réutilisée depuis story 3.1)

```typescript
// apps/web/src/lib/geocoding.ts — ajouter cette fonction
export async function geocodeAndUpdate(patientId: string, address: string): Promise<void> {
  const coords = await geocodeAddress(address);
  if (!coords) return;
  await db.update(patientsPg)
    .set({ latitude: coords.lat, longitude: coords.lng })
    .where(eq(patientsPg.id, patientId));
}
```

### Pattern de mise à jour offline mobile (syncQueue)

```typescript
// Après update SQLite local
await db.update(patients)
  .set({ ...updates, updatedAt: new Date() })
  .where(eq(patients.id, patientId));

// Ajouter à la queue de sync
await db.insert(syncQueue).values({
  id: generateId(),
  entityType: 'patient',
  entityId: patientId,
  operation: 'update',
  payload: JSON.stringify(updates),
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Structure des fichiers à créer

**Web (nouveaux) :**
- `apps/web/src/app/api/v1/patients/[id]/route.ts` — GET + PATCH
- `apps/web/src/app/(admin)/patients/[id]/page.tsx` — Page détail avec formulaire

**Mobile (nouveaux) :**
- `apps/mobile/src/app/(app)/patients/[id].tsx` — Route Expo Router (dynamic segment)
- `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx` — Écran détail
- `apps/mobile/src/features/patients/hooks/usePatient.ts` — TanStack Query fetch
- `apps/mobile/src/features/patients/hooks/useUpdatePatient.ts` — TanStack Query mutation

**Web (à modifier) :**
- `apps/web/src/app/(admin)/patients/page.tsx` — Rendre les lignes du tableau cliquables (T5.1)
- `apps/web/src/lib/geocoding.ts` — Ajouter `geocodeAndUpdate()` si pas fait en 3.1

**À NE PAS TOUCHER :**
- `packages/db/schema/patient-schema.ts` — Schéma complet, aucune migration nécessaire
- `packages/shared/src/types/patient.ts` — Types déjà définis

### Important — Next.js App Router params asynchrones

Dans Next.js 16 (App Router), les `params` de route dynamique sont une `Promise`. Toujours `await` :

```typescript
// ✅ Correct
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
// ❌ Incorrect (pattern Next.js < 15)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id; // TypeScript error dans Next.js 16
}
```

### Contraintes liées aux stories suivantes

- **Story 3.3** (attribution IDEL) : L'isolation ici est par `structureId`. Story 3.3 ajoutera un filtre supplémentaire `assignedTo` pour les IDELs collaborateurs. Ne pas anticiper ce filtre maintenant.
- **Story 3.5** (archivage) : Le PATCH peut inclure `status: 'archived'` — le schéma Zod de cette story doit l'exclure pour ne pas empiéter sur story 3.5.
- **Story 3.6** (constantes) : La fiche patient affichera un onglet "Constantes" — prévoir une structure de tabs dans la page détail web sans l'implémenter (placeholder suffit).

### Références

- Pattern de route dynamique existant : `apps/web/src/app/api/v1/admin/members/[userId]/route.ts`
- Pattern auth session : identique à story 3.1 (voir `apps/web/src/app/api/v1/patients/route.ts` après implémentation 3.1)
- Schéma patient : `packages/db/schema/patient-schema.ts`
- Types patient : `packages/shared/src/types/patient.ts`
- Service géocodage (créé en 3.1) : `apps/web/src/lib/geocoding.ts`
- Architecture API : `_bmad-output/planning-artifacts/architecture.md#3.4`
- Enveloppe réponse : `{ data, error, meta }` — `_bmad-output/planning-artifacts/architecture.md#4.3`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implémenté `GET /api/v1/patients/[id]` avec double filtre `id + structureId` (isolation multi-tenant). Le rôle `doctor` est autorisé en lecture (contrairement au POST).
- Implémenté `PATCH /api/v1/patients/[id]` avec validation Zod, interdiction du rôle `doctor` (403), géocodage non-bloquant si l'adresse change.
- `geocodeAndUpdate()` déplacé dans `apps/web/src/lib/geocoding.ts` (était local dans route.ts de story 3.1) et importé dans le nouveau handler.
- Page web `[id]/page.tsx` : Client Component avec react-hook-form + Zod. Tabs "Informations" / "Constantes" (placeholder pour story 3.6). Détection du rôle doctor via `/api/auth/get-session`.
- Écran mobile offline-first : `usePatient` lit depuis SQLite local (Drizzle). `useUpdatePatient` écrit SQLite + syncQueue avant tout retour réseau.
- 45 tests passent, 0 régression. TypeScript strict : 0 erreur dans les nouveaux fichiers.

### File List

**Nouveaux — Web :**
- `apps/web/src/app/api/v1/patients/[id]/route.ts`
- `apps/web/src/app/api/v1/patients/[id]/route.test.ts`
- `apps/web/src/app/(admin)/patients/[id]/page.tsx`

**Nouveaux — Mobile :**
- `apps/mobile/src/features/patients/hooks/usePatient.ts`
- `apps/mobile/src/features/patients/hooks/useUpdatePatient.ts`
- `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx`
- `apps/mobile/src/app/(app)/patients/[id].tsx`

**Modifiés :**
- `apps/web/src/lib/geocoding.ts` — ajout de `geocodeAndUpdate()`
- `apps/web/src/app/(admin)/patients/page.tsx` — lignes de tableau cliquables (T5)
- `apps/mobile/src/app/(app)/patients/index.tsx` — import useRouter confirmé (T6 infrastructure)

## Change Log

- 2026-04-21 : Implémentation complète Story 3.2 — API GET+PATCH `/patients/[id]`, page web détail patient, écran mobile détail offline-first, navigation depuis listes web et mobile. 45 tests passent.
