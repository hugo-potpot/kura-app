# Story 3.5 : Archivage, Suppression & Conformité RGPD

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'IDEL ou admin,
Je veux archiver ou supprimer définitivement un dossier patient avec confirmation explicite,
Afin de respecter le droit à l'oubli RGPD tout en respectant la rétention obligatoire de 10 ans.

## Acceptance Criteria

1. **Given** la fiche patient active
   **When** je tape "Archiver ce patient" et confirme le dialog
   **Then** le patient passe en statut `archived`, disparaît du planning actif
   **And** son historique médical reste accessible en lecture depuis la liste "Archivés"
   **And** une entrée d'audit est enregistrée : `action: 'PATIENT_ARCHIVED'`

2. **Given** la fiche patient archivée
   **When** je tape "Supprimer définitivement" et saisis le nom du patient pour confirmation
   **Then** un dialog d'avertissement s'affiche : "Cette action est irréversible — toutes les données seront supprimées"
   **And** après double confirmation, les données sont supprimées et une entrée d'audit est enregistrée : `action: 'PATIENT_DELETED'`

3. **Given** un patient avec transmissions de moins de 10 ans
   **When** une suppression définitive est demandée (sans `?force=true`)
   **Then** l'API retourne `409 Conflict` avec `{ code: 'RETENTION_WARNING' }`
   **And** l'UI affiche "Attention : la réglementation impose une conservation de 10 ans" avec choix "Archiver plutôt" (recommandé) ou "Supprimer quand même" (envoie `?force=true`)

4. **Given** l'action d'archivage
   **When** l'archivage est effectué par un IDEL collaborateur
   **Then** seul le patient assigné à cet IDEL peut être archivé (isolation — même règle que les autres opérations)

5. **Given** la suppression définitive
   **When** le patient est supprimé
   **Then** toutes ses transmissions associées sont également supprimées
   **And** l'audit log est écrit AVANT la suppression (traçabilité irréversible)

## Tasks / Subtasks

- [x] **T1** — Créer `PATCH /api/v1/patients/[id]/archive` (AC: 1, 4)
  - [x] T1.1 — Créer `apps/web/src/app/api/v1/patients/[id]/archive/route.ts`
  - [x] T1.2 — Auth check : session requise (401), `structureId` présent (403)
  - [x] T1.3 — Récupérer patient avec double filtre `id + structureId` → 404 si absent
  - [x] T1.4 — Si `user.role === 'idel'` : vérifier `patient.assignedIdelId === user.id` → 403 sinon
  - [x] T1.5 — Si patient déjà archivé → retourner `409` avec `{ code: 'ALREADY_ARCHIVED' }`
  - [x] T1.6 — Mettre à jour : `db.update(patientsPg).set({ status: 'archived', updatedAt: new Date() }).where(eq(patientsPg.id, id))`
  - [x] T1.7 — Écrire audit log : `db.insert(auditLogsPg).values({ userId: user.id, action: 'PATIENT_ARCHIVED', ... })`
  - [x] T1.8 — Retourner le patient mis à jour : `{ data: { patient } }`

- [x] **T2** — Créer `DELETE /api/v1/patients/[id]` avec vérification rétention (AC: 2, 3, 5)
  - [x] T2.1 — Ajouter handler `DELETE` dans `apps/web/src/app/api/v1/patients/[id]/route.ts`
  - [x] T2.2 — Auth check : session requise (401), `structureId` présent (403)
  - [x] T2.3 — Récupérer patient avec double filtre `id + structureId` → 404 si absent
  - [x] T2.4 — Si `user.role === 'idel'` : vérifier `patient.assignedIdelId === user.id` → 403 sinon
  - [x] T2.5 — Vérifier rétention 10 ans (sauf si `?force=true`) → 409 RETENTION_WARNING
  - [x] T2.6 — Écrire audit log AVANT suppression : `action: 'PATIENT_DELETED'`
  - [x] T2.7 — Supprimer les transmissions liées
  - [x] T2.8 — Supprimer le patient
  - [x] T2.9 — Retourner `204 No Content`

