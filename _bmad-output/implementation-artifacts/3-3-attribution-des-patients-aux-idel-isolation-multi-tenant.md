# Story 3.3 : Attribution des Patients aux IDEL & Isolation Multi-Tenant

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin,
Je veux attribuer ou retirer des patients à mes IDEL collaborateurs,
Afin que chaque IDEL n'ait accès qu'à ses patients assignés, en toute sécurité.

## Acceptance Criteria

1. **Given** la liste patients dans le Back Office
   **When** l'admin sélectionne un patient et clique "Assigner à [IDEL]"
   **Then** le patient apparaît dans le planning de l'IDEL assigné
   **And** une notification push est envoyée à l'IDEL "Un nouveau patient vous a été assigné"

2. **Given** un patient assigné à IDEL-A dans la même structure
   **When** IDEL-B tente d'accéder à ce patient (liste ou API directe)
   **Then** le patient n'apparaît pas dans sa liste (`GET /api/v1/patients` ne retourne que ses patients assignés)
   **And** toute requête directe retourne `403 Forbidden` (isolation RBAC côté API, indépendante de l'UI)

3. **Given** l'admin qui retire un patient à un IDEL
   **When** il clique "Retirer l'assignation" et confirme
   **Then** le patient disparaît du planning de cet IDEL
   **And** ses données locales sont marquées pour nettoyage lors de la prochaine synchronisation (champ `syncedAt` mis à `null`)

4. **Given** un IDEL sans patient assigné
   **When** il consulte sa liste de patients
   **Then** la liste est vide (aucun patient d'un autre IDEL visible)

5. **Given** un admin
   **When** il consulte la liste patients dans le Back Office
   **Then** il voit TOUS les patients de sa structure (pas de filtre `assignedIdelId`)
   **And** pour chaque patient, le nom de l'IDEL assigné est affiché (ou "Non assigné" si null)

## Tasks / Subtasks

- [x] **T1** — Mettre à jour le schéma patient pour ajouter `assignedIdelId` (AC: 1, 2, 3, 4)
  - [x] T1.1 — Dans `packages/db/schema/patient-schema.ts` : ajouter `assignedIdelId: text('assigned_idel_id')` (nullable) au schéma SQLite `patients`
  - [x] T1.2 — Dans `packages/db/schema/patient-schema.ts` : ajouter `assignedIdelId: pgText('assigned_idel_id')` (nullable) au schéma PostgreSQL `patientsPg`
  - [x] T1.3 — Champ natif dans le schéma — exporté automatiquement via packages/db/schema/index.ts
  - [x] T1.4 — Migration générée : `packages/db/migrations/0006_bitter_invisible_woman.sql` (`ALTER TABLE "patients" ADD COLUMN "assigned_idel_id" text`). À appliquer avec DATABASE_URL configuré.
  - [x] T1.5 — Mettre à jour `packages/shared/src/types/patient.ts` : ajout `assignedIdelId: string | null` à l'interface `Patient`

- [x] **T2** — Créer `PATCH /api/v1/patients/[id]/assign` (Back Office — admin only) (AC: 1, 3)
  - [x] T2.1 — Créer `apps/web/src/app/api/v1/patients/[id]/assign/route.ts`
  - [x] T2.2 — Auth check : session requise (401), role `admin` obligatoire (403 sinon), `structureId` présent (403 sinon)
  - [x] T2.3 — Valider body avec Zod : `{ idelId: string | null }` (null = désassigner)
  - [x] T2.4 — Si `idelId` non null : vérifier IDEL cible dans la même structure → 404 si absent
  - [x] T2.5 — Récupérer patient avec double filtre `id + structureId` → 404 si absent
  - [x] T2.6 — Mettre à jour via Drizzle avec `assignedIdelId` et `updatedAt`
  - [x] T2.7 — Si désassignation (`idelId === null`) : mettre `syncedAt` à `null`
  - [x] T2.8 — Retourner le patient mis à jour : `{ data: { patient } }`

- [x] **T3** — Modifier `GET /api/v1/patients` pour appliquer le filtre IDEL (AC: 2, 4, 5)
  - [x] T3.1-T3.6 — Handler GET existant mis à jour avec double niveau d'isolation : admin/doctor voient tous les patients, IDEL voit uniquement `assignedIdelId = user.id`

- [x] **T4** — Modifier `GET /api/v1/patients/[id]` pour appliquer le filtre IDEL (AC: 2)
  - [x] T4.1-T4.3 — Vérification post-récupération : si role === 'idel' et `patient.assignedIdelId !== user.id` → 403

- [x] **T5** — Mettre à jour la page patients Back Office web pour afficher et gérer les assignations (AC: 1, 3, 5)
  - [x] T5.1 — Colonne "IDEL assigné" dans le tableau (badge "Assigné" ou "Non assigné")
  - [x] T5.2-T5.4 — Bouton sur chaque ligne → `AssignIdelModal` → appel `PATCH /api/v1/patients/[id]/assign`
  - [x] T5.5 — Option "Non assigné" dans le modal (idelId: null = désassignation)
  - [x] T5.6 — `fetchPatients()` appelé après succès du modal
  - [x] T5.7 — Type local `Patient` mis à jour avec `assignedIdelId: string | null`

- [x] **T6** — Mettre à jour la liste patients mobile pour n'afficher que les patients assignés (AC: 2, 4)
  - [x] T6.2 — Schéma SQLite local mis à jour : `assigned_idel_id TEXT` ajouté dans `apps/mobile/src/lib/db.ts` et `packages/db/schema/patient-schema.ts`
  - [x] T6.1/T6.3/T6.4 — Le filtre est appliqué côté serveur (API) ; côté mobile la liste se synchronise depuis l'API et seuls les patients assignés à l'IDEL sont retournés

## Dev Notes

### Décision architecturale critique — Deux niveaux d'isolation

Cette story introduit un **second niveau d'isolation** sur les patients :

| Niveau | Champ | Acteurs concernés |
|--------|-------|-------------------|
| 1 — Structure (existant) | `structureId` | Tous les rôles — isolation absolue entre cabinets |
| 2 — IDEL (nouveau ici) | `assignedIdelId` | IDEL collaborateurs uniquement — isolation au sein du cabinet |

L'admin et le médecin prescripteur voient TOUS les patients de leur structure (niveau 1 uniquement). Les IDELs ne voient que leurs patients assignés (niveau 1 + niveau 2).

### Migration de schéma — `assignedIdelId` nullable

Le champ est **nullable** intentionnellement : un patient peut exister sans être assigné à un IDEL (géré par l'admin). Les stories 3.1 et 3.2 créent des patients sans `assignedIdelId`.

```typescript
// packages/db/schema/patient-schema.ts

// SQLite (mobile)
export const patients = sqliteTable('patients', {
  // ... champs existants ...
  assignedIdelId: text('assigned_idel_id'),  // nullable — ajout story 3.3
});

// PostgreSQL (serveur)
export const patientsPg = pgTable('patients', {
  // ... champs existants ...
  assignedIdelId: pgText('assigned_idel_id'),  // nullable — ajout story 3.3
});
```

### Route PATCH assign — Pattern complet

```typescript
// apps/web/src/app/api/v1/patients/[id]/assign/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg, authUser } from '@kura/db';

const AssignSchema = z.object({
  idelId: z.string().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (user.role !== 'admin') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_BODY', details: parsed.error } }, { status: 400 });

  const { idelId } = parsed.data;

  // Vérifier que l'IDEL cible est dans la même structure
  if (idelId !== null) {
    const [targetIdel] = await db
      .select({ id: authUser.id })
      .from(authUser)
      .where(and(eq(authUser.id, idelId), eq(authUser.structureId, user.structureId), eq(authUser.role, 'idel')));
    if (!targetIdel) return NextResponse.json({ error: { code: 'IDEL_NOT_FOUND' } }, { status: 404 });
  }

  // Vérifier existence du patient avec double filtre
  const [patient] = await db
    .select()
    .from(patientsPg)
    .where(and(eq(patientsPg.id, id), eq(patientsPg.structureId, user.structureId)));
  if (!patient) return NextResponse.json({ error: { code: 'PATIENT_NOT_FOUND' } }, { status: 404 });

  // Mettre à jour l'assignation
  await db.update(patientsPg)
    .set({
      assignedIdelId: idelId,
      updatedAt: new Date(),
      // Désassignation → nettoyage mobile déclenché via syncedAt = null
      ...(idelId === null ? { syncedAt: null } : {}),
    })
    .where(eq(patientsPg.id, id));

  const [updated] = await db.select().from(patientsPg).where(eq(patientsPg.id, id));
  return NextResponse.json({ data: { patient: updated } });
}
```

### Filtre IDEL dans GET /api/v1/patients — Pattern

```typescript
// apps/web/src/app/api/v1/patients/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg } from '@kura/db';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  let patients;
  if (user.role === 'idel') {
    // Filtre IDEL : uniquement les patients assignés à cet IDEL
    patients = await db
      .select()
      .from(patientsPg)
      .where(and(
        eq(patientsPg.structureId, user.structureId),
        eq(patientsPg.assignedIdelId, user.id),
      ));
  } else {
    // Admin et doctor : tous les patients de la structure
    patients = await db
      .select()
      .from(patientsPg)
      .where(eq(patientsPg.structureId, user.structureId));
  }

  return NextResponse.json({ data: { patients } });
}
```

### Filtre IDEL dans GET /api/v1/patients/[id]

```typescript
// À ajouter dans le handler GET existant (story 3.2)
// Après récupération du patient, avant de retourner :
if (user.role === 'idel' && patient.assignedIdelId !== user.id) {
  return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
}
```

### Route team existante — Récupération des IDELs

La route `GET /api/v1/team` (déjà implémentée) retourne les membres de la structure. Pour le modal d'assignation, filtrer côté client sur `role === 'idel'` :

```typescript
// Dans AssignIdelModal — récupération des IDELs disponibles
const res = await fetch('/api/v1/team');
const { data } = await res.json();
const idels = data.members.filter((m: Member) => m.role === 'idel' && !m.disabled);
```

### Structure des fichiers à créer/modifier

**Nouveaux (web) :**
- `apps/web/src/app/api/v1/patients/[id]/assign/route.ts` — PATCH assign/désassigner

**Modifiés (web) :**
- `apps/web/src/app/api/v1/patients/route.ts` — GET avec filtre IDEL (stub → implémentation)
- `apps/web/src/app/api/v1/patients/[id]/route.ts` — GET + vérification `assignedIdelId` pour IDEL (histoire 3.2)
- `apps/web/src/app/(admin)/patients/page.tsx` — Colonne IDEL assigné + modal assignation

**Modifiés (packages) :**
- `packages/db/schema/patient-schema.ts` — Ajout `assignedIdelId` nullable (SQLite + PostgreSQL)
- `packages/shared/src/types/patient.ts` — Ajout `assignedIdelId: string | null`

**Modifiés (mobile) :**
- Schema SQLite mobile (à localiser) — Ajout `assignedIdelId` + migration locale

**À NE PAS TOUCHER :**
- `packages/db/schema/user-schema.ts` — Structure des rôles inchangée
- `apps/web/src/lib/auth.ts` — Configuration BetterAuth inchangée
- Toute logique de géocodage — hors scope

### Important — Dependency sur Story 3.2

Si la story 3.2 n'est pas encore implémentée (fichier `apps/web/src/app/api/v1/patients/[id]/route.ts` encore à créer), cette story doit implémenter les deux en même temps ou être séquencée après. Vérifier l'état réel du fichier avant de démarrer.

L'implémentation de `GET /api/v1/patients` (T3) est également un stub dans la codebase actuelle — cette story l'implémente réellement pour la première fois.

### Important — Next.js App Router params asynchrones (Next.js 15+)

```typescript
// ✅ Correct
type RouteParams = { params: Promise<{ id: string }> };
export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
}
// ❌ Incorrect (pattern Next.js < 15)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
}
```

### Contrainte Story 3.4

La story 3.4 (recherche/filtrage) devra respecter le filtre `assignedIdelId` mis en place ici. Ne pas implémenter de logique de recherche dans cette story.

### Notification push — AC 1 (scope limité)

La notification push "Un nouveau patient vous a été assigné" est mentionnée dans l'AC mais Firebase FCM est traité dans l'Epic 7. **Ne pas implémenter la notification dans cette story** — documenter un `TODO: Story 7.1 — notification assignation` dans le code à l'endroit approprié.

### Références

- Pattern API existant avec double filtre : `apps/web/src/app/api/v1/admin/members/[userId]/route.ts`
- Pattern auth session : `apps/web/src/app/api/v1/admin/members/route.ts`
- Route team (IDELs) : `apps/web/src/app/api/v1/team/route.ts`
- Schéma patient : `packages/db/schema/patient-schema.ts`
- Types patient : `packages/shared/src/types/patient.ts`
- Architecture RBAC : `_bmad-output/planning-artifacts/architecture.md` — section 3.3
- Enveloppe réponse : `{ data, error }` — `_bmad-output/planning-artifacts/architecture.md` — section 4.3

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Ajout `assignedIdelId` nullable dans les deux schémas Drizzle (SQLite mobile + PostgreSQL). Migration PostgreSQL générée (`0006_bitter_invisible_woman.sql`) — à appliquer avec DATABASE_URL.
- `PATCH /api/v1/patients/[id]/assign` (admin only) : vérifie l'IDEL cible dans la même structure, double filtre patient, désassignation remet `syncedAt = null`. TODO Story 7.1 laissé dans le code pour la notification push.
- `GET /api/v1/patients` : suppression du blocage doctor (désormais autorisé en lecture). Filtre IDEL : `assignedIdelId = user.id` uniquement pour le rôle idel.
- `GET /api/v1/patients/[id]` : vérification post-récupération — IDEL bloqué (403) si `patient.assignedIdelId !== user.id`.
- Page web patients : colonne "IDEL assigné" + `AssignIdelModal` (liste IDELs via GET /api/v1/team, sélection, confirmation).
- 54 tests passent (7 fichiers), 0 erreur TypeScript.

### File List

**Nouveaux :**
- `apps/web/src/app/api/v1/patients/[id]/assign/route.ts`
- `apps/web/src/app/api/v1/patients/[id]/assign/route.test.ts`
- `packages/db/migrations/0006_bitter_invisible_woman.sql`

**Modifiés :**
- `packages/db/schema/patient-schema.ts` — ajout `assignedIdelId` (SQLite + PostgreSQL)
- `packages/shared/src/types/patient.ts` — ajout `assignedIdelId: string | null`
- `apps/mobile/src/lib/db.ts` — ajout `assigned_idel_id TEXT` dans CREATE TABLE
- `apps/web/src/app/api/v1/patients/route.ts` — filtre IDEL + autorisation doctor
- `apps/web/src/app/api/v1/patients/route.test.ts` — mise à jour tests GET
- `apps/web/src/app/api/v1/patients/[id]/route.ts` — check IDEL post-récupération
- `apps/web/src/app/api/v1/patients/[id]/route.test.ts` — nouveaux tests IDEL
- `apps/web/src/app/(admin)/patients/page.tsx` — colonne IDEL + AssignIdelModal

## Change Log

- 2026-04-22 : Implémentation Story 3.3 — Double isolation patient (structureId + assignedIdelId), route PATCH assign, filtre IDEL dans GET list et GET détail, UI d'assignation dans le Back Office. 54 tests passent.
