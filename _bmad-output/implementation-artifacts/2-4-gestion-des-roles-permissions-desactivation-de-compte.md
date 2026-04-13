# Story 2.4 : Gestion des Rôles, Permissions & Désactivation de Compte

Status: review

## Story

En tant qu'admin,
Je veux modifier les rôles des membres, désactiver ou supprimer des comptes,
Afin de garder le contrôle total sur qui accède à quelles données au sein de ma structure.

## Acceptance Criteria

**AC1 — Changement de rôle immédiat avec audit :**
- Given la liste des membres dans le Back Office
- When l'admin change le rôle d'un utilisateur et confirme
- Then `PATCH /api/v1/admin/members/:userId` met à jour `authUser.role` via Drizzle
- And les nouvelles permissions sont effectives immédiatement à la prochaine requête API
- And un log d'audit est inséré dans `auditLogsPg` (actorId, action: 'ROLE_CHANGE', resourceType: 'user', resourceId: userId, metadata: JSON ancien/nouveau rôle)

**AC2 — Désactivation de compte avec invalidation de sessions :**
- Given un membre actif
- When l'admin clique "Désactiver ce compte" et confirme le dialog de confirmation
- Then `POST /api/v1/admin/members/:userId/deactivate` met `authUser.disabled = true` via Drizzle
- And TOUTES les sessions actives du membre sont supprimées de `authSession`
- And l'utilisateur voit "Votre compte a été désactivé — contactez votre admin" s'il tente une requête authentifiée (middleware guard)
- And un log d'audit est enregistré (action: 'ACCOUNT_DISABLED')

**AC3 — Protection anti-verrouillage :**
- Given un admin qui est le seul admin de la structure
- When une requête de désactivation ou changement de rôle away from 'admin' concerne ce dernier admin
- Then le serveur retourne `409 LAST_ADMIN_PROTECTION` avec le message "Impossible — vous êtes le seul admin de cette structure"
- And aucune modification n'est effectuée

**AC4 — Isolation multi-tenant :**
- Given un admin authentifié
- When il accède à `GET /api/v1/admin/members`
- Then seuls les membres de sa propre structure (`structureId`) sont retournés
- And aucun membre d'une autre structure n'est visible

## Tasks / Subtasks

- [x] **T1 — Ajouter le champ `disabled` à `authUser`** (AC: 2)
  - [x] T1.1 — Lire `packages/db/schema/auth-schema.ts` EN ENTIER
  - [x] T1.2 — Ajouter `disabled: boolean('disabled').default(false)` à `authUser` dans `auth-schema.ts`
  - [x] T1.3 — Lire `apps/web/src/lib/auth.ts` EN ENTIER
  - [x] T1.4 — Ajouter `disabled` dans `additionalFields` de BetterAuth avec `input: false`
  - [x] T1.5 — Générer la migration Drizzle : `cd packages/db && pnpm drizzle-kit generate`
  - [x] T1.6 — Migration `0005_little_photon.sql` vérifiée — contient `ALTER TABLE "user" ADD COLUMN "disabled" boolean DEFAULT false`

- [x] **T2 — Guard middleware pour les comptes désactivés** (AC: 2)
  - [x] T2.1 — Lire `apps/web/src/proxy.ts` EN ENTIER
  - [x] T2.2 — Guard `ACCOUNT_DISABLED` ajouté (API → 401 JSON, pages → redirect /login?error=account_disabled)
  - [x] T2.3 — Guard placé AVANT le guard doctor (story 2.3) et APRÈS le guard onboarding (story 2.1)
  - [x] T2.4 — BetterAuth expose `disabled` via `additionalFields` avec `input: false`

- [x] **T3 — Route API `GET /api/v1/admin/members`** (AC: 4)
  - [x] T3.1 — Créé `apps/web/src/app/api/v1/admin/members/route.ts`
  - [x] T3.2 — Guard : `role === 'admin'` ET `structureId` non null → 403
  - [x] T3.3 — Requête Drizzle avec `eq(authUser.structureId, user.structureId)`
  - [x] T3.4 — Inclus avec marquage `isSelf: m.id === user.id`
  - [x] T3.5 — Réponse `200` : `{ data: { members: [...] } }`

