# Story 2.5 : Consultation de l'Équipe & Gestion du Profil Utilisateur

Status: review

## Story

En tant qu'utilisateur (IDEL, Admin ou Médecin),
Je veux voir la liste des membres de ma structure et modifier mes informations de profil,
Afin de connaître mon équipe et maintenir mes informations à jour.

## Acceptance Criteria

**AC1 — Consultation de l'équipe (tous les rôles) :**
- Given l'écran Profil du Back Office
- When je consulte la liste de l'équipe
- Then je vois les membres avec leur nom, rôle et statut (actif / désactivé)
- And uniquement les membres de ma propre structure (isolation multi-tenant stricte)

**AC2 — Modification du profil utilisateur :**
- Given l'écran de modification de profil
- When je modifie mon nom ou mon URL d'image de profil et enregistre
- Then les modifications sont sauvegardées via BetterAuth `updateUser`
- And le nom mis à jour est visible immédiatement dans l'interface (session mise à jour)

**AC3 — RBAC côté UI — lecture seule pour non-admins :**
- Given un IDEL collaborateur ou un médecin prescripteur qui consulte la liste de l'équipe
- When il navigue vers `/profile`
- Then il voit les membres (nom, rôle, statut) sans boutons de gestion des rôles ni désactivation

**AC4 — Isolation multi-tenant stricte :**
- Given un utilisateur authentifié avec `structureId`
- When `GET /api/v1/team` est appelé
- Then seuls les membres de sa structure (`eq(authUser.structureId, user.structureId)`) sont retournés
- And aucun membre d'une autre structure n'est accessible

## Tasks / Subtasks

- [x] **T1 — Route API `GET /api/v1/team`** (AC: 1, 3, 4)
  - [x] T1.1 — Créé `apps/web/src/app/api/v1/team/route.ts`
  - [x] T1.2 — Guard : session requise + `structureId` non null → 403 `NO_STRUCTURE`
  - [x] T1.3 — Requête Drizzle : select `id, name, email, role, disabled` filtrée par `structureId`
  - [x] T1.4 — Marquage `isSelf: m.id === user.id` sur chaque membre
  - [x] T1.5 — Réponse `200` : `{ data: { members: [...] } }`
  - [x] T1.6 — Accessible à tous les rôles (aucun guard `role === 'admin'`)

- [x] **T2 — Mise à jour du profil via BetterAuth client** (AC: 2)
  - [x] T2.1 — Lu `apps/web/src/lib/auth-client.ts` EN ENTIER
  - [x] T2.2 — `authClient.updateUser({ name, image })` utilisé dans la page profil (BetterAuth built-in)
  - [x] T2.3 — États gérés : chargement (isSubmitting), succès (successMsg), erreur (errorMsg)
  - [x] T2.4 — Pré-remplissage via `authClient.getSession()` dans `useEffect` (atom `useSession` non dispo avec `better-auth/client`)

- [x] **T3 — Page `/profile`** (AC: 1, 2, 3)
  - [x] T3.1 — Créé `apps/web/src/app/(admin)/profile/page.tsx`
  - [x] T3.2 — `'use client'` présent
  - [x] T3.3 — Section "Informations personnelles" : formulaire name + image URL, validation Zod, succès/erreur inline
  - [x] T3.4 — Section "Mon équipe" : tableau read-only (Nom, Email, Rôle badge, Statut badge), marquage `(vous)`
  - [x] T3.5 — Styles identiques à settings/page.tsx (cardStyle, labelStyle, inputStyle, buttonStyle, errorStyle, thStyle, tdStyle)
  - [x] T3.6 — `aria-label` sur tous les éléments interactifs

- [x] **T4 — Navigation : lien "Profil" accessible à tous les rôles** (AC: 1, 2, 3)
  - [x] T4.1 — Lu `apps/web/src/app/(admin)/layout.tsx` EN ENTIER
  - [x] T4.2 — Lien `<a href="/profile">Profil</a>` ajouté entre "Sessions" et "Paramètres"
  - [x] T4.3 — Lien sans condition `isDoctor` — visible pour admin, idel ET doctor
  - [x] T4.4 — Positionné après "Sessions", avant "Paramètres"

- [x] **T5 — Tests** (AC: 1, 3, 4)
  - [x] T5.1 — Créé `apps/web/src/app/api/v1/team/route.test.ts`
  - [x] T5.2 — Test A : utilisateur idel avec `structureId` → 200 + membres avec `isSelf`
  - [x] T5.3 — Test B : session null → 403 `NO_STRUCTURE` ; structureId null → 403 `NO_STRUCTURE`
  - [x] T5.4 — 19/19 tests passent (15 existants + 4 nouveaux route.test)

## Dev Notes

### Contexte Critique — Ce qui existe déjà (CRITIQUE)

**`GET /api/v1/admin/members` EXISTE DÉJÀ mais est admin-only :**
```typescript
// apps/web/src/app/api/v1/admin/members/route.ts
// Guard: user?.role !== 'admin' || !user?.structureId → 403
// Ne PAS modifier ce fichier — créer un nouveau GET /api/v1/team
```

**`authUser` schema — champs disponibles pour le profil :**
```typescript
export const authUser = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),          // ← modifiable via updateUser
  email: text('email').notNull().unique(), // ← lecture seule (BetterAuth)
  image: text('image'),                   // ← modifiable via updateUser (URL string ou null)
  structureId: text('structure_id'),
  role: text('role', { enum: ['admin', 'idel', 'doctor'] }),
  disabled: boolean('disabled').default(false),
  // ... autres champs
});
```

**BetterAuth `updateUser` (CRITIQUE) :**
```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL });

// Utilisation dans le composant client :
import { authClient } from '@/lib/auth-client';
const result = await authClient.updateUser({ name: 'Nouveau Nom', image: 'https://...' });
// result.error contient l'erreur éventuelle
// result.data contient l'utilisateur mis à jour
// Rechargez la session après : await authClient.getSession()
```

**Settings page (story 2.4) — pattern à reproduire :**
```typescript
// apps/web/src/app/(admin)/settings/page.tsx
// ← Reprendre les styles inline : cardStyle, labelStyle, inputStyle, buttonStyle, errorStyle, thStyle, tdStyle
// ← Reprendre le pattern fetchMembers (useCallback, useEffect, loading state)
// ← Reprendre le pattern ROLE_LABEL pour les badges
```

**Layout actuel :**
```typescript
// apps/web/src/app/(admin)/layout.tsx
// isDoctor → masque /idels et /settings UNIQUEMENT
// Ajouter /profile SANS condition isDoctor — accessible à TOUS
```

### Pièges Connus

1. **`authClient.updateUser` vs `auth.api.updateUser`** : Pour le client (navigateur), utiliser `authClient.updateUser` de `@/lib/auth-client`. Ne PAS appeler `auth.api.updateUser` côté serveur pour une action client-side — c'est réservé aux route handlers.

2. **Session refresh après updateUser** : BetterAuth ne met PAS automatiquement à jour le cookie de session après `updateUser`. Pour afficher le nouveau nom immédiatement, utiliser `await authClient.getSession()` après le succès ou rafraîchir la page.

3. **Image = URL string ou null** : `authUser.image` accepte une URL string ou `null`. Ne PAS envoyer `image: ''` (string vide) — utiliser `image: undefined` pour ne pas modifier, ou `image: null` pour effacer.

4. **`useSession()` vs `getSession()`** : Dans les composants React (client), utiliser `authClient.useSession()` pour avoir le user courant réactif. Dans les route handlers (serveur), utiliser `auth.api.getSession({ headers })`.

5. **Double apostrophe obligatoire** : Toutes les strings TSX avec apostrophes françaises en double quotes : `"Équipe"`, `"Mon profil"`, `"Enregistrer"`.

6. **Route GET /api/v1/team — pas de guard `role`** : Contrairement à `/api/v1/admin/members`, la route `/api/v1/team` est accessible à TOUS les rôles authentifiés avec structureId. Guard uniquement `!session || !user?.structureId`.

7. **Isolation multi-tenant** : TOUJOURS filtrer par `eq(authUser.structureId, user.structureId)`. Ne jamais retourner tous les utilisateurs.

8. **`z.enum()` sans options** : Zod v4 ne supporte pas `required_error` sur `z.enum()` — utiliser `z.enum([...])` sans paramètres additionnels. Bug rencontré story 2.4.

### Pattern Route — GET /api/v1/team

```typescript
// apps/web/src/app/api/v1/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { authUser } from '@kura/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user as { id: string; structureId?: string | null; role?: string } | undefined;

  if (!session || !user?.structureId) {
    return NextResponse.json(
      { error: { code: 'NO_STRUCTURE', message: 'Structure requise' } },
      { status: 403 },
    );
  }

  const members = await db
    .select({ id: authUser.id, name: authUser.name, email: authUser.email, role: authUser.role, disabled: authUser.disabled })
    .from(authUser)
    .where(eq(authUser.structureId, user.structureId));

  const enriched = members.map((m) => ({ ...m, isSelf: m.id === user.id }));

  return NextResponse.json({ data: { members: enriched } }, { status: 200 });
}
```

### Pattern UI — Profil page