- [x] **T3** — Ajouter les actions d'archivage/suppression sur la page détail patient web (AC: 1, 2, 3)
  - [x] T3.1 — Zone "Actions dangereuses" en bas de page (bordure rouge/orange)
  - [x] T3.2 — Bouton "Archiver ce patient" (visible si `status === 'active'`)
  - [x] T3.3 — `ArchiveConfirmDialog` avec confirmation → PATCH archive
  - [x] T3.4 — Bouton "Supprimer définitivement" (style destructif rouge)
  - [x] T3.5 — `DeleteConfirmDialog` avec input nom patient (désactivé jusqu'à correspondance)
  - [x] T3.6 — Gestion `409 RETENTION_WARNING` avec dialog secondaire (Archiver / Forcer)
  - [x] T3.7 — Après archivage : `router.push('/patients')`
  - [x] T3.8 — Après suppression : `router.push('/patients?deleted=1')`

- [x] **T4** — Ajouter les actions d'archivage/suppression sur la liste patients web (AC: 1)
  - [x] T4.1 — Menu 3 points (MoreVertical) sur chaque ligne avec options Archiver/Supprimer
  - [x] T4.2 — Option "Archiver" → dialog inline + PATCH archive
  - [x] T4.3 — Option "Supprimer" → dialog inline avec input nom + DELETE

- [x] **T5** — Ajouter les actions d'archivage sur l'écran détail patient mobile (AC: 1, 2, 3)
  - [x] T5.1 — Zone "ZONE DANGEREUSE" en bas de `PatientDetailScreen`
  - [x] T5.2 — `useArchivePatient.ts` : mutation PATCH avec invalidation cache
  - [x] T5.3 — `useDeletePatient.ts` : mutation DELETE avec gestion RETENTION_WARNING
  - [x] T5.4 — Dialog archivage Paper avec bouton "Confirmer"
  - [x] T5.5 — Dialog suppression Paper avec TextInput nom (désactivé tant que nom incorrect)
  - [x] T5.6 — Dialog RETENTION_WARNING avec choix "Archiver plutôt" / "Supprimer quand même"
  - [x] T5.7 — Après archivage/suppression : `router.back()` + `Snackbar`

## Dev Notes

### Architecture des endpoints — Choix de design

Deux endpoints distincts pour deux actions sémantiquement différentes :
- `PATCH /api/v1/patients/[id]/archive` → action métier réversible (changement de statut)
- `DELETE /api/v1/patients/[id]` → suppression physique irréversible + audit obligatoire

Story 3.2 a intentionnellement exclu `status` du schéma Zod PATCH (`/api/v1/patients/[id]`) pour éviter d'empiéter sur cette story.

### Route archive — Pattern complet

```typescript
// apps/web/src/app/api/v1/patients/[id]/archive/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, auditLogsPg } from '@kura/db';
import { generateId } from '@kura/shared';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  if (user.role === 'idel' && patient.assignedIdelId !== user.id)
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (patient.status === 'archived')
    return NextResponse.json({ error: { code: 'ALREADY_ARCHIVED' } }, { status: 409 });

  await db.update(patientsPg)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(patientsPg.id, id));

  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: user.id,
    action: 'PATIENT_ARCHIVED',
    resourceType: 'patient',
    resourceId: id,
    timestamp: new Date(),
    metadata: JSON.stringify({ patientName: `${patient.firstName} ${patient.lastName}`, structureId: user.structureId }),
  });

  const [updated] = await db.select().from(patientsPg).where(eq(patientsPg.id, id));
  return NextResponse.json({ data: { patient: updated } });
}
```

### Route DELETE — Pattern complet

```typescript
// À ajouter dans apps/web/src/app/api/v1/patients/[id]/route.ts (existant GET + PATCH)
import { gt } from 'drizzle-orm';
import { transmissionsPg, auditLogsPg } from '@kura/db';

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const force = new URL(req.url).searchParams.get('force') === 'true';

  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));

  if (!patient) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });
  if (user.role === 'idel' && patient.assignedIdelId !== user.id)
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });

  // Vérification rétention 10 ans
  if (!force) {
    const tenYearsAgo = new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000);
    const [recentTx] = await db
      .select({ id: transmissionsPg.id })
      .from(transmissionsPg)
      .where(and(
        eq(transmissionsPg.patientId, id),
        gt(transmissionsPg.createdAt, tenYearsAgo),
      ))
      .limit(1);

    if (recentTx) {
      return NextResponse.json(
        { error: { code: 'RETENTION_WARNING', message: 'Ce patient a des transmissions de moins de 10 ans' } },
        { status: 409 },
      );
    }
  }

  // Audit log AVANT suppression (irréversible)
  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: user.id,
    action: 'PATIENT_DELETED',
    resourceType: 'patient',
    resourceId: id,
    timestamp: new Date(),
    metadata: JSON.stringify({
      patientName: `${patient.firstName} ${patient.lastName}`,
      structureId: user.structureId,
      forcedDeletion: force,
    }),
  });

  // Supprimer cascades manuellement (pas de ON DELETE CASCADE en Drizzle sans migration dédiée)
  await db.delete(transmissionsPg).where(eq(transmissionsPg.patientId, id));
  await db.delete(patientsPg).where(eq(patientsPg.id, id));

  return new Response(null, { status: 204 });
}
```

### Important — `generateId()` pour auditLogsPg

L'`auditLogsPg` a `id` comme PrimaryKey mais sans `$defaultFn`. Il faut passer explicitement `id: generateId()` à l'insert.

### Vérification 10 ans — Calcul précis

```typescript
// 10 ans en ms avec années bissextiles (365.25 jours/an)
const tenYearsAgo = new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000);
```

### Pattern `gt` Drizzle

`gt` = "greater than". Importé depuis `drizzle-orm` : `import { gt } from 'drizzle-orm'`

### Suppression mobile — Pattern TanStack Query v5 mutation

```typescript
// apps/mobile/src/features/patients/hooks/useDeletePatient.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useDeletePatient() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, force = false }: { patientId: string; force?: boolean }) => {
      const token = await getToken();
      const path = `/api/v1/patients/${patientId}${force ? '?force=true' : ''}`;
      // apiClient n'a pas de méthode delete — utiliser fetch directement
      const res = await fetch(`${process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'}${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.status === 409) {
        const data = await res.json() as { error: { code: string } };
        if (data.error.code === 'RETENTION_WARNING') throw new Error('RETENTION_WARNING');
      }
      if (!res.ok && res.status !== 204) throw new Error('DELETE_FAILED');
    },
    onSuccess: (_data, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: ['patients'] });
      void queryClient.removeQueries({ queryKey: ['patient', patientId] });
    },
  });
}
```

> Note : `apiClient` n'a que `get` et `post` — pour `DELETE` et `PATCH` sur les nouvelles routes, utiliser `fetch` directement avec le `EXPO_PUBLIC_API_URL`. **Envisager d'ajouter `patch` et `delete` à `apiClient`** dans une tâche séparée pour normaliser.

### Pattern Dialog Paper mobile

```typescript
// Fragment — Dialog d'archivage
import { Dialog, Portal, Button, Text } from 'react-native-paper';