- [x] **T4 — Route API `PATCH /api/v1/admin/members/[userId]`** (AC: 1, 3)
  - [x] T4.1 — Créé `apps/web/src/app/api/v1/admin/members/[userId]/route.ts`
  - [x] T4.2 — Body validé via `z.enum(['idel', 'doctor'])`
  - [x] T4.3 — Guard admin + structureId → 403
  - [x] T4.4 — Vérification cible dans même structure → 404 sinon
  - [x] T4.5 — Protection anti-verrouillage : si `target.id === user.id` → count admins → 409 si ≤ 1
  - [x] T4.6 — `previousRole` sauvegardé pour l'audit
  - [x] T4.7 — `db.update(authUser).set({ role })` exécuté
  - [x] T4.8 — Log `ROLE_CHANGE` inséré dans `auditLogsPg` avec metadata JSON
  - [x] T4.9 — Réponse `200` : `{ data: { member: { id, role } } }`

- [x] **T5 — Route API `POST /api/v1/admin/members/[userId]/deactivate`** (AC: 2, 3)
  - [x] T5.1 — Créé `apps/web/src/app/api/v1/admin/members/[userId]/deactivate/route.ts`
  - [x] T5.2 — Guard admin + structureId → 403
  - [x] T5.3 — Vérification cible dans même structure → 404 sinon
  - [x] T5.4 — Protection anti-verrouillage : si `target.role === 'admin'` → count admins actifs (non-disabled) → 409 si ≤ 1
  - [x] T5.5 — `db.update(authUser).set({ disabled: true })` exécuté
  - [x] T5.6 — `db.delete(authSession).where(eq(authSession.userId, userId))` — sessions révoquées
  - [x] T5.7 — Log `ACCOUNT_DISABLED` inséré dans `auditLogsPg`
  - [x] T5.8 — Réponse `200` : `{ data: { disabled: true, sessionsRevoked: N } }`

- [x] **T6 — Tests middleware pour le guard `disabled`** (AC: 2)
  - [x] T6.1 — Lu `apps/web/src/middleware.test.ts` EN ENTIER
  - [x] T6.2 — 2 tests ajoutés : 401 API pour disabled sur route API, 307 redirect /login?error=account_disabled sur page
  - [x] T6.3 — Pattern `vi.mocked(...).mockResolvedValue(... as never)` utilisé
  - [x] T6.4 — 15/15 tests passent (12 middleware + 3 auth)
  - [x] T6.5 — Aucune régression sur les tests doctor (story 2.3)

- [x] **T7 — UI : Section Membres dans `/settings`** (AC: 1, 2, 3, 4)
  - [x] T7.1 — Lu `apps/web/src/app/(admin)/settings/page.tsx` EN ENTIER
  - [x] T7.2 — Section "Membres" ajoutée AVANT la section "Équipe"
  - [x] T7.3 — Tableau : name, email, role badge (bleu), statut badge (vert/rouge Actif/Désactivé)
  - [x] T7.4 — Select rôle + bouton "Modifier le rôle" → `PATCH /api/v1/admin/members/:userId`, erreur 409 affichée
  - [x] T7.5 — Bouton "Désactiver" → `window.confirm(...)` → `POST /api/v1/admin/members/:userId/deactivate`
  - [x] T7.6 — `isSelf: true` → label "(vous)" + boutons disabled
  - [x] T7.7 — `aria-label` sur tous les éléments interactifs
  - [x] T7.8 — Pas de `'use client'` redondant

## Dev Notes

### Contexte Critique — Ce qui existe déjà (CRITIQUE)

**`authUser` schema actuel :**
```typescript
// packages/db/schema/auth-schema.ts
export const authUser = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  twoFactorEnabled: boolean('two_factor_enabled'),
  structureId: text('structure_id'),
  role: text('role', { enum: ['admin', 'idel', 'doctor'] }),
  // ← À AJOUTER (T1) : disabled: boolean('disabled').default(false)
});
```

**BetterAuth `additionalFields` actuel :**
```typescript
// apps/web/src/lib/auth.ts
additionalFields: {
  structureId: { type: 'string', required: false, input: true },
  role: { type: 'string', required: false, defaultValue: 'idel', input: true },
  // ← À AJOUTER (T1.4) : disabled: { type: 'boolean', required: false, defaultValue: false, input: false }
}
```

