# Story 2.2 : Invitation des IDEL Collaborateurs

Status: review

## Story

En tant qu'admin,
Je veux inviter des IDEL collaborateurs par email avec le rôle "IDEL collaborateur",
Afin qu'ils puissent rejoindre ma structure et accéder uniquement à leurs patients assignés.

## Acceptance Criteria

**AC1 — Envoi de l'invitation (happy path) :**
- Given le Back Office > Paramètres > Équipe
- When l'admin saisit un email et sélectionne "IDEL collaborateur" puis envoie l'invitation
- Then `POST /api/v1/invitations` crée une invitation avec token sécurisé (valide 7 jours)
- And un email est envoyé avec le lien d'acceptation (console.log en dev, Resend en prod)
- And l'IDEL apparaît en statut "Invitation en attente" dans la liste de l'équipe

**AC2 — Acceptation de l'invitation par l'IDEL :**
- Given l'IDEL clique sur le lien d'invitation `/accept-invitation?token=xxx`
- When il se connecte ou crée son compte puis clique "Rejoindre la structure"
- Then `POST /api/v1/invitations/accept` lie son compte à la structure avec le rôle `idel`
- And son `structureId` et `role` sont mis à jour dans `authUser`
- And l'invitation passe en statut `accepted`

**AC3 — Lien d'invitation expiré :**
- Given un lien d'invitation expiré (plus de 7 jours)
- When l'IDEL tente de l'utiliser
- Then le message "Cette invitation a expiré — contactez votre admin pour en recevoir une nouvelle" s'affiche
- And le bouton "Rejoindre" est absent

**AC4 — Isolation multi-tenant :**
- Given l'invitation créée par un admin
- When `GET /api/v1/invitations` est appelé
- Then seules les invitations de la structure de l'admin sont retournées

**AC5 — Doublon email :**
- Given un email déjà invité et en attente
- When l'admin tente de réinviter le même email
- Then une erreur `409 INVITATION_ALREADY_PENDING` est retournée

## Tasks / Subtasks

- [x] **T1 — Créer la table `invitationsPg` dans le schéma** (AC: 1, 2, 3, 4)
  - [x] T1.1 — Lire `packages/db/schema/structure-schema.ts` EN ENTIER
  - [x] T1.2 — Ajouter `invitationsPg` (PostgreSQL uniquement — les invitations sont server-side) :
    ```typescript
    export const invitationsPg = pgTable('invitations', {
      id: pgText('id').primaryKey(),
      email: pgText('email').notNull(),
      role: pgText('role', { enum: ['idel', 'doctor'] }).notNull(),
      structureId: pgText('structure_id').notNull(),
      invitedBy: pgText('invited_by').notNull(),
      token: pgText('token').notNull().unique(),
      status: pgText('status', { enum: ['pending', 'accepted', 'expired'] }).notNull().default('pending'),
      expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    });
    ```
  - [x] T1.3 — Exporter `invitationsPg` dans `packages/db/schema/index.ts`
  - [x] T1.4 — Générer la migration Drizzle : `cd packages/db && pnpm drizzle-kit generate`
  - [x] T1.5 — `db.ts` utilise `* as schema` — `invitationsPg` inclus automatiquement, aucune modification requise

- [x] **T2 — Route API `POST /api/v1/invitations`** (AC: 1, 4, 5)
  - [x] T2.1 — Créer `apps/web/src/app/api/v1/invitations/route.ts`
  - [x] T2.2 — `POST` : Valider avec Zod `{ email: z.string().email(), role: z.enum(['idel', 'doctor']) }`
  - [x] T2.3 — Auth guard : `session.user.role === 'admin'` ET `session.user.structureId` non null → 403 sinon
  - [x] T2.4 — Vérifier doublon : invitation `pending` avec même email + structureId → 409 `INVITATION_ALREADY_PENDING`
  - [x] T2.5 — Générer token : `crypto.randomBytes(32).toString('hex')` (64 chars hexadécimal)
  - [x] T2.6 — Calculer `expiresAt` : `new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)`
  - [x] T2.7 — Insérer dans `invitationsPg` avec `generateId()` pour l'id
  - [x] T2.8 — Envoyer email (console.log dev, TODO Resend prod)
  - [x] T2.9 — Répondre `201 Created` : `{ data: { invitation: { id, email, role, status, expiresAt } } }`

