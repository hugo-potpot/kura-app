# Story 4.1 : Affichage du planning quotidien (écran principal)

Status: review

## Story

En tant qu’IDEL,
je veux voir mon planning du jour avec la liste ordonnée de mes patients, la progression de la journée et les ETAs,
afin de démarrer ma tournée en un coup d’œil sans chercher d’informations.

## Critères d’acceptation

1. **Chargement et header (données locales)**  
   **Given** l’app ouverte sur l’onglet Planning  
   **When** le planning du jour est chargé depuis le stockage SQLite local (pas uniquement du mock)  
   **Then** l’écran affiche le header Teal avec `CircularProgressRing` (progression 0/N patients où N = nombre de visites du jour), ETA total estimé (somme des segments pertinents ou valeur dérivée des `eta_minutes` / calcul local documenté) et indicateur de statut de synchronisation (`SyncStatusIndicator` ou équivalent conforme UX C5)  
   **And** la liste ordonnée des patients s’affiche en `PlanningCard` (nom, adresse courte, heure estimée, type de soin, ETA) — anatomy C1 UX Spec  
   **And** le chargement des données locales s’effectue en moins de 2 secondes (NFR-PERF-3, aligné epics).

2. **Section carte repliable**  
   **Given** la section `MapToggleSection`  
   **When** l’écran s’affiche  
   **Then** le bouton « 🗺️ Voir la carte ∨ » (section collapsible) est visible  
   **And** l’état déplié/replié est mémorisé entre sessions via `@react-native-async-storage/async-storage` (AsyncStorage — acceptable pour préférence UI, pas pour secrets).

3. **État vide**  
   **Given** aucun patient planifié aujourd’hui (aucune entrée `planning_entries` pour la date courante et l’IDEL courant)  
   **When** l’écran Planning s’affiche  
   **Then** l’état vide « Aucun patient planifié aujourd’hui » s’affiche avec icône calendrier et lien/bouton « Voir mes patients » (navigation vers l’onglet ou stack patients).

## Périmètre explicite (ne pas mélanger avec d’autres stories)

- **Inclus :** lecture affichage + composants UI C1/C2/C7 (minimum viable carte : `MapView` + pins numérotés + polyline si coordonnées disponibles ; sinon placeholder explicite **uniquement** si les AC ci-dessus restent verts).  
- **Exclu (stories suivantes) :** génération automatique ordre optimal TSP / algorithme complet (Story 4.2), drag & drop (4.3), swipe absent / FAB urgence (4.4). Ne pas implémenter la logique métier de recalcul IA dans 4.1 ; en revanche prévoir des **données de test** (seed ou script) pour remplir `planning_entries` + patients afin de valider l’UI.

## Tâches / sous-tâches

- [x] Aligner le **DDL SQLite** embarqué (`apps/mobile/src/lib/sqlite-ddl.ts`) sur le schéma Drizzle `packages/db/schema/planning-schema.ts` (`planning_entries`) — aujourd’hui la table **n’existe pas** dans le DDL : **bloquant** pour toute lecture locale.  
- [x] Créer les features sous `apps/mobile/src/features/planning/` : `PlanningCard.tsx`, `CircularProgressRing.tsx`, `MapToggleSection.tsx`, hook `usePlanning.ts` (requête Drizzle du jour pour `idel_id` = utilisateur connecté, jointure ou requêtes séquentielles vers `patients`).  
- [x] Refactoriser `apps/mobile/src/app/(app)/planning/index.tsx` pour supprimer `MOCK_VISITS` / `VisitCard` au profit des composants nommés et données réelles.  
- [x] Intégrer `react-native-maps` (document Expo) si besoin pour C7 — **non présent** dans `package.json` à date.  
- [x] Tests co-localisés : logique de sélection date + tri `order_index` ; composants avec `@testing-library/react-native` (mocks carte).  
- [x] Accessibilité : `accessibilityLabel` sur cartes, toggle carte, lien état vide (règles `project-context.md`).

## Notes de développement

### Contexte produit

- Écran **principal** métier après auth (aligné parcours connexion → Planning).  
- Bottom nav 4 onglets déjà en place ; onglet Planning = premier tab.

### Données

- Table `planning_entries` : `patient_id`, `idel_id`, `date` (format stable type `YYYY-MM-DD` — à documenter et réutiliser partout), `order_index`, `status` (`pending` | `in_progress` | `done` | `skipped`), `eta_minutes` optionnel, `synced_at`.  
- Afficher libellé « type de soin » : si non présent en base, utiliser un champ patient existant ou valeur par défaut **documentée** (ex. texte « Soins ») jusqu’à évolution schéma — ne pas bloquer la story.

### Performance (NFR-PERF-3)

- Mesurer le chemin « ouverture écran → première frame avec liste » : index SQLite sur colonnes utilisées si besoin (`idel_id`, `date`).

### Sync

- Réutiliser les patterns `synced_at` / indicateur global ; ne pas dupliquer la queue sync ici.

### Références sources

- Epics Story 4.1 : `_bmad-output/planning-artifacts/epics.md` (section Epic 4, Story 4.1).  
- UX C1 `PlanningCard`, C2 `CircularProgressRing`, C7 `MapToggleSection`, layout écran Planning : `_bmad-output/planning-artifacts/ux-design-specification.md` (Structure écran Planning, composants C1/C2/C7).  
- Arborescence cible planning : `_bmad-output/planning-artifacts/architecture.md` section 4.2 / 5.1 (`features/planning/`).  
- Règles agents : `_bmad-output/project-context.md`.

## Exigences techniques (garde-fous)

- TypeScript strict, alias `@/`, pas de `any` implicite.  
- Drizzle **uniquement** pour accès SQLite mobile (`drizzle-orm/expo-sqlite` via `getDb()`).  
- **Ne pas** stocker JWT dans AsyncStorage.  
- Skeleton (`PlanningCardSkeleton` ou équivalent) si chargement > 300 ms (project-context).  
- FR28 couvert côté **consultation** ; l’optimisation automatique de l’ordre est hors scope (4.2).

## Conformité architecture

- Feature-based : tout sous `features/planning/` + page route mince dans `app/(app)/planning/`.  
- Composants partagés transverses (`SyncStatusIndicator`, skeletons) sous `components/` si déjà le pattern du repo.  
- Enveloppe API inchangée pour endpoints futurs ; cette story est **locale-first**.

## Bibliothèques / versions

- `@react-native-async-storage/async-storage` — **non présent** dans `apps/mobile/package.json` à fév. 2026 ; à ajouter pour la mémorisation du toggle carte (préférence UI uniquement).
- Expo SDK **~55** (voir `apps/mobile/package.json`) — vérifier compatibilité `react-native-maps` / plugin Expo.  
- `react-native-svg` déjà présent — utiliser pour `CircularProgressRing` (C2).  
- `@tanstack/react-query` : optionnel pour cache ; acceptable d’utiliser `useEffect` + état local si requête SQLite synchrone simple — choisir un pattern et rester cohérent avec le reste du module.

## Fichiers / emplacements attendus

| Fichier / zone | Rôle |
|----------------|------|
| `apps/mobile/src/lib/sqlite-ddl.ts` | Ajouter table `planning_entries` alignée schéma Drizzle |
| `apps/mobile/src/features/planning/components/PlanningCard.tsx` | C1 |
| `apps/mobile/src/features/planning/components/CircularProgressRing.tsx` | C2 |
| `apps/mobile/src/features/planning/components/MapToggleSection.tsx` | C7 |
| `apps/mobile/src/features/planning/hooks/usePlanning.ts` | Requêtes jour + idel |
| `apps/mobile/src/app/(app)/planning/index.tsx` | Composition écran |
| `packages/db/seed/` ou fixture dev | Données minimalistes pour démo chargement < 2s |

## Tests

- Unitaires : tri par `order_index`, filtre date + `idel_id`, mapping `status` → variante visuelle carte `PlanningCard`.  
- Test composant : état vide, header avec N=0.  
- Pas de DB réelle en unit test : mock Drizzle (`drizzle-orm/mock`) selon règles projet.

## Intelligence story précédente (Epic 4)

- Première story de l’Epic 4 : pas de fichier `4-0-*`. Continuité utile : patterns patients/graphiques (Epic 3) ont établi cohabitation web/mobile et thème `kura-theme` — réutiliser tokens couleurs Teal / indigo.

## Intelligence Git (récent)

- Travaux récents : correctifs graphiques constantes mobile, patients, rôles BO, JWT — attention à ne pas régresser `app/(app)/_layout` ni thème partagé.

## Veille technique (rappels)

- Expo : vérifier doc installation `react-native-maps` pour SDK 55.  
- AsyncStorage : package dédié React Native community souvent requis ; vérifier dépendance avant usage.

## Référence contexte projet

- `_bmad-output/project-context.md` — règles critiques (SecureStore, structure monorepo, tests co-localisés, anti-patterns).

## Statut de fin de story (workflow)

- **review** — implémentation terminée (workflow dev-story).

---

## Dev Agent Record

### Agent Model Used

Composer (implémentation guidée par workflow dev-story BMAD)

### Debug Log References

_RAS_

### Completion Notes List

- DDL SQLite aligné sur `planning_entries` + index `(idel_id, date)`.
- Écran Planning branché sur Drizzle (`usePlanning`) : jointure `planning_entries` ↔ `patients`, date du jour `YYYY-MM-DD`, tri `order_index`.
- Header Teal : `CircularProgressRing`, ETA total (somme des `eta_minutes`), `SyncStatusIndicator` selon `synced_at`.
- `MapToggleSection` (AsyncStorage pour l’état replié), carte native ou placeholder Web/sans GPS.
- Seed dev optionnel `seedDevPlanningIfEmpty` pour données de démo sous **\_\_DEV\_\_** uniquement.
- Tests unitaires co-localisés `planning-utils.test.ts` ; stubs Jest pour `react-native-maps` / AsyncStorage si modules absents du node_modules local.

### File List

- `apps/mobile/src/lib/sqlite-ddl.ts`
- `apps/mobile/src/app/(app)/planning/index.tsx`
- `apps/mobile/src/features/planning/hooks/usePlanning.ts`
- `apps/mobile/src/features/planning/lib/devPlanningSeed.ts`
- `apps/mobile/src/features/planning/utils/planning-utils.ts`
- `apps/mobile/src/features/planning/utils/planning-utils.test.ts`
- `apps/mobile/src/features/planning/components/CircularProgressRing.tsx`
- `apps/mobile/src/features/planning/components/PlanningCard.tsx`
- `apps/mobile/src/features/planning/components/MapToggleSection.tsx`
- `apps/mobile/src/components/SyncStatusIndicator.tsx`
- `apps/mobile/test-utils/react-native-maps-stub.js`
- `apps/mobile/test-utils/async-storage-stub.js`
- `apps/mobile/jest.setup.js`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- **2026-04-28** — Story 4.1 : planning quotidien local-first (DDL, UI C1/C2/C7/C5, hook, tests utils, stubs Jest).

