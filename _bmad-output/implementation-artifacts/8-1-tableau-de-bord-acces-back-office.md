# Story 8.1 : Tableau de Bord & Accès Back Office

Status: review

## Story

En tant qu'admin,
Je veux accéder à un tableau de bord centralisé depuis mon navigateur desktop avec les statistiques d'utilisation de ma structure,
Afin d'avoir une vision globale de l'activité de mon équipe en un coup d'œil.

## Critères d'acceptation

1. **Navigation et accès**
   **Given** l'URL du Back Office ouverte dans Chrome/Firefox/Safari (≥ 1024px)
   **When** je me connecte avec mon compte admin
   **Then** le tableau de bord s'affiche avec la navigation drawer latérale : Tableau de bord · Patients · IDELs · Paramètres

2. **Statistiques du tableau de bord**
   **Given** le tableau de bord (FR73)
   **When** il se charge
   **Then** les statistiques visibles sont : nombre total patients actifs, IDELs actifs, transmissions saisies cette semaine, patients sans IDEL assigné

3. **Comportement responsive**
   **Given** un écran < 1024px de largeur
   **When** j'accède au Back Office
   **Then** le drawer se replie en mode hamburger et le contenu s'adapte
   **And** un message "Pour une expérience optimale, utilisez un écran desktop" s'affiche discrètement

## Tâches / sous-tâches

- [x] Mettre à jour `getDashboardStats` pour compter les transmissions **cette semaine** (lundi 00h00 → maintenant) au lieu du mois courant
- [x] Ajouter le compteur "patients sans IDEL assigné" dans `getDashboardStats` (patients actifs avec `assignedIdelId IS NULL`)
- [x] Mettre à jour les `StatCard` du dashboard pour afficher les 4 nouvelles métriques
- [x] Extraire la sidebar en composant client `AdminSidebarClient` pour gérer l'état d'ouverture/fermeture
- [x] Ajouter la logique hamburger : bouton visible < 1024px, overlay pour fermer, sidebar slide-in
- [x] Afficher le bandeau "Pour une expérience optimale, utilisez un écran desktop" sur mobile

## Notes de développement

- Stack : Next.js 15, Tailwind CSS, shadcn/ui, Drizzle ORM (PostgreSQL)
- La sidebar actuelle est un serveur component dans `apps/web/src/app/(admin)/layout.tsx`
- Les données de session sont récupérées côté serveur et passées au composant client
- La semaine commence le **lundi** (convention française)
- `isNull` de drizzle-orm pour la condition `assignedIdelId IS NULL`
- Le layout doit rester un Server Component qui passe `user` et `navItems` au client sidebar

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- Transmissions "cette semaine" calculées depuis le lundi 00h00 de la semaine courante
- Sidebar extraite en composant client avec gestion hamburger/overlay pour < 1024px
- 4 StatCards : IDELs actifs, Patients actifs, Transmissions cette semaine, Sans IDEL assigné

### File List

- `apps/web/src/app/(admin)/layout.tsx` (modifié)
- `apps/web/src/components/layout/AdminSidebarClient.tsx` (créé)
- `apps/web/src/app/(admin)/dashboard/page.tsx` (modifié)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-21 : Implémentation story 8.1 (dev-story) ; statut → review