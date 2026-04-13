# Story 2.3 : Invitation des Médecins Prescripteurs

Status: review

## Story

En tant qu'admin,
Je veux inviter des médecins prescripteurs avec un accès lecture seule sur leurs patients,
Afin qu'ils puissent consulter l'évolution de leurs patients sans pouvoir modifier quoi que ce soit.

## Acceptance Criteria

**AC1 — Envoi de l'invitation médecin (happy path) :**
- Given le Back Office > Paramètres > Équipe
- When l'admin saisit l'email du médecin et sélectionne "Médecin prescripteur"
- Then une invitation est créée via `POST /api/v1/invitations` avec `role: 'doctor'`
- And le médecin apparaît en statut "Invitation en attente" dans la liste de l'équipe
- And le lien d'invitation fonctionne via `/accept-invitation?token=xxx`

**AC2 — Accès lecture seule pour le médecin connecté :**
- Given le médecin connecté (role: `doctor`)
- When il accède à l'interface
- Then il ne voit que les patients qui lui sont explicitement associés (filtrage par `assignedDoctorId`)
- And aucun bouton de modification, création ou suppression n'est visible ni accessible

**AC3 — Blocage systématique des mutations :**
- Given le rôle "Médecin prescripteur" (`role: 'doctor'`)
- When une requête API de mutation (POST, PATCH, PUT, DELETE) est tentée avec ce token
  - Exception : `/api/auth/**` (BetterAuth — ne jamais bloquer)
  - Exception : `/api/v1/invitations/accept` POST (acceptation de l'invitation elle-même)
- Then le serveur retourne `403 Forbidden` avec `{ error: { code: 'READ_ONLY_ROLE', message: '...' } }`

## Tasks / Subtasks

- [x] **T1 — Vérifier l'infrastructure invitation existante pour le rôle `doctor`** (AC: 1)
  - [x] T1.1 — Lire `apps/web/src/app/api/v1/invitations/route.ts` EN ENTIER
  - [x] T1.2 — `POST /api/v1/invitations` accepte `role: 'doctor'` via `z.enum(['idel', 'doctor'])` ✅ (story 2.2)
  - [x] T1.3 — Lire `apps/web/src/app/(admin)/settings/page.tsx` EN ENTIER
  - [x] T1.4 — Option `<option value="doctor">Médecin prescripteur</option>` présente ✅
  - [x] T1.5 — `ROLE_LABEL['doctor'] = "Médecin prescripteur"` défini ✅
  - [x] T1.6 — Aucune modification requise — infrastructure doctor complète depuis story 2.2

- [x] **T2 — Enforcement RBAC lecture seule dans le middleware** (AC: 3)
  - [x] T2.1 — Lu `apps/web/src/proxy.ts` EN ENTIER
  - [x] T2.2 — Guard `READ_ONLY_ROLE` ajouté dans `proxy.ts` après le guard structureId
  - [x] T2.3 — Guard positionné après guard onboarding (story 2.1), avant `return NextResponse.next()`
  - [x] T2.4 — `/api/auth/**` dans PUBLIC_PATHS → jamais atteint par le guard ✅
  - [x] T2.5 — `/api/v1/invitations/accept` dans `DOCTOR_MUTATION_EXCEPTIONS` ✅

- [x] **T3 — Tests middleware pour le rôle `doctor`** (AC: 3)
  - [x] T3.1 — Lu `apps/web/src/middleware.test.ts` EN ENTIER
  - [x] T3.2 — 3 nouveaux tests ajoutés : 403 mutation, 200 GET, 200 exception accept
  - [x] T3.3 — Pattern `vi.mocked(...).mockResolvedValue(... as never)` utilisé avec structureId non-null
  - [x] T3.4 — 13/13 tests passent (10 existants + 3 nouveaux)

- [x] **T4 — UI read-only : masquer les boutons d'action pour les doctors** (AC: 2)
  - [x] T4.1 — Lu `apps/web/src/app/(admin)/layout.tsx` EN ENTIER
  - [x] T4.2 — Layout rendu `async` Server Component — `auth.api.getSession({ headers: await headers() })`
  - [x] T4.3 — `headers()` de `next/headers` utilisé (Server Component pattern)
  - [x] T4.4 — Liens `/idels` et `/settings` masqués pour `role === 'doctor'`
  - [x] T4.5 — Scope limité au layout existant — adaptation patients en Epic 3
  - [x] T4.6 — Adaptation UI doctor complète pour le périmètre actuel de l'app

## Dev Notes

### Contexte Critique — Ce qui existe déjà (CRITIQUE)

**Infrastructure invitation COMPLÈTE depuis story 2.2 :**
```typescript
// apps/web/src/app/api/v1/invitations/route.ts — EXISTE (story 2.2)
// POST /api/v1/invitations accepte role: 'doctor' via Zod z.enum(['idel', 'doctor'])
// La table invitationsPg a role: pgText('role', { enum: ['idel', 'doctor'] })
// authUser.role a 'doctor' dans l'enum : ['admin', 'idel', 'doctor']
```

**Settings page COMPLÈTE depuis story 2.2 :**
```typescript
// apps/web/src/app/(admin)/settings/page.tsx — EXISTE (story 2.2)
// Option "Médecin prescripteur" (value="doctor") déjà présente dans le select
// ROLE_LABEL['doctor'] = "Médecin prescripteur" déjà défini
// Formulaire et liste supportent déjà les deux rôles
```

**Accept-invitation page COMPLÈTE depuis story 2.2 :**
```typescript
// apps/web/src/app/(auth)/accept-invitation/page.tsx — EXISTE (story 2.2)
// roleLabel('doctor') = 'Médecin prescripteur' déjà implémenté
```

**Middleware actuel (à modifier T2) :**
```typescript
// apps/web/src/proxy.ts — actuel
const PUBLIC_PATHS = [
  '/api/auth',
  '/(auth)/login', '/login', '/reset-password', '/forgot-password',
  '/onboarding',        // story 2.1
  '/accept-invitation', // story 2.2
  '/api/v1/invitations/accept', // story 2.2
];
// Guard 1 : session absente → redirect /login
// Guard 2 : session sans structureId + non-API → redirect /onboarding
// MANQUANT : Guard 3 — doctor + mutation non-exception → 403 READ_ONLY_ROLE
```

### Pièges Connus

1. **`proxy.ts` retourne `NextResponse.json` (pas redirect) pour les 403 API** : Contrairement aux redirects HTML, la réponse 403 pour les API doit être JSON. Vérifier que `NextResponse.json({ error: ... }, { status: 403 })` est utilisé.

2. **`/api/auth/**` est dans PUBLIC_PATHS** : Ces routes ne passent JAMAIS par le middleware guard (isPublicPath = true → return NextResponse.next() immédiatement). Donc le guard doctor n'interfère pas avec BetterAuth.

3. **`/api/v1/invitations/accept` POST doit être exception** : C'est la route que l'IDEL/doctor utilise pour rejoindre une structure. Sans cette exception, les utilisateurs avec `role: 'doctor'` ne pourraient jamais accepter leur invitation (catch-22).

4. **`request.method` dans Next.js middleware** : `request.method` retourne la méthode HTTP en MAJUSCULES (`'POST'`, `'GET'`, etc.). Utiliser `DOCTOR_MUTATION_METHODS.includes(request.method)` directement, pas besoin de `.toUpperCase()`.

5. **Doctor sans structure** : Un doctor qui vient d'accepter son invitation a maintenant `structureId` non-null. Le guard onboarding (redirect vers /onboarding si structureId null) s'applique aussi aux doctors — c'est correct, un doctor sans structure ne peut pas accéder à l'app.

6. **Tests vitest — ordre des guards dans proxy.ts** : Le test pour le guard doctor doit mocker une session avec `structureId` non-null (sinon le guard onboarding redirige avant d'atteindre le guard doctor).

7. **TypeScript strict — `request.method` type** : `request.method` est `string` dans `NextRequest`. L'array `DOCTOR_MUTATION_METHODS` peut être typé `string[]` — pas besoin de `as const` si comparaison via `.includes()`.

8. **Double apostrophe en TSX** : La string `"Les médecins prescripteurs ont un accès lecture seule"` contient un accent — vérifier que les guillemets doubles sont utilisés (pas de problème d'apostrophe ici, mais rester vigilant).

### Pattern Guard Doctor à Implémenter

```typescript
// apps/web/src/proxy.ts — APRÈS le guard structureId (story 2.1), AVANT return NextResponse.next()

// Guard lecture seule pour les médecins prescripteurs (AC3 — story 2.3)
const userRole = (session.user as { role?: string | null }).role;
const DOCTOR_MUTATION_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];
const DOCTOR_MUTATION_EXCEPTIONS = ['/api/v1/invitations/accept'];

if (
  userRole === 'doctor' &&
  DOCTOR_MUTATION_METHODS.includes(request.method) &&
  !DOCTOR_MUTATION_EXCEPTIONS.some((exc) => pathname.startsWith(exc))
) {
  return NextResponse.json(
    { error: { code: 'READ_ONLY_ROLE', message: 'Les médecins prescripteurs ont un accès lecture seule' } },
    { status: 403 },
  );
}
```

### Pattern Tests à Ajouter

```typescript
// apps/web/src/middleware.test.ts — 3 nouveaux tests (AC3)

it('should return 403 for doctor role on mutation methods', async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
  } as never);
  const request = new NextRequest('http://localhost:3000/api/v1/patients', { method: 'POST' });
  const response = await middleware(request);
  expect(response.status).toBe(403);
  const body = await response.json() as { error: { code: string } };
  expect(body.error.code).toBe('READ_ONLY_ROLE');
});

it('should allow GET for doctor role', async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
  } as never);
  const request = new NextRequest('http://localhost:3000/api/v1/patients');
  const response = await middleware(request);
  expect(response.status).toBe(200);
});

it('should allow POST /api/v1/invitations/accept for doctor role (exception)', async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: '123', email: 'doctor@example.com', role: 'doctor', structureId: 'struct-01' },
  } as never);
  const request = new NextRequest('http://localhost:3000/api/v1/invitations/accept', { method: 'POST' });
  const response = await middleware(request);
  expect(response.status).toBe(200);
});
```

### Fichiers à Créer / Modifier

```
apps/web/src/
├── proxy.ts             → MODIFIER (T2 — guard doctor READ_ONLY_ROLE)
└── middleware.test.ts   → MODIFIER (T3 — 3 nouveaux tests doctor)

Aucun nouveau fichier de schéma ou migration nécessaire.
Aucune modification de route API nécessaire (invitation déjà supportée story 2.2).
```

### Apprentissages Stories Précédentes

- **Double apostrophe obligatoire en TSX** : strings françaises avec `'` → `"double quotes"` — bug répété stories 1.6, 1.7, 2.1, sessions page
- **Pattern enveloppe API** : `{ data }` / `{ error: { code, message } }` — toujours, y compris pour les 403
- **`session.user.role` peut ne pas être typé** : cast `(session.user as { role?: string | null }).role`
- **`structureId` dans le mock de test** : Les tests qui testent des guards *après* le guard onboarding doivent inclure `structureId` dans le mock sinon le guard onboarding redirige avant
- **`vi.mocked(...).mockResolvedValue(... as never)`** : Pattern anti-TS-error pour les mocks BetterAuth dans vitest
- **`z.enum(['idel', 'doctor'])`** : Ne pas passer `{ required_error }` à `z.enum()` dans Zod v4 — utiliser `z.enum([...])` sans options ou `message` uniquement

### Références

- Infrastructure invitation (story 2.2) : `_bmad-output/implementation-artifacts/2-2-invitation-des-idel-collaborateurs.md`
- Route invitations : `apps/web/src/app/api/v1/invitations/route.ts`
- Middleware actuel : `apps/web/src/proxy.ts`
- Tests middleware : `apps/web/src/middleware.test.ts`
- Auth schema (rôles) : `packages/db/schema/auth-schema.ts`
- Layout admin : `apps/web/src/app/(admin)/layout.tsx`
- Project Context (RBAC, TypeScript strict, API envelope) : `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1 : Infrastructure invitation `doctor` vérifiée — complète depuis story 2.2, aucune modification requise
- T2 : Guard `READ_ONLY_ROLE` ajouté dans `proxy.ts` — bloque POST/PATCH/PUT/DELETE pour `role === 'doctor'`, avec exception `/api/v1/invitations/accept`
- T3 : 3 tests vitest ajoutés (403 mutation, 200 GET, 200 exception) — 13/13 tests passent
- T4 : Layout admin rendu async Server Component — `/idels` et `/settings` masqués pour les doctors via `auth.api.getSession`

### File List

- `apps/web/src/proxy.ts` — MODIFIÉ (guard doctor READ_ONLY_ROLE)
- `apps/web/src/middleware.test.ts` — MODIFIÉ (3 nouveaux tests doctor)
- `apps/web/src/app/(admin)/layout.tsx` — MODIFIÉ (async Server Component, masquage UI doctor)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-27 | Implémentation story 2.3 — guard RBAC doctor READ_ONLY_ROLE, 3 tests, layout UI doctor | claude-sonnet-4-6 |