```typescript
// apps/web/src/app/(admin)/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';

const ProfileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  image: z.string().url('URL invalide').optional().or(z.literal('')),
});
type ProfileFormData = z.infer<typeof ProfileSchema>;

interface TeamMember { id: string; name: string; email: string; role: string; disabled: boolean; isSelf: boolean; }

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
  });

  // Pré-remplir avec les données de la session
  useEffect(() => {
    if (session?.user) {
      reset({ name: session.user.name ?? '', image: (session.user.image as string | undefined) ?? '' });
    }
  }, [session, reset]);

  // Charger l'équipe
  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/v1/team');
      const data = await res.json() as { data?: { members: TeamMember[] } };
      setMembers(data.data?.members ?? []);
      setLoadingMembers(false);
    })();
  }, []);

  async function onSubmit(values: ProfileFormData) {
    setErrorMsg(null);
    setSuccessMsg(null);
    const result = await authClient.updateUser({
      name: values.name,
      image: values.image || undefined,
    });
    if (result.error) {
      setErrorMsg(result.error.message ?? "Une erreur est survenue");
      return;
    }
    setSuccessMsg("Profil mis à jour avec succès");
  }
  // ... return JSX
}
```

### Navigation — Ajout du lien /profile

```typescript
// apps/web/src/app/(admin)/layout.tsx (modification)
// Ajouter avant ou après Sessions :
<a href="/profile" className="hover:underline opacity-90">Profil</a>
// PAS de condition isDoctor — accessible à tous
```

### Fichiers à Créer / Modifier

```
apps/web/src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx            → MODIFIER (T4 — ajouter lien /profile)
│   │   └── profile/
│   │       └── page.tsx          → CRÉER (T3 — page profil)
│   └── api/v1/
│       └── team/
│           └── route.ts          → CRÉER (T1 — GET équipe all roles)
```

### Apprentissages Stories Précédentes

- **`authClient` vs `auth.api`** : Client-side → `authClient` de `@/lib/auth-client`. Server-side → `auth.api` de `@/lib/auth`.
- **Pattern styles inline** : Toujours reprendre `cardStyle`, `thStyle`, `tdStyle` de settings/page.tsx pour la cohérence visuelle.
- **Double apostrophe obligatoire** : `"Mon équipe"`, `"Enregistrer"` → double quotes. Bug répété stories 1.6, 1.7, 2.1, 2.4.
- **Pattern enveloppe API** : `{ data }` / `{ error: { code, message } }` — toujours.
- **`structureId` isolation multi-tenant** : `eq(authUser.structureId, user.structureId)` — jamais de lookup sans filtre structure.
- **Zod v4 `z.enum()`** : Sans options (`required_error` non supporté).
- **`useCallback` + `useEffect`** : Pattern établi pour les fetch au chargement (voir settings/page.tsx).
- **`vi.mocked(...).mockResolvedValue(... as never)`** : Pattern mock vitest pour BetterAuth.

### Références

- Auth client (updateUser) : `apps/web/src/lib/auth-client.ts`
- Auth server : `apps/web/src/lib/auth.ts`
- Auth schema (authUser) : `packages/db/schema/auth-schema.ts`
- Settings page (styles + patterns) : `apps/web/src/app/(admin)/settings/page.tsx`
- Admin layout (navigation) : `apps/web/src/app/(admin)/layout.tsx`
- Route admin membres (pattern isolé admin) : `apps/web/src/app/api/v1/admin/members/route.ts`
- Project Context (RBAC, TypeScript strict, API envelope) : `_bmad-output/project-context.md`
- Story 2.4 (disabled guard, isSelf, patterns membres) : `_bmad-output/implementation-artifacts/2-4-gestion-des-roles-permissions-desactivation-de-compte.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Tous les AC implémentés : route GET /api/v1/team (all roles), page /profile (profil + équipe read-only), navigation, 19/19 tests.
- `authClient.useSession` n'est pas un hook React avec `better-auth/client` (c'est un atom nanostores) → remplacement par `authClient.getSession()` dans `useEffect`.
- La route `/api/v1/team` est distincte de `/api/v1/admin/members` : pas de guard `role === 'admin'`, accessible à idel et doctor.
- 4 tests de route écrits couvrant : no session → 403, structureId null → 403, idel avec structure → 200 + isSelf, doctor → 200.

### File List

- `apps/web/src/app/api/v1/team/route.ts` — CREATED (T1)
- `apps/web/src/app/api/v1/team/route.test.ts` — CREATED (T5)
- `apps/web/src/app/(admin)/profile/page.tsx` — CREATED (T3)
- `apps/web/src/app/(admin)/layout.tsx` — MODIFIED (T4 — lien /profile)