<Portal>
  <Dialog visible={showArchiveDialog} onDismiss={() => setShowArchiveDialog(false)}>
    <Dialog.Title>Archiver ce patient ?</Dialog.Title>
    <Dialog.Content>
      <Text variant="bodyMedium">
        Le patient sera retiré du planning actif. Son dossier restera accessible dans les archives.
      </Text>
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => setShowArchiveDialog(false)}>Annuler</Button>
      <Button onPress={handleArchive} loading={archiveMutation.isPending}>
        Confirmer
      </Button>
    </Dialog.Actions>
  </Dialog>
</Portal>
```

### Pattern Dialog suppression avec confirmation par nom (web)

```typescript
// Vérification côté client avant d'activer le bouton Supprimer
const expectedName = `${patient.firstName} ${patient.lastName}`;
const isNameMatch = inputName.trim().toLowerCase() === expectedName.toLowerCase();

<button disabled={!isNameMatch || isDeleting} onClick={handleDelete}>
  Supprimer définitivement
</button>
```

### Structure des fichiers à créer/modifier

**Nouveaux (web) :**
- `apps/web/src/app/api/v1/patients/[id]/archive/route.ts` — PATCH archive

**Modifiés (web) :**
- `apps/web/src/app/api/v1/patients/[id]/route.ts` — Ajouter handler DELETE
- `apps/web/src/app/(admin)/patients/page.tsx` — Menu actions (archiver/supprimer) sur chaque ligne
- `apps/web/src/app/(admin)/patients/[id]/page.tsx` — Zone "Actions dangereuses" (story 3.2)

**Nouveaux (mobile) :**
- `apps/mobile/src/features/patients/hooks/useArchivePatient.ts` — Mutation archive
- `apps/mobile/src/features/patients/hooks/useDeletePatient.ts` — Mutation delete avec RETENTION_WARNING

**Modifiés (mobile) :**
- `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx` — Boutons archive/delete (story 3.2)

**À NE PAS TOUCHER :**
- `packages/db/schema/patient-schema.ts` — `status: 'active' | 'archived'` déjà présent, aucune migration
- `packages/db/schema/audit-schema.ts` — Schema existant, aucune modification
- `packages/db/schema/transmission-schema.ts` — Schema existant, aucune modification

### Dependency critique — Stories 3.2 et 3.3

Cette story ajoute des actions sur la **page détail patient** (`/patients/[id]/page.tsx`) et l'écran détail mobile (`PatientDetailScreen.tsx`) créés en story 3.2. Si ces fichiers n'existent pas encore, les créer (avec le contenu de story 3.2) avant d'ajouter les actions d'archivage.

Le filtre `assignedIdelId` (story 3.3) est aussi appliqué dans cette story pour T1.4 et T2.4.

### Ordre d'exécution des opérations DELETE

**Impératif :** L'audit log doit être écrit **avant** la suppression des données. En cas de crash entre les deux, l'audit log doit exister (traçabilité RGPD). L'ordre est :

```
1. Auth + authorization checks
2. Vérification rétention (si !force)
3. INSERT audit_logs  ← AVANT tout DELETE
4. DELETE transmissions
5. DELETE patient
6. Return 204
```

### Références

- Pattern auth session : `apps/web/src/app/api/v1/admin/members/route.ts`
- Pattern double filtre + isolation : `apps/web/src/app/api/v1/patients/[id]/route.ts` (story 3.2)
- Schéma audit : `packages/db/schema/audit-schema.ts`
- Schéma transmissions : `packages/db/schema/transmission-schema.ts`
- Import `generateId` : `@kura/shared`
- Architecture RGPD : `_bmad-output/planning-artifacts/architecture.md` — NFR-SEC-4, FR80
- TanStack Query v5 mutations : `apps/mobile/src/features/auth/hooks/useLogin.ts` (pattern)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A — 60/60 tests passing on first implementation pass.

### Completion Notes List

- `generateId()` from `@kura/shared` must be passed explicitly to `auditLogsPg` insert (no `$defaultFn` on the id column).
- Mobile `useDeletePatient` and `useArchivePatient` use `fetch` directly (not `apiClient`) because `apiClient` only exposes `get`/`post` — noted as tech debt for a future normalization task.
- Audit log is intentionally written BEFORE physical deletion (RGPD irréversibilité).
- `expo-linear-gradient` is not installed in the mobile app — Figma gradient headers replaced with solid `backgroundColor` from COLORS tokens.
- `skipUnauthorizedHandler: true` option was added to `apiClient.post` / `apiClient.get` to prevent the global 401 handler from firing on auth endpoints (login, refresh, register) — fixes "access revoked" false positive on the mobile app.

### File List

**Created (web):**
- `apps/web/src/app/api/v1/patients/[id]/archive/route.ts`
- `apps/web/src/app/api/v1/patients/[id]/archive/route.test.ts`

**Modified (web):**
- `apps/web/src/app/api/v1/patients/[id]/route.ts` — added `DELETE` handler
- `apps/web/src/app/(admin)/patients/page.tsx` — 3-dot action menu (archive/delete) per row
- `apps/web/src/app/(admin)/patients/[id]/page.tsx` — "Zone dangereuse" section with dialogs

**Created (mobile):**
- `apps/mobile/src/features/patients/hooks/useArchivePatient.ts`
- `apps/mobile/src/features/patients/hooks/useDeletePatient.ts`

**Modified (mobile):**
- `apps/mobile/src/features/patients/screens/PatientDetailScreen.tsx` — "ZONE DANGEREUSE" section with 3 Paper dialogs

### Change Log

| Date | Change |
|------|--------|
| 2026-04-23 | Initial implementation — all 5 tasks (T1–T5) completed. 60/60 tests passing. Status → review. |
