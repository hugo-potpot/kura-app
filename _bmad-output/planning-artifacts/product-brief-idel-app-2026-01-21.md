---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - type: user-personas
    source: user-provided
    content: "3 personas (Marie 80%, Sophie 15%, Michel 5%)"
  - type: t-shirt-sizing
    source: user-provided
    content: "Project estimation - 152j / 63,800EUR"
  - type: technical-overview
    source: user-provided
    content: "Stack, architecture HDS, roadmap"
  - type: survey-data
    source: user-provided
    content: "KURA survey - 12 IDEL respondents"
date: 2026-01-21
author: Potpot
project: idel-app
---

# Product Brief: idel-app

## Executive Summary

**KURA (idel-app)** est une application mobile moderne conçue pour les infirmiers libéraux (IDEL) qui transforme la gestion quotidienne des tournées et du suivi patient.

**Le constat :** Les 120 000+ IDEL en France perdent en moyenne 30-60 minutes par jour en organisation manuelle de tournées, avec des outils fragmentés (Vega, Ozzen, Agenda...) inadaptés au terrain — notamment dans les zones à faible couverture réseau où 66% des professionnels rencontrent des difficultés régulières.

**La solution :** Une application offline-first avec planning intelligent qui s'auto-adapte aux dossiers patients, localisations et préférences, permettant de gagner minimum 30 minutes par jour. Les transmissions se saisissent en 2-3 minutes grâce à l'IA vocale, l'écrit simplifié ou les templates prédéfinis.

**Le marché :** 75% des IDEL interrogés sont ouverts à tester une optimisation intelligente, et 58% sont prêts à payer 20-50€/mois pour une solution qui leur fait gagner du temps.

**L'équipe :** Porté par un développeur dont la mère et la sœur sont IDEL, avec une connaissance intime du métier et des données terrain réelles (sondage auprès de 12 IDEL).

---

## Core Vision

### Problem Statement

Les infirmiers libéraux font face à une **surcharge administrative chronique** qui empiète sur leur temps de soin et leur vie personnelle :

- **Organisation manuelle des tournées** : charge mentale quotidienne constante pour 50% des IDEL
- **Outils fragmentés et datés** : jonglage entre Vega, Ozzen, agendas papier, Excel...
- **Absence de mode offline fiable** : 66% rencontrent régulièrement des problèmes de connectivité terrain
- **Transmissions chronophages** : saisies le soir à domicile, empiétant sur la vie personnelle
- **Aucun planning intelligent** : pas d'outil qui combine dossiers patients, localisation et préférences

### Problem Impact

**Pour Marie (persona principale, 80% des utilisateurs) :**
> *"Je perds du temps, j'arrive en retard chez moi"*

- 1h perdue quotidiennement dans les trajets non optimisés
- 45 minutes de transmissions le soir
- Stress constant de la replanification en cours de journée
- Qualité de vie dégradée, risque d'épuisement professionnel

**À l'échelle nationale :**
- 120 000+ IDEL impactés
- Des millions d'heures perdues annuellement
- Impact indirect sur la qualité des soins aux patients

### Why Existing Solutions Fall Short

| Solution actuelle | Limitation |
|-------------------|------------|
| **Vega, Ozzen** | Interfaces datées, pas de planning intelligent, offline limité |
| **Agendas (papier/numérique)** | Aucune optimisation, ressaisie manuelle |
| **GPS classiques** | Ne comprennent pas les contraintes métier (horaires patients, durée soins) |
| **Logiciels de facturation** | Focus comptabilité, pas tournée ni transmissions |

**Le gap critique :** Aucune solution ne combine :
1. Mode **offline-first** fiable
2. **Planning intelligent** adapté aux contraintes IDEL
3. Interface **mobile moderne** et rapide
4. **Transmissions simplifiées** (vocale/templates)

### Proposed Solution

**KURA** est une Progressive Web App (PWA) + Back Office qui révolutionne le quotidien des IDEL :

**🗺️ Planning Intelligent Auto-Adaptatif**
- Génération automatique basée sur les dossiers patients, localisations et préférences
- Recalcul instantané si patient absent ou urgence
- Algorithme d'optimisation type "voyageur de commerce" adapté aux contraintes métier
- *L'algorithme suggère un ordre optimisé, mais l'IDEL garde 100% le contrôle — modification en un glissement de doigt*