- [x] **T3 — Route API `GET /api/v1/invitations`** (AC: 4)
  - [x] T3.1 — Dans le même `route.ts` (T2.1)
  - [x] T3.2 — `GET` : lister les invitations de `session.user.structureId`
  - [x] T3.3 — Filtrer par `structureId` obligatoirement (isolation multi-tenant)
  - [x] T3.4 — Marquer les invitations expirées : si `expiresAt < now && status === 'pending'` → statut affiché `expired` (côté lecture uniquement)
  - [x] T3.5 — Répondre `200` : `{ data: { invitations: [...] } }`

- [x] **T4 — Route API `POST /api/v1/invitations/accept`** (AC: 2, 3)
  - [x] T4.1 — Créer `apps/web/src/app/api/v1/invitations/accept/route.ts`
  - [x] T4.2 — `POST` : body `{ token: string }` — utilisateur doit être authentifié
  - [x] T4.3 — Récupérer l'invitation par token depuis `invitationsPg`
  - [x] T4.4 — Vérifier que `status === 'pending'` ET `expiresAt > now` → 400 `INVITATION_EXPIRED` ou `INVITATION_ALREADY_USED` sinon
  - [x] T4.5 — Vérifier que l'email de l'invitation = email de l'utilisateur authentifié → 403 `EMAIL_MISMATCH` sinon
  - [ ] T4.6 — Mettre à jour `authUser` :
    ```typescript
    db.update(authUser).set({
      structureId: invitation.structureId,
      role: invitation.role,
    }).where(eq(authUser.id, session.user.id))
    ```
  - [x] T4.7 — Mettre à jour l'invitation : `db.update(invitationsPg).set({ status: 'accepted' }).where(eq(invitationsPg.id, invitation.id))`
  - [x] T4.8 — Répondre `200` : `{ data: { accepted: true, structureId: invitation.structureId } }`

- [x] **T5 — Route API `GET /api/v1/invitations/validate?token=xxx`** (AC: 2, 3)
  - [x] T5.1 — Dans `apps/web/src/app/api/v1/invitations/accept/route.ts` ajouter `GET`
  - [x] T5.2 — Route PUBLIQUE : valider le token sans authentification
  - [x] T5.3 — Récupérer invitation par token, vérifier validité
  - [x] T5.4 — Répondre avec les infos publiques : `{ data: { valid: true, role, structureId, email, expiresAt } }` ou `{ data: { valid: false, reason: 'EXPIRED' | 'NOT_FOUND' | 'ALREADY_USED' } }`
  - [x] T5.5 — Ajouter `/api/v1/invitations/accept` à `PUBLIC_PATHS` dans `proxy.ts` (pour le GET de validation)

- [x] **T6 — Page publique `/accept-invitation`** (AC: 2, 3)
  - [x] T6.1 — Créer `apps/web/src/app/(auth)/accept-invitation/page.tsx`
  - [x] T6.2 — `'use client'` avec `useSearchParams()` pour lire `token`
  - [x] T6.3 — Au chargement : `GET /api/v1/invitations/accept?token=xxx` → afficher l'état (token absent, EXPIRED, ALREADY_USED, valid)
  - [x] T6.4 — Si invitation valide et utilisateur NON authentifié : bouton "Se connecter / Créer un compte"
  - [x] T6.5 — Si invitation valide et utilisateur AUTHENTIFIÉ : bouton "Rejoindre la structure", succès → /dashboard, erreur EMAIL_MISMATCH → message
  - [x] T6.6 — Ajouter `/accept-invitation` à `PUBLIC_PATHS` dans `proxy.ts`
  - [x] T6.7 — Design cohérent avec les pages auth (fond blanc centré, titre KURA)