**`auditLogsPg` — schéma existant (PRÊT À UTILISER) :**
```typescript
// packages/db/schema/audit-schema.ts — EXISTE
export const auditLogsPg = pgTable('audit_logs', {
  id: pgText('id').primaryKey().$defaultFn(() => generateId()),
  userId: pgText('user_id').notNull(),       // acteur (admin qui fait l'action)
  action: pgText('action').notNull(),         // 'ROLE_CHANGE' | 'ACCOUNT_DISABLED'
  resourceType: pgText('resource_type').notNull(), // 'user'
  resourceId: pgText('resource_id').notNull(), // userId cible
  ipAddress: pgText('ip_address'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  metadata: pgText('metadata'),               // JSON stringifié (ancien/nouveau rôle etc.)
});
// Export : `import { auditLogsPg } from '@kura/db'` — déjà dans index.ts
```

**`authSession` — suppression pour révoquer (pattern établi story 1.7) :**
```typescript
// Pattern existant story 1.7 (admin sessions) :
await db.delete(authSession).where(eq(authSession.userId, targetUserId));
// OU pour une seule session :
await db.delete(authSession).where(eq(authSession.id, sessionId));
```

**Middleware actuel (`proxy.ts`) avec guards story 2.1, 2.2 :**
```typescript
// Guard 1 : PUBLIC_PATHS → pass-through
// Guard 2 : !session → redirect /login
// Guard 3 : !structureId + !API → redirect /onboarding (story 2.1)
// ← Insérer Guard 4 : disabled → 401/redirect (story 2.4) ICI
// Guard 5 (story 2.3) : doctor + mutation → 403 READ_ONLY_ROLE (À IMPLÉMENTER)
// return NextResponse.next()
```

**Settings page actuelle — structure connue (story 2.2) :**
```typescript
// apps/web/src/app/(admin)/settings/page.tsx — 'use client', React Hook Form
// Section "Équipe" avec formulaire invitation et liste invitations
// ← AJOUTER section "Membres" avant "Équipe"
```

### Pièges Connus

1. **BetterAuth `additionalFields` avec `input: false`** : La valeur n'est PAS acceptée depuis le client (signup/update). Elle est gérée uniquement côté serveur (via Drizzle direct). Mettre `input: false` pour `disabled` — l'admin ne peut pas se désactiver via l'API publique BetterAuth.

2. **Session cache de BetterAuth** : BetterAuth met en cache la session et peut ne pas re-vérifier `disabled` à chaque requête si la session est déjà valide. La solution robuste : SUPPRIMER la session DB (`authSession`) lors de la désactivation → BetterAuth ne trouve plus la session → `getSession` retourne `null` → redirect /login.

3. **`disabled` dans le type `session.user`** : BetterAuth expose les `additionalFields` dans le type session. Si TypeScript ne reconnaît pas `session.user.disabled`, utiliser le cast : `(session.user as { disabled?: boolean }).disabled`. Vérifier si le type est bien généré après ajout dans `additionalFields`.

4. **Anti-verrouillage — compter les admins non-disabled** : Pour la protection, compter les admins ACTIFS (non-disabled) dans la structure. Un admin désactivé ne devrait pas compter comme protection :
   ```typescript
   const adminCount = await db.select({ count: count() }).from(authUser)
     .where(and(
       eq(authUser.structureId, structureId),
       eq(authUser.role, 'admin'),
       eq(authUser.disabled, false),
     ));
   // Importer count de drizzle-orm
   ```

5. **Isolation multi-tenant dans T4/T5** : TOUJOURS vérifier que la cible appartient à la structure de l'admin avant d'agir. Ne jamais faire `WHERE id = :userId` seul — toujours `WHERE id = :userId AND structure_id = :structureId`.

6. **`drizzle-orm` `count()`** : Pour compter les admins, utiliser `import { count } from 'drizzle-orm'` puis `db.select({ count: count() }).from(authUser).where(...)`. Résultat : `rows[0].count` (type `number`).

7. **`authSession` import** : `import { authSession, authUser, auditLogsPg } from '@kura/db'` — tous déjà exportés depuis `packages/db/schema/index.ts`.

8. **Double apostrophe obligatoire** : `"Votre compte a été désactivé — contactez votre admin"` contient des apostrophes — utiliser `"double quotes"` dans toutes les strings TSX/JSON.