**📱 Offline-First par Design**
- Fonctionne parfaitement sans 4G/5G
- Base SQLite locale synchronisée avec PostgreSQL serveur
- JWT local pour authentification hors-ligne

**📝 Transmissions en 2-3 Minutes**
- 🎤 IA vocale : dicte, l'app transcrit et structure (validation humaine obligatoire avant enregistrement)
- ✍️ Saisie écrite simplifiée
- 📋 Templates prédéfinis par type de soin

**📊 Suivi Patient Intelligent**
- Historique et évolution des constantes
- Stats de suivi en un coup d'œil
- Données sécurisées (HDS compliant, chiffrement AES-256)

**💻 Double Plateforme**
- App mobile pour le terrain
- Back Office web pour la gestion au cabinet

### Key Differentiators

| Différenciateur | Avantage compétitif |
|-----------------|---------------------|
| **Offline-first natif** | Seule solution fiable en zone blanche — 66% des IDEL concernés |
| **Planning IA contextuel** | Unique : combine dossiers, localisation, préférences, contraintes horaires |
| **Transmissions vocales IA** | Demande explicite du terrain, aucun concurrent ne propose |
| **Connaissance terrain intime** | Fondateur avec mère et sœur IDEL + données sondage réelles |
| **App + Back Office** | Adapté au double usage terrain/cabinet, contrairement aux apps mobiles seules |
| **Conformité HDS native** | Sécurité données de santé intégrée dès la conception |

**Timing parfait :** Aucun acteur n'a encore combiné ces éléments. Les outils existants sont empiriques et datés — le marché est prêt pour une solution moderne.

### Barrières à l'entrée

- **Données terrain propriétaires** : Insights issus de recherche utilisateur réelle (sondage 12 IDEL)
- **Algorithme modulable** : L'utilisateur garde le contrôle total — l'IA suggère, l'humain décide
- **Partenariat HDS** : Hébergement certifié dès le lancement (pas de dette technique sécurité)
- **Validation humaine** : Toute transcription IA est validée avant enregistrement

### Risques identifiés et mitigations

| Risque | Mitigation |
|--------|------------|
| Résistance au changement | Mode hybride suggestion/manuel, onboarding progressif |
| Erreurs IA vocale | Validation obligatoire avant enregistrement, logs d'audit |
| Adoption lente +45 ans | Interface ultra-simple, tutoriels intégrés, support dédié |

---

## Target Users

### Primary Users

#### 👤 Marie Dubois — L'Expérimentée (80% des utilisateurs)

**Profil :** 42 ans • 8 ans d'exercice • 45 patients • Zone périurbaine

**Contexte quotidien :**
- 8-12 patients/jour, 1h perdue dans les trajets
- 45 min de transmissions le soir à domicile
- Jongle entre Vega, agenda papier et GPS

**Pain point :** *"Je perds du temps, j'arrive en retard chez moi"*

**Besoin principal :** Optimiser les tournées, saisir vite les transmissions

**Tech profile :** iPhone, modérément à l'aise, adopte si ça fait gagner du temps

**Moment "Waouh" :** Quand elle voit concrètement le temps gagné sur le suivi et la planification

---

#### 👩‍💼 Sophie Chen — La Débutante Digital Native (15% des utilisateurs)

**Profil :** 29 ans • 6 mois d'exercice • 15 patients • Budget serré

**Contexte quotidien :**
- Patients dispersés géographiquement
- Cherche à optimiser sa rentabilité
- Veut tout tester, early adopter

**Pain point :** *"Mes patients sont dispersés, je fais que de la route"*

**Besoin principal :** Conseils d'optimisation, templates, gestion rentabilité

**Ce qui la rassure :** Conformité HDS, MFA, sécurité maximale — personne ne peut se connecter sans son consentement

**Ce qui la fait recommander :** Le temps gagné et la simplicité d'utilisation

---

#### 👨‍⚕️ Michel Lefebvre — Le Fin de Carrière (5% des utilisateurs)

**Profil :** 58 ans • 25 ans d'exercice • Zone rurale • Méthodes papier

**Contexte quotidien :**
- Habitudes ancrées depuis 25 ans
- Réticent au changement technologique
- Priorise la relation patient sur l'administratif

**Pain point :** *"Si c'est compliqué, je n'y arriverai jamais"*

