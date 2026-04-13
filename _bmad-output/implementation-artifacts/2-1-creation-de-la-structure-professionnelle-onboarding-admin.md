# Story 2.1 : Création de la Structure Professionnelle (Onboarding Admin)

Status: review

## Story

En tant qu'admin connecté pour la première fois (sans structure existante),
Je veux créer ma structure professionnelle (cabinet ou réseau IDEL) avec ses informations essentielles,
Afin de pouvoir ensuite inviter mon équipe et gérer mes patients depuis un espace centralisé.

## Acceptance Criteria

**AC1 — Création de la structure (happy path) :**
- Given un admin connecté sans `structureId` dans son compte
- When il complète le formulaire d'onboarding (nom cabinet, adresse, SIRET optionnel)
- Then `POST /api/v1/structures` crée la structure avec un ID ULID unique
- And le `structureId` de l'utilisateur est mis à jour en base (`authUser.structureId`)
- And l'admin est redirigé vers `/dashboard` avec un message de succès

**AC2 — Isolation multi-tenant :**
- Given l'admin dans le Back Office
- When il accède à ses données
- Then seules les données de sa propre structure sont visibles (filtrage `structureId` strict sur toutes les requêtes)

**AC3 — SIRET optionnel avec alerte de doublon :**
- Given un second admin avec le même SIRET
- When il tente de créer une structure
- Then une alerte "Cette structure semble déjà exister" est affichée (sans blocage dur — création autorisée)
- And si SIRET absent, aucune vérification de doublon

**AC4 — Redirection automatique vers onboarding :**
- Given un admin authentifié sans `structureId`
- When il tente d'accéder à n'importe quelle page protégée (`/dashboard`, etc.)
- Then il est redirigé vers `/onboarding`

**AC5 — Accès limité hors onboarding :**
- Given un admin sur la page `/onboarding`
- When il essaie de naviguer directement vers `/dashboard` sans avoir créé sa structure
- Then il est redirigé vers `/onboarding`

## Tasks / Subtasks

- [x] **T1 — Corriger le schéma `structuresPg` : SIRET nullable** (AC: 1, 3)
  - [x] T1.1 — Lire `packages/db/schema/structure-schema.ts` EN ENTIER
  - [x] T1.2 — Modifier `structuresPg.siret` : `notNull().unique()` → `.unique()` (nullable)
  - [x] T1.3 — Même correction sur la table SQLite `structures.siret`
  - [x] T1.4 — Créer la migration Drizzle : `cd packages/db && pnpm drizzle-kit generate` → `migrations/0003_lame_killer_shrike.sql`

- [x] **T2 — Route API `POST /api/v1/structures`** (AC: 1, 2, 3)
  - [x] T2.1 — Créer `apps/web/src/app/api/v1/structures/route.ts`
  - [x] T2.2 — `POST` : Valider le body avec Zod (`name: string, address: string, siret?: string`)
  - [x] T2.3 — Vérifier l'authentification : `auth.api.getSession()` — 401 si pas de session
  - [x] T2.4 — Vérifier le rôle : `session.user.role === 'admin'` — 403 sinon
  - [x] T2.5 — Si SIRET fourni : chercher dans `structuresPg` si une structure avec ce SIRET existe déjà → warning `SIRET_EXISTS` (pas un blocage)
  - [x] T2.6 — Générer l'ID ULID via `import { generateId } from '@kura/shared'`
  - [x] T2.7 — Insérer dans `structuresPg` avec `.returning()`
  - [x] T2.8 — Mettre à jour `authUser.structureId` via Drizzle
  - [x] T2.9 — Répondre `201 Created` avec `{ data: { structure, warning } }`
  - [x] T2.10 — `/api/v1/structures` non listé dans PUBLIC_PATHS — accès API autorisé même sans structureId (guard middleware exclut `/api/`)

- [x] **T3 — Mettre à jour le middleware pour redirection onboarding** (AC: 4, 5)
  - [x] T3.1 — Lire `apps/web/src/proxy.ts` EN ENTIER
  - [x] T3.2 — Guard ajouté : session sans `structureId` + route non `/api/` → redirect `/onboarding`
  - [x] T3.3 — `/onboarding` ajouté à `PUBLIC_PATHS` (évite boucle infinie)
  - [x] T3.4 — `apps/web/src/middleware.test.ts` mis à jour : 4 nouveaux tests (structureId null, onboarding no-loop, API bypass, valid session) — 7/7 passent

- [x] **T4 — Page d'onboarding `/onboarding`** (AC: 1, 3)
  - [x] T4.1 — Créer `apps/web/src/app/(admin)/onboarding/page.tsx`
  - [x] T4.2 — `'use client'`
  - [x] T4.3 — Formulaire React Hook Form + Zod (name, address, siret optionnel)
  - [x] T4.4 — Submit → POST /api/v1/structures → warning jaune si SIRET_EXISTS → redirect /dashboard
  - [x] T4.5 — Design card centré, fond `#F0F4F8`, couleurs KURA
  - [x] T4.6 — Titre "Créez votre structure", sous-titre adéquat
  - [x] T4.7 — Bouton disabled + texte "Création en cours…" si isSubmitting
  - [x] T4.8 — aria-label sur tous les inputs et le bouton

- [x] **T5 — Afficher le nom de structure dans le layout admin** (AC: 1, 2)
  - [x] T5.1 — Lire `apps/web/src/app/(admin)/layout.tsx` EN ENTIER
  - [x] T5.2 — Aucun fetch serveur ajouté — scope dépassé pour cette story
  - [x] T5.3 — "KURA Back Office" conservé statique — TODO story 2.5 : afficher `structure.name` dynamiquement

## Dev Notes

### Contexte Critique — Ce qui existe déjà

**Schémas Drizzle existants (à NE PAS recréer) :**

```typescript
// packages/db/schema/structure-schema.ts — EXISTE DÉJÀ (à modifier T1)
export const structuresPg = pgTable('structures', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  name: pgText('name').notNull(),
  address: pgText('address').notNull(),
  siret: pgText('siret').notNull().unique(), // ← À modifier : supprimer notNull()
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
```

**BetterAuth `authUser` déjà configuré avec `structureId` et `role` :**

```typescript
// apps/web/src/lib/auth.ts (DÉJÀ en place)
user: {
  additionalFields: {
    structureId: { type: 'string', required: false, input: true },
    role: { type: 'string', required: false, defaultValue: 'idel', input: true },
  },
},
```

**Middleware actuel (proxy.ts) — structure :**
```typescript
// PUBLIC_PATHS : ['/api/auth', '/(auth)/login', '/login', '/reset-password', '/forgot-password']
// Guard : session absente → redirect /login
// MANQUANT : pas de guard "session présente mais structureId null → redirect /onboarding"
```

**Pages admin existantes (placeholders) :**
- `/dashboard` → `"à implémenter (Story 8.1)"` — accès doit être bloqué sans structureId
- `/sessions` → implémenté (Story 1.7)
- `/idels`, `/patients`, `/settings` → placeholders

### Pièges Connus

1. **SIRET `notNull()` dans le schéma actuel** : Le schéma existant a `siret: pgText('siret').notNull().unique()`. Changer `.notNull()` en permettant `null` requiert une migration Drizzle (`generate` + `migrate`). Ne pas oublier la même correction pour la table SQLite mobile (`structures` dans `structure-schema.ts`).

2. **Migration Drizzle PostgreSQL** : Après modification du schéma, générer et appliquer la migration :
   ```bash
   cd packages/db
   pnpm drizzle-kit generate  # génère le fichier de migration SQL
   pnpm drizzle-kit migrate   # ou appliquer manuellement via le SQL généré
   ```

3. **`session.user.structureId` dans le middleware** : BetterAuth expose les `additionalFields` dans `session.user`, MAIS le type TypeScript peut ne pas inclure `structureId` automatiquement. Si `session.user.structureId` n'est pas typé, faire `(session.user as { structureId?: string }).structureId`.

4. **Boucle infinie dans le middleware** : Si `/onboarding` n'est pas dans les exceptions du guard "structureId null → redirect onboarding", cela crée une boucle. Ajouter explicitement `/onboarding` comme exception.

5. **`generateId` vs `ulid()`** : Le projet utilise `import { generateId } from '@kura/shared'` (wrapper autour de `ulidx`). Ne pas importer `ulid` directement, utiliser `generateId`.

6. **Mise à jour `structureId` via Drizzle directement** : BetterAuth gère la table `user` via son adaptateur. Pour mettre à jour `structureId` après création de structure, faire directement via Drizzle sur `authUser` :
   ```typescript
   import { authUser } from '@kura/db';
   await db.update(authUser).set({ structureId: structure.id }).where(eq(authUser.id, session.user.id));
   ```

7. **Pas de `structureId` dans le token de session immédiatement** : BetterAuth ne refresh pas automatiquement le token de session après une mise à jour `additionalFields`. Après le POST, le middleware pourra toujours voir `structureId: null` jusqu'à la prochaine session. Solution : forcer un redirect vers `/dashboard` côté client après succès (pas via middleware). Alternativement, utiliser `auth.api.updateUser` de BetterAuth qui peut déclencher un refresh.

8. **Middleware `proxy.ts` vs `middleware.ts`** : Le projet a `proxy.ts` (la logique) et il est probable qu'un `middleware.ts` l'exporte. Vérifier `apps/web/src/middleware.ts`.

### Pattern API à Suivre