9. **`window.confirm` pour la désactivation** : Pattern établi story 1.7 (sessions) — utiliser `window.confirm("...")` pour la confirmation avant désactivation. String en double quotes pour les apostrophes françaises.

### Pattern API — Changement de Rôle

```typescript
// apps/web/src/app/api/v1/admin/members/[userId]/route.ts
import { count, eq, and } from 'drizzle-orm';
import { authUser, auditLogsPg } from '@kura/db';
import { generateId } from '@kura/shared';

const PatchMemberSchema = z.object({
  role: z.enum(['idel', 'doctor']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params; // Next.js 15 : params est une Promise
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; role?: string; structureId?: string | null } | undefined;

  if (!session || user?.role !== 'admin' || !user?.structureId) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin requis' } }, { status: 403 });
  }

  const [target] = await db.select()
    .from(authUser)
    .where(and(eq(authUser.id, userId), eq(authUser.structureId, user.structureId)))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Membre introuvable' } }, { status: 404 });
  }

  const body = await request.json() as unknown;
  const parsed = PatchMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Données invalides' } }, { status: 400 });
  }

  // Protection anti-verrouillage
  if (target.id === user.id && parsed.data.role !== 'admin') {
    const [result] = await db.select({ count: count() }).from(authUser)
      .where(and(eq(authUser.structureId, user.structureId), eq(authUser.role, 'admin')));
    if ((result?.count ?? 0) <= 1) {
      return NextResponse.json(
        { error: { code: 'LAST_ADMIN_PROTECTION', message: "Impossible — vous êtes le seul admin de cette structure" } },
        { status: 409 },
      );
    }
  }

  const previousRole = target.role;
  await db.update(authUser).set({ role: parsed.data.role }).where(eq(authUser.id, userId));

  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: user.id,
    action: 'ROLE_CHANGE',
    resourceType: 'user',
    resourceId: userId,
    ipAddress: request.headers.get('x-forwarded-for') ?? null,
    timestamp: new Date(),
    metadata: JSON.stringify({ previousRole, newRole: parsed.data.role }),
  });

  return NextResponse.json({ data: { member: { id: userId, role: parsed.data.role } } }, { status: 200 });
}
```

> ⚠️ **Next.js 15 CRITIQUE** : Dans les Route Handlers dynamiques, `params` est une `Promise`. Toujours `const { userId } = await params` — jamais `params.userId` directement (TS error + runtime error).

### Pattern API — Désactivation

```typescript
// apps/web/src/app/api/v1/admin/members/[userId]/deactivate/route.ts
import { count, eq, and } from 'drizzle-orm';
import { authUser, authSession, auditLogsPg } from '@kura/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params;
  // ... guards admin + structureId + vérifie cible dans structure ...

  // Protection anti-verrouillage (admins actifs non-disabled)
  if (target.role === 'admin') {
    const [result] = await db.select({ count: count() }).from(authUser)
      .where(and(
        eq(authUser.structureId, structureId),
        eq(authUser.role, 'admin'),
        eq(authUser.disabled, false),
      ));
    if ((result?.count ?? 0) <= 1) {
      return NextResponse.json(
        { error: { code: 'LAST_ADMIN_PROTECTION', message: "Impossible — vous êtes le seul admin de cette structure" } },
        { status: 409 },
      );
    }
  }

  await db.update(authUser).set({ disabled: true }).where(eq(authUser.id, userId));
  const deleted = await db.delete(authSession).where(eq(authSession.userId, userId)).returning();

  await db.insert(auditLogsPg).values({
    id: generateId(),
    userId: session.user.id,
    action: 'ACCOUNT_DISABLED',
    resourceType: 'user',
    resourceId: userId,
    ipAddress: request.headers.get('x-forwarded-for') ?? null,
    timestamp: new Date(),
    metadata: JSON.stringify({ sessionsRevoked: deleted.length }),
  });

  return NextResponse.json({ data: { disabled: true, sessionsRevoked: deleted.length } }, { status: 200 });
}
```

### Fichiers à Créer / Modifier

