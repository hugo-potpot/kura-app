# Story 8.2 : Gestion de la Liste des Patients (Back Office)

Status: review

## Story

En tant qu'admin,
Je veux visualiser la liste complète de tous mes patients avec leurs IDEL assignés et modifier les attributions,
Afin d'avoir une vue centralisée et réorganiser les tournées sans appeler chaque IDEL.

## Critères d'acceptation

1. **Liste patients complète**
   **Given** la page Patients du Back Office
   **When** elle se charge
   **Then** tous les patients de ma structure s'affichent dans un tableau avec : nom, adresse, IDEL assigné, statut (actif/archivé), date dernière transmission

2. **Recherche en temps réel**
   **Given** la barre de recherche dans le tableau
   **When** je saisis au moins 2 caractères
   **Then** les résultats sont filtrés en temps réel par nom, adresse ou médecin traitant

3. **Réassignation IDEL**
   **Given** un patient sélectionné dans le tableau
   **When** je clique "Réassigner" et choisis un autre IDEL de ma structure (FR74)
   **Then** la réassignation est effective immédiatement, l'ancien IDEL perd l'accès, le nouveau reçoit une notification push

4. **Dossier patient**
   **Given** un clic sur le nom d'un patient
   **When** sa fiche s'ouvre
   **Then** son historique de transmissions et ses constantes sont visibles en lecture complète admin

## Tâches / sous-tâches

- [x] Modifier `GET /api/v1/patients` pour enrichir la réponse avec `lastTransmissionAt` (max createdAt depuis transmissions) et `assignedIdelName` (nom IDEL depuis authUser)
- [x] Mettre à jour le test `route.test.ts` pour vérifier les nouveaux champs (TDD)
- [x] Ajouter la colonne "Adresse" dans le tableau patients de la page
- [x] Mettre à jour la colonne "IDEL assigné" pour afficher le nom de l'IDEL au lieu de "Assigné"/"Non assigné"
- [x] Ajouter la colonne "Dernière transmission" dans le tableau patients
- [x] Changer le seuil de déclenchement de la recherche de 1 à **2 caractères** minimum

## Notes de développement

- L'API GET `/api/v1/patients` retourne actuellement : id, firstName, lastName, address, status, assignedIdelId, updatedAt, etc.
- Ajout de `lastTransmissionAt` : requête séparée sur `transmissionsPg` avec `max(createdAt)` groupé par `patientId`, ou fetch + map côté handler (pattern existant dans dashboard)
- Ajout de `assignedIdelName` : fetch des `authUser` pour les idelIds distincts, puis map
- Les tests unitaires mockent `db.select` — le mock doit gérer plusieurs appels séquentiels (patients, puis transmissions, puis idel names)
- La recherche côté frontend filtre à partir de 1 char actuellement ; passer à `search.trim().length < 2` pour neutraliser sous 2 chars
- L'interface `Patient` dans la page client doit être étendue avec `lastTransmissionAt: string | null` et `assignedIdelName: string | null`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- API enrichie avec lastTransmissionAt et assignedIdelName (requêtes séparées après fetch patients)
- Tableau patients : ajout colonnes Adresse et Dernière transmission, IDEL affiche le nom
- Recherche : seuil passé de 1 à 2 caractères

### File List

- `apps/web/src/app/api/v1/patients/route.ts` (modifié)
- `apps/web/src/app/api/v1/patients/route.test.ts` (modifié)
- `apps/web/src/app/(admin)/patients/page.tsx` (modifié)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-21 : Implémentation story 8.2 (dev-story) ; statut → review