# Story 4.6 : Préférences de Planning

Status: review

<!-- Note : validation optionnelle via validate-create-story / checklist avant dev-story. -->

## Story

En tant qu’IDEL,  
je veux définir mes préférences de planning (horaires de début, pauses, zones géographiques prioritaires),  
afin que l’algorithme génère des suggestions alignées avec mon mode de travail habituel.

## Critères d’acceptation

1. **Écran Paramètres > Préférences planning**  
   **Given** l’application avec un utilisateur connecté  
   **When** j’ouvre Profil puis « Préférences planning »  
   **Then** je peux définir au minimum : heure de début habituelle de tournée, heure de début de pause déjeuner, durée de la pause (minutes), et une stratégie de **zones géographiques prioritaires** (voir tâches — MVP précisé ci-dessous)  
   **And** les valeurs sont **persistées en local** (appareil) et relues au prochain lancement sans perte  

2. **Prise en compte par l’algorithme et les ETA**  
   **Given** des préférences enregistrées (ex. début 8h00, pause 12h30 durée 30 min)  
   **When** le planning est généré ou ré-optimisé (`optimizeDailyPlanning` / NN+2-opt + recalcul ETA)  
   **Then** la base horaire utilisée pour les libellés d’heure (créneau visite / cumul depuis le début de journée)** dérive bien de l’heure de début configurée**, et non uniquement du constant historique  
   **And** le recalcul des segments intègre la **pause** comme bloc de temps réservé (les visites après la pause décales après `durée_pause` à partir du créneau de pause choisi, sans écraser l’ordre déjà défini hors algorithme)  

3. **Zones prioritaires**  
   **Given** au moins une zone prioritaire configurée (MVP : voir Notes de développement)  
   **When** l’algorithme d’ordonnancement s’exécute  
   **Then** les visites géolocalisées « dans » une zone prioritaire reçoivent un **bonus** exploitable par l’heuristique (ex. lien fort dans NN / pénalité distance réduite vers le centroïde de zone) conformément aux objectifs métier FR36  
   **And** les patients sans coordonnées gardent les règles existantes (fin de liste, stabilité)  

4. **Mode manuel pur (FR38)**  
   **Given** l’option « Mode manuel pur » dans les **préférences**  
   **When** elle est activée  
   **Then** le bouton principal « Optimiser la tournée » / génération auto sur l’écran Planning **n’est plus exposé** (comportement actuel lorsque `manualModePur` — à aligner sur la même source de vérité que les autres préférences)  
   **And** aucun run automatique au focus (`tryFirstFocusOptimizeIfEligible`) ne s’exécute  

## Périmètre explicite

- **Inclus :** persistance locale, navigation depuis Profil, branchement des constantes jusqu’à `tsp-optimizer` / `planning-utils` (heure de début jour, insertion pause dans le calcul ETA), mode manuel pur piloté depuis l’écran préférences avec UI planning cohérente (retirer doublons si pertinent).  
- **Hors scope :** synchro cloud des préférences entre appareils (Epic 6 pourra étendre) ; édition multi-jours différentes par défaut jour courant uniquement au MVP.  
- **Trancher lors de l’implémentation MVP zones :** (a) périmètres circulaires (lat/lng + rayon km) jusqu’à N zones sauvegardés en JSON, ou (b) liste de quartiers/postal codes sélectionnables à partir des adresses déjà présentes chez les patients assignés — choisir **une** approche MVP documentée dans les notes avant code.

## Tâches / sous-tâches