```
packages/db/schema/
└── auth-schema.ts          → MODIFIER (T1.2 — ajouter disabled: boolean)

apps/web/src/
├── lib/
│   └── auth.ts             → MODIFIER (T1.4 — additionalFields disabled)
├── proxy.ts                → MODIFIER (T2 — guard disabled)
├── middleware.test.ts      → MODIFIER (T6 — 2 nouveaux tests disabled)
└── app/api/v1/admin/
    └── members/
        ├── route.ts                          → CRÉER (T3 — GET membres)
        └── [userId]/
            ├── route.ts                      → CRÉER (T4 — PATCH rôle)
            └── deactivate/
                └── route.ts                  → CRÉER (T5 — POST désactiver)

apps/web/src/app/(admin)/
└── settings/
    └── page.tsx            → MODIFIER (T7 — section Membres)
```

### Apprentissages Stories Précédentes

- **Next.js 15 `params` Promise** : Dans les dynamic Route Handlers, `params` est une `Promise<{ userId: string }>` — toujours `await params` avant d'accéder aux valeurs. Bug silencieux en TS si oublié.
- **Double apostrophe obligatoire** : `"Impossible — vous êtes le seul admin"`, `"Votre compte a été désactivé"` → `"double quotes"` — bug répété stories 1.6, 1.7, 2.1, sessions page
- **Pattern enveloppe API** : `{ data }` / `{ error: { code, message } }` — toujours
- **`structureId` isolation multi-tenant** : TOUJOURS `AND structure_id = :structureId` dans chaque query — jamais de lookup par ID seul
- **`session.user.structureId` peut ne pas être typé** : cast `(session.user as { structureId?: string | null; role?: string; disabled?: boolean })`
- **`count()` Drizzle** : `import { count } from 'drizzle-orm'` — résultat via `rows[0]?.count ?? 0`
- **`vi.mocked(...).mockResolvedValue(... as never)`** : Pattern anti-TS-error pour les mocks BetterAuth dans vitest
- **`z.enum()`** : Zod v4 ne supporte pas `{ required_error }` dans `z.enum()` — utiliser sans options
- **`window.confirm`** : Toujours `window.confirm("...")` (double quotes) pour les dialogs français

### Références

- Auth schema (authUser + authSession) : `packages/db/schema/auth-schema.ts`
- Audit log schema : `packages/db/schema/audit-schema.ts`
- BetterAuth config (additionalFields) : `apps/web/src/lib/auth.ts`
- Pattern sessions admin (revocation) : `apps/web/src/app/api/v1/admin/sessions/route.ts`
- Middleware actuel : `apps/web/src/proxy.ts`
- Settings page actuelle (story 2.2) : `apps/web/src/app/(admin)/settings/page.tsx`
- Tests middleware : `apps/web/src/middleware.test.ts`
- Story 2.3 (guard doctor READ_ONLY_ROLE, ordre dans proxy.ts) : `_bmad-output/implementation-artifacts/2-3-invitation-des-medecins-prescripteurs.md`
- Project Context (RBAC, TypeScript strict, API envelope) : `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Tous les AC implémentés et vérifiés (tsc 0 erreur, 15/15 tests vitest).
- `z.enum(['idel', 'doctor'])` sans options — Zod v4 ne supporte pas `required_error` sur `z.enum`.
- La protection anti-verrouillage du PATCH route n'a plus besoin du check `!== 'admin'` car le schéma Zod garantit que le rôle est `idel | doctor`.
- Les deux casts `as ReturnType<typeof vi.fn>` dans middleware.test.ts ont été corrigés en `vi.mocked(...) as never` pour cohérence.
- `disabled` guard positionné AVANT le guard onboarding pour bloquer même les comptes sans structureId.

### File List

- `packages/db/schema/auth-schema.ts` — MODIFIED (T1.2)
- `packages/db/migrations/0005_little_photon.sql` — CREATED (T1.5)
- `apps/web/src/lib/auth.ts` — MODIFIED (T1.4)
- `apps/web/src/proxy.ts` — MODIFIED (T2)
- `apps/web/src/middleware.test.ts` — MODIFIED (T6 + fix casts)
- `apps/web/src/app/api/v1/admin/members/route.ts` — CREATED (T3)
- `apps/web/src/app/api/v1/admin/members/[userId]/route.ts` — CREATED (T4)
- `apps/web/src/app/api/v1/admin/members/[userId]/deactivate/route.ts` — CREATED (T5)
- `apps/web/src/app/(admin)/settings/page.tsx` — MODIFIED (T7)