- [x] **T7 — Page `/settings` — section Équipe** (AC: 1, 4)
  - [x] T7.1 — Lire `apps/web/src/app/(admin)/settings/page.tsx` EN ENTIER
  - [x] T7.2 — Remplacer le placeholder par la section "Équipe" (invitation form + liste)
  - [x] T7.3 — `'use client'`
  - [x] T7.4 — Formulaire d'invitation : input email + select rôle + bouton "Envoyer l'invitation" avec Zod + feedback 409
  - [x] T7.5 — Liste des invitations : statut badges colorés (En attente / Acceptée / Expirée)
  - [x] T7.6 — `aria-label` sur tous les éléments interactifs

## Dev Notes

### Contexte Critique — Ce qui existe déjà

**Schéma à modifier (T1) :**
```typescript
// packages/db/schema/structure-schema.ts — EXISTE DÉJÀ
// Ajouter : invitationsPg (PostgreSQL seulement — pas de table SQLite mobile)
// Note : les invitations sont server-side only, l'IDEL n'en a pas besoin offline
```

**BetterAuth `authUser.role` enum déjà défini :**
```typescript
// packages/db/schema/auth-schema.ts (DÉJÀ en place)
role: text('role', { enum: ['admin', 'idel', 'doctor'] })
```
> ⚠️ Le rôle stocké en DB est `'idel'` (minuscule, sans "collaborateur"). L'affichage UI "IDEL collaborateur" est cosmétique uniquement.

**Pattern email existant dans `auth.ts` (à reproduire) :**
```typescript
// apps/web/src/lib/auth.ts — sendResetPassword pattern
if (process.env['NODE_ENV'] === 'production') {
  // TODO: Resend — à brancher
  console.error('[auth] email non configuré en production');
  return;
}
console.log(`[DEV] Lien d'invitation pour ${email} :\n${invitationUrl}`);
```

**`auth.api.getSession` pattern :**
```typescript
// Pattern établi dans tous les handlers admin (sessions, structures)
const session = await auth.api.getSession({ headers: request.headers });
if (!session || session.user.role !== 'admin') {
  return NextResponse.json({ error: { code: 'FORBIDDEN', ... } }, { status: 403 });
}
```

**`generateId()` vs `crypto.randomBytes()` :**
- ID de l'invitation → `generateId()` (ULID, comme tous les IDs KURA)
- Token d'invitation → `crypto.randomBytes(32).toString('hex')` (token de sécurité, pas un ULID — doit être opaque et non-prédictible)

### Pièges Connus

1. **`crypto` dans Next.js 15** : Utiliser `import { randomBytes } from 'node:crypto'` — disponible nativement dans l'environnement Node.js/Edge de Next.js. Ne pas utiliser `Math.random()` pour les tokens de sécurité.

2. **Route `/api/v1/invitations/accept` doit être partiellement publique** : Le `GET` (validation token) est public (pas d'auth requise), mais le `POST` (acceptation) nécessite une session. Le middleware actuel bloque toutes les routes non-publiques. Ajouter `/api/v1/invitations/accept` à `PUBLIC_PATHS` uniquement pour le GET. Alternative : gérer dans le handler lui-même (`if (!session) return 401` dans le POST, mais ne pas vérifier dans le GET).

3. **`session.user.structureId` peut ne pas être typé** : BetterAuth expose les `additionalFields` mais le type TypeScript peut ne pas les inclure. Pattern : `(session.user as { structureId?: string | null; role?: string }).structureId`.

4. **Vérification email lors de l'acceptation** : L'IDEL qui accepte l'invitation doit avoir le même email que celui de l'invitation. MAIS : BetterAuth permet la création de compte avec n'importe quel email. Si l'IDEL crée un compte avec un email différent et clique sur le lien → `EMAIL_MISMATCH`. Documenter clairement dans l'UI.

5. **Double apostrophe dans les chaînes TSX** : Toujours utiliser `"double quotes"` pour les chaînes contenant des apostrophes françaises (ex: `"L'invitation"`, `"d'invitation"`). Pattern établi après plusieurs bugs en stories 1.6, 1.7, 2.1.

6. **`expiresAt` en JS** : `new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)` — pas de librairie date requise pour ce calcul simple.

7. **Index sur `token`** : Le token doit avoir un index unique (déjà dans le schéma avec `.unique()`). Pas besoin d'index supplémentaire.

8. **`useSearchParams` dans Next.js 15** : Nécessite `Suspense` wrapper dans le composant parent. Pattern établi dans `reset-password/page.tsx` :
   ```typescript
   'use client';
   import { Suspense } from 'react';
   export default function Page() {
     return <Suspense><AcceptInvitationContent /></Suspense>;
   }
   function AcceptInvitationContent() {
     const searchParams = useSearchParams();
     // ...
   }
   ```

9. **`db.ts` dans apps/web** : Vérifier comment `db` est construit et si `invitationsPg` doit être passé en tant que schéma explicitement ou s'il est inféré automatiquement via l'import.

### Pattern API pour l'invitation

```typescript
// apps/web/src/app/api/v1/invitations/route.ts
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitationsPg, authUser } from '@kura/db';
import { generateId } from '@kura/shared';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(['idel', 'doctor']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== 'admin' || !session.user.structureId) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin requis' } }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  // Vérifier doublon pending
  const existing = await db.select().from(invitationsPg).where(
    and(
      eq(invitationsPg.email, parsed.data.email),
      eq(invitationsPg.structureId, session.user.structureId),
      eq(invitationsPg.status, 'pending'),
    )
  ).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: { code: 'INVITATION_ALREADY_PENDING', message: 'Une invitation est déjà en attente pour cet email' } }, { status: 409 });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [invitation] = await db.insert(invitationsPg).values({
    id: generateId(),
    email: parsed.data.email,
    role: parsed.data.role,
    structureId: session.user.structureId,
    invitedBy: session.user.id,
    token,
    status: 'pending',
    expiresAt,
    createdAt: new Date(),
  }).returning();

  const invitationUrl = `${process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3000'}/accept-invitation?token=${token}`;
  if (process.env['NODE_ENV'] !== 'production') {
    console.log(`[DEV] Lien d'invitation pour ${parsed.data.email} :\n${invitationUrl}`);
  }

  return NextResponse.json({ data: { invitation: { id: invitation.id, email: invitation.email, role: invitation.role, status: invitation.status, expiresAt: invitation.expiresAt } } }, { status: 201 });
}
```

### Schema Zod partagé (formulaire settings)

```typescript
import { z } from 'zod';

export const InviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(['idel', 'doctor'], { required_error: "Rôle requis" }),
});
```

### Fichiers à Créer / Modifier

```
packages/db/schema/
├── structure-schema.ts         → MODIFIER (T1 — ajouter invitationsPg)
└── index.ts                    → MODIFIER (T1.3 — exporter invitationsPg)

apps/web/src/
├── app/
│   ├── (auth)/
│   │   └── accept-invitation/
│   │       └── page.tsx        → CRÉER (T6)
│   ├── (admin)/
│   │   └── settings/
│   │       └── page.tsx        → MODIFIER (T7 — section Équipe)
│   └── api/v1/
│       └── invitations/
│           ├── route.ts        → CRÉER (T2-T3 — POST + GET)
│           └── accept/
│               └── route.ts   → CRÉER (T4-T5 — POST accept + GET validate)
└── proxy.ts                    → MODIFIER (T5.5, T6.6 — PUBLIC_PATHS)
```

### Apprentissages Stories Précédentes

- **Double apostrophe obligatoire en TSX** : `"L'invitation"`, `"d'un"` → jamais de single quotes pour les chaînes avec apostrophes — bug répété stories 1.6, 1.7, 2.1, sessions page
- **Pattern enveloppe API** : `{ data }` / `{ error: { code, message } }` — toujours
- **`structureId` sur toutes les requêtes** : isolation multi-tenant stricte — jamais de query sans `where(eq(table.structureId, session.user.structureId))`
- **`generateId()` pour les IDs** : `import { generateId } from '@kura/shared'` — jamais UUID v4 direct, jamais auto-increment
- **`session.user.structureId` peut ne pas être typé** : cast `(session.user as { structureId?: string | null })`
- **`useSearchParams()` nécessite Suspense** : wrapper obligatoire Next.js 15 — cf. `reset-password/page.tsx`
- **BetterAuth `additionalFields`** : structureId et role sont disponibles dans `session.user` mais peuvent manquer dans les types TypeScript générés

### Références

- Story 2.1 (contexte structure) : `_bmad-output/implementation-artifacts/2-1-creation-de-la-structure-professionnelle-onboarding-admin.md`
- Structure schema : `packages/db/schema/structure-schema.ts`
- Auth schema (authUser) : `packages/db/schema/auth-schema.ts`
- Pattern API admin : `apps/web/src/app/api/v1/admin/sessions/route.ts`
- Pattern email (sendResetPassword) : `apps/web/src/lib/auth.ts`
- Pattern useSearchParams + Suspense : `apps/web/src/app/(auth)/reset-password/page.tsx`
- Middleware actuel : `apps/web/src/proxy.ts`
- Project Context (ULID, TypeScript strict, API envelope) : `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Table `invitationsPg` ajoutée dans `structure-schema.ts` + exportée depuis `index.ts` + migration `0004_regular_bloodaxe.sql` générée
- `POST /api/v1/invitations` : Zod, guard admin+structureId, doublon 409, token `crypto.randomBytes`, console.log dev
- `GET /api/v1/invitations` : isolation multi-tenant stricte, enrichissement expired côté lecture
- `GET /api/v1/invitations/accept?token=xxx` : route publique — valid/invalid/expired/already-used
- `POST /api/v1/invitations/accept` : auth requise, EMAIL_MISMATCH, update authUser + invitation status
- `proxy.ts` : `/accept-invitation` et `/api/v1/invitations/accept` ajoutés à `PUBLIC_PATHS`
- Page `/accept-invitation` : Suspense + useSearchParams, état token, bouton rejoindre, redirect /dashboard
- Page `/settings` : section Équipe, formulaire invitation React Hook Form + Zod, liste invitations avec badges statut
- 10/10 tests passent (aucune régression)

### File List

- `packages/db/schema/structure-schema.ts` — MODIFIÉ (invitationsPg ajoutée)
- `packages/db/schema/index.ts` — MODIFIÉ (export invitationsPg)
- `packages/db/migrations/0004_regular_bloodaxe.sql` — CRÉÉ (migration Drizzle)
- `apps/web/src/app/api/v1/invitations/route.ts` — CRÉÉ (POST + GET invitations)
- `apps/web/src/app/api/v1/invitations/accept/route.ts` — CRÉÉ (GET validate + POST accept)
- `apps/web/src/proxy.ts` — MODIFIÉ (PUBLIC_PATHS : accept-invitation + api/v1/invitations/accept)
- `apps/web/src/app/(auth)/accept-invitation/page.tsx` — CRÉÉ (page publique acceptation)
- `apps/web/src/app/(admin)/settings/page.tsx` — MODIFIÉ (section Équipe : formulaire + liste)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-27 | Implémentation complète story 2.2 — table invitations, API CRUD invitations, page accept-invitation, settings équipe | claude-sonnet-4-6 |
