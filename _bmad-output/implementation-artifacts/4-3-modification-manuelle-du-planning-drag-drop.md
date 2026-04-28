# Story 4.3 : Modification Manuelle du Planning (Drag & Drop)

Status: review

<!-- Note : validation optionnelle via validate-create-story avant dev-story. -->

## Story

En tant qu'IDEL,  
je veux réorganiser l'ordre de mes patients par glisser-déposer avec recalcul instantané des ETAs,  
afin de garder le contrôle total sur ma tournée et adapter à mes connaissances terrain.

## Critères d'acceptation

1. **Long press → mode drag**  
   **Given** la liste de planning affichée  
   **When** l'IDEL maintient appuyé une `PlanningCard` (long press ≥ 300 ms)  
   **Then** la carte entre en mode drag : élévation +3dp, rotation 2°, haptic feedback léger (`ImpactFeedbackStyle.Light`)  
   **And** les autres cartes se déplacent visuellement pour indiquer la position de dépôt cible  
   **And** le feedback visuel est perceptible en **< 100 ms** (réactivité UI, pas de calcul bloquant).

2. **Dépôt → mise à jour instantanée + recalcul ETAs**  
   **Given** une carte déplacée et relâchée à une nouvelle position  
   **When** le dépôt est effectué  
   **Then** l'ordre est mis à jour **instantanément** dans l'UI (optimiste) avec haptic feedback impact (`ImpactFeedbackStyle.Medium`)  
   **And** les `order_index` sont persistés via Drizzle SQLite (bulk update) sur les lignes `planning_entries` du jour courant et de l'IDEL courant  
   **And** les `eta_minutes` de **toutes** les entrées sont recalculés en **moins de 2 secondes** (réutilisation des segments Haversine de `tsp-optimizer`)  
   **And** `synced_at` est mis à `null` sur toutes les entrées mutées  
   **And** un Snackbar **"Modification enregistrée — Annuler"** s'affiche pendant **5 secondes** avec action undo.

3. **Undo (annulation)**  
   **Given** le Snackbar "Modification enregistrée — Annuler" visible  
   **When** l'IDEL tape "Annuler" dans les 5 secondes  
   **Then** l'ordre précédent est restauré en UI et en base (Drizzle bulk update sur l'ordre sauvegardé)  
   **And** un Snackbar "Modification annulée" s'affiche brièvement  
   **And** si 5 secondes s'écoulent sans action, le Snackbar disparaît et l'ordre courant est définitivement conservé.

4. **Mode Manuel Pur (FR38)**  
   **Given** l'option "Mode Manuel Pur" activée (toggle accessible depuis l'écran Planning, persistée en AsyncStorage)  
   **When** l'IDEL accède au planning  
   **Then** le bouton "Optimiser la tournée" (CTA 4.2) **disparaît** de l'interface  
   **And** aucune optimisation automatique n'est déclenchée (le déclencheur 4.2 est court-circuité)  
   **And** l'ordre est entièrement sous contrôle manuel par drag & drop.

5. **Offline**  
   **Given** le mode avion / pas de backend  
   **When** un drag & drop est effectué  
   **Then** la mise à jour `order_index` + `eta_minutes` est persistée **SQLite uniquement** (100 % local, NFR-REL-1)  
   **And** le flag `synced_at: null` marque les entrées en attente de sync.

6. **Pas de conflit avec l'auto-optimisation (4.2)**  
   **Given** le Mode Manuel Pur désactivé (mode par défaut)  
   **When** l'IDEL réorganise manuellement puis retourne sur l'écran  
   **Then** l'auto-optimisation du premier focus (si activée en 4.2) **ne se redéclenche pas** si un drag & drop a été effectué dans la session courante (flag local `hasManuallyReordered` remis à zéro au changement de date).

## Périmètre explicite

- **Inclus :** drag & drop via `DraggableFlatList`, mise à jour `order_index` + `eta_minutes` Drizzle, Snackbar undo, haptic feedback, toggle Mode Manuel Pur (stockage AsyncStorage, UI sur planning index).  
- **Exclu :** swipe left patient absent / urgence FAB (**4.4**), carte navigation GPS (**4.5**), écran Préférences complet (**4.6**). Pas de recalcul de trajet serveur — interdit par `project-context.md`.

## Tâches / sous-tâches

- [x] Installer `react-native-draggable-flatlist` (compatible Expo SDK 55 + Reanimated 4.x) et vérifier compatibilité Hermes — ajouter dans `apps/mobile/package.json`.  
- [x] Créer `apps/mobile/src/features/planning/hooks/useReorderPlanning.ts` :  
  - Exposer `reorder(fromIndex, toIndex)` — optimistic local, puis Drizzle bulk update  
  - Exposer `undoReorder()` — restaure ordre précédent depuis ref  
  - Gérer timer 5 s undo (via `setTimeout`, annulé si undo avant expiration)  
  - Mettre `synced_at: null` sur entrées mutées  
  - Recalculer `eta_minutes` via segments Haversine partagés (importer depuis `algorithm/`)  
  - Flag `hasManuallyReordered` pour bloquer auto-optimisation 4.2 dans la session.  
- [x] Modifier `apps/mobile/src/features/planning/components/PlanningCard.tsx` :  
  - Ajouter prop optionnelle `drag?: () => void` (fournie par `DraggableFlatList`)  
  - Ajouter prop optionnelle `isActive?: boolean` (style mode drag : élévation + rotation 2°)  
  - Ajouter drag handle visuel (icône `drag-vertical` ou `≡`, `accessibilityLabel="Déplacer"`)  
  - Appliquer animation Reanimated légère sur `isActive` (scale ou shadow).  
- [x] Modifier `apps/mobile/src/app/(app)/planning/index.tsx` :  
  - Remplacer `FlatList` par `DraggableFlatList` de `react-native-draggable-flatlist`  
  - Connecter `onDragEnd` à `useReorderPlanning.reorder`  
  - Afficher Snackbar (Paper `Snackbar`) avec bouton "Annuler" connecté à `undoReorder`  
  - Ajouter toggle "Mode Manuel Pur" (ex. `Switch` + label, dans un menu ou header) qui persiste en AsyncStorage  
  - Masquer le bouton "Optimiser la tournée" (4.2) si mode manuel actif.  
- [x] Créer ou réutiliser `apps/mobile/src/hooks/useHaptics.ts` : wrapper `expo-haptics` pour `Light`, `Medium`, `Heavy` (déjà référencé dans architecture — créer si absent).  
- [x] Tests unitaires `useReorderPlanning` : cas reorder normal, undo dans les 5 s, undo après expiration, mode offline (mock Drizzle).

## Notes de développement

### Story précédente (4.2)

- `usePlanning` retourne les entrées triées par `order_index` — continuer cette convention.  
- `PlanningCard` reçoit `entry` (jointure `planning_entries` ↔ `patients`) — ajouter `drag` / `isActive` comme props optionnelles sans casser l'interface existante.  
- `tsp-optimizer` expose les calculs de segments (trajet + soin) — réutiliser la fonction de calcul `eta_minutes` pour mettre à jour les segments après reorder (distance Haversine entre consécutifs, vitesse constante documentée).  
- `DEFAULT_CARE_MINUTES` et vitesse moyenne depuis `algorithm/` sont des constantes partagées à ne pas dupliquer.  
- `PLANNING_DAY_START_MINUTES` sert de base pour recalculer `estimatedVisitClockMinutes` — le recalcul post-drag doit rester compatible avec l'horloge cumulée.

### Stratégie de mise à jour `order_index`

Après un drag, renuméroter **tous les `order_index` du jour** (ex. 0, 1, 2, …) dans une seule transaction Drizzle pour éviter les collisions :

```typescript
await db.transaction(async (tx) => {
  for (let i = 0; i < reorderedIds.length; i++) {
    await tx.update(planningEntries)
      .set({ orderIndex: i, syncedAt: null, updatedAt: new Date() })
      .where(eq(planningEntries.id, reorderedIds[i]));
  }
});
```

Alternativement : `db.batch([...updateStatements])` si l'API Drizzle expo-sqlite le supporte — préférer si disponible.

### Mode Manuel Pur — stockage

Clé AsyncStorage : `'kura:planning:manual_mode'` (string `'true'`/`'false'`).  
Lire au montage de l'écran planning, exposer via Zustand ou state local + setter.  
Ne pas exposer de setting serveur — purement local.

### Undo — implémentation

```typescript
const previousOrder = useRef<string[]>([]); // liste d'IDs dans l'ordre précédent
// Avant chaque reorder, sauvegarder l'ordre courant dans previousOrder.current
// undoReorder() relance un bulk update avec previousOrder.current
```

### Compatibilité `DraggableFlatList` + Reanimated 4

`react-native-draggable-flatlist@^4.x` requiert Reanimated 3+. Vérifier la version exacte compatible avec Reanimated 4.2.1 du projet avant installation. Si incompatibilité, implémenter avec `PanGestureHandler` + `Reanimated.useAnimatedGestureHandler` manuellement (plus complexe mais sans dépendance ajoutée).

## Exigences techniques (garde-fous dév agent)

- **TypeScript strict**, alias `@/`, aucune logique métier dans `app/`.  
- **Drizzle** `expo-sqlite` via `getDb()` ; transaction ou batch — pas de N requêtes séquentielles non groupées.  
- **ULID / generateId()** inchangés ; pas de création de nouvelles entrées dans cette story — seulement mise à jour.  
- Respect **multi-tenant** : filtre `idel_id` + `date` sur toutes les requêtes `planning_entries`.  
- **Hermes** : éviter les closures lourdes dans les callbacks de drag ; Reanimated worklets pour animations.  
- Pas de `console.log` bruyant en production (conditionner à `__DEV__`).

## Conformité architecture

- Structure cible : `features/planning/hooks/useReorderPlanning.ts`, composants dans `features/planning/components/` [Source : `_bmad-output/planning-artifacts/architecture.md` §4.2 Structure Patterns].  
- `useHaptics.ts` référencé dans `hooks/` globaux (`apps/mobile/src/hooks/`) [Source : `architecture.md` arborescence ligne ~785].  
- Page `planning/index.tsx` doit rester mince — logique métier dans hooks/features [Source : `architecture.md` §4.6 Règles Obligatoires].

## Bibliothèques / versions

| Lib | Usage | Statut |
|-----|-------|--------|
| `react-native-gesture-handler ~2.30.0` | Gestures long press / pan | **Déjà installée** |
| `react-native-reanimated 4.2.1` | Animations drag | **Déjà installée** |
| `expo-haptics` (inclus Expo SDK 55) | Haptic feedback | **Disponible** |
| `react-native-draggable-flatlist` | DraggableFlatList | **Installé** `^4.0.1` (Reanimated 4.2.1) |

Si `react-native-draggable-flatlist` est incompatible avec Reanimated 4.2.1, utiliser `PanGestureHandler` + Reanimated worklets directement — documenter le choix dans les Completion Notes.

## Fichiers / emplacements attendus

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/features/planning/hooks/useReorderPlanning.ts` | Orchestration reorder + undo + ETAs |
| `apps/mobile/src/features/planning/components/PlanningCard.tsx` | Props drag / isActive + handle visuel |
| `apps/mobile/src/app/(app)/planning/index.tsx` | DraggableFlatList + Snackbar + Mode Manuel toggle |
| `apps/mobile/src/hooks/useHaptics.ts` | Wrapper expo-haptics (créer si absent) |

## Tests

- **Unitaires** sur `useReorderPlanning` (obligation projet) : reorder normal, undo < 5 s, undo expiré, offline (mock `getDb()`).  
- **Pas de SQLite réelle** dans unit tests — mocks Drizzle.  
- Tester que `order_index` est bien renuméroté de 0 à N-1 après reorder.  
- Tester que `synced_at` vaut `null` sur toutes les entrées mutées.

## Intelligence story précédente (4.1 & 4.2)

- `estimatedVisitClockMinutes` calculé en cumulant `eta_minutes` depuis `PLANNING_DAY_START_MINUTES` — le recalcul post-drag doit produire des `eta_minutes` cohérents avec ce schéma (sinon l'horloge saute).  
- `SyncStatusIndicator` se base sur `syncedAt: null` pour afficher le badge de sync — bien propager `null` après chaque drag.  
- Le flag `hasManuallyReordered` doit être remis à `false` à minuit (changement de date) pour permettre l'auto-optimisation le lendemain.

## Intelligence Git (récent)

- Dernier commit pertinent : `2536ff2 docs: Story 4.2`, `b2a064d fix issue planning`, `f85d7d0 feat: Ajout du planning réel`.  
- Ne pas casser `auth-store`, thème, module patients ni les hooks 4.1/4.2 existants.

## Veille technique (rappels)

- **Reanimated 4 + Hermes** : les worklets ne supportent pas toutes les API JS — ne pas utiliser `setTimeout` dans un worklet ; le mettre dans le thread JS.  
- **Long press sur iOS** : s'assurer que `GestureDetector` ou `LongPressGestureHandler` ne between pas avec le `ScrollView` parent — `DraggableFlatList` gère ça, mais à surveiller si implémentation manuelle.  
- **Snackbar Paper** : utiliser le composant `Snackbar` de `react-native-paper` (déjà dans le projet) pour la cohérence thème.

## Référence contexte projet

- `_bmad-output/project-context.md` — algorithme **local uniquement**, tests planning obligatoires, offline-first.  
- FR30 (drag & drop) + FR38 (mode manuel pur) couverts par cette story [Source : `_bmad-output/planning-artifacts/epics.md` §Epic 4].

---

## Questions ouvertes (hors fichier story blocker)

- Confirmer compatibilité exacte `react-native-draggable-flatlist` avec Reanimated 4.2.1 avant d'installer — sinon partir sur implémentation manuelle.  
- Emplacement UX du toggle "Mode Manuel Pur" : dans le header planning (icône ⚙️ → bottom sheet) ou directement comme `Switch` visible ? À décider en implémentation.

## Statut de fin de workflow

- **review** — implémentation dev-story (2026-04-28) ; prête pour workflow `code-review`.

---

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor Agent) — dev-story 2026-04-28

### Debug Log References

_Aucun._

### Completion Notes List

- `react-native-draggable-flatlist@^4.0.1` + `expo-haptics` ajoutés ; `GestureHandlerRootView` sur le layout racine (`app/_layout.tsx`) pour RNGH.
- `computeEtaSegmentsForVisitOrder` extrait dans `tsp-optimizer.ts` ; persistance transactionnelle dans `persistManualPlanningOrder.ts` (filtre `idel_id` + `date`, `syncedAt: null`, `etaMinutes` recalculés).
- Session planning : `planning-ux-session.ts` (`hasManuallyReordered`, premier focus auto une fois par jour, reset au changement de date) ; `useOptimizePlanning.tryFirstFocusOptimizeIfEligible` + `useFocusEffect` (expo-router).
- Snackbar Annuler : durée Paper 5 s ; message secondaire « Modification annulée » après undo.
- Undo : la durée de 5 s est gérée par le `duration` du `Snackbar` (plus de `setTimeout` doublon dans le hook).

### File List

- `apps/mobile/package.json`
- `apps/mobile/package-lock.json` _(ou pnpm-lock à la racine du monorepo si modifié)_
- `apps/mobile/src/app/_layout.tsx`
- `apps/mobile/src/app/(app)/planning/index.tsx`
- `apps/mobile/src/features/planning/components/PlanningCard.tsx`
- `apps/mobile/src/features/planning/hooks/useOptimizePlanning.ts`
- `apps/mobile/src/features/planning/hooks/usePlanningManualMode.ts`
- `apps/mobile/src/features/planning/hooks/useReorderPlanning.ts`
- `apps/mobile/src/features/planning/services/persistManualPlanningOrder.ts`
- `apps/mobile/src/features/planning/stores/planning-ux-session.ts`
- `apps/mobile/src/features/planning/stores/planning-ux-session.test.ts`
- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts`
- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.test.ts`
- `apps/mobile/src/hooks/useHaptics.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-3-modification-manuelle-du-planning-drag-drop.md`

### Change Log

- 2026-04-28 : Story 4.3 — Drag & drop planning, mode manuel pur, snackbar undo, premier focus auto-conditionnel, tests algo + session UX.
