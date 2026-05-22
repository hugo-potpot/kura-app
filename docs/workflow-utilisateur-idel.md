# Workflow Utilisateur — IDEL (Infirmier·e à Domicile)
### Application KURA · Vue client

---

## Présentation du rôle

L'IDEL est l'utilisateur principal de l'application mobile KURA. Sa journée commence tôt (souvent avant 7h) et enchaîne des visites à domicile chez ses patients. L'application l'accompagne du démarrage de la tournée jusqu'à la dernière visite.

---

## Parcours complet d'une journée type

---

### 1. Connexion au démarrage de la journée

**Contexte :** L'IDEL ouvre l'application le matin avant sa première visite.

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 1.1 | Ouvre l'app | Écran de connexion |
| 1.2 | S'authentifie par Face ID / Touch ID | Authentification biométrique locale (pas de réseau requis) |
| 1.3 | Accède au planning | Synchronisation automatique avec le serveur si réseau disponible |

**Résultat :** L'IDEL voit immédiatement sa liste de patients pour la journée, même sans connexion internet.

---

### 2. Découverte du planning du jour

**Contexte :** L'IDEL arrive sur l'écran principal de la tournée.

```
┌─────────────────────────────────────────┐
│  Bonjour, Marie 👋                       │
│  Vendredi 22 mai                         │
│                              ○ 2/5       │
│  ETA total ~2h30   ✓ Synced             │
├─────────────────────────────────────────┤
│  [Aujourd'hui]  Cette semaine           │
│  [Optimiser la tournée]                 │
├─────────────────────────────────────────┤
│  ① 08:00  M. DUPONT          Soins      │
│           12 rue Victor Hugo            │
│  ② 08:42  Mme MARTIN         Soins      │
│           5 allée des Pins              │
│  ③ 09:24  M. BERNARD         Soins  ✓  │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Ce qu'il voit :**
- Liste ordonnée des patients avec heure estimée d'arrivée (calculée automatiquement)
- Progression de la journée (anneau circulaire : visites terminées / total)
- Durée totale estimée de la tournée
- Carte interactive avec tous les patients géolocalisés

---

### 3. Optimisation de la tournée (IA)

**Contexte :** L'IDEL souhaite minimiser ses trajets avant de partir.

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 3.1 | Appuie sur **"Optimiser la tournée"** | Algorithme NN+2-opt calcule l'ordre optimal des visites |
| 3.2 | — | Recalcul des heures estimées pour chaque patient |
| 3.3 | Voit le nouvel ordre avec explications | Ex. : *"Après M. Dupont — trajet ~8 min • Créneau matin"* |

> **Note client :** L'IDEL reste maître de son planning. L'IA **suggère**, elle ne décide jamais. L'IDEL peut toujours réorganiser manuellement.

---

### 4. Navigation vers un patient

**Contexte :** L'IDEL est prêt·e à se déplacer vers le prochain patient.

**Option A — Bouton navigation rapide (prochain patient)**
- Appuie sur l'icône de navigation dans la barre carte
- L'app GPS native s'ouvre directement avec l'itinéraire

**Option B — Swipe sur la carte patient**
- Glisse vers la gauche sur la carte du patient
- Sélectionne **"Naviguer"**
- Plans (iOS) ou Google Maps (Android) s'ouvre

**Option C — Pin sur la carte**
- Sélectionne un patient sur la carte interactive
- La liste défile automatiquement jusqu'à sa carte

---

### 5. Réorganisation manuelle (drag & drop)

**Contexte :** L'IDEL veut changer l'ordre de sa tournée (ex. : urgence de proximité).

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 5.1 | Maintient appuyé une carte patient (0,3 s) | La carte se soulève visuellement |
| 5.2 | Fait glisser vers la nouvelle position | Les autres cartes se décalent |
| 5.3 | Relâche | Sauvegarde locale + recalcul des ETAs |
| 5.4 | Voit la snackbar "Modification enregistrée — Annuler" | Peut annuler sous 5 secondes |

---

### 6. Terminer une visite

**Contexte :** L'IDEL termine une visite chez un patient.

```
  ┌──────────────────────────────────────────┐
  │ ✓ Terminer  │  M. DUPONT  │  08:00       │
  └──────────────────────────────────────────┘
       ↑ Swipe vers la droite (→)
```

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 6.1 | Glisse la carte vers la droite | Bouton vert **"Terminer"** apparaît |
| 6.2 | Appuie sur "Terminer" | Statut passe à **"Terminé"** (vert) |
| 6.3 | — | Heures recalculées pour les patients restants |
| 6.4 | Snackbar "Soin terminé ✓ — Annuler" | Peut annuler sous 5 secondes |
| 6.5 | — | Synchronisation du statut vers le serveur (visible dans le back-office) |

> Le compteur de progression en haut de l'écran se met à jour en temps réel.

---

### 7. Marquer un patient absent

**Contexte :** Le patient n'ouvre pas la porte ou a annulé.

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 7.1 | Glisse la carte vers la gauche | Actions "Absent / Déplacer / Naviguer" apparaissent |
| 7.2 | Appuie sur **"Absent"** | Dialogue de confirmation |
| 7.3 | Confirme | Statut passe à **"Absent"** (orange), patient retiré du calcul de trajet |
| 7.4 | — | ETAs recalculés, planning condensé |
| 7.5 | Peut annuler sous 5 secondes | Restauration du statut précédent si besoin |

---

### 8. Gestion d'une urgence

**Contexte :** Un patient appelle et nécessite une visite non planifiée.

| Étape | Action utilisateur | Ce que fait l'application |
|---|---|---|
| 8.1 | Appuie sur le **bouton "+" (FAB)** en bas à droite | Menu contextuel |
| 8.2 | Sélectionne **"Ajouter une urgence"** | Bottom sheet avec la liste des patients assignés |
| 8.3 | Sélectionne le patient | L'app suggère la meilleure position d'insertion dans la tournée |
| 8.4 | Confirme | Patient inséré à la position optimale, ETAs recalculés |

---

### 9. Vue carte interactive

**Contexte :** L'IDEL veut visualiser géographiquement sa journée.

- Carte dépliable en haut de l'écran avec tous les patients géolocalisés
- Chaque pin est coloré selon le statut (en attente, terminé, absent)
- Appuyer sur un pin fait défiler la liste jusqu'au patient correspondant

---

### 10. Fin de journée

À la fin de la tournée, l'anneau de progression indique **100%**. Tous les soins sont synchronisés avec le serveur, et le back-office reflète l'état complet de la journée.

---

## Résumé des bénéfices IDEL

| Gain | Détail |
|---|---|
| **30-45 min/jour économisées** | Plus de calcul manuel des trajets |
| **Zéro papier** | Planning, navigation, transmissions dans un seul outil |
| **100% offline** | Fonctionne sans réseau (zones blanches, sous-sols) |
| **Flexibilité totale** | L'IA optimise, l'IDEL décide toujours en dernier |
| **Réactivité** | Urgences intégrées en 3 appuis |
