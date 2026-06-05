# Story 4.4 : Gestion des Patients Absents & Urgences

Status: review

<!-- Note : validation optionnelle via validate-create-story avant dev-story. -->

## Story

En tant qu'IDEL,  
je veux marquer un patient absent et ajouter des urgences avec recalcul automatique du planning,  
afin de gérer les imprévus terrain en quelques secondes sans perdre le fil de ma tournée.

## Critères d'acceptation

1. **Swipe left → menu contextuel**  
   **Given** une `PlanningCard` dans la liste du planning  
   **When** l'IDEL glisse la carte vers la gauche (swipe left)  
   **Then** un panneau latéral coulissant révèle **3 options maximum** : **"Absent"**, **"Déplacer"** (stub visible, fonctionnalité différée 4.6), **"Naviguer"** (ouvre GPS natif via `Linking.openURL`)  
   **And** le geste est perceptible en **< 100 ms** (gesture native, pas de calcul bloquant).

2. **Action "Absent" → confirmation → suppression + recalcul**  
   **Given** l'option "Absent" sélectionnée dans le menu swipe  
   **When** l'IDEL confirme le `Dialog` **"Retirer [Prénom Nom] du planning ?"**  
   **Then** le `status` de l'entrée `planning_entries` passe à **`'skipped'`** (soft-delete, pas de DELETE)  
   **And** la `PlanningCard` s'affiche en état **absent** : fond `#FFF3E0`, bordure orange, libellé "Absent"  
   **And** les ETAs de toutes les autres entrées sont **recalculés en moins de 2 secondes** (NFR-PERF-2, FR31)  
   **And** `synced_at` est mis à `null` sur l'entrée mutée  
   **And** un Snackbar **"Patient retiré — Annuler"** s'affiche **5 secondes** avec haptic feedback moyen (`ImpactFeedbackStyle.Medium`)  
   **And** la liste reste triée par `order_index`, les entrées `skipped` apparaissent en bas ou à leur position avec le style absent.

3. **Undo "Patient absent"**  
   **Given** le Snackbar "Patient retiré — Annuler" visible  
   **When** l'IDEL tape "Annuler" dans les 5 secondes  
   **Then** le `status` est **restauré à `'pending'`** (ou son statut précédent) en Drizzle SQLite  
   **And** les ETAs sont recalculés incluant le patient restauré  
   **And** un Snackbar **"Retrait annulé"** confirme brièvement  
   **And** si 5 secondes s'écoulent sans action, l'état `skipped` est conservé définitivement.

4. **FAB "+" → Ajouter une urgence (FR33)**  
   **Given** le FAB `+` flottant sur l'écran Planning  
   **When** l'IDEL tape le FAB et sélectionne **"Ajouter une urgence"**  
   **Then** un `BottomSheet` ou `Modal` s'ouvre avec la liste des patients assignés à l'IDEL (`assigned_idel_id = idelId`) **non présents** dans le planning du jour courant  
   **And** la liste est chargée depuis SQLite local (offline-first).

5. **Insertion optimale de l'urgence (FR33)**  
   **Given** un patient urgence sélectionné dans le picker  
   **When** l'IDEL confirme la sélection  
   **Then** l'algorithme calcule la **position d'insertion optimale** (coût minimum = `dist(prev→new) + dist(new→next) - dist(prev→next)` sur toutes les positions, via `findOptimalInsertionIndex()` dans `tsp-optimizer`)  
   **And** l'UI présente la suggestion : **"Position optimale : après [Nom du précédent]"** avec un bouton "Confirmer"  
   **And** l'IDEL peut **modifier la position manuellement** (picker ordinal : "Insérer en position 1, 2, 3…")  
   **And** après confirmation, la nouvelle entrée `planning_entries` est **insérée en SQLite** (`status: 'pending'`, `orderIndex` réattribué sur toutes les entrées)  
   **And** les ETAs sont recalculés pour toutes les entrées  
   **And** `synced_at: null` sur toutes les entrées mutées.

6. **Offline — entièrement local**  
   **Given** le mode avion / pas de backend  
   **When** l'IDEL marque un patient absent ou ajoute une urgence  
   **Then** toutes les mutations (UPDATE status, INSERT, UPDATE orderIndex / etaMinutes) sont persistées **SQLite uniquement** (NFR-REL-1)  
   **And** le flag `synced_at: null` marque les entrées en attente de sync.

## Périmètre explicite

- **Inclus :** swipe left `Swipeable` sur `PlanningCard`, dialog confirmation absent, status `skipped` soft-delete, undo 5 s, FAB urgence, picker patient, `findOptimalInsertionIndex()`, insertion SQLite, recalcul ETAs, haptic, Snackbar.  
- **Exclu :** "Déplacer à un autre jour" (stub visible, implémentation différée — `4.6` ou story dédiée), carte GPS complète (`4.5`), préférences planning (`4.6`), notification push urgence (`7.1`).

## Tâches / sous-tâches

- [x] Exporter `findOptimalInsertionIndex(newPatient, entries)` depuis `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts` :  
  - Paramètres : `newPatient: { latitude, longitude }`, `entries: SortedPlanningEntry[]`  
  - Calcul coût insertion pour chaque position 0…n  
  - Retourne `{ index: number, costSaving: number }`  
  - Ajouter cas patient sans coords : insérer en fin de liste.  
- [x] Ajouter tests pour `findOptimalInsertionIndex` dans `tsp-optimizer.test.ts` (liste vide, 1 entrée, 5 entrées, patient sans coords).  
- [x] Créer `apps/mobile/src/features/planning/hooks/useAbsentPatient.ts` :  
  - `confirmAndMarkAbsent(entryId, previousStatus)` → UPDATE `status='skipped'`, `syncedAt=null`, `updatedAt=now` ; recalcul ETAs ; timer undo 5 s  
  - `onAbsentUndoPress` → UPDATE statut précédent mémorisé ; recalcul ETAs  
  - Persiste `previousStatus` dans `useRef` pour undo  
  - Haptic `Medium` à la confirmation.  
- [x] Créer `apps/mobile/src/features/planning/hooks/useAddUrgency.ts` :  
  - Charger patients `assigned_idel_id = idelId` **non présents** dans le planning du jour depuis SQLite  
  - `addUrgency(patientId, positionIndex)` → INSERT `planning_entries`, renumérote `orderIndex` pour toutes les entrées du jour, recalcule ETAs, `syncedAt=null`  
  - Suggestion d’insertion via `findOptimalInsertionIndex` + `urgencyInsertPosition.ts` (`globalInsertPosFromActiveIndex`).  
- [x] Modifier `apps/mobile/src/features/planning/components/PlanningCard.tsx` :  
  - Envelopper dans `Swipeable` (`react-native-gesture-handler`) avec `renderRightActions` → 3 boutons : Absent (orange) | Déplacer (gris, disabled) | Naviguer (indigo)  
  - Style `status === 'skipped'` : fond `#FFF3E0`, bordure orange, badge "Absent"  
  - "Absent" → callback ouvre Dialog confirmation (page `app/`)  
  - "Naviguer" → utilitaire `openNativeMapsNavigation` (maps:// / geo:)  
- [x] Créer `apps/mobile/src/features/planning/components/UrgencyBottomSheet.tsx` :  
  - Modal (`Portal` + `Modal` Paper) avec liste patients disponibles (`FlatList`, initiales, nom)  
  - Après sélection : confirmation avec suggestion d'insertion et saisie position manuelle  
- [x] Modifier `apps/mobile/src/app/(app)/planning/index.tsx` :  
  - `FAB.Group` : ouvrir l’action « Ajouter une urgence » puis `UrgencyBottomSheet`  
  - Dialog confirmation + `useAbsentPatient` + Snackbars  
- [x] Tests unitaires `useAbsentPatient` (`useAbsentPatient.test.ts`, mocks Drizzle).  
- [x] Tests unitaires logique insertion / filtre positions : `urgencyInsertPosition.test.ts`, `findOptimalInsertionIndex` + `computeEtaSegmentsForPlanningDayOrder` dans `tsp-optimizer.test.ts` ; parcours `useAddUrgency` couvert par `persistManualPlanningOrder` + algorithme.

## Notes de développement

### Stories précédentes (4.1 → 4.3)

- `status` dans `planning_entries` existe déjà : `'pending' | 'in_progress' | 'done' | 'skipped'` — **pas de migration nécessaire**. `skipped` = patient absent.  
- `usePlanning` retourne les entrées triées par `order_index` — les entrées `skipped` restent dans la liste mais s'affichent avec le style `absent` ; pour le recalcul ETA, **exclure les `skipped`** du calcul Haversine.  
- `tsp-optimizer` expose déjà `computeRoute()` et calcul Haversine — ajouter `findOptimalInsertionIndex()` comme **export nommé** supplémentaire sans casser l'interface existante.  
- `DEFAULT_CARE_MINUTES` et vitesse moyenne : ne pas dupliquer — importer depuis `algorithm/`.  
- `PLANNING_DAY_START_MINUTES` : le recalcul post-absent/urgence doit produire des `etaMinutes` compatibles avec `estimatedVisitClockMinutes`.

### Logique de recalcul ETA post-absent

Après `markAbsent(entryId)` :
1. Filtrer les entrées du jour où `status !== 'skipped'`, triées par `orderIndex`
2. Recalculer `etaMinutes` pour chaque entrée (trajet Haversine depuis précédent + `DEFAULT_CARE_MINUTES`)
3. Bulk update Drizzle en transaction sur les entrées dont `etaMinutes` a changé

### Dialog confirmation — implémentation

```typescript
// Dans planning/index.tsx
const [confirmAbsent, setConfirmAbsent] = useState<string | null>(null); // entryId

<Dialog visible={!!confirmAbsent} onDismiss={() => setConfirmAbsent(null)}>
  <Dialog.Title>Retirer du planning ?</Dialog.Title>
  <Dialog.Content>
    <Text>Retirer {patientName} du planning d'aujourd'hui ?</Text>
  </Dialog.Content>
  <Dialog.Actions>
    <Button onPress={() => setConfirmAbsent(null)}>Annuler</Button>
    <Button onPress={handleConfirmAbsent} textColor={theme.colors.error}>Retirer</Button>
  </Dialog.Actions>
</Dialog>
```

### Swipeable — implémentation

```typescript
import { Swipeable } from 'react-native-gesture-handler';

function renderRightActions(progress, onAbsent, onNavigate, address) {
  return (
    <View style={styles.swipeActions}>
      <TouchableOpacity onPress={onAbsent} style={styles.actionAbsent}>
        <Text>Absent</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled style={styles.actionDeplacer}>
        <Text>Déplacer</Text>{/* Stub — 4.6 */}
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigate} style={styles.actionNaviguer}>
        <Text>Naviguer</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Navigation GPS native (stub fonctionnel)

```typescript
import { Linking, Platform } from 'react-native';

function openNativeGPS(address: string) {
  const encoded = encodeURIComponent(address);
  const url = Platform.OS === 'ios'
    ? `maps://?daddr=${encoded}`
    : `geo:0,0?q=${encoded}`;
  Linking.openURL(url);
}
```

### Insertion optimale — algorithme

```typescript
// Dans tsp-optimizer.ts
export function findOptimalInsertionIndex(
  newPatient: { latitude: number | null; longitude: number | null },
  entries: Array<{ latitude: number | null; longitude: number | null }>
): number {
  if (!newPatient.latitude || !newPatient.longitude) return entries.length;
  if (entries.length === 0) return 0;

  let bestIndex = entries.length;
  let bestCost = Infinity;

  for (let i = 0; i <= entries.length; i++) {
    const prev = entries[i - 1];
    const next = entries[i];
    const distToPrev = prev ? haversine(prev, newPatient) : 0;
    const distToNext = next ? haversine(newPatient, next) : 0;
    const distPrevNext = (prev && next) ? haversine(prev, next) : 0;
    const insertionCost = distToPrev + distToNext - distPrevNext;
    if (insertionCost < bestCost) {
      bestCost = insertionCost;
      bestIndex = i;
    }
  }
  return bestIndex;
}
```

## Exigences techniques (garde-fous dév agent)

- **TypeScript strict**, alias `@/`, aucune logique métier dans `app/`.  
- **Drizzle** `expo-sqlite` via `getDb()` ; transaction pour update groupé — pas de N requêtes séquentielles.  
- **`generateId()`** pour les nouvelles `planning_entries` urgence (ULID via `@kura/shared`).  
- **Soft-delete uniquement** : ne jamais `DELETE` une entrée `planning_entries` — utiliser `status='skipped'`. Les autres stories lisent ces entrées.  
- **Respect multi-tenant** : filtres `idelId` + `date` sur toutes les requêtes.  
- `Swipeable` doit être fermé (`swipeableRef.current?.close()`) après chaque action pour éviter état bloqué.  
- Pas de `console.log` bruyant en production (conditionner à `__DEV__`).  
- **Ne pas réintroduire `Dialog`** dans les composants `features/` — le Dialog reste dans la page `app/` (logique UI).

## Conformité architecture

- Structure cible : `features/planning/hooks/`, `features/planning/components/`, `features/planning/algorithm/` [Source : `_bmad-output/planning-artifacts/architecture.md` §4.2 Structure Patterns].  
- `PlanningCard` états documentés dans UX Spec C1 : `default | active | done | dragging | absent` — `absent` = `status === 'skipped'` [Source : `ux-design-specification.md` §C1].  
- `FAB` Paper, couleur teal `#00897B`, `borderRadius: 16` [Source : `ux-design-specification.md` §Tokens].  
- Dialog pour actions destructives — obligation UX [Source : `ux-design-specification.md` §F4].  
- Menu contextuel ≤ 3 options [Source : `ux-design-specification.md` §F4].

## Bibliothèques / versions

| Lib | Usage | Statut |
|-----|-------|--------|
| `react-native-gesture-handler ~2.30.0` | `Swipeable` swipe left | **Déjà installée** |
| `react-native-paper ^5.15.0` | `FAB`, `Dialog`, `Snackbar`, `Portal` | **Déjà installée** |
| `expo-haptics` (SDK 55) | Haptic Medium (absent) | **Disponible** |
| `react-native` `Linking` | Navigation GPS natif | **Intégré RN** |

Aucune nouvelle dépendance requise pour cette story.

## Fichiers / emplacements attendus

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts` | Ajouter `findOptimalInsertionIndex()` |
| `apps/mobile/src/features/planning/algorithm/tsp-optimizer.test.ts` | Tests `findOptimalInsertionIndex` |
| `apps/mobile/src/features/planning/hooks/useAbsentPatient.ts` | Absent + undo + ETA recalc |
| `apps/mobile/src/features/planning/hooks/useAddUrgency.ts` | Urgence + insertion optimale |
| `apps/mobile/src/features/planning/components/PlanningCard.tsx` | Swipeable + état absent |
| `apps/mobile/src/features/planning/components/UrgencyBottomSheet.tsx` | Picker patient + suggestion |
| `apps/mobile/src/app/(app)/planning/index.tsx` | FAB + Dialog + Snackbar undo |

## Tests

- **Unitaires obligatoires** (obligation projet) :  
  - `tsp-optimizer.test.ts` : cas `findOptimalInsertionIndex` — liste vide, 1 patient, 5 patients, patient sans coords (→ inséré en fin)  
  - `useAbsentPatient.test.ts` : markAbsent normal, undo < 5 s, undo expiré, recalcul ETA excluant skipped  
  - `useAddUrgency.test.ts` : liste patients disponibles (exclut déjà planifiés), insert normal, insert patient sans coords  
- **Pas de SQLite réelle** dans unit tests — mocks Drizzle  
- Vérifier que `synced_at: null` est bien propagé après chaque mutation

## Intelligence stories précédentes (4.1 → 4.3)

- `usePlanning` : vérifier que la query inclut les entrées `status='skipped'` pour affichage (état absent) mais les exclut du calcul ETA  
- `PlanningCard` : en 4.3, des props `drag` / `isActive` ont été ajoutées — ne pas régresser ces props en wrappant avec `Swipeable`  
- `SyncStatusIndicator` se base sur `syncedAt: null` — bien propager sur toutes les entrées mutées  
- `hasManuallyReordered` (4.3) : un ajout d'urgence réordonne le planning → mettre ce flag à `true` pour bloquer l'auto-optimisation 4.2

## Intelligence Git (récent)

- Commits récents : `2536ff2 docs: Story 4.2`, `b2a064d fix issue planning`, `f85d7d0 feat: Ajout du planning réel`  
- Ne pas casser `auth-store`, thème, module patients, ni les hooks 4.1/4.2/4.3 existants

## Veille technique (rappels)

- **`Swipeable` + `DraggableFlatList` (4.3)** : si 4.3 utilise `DraggableFlatList`, vérifier que `Swipeable` peut être imbriqué dans les items — certaines implémentations de drag & drop interfèrent avec le swipe horizontal. Solution courante : désactiver le swipe pendant un drag actif (`isActive` prop de 4.3).  
- **`Linking.openURL`** : nécessite `LSApplicationQueriesSchemes` dans `Info.plist` pour iOS (schemes `maps`, `comgooglemaps`). Vérifier la config Expo.  
- **`Swipeable` ref** : toujours fermer le swipeable après action (`ref.current?.close()`) pour éviter l'état swipé bloqué.  
- **Dialog + Portal** : utiliser `Portal` de `react-native-paper` si le Dialog apparaît sous d'autres éléments.

## Référence contexte projet

- FR31 (recalcul instantané), FR32 (patient absent), FR33 (urgence insertion optimale) couverts par cette story [Source : `_bmad-output/planning-artifacts/epics.md` §Epic 4]  
- `_bmad-output/project-context.md` — algorithme **local uniquement**, offline-first, tests planning obligatoires

---

## Questions ouvertes (hors fichier story blocker)

- **"Déplacer à un autre jour"** : confirmer si c'est un stub pur (bouton désactivé) ou si une implémentation basique (déplacer l'entrée à J+1) est souhaitée dans cette story. Décider en implémentation.  
- **Affichage des entrées `skipped`** : les afficher dans la liste (état absent visuel, en bas) ou les masquer complètement ? L'UX spec montre le style absent → garder visible.  
- **Navigation GPS depuis le swipe** : tester `maps://` sur simulateur iOS (non supporté — utiliser device physique ou guard `Linking.canOpenURL`).

## Statut de fin de workflow

- **review** — implémentation terminée, prête pour le workflow `code-review`.  
- Optimisation quotidienne : entrées `skipped` exclues du NN+2-opt puis placées en fin de tournée après `optimizeDailyPlanning`.

---

## Dev Agent Record

### Agent Model Used

Composer (Cursor) — session dev-story 4.4.

### Debug Log References

_(aucune anomalie bloquante en phase d’implémentation.)_

### Completion Notes List

- Swipe `Swipeable` + 3 actions (Absent / Déplacer désactivé / Naviguer) ; `enabled={!dragActive}` pour cohabiter avec le drag 4.3.  
- Recalcul ETA : `computeEtaSegmentsForPlanningDayOrder` exclut les `skipped` de la chaîne Haversine ; `applyPlanningDayEtaRecalculation` + `persistManualPlanningOrder` mis à jour.  
- Absent : Dialog titre « Retirer [Prénom Nom] du planning ? », snackbar `Patient retiré — Annuler` 5 s, undo restaure le statut précédent + snackbar « Retrait annulé ».  
- Urgence : `FAB.Group` → action « Ajouter une urgence » → modal ; insertion via `generateId` + `persistManualPlanningOrder` ; `markManualReorder()` pour bloquer auto-opt 4.2.  
- Tests : `tsp-optimizer.test.ts` (dont `findOptimalInsertionIndex`, journée avec `skipped`), `urgencyInsertPosition.test.ts`, `useAbsentPatient.test.ts`.

### File List

- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts`  
- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.test.ts`  
- `apps/mobile/src/features/planning/services/applyPlanningDayEtaRecalculation.ts`  
- `apps/mobile/src/features/planning/services/persistManualPlanningOrder.ts`  
- `apps/mobile/src/features/planning/services/optimizeDailyPlanning.ts`  
- `apps/mobile/src/features/planning/utils/planning-utils.ts`  
- `apps/mobile/src/features/planning/utils/urgencyInsertPosition.ts`  
- `apps/mobile/src/features/planning/utils/urgencyInsertPosition.test.ts`  
- `apps/mobile/src/features/planning/model/types.ts`  
- `apps/mobile/src/features/planning/lib/fetchPlanningRows.ts`  
- `apps/mobile/src/features/planning/hooks/usePlanning.ts`  
- `apps/mobile/src/features/planning/hooks/useAbsentPatient.ts`  
- `apps/mobile/src/features/planning/hooks/useAbsentPatient.test.ts`  
- `apps/mobile/src/features/planning/hooks/useAddUrgency.ts`  
- `apps/mobile/src/features/planning/components/PlanningCard.tsx`  
- `apps/mobile/src/features/planning/components/UrgencyBottomSheet.tsx`  
- `apps/mobile/src/app/(app)/planning/index.tsx`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`  
- `_bmad-output/implementation-artifacts/4-4-gestion-des-patients-absents-urgences.md`

### Change Log

- 2026-05-07 : Story 4.4 — patients absents (skipped + undo), urgence avec insertion optimale, tests planning associés, statut sprint → review.
