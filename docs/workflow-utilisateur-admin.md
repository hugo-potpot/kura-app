# Workflow Utilisateur — Administrateur de Structure
### Application KURA · Back Office Web · Vue client

---

## Présentation du rôle

L'administrateur est le gestionnaire de la structure de soins (cabinet infirmier, SSIAD, etc.). Il pilote son équipe d'IDEL depuis le back-office web accessible sur ordinateur ou tablette. Il ne réalise pas de visites lui-même — son rôle est d'organiser, superviser et préparer le travail de son équipe.

---

## Parcours complet

---

### 1. Connexion et tableau de bord

**Contexte :** L'admin se connecte le matin pour vérifier l'activité de son équipe.

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 1.1 | Ouvre le back-office sur son navigateur | Page de connexion sécurisée |
| 1.2 | Saisit email + mot de passe + code MFA | Authentification à deux facteurs |
| 1.3 | Accède au tableau de bord | Vue d'ensemble de la structure |

**Ce qu'il voit sur le tableau de bord :**

```
┌─────────────────────────────────────────────────┐
│  KURA — Back Office                              │
├──────────┬──────────────────────────────────────┤
│ Dashboard│  Tableau de bord                      │
│ Patients │                                       │
│ Infirmiers│  👥 4 IDEL actifs                    │
│ Structure │  🏥 47 patients suivis               │
│ Profil   │  📋 23 visites planifiées aujourd'hui  │
│ Paramètres│                                      │
└──────────┴──────────────────────────────────────┘
```

---

### 2. Gestion de l'équipe IDEL

**Contexte :** L'admin souhaite consulter ou modifier son équipe.

#### 2.1 Voir la liste des IDEL

| Colonne | Information |
|---|---|
| Nom | Prénom Nom |
| Statut | Actif / Invitation en attente |
| Patients assignés | Nombre de patients actuellement suivis |
| Dernière connexion | Date de la dernière ouverture de l'app |

#### 2.2 Inviter un nouvel IDEL

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 2.1 | Clique "Inviter un infirmier" | Formulaire email |
| 2.2 | Saisit l'email de l'IDEL | Envoi d'un lien d'invitation sécurisé |
| 2.3 | L'IDEL reçoit l'email et crée son compte | Compte créé et associé à la structure automatiquement |

#### 2.3 Désactiver un compte

En cas de départ d'un IDEL, l'admin peut désactiver son accès en un clic. L'IDEL ne peut plus se connecter mais ses données historiques sont conservées.

---

### 3. Gestion des patients

**Contexte :** L'admin crée les dossiers patients et les assigne aux IDEL.

#### 3.1 Créer un patient

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 3.1 | Clique "Nouveau patient" | Formulaire de création |
| 3.2 | Saisit les informations (nom, adresse, etc.) | Géolocalisation automatique de l'adresse (coordonnées GPS) |
| 3.3 | Valide | Dossier créé, patient disponible pour assignation |

> **Point clé client :** La géolocalisation est faite à la création pour que l'algorithme d'optimisation puisse calculer les trajets réels entre patients.

#### 3.2 Assigner un patient à un IDEL

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 3.1 | Ouvre la fiche patient | Vue détaillée |
| 3.2 | Sélectionne un IDEL dans la liste | Assignation enregistrée |
| 3.3 | — | Le patient apparaît dans le pool de l'IDEL pour le planning |

#### 3.3 Rechercher et filtrer

L'admin peut rechercher un patient par nom, filtrer par IDEL assigné, ou voir les patients archivés.

---

### 4. Planification hebdomadaire des tournées

**Contexte :** L'admin prépare le planning de la semaine pour un IDEL. C'est la fonctionnalité centrale du back-office.

#### 4.1 Accéder au planning d'un IDEL

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 4.1 | Va dans "Infirmiers" | Liste des IDEL avec leur statut |
| 4.2 | Clique sur le nom d'un IDEL | Page de détail avec vue planning |

#### 4.2 Interface de planification semaine

```
┌─────────────────────────────────────────────────────────────┐
│ Sophie MARTIN · IDEL · 8 patients assignés                   │
├─────────────────────────────────────────────────────────────┤
│  ← Semaine du 19 – 25 mai 2026                           →  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────────┤
│ Lun  │ Mar  │ Mer  │ Jeu  │ Ven  │ Sam  │ Dim              │
│  19  │  20  │  21  │  22  │  23  │  24  │  25              │
│  [3] │  [4] │  [3] │  [5] │  [3] │  [2] │                  │
│      │      │      │  ●   │      │      │                  │
├──────┴──────┴──────┴──────┴──────┴──────┴──────────────────┤
│  Jeudi 22 mai 2026                          [Enregistrer]   │
├─────────────────────────────────────────────────────────────┤
│  ① M. DUPONT        · En attente            ↑ ↓ ✕          │
│     12 rue Victor Hugo, Paris                               │
│  ② Mme MARTIN       · Terminé ✓            ↑ ↓ ✕          │
│     5 allée des Pins, Paris                                 │
│  ③ M. BERNARD       · Terminé ✓            ↑ ↓ ✕          │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  Patients non planifiés ce jour (3)                         │
│  Mme LEROY   · 8 rue du Moulin    [+ Ajouter]              │
│  M. PETIT    · 2 bd Haussmann     [+ Ajouter]              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3 Planifier un jour

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 4.1 | Clique sur un onglet jour (Lun / Mar / ...) | Charge le planning de ce jour |
| 4.2 | Voit les patients déjà planifiés | Liste ordonnée avec statut de chaque visite |
| 4.3 | Ajoute un patient depuis "non planifiés" | Clic "Ajouter" → patient ajouté en fin de liste |
| 4.4 | Réordonne avec les flèches ↑↓ | Ordre mis à jour localement |
| 4.5 | Retire un patient (✕) | Patient retiré du planning du jour |
| 4.6 | Clique "Enregistrer" | Planning sauvegardé + **notification push envoyée à l'IDEL** |

> **Flux synchronisation :** Dès l'enregistrement, l'application mobile de l'IDEL reçoit le planning mis à jour au prochain rechargement. Le statut de chaque visite est visible en temps réel (En attente, Terminé, Absent).

#### 4.4 Navigation entre semaines

- Flèches **←** / **→** pour passer à la semaine précédente / suivante
- Bouton **"Aujourd'hui"** pour revenir à la semaine courante
- Chaque onglet jour affiche un compteur `[N]` = nombre de visites planifiées

---

### 5. Suivi en temps réel

**Contexte :** En cours de journée, l'admin peut suivre l'avancement des tournées.

| Ce qu'il voit | Source d'information |
|---|---|
| Visite **"En attente"** (gris) | Soin pas encore démarré |
| Visite **"Terminé"** (vert ✓) | L'IDEL a swipé "Terminer" sur l'app mobile |
| Visite **"Absent"** (orange) | L'IDEL a marqué le patient absent |

> La synchronisation est **automatique** : dès que l'IDEL marque une action sur son mobile (et qu'il a du réseau), le back-office est mis à jour.

---

### 6. Gestion de la structure

**Contexte :** Configuration générale de la structure.

| Action | Description |
|---|---|
| Modifier les informations | Nom, adresse, SIRET, logo |
| Gérer les paramètres | Notifications, préférences de planning |
| Consulter les logs | Historique des connexions (audit sécurité) |

---

### 7. Cas d'usage avancés

#### 7.1 Modification d'un planning en urgence

Scénario : Un IDEL est malade à 7h du matin. L'admin prend en charge sa tournée.

| Étape | Action |
|---|---|
| 1 | Va sur le planning de l'IDEL absent |
| 2 | Pour chaque jour de la semaine concerné, retire les patients ou les réassigne |
| 3 | Va sur le planning de l'IDEL remplaçant |
| 4 | Ajoute les patients repris |
| 5 | Enregistre → les deux IDEL reçoivent une notification de mise à jour |

#### 7.2 Préparation d'un nouveau patient

Scénario : Un médecin prescrit des soins pour un nouveau patient.

| Étape | Action |
|---|---|
| 1 | Crée le dossier patient (nom, adresse géolocalisée) |
| 2 | Assigne le patient à l'IDEL le plus proche ou le moins chargé |
| 3 | Planifie les premières visites sur la semaine |
| 4 | L'IDEL voit le nouveau patient dans son planning à la prochaine synchronisation |

---

## Résumé des bénéfices Admin

| Gain | Détail |
|---|---|
| **Vision globale** | Toute l'équipe, tous les patients, en un seul écran |
| **Planification à l'avance** | Prépare la semaine entière en quelques minutes |
| **Réactivité** | Modifie un planning et l'IDEL est notifié instantanément |
| **Suivi temps réel** | Voit l'avancement des tournées sans appeler les IDEL |
| **Zéro doublon** | Un patient, un IDEL, un planning — pas de confusion |
| **Traçabilité** | Historique complet des modifications et connexions |