- [x] Créer un module de préférences (ex. `usePlanningPreferences`, `planning-preferences-schema.ts` avec Zod) : lecture/écriture locale (priorité **`AsyncStorage` clé dédiée** alignée avec `usePlanningManualMode`, ou petite table Drizzle locale si équipe préfère cohérence SQLite — décider dans la PR et documenter).  
- [x] Ajouter route `apps/mobile/src/app/(app)/profile/planning-preferences.tsx` (+ entrée liste dans `apps/mobile/src/app/(app)/profile/index.tsx`).  
- [x] Formulaire : temps de début journée ; pause déjeuner (heure début + durée) ; zones prioritaires (MVP défini ci-dessus) ; commutateur Mode manuel pur **déplacé depuis** `planning/index.tsx` ou doublon supprimé au profit du seul écran préférences (`usePlanningManualMode` refactor pour partager même hook/store).  
- [x] Propager `dayStartMinutesSinceMidnight` (remplace l’usage direct de `PLANNING_DAY_START_MINUTES` partout où l’heure affichée compte pour l’utilisateur : `estimatedVisitClockMinutes`, `computeEtaSegmentsForPlanningDayOrder`, et imports dans `PlanningCard`/`usePlanning`).  
- [x] Étendre `computeEtaSegmentsForPlanningDayOrder` (ou helper dédié) pour **injecter** la pause : après cumul temps ≥ `pauseStartMinutes`, ajouter `lunchDurationMinutes` avant de continuer le cumul trajets/soins.  
- [x] Étendre `optimizeVisitOrder` / scoring pour bonus zone (données `VisitNode` + préférences géo) sans casser tests existants du TSP (`tsp-optimizer.test.ts`).  
- [x] Tests unitaires : sérialisation préférences ; calcul ETA avec pause aux bornes ; cas « pas de pause » ; cas mode manuel (pas d’optimize).  

## Notes de développement

### État actuel du code (écarts épique / UX)

- `PLANNING_DAY_START_MINUTES = 8 * 60` est **figé** dans `apps/mobile/src/features/planning/utils/planning-utils.ts`.  
- `computeEtaSegmentsForPlanningDayOrder` et usages dans `tsp-optimizer.ts` initialisent `cumClock` avec cette constante [Source : `tsp-optimizer.ts` lignes ~204, 323, 413].  
- Le **mode manuel pur** est déjà géré avec `AsyncStorage` (`usePlanningManualMode.ts`, clé `kura:planning:manual_mode`) mais le **interrupteur vit sur l’écran Planning** (`planning/index.tsx`) alors que FR38 / epic 4.6 le placent sous **Préférences**.  
- L’optimisation auto au focus (`tryFirstFocusOptimizeIfEligible`) respecte déjà `manualModePur` [Source : `useOptimizePlanning.ts`].  

### Continuité story 4.5 (sans régression)

- Conserver comportement ETA / trajet pour entrées `skipped` et cohabitation carte + liste après branchement des préférences ; ne pas changer la sémantique `order_index` hors scope de cette story.

### Architecture & projet

- Algorithme **100 % on-device** [Source : `_bmad-output/project-context.md`].  
- Préférences ne sont pas des données de santé : `AsyncStorage` acceptable pour valeurs métier légerées (comme carte repliée / mode manuel) ; si évolution SQLite, suivre conventions Drizzle sous `packages/db` si table partagée.  
- Imports alias `@/` ; RN Paper pour contrôles ; accessibilité `accessibilityLabel` sur champs interactifs [Source : `project-context.md`].  

### Bibliothèques

- Pas de nouveau package obligatoire : sélecteurs horaires peuvent être `TextInput` contrôlé + validation Zod ou composant Paper tant que UX reste lisible — si ajout `@react-native-community/datetimepicker`, le justifier dans la PR (poids tampon Expo).

### Tests

- Étendre `planning-utils.test.ts` et `tsp-optimizer.test.ts` pour préférences fictives injectées dans les fonctions pures exposées ou via paramètre objet `PlanningDayTimelinePrefs`.

### Intelligence Git

- Travaux récents planning : commits `a36c486`, `20c88bc`, `2536ff2` — préserver drag & drop, hooks urgence/absent et chemins `optimizeDailyPlanning`.

### Veille / versions

- Aucune API cloud pour le calcul : rester compatible Expo SDK 53 / RN 0.79 comme indiqué dans `project-context.md`.

### Références

- Critères épique [Source : `_bmad-output/planning-artifacts/epics.md` — Story 4.6, Epic 4].  
- FR36, FR37, FR38 [Source : même fichier § liste FR Planning].  
- Story précédente 4.5 (carte / GPS) [Source : `_bmad-output/implementation-artifacts/4-5-carte-itineraire-navigation-gps.md`].  

---

## Questions ouvertes (à régler avant ou pendant implémentation)

- Représentation MVP des « zones géographiques prioritaires » (cercle vs codes postaux).  
- Faut-il garder un raccourci « Mode manuel » sur Planning pour confort terrain, ou épique strict sans doublon (préférences uniquement).

## Statut de fin de workflow

- **ready-for-dev** — Analyse artefacts (epic, sprint, codebase, story 4.5) terminée ; fichier story prêt pour `dev-story`.  
- Contexte développeur : ultimate story — consolidation des garde-fous ci-dessus.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Curly quote (U+2018/U+2019) introduit par l'Edit tool dans `tsp-optimizer.ts` → remplacé par ASCII + correction apostrophe `d'optimisation` dans string single-quotée (ligne 355).
- Jest 30 : flag `--testPathPattern` déprécié, remplacé par argument positionnel.

### Completion Notes List

- MVP zones prioritaires : cercles géographiques (lat/lng + radiusKm, max 3) avec `ZONE_BOOST_FACTOR = 0.7` appliqué dans la phase NN uniquement.
- Mode manuel pur migré de `usePlanningManualMode` (clé `kura:planning:manual_mode`) vers `usePlanningPreferences` (clé `kura:planning:preferences`) avec migration automatique au premier chargement.
- Pause déjeuner injectée avec flag `lunchInserted` pour éviter double-injection dans les boucles ETA.
- Pre-existing TypeScript errors dans auth/patients features — non introduits par cette story.

### File List

- `apps/mobile/src/features/planning/hooks/planning-preferences-schema.ts` (créé)
- `apps/mobile/src/features/planning/hooks/planning-preferences-schema.test.ts` (créé)
- `apps/mobile/src/features/planning/hooks/usePlanningPreferences.ts` (créé)
- `apps/mobile/src/app/(app)/profile/planning-preferences.tsx` (créé)
- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts` (modifié — `PlanningDayTimelinePrefs`, zones prioritaires, pause déjeuner)
- `apps/mobile/src/features/planning/algorithm/tsp-optimizer.test.ts` (modifié — nouveaux tests pause, zones, dayStart)
- `apps/mobile/src/features/planning/utils/planning-utils.ts` (modifié — `dayStartMinutes` paramètre optionnel)
- `apps/mobile/src/features/planning/utils/planning-utils.test.ts` (modifié — test dayStart personnalisé)
- `apps/mobile/src/features/planning/hooks/usePlanning.ts` (modifié — `dayStartMinutes` propagé à `formatVisitClockLabel`)
- `apps/mobile/src/features/planning/hooks/useOptimizePlanning.ts` (modifié — lit `usePlanningPreferences`, passe prefs à `optimizeDailyPlanning`)
- `apps/mobile/src/features/planning/services/optimizeDailyPlanning.ts` (modifié — paramètre `prefs?: PlanningDayTimelinePrefs`)
- `apps/mobile/src/app/(app)/planning/index.tsx` (modifié — suppression Switch mode manuel, propagation `dayStartMinutes`)
- `apps/mobile/src/app/(app)/profile/index.tsx` (modifié — entrée navigation vers préférences planning)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié — `in-progress` → `review`)

### Change Log

- 2026-05-07 : Création story 4.6 (workflow create-story) ; sprint `4-6-preferences-de-planning` → `ready-for-dev`.
- 2026-05-19 : Implémentation complète story 4.6 (dev-story) ; statut → `review`.