**Besoin principal :** Interface ultra-simple, formation accompagnée

**Condition d'adoption :** Accepte uniquement si amélioration évidente des soins

**Risque d'abandon :** Interface complexe ou non intuitive → **Solution : UX hyper ergonomique et user-friendly**

---

### Secondary Users

#### 🏢 Admin de Structure

**Rôle :** Gestionnaire du cabinet ou de la structure IDEL

**Accès :** Vision globale de tous les patients et tous les IDEL de la structure

**Responsabilités :**
- Paramétrage initial de l'application
- Gestion des utilisateurs et des rôles
- Attribution des patients aux IDEL
- Supervision et reporting

**Parcours :** Doit tout configurer à la première connexion — onboarding guidé essentiel

---

#### 👨‍⚕️ Médecin Prescripteur

**Rôle :** Suivi à distance de l'évolution des patients

**Accès :** Lecture seule sur les données de suivi (constantes, évolution) — uniquement ses patients

**Besoin :** Consultation rapide sans surcharge d'information

**Sécurité :** Accès strictement limité à ce qu'il doit voir (isolation HDS)

---

### User Journey

#### Parcours de Marie (utilisatrice type)

| Étape | Expérience | Émotion |
|-------|------------|---------|
| **Découverte** | Bouche-à-oreille, recommandation d'une collègue | Curiosité, scepticisme |
| **Inscription** | Invitation par son admin de structure | Rassurée (pas de config) |
| **Premier jour** | Tout est déjà paramétré, patients assignés | Surprise positive |
| **Première semaine** | Planning auto-généré, transmissions rapides | Intérêt croissant |
| **Moment "Waouh"** | Constate le temps gagné sur le suivi | Conviction |
| **Adoption** | Intègre KURA dans sa routine quotidienne | Fidélité |
| **Ambassadrice** | Recommande à ses collègues | Enthousiasme |

#### Système de rôles et isolation des données

```
┌─────────────────────────────────────────────────────┐
│                    STRUCTURE                         │
├─────────────────────────────────────────────────────┤
│  👑 ADMIN                                            │
│  └── Voit TOUT (patients, IDEL, stats, config)      │
│                                                      │
│  👤 IDEL Collaborateur                               │
│  └── Voit UNIQUEMENT ses patients assignés          │
│                                                      │
│  👨‍⚕️ Médecin Prescripteur (externe)                  │
│  └── Lecture seule : suivi de SES patients          │
└─────────────────────────────────────────────────────┘
```

**Principe de sécurité :** Chaque utilisateur accède uniquement à ce qu'il doit voir — conformité HDS stricte.

---

## Success Metrics

### Métriques de Succès Utilisateur

#### Indicateurs de valeur perçue

| Indicateur | Objectif | Méthode de mesure |
|------------|----------|-------------------|
| **Temps gagné ressenti** | Marie gagne 30+ min/jour | Feedback qualitatif post-test |
| **Qualité du suivi patient** | Historique complet et accessible | Interview : "As-tu un meilleur suivi ?" |
| **Simplicité perçue** | Michel peut utiliser sans aide | Observation : autonomie après onboarding |
| **Fiabilité offline** | Fonctionne en zone blanche | Test terrain réel (zones rurales) |

#### Moments clés de validation

- **"Waouh" moment :** L'utilisateur constate visuellement le temps gagné
- **Adoption :** L'utilisateur préfère KURA à son ancien système
- **Recommandation :** L'utilisateur en parle spontanément à ses collègues

---

### Objectifs Projet (Soutenance)

#### Critères de succès du prototype

| Objectif | Critère de validation |
|----------|----------------------|
| **Prototype complet** | Toutes les fonctionnalités décrites sont implémentées |
| **Fonctionnel** | Le parcours utilisateur complet est testable |
| **Offline-first** | L'app fonctionne sans connexion |
| **Sécurisé** | Auth MFA + chiffrement en place |
| **Testable** | 4 testeurs peuvent l'utiliser (vous, associé, mère, sœur) |

#### Livrables soutenance

- [ ] Application mobile fonctionnelle (React Native/Expo)
- [ ] Back Office web opérationnel
- [ ] Mode offline avec synchronisation
- [ ] Authentification MFA conforme HDS
- [ ] Documentation technique

---

### Key Performance Indicators (V1 Prototype)

