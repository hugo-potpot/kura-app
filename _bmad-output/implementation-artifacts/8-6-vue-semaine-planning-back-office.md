# Story 8.6 : Vue Semaine du Planning — Back Office

Status: review

## Story

En tant qu'admin,
Je veux visualiser et configurer le planning d'un IDEL sur toute la semaine (navigation par semaine, onglets jours),
Afin de préparer plusieurs jours à l'avance et avoir une vision globale de la tournée.

## Critères d'acceptation

1. **Navigation semaine**
   **Given** la page `/idels/[id]`
   **When** elle s'affiche
   **Then** une barre de navigation permet de passer à la semaine précédente / suivante
   **And** la semaine courante est sélectionnée par défaut

2. **Onglets jours**
   **Given** la semaine sélectionnée
   **When** l'admin voit les onglets
   **Then** 7 onglets Lun–Dim sont affichés avec la date et le nombre de visites planifiées
   **And** le jour courant est sélectionné par défaut (ou lundi si hors de la semaine courante)

3. **Planning par jour paramétrable**
   **Given** un onglet jour sélectionné
   **When** l'admin ajoute/retire/réordonne des patients
   **Then** les modifications sont indépendantes par jour (chaque jour a son propre planning)
   **And** enregistrer sauvegarde uniquement le jour sélectionné

4. **API date flexible**
   **Given** l'endpoint `GET /api/v1/admin/idels/[idelId]/planning`
   **When** un query param `?date=YYYY-MM-DD` est fourni
   **Then** le planning de ce jour précis est retourné (au lieu de hardcoder "today")

5. **Détails enrichis**
   **Given** un patient dans le planning
   **When** il est affiché
   **Then** son adresse complète et le statut de la visite (pending/in_progress/done/skipped) sont visibles

## Tâches / sous-tâches

- [x] Modifier `GET /api/v1/admin/idels/[idelId]/planning` pour accepter `?date=YYYY-MM-DD` (fallback = today)
- [x] Mettre à jour la page `/idels/[id]` : navigation semaine + onglets jours avec compteur
- [x] Charger le planning du jour sélectionné à chaque changement d'onglet
- [x] Afficher le statut de visite (badge couleur) dans la liste du planning
- [x] Tests unitaires : GET avec `?date` param

## Notes de développement

- L'API PUT supporte déjà n'importe quelle date via le body — pas de modification nécessaire
- Semaine : lundi → dimanche (ISO week)
- Compteur d'onglet = nombre d'entrées planningEntriesPg pour ce jour
- Statut badge : pending = gris, in_progress = bleu, done = vert, skipped = orange
- Garder compatibilité ascendante GET (pas de date = today)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- GET accepte désormais `?date=YYYY-MM-DD` ; sans param = today (rétrocompatible)
- Page `/idels/[id]` refondée : navigation semaine ← →, onglets Lun–Dim avec compteur de visites, chargement parallèle des compteurs
- Badge statut coloré (pending/in_progress/done/skipped) dans la liste du planning
- Chaque jour est éditable indépendamment (enregistrer = sauvegarder uniquement le jour sélectionné)
- 7 tests Vitest passent (dont nouveau test ?date=)

### File List

- `apps/web/src/app/api/v1/admin/idels/[idelId]/planning/route.ts` (modifié)
- `apps/web/src/app/api/v1/admin/idels/[idelId]/planning/route.test.ts` (modifié)
- `apps/web/src/app/(admin)/idels/[id]/page.tsx` (refondé)
- `_bmad-output/implementation-artifacts/8-6-vue-semaine-planning-back-office.md` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-22 : Implémentation story 8.6 — vue semaine planning back-office ; statut → review
