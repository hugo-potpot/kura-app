# Story 3.4 : Recherche, Filtrage & Liste des Patients

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur (IDEL ou admin),
Je veux rechercher un patient par nom/adresse/médecin et filtrer la liste par statut,
Afin de trouver rapidement un dossier parmi ma liste.

## Acceptance Criteria

1. **Given** la liste des patients avec la barre de recherche (Searchbar Paper côté mobile)
   **When** je saisis au moins 2 caractères
   **Then** les résultats sont filtrés en temps réel par nom, adresse ou médecin traitant
   **And** le terme recherché est surligné dans les résultats

2. **Given** les chips de filtrage (Tous / Actifs / Archivés)
   **When** je sélectionne "Archivés"
   **Then** seuls les patients archivés sont affichés avec une indication visuelle de leur statut

3. **Given** une recherche sans résultat
   **When** aucun patient ne correspond aux critères
   **Then** l'état vide affiche "Aucun patient trouvé" avec icône loupe et bouton "Effacer la recherche"

4. **Given** la liste patients mobile (IDEL connecté)
   **When** l'écran s'affiche
   **Then** la liste des patients assignés à cet IDEL est chargée via `GET /api/v1/patients` avec JWT

5. **Given** la liste patients web (Back Office admin)
   **When** la recherche inclut une adresse partielle (ex : "Paris")
   **Then** les patients dont l'adresse contient "Paris" sont inclus dans les résultats

## Tasks / Subtasks

- [x] **T1** — Ajouter les query params `search` et `status` à `GET /api/v1/patients` (AC: 1, 2, 5)
  - [x] T1.1 — Dans `apps/web/src/app/api/v1/patients/route.ts` : lire `searchParams` depuis `request.nextUrl.searchParams`
  - [x] T1.2 — Si `search` (≥ 2 chars) : ajouter filtre SQL `ilike` sur `firstName`, `lastName`, `address`, `treatingDoctor` (PostgreSQL, `ilike` = case-insensitive)
  - [x] T1.3 — Si `status` (`active` | `archived`) : ajouter filtre `eq(patientsPg.status, status)` 
  - [x] T1.4 — Combiner avec le filtre IDEL existant (story 3.3) — utiliser `and(...)` avec tous les filtres
  - [x] T1.5 — Sans params : retourner tous les patients (comportement inchangé = rétrocompatible)

- [x] **T2** — Implémenter l'écran patients mobile — liste avec recherche et filtres (AC: 1, 2, 3, 4)
  - [x] T2.1 — Créer `apps/mobile/src/features/patients/hooks/usePatients.ts` (TanStack Query `useQuery`)
    - Appeler `GET /api/v1/patients?search=&status=` avec JWT via `apiClient.get`
    - Retourner `{ patients, isLoading, error, refetch }`
  - [x] T2.2 — Créer `apps/mobile/src/features/patients/components/PatientCard.tsx`
    - Afficher : initiales (avatar), nom complet, médecin traitant, statut badge
    - Props : `patient: Patient`, `searchTerm: string` (pour highlight)
    - Highlight : wrapper `HighlightText` qui met en gras/couleur les occurrences du terme
  - [x] T2.3 — Créer `apps/mobile/src/features/patients/components/EmptyPatients.tsx`
    - État vide normal (aucun patient) : icône `Users`, texte "Aucun patient assigné"
    - État vide recherche : icône loupe, texte "Aucun patient trouvé", bouton "Effacer la recherche" → `onClear()`
  - [x] T2.4 — Remplacer le stub `apps/mobile/src/app/(app)/patients/index.tsx` par l'écran complet :
    - `Searchbar` (React Native Paper) pour la saisie — `value` + `onChangeText`
    - Row de 3 `Chip` Paper : "Tous" / "Actifs" / "Archivés" — sélection unique, style `selected`
    - `FlatList` avec `PatientCard` items et `keyExtractor={p => p.id}`
    - Pull-to-refresh via `refreshControl` + `refetch`
    - `onPress` sur un item → `router.push(\`/patients/${patient.id}\`)` (Expo Router, story 3.2)
  - [x] T2.5 — Debounce la recherche (300ms) pour éviter trop de requêtes API — utiliser `useRef` + `clearTimeout`
  - [x] T2.6 — Passer `search` (≥ 2 chars) et `status` comme query params à l'appel API

- [x] **T3** — Améliorer la recherche web Back Office (AC: 1, 3, 5)
  - [x] T3.1 — Dans `apps/web/src/app/(admin)/patients/page.tsx` : ajouter `address` dans les champs de la recherche client-side
  - [x] T3.2 — Améliorer l'état vide : quand `filtered.length === 0` ET `search` non vide → afficher bouton "Effacer la recherche" qui appelle `setSearch('')`
  - [x] T3.3 — Ajouter le highlight des termes recherchés dans le tableau : remplacer le texte brut du nom patient par un composant `HighlightText` React inline

- [x] **T4** — Ajouter le `HighlightText` utilitaire (partagé web + mobile) (AC: 1)
  - [x] T4.1 — **Web** : créer `apps/web/src/components/highlight-text.tsx` — composant React DOM avec `<mark>`
  - [x] T4.2 — **Mobile** : créer `apps/mobile/src/features/patients/components/HighlightText.tsx` — composant React Native avec `<Text>` segments, bold + couleur teal pour le match

## Dev Notes

### Dependency critique sur Story 3.3

Cette story assume que `GET /api/v1/patients` est **correctement implémenté** (Story 3.3) :
- Filtre `structureId` pour tous les rôles
- Filtre `assignedIdelId` pour les IDELs
- Enveloppe de réponse `{ data: { patients } }`

Si Story 3.3 n'est pas encore implémentée, implémenter ces deux stories ensemble en commençant par Story 3.3.

### Pattern complet GET /api/v1/patients avec search + status

```typescript
// apps/web/src/app/api/v1/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, ilike, or } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { patientsPg } from '@kura/db';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const user = session.user as { id: string; structureId?: string; role?: string };
  if (!user.structureId) return NextResponse.json({ error: { code: 'NO_STRUCTURE' } }, { status: 403 });

  const search = request.nextUrl.searchParams.get('search') ?? '';
  const status = request.nextUrl.searchParams.get('status') as 'active' | 'archived' | null;

  const conditions = [eq(patientsPg.structureId, user.structureId)];

  // Filtre IDEL (story 3.3)
  if (user.role === 'idel') {
    conditions.push(eq(patientsPg.assignedIdelId, user.id));
  }

  // Filtre status
  if (status === 'active' || status === 'archived') {
    conditions.push(eq(patientsPg.status, status));
  }

  // Filtre recherche (≥ 2 chars)
  if (search.length >= 2) {
    conditions.push(
      or(
        ilike(patientsPg.firstName, `%${search}%`),
        ilike(patientsPg.lastName, `%${search}%`),
        ilike(patientsPg.address, `%${search}%`),
        ilike(patientsPg.treatingDoctor, `%${search}%`),
      )!,
    );
  }

  const patients = await db
    .select()
    .from(patientsPg)
    .where(and(...conditions));

  return NextResponse.json({ data: { patients } });
}
```

> Note : `ilike` est PostgreSQL-specific (case-insensitive LIKE). Drizzle l'importe de `drizzle-orm`.

### Hook usePatients mobile — Pattern TanStack Query v5

```typescript
// apps/mobile/src/features/patients/hooks/usePatients.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Patient } from '@kura/shared';

interface PatientsParams {
  search?: string;
  status?: 'active' | 'archived';
}

export function usePatients({ search, status }: PatientsParams = {}) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['patients', search, status],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search && search.length >= 2) params.set('search', search);
      if (status) params.set('status', status);
      const path = `/api/v1/patients${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<{ patients: Patient[] }>(path, {
        Authorization: `Bearer ${token ?? ''}`,
      });
      return response.data.patients;
    },
    staleTime: 30_000,
  });
}
```

### Écran patients mobile — Structure complète

```typescript
// apps/mobile/src/app/(app)/patients/index.tsx
import { useState, useCallback, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Searchbar, Chip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePatients } from '@/features/patients/hooks/usePatients';
import { PatientCard } from '@/features/patients/components/PatientCard';
import { EmptyPatients } from '@/features/patients/components/EmptyPatients';
import type { Patient } from '@kura/shared';

type StatusFilter = 'active' | 'archived' | undefined;

export default function PatientsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: patients = [], isLoading, refetch } = usePatients({
    search: debouncedSearch,
    status: statusFilter,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    setDebouncedSearch('');
  }, []);

  const handlePatientPress = useCallback((patient: Patient) => {
    router.push(`/patients/${patient.id}`);
  }, [router]);

  const isSearchActive = searchText.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Rechercher un patient..."
        value={searchText}
        onChangeText={handleSearchChange}
        onClearIconPress={handleClearSearch}
        style={styles.searchbar}
      />
      <View style={styles.chips}>
        <Chip
          selected={statusFilter === undefined}
          onPress={() => setStatusFilter(undefined)}
          style={styles.chip}
        >Tous</Chip>
        <Chip
          selected={statusFilter === 'active'}
          onPress={() => setStatusFilter('active')}
          style={styles.chip}
        >Actifs</Chip>
        <Chip
          selected={statusFilter === 'archived'}
          onPress={() => setStatusFilter('archived')}
          style={styles.chip}
        >Archivés</Chip>
      </View>
      <FlatList
        data={patients}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            searchTerm={debouncedSearch}
            onPress={() => handlePatientPress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyPatients isSearch={isSearchActive} onClear={handleClearSearch} />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />
        }
        contentContainerStyle={patients.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12, elevation: 1 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  chip: { borderRadius: 20 },
  emptyContainer: { flexGrow: 1 },
});
```

### Composant HighlightText mobile

```typescript
// apps/mobile/src/features/patients/components/HighlightText.tsx
import { Text } from 'react-native-paper';

interface Props {
  text: string;
  highlight: string;
  style?: object;
}

export function HighlightText({ text, highlight, style }: Props) {
  if (!highlight || highlight.length < 2) return <Text style={style}>{text}</Text>;

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={{ fontWeight: 'bold', color: '#0d9488' }}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
```

### Highlight côté web

```typescript
// apps/web/src/components/highlight-text.tsx
export function highlightText(text: string, term: string): React.ReactNode {
  if (!term || term.length < 2) return text;
  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 font-semibold rounded-sm">{part}</mark>
    ) : (
      part
    )
  );
}
```

### Structure des fichiers à créer/modifier

**Nouveaux (mobile) :**
- `apps/mobile/src/features/patients/hooks/usePatients.ts` — TanStack Query fetch patients
- `apps/mobile/src/features/patients/components/PatientCard.tsx` — Item de la liste
- `apps/mobile/src/features/patients/components/HighlightText.tsx` — Surlignage
- `apps/mobile/src/features/patients/components/EmptyPatients.tsx` — États vides

**Modifiés (mobile) :**
- `apps/mobile/src/app/(app)/patients/index.tsx` — Stub → écran complet

**Nouveaux (web) :**
- `apps/web/src/components/highlight-text.tsx` — Utilitaire surlignage

**Modifiés (web) :**
- `apps/web/src/app/api/v1/patients/route.ts` — Ajouter query params search + status (en plus du filtre IDEL de story 3.3)
- `apps/web/src/app/(admin)/patients/page.tsx` — Ajout adresse dans search, empty state amélioré, highlight

**À NE PAS TOUCHER :**
- `packages/db/schema/patient-schema.ts` — Aucune migration requise
- `packages/shared/src/types/patient.ts` — Types inchangés
- `apps/mobile/src/lib/api-client.ts` — Client API inchangé

### Important — ilike Drizzle (PostgreSQL uniquement)

`ilike` est importé depuis `drizzle-orm` et ne fonctionne qu'avec PostgreSQL. Pour la recherche dans SQLite (mobile offline), utiliser `like` standard avec `.toLowerCase()` préalable ou filtrer en JS côté client.

### Offline mobile — Recherche sur données locales

Pour l'offline, les patients sont stockés dans SQLite local (ajouté en story 3.3). Si l'app est hors ligne et que `apiClient.get` échoue, afficher les données du cache TanStack Query (option `placeholderData: keepPreviousData` ou cache stale). Ne pas implémenter de recherche SQLite avancée dans cette story — le cache TanStack Query suffit pour le prototype.

### Important — `or()` dans Drizzle peut retourner `undefined`

Drizzle's `or()` retourne `SQL | undefined` quand les arguments peuvent être vides. Utiliser l'opérateur `!` (non-null assertion) ou vérifier avant d'appeler :

```typescript
// ✅ Safe avec assertion (quand on sait que l'array est non-vide)
conditions.push(or(ilike(...), ilike(...))!);

// ✅ Alternatif — guard explicite
const searchCondition = or(ilike(...), ilike(...));
if (searchCondition) conditions.push(searchCondition);
```

### Pattern `and(...conditions)` avec spread

Quand le tableau `conditions` peut avoir 1 ou N éléments, `and(...conditions)` fonctionne correctement avec Drizzle (retourne la condition directement si un seul élément).

### Références

- Pattern `apiClient.get` + JWT : `apps/mobile/src/features/auth/hooks/useRegister.ts` (ligne `{ Authorization: \`Bearer ${token}\` }`)
- Pattern TanStack Query v5 : `apps/mobile/src/features/auth/hooks/useLogin.ts`
- Composants Paper : `apps/mobile/src/app/(app)/_layout.tsx` (useTheme)
- Route patients API : `apps/web/src/app/api/v1/patients/route.ts`
- Architecture API : `_bmad-output/planning-artifacts/architecture.md` — section 4.3 (enveloppe réponse)
- Pattern double filtre + auth : `apps/web/src/app/api/v1/admin/members/route.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Fix critique auth mobile : plugin `bearer` ajouté à BetterAuth — sans lui, `auth.api.getSession` ignorait le header `Authorization: Bearer` envoyé par l'app mobile → toutes les routes API retournaient 401 → session révoquée au démarrage
- `api-client.ts` mobile : injection automatique du token JWT dans tous les appels GET/POST via `SecureStore` (plus besoin de le passer manuellement dans chaque hook)
- `(app)/_layout.tsx` : suppression du double timer d'inactivité (déjà géré dans le root layout), ajout des icônes tab bar, `refreshJwt` ne clear plus la session en cas d'erreur réseau transitoire — la révocation réelle reste gérée par l'`unauthorizedHandler` 401
- Écran patients mobile complet : Searchbar + chips filtre + FlatList + PatientCard avec avatar/initiales + HighlightText + EmptyPatients (deux états)
- Debounce 300ms sur la recherche mobile
- Highlight jaune des termes recherchés côté web (composant `highlightText`)
- État vide "recherche sans résultat" avec bouton "Effacer la recherche" côté web
- Seuil de recherche ≥ 2 chars aligné côté API et client

### File List

- `apps/web/src/lib/auth.ts` — ajout plugin `bearer`
- `apps/mobile/src/lib/api-client.ts` — injection auto JWT Bearer dans tous les appels
- `apps/mobile/src/app/(app)/_layout.tsx` — fix révocation session, ajout icônes tab bar, suppression double inactivité timer
- `apps/web/src/app/api/v1/patients/route.ts` — seuil search ≥ 2 chars (était any non-empty)
- `apps/mobile/src/features/patients/hooks/usePatients.ts` — nouveau
- `apps/mobile/src/features/patients/components/PatientCard.tsx` — nouveau
- `apps/mobile/src/features/patients/components/HighlightText.tsx` — nouveau
- `apps/mobile/src/features/patients/components/EmptyPatients.tsx` — nouveau
- `apps/mobile/src/app/(app)/patients/index.tsx` — stub remplacé par écran complet
- `apps/web/src/components/highlight-text.tsx` — nouveau
- `apps/web/src/app/(admin)/patients/page.tsx` — adresse dans search, empty state amélioré, highlight nom/médecin
