# Story 4.7 : Terminer un soin — Application Mobile

Status: review

## Story

En tant qu'IDEL,
Je veux marquer un soin comme terminé directement depuis la liste de ma tournée,
Afin de suivre ma progression en temps réel et recalculer les ETAs des visites restantes.

## Critères d'acceptation

1. **Swipe gauche → Terminer**
   **Given** une visite en statut `pending` ou `in_progress`
   **When** l'IDEL swipe vers la droite (gauche → droite) sur la carte
   **Then** un bouton vert "Terminer" apparaît sur la gauche de la carte

2. **Marquage done + recalcul ETAs**
   **Given** l'IDEL appuie sur "Terminer"
   **When** l'action est confirmée
   **Then** le statut passe à `done` en SQLite local
   **And** les ETAs des visites restantes sont recalculés
   **And** le compteur de progression (ring) se met à jour

3. **Annulation (5 s)**
   **Given** le soin vient d'être terminé
   **When** la snackbar "Soin terminé — Annuler" est visible (5 s)
   **Then** appuyer sur "Annuler" restaure le statut précédent

4. **Pas disponible sur done/skipped**
   **Given** une visite déjà `done` ou `skipped`
   **When** la carte est affichée
   **Then** le swipe "Terminer" n'est pas proposé

## Tâches / sous-tâches

- [x] Créer `useCompleteVisit` hook (analog de `useAbsentPatient`)
- [x] Ajouter `renderLeftActions` dans `PlanningCard` avec bouton vert "Terminer"
- [x] Ajouter prop `onSwipeComplete` à `PlanningCardProps`
- [x] Câbler `useCompleteVisit` dans `planning/index.tsx`
- [x] Tests Jest pour `useCompleteVisit`

## Notes de développement

- Seuls `pending` et `in_progress` peuvent passer à `done` via ce swipe
- `done` et `skipped` : `swipeLeftEnabled = false`
- Recalcul ETA après marquage (via `applyPlanningDayEtaRecalculation`)
- Haptic `medium` au marquage, `light` à l'annulation
- Snackbar undo window : 5000 ms (même constante que absent)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- Hook `useCompleteVisit` : markDone (pending/in_progress → done), undo 5 s, haptic, ETA recalc
- `PlanningCard` : swipe droite (gauche→droite) → bouton vert "Terminer" via `renderLeftActions` ; uniquement si status pending/in_progress
- Snackbar "Soin terminé ✓" + "Annuler" câblée dans planning/index.tsx
- 3 tests Jest passent

### File List

- `apps/mobile/src/features/planning/hooks/useCompleteVisit.ts` (créé)
- `apps/mobile/src/features/planning/hooks/useCompleteVisit.test.ts` (créé)
- `apps/mobile/src/features/planning/components/PlanningCard.tsx` (modifié)
- `apps/mobile/src/app/(app)/planning/index.tsx` (modifié)
- `_bmad-output/implementation-artifacts/4-7-terminer-un-soin.md` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-22 : Implémentation story 4.7 — terminer un soin mobile ; statut → review
