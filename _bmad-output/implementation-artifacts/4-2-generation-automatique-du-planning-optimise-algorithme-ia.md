# Story 4.2 : Génération automatique du planning optimisé (algorithme IA)

Status: ready-for-dev

<!-- Note : validation optionnelle via validate-create-story avant dev-story. -->

## Story

En tant qu’IDEL,  
je veux que mon planning soit généré automatiquement en tenant compte des localisations, des durées de soins et des contraintes horaires,  
afin de gagner du temps sur l’organisation de ma tournée et de réduire les trajets.

## Critères d’acceptation

1. **Algorithme local (perf)**  
   **Given** une liste de patients assignés (`assigned_idel_id` = IDEL courant) avec `latitude` / `longitude` quand disponibles, et des durées de segment pour le calcul des ETAs  
   **When** la génération du planning est déclenchée (action explicite « Optimiser la tournée » et/ou premier chargement utile du jour documenté dans les Dev Notes)  
   **Then** l’implémentation **Nearest Neighbour** suivie d’un **2-opt** sur la tour calculée renvoie un ordre de visites **sans appel réseau**  
   **And** pour jusqu’à **15 patients** géolocalisés, le calcul + persistance Drizzle SQLite s’effectue en **moins de 5 secondes** sur appareil cible (aligné **NFR-PERF-2** / FR29).

2. **Coûts et données**  
   **Then** les distances utilisent **Haversine** entre coordonnées (ou depuis un point « départ » fixe documenté si le produit décide un départ foyer — à trancher une fois dans le ticket, défaut acceptable : première étape NN depuis un point agrégé des coords ou dernier lieu connu)  
   **And** les **segments `eta_minutes`** stockés sur chaque ligne `planning_entries` représentent : temps de trajet estimé jusqu’à ce patient **+ durée du soin sur place** (durée par défaut **constante nommée** partagée, ex. `DEFAULT_CARE_MINUTES`, tant que le schéma patient n’expose pas de durée métier).

3. **Fenêtres horaires et préférences (alignement epics)**  
   **And** tant que **`packages/db`** n’a pas de champs dédiés (créneaux patient, préférences IDEL), le code **priorise une contrainte documentée MVP** : pénalité ou réordonnancement pour respecter un **premier créneau** global cohérent avec **`PLANNING_DAY_START_MINUTES`** (`planning-utils.ts`), et références explicites « extension schéma future » pour vraies fenêtres — **sans bloquer la story**.  
   **And** préférences IDEL narratives (Epic / FR36) restent hors scope jusqu’à Story **4.6** ; aucun écran Réglages requis dans **4.2**, mais l’architecture du module doit permettre de **brancher** des poids utilisateur plus tard (paramètres dans le pur module algo).

4. **Sans coordonnées GPS**  
   **Given** un patient avec `latitude` ou `longitude` null  
   **When** la génération s’exécute  
   **Then** ces patients sont placés **en fin de liste** (ordre relatif parmi eux défini mais stable — ex. ordre précédent ou tri par nom)  
   **And** l’UI `PlanningCard` ou résumé équivalent affiche l’avertissement **« Adresse non géolocalisée »** (aligné **`project-context.md`** fallback badge).

5. **Hors ligne**  
   **Given** le mode avion / pas de backend  
   **When** la génération tourne  
   **Then** le résultat est **calcul et écrit SQLite uniquement** (100 % local, **NFR-REL-1**).

6. **Transparence IA (FR37)**  
   **Given** le planning régénéré  
   **When** l’IDEL consulte une `PlanningCard`  
   **Then** une ligne courte explique **pourquoi** la position (ex. *« Sur votre trajet après Mme Martin — trajet estimé court »*, *« Créneau matin »*) — fondée sur règles lisibles (**pas** texte générique placebo) : au minimum **distance depuis le précédent**, présence ou non de **fenêtre** si données disponibles plus tard.

## Périmètre explicite

- **Inclus :** module `algorithm/` (Haversine, NN + 2-opt), persistance `order_index` + `eta_minutes` + timestamps, exposition UI du déclencheur d’optimisation, tests unitaires algo, mise à jour `synced_at` cohérente après mutation locale.  
- **Exclu :** réordonnancement drag & drop (**4.3**), swipe absent / FAB urgence (**4.4**), carte navigation avancée (**4.5**), écran complet préférences (**4.6**). Pas d’endpoint serveur pour **calculer** l’ordre — **interdit** par `project-context.md`.

## Tâches / sous-tâches

- [ ] Créer `apps/mobile/src/features/planning/algorithm/haversine.ts` (+ tests) — distances km ou minutes trajet avec vitesse moyenne **constante documentée**.  
- [ ] Créer `tsp-optimizer.ts` — entrée : liste de visites projetées depuis patients + métadonnées ; sortie : ordre + segments minutes ; NN puis 2-opt borné.
- [ ] Co-localiser `tsp-optimizer.test.ts` : cas **0**, **1**, **15** patients, patients **sans coords**, graphe trivialement optimal.  
- [ ] Ajouter orchestration Drizzle dans un hook/service (ex. `useOptimizePlanning.ts` ou `optimizeDailyPlanning.ts`) : transaction update `planning_entries` pour la **date du jour** + `idel_id` courant.
- [ ] Intégrer CTA UX sur `planning/index.tsx` (bouton « Optimiser la tournée » ou équivalent, `accessibilityLabel`, feedback chargement skeleton / désactivation).  
- [ ] Étendre `PlanningCard` (nouvelle prop optionnelle) pour **FR37** + badge adresse non géolocalisée.  
- [ ] Mesurer perf (console `__DEV__` ou assertion test perf soft) sous 15 nœuds.  
- [ ] Ne pas régler JWT dans AsyncStorage ; pas de données sensibles dans les logs.

## Notes de développement

### Story précédente (4.1)

Réutiliser toute la mécanique `usePlanning`, `PlanningCard`, `formatPlanningDateKey`, jointure `planning_entries` ↔ `patients`, seeds `__DEV__`. L’optimisation doit **respecter le schéma** existant dans `sqlite-ddl.ts` et `@kura/db` — alignement DDL déjà fait en **4.1**.

### Stratégie de déclenchement (à coder clairement)

- Minimum : bouton utilisateur qui relance NN+2-opt.  
- Option additionnelle : une seule optimisation automatique au **premier focus** Planning du jour si `order_index` identiques défaut ou flag local — éviter boucles si l’utilisateur corrige puis revient (**4.3** éviter conflits). Documenter le choix dans les notes de completion.

### Données

- `planning_entries.etaMinutes` : segment total (trajet + soin).  
- `updatedAt` / préservation `createdAt` selon conventions Drizzle existantes.

## Exigences techniques (garde-fous dév agent)

- **TypeScript strict**, alias `@/`, aucun calcul serveur pour l’ordre.  
- **Drizzle** `expo-sqlite` via `getDb()` ; **bulk update** préféré à N requêtes si dispo.  
- **ULID / generateId()** inchangés ; pas de duplication de schéma hors `packages/db` sauf évolution éprouvée dans ce même lot (préférer constantes par défaut).  
- Respect **multi-tenant** : filtre `structure_id` via patients déjà présent sur lignes reliées.

## Conformité architecture

- Arborescence cible : `features/planning/algorithm/tsp-optimizer.ts` et tests co-localisés [Source : `_bmad-output/planning-artifacts/architecture.md` §4.2 Structure Patterns].  
- Feature-based : pas de logique métier lourde dans `app/` — page **mince**.

## Bibliothèques / versions

- Aucune lib TSP npm obligatoire : implémenter NN+2-opt en pur TS pour maîtrise perf et transpile Hermes.  
- Vérifier `apps/mobile/package.json` pour **SDK Expo** réel (le `project-context.md` peut différer ; **référence matériel = package réel**).

## Fichiers / emplacements attendus

| Zone | Rôle |
|------|------|
| `apps/mobile/src/features/planning/algorithm/haversine.ts` | Distances géodésiques |
| `apps/mobile/src/features/planning/algorithm/tsp-optimizer.ts` | NN + 2-opt, types exportés |
| `apps/mobile/src/features/planning/algorithm/tsp-optimizer.test.ts` | Cas limites obligatoires |
| `apps/mobile/src/features/planning/hooks/` ou `services/` | Persistance après optimisation |
| `apps/mobile/src/features/planning/components/PlanningCard.tsx` | FR37 + badge non géolocalisé |
| `apps/mobile/src/app/(app)/planning/index.tsx` | CTA optimisation |

## Tests

- **Unitaires** : exhaustive sur `tsp-optimizer.test.ts` (obligation projet [Source : `_bmad-output/project-context.md` §Tests]).  
- **Pas** de DB SQLite réelle dans unit tests — mocks Drizzle si tests d’orchestration.  
- Pas de `console.log` bruyant.

## Intelligence story précédente (4.1)

- `PLANNING_DAY_START_MINUTES` et ETA cumulés déjà utilisés pour l’horloge — l’algo doit produire des `etaMinutes` **compatibles** avec `estimatedVisitClockMinutes`.  
- `SyncStatusIndicator` : si mise à jour planning, **`syncedAt: null`** sur lignes touchées jusqu’à sync.

## Intelligence Git (récent)

- Dernier commit pertinent : travaux « planning réel », graphiques ; ne pas casser `auth-store`, thème ni module patients.

## Veille technique (rappels)

- Hermes / RN : éviter fermetures lourdes dans boucles profondes 2-opt ; limiter nombre d’itérations 2-opt si besoin tout en gardant gain qualité perceptible.

## Référence contexte projet

- `_bmad-output/project-context.md` — algo **local uniquement**, pas de données patient dans les notifs, **tests algo planning obligatoires**.

---

## Questions ouvertes (hors fichier story blocker)

- Définir précisément le **point de départ** (domicile IDEL si coords profil hors scope MVP → préciser stub). À trancher en implémentation avec produit.

## Statut de fin de workflow

- **ready-for-dev** — analyse contextuelle « ultimate story » BMAD créée.  
- Note : « analyse exhaustive context engine — guide développeur couvrant garde-fous, chemins fichier et exclusions de périmètre ».

---

## Dev Agent Record

### Agent Model Used

_(à remplir par l’agent dev au moment de l’implémentation.)_

### Debug Log References

### Completion Notes List

### File List