```typescript
// ✅ Correct — POST /api/v1/structures
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Réservé aux admins' } }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = StructureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  // Vérification SIRET doublon (soft warning, pas blocage)
  let warning: string | undefined;
  if (parsed.data.siret) {
    const existing = await db.select().from(structuresPg).where(eq(structuresPg.siret, parsed.data.siret)).limit(1);
    if (existing.length > 0) warning = 'SIRET_EXISTS';
  }

  const structure = await db.insert(structuresPg).values({
    id: generateId(),
    name: parsed.data.name,
    address: parsed.data.address,
    siret: parsed.data.siret ?? null,
    createdAt: new Date(),
  }).returning();

  await db.update(authUser).set({ structureId: structure[0].id }).where(eq(authUser.id, session.user.id));

  return NextResponse.json({ data: { structure: structure[0], warning } }, { status: 201 });
}
```

### Schema Zod pour le formulaire

```typescript
import { z } from 'zod';

export const StructureSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});
```

### Middleware Pattern Mis à Jour

```typescript
// apps/web/src/proxy.ts — modification T3
const PUBLIC_PATHS = [
  '/api/auth',
  '/(auth)/login',
  '/login',
  '/reset-password',
  '/forgot-password',
  '/onboarding', // ← AJOUTER pour éviter boucle infinie
];

// Dans la fonction proxy, APRÈS la vérification de session :
if (session && !session.user.structureId && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
  return NextResponse.redirect(new URL('/onboarding', request.url));
}
```

### Fichiers à Créer / Modifier

```
packages/db/schema/
└── structure-schema.ts          → MODIFIER (T1 — siret nullable SQLite + PG)

apps/web/src/
├── app/
│   ├── (admin)/
│   │   └── onboarding/
│   │       └── page.tsx         → CRÉER (T4)
│   └── api/v1/
│       └── structures/
│           └── route.ts         → CRÉER (T2)
├── proxy.ts                     → MODIFIER (T3 — guard structureId null)
└── middleware.test.ts           → MODIFIER (T3.4 — nouveaux tests)
```

### Apprentissages Stories Précédentes

- **Pattern apostrophe** : toujours utiliser double quotes `"` pour les chaînes en JSX/TSX contenant des apostrophes françaises (`c'est`, `d'un`, etc.) — cf. bugs répétés stories 1.7, admin/sessions
- **Pattern enveloppe API** : `{ data }` succès, `{ error: { code, message } }` erreur — JAMAIS de réponse directe
- **Pattern Drizzle update** : `db.update(table).set({}).where(eq(table.id, id)).returning()` — toujours `.returning()` pour confirmer l'update
- **BetterAuth admin sessions** : `auth.api.listSessions` liste uniquement les sessions de l'user courant. Pour d'autres users, utiliser Drizzle direct sur `authUser` et `authSession`
- **TypeScript strict** : `session.user.role !== 'admin'` nécessite que `role` soit dans le type de `session.user` — vérifier que BetterAuth expose bien les `additionalFields` dans le type session

### Références

- Structure schema : `packages/db/schema/structure-schema.ts`
- Auth schema (authUser) : `packages/db/schema/auth-schema.ts`
- BetterAuth config (additionalFields) : `apps/web/src/lib/auth.ts`
- Middleware actuel : `apps/web/src/proxy.ts`
- Pattern API existant (admin sessions) : `apps/web/src/app/api/v1/admin/sessions/route.ts`
- Project Context (règles TypeScript, Drizzle, API) : `_bmad-output/project-context.md`
- Epic 2 story 2.1 AC : `_bmad-output/planning-artifacts/epics.md` (section Epic 2)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Schéma SIRET rendu nullable (SQLite + PG) + migration Drizzle `0003_lame_killer_shrike.sql` générée
- `POST /api/v1/structures` : validation Zod, guard admin, SIRET soft-warning, insert + update authUser.structureId
- Middleware `proxy.ts` : guard structureId null → `/onboarding`, avec exclusion `/api/` et `/onboarding` dans PUBLIC_PATHS
- Page onboarding : React Hook Form + Zod, warning SIRET_EXISTS, redirect /dashboard, design KURA
- 10/10 tests vitest passent (7 middleware + 3 auth)
- Layout admin conservé statique "KURA Back Office" — TODO story 2.5

### File List

- `packages/db/schema/structure-schema.ts` — MODIFIÉ (siret nullable SQLite + PG)
- `packages/db/migrations/0003_lame_killer_shrike.sql` — CRÉÉ (migration Drizzle)
- `apps/web/src/app/api/v1/structures/route.ts` — CRÉÉ (POST /api/v1/structures)
- `apps/web/src/proxy.ts` — MODIFIÉ (guard structureId null + /onboarding PUBLIC_PATHS)
- `apps/web/src/middleware.test.ts` — MODIFIÉ (4 nouveaux tests onboarding)
- `apps/web/src/app/(admin)/onboarding/page.tsx` — CRÉÉ (formulaire onboarding)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-27 | Implémentation complète story 2.1 — schéma SIRET nullable, API structures, middleware onboarding, page onboarding | claude-sonnet-4-6 |
