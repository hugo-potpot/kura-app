# Story 8.4 : Vue des IDEL & Modification des Plannings

Status: review

## Story

En tant qu'admin,
Je veux visualiser tous mes IDEL collaborateurs avec leurs patients assignés et modifier leurs plannings depuis le Back Office,
Afin de piloter mon équipe et réorganiser les tournées sans appeler chaque IDEL.

## Critères d'acceptation

1. **Liste IDELs enrichie**
   **Given** la page IDELs du Back Office (FR70)
   **When** elle se charge
   **Then** chaque IDEL est listé avec : nom, statut (actif/invitation en attente), nombre de patients assignés, date dernière connexion

2. **Détail IDEL — patients + planning**
   **Given** un IDEL sélectionné
   **When** je clique sur son nom
   **Then** sa liste de patients assignés s'affiche avec son planning du jour en cours

3. **Modification du planning**
   **Given** la vue planning d'un IDEL dans le Back Office (FR75)
   **When** j'ajoute, retire ou réorganise des patients dans son planning et enregistre
   **Then** les modifications sont synchronisées vers l'appareil mobile de l'IDEL (via PostgreSQL → sync mobile)
   **And** l'IDEL reçoit une notification push "Votre planning a été modifié par votre admin" (stub FCM)

## Tâches / sous-tâches

- [x] Créer `GET /api/v1/admin/idels/[idelId]/planning` — retourne patients assignés + planning du jour de l'IDEL
- [x] Créer `PUT /api/v1/admin/idels/[idelId]/planning` — sauvegarde l'ordre du planning (upsert planningEntriesPg)
- [x] Tests unitaires pour les deux endpoints (TDD)
- [x] Mettre à jour `GET /api/v1/admin/members` pour inclure `patientCount` et `lastLoginAt` (max session.createdAt)
- [x] Mettre à jour la page `/idels` : colonnes patients assignés + dernière connexion + nom cliquable → `/idels/[id]`
- [x] Créer la page `/idels/[id]` : infos IDEL, liste patients, planning du jour avec boutons ↑↓ + ajout/retrait + bouton enregistrer

## Notes de développement

- Schéma : `planningEntriesPg` (patientId, idelId, date TEXT "YYYY-MM-DD", orderIndex, status)
- `lastLoginAt` : max(authSession.createdAt) groupé par userId
- `patientCount` : count(patientsPg) where assignedIdelId = idelId AND status = 'active'
- Pas de DnD lib installée → réordonnancement par boutons ↑↓
- FCM notification : stub console.log dans l'API (à brancher sur Firebase plus tard)
- La modification du planning est "synchronisée" via PostgreSQL — le mobile sync (story 6.x) la récupèrera

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- GET /api/v1/admin/idels/[idelId]/planning retourne patients assignés + entrées planning du jour fusionnées
- PUT sauvegarde via upsert (delete + insert) planningEntriesPg pour la date du jour
- Page /idels/[id] : header IDEL, liste patients assignés hors planning, planning du jour réordonnançable ↑↓

### File List

- `apps/web/src/app/api/v1/admin/idels/[idelId]/planning/route.ts` (créé)
- `apps/web/src/app/api/v1/admin/idels/[idelId]/planning/route.test.ts` (créé)
- `apps/web/src/app/api/v1/admin/members/route.ts` (modifié)
- `apps/web/src/app/(admin)/idels/page.tsx` (modifié)
- `apps/web/src/app/(admin)/idels/[id]/page.tsx` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-21 : Implémentation story 8.4 (dev-story) ; statut → review
