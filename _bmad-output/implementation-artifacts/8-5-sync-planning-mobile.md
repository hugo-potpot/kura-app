# Story 8.5 : Réception du planning admin sur l'app mobile

Status: review

## Story

En tant qu'IDEL,
Je veux que l'app mobile récupère automatiquement le planning modifié par l'admin depuis le Back Office,
Afin de voir ma tournée du jour à jour dès l'ouverture de l'écran planning.

## Critères d'acceptation

1. **Endpoint mobile planning**
   **Given** un IDEL authentifié
   **When** il ouvre l'écran planning
   **Then** l'app contacte `GET /api/v1/planning?date=YYYY-MM-DD` et reçoit ses entrées de planning avec les infos patients

2. **Sync offline-first**
   **Given** l'app est hors ligne
   **When** la synchronisation échoue
   **Then** l'app affiche les données locales existantes sans erreur

3. **Préservation des visites en cours**
   **Given** une visite est déjà `in_progress` / `done` / `skipped` localement
   **When** le serveur envoie une mise à jour du planning
   **Then** le statut local est préservé (seul `syncedAt` est mis à jour)

4. **Retrait admin respecté**
   **Given** un patient `pending` localement a été retiré du planning par l'admin
   **When** la sync se déclenche
   **Then** l'entrée locale est supprimée

## Tâches / sous-tâches

- [x] Créer `GET /api/v1/planning` (web) — retourne le planning du jour de l'IDEL authentifié avec infos patients
- [x] Tests unitaires API `route.test.ts` (5 tests)
- [x] Créer `syncPlanningFromServer.ts` (mobile) — sync réseau → SQLite avec logique offline-first
- [x] Tests unitaires service `syncPlanningFromServer.test.ts` (4 tests)
- [x] Intégrer le sync dans `usePlanning.ts` avant la lecture SQLite

## Notes de développement

- Endpoint non-admin : accessible par tout utilisateur authentifié (IDEL, doctor)
- Stratégie de merge :
  - Entrée absente localement → INSERT avec status `pending`
  - Entrée locale `pending` → UPDATE orderIndex + etaMinutes
  - Entrée locale non-pending (in_progress/done/skipped) → UPDATE syncedAt uniquement (préserver statut)
  - Entrée locale `pending` absente du serveur → DELETE
- Erreur réseau silencieuse → offline-first : la lecture SQLite locale suit normalement

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- GET /api/v1/planning retourne { date, entries[] } avec infos patient embarquées (JOIN)
- syncPlanningFromServer : transaction atomique delete/insert/update
- usePlanning : sync lancé avant fetchPlanningVisitsForDate, erreur réseau = no-op

### File List

- `apps/web/src/app/api/v1/planning/route.ts` (créé)
- `apps/web/src/app/api/v1/planning/route.test.ts` (créé)
- `apps/mobile/src/features/planning/services/syncPlanningFromServer.ts` (créé)
- `apps/mobile/src/features/planning/services/syncPlanningFromServer.test.ts` (créé)
- `apps/mobile/src/features/planning/hooks/usePlanning.ts` (modifié)

### Change Log

- 2026-05-21 : Implémentation story 8.5 (dev-story) ; statut → review