| KPI | Target | Méthode |
|-----|--------|---------|
| **Couverture fonctionnelle** | 100% des features décrites | Checklist |
| **Testeurs actifs** | 4/4 ont testé le parcours complet | Confirmation |
| **Bugs bloquants** | 0 en démo soutenance | Tests pré-soutenance |
| **Feedback positif** | Mère/sœur valident le gain de temps | Interview qualitative |

---

### Métriques V2 (Post-soutenance / Production)

*À implémenter après validation du prototype :*

- Analytics temps réel (temps de planification, durée transmissions)
- Taux d'adoption du planning intelligent (% suggestions acceptées)
- NPS (Net Promoter Score) auprès des premiers utilisateurs
- Métriques business (acquisition, rétention, conversion)

---

### Feature Bonus identifiée

**Scan automatique des ordonnances** (V2)
- Gain : Évite la saisie manuelle des cotations pour la facturation
- Impact : Temps supplémentaire gagné sur l'administratif
- Priorité : Après MVP, selon retours utilisateurs

---

## MVP Scope

### Core Features (Prototype Soutenance)

#### 🔐 Authentification & Sécurité
- BetterAuth + MFA (FIDO2/WebAuthn)
- Conformité HDS native
- Chiffrement AES-256 bout en bout
- JWT local pour auth offline

#### 👥 Gestion des Rôles
- **Admin structure** : vision globale, paramétrage, gestion utilisateurs
- **IDEL collaborateur** : accès limité à ses patients assignés
- **Médecin prescripteur** : lecture seule sur suivi de ses patients

#### 📁 Gestion Patients
- CRUD complet (création, lecture, modification, suppression)
- Historique et évolution des constantes
- Attribution patients ↔ IDEL
- Isolation des données par structure/rôle

#### 🗺️ Planning Intelligent
- Génération automatique basée sur dossiers patients, localisation, préférences
- **Algorithme d'optimisation** type voyageur de commerce adapté contraintes IDEL
- Modification manuelle en un glissement de doigt
- Recalcul instantané si patient absent ou urgence

#### 📝 Transmissions
- Saisie en 2-3 minutes
- 🎤 IA vocale avec validation humaine obligatoire
- ✍️ Saisie écrite simplifiée
- 📋 Templates prédéfinis par type de soin

#### 📱 Mode Offline-First
- Fonctionne parfaitement sans 4G/5G
- Base SQLite locale (Prisma)
- Synchronisation automatique avec PostgreSQL serveur (HDS)
- Gestion des conflits de sync

#### 💻 Double Plateforme
- Application mobile (React Native / Expo)
- Back Office web pour gestion au cabinet

---

### Out of Scope (V2 Post-soutenance)

| Feature | Raison du report | Priorité V2 |
|---------|------------------|-------------|
| **Scan automatique ordonnances** | Complexité OCR/IA, non essentiel MVP | Haute |
| **Facturation intégrée** | Dépendances CPAM, scope trop large | Haute |
| **Analytics avancés** | Pas de valeur avec 4 testeurs | Moyenne |
| **Gamification** | Nice-to-have, pas core value | Basse |
| **Multi-professions** | Focus IDEL d'abord | Future |

---

### MVP Success Criteria

| Critère | Validation |
|---------|------------|
| **Fonctionnel** | Parcours complet testable de bout en bout |
| **Offline** | Fonctionne 100% sans réseau |
| **Sécurisé** | Auth MFA + chiffrement opérationnels |
| **Optimisation** | Algo génère planning optimisé en < 5 secondes |
| **Adoption** | 4/4 testeurs valident le gain de temps |
| **Stabilité** | 0 bug bloquant en démo soutenance |

---

### Future Vision (V2+)

#### Court terme (Post-soutenance)
- Scan automatique ordonnances → pré-remplissage cotations
- Analytics temps réel (temps gagné, usage features)
- Amélioration continue algo optimisation

#### Moyen terme (6-12 mois)
- **Facturation intégrée** : cotations NGAP + télétransmission CPAM
- Devenir le **tout-en-un IDEL** remplaçant Vega/Ozzen
- Intégration API logiciels existants

#### Long terme (2-3 ans)
- Extension autres professions libérales (kiné, sage-femme, orthophoniste...)
- Écosystème multi-structures
- Marketplace de services santé
- IA prédictive (anticipation besoins patients)