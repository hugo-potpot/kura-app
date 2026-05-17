# Story 4.5 : Carte Itinéraire & Navigation GPS

Status: review

<!-- Note : validation optionnelle via validate-create-story avant dev-story. -->

## Story

En tant qu’IDEL,  
je veux visualiser l’itinéraire de ma tournée sur une carte et lancer la navigation GPS en un geste,  
afin de me repérer rapidement et d’aller chez le prochain patient sans friction.

## Critères d’acceptation

1. **Pins numérotés et code couleur (C7 / FR34)**  
   **Given** la section carte dépliée (`MapToggleSection` C7)  
   **When** la carte est affichée (iOS / Android, pas le placeholder Web)  
   **Then** chaque patient géolocalisé du jour apparaît comme pin numéroté (ordre d’affichage aligné sur `order_index` du planning)  
   **And** la couleur du pin reflète le statut : **indigo** = à faire (`pending` / `in_progress`), **vert** = fait (`done`), **orange** = absent (`skipped`)  
   **And** les patients sans latitude/longitude restent exclus de la carte mais toujours listés avec l’avertissement déjà prévu sur la carte.

2. **Polyline d’itinéraire**  
   **Given** au moins deux points valides sur la carte  
   **When** la carte est visible  
   **Then** une `Polyline` **en tirets fins** relie les pins **dans l’ordre du planning** (tri par `order_index`, tous les points géolocalisés y compris `skipped` si présents sur la carte)  
   **And** la couleur est lisible sur fond clair (spec : indigo / teal UX — harmoniser avec `_bmad-output/planning-artifacts/ux-design-specification.md` §C7).

3. **Tap sur un pin → focus liste**  
   **Given** un pin correspondant à une entrée du planning du jour  
   **When** l’IDEL appuie sur le pin  
   **Then** la liste (`DraggableFlatList`) fait défiler jusqu’à la `PlanningCard` correspondante (même patient / même `entryId`)  
   **And** le focus respecte l’accessibilité (`accessibilityLabel` cohérent sur le pin et la carte).

4. **Lancement navigation native**  
   **Given** une adresse de navigation connue pour une visite  
   **When** l’IDEL déclenche « Naviguer » (swipe existant sur `PlanningCard`, **et** action dédiée si spec FAB / bouton carte — voir tâches)  
   **Then** l’application cartes native s’ouvre (**Maps** sur iOS via `maps://?daddr=`, **intent** `geo:` sur Android) avec l’adresse préremplie, sans étape intermédiaire obligatoire  
   **And** le comportement réutilise ou étend `openNativeMapsNavigation` dans `planning-utils.ts` sans dupliquer la logique `Linking`.

5. **ETA « prochain patient » après visite (FR35)**  
   **Given** un patient marqué comme « fait » ou dont la transmission est validée (flux métier à clarifier avec l’état réel des entrées `planning_entries`)  
   **When** le statut passe à `done` (ou équivalent métier)  
   **Then** les libellés d’ETA de la **carte suivante** dans la liste reflètent le recalcul / données à jour (soit via `refetchPlanning` déjà disponible, soit événement déclenché après validation transmission si hors scope immédiat — documenter la stratégie dans les notes de dev)  
   **And** aucune régression sur le recalcul ETA existant (stories 4.2–4.4).

## Périmètre explicite

- **Inclus :** `MapToggleSection` enrichi (couleurs statut, polyline tirets, interaction pin → liste), cohérence avec `usePlanning` / types `PlanningVisitRow`, navigation native.  
- **Hors scope MVP carte :** calcul d’itinéraire routier serveur (OSRM / Google Directions) ; la ligne reste une **corde** entre coordonnées (aligné epic / architecture Haversine on-device).  
- **À trancher en implémentation :** FAB global « Naviguer vers le prochain » vs. uniquement swipe + tap pin — l’UX mentionne un FAB « Naviguer vers suivant » ; l’écran actuel n’a qu’un `FAB.Group` urgence : ajouter une seconde action **ou** un bouton cartouche dans le header carte si surcharge FAB.

## Tâches / sous-tâches

- [x] Étendre le modèle des pins dans `usePlanning.ts` : inclure `entryId`, `status`, et **ne plus exclure** les entrées `skipped` pour l’affichage carte (tout en gardant la règle métier : pas de pin sans coords).  
- [x] Mettre à jour `MapVisitPin` / `PlanningMapPin` — exporter depuis un seul endroit pour éviter la divergence (`MapToggleSection.tsx` vs hook).  
- [x] `MapToggleSection` :  
  - couleur de bulle pin par `status` (palette alignée UX : indigo / vert / orange absent) ;  
  - `Polyline` avec `lineDashPattern` (ex. `[8, 6]`) et `strokeColor` conforme spec ;  
  - `onMarkerPress` → callback `onPinSelect(entryId: string)` fourni par la page.  
- [x] `planning/index.tsx` : `useRef` sur `DraggableFlatList`, `scrollToIndex` / `flashScrollIndicators` après sélection pin ; gérer le cas « index hors plage » / liste en cours de réordonnancement.  
- [x] Option UX : **FAB** action « Naviguer » vers la **première visite `pending` ou `in_progress`** du jour (adresse `addressFull`) — ou bouton « Naviguer prochain » dans l’entête de carte ; respecter touch target ≥ 48 px.  
- [x] `PlanningCard` : si absent, ajouter **bouton ou icône** « Naviguer » visible sans swipe uniquement (selon maquette) — aujourd’hui la navigation est surtout dans le swipe ; vérifier critère epic « bouton dans la PlanningCard ».  
- [x] Tests unitaires :  
  - construction des pins (ordre, inclusion `skipped`, exclusion sans coords) — fichier dédié ou tests `usePlanning` avec mock DB ;  
  - pure function `pinColorForStatus` / tri des coordonnées pour polyline si extraite.  
- [x] FR35 : tracer où le passage à `done` est écrit (transmission / fin de visite) ; si absent du codebase, **documenter** une sous-tâche follow-up ou implémenter un `refetchPlanning` sur `useFocusEffect` du planning + à la fin du flux de transmission minimal.

## Notes de développement

### État actuel du code (écart à combler)

- `MapToggleSection` existe avec `MapView` / `Marker` / `Polyline`, repliable, `AsyncStorage`, placeholder Web [Source : `apps/mobile/src/features/planning/components/MapToggleSection.tsx`].  
- Les pins utilisent aujourd’hui une **seule** couleur (teal) ; la polyline est **pleine** (`strokeWidth: 3`), pas en tirets.  
- `usePlanning` **filtre** les `skipped` hors des pins alors que la spec C7 impose un pin **orange** pour absent [Source : `apps/mobile/src/features/planning/hooks/usePlanning.ts` lignes 121–134].  
- `openNativeMapsNavigation` est centralisé [Source : `apps/mobile/src/features/planning/utils/planning-utils.ts`].  
- `PlanningCard` propose déjà « Naviguer » dans les actions swipe [Source : `apps/mobile/src/features/planning/components/PlanningCard.tsx`].

### Stories précédentes (4.4)

- Ne pas casser le recalcul ETA qui **exclut** les `skipped` du **calcul de trajet** tout en **affichant** les absents sur la carte (deux règles distinctes).  
- Drag + swipe : conserver `swipeEnabled={!isActive}` sur la carte liste.

### Conformité architecture

- Carte via `react-native-maps` (FR34) ; offline-first — pas d’appel réseau obligatoire pour afficher la carte [Source : `_bmad-output/planning-artifacts/architecture.md` §1.2, §2.2].  
- Structure `features/planning/components`, `hooks` ; logique liste / refs peut rester dans `app/(app)/planning/index.tsx` [Source : `_bmad-output/project-context.md`].

### Bibliothèques / versions

| Lib | Usage |
|-----|--------|
| `react-native-maps` `^1.27.2` | `MapView`, `Marker`, `Polyline`, `lineDashPattern` |
| `react-native` `Linking` | Déjà encapsulé dans `openNativeMapsNavigation` |

Vérifier sur appareil réel : `maps://` et `geo:` peuvent échouer sur simulateur ; envisager `Linking.canOpenURL` + fallback message discret.

### Tests

- Pas de snapshot lourd de `MapView` : préférer extraction de **fonctions pures** (tri pins, couleurs, suite de coordonnées pour polyline).  
- Stub Jest existant pour `react-native-maps` [Source : `apps/mobile/test-utils/react-native-maps-stub.js`].

### Intelligence Git (récent)

- Derniers commits sur la branche : dont `a36c486` (drag & drop planning), `2536ff2` (docs story 4.2). Préserver `DraggableFlatList` et hooks `useReorderPlanning` / `useAbsentPatient` / `useAddUrgency`.

### Veille technique

- `Polyline` : propriété `lineDashPattern` (tableau de nombres) selon la doc `react-native-maps` pour tirets ; valider rendu iOS vs Android.  
- `Marker` custom view : s’assurer que `tracksViewChanges` ne fige pas le rendu si besoin de perf (liste longue).

### Référence contexte projet

- Critères détaillés epic [Source : `_bmad-output/planning-artifacts/epics.md` — Story 4.5].  
- C7 UX [Source : `_bmad-output/planning-artifacts/ux-design-specification.md` §C7].  
- FR34, FR35 [Source : même fichier epic / trace FR].

---

## Questions ouvertes (non bloquantes pour démarrer)

- Emplacement exact du **FAB « Naviguer »** si on évite d’empiler trop d’actions sur le `FAB.Group` (régression UX).  
- FR35 : si la validation transmission n’existe pas encore (Epic 5), accepter un **recalcul à la navigation** (`useFocusEffect`) comme MVP documenté.

## Statut de fin de workflow

- **review** — Implémentation terminée (`dev-story` 2026-05-14) ; prochain pas : flux `code-review`.  
- Note : FR35 MVP = `refetchPlanning()` lors du focus écran planning (Epic 5 / transmission hors scope pour événements dédiés).

---

## Dev Agent Record

### Agent Model Used

Assistant Cursor — exécution workflow BMAD dev-story (2026-05-14).

### Debug Log References

### Completion Notes List

- `PlanningMapPin` unifié (`planning-map-pins.ts`) : `buildPlanningMapPins`, `pinColorForStatus`, `mapPinAccessibilityLabel`; `usePlanning` + `MapToggleSection` alignés.
- Carte native : pins indigo / vert / orange selon statut ; polyline tirets `[8, 6]`, contour indigo ; absents géolocalisés inclus dans l’ordre `order_index`.
- Liste : sélection pin → `scrollToIndex` + fallback `scrollToOffset` / `onScrollToIndexFailed` ; toolbar carte « Naviguer vers le prochain » (`pending`|`in_progress` + `openNativeMapsNavigation`).
- `PlanningCard` : icône navigation 48 px sans passer par le swipe ; swipe inchangé.
- FR35 : `useFocusEffect` déclenche `refetchPlanning()` puis optimiseur focus existant.
- Tests `planning-map-pins.test.ts` (Jest) : tous les tests planning passent localement (`pnpm exec jest src/features/planning`).

### File List

- `apps/mobile/src/features/planning/utils/planning-map-pins.ts`
- `apps/mobile/src/features/planning/utils/planning-map-pins.test.ts`
- `apps/mobile/src/features/planning/hooks/usePlanning.ts`
- `apps/mobile/src/features/planning/components/MapToggleSection.tsx`
- `apps/mobile/src/features/planning/components/PlanningCard.tsx`
- `apps/mobile/src/app/(app)/planning/index.tsx`

### Change Log

- 2026-05-07 : Création story 4.5 (workflow create-story) — statut sprint passé à `ready-for-dev`.
- 2026-05-14 : Implémentations carte / navigation GPS / tests (`dev-story`).
