---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
inputDocuments:
  - type: product-brief
    path: "planning-artifacts/product-brief-idel-app-2026-01-21.md"
    loaded: true
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
projectType: 'greenfield'
classification:
  projectType: mobile_app
  domain: healthcare
  complexity: high
  projectContext: greenfield
  domainConcerns:
    - HDS compliance (Hébergement Données de Santé)
    - Data encryption (AES-256)
    - Strong authentication (MFA/FIDO2)
    - Patient data protection
    - Role-based access control
    - Audit logging
date: 2026-01-21
---

# Product Requirements Document - idel-app (KURA)

**Author:** Potpot
**Date:** 2026-01-21

## Executive Summary

### Product Vision

KURA (idel-app) est une application mobile offline-first qui transforme le quotidien des 120 000+ infirmiers libéraux (IDEL) en France en combinant planning intelligent, transmissions vocales IA et architecture offline native.

### Problem & Opportunity

Les IDEL perdent 30-60 minutes/jour en organisation manuelle avec outils fragmentés (Vega, Ozzen, agendas papier), et 66% rencontrent des difficultés réseau en zones blanches. Le marché attend une solution moderne : 75% ouverts à tester l'optimisation IA, 58% prêts à payer 20-50€/mois.

### Solution Differentiation

**4 innovations combinées (aucun concurrent ne les a toutes) :**

1. **Planning IA contextuel** : algorithme adapté contraintes métier IDEL (durée soins variable, horaires patients, préférences), pas simple optimisation distance GPS
2. **Transmissions vocales IA** : Superwhisper offline avec validation humaine obligatoire (0 cloud, HDS compliant, confidentialité absolue)
3. **Offline-first natif** : 100% fonctionnel sans réseau (architecture SQLite local / PostgreSQL HDS serveur)
4. **IA assistante** : suggère, jamais décide (contrôle total utilisateur, conformité déontologie infirmière)

### Target Users

- **Marie (80%)** : IDEL expérimentée, gagne 30+ min/jour sur planning et transmissions
- **Sophie (15%)** : débutante digital native, optimise rentabilité
- **Michel (5%)** : fin de carrière, interface ultra-simple sans courbe d'apprentissage
- **Admin structure** : gestion centralisée multi-IDEL
- **Médecin prescripteur** : suivi patients lecture seule

### MVP Scope & Success

**Prototype soutenance :** 4/4 testeurs terrain valident gain temps réel, 0 bug bloquant, toutes features MVP fonctionnelles (auth MFA/HDS, gestion patients, planning IA, transmissions vocale+texte, offline complet, notifications push).

**Post-MVP :** facturation intégrée CPAM, scan ordonnances OCR, analytics temps réel, intégration DMP, extension multi-professions (kiné, sage-femme).

---

## Success Criteria

### User Success

**Primary User (Marie - 80% utilisateurs) :**
- Gagne 30+ minutes par jour (temps de planification + transmissions combinés)
- Transmissions saisies en 2-3 minutes vs 45 minutes actuellement
- Planning généré automatiquement sans charge mentale quotidienne
- Application fonctionne en zone blanche (66% des IDEL concernés)
- Moment "Waouh" : constater visuellement le temps gagné sur suivi et planification

**Secondary Users :**
- **Sophie (15%)** : conseils d'optimisation, rentabilité améliorée, sécurité HDS rassurante
- **Michel (5%)** : autonomie complète après onboarding, interface ultra-simple ne nécessitant pas d'aide
- **Admin structure** : configuration initiale complétée via onboarding guidé
- **Médecin prescripteur** : consultation rapide de l'évolution patients sans surcharge

**Critères d'adoption :**
- Utilisateur préfère KURA à son ancien système (Vega/Ozzen/agenda)
- Recommandation spontanée à des collègues (ambassadrice)
- Intégration dans la routine quotidienne en < 1 semaine

### Business Success

**Prototype (Soutenance - 2026) :**
- 4/4 testeurs (vous, associé, mère, sœur) valident le gain de temps
- 0 bug bloquant en démonstration
- 100% des fonctionnalités MVP implémentées et testables
- Parcours utilisateur complet fonctionnel de bout en bout

**Post-soutenance (V2) :**
- 75% des IDEL testeurs ouverts à tester l'optimisation intelligente (insight sondage)
- 58% prêts à payer 20-50€/mois pour solution qui fait gagner du temps
- Feedback positif : mère et sœur confirment gain de temps réel
- Taux de recommandation élevé (NPS à implémenter)

**Marché cible :**
- 120 000+ IDEL en France (marché total adressable)
- Focus initial : zones périurbaines et rurales (couverture réseau faible)

### Technical Success

**Performance :**
- Planning optimisé généré en < 5 secondes
- Application fonctionne 100% sans réseau (offline-first)
- Synchronisation automatique sans conflit de données
- Temps de chargement application < 2 secondes

**Sécurité :**
- Conformité HDS (Hébergement Données de Santé) opérationnelle
- Chiffrement AES-256 bout en bout
- Authentification MFA/FIDO2 fonctionnelle
- JWT local pour auth offline
- Isolation stricte des données par rôle et structure
- Audit logging complet

**Fiabilité :**
- Stabilité : 0 bug bloquant en production
- Mode offline : fonctionne en zone blanche testée en conditions réelles
- Gestion des conflits de synchronisation robuste

### Measurable Outcomes

| Métrique | Objectif Prototype | Méthode de Mesure |
|----------|-------------------|-------------------|
| **Temps gagné/jour** | 30+ minutes | Feedback qualitatif post-test + observation |
| **Durée transmissions** | 2-3 minutes | Timer dans l'app (si implémenté) ou mesure manuelle |
| **Testeurs actifs** | 4/4 ont testé parcours complet | Confirmation directe |
| **Couverture fonctionnelle** | 100% features MVP | Checklist de validation |
| **Bugs bloquants** | 0 en démo | Tests pré-soutenance |
| **Autonomie Michel** | Utilisation sans aide après onboarding | Observation directe |
| **Fiabilité offline** | 100% fonctionnel sans réseau | Tests terrain zones rurales |
| **Génération planning** | < 5 secondes | Mesure technique |

## Product Scope

### MVP - Minimum Viable Product

**Périmètre prototype soutenance :**

**🔐 Authentification & Sécurité**
- BetterAuth + MFA (FIDO2/WebAuthn)
- Conformité HDS native
- Chiffrement AES-256 bout en bout
- JWT local pour authentification offline

**👥 Gestion des Rôles**
- Admin structure : vision globale, paramétrage, gestion utilisateurs
- IDEL collaborateur : accès limité à patients assignés uniquement
- Médecin prescripteur : lecture seule sur suivi de ses patients

**📁 Gestion Patients**
- CRUD complet (création, lecture, modification, suppression)
- Historique et évolution des constantes
- Attribution patients ↔ IDEL
- Isolation des données par structure/rôle

**🗺️ Planning Intelligent**
- Génération automatique basée sur dossiers patients, localisations, préférences
- Algorithme d'optimisation type "voyageur de commerce" adapté contraintes IDEL
- Modification manuelle en un glissement de doigt (contrôle total utilisateur)
- Recalcul instantané si patient absent ou urgence

**📝 Transmissions**
- Saisie en 2-3 minutes
- 🎤 IA vocale avec validation humaine obligatoire avant enregistrement
- ✍️ Saisie écrite simplifiée
- 📋 Templates prédéfinis par type de soin

**📱 Mode Offline-First**
- Fonctionne parfaitement sans 4G/5G
- Base SQLite locale (Prisma)
- Synchronisation automatique avec PostgreSQL serveur (HDS)
- Gestion des conflits de synchronisation

**💻 Double Plateforme**
- Application mobile (React Native / Expo)
- Back Office web pour gestion au cabinet

**Livrables soutenance :**
- Application mobile fonctionnelle
- Back Office web opérationnel
- Mode offline avec synchronisation
- Authentification MFA conforme HDS
- Documentation technique

### Growth Features (Post-MVP)

**Court terme (Post-soutenance) :**

**Scan automatique ordonnances**
- OCR/IA pour extraction automatique cotations
- Pré-remplissage facturation
- Gain de temps administratif supplémentaire
- Priorité : Haute (demande terrain identifiée)

**Analytics temps réel**
- Temps de planification mesuré
- Durée transmissions trackée
- Usage des features analysé
- Taux d'acceptation suggestions planning
- NPS (Net Promoter Score)

**Amélioration continue algorithme**
- Machine learning sur préférences utilisateur
- Optimisation adaptative basée sur historique
- Suggestions personnalisées

**Moyen terme (6-12 mois) :**

**Facturation intégrée**
- Cotations NGAP automatiques
- Télétransmission CPAM
- Devient le tout-en-un IDEL remplaçant Vega/Ozzen
- Intégration API logiciels existants

**Marketplace services**
- Intégration partenaires (assurances, formation, matériel médical)
- Écosystème de services pour IDEL

### Vision (Future)

**Long terme (2-3 ans) :**

**Extension multi-professions**
- Kinésithérapeutes libéraux
- Sages-femmes
- Orthophonistes
- Autres professions paramédicales libérales

**IA prédictive**
- Anticipation besoins patients basée sur historique
- Alertes prédictives (détérioration état patient)
- Optimisation prédictive des tournées

**Écosystème multi-structures**
- Collaboration inter-structures
- Mutualisation de ressources
- Réseaux de soins coordonnés

**Gamification et engagement**
- Mécaniques d'engagement utilisateur
- Communauté IDEL intégrée
- Partage bonnes pratiques

---

## User Journeys

Les parcours utilisateurs ci-dessous illustrent comment KURA répond aux besoins des différents acteurs. Chaque parcours révèle des capacités fonctionnelles spécifiques qui seront détaillées dans les exigences.

### 👤 Marie Dubois - "De la Course Contre la Montre à la Sérénité"

**Scène d'ouverture :**

Lundi 7h30, Marie est dans sa voiture, Vega ouvert sur le siège passager, agenda papier sur le tableau de bord, GPS qui charge. Elle jongle entre trois outils pour planifier sa journée. *"Madame Dupont d'abord ou Monsieur Martin ? Lequel est le plus proche ?"* La charge mentale est déjà là avant même le premier patient.

**Action montante :**

Sa collègue Sophie lui parle de KURA lors d'un déjeuner. Sceptique mais curieuse, Marie accepte l'invitation de son admin de structure. Premier jour : tout est déjà configuré, ses 45 patients sont assignés, le planning du jour apparaît automatiquement optimisé.

**Premier test :** Elle modifie l'ordre en glissant deux patients — l'algorithme recalcule instantanément. *"Ok, ça garde mon contrôle."*

**Climax - Le moment "Waouh" :**

Fin de première semaine. Marie compare son temps : avant, 1h perdue en trajets + 45 min de transmissions le soir = 1h45/jour. Avec KURA : planning optimisé (gain 30 min) + transmissions vocales validées en 2-3 minutes chacune (gain 30 min) = **1h gagnée quotidiennement**.

Un soir, elle rentre à 18h30 au lieu de 19h30. Son fils : *"Maman, tu es déjà là ?"*

**Résolution :**

Trois semaines plus tard, Marie ne peut plus imaginer revenir à l'ancien système. Elle recommande KURA à deux collègues. Sa qualité de vie s'améliore : moins de stress, plus de temps personnel, meilleure organisation.

**Nouvelle réalité :** KURA fait partie de sa routine quotidienne, comme son stéthoscope.

---

### 👩‍💼 Sophie Chen - "De la Dispersion à l'Optimisation"

**Scène d'ouverture :**

Sophie, 6 mois d'exercice, 15 patients dispersés sur 60 km. Budget serré, chaque minute compte. Elle passe plus de temps sur la route qu'auprès des patients. *"Comment je vais tenir financièrement si je fais que de la route ?"*

**Action montante :**

Early adopter tech, Sophie teste KURA dès qu'elle en entend parler. Elle configure elle-même son compte, explore toutes les fonctionnalités. L'algorithme d'optimisation lui suggère un ordre qu'elle n'aurait jamais imaginé.

**Test terrain :** Premier jour avec le planning optimisé — elle gagne 45 minutes de trajet. *"C'est 45 minutes que je peux facturer !"*

**Climax - Le moment déclic :**

Sophie utilise les analytics de KURA (V2) pour calculer sa rentabilité. Elle visualise concrètement : 
- Temps de trajet réduit de 40%
- Capacité à prendre 2 patients supplémentaires par semaine
- ROI de l'abonnement 20€/mois : largement positif

**Résolution :**

Sophie devient ambassadrice de KURA. Elle en parle dans ses groupes Facebook IDEL, recommande à ses collègues de promo. Elle apprécie particulièrement la sécurité MFA — *"Personne ne peut se connecter sans mon consentement"* — ça la rassure.

**Nouvelle réalité :** Elle optimise sa rentabilité tout en améliorant sa qualité de service.

---

### 👨‍⚕️ Michel Lefebvre - "De la Réticence à l'Adoption Prudente"

**Scène d'ouverture :**

Michel, 58 ans, 25 ans d'exercice en zone rurale. Agenda papier depuis toujours, méthodes éprouvées. *"Si c'est compliqué, je n'y arriverai jamais. À mon âge, pourquoi changer ?"*

Son admin de structure lui parle de KURA. Résistance initiale forte.

**Action montante :**

L'admin propose un onboarding accompagné. Michel accepte à contrecœur, *"pour voir"*. Interface ultra-simple, tutoriels intégrés. Premier test : ajouter un patient, voir le planning se générer.

**Surprise :** *"C'est pas si compliqué finalement."*

**Climax - Le moment conviction :**

Jour 3, zone blanche en pleine campagne — KURA fonctionne parfaitement en mode offline. Michel saisit une transmission vocale (première fois qu'il utilise la voix), valide le texte généré. *"2 minutes au lieu de 10 minutes à tout écrire."*

Il constate : moins de paperasse le soir, plus de temps pour ses patients en journée.

**Résolution :**

Michel n'utilise pas toutes les fonctionnalités (juste planning + transmissions), mais celles-là lui suffisent. Il apprécie le gain de temps sur l'administratif, qui lui permet de se concentrer sur la relation patient — sa vraie priorité.

**Nouvelle réalité :** Adoption sélective mais efficace. Il dit à ses collègues : *"C'est pas si terrible, même à mon âge."*

---

### 🏢 Admin de Structure - "De la Configuration au Pilotage"

**Scène d'ouverture :**

Claire, 35 ans, gestionnaire d'un cabinet de 8 IDEL. Jongle entre comptabilité, planning équipe, gestion administrative. *"Il faut que je trouve une solution qui ne me prenne pas 3 jours à configurer."*

**Action montante :**

Découvre KURA, s'inscrit pour tester. Onboarding guidé :
1. Création de la structure
2. Invitation des 8 IDEL collaborateurs
3. Import des patients (CSV ou saisie manuelle)
4. Attribution patients ↔ IDEL

**Temps de configuration :** 2 heures pour tout paramétrer. *"Ça va, c'est gérable."*

**Climax - Le moment valeur :**

Après 1 semaine, Claire accède au tableau de bord admin :
- Vision globale : qui voit quels patients
- Stats d'utilisation : 7/8 IDEL utilisent quotidiennement
- Feedback terrain : "ça nous fait gagner du temps"

Elle peut ajouter/retirer des patients, réassigner des tournées, sans appeler chaque IDEL.

**Résolution :**

Claire gère la structure depuis le Back Office web. Elle apprécie la vision centralisée et le gain de temps administratif pour toute l'équipe.

**Nouvelle réalité :** Pilotage simplifié, équipe plus efficace, satisfaction générale.

---

### 👨‍⚕️ Dr. Arnaud Bertrand - Médecin Prescripteur - "De l'Incertitude au Suivi Serein"

**Scène d'ouverture :**

Dr. Bertrand, médecin généraliste, 15 patients suivis à domicile par des IDEL. Il prescrit les soins mais n'a aucune visibilité sur l'évolution réelle. *"Est-ce que Madame Durand prend bien son traitement ? Ses constantes évoluent-elles ?"*

Il appelle régulièrement les IDEL pour avoir des nouvelles — chronophage pour tout le monde.

**Action montante :**

Marie (son IDEL de confiance) lui propose un accès KURA en lecture seule sur ses patients. Dr. Bertrand accepte, curieux.

Première connexion : il voit l'historique complet de Madame Durand (tension, glycémie, poids), avec graphiques d'évolution.

**Climax - Le moment utilité :**

Consultation de suivi avec Madame Durand. Dr. Bertrand ouvre KURA sur sa tablette :
- Tension stable depuis 2 semaines
- Observance traitement : transmission IDEL confirme prise quotidienne
- Évolution positive visible en un coup d'œil

Il ajuste le traitement en connaissance de cause, sans avoir à appeler l'IDEL.

**Résolution :**

Dr. Bertrand consulte KURA 2-3 fois par semaine, uniquement pour ses patients critiques. Gain de temps, meilleure coordination avec les IDEL, suivi patient amélioré.

**Sécurité rassurante :** Accès strictement limité à ses patients uniquement (isolation HDS).

**Nouvelle réalité :** Suivi à distance efficace, coordination médecin-IDEL simplifiée.

---

### Journey Requirements Summary

**Parcours Marie → Capacités révélées :**
- Planning intelligent auto-génératif
- Modification manuelle intuitive (glisser-déposer)
- Transmissions vocales avec validation
- Analytics temps gagné (feedback visuel)
- Mode offline fiable

**Parcours Sophie → Capacités révélées :**
- Algorithme d'optimisation avancé
- Analytics rentabilité (V2)
- Sécurité MFA rassurante
- Interface moderne et rapide

**Parcours Michel → Capacités révélées :**
- Onboarding guidé progressif
- Interface ultra-simple
- Tutoriels intégrés
- Fonctionnalités sélectives (pas obligé de tout utiliser)
- Support dédié

**Parcours Admin → Capacités révélées :**
- Gestion multi-utilisateurs
- Attribution patients ↔ IDEL
- Vision globale structure
- Import CSV patients
- Tableau de bord admin
- Réassignation dynamique

**Parcours Médecin → Capacités révélées :**
- Accès lecture seule contrôlé
- Historique constantes avec graphiques
- Évolution patient visualisée
- Isolation stricte des données (sécurité HDS)
- Synchronisation temps réel

---

## Domain-Specific Requirements

En tant qu'application healthcare manipulant des données de santé sensibles, KURA doit respecter des exigences réglementaires strictes spécifiques au domaine médical français.

### Conformité & Réglementaire

**Hébergement Données de Santé (HDS) :**
- Certification HDS obligatoire pour l'hébergeur (partenariat avec hébergeur certifié)
- Traçabilité complète des accès aux données de santé
- Chiffrement au repos et en transit (AES-256)
- Plan de Reprise d'Activité (PRA) et Plan de Continuité d'Activité (PCA)
- Audit annuel de conformité HDS

**RGPD (Règlement Général sur la Protection des Données) :**
- Consentement explicite pour traitement des données personnelles de santé
- Droit à l'oubli : suppression complète des données patient sur demande
- Portabilité des données : export en format standard (JSON, PDF, CSV)
- Registre des traitements (documentation complète du traitement des données)
- Nomination d'un DPO (Délégué à la Protection des Données) ou conseil juridique spécialisé santé

**Durée de rétention des données :**
- **Données médicales (dossiers patients, transmissions, constantes)** : 10 ans minimum à compter de la dernière consultation (conformément aux recommandations du Conseil national de l'Ordre des infirmiers)
- **Données administratives (facturation, cotations)** : séparation architecturale, rétention distincte selon obligations comptables (6-10 ans)
- **Données de paiement** : suppression après traitement (non concernées par les 10 ans)
- Archivage sécurisé avec procédure de suppression automatique à l'échéance

**Classification des données :**
- **Données de santé à caractère personnel (DSCP)** : transmissions, constantes, historique patient, évolution clinique
- **Données administratives** : facturation, cotations NGAP (V2), données de paiement
- **Séparation architecturale** : bases de données distinctes pour données médicales (HDS strict) et données administratives (sécurité standard renforcée)
- Niveau de sensibilité : très élevé (catégorie spéciale RGPD Art. 9)

### Contraintes Techniques de Sécurité

**Chiffrement & Protection des Données :**
- Chiffrement AES-256 au repos (base de données PostgreSQL HDS)
- Chiffrement en transit (TLS 1.3 minimum)
- Chiffrement local mobile (SQLite chiffré avec clé liée à l'authentification utilisateur)
- Gestion des secrets : clés de chiffrement stockées dans HSM (Hardware Security Module) ou vault sécurisé
- Sauvegarde chiffrée automatique avec rétention définie (30 jours rolling + archivage annuel)

**Authentification & Contrôle d'Accès :**
- MFA obligatoire (FIDO2/WebAuthn) pour tous les utilisateurs
- Déconnexion automatique après 15 minutes d'inactivité
- Révocation à distance : admin peut désactiver un appareil compromis (vol/perte téléphone)
- Isolation stricte par rôle (RBAC - Role-Based Access Control)
- Principe du moindre privilège : chaque utilisateur accède uniquement à ce qu'il doit voir

**Audit & Traçabilité :**
- Journalisation complète de tous les accès aux données de santé (qui, quand, quelle donnée)
- Logs d'audit immuables (append-only, non modifiables)
- Conservation des logs : 3 ans minimum (conformité RGPD + HDS)
- Traçabilité des modifications : historique complet des transmissions (version originale IA vocale + version validée + auteur validation)
- Alertes automatiques en cas d'accès anormal (tentatives multiples, horaires inhabituels)

**Synchronisation Offline-Online :**
- Queue de synchronisation persistante avec retry automatique
- Règle de résolution de conflits : **serveur gagne** (données serveur prioritaires pour garantir cohérence multi-utilisateurs)
- Indicateur visuel "non synchronisé" dans l'app mobile
- Backup local automatique avant tentative de synchronisation
- Effacement sécurisé des données locales lors de désinscription d'un appareil

### Exigences d'Interopérabilité

**Standards de données médicales :**
- **HL7 FHIR** (Fast Healthcare Interoperability Resources) : format d'échange pour intégration future avec systèmes médicaux
- **DMP (Dossier Médical Partagé)** : intégration prévue moyen terme (V2/V3) pour partage transmissions avec médecins et hôpitaux
- Export données patient en format standard : JSON, PDF (impression), CSV (portabilité)

**API & Intégrations tierces :**
- **API sécurisée OAuth2** pour accès médecins prescripteurs (lecture seule, isolation stricte)
- **CPAM** : anticipation architecture pour télétransmission facturation (V2)
- **Logiciels de facturation existants** : import/export données administratives (séparation claire données médicales/administratives)
- Rate limiting et monitoring des accès API

**Portabilité & Export :**
- Export complet dossier patient (données médicales + administratives) sur demande (RGPD)
- Format structuré lisible hors de KURA (JSON + PDF lisible humain)
- Import données depuis autres systèmes (migration, interopérabilité)

### Risques Spécifiques au Domaine & Mitigations

**Risque 1 : Violation de données de santé**
- **Impact** : Sanctions CNIL (jusqu'à 4% CA ou 20M€), perte confiance utilisateurs, atteinte réputation, responsabilité pénale
- **Mitigation** :
  - Partenaire HDS certifié dès le lancement (pas de dette technique sécurité)
  - Pentests réguliers (sécurité applicative, infrastructure)
  - Plan de réponse aux incidents documenté (notification CNIL sous 72h si violation)
  - Assurance cyber-risque
  - Bug bounty program (post-MVP)

**Risque 2 : Erreur dans transmission IA vocale**
- **Impact** : Donnée médicale incorrecte → erreur de suivi patient → responsabilité professionnelle IDEL
- **Mitigation** :
  - Validation humaine obligatoire avant enregistrement (pas d'enregistrement automatique)
  - Audit trail complet : qui a validé, quand, version originale transcrite vs version validée
  - Disclaimer clair dans l'app : l'IDEL reste seul responsable du contenu validé
  - Logs immuables des transcriptions IA (traçabilité médico-légale)
  - Option de désactivation de l'IA vocale si l'utilisateur préfère saisie manuelle uniquement

**Risque 3 : Perte de données en mode offline**
- **Impact** : Transmissions perdues, planning non synchronisé, perte d'information médicale
- **Mitigation** :
  - Queue de synchronisation persistante (stockage local sécurisé)
  - Retry automatique avec backoff exponentiel
  - Indicateur visuel "non synchronisé" (badge rouge sur données en attente)
  - Backup local automatique avant tentative de sync
  - Alerte utilisateur si sync échoue après 24h

**Risque 4 : Accès non autorisé (vol/perte téléphone)**
- **Impact** : Exposition données de santé de dizaines de patients, violation RGPD/HDS
- **Mitigation** :
  - MFA obligatoire (impossible de se connecter sans second facteur)
  - Chiffrement local complet (données illisibles sans authentification)
  - Révocation à distance par admin (désactivation appareil compromis)
  - Déconnexion automatique après inactivité
  - Wipe à distance optionnel (effacement sécurisé données locales)

**Risque 5 : Non-conformité RGPD/HDS**
- **Impact** : Sanctions réglementaires, impossibilité de commercialiser, arrêt d'activité
- **Mitigation** :
  - Audit conformité RGPD/HDS avant lancement MVP
  - DPO ou conseil juridique spécialisé santé (validation architecture)
  - Documentation complète du traitement des données (registre RGPD)
  - Revue annuelle de conformité
  - Veille réglementaire continue (évolution réglementation)

**Risque 6 : Séparation insuffisante données médicales/administratives**
- **Impact** : Données administratives (facturation) soumises aux contraintes HDS → surcoût infrastructure
- **Mitigation** :
  - Architecture séparée dès V1 (anticipation V2)
  - Base de données HDS : données médicales uniquement
  - Base de données sécurisée standard : données administratives (facturation, cotations)
  - Liens référentiels (ID patient) sans duplication données de santé
  - Audit de séparation avant intégration facturation V2

### Contraintes Métier Spécifiques

**Responsabilité professionnelle :**
- L'IDEL reste juridiquement et déontologiquement responsable de ses transmissions et soins
- KURA est un outil d'assistance à la documentation, pas un outil de décision médicale
- Mentions légales claires : "L'utilisateur reste seul responsable des informations saisies et validées"
- Aucune suggestion médicale ou diagnostic par l'application (hors périmètre)

**Secret professionnel :**
- IDEL soumis au secret professionnel (Art. 226-13 Code pénal) : divulgation = délit pénal
- KURA doit garantir étanchéité absolue entre structures (isolation multi-tenant stricte)
- Accès limité : seuls les professionnels autorisés et habilités (médecin prescripteur, IDEL assigné)
- Pas de partage cross-structures sans consentement explicite patient

**Ordre des Infirmiers :**
- Respect du Code de déontologie des infirmiers (Art. R4312 du Code de la santé publique)
- Outil conforme aux bonnes pratiques professionnelles
- Transparence sur l'utilisation de l'IA (information patient si transcription vocale)

**Consentement patient :**
- Information claire au patient sur utilisation d'un outil numérique pour ses données de santé
- Droit de refus du patient (IDEL peut continuer avec méthode papier si patient refuse)
- Procédure de recueil de consentement documentée

---

## Innovation & Novel Patterns

KURA se distingue par plusieurs innovations techniques et philosophiques qui n'ont jamais été combinées sur le marché des applications IDEL.

### Détection des Aires d'Innovation

**1. Combinaison Inédite sur le Marché Healthcare IDEL**

KURA combine pour la première fois quatre éléments que **aucun concurrent n'a réussi à intégrer ensemble** :
- Planning intelligent contextuel adapté aux contraintes métier IDEL
- Transmissions médicales par IA vocale avec validation humaine obligatoire
- Architecture offline-first native en environnement HDS
- Double plateforme (mobile terrain + back office cabinet)

**Innovation principale : IA Assistante dans Contexte Réglementé**

Contrairement aux outils IA généralistes, KURA positionne l'IA comme **assistante, jamais décisionnaire** :
- *"L'algorithme suggère, l'humain décide"* pour le planning
- Validation humaine obligatoire pour toute transcription vocale
- Pas de suggestion médicale ou diagnostic automatisé
- Conformité HDS native (données restent sécurisées)

**2. Planning Intelligent Métier-Spécifique**

**Innovation technique :**
- Algorithme d'optimisation type "voyageur de commerce" **adapté aux contraintes IDEL**
- Prise en compte de variables métier que les GPS classiques ignorent :
  - Durée variable des soins (pas juste la distance géographique)
  - Contraintes horaires patients (fenêtres de disponibilité)
  - Préférences utilisateur (priorités personnelles)
  - Recalcul instantané en cas d'imprévu (patient absent, urgence)

**Différenciation vs GPS/outils existants :**
- GPS classiques : optimisation pure distance/temps de trajet
- KURA : optimisation contextuelle incluant les contraintes cliniques et organisationnelles

**Validation prévue :**
- Mesure du temps gagné : objectif 30+ minutes/jour (planification + trajets optimisés)
- Taux d'acceptation des suggestions : suivi du % de suggestions planning acceptées vs modifiées
- Feedback qualitatif des 4 testeurs MVP (mère, sœur, associé, vous)

**Fallback si algorithme insuffisant :**
- Mode manuel pur reste toujours disponible
- Utilisateur conserve 100% du contrôle (glisser-déposer pour modifier)
- Amélioration continue algorithme basée sur retours terrain (V2)

**3. IA Vocale pour Transmissions Médicales Sécurisées**

**Innovation technologique :**

Utilisation de [Superwhisper](https://superwhisper.com/), solution de transcription basée sur Whisper d'OpenAI, avec caractéristiques uniques pour le contexte healthcare :

**Avantages stratégiques Superwhisper pour KURA :**
- **Offline-first natif** : transcription sur l'appareil, pas besoin de connexion (aligné architecture KURA)
- **Confidentialité par design** : données ne quittent jamais l'appareil (conformité HDS renforcée)
- **Support français** : 100+ langues dont français natif
- **Vocabulaire personnalisé** : possibilité d'ajouter terminologie médicale IDEL (noms de médicaments, acronymes médicaux, cotations NGAP)
- **Intégration système** : fonctionne avec le clipboard macOS/iOS (facilite intégration dans KURA)

**Architecture de sécurité vocale :**
1. IDEL dicte transmission (microphone app KURA)
2. Superwhisper transcrit localement (aucune donnée envoyée cloud)
3. Texte transcrit affiché pour validation humaine
4. IDEL valide/corrige avant enregistrement
5. Traçabilité complète : version originale IA + version validée + qui a validé + quand

**Différenciation vs concurrents :**
- Vega/Ozzen : **aucune transcription vocale**
- Autres apps santé : si transcription, elle passe par cloud tiers (risque RGPD/HDS)
- KURA : **transcription locale + validation obligatoire** (sécurité maximale)

**Validation approche IA vocale :**
- Objectif : transmissions saisies en 2-3 minutes vs 10-45 minutes actuellement
- Taux d'erreur acceptable : validation humaine obligatoire donc pas de seuil strict, mais qualité suffisante pour gagner du temps
- Mesure qualitative : IDEL perçoit-elle un gain de temps réel avec validation ?

**Fallback si IA vocale insuffisante (MVP) :**
- **Si transcription Superwhisper trop imprécise en V1** → reste en mode textuel uniquement
- Saisie écrite simplifiée et templates prédéfinis restent disponibles
- IA vocale repositionnée en V2 après amélioration/fine-tuning

**Risque d'innovation : Erreur transcription → donnée médicale incorrecte**
- **Mitigation principale** : validation humaine obligatoire (pas d'enregistrement automatique)
- Disclaimer clair : "Vous restez seul responsable des informations validées"
- Audit trail immuable (traçabilité médico-légale complète)
- Option de désactivation permanente si utilisateur préfère saisie manuelle

**4. Offline-First en Environnement HDS (Healthcare)**

**Innovation architecturale :**

Concevoir une architecture offline-first pour des **données de santé sensibles** est rare et complexe :

**Challenges techniques uniques :**
- SQLite local chiffré (AES-256) pour stockage offline
- Synchronisation bidirectionnelle avec PostgreSQL HDS
- Gestion des conflits de données sensibles (règle : serveur gagne)
- Queue de synchronisation persistante avec retry automatique
- Effacement sécurisé lors de désinscription appareil

**Pourquoi c'est innovant :**
- La plupart des apps santé exigent connexion permanente (pas adaptées zones blanches)
- 66% des IDEL rencontrent régulièrement des problèmes de connectivité terrain
- KURA : **100% fonctionnel sans réseau**, synchronisation transparente quand réseau disponible

**Validation offline-first :**
- Tests terrain en zones rurales (zones blanches confirmées)
- Vérification : 100% des fonctionnalités accessibles sans réseau
- Mesure : stabilité synchronisation (0 perte de données)

**5. Double Contrôle Humain sur IA (Philosophie Produit)**

**Innovation philosophique :**

Dans un contexte où l'IA tend à automatiser et remplacer, KURA adopte une posture inverse :
- **L'IA propose, l'humain dispose**
- Pas d'automatisation complète, toujours un point de validation humaine
- Contrôle total utilisateur (peut désactiver suggestions, modifier, ignorer)

**Alignement domaine healthcare :**
- Responsabilité professionnelle IDEL préservée (l'IDEL reste juridiquement responsable)
- Conformité déontologique (Code de déontologie des infirmiers)
- Transparence totale (patient informé utilisation outil numérique)

**Différenciation stratégique :**
- Concurrents : souvent automatisation totale (risque juridique)
- KURA : **IA assistante responsabilisante** (renforce expertise IDEL, ne la remplace pas)

### Contexte Marché & Paysage Concurrentiel

**Marché IDEL France :**
- 120 000+ infirmiers libéraux
- Marché fragmenté avec outils datés (Vega, Ozzen créés avant 2015)
- Aucun acteur n'a modernisé l'expérience avec IA et offline-first

**Timing de marché optimal :**
- Maturité technologique : Whisper/Superwhisper disponibles et performants
- Adoption IA mainstream : IDEL familiarisés avec IA (ChatGPT, assistants vocaux)
- Besoin terrain validé : sondage 12 IDEL confirme douleur et ouverture solution

**Positionnement unique :**

| Critère | Vega/Ozzen | KURA |
|---------|------------|------|
| **Planning intelligent** | Manuel | IA contextuelle adaptée métier |
| **Transmissions** | Saisie manuelle 45 min | Vocale IA 2-3 min (validation obligatoire) |
| **Mode offline** | Limité, bugs fréquents | Offline-first natif, 100% fonctionnel |
| **Interface** | Datée (pré-2015) | Moderne, mobile-first |
| **Sécurité données** | HDS basique | HDS + transcription locale (0 cloud) |
| **Contrôle utilisateur** | N/A | 100% contrôle (IA suggère uniquement) |

**Barrières à l'entrée pour concurrents :**
- Connaissance terrain intime (fondateur avec mère et sœur IDEL)
- Données propriétaires (sondage 12 IDEL, insights réels)
- Architecture offline-first HDS (complexité technique élevée)
- Algorithme métier-spécifique (pas générique)

### Approche de Validation Innovation

**Phase 1 : Validation MVP (Prototype Soutenance)**

**Validation Planning Intelligent :**
- Mesure quantitative : temps gagné quotidien (objectif 30+ min)
- Mesure qualitative : feedback 4 testeurs (mère, sœur, associé, vous)
- Métrique clé : % suggestions planning acceptées vs modifiées manuellement

**Validation IA Vocale :**
- Test Superwhisper avec vocabulaire médical personnalisé (médicaments, cotations)
- Mesure : temps de saisie transmission vocale + validation vs saisie manuelle
- Décision go/no-go : si gain de temps insuffisant → fallback mode textuel V1

**Validation Offline-First :**
- Tests terrain zones rurales (zones blanches)
- Vérification : 100% fonctionnalités disponibles sans réseau
- Mesure : 0 perte de données lors de synchronisations

**Critère de succès global MVP :**
- 4/4 testeurs confirment gain de temps réel et significatif
- 0 bug bloquant en démo soutenance
- Planning optimisé généré en < 5 secondes
- Transmissions saisies en < 5 minutes (vocale ou textuelle)

**Phase 2 : Validation Post-MVP (V2)**

**Métriques d'adoption IA :**
- Taux d'utilisation IA vocale vs saisie manuelle
- Taux d'acceptation suggestions planning (objectif : 60%+)
- NPS (Net Promoter Score) auprès des premiers utilisateurs

**Amélioration continue :**
- Machine learning sur préférences utilisateur (algorithme adaptatif)
- Fine-tuning vocabulaire médical Superwhisper (réduction erreurs)
- Analytics temps réel (mesure précise temps gagné)

### Risques Innovation & Mitigations

**Risque 1 : Algorithme planning génère suggestions inadaptées**
- **Impact** : Perte de confiance utilisateur, abandon fonctionnalité planning intelligent
- **Mitigation** :
  - Contrôle total utilisateur (modification manuelle toujours possible)
  - Mode manuel pur disponible en permanence (fallback immédiat)
  - Amélioration continue basée sur retours terrain (V2)
  - Transparence : afficher pourquoi suggestion (distance, durée, contraintes)

**Risque 2 : Transcription IA vocale trop imprécise (taux d'erreur élevé)**
- **Impact** : Validation humaine prend plus de temps que saisie manuelle → pas de gain
- **Mitigation** :
  - Vocabulaire personnalisé Superwhisper (terminologie IDEL, médicaments)
  - Tests MVP avec testeurs réels (mère et sœur IDEL)
  - Fallback V1 : si gain insuffisant → reste mode textuel uniquement
  - V2 : fine-tuning modèle sur corpus transmissions IDEL

**Risque 3 : Résistance au changement (adoption lente)**
- **Impact** : IDEL expérimentés (ex: Marie 8 ans d'exercice) préfèrent méthodes manuelles éprouvées
- **Mitigation** :
  - Mode hybride suggestion/manuel (pas d'imposition)
  - Onboarding progressif (Michel peut n'utiliser que certaines fonctionnalités)
  - Visualisation concrète du temps gagné (moment "Waouh" = conviction)
  - Recommandation peer-to-peer (bouche-à-oreille IDEL)

**Risque 4 : Complexité technique offline-first HDS**
- **Impact** : Bugs synchronisation, perte de données, non-conformité HDS
- **Mitigation** :
  - Partenaire HDS certifié dès V1 (pas de dette technique)
  - Audit sécurité avant lancement MVP
  - Tests approfondis synchronisation (zones blanches, conflits)
  - Queue persistante avec retry (0 perte de données)

**Risque 5 : Concurrence rapide (copie par acteurs établis)**
- **Impact** : Vega/Ozzen copient l'innovation KURA
- **Mitigation** :
  - Barrières à l'entrée : connaissance terrain, algorithme propriétaire
  - Vitesse d'exécution : MVP rapide, adoption précoce
  - Communauté IDEL fidélisée (early adopters ambassadrices)
  - Amélioration continue (V2 facturation, V3 DMP) → écosystème complet

---

## Mobile App Specific Requirements

KURA étant une application mobile native cross-platform (React Native/Expo), elle doit répondre à des exigences techniques spécifiques aux plateformes iOS et Android.

### Project-Type Overview

KURA est une **Progressive Web App (PWA) mobile** développée avec **React Native / Expo** pour assurer une expérience native cross-platform optimale.

**Stratégie plateforme :**
- **iOS et Android** supportés dès le MVP
- Framework : React Native / Expo (JavaScript/TypeScript)
- Code partagé maximisé entre plateformes (90%+)
- Composants natifs spécifiques si nécessaire (performance critique)

**Justification cross-platform :**
- Vitesse de développement accrue pour prototype soutenance
- Code base unique → maintenance facilitée
- Expo facilite déploiement et testing (OTA updates)
- Performance suffisante pour cas d'usage KURA (pas de jeu 3D ou calcul intensif)

### Platform Requirements

**iOS Requirements :**

**Versions supportées :**
- iOS 14.0 minimum (support iPhone 6s et plus récents)
- Optimisation pour iOS 16+ (fonctionnalités récentes)
- Support iPad optionnel (V2) — focus iPhone en V1

**APIs spécifiques iOS :**
- **Core Location** : géolocalisation pour planning optimisé
- **AVFoundation** : capture audio pour transcription vocale
- **SQLite** : stockage local chiffré
- **Face ID / Touch ID** : authentification biométrique
- **Push Notifications (APNS)** : notifications via Firebase Cloud Messaging

**Conformité App Store :**
- Catégorie : "Santé et forme" ou "Productivité" (à valider selon guidelines Apple)
- Privacy Nutrition Labels : déclaration complète utilisation données santé
- Permissions explicites : localisation (Always/When In Use), microphone, biométrie
- Disclaimer responsabilité : "Outil professionnel — utilisateur responsable des données saisies"

**Android Requirements :**

**Versions supportées :**
- Android 8.0 (API 26) minimum (couverture 95%+ du marché)
- Optimisation pour Android 12+ (Material You, permissions granulaires)
- Support tablettes Android optionnel (V2)

**APIs spécifiques Android :**
- **Location Services** : géolocalisation pour planning
- **MediaRecorder** : capture audio pour transcription
- **SQLite** : stockage local chiffré
- **BiometricPrompt** : authentification biométrique (empreinte digitale, reconnaissance faciale)
- **Firebase Cloud Messaging (FCM)** : notifications push

**Conformité Google Play :**
- Catégorie : "Médecine" ou "Productivité professionnelle"
- Data Safety Form : déclaration complète traitement données santé (DSCP)
- Permissions runtime : localisation, microphone, stockage, biométrie
- Conformité RGPD : mention explicite dans fiche Play Store

### Device Permissions

**Permissions obligatoires (MVP) :**

**Localisation (GPS) :**
- **Type** : Foreground location (uniquement quand app active)
- **Justification utilisateur** : "Nécessaire pour optimiser votre planning de tournée et calculer les itinéraires"
- **iOS** : `NSLocationWhenInUseUsageDescription`
- **Android** : `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- **Fallback** : si refusé, planning manuel sans optimisation géographique

**Microphone :**
- **Type** : Audio recording
- **Justification utilisateur** : "Permet la saisie vocale de vos transmissions pour gagner du temps"
- **iOS** : `NSMicrophoneUsageDescription`
- **Android** : `RECORD_AUDIO`
- **Fallback** : si refusé, saisie textuelle uniquement (pas d'IA vocale)

**Stockage local :**
- **Type** : File system access
- **Justification utilisateur** : "Permet le fonctionnement offline et la synchronisation de vos données patients"
- **iOS** : Automatique (sandbox app)
- **Android** : `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` (API < 29), Scoped Storage (API 29+)
- **Obligatoire** : pas de fallback (nécessaire pour offline-first)

**Biométrie (Face ID / Touch ID / Fingerprint) :**
- **Type** : Biometric authentication
- **Justification utilisateur** : "Accès rapide et sécurisé à vos données patients sans retaper votre mot de passe"
- **iOS** : `NSFaceIDUsageDescription`
- **Android** : `USE_BIOMETRIC`, `USE_FINGERPRINT`
- **Fallback** : si refusé ou indisponible, authentification par mot de passe + MFA classique

**Notifications Push :**
- **Type** : Remote notifications
- **Justification utilisateur** : "Recevez des alertes importantes (nouveau patient, synchronisation, rappels)"
- **iOS** : APNS via Firebase
- **Android** : Firebase Cloud Messaging (FCM)
- **Fallback** : si refusé, pas de notifications push (utilisateur doit ouvrir l'app)

**Permissions optionnelles (V2) :**
- **Appareil photo** : scan ordonnances, photos patient (V2)
- **Calendrier** : synchronisation agenda iOS/Android (V2)
- **Bluetooth** : périphériques médicaux connectés (tensiomètre, glucomètre) (V3+)

### Offline Mode

**Architecture Offline-First :**

**Stockage local :**
- **Base de données** : SQLite avec Prisma ORM
- **Chiffrement** : SQLCipher (AES-256) pour SQLite chiffré
- **Taille maximale** : illimitée (dépend stockage appareil disponible)
- **Données stockées localement** :
  - Dossiers patients assignés à l'IDEL
  - Planning de la semaine en cours + semaine suivante
  - Transmissions en attente de synchronisation
  - Templates prédéfinis
  - Paramètres utilisateur et préférences

**Synchronisation bidirectionnelle :**
- **Stratégie** : Queue persistante avec retry automatique
- **Fréquence** : 
  - Automatique dès que réseau disponible
  - Manuelle via bouton "Synchroniser" (pull-to-refresh)
- **Résolution conflits** : serveur gagne (données serveur prioritaires)
- **Indicateur visuel** : badge "non synchronisé" sur données en attente
- **Timeout** : retry avec backoff exponentiel (1s, 2s, 4s, 8s, ..., max 60s)
- **Alerte** : si échec sync après 24h, notification utilisateur

**Gestion des conflits :**
- **Règle principale** : serveur gagne (last-write-wins côté serveur)
- **Cas d'usage** : 
  - Admin modifie patient pendant que IDEL offline → version serveur écrase local
  - IDEL ajoute transmission offline → merge (pas de conflit, nouvelle entrée)
- **Logs** : historique des synchronisations pour débogage

**Performance offline :**
- **Temps de chargement** : < 2 secondes (données locales)
- **Taille base locale** : ~50-200 MB pour 50 patients avec historique 6 mois
- **Optimisation** : lazy loading des historiques patients (charger à la demande)

### Push Notification Strategy

**Plateforme de notifications :**
- **Firebase Cloud Messaging (FCM)** pour iOS et Android
- **Configuration** : projet Firebase unique pour KURA
- **Tokens** : stockés côté serveur, associés à l'utilisateur et l'appareil

**Types de notifications :**

**1. Notifications critiques (priorité haute) :**
- **Nouveau patient assigné** : "Un nouveau patient vous a été assigné : M. Dupont"
- **Urgence ajoutée** : "Urgence planifiée aujourd'hui à 14h30 : Mme Martin"
- **Modification planning** : "Votre planning a été modifié par l'admin"
- **Appareil révoqué** : "Votre accès a été révoqué sur cet appareil"

**2. Notifications informatives (priorité normale) :**
- **Rappel patient** : "Prochain patient dans 15 min : Mme Durand (10 rue de la Paix)"
- **Synchronisation terminée** : "Vos données ont été synchronisées avec succès"
- **Mise à jour disponible** : "Une nouvelle version de KURA est disponible"

**3. Notifications programmées (locales) :**
- **Début de journée** : "Votre planning du jour est prêt (8 patients)"
- **Rappel transmission manquante** : "Pensez à saisir vos transmissions du jour"

**Configuration notifications :**
- **Permissions** : demandée au premier lancement (avec justification claire)
- **Préférences utilisateur** : activer/désactiver par type de notification
- **Do Not Disturb** : respect des modes silencieux iOS/Android
- **Badge** : compteur de notifications non lues sur icône app

**Sécurité notifications :**
- **Données sensibles** : pas de données patient dans le corps de notification (juste "Nouveau patient" sans nom)
- **Chiffrement** : payload Firebase chiffré en transit (TLS)
- **Deep linking** : ouverture directe de l'écran concerné dans l'app

### Store Compliance

**Apple App Store Compliance :**

**Catégorie :**
- **Primaire** : "Santé et forme" (sous-catégorie "Médecine")
- **Secondaire** : "Productivité" (outil professionnel)

**Privacy Nutrition Labels (obligatoire iOS 14+) :**

Déclaration des données collectées :
- **Données de santé** : Transmissions, constantes, historique patient (liées à l'identité, utilisées pour app functionality)
- **Localisation** : Position GPS (liée à l'identité, utilisée pour app functionality)
- **Identifiants** : Email, nom, numéro RPPS (liés à l'identité, utilisés pour account management)
- **Diagnostics** : Logs d'erreur, analytics (non liés à l'identité)

**Permissions requises (Info.plist) :**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>KURA utilise votre position pour optimiser votre planning de tournée et calculer les itinéraires entre patients.</string>

<key>NSMicrophoneUsageDescription</key>
<string>KURA utilise le microphone pour vous permettre de dicter vos transmissions vocalement et gagner du temps.</string>

<key>NSFaceIDUsageDescription</key>
<string>KURA utilise Face ID pour sécuriser l'accès rapide à vos données patients.</string>
```

**Mentions légales App Store :**
- Disclaimer : "Application destinée aux professionnels de santé libéraux. L'utilisateur reste seul responsable des informations saisies et validées."
- Support : email support + URL site web
- Politique de confidentialité : URL vers document RGPD complet
- Conditions d'utilisation : URL vers CGU

**Google Play Compliance :**

**Catégorie :**
- **Primaire** : "Médecine"
- **Tags** : Professionnel de santé, Infirmier libéral, Gestion patients

**Data Safety Form (obligatoire) :**

Déclaration transparente :
- **Types de données collectées** :
  - Informations personnelles (nom, email, RPPS)
  - Données de santé (transmissions, constantes patients)
  - Position (GPS pour planning)
  - Audio (enregistrements vocaux pour transcription)
- **Utilisation** : Fonctionnalité app, conformité HDS
- **Partage** : Données partagées avec hébergeur HDS certifié uniquement
- **Sécurité** : Chiffrement en transit et au repos

**Permissions (AndroidManifest.xml) :**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.INTERNET" />
```

**Target API Level :**
- **Target SDK** : Android 13 (API 33) minimum (exigence Google Play 2023+)
- **Compile SDK** : Android 14 (API 34) pour accès aux dernières APIs

**Mentions légales Google Play :**
- Description complète (4000 caractères max) : explication claire app professionnelle santé
- Politique de confidentialité : lien HTTPS obligatoire
- Public cible : "Professionnels de santé" (pas grand public)
- Contenu sensible : "Données médicales — réservé professionnels"

### Technical Architecture Considerations

**Performance cibles mobile :**
- **Cold start** : < 3 secondes (première ouverture)
- **Warm start** : < 1 seconde (retour app en background)
- **Génération planning** : < 5 secondes (algorithme optimisation)
- **Synchronisation** : < 10 secondes pour 50 patients (réseau 4G)
- **Taille app** : < 50 MB (téléchargement initial)

**Gestion mémoire :**
- **React Native** : optimisation bundle JavaScript (code splitting)
- **Images** : lazy loading, compression, cache local
- **Base SQLite** : indexation optimisée, requêtes asynchrones
- **Background tasks** : synchronisation en arrière-plan (iOS BackgroundFetch, Android WorkManager)

**Gestion batterie :**
- **Localisation** : mode "significant location changes" (pas de tracking continu)
- **Synchronisation** : batch updates (pas de polling continu)
- **Notifications** : Firebase push (pas de polling local)
- **Optimisation** : désactivation features non critiques si batterie faible

**Tests spécifiques mobile :**
- **Devices** : tests sur iPhone (iOS) et Samsung/Pixel (Android) minimum
- **Réseau** : tests en conditions dégradées (3G, zones blanches, perte réseau)
- **Permissions** : tests avec permissions refusées (fallback)
- **Interruptions** : tests appels entrants, notifications, multitâche

### Implementation Considerations

**Expo vs React Native Bare :**
- **MVP** : démarrage avec Expo (rapidité développement, OTA updates)
- **Limitation Expo** : si besoin modules natifs spécifiques non supportés → migration Bare Workflow
- **Stratégie** : Expo jusqu'à blocage technique, puis eject si nécessaire

**Modules natifs critiques :**
- **react-native-sqlite-storage** : SQLite local
- **@react-native-community/geolocation** : GPS
- **react-native-audio** : enregistrement vocal
- **react-native-biometrics** : Face ID / Touch ID
- **@react-native-firebase** : Firebase Cloud Messaging

**Build & Déploiement :**
- **CI/CD** : GitHub Actions ou Expo EAS Build
- **Signing** : certificats iOS (Apple Developer) + Android (Keystore)
- **Beta testing** : TestFlight (iOS) + Google Play Internal Testing (Android)
- **OTA Updates** : Expo Updates pour hotfixes (pas besoin revalidation store)

**Monitoring & Analytics :**
- **Crash reporting** : Sentry ou Firebase Crashlytics
- **Performance monitoring** : Firebase Performance Monitoring
- **Analytics** : mixpanel ou Firebase Analytics (respect RGPD)
- **Logs** : local logging pour debug offline

---

## Project Scoping & Phased Development

Le scope MVP a été défini de manière à valider les hypothèses clés (gain de temps, fiabilité offline, qualité IA) tout en restant réalisable pour le prototype de soutenance.

### MVP Strategy & Philosophy

**MVP Approach : Problem-Solving MVP + Experience MVP Hybride**

**Objectif principal** :
- Prouver que KURA **résout vraiment le problème** : IDEL gagne 30+ min/jour
- Offrir une **expérience suffisamment bonne** pour convaincre (UI moderne, offline fiable)
- Valider les innovations (planning IA, transcription vocale)

**Philosophie** :
- **Lean mais complet** : toutes les fonctionnalités essentielles, mais en version simple
- **Qualité > Quantité** : mieux vaut 5 features parfaites que 10 features buggées
- **Validable rapidement** : prototype soutenance testable par 4 utilisateurs réels
- **Évolutif** : architecture prévue pour V2 (facturation) dès V1

**Critère de réussite MVP** :
> "4/4 testeurs confirment un gain de temps réel et significatif avec 0 bug bloquant en démo"

**Évaluation Complexité Projet** : **Complexe**
- Domaine healthcare (HDS, RGPD, données sensibles)
- Innovation technique (offline-first + IA vocale + planning intelligent)
- Multi-plateforme (iOS + Android + Web back office)
- Multi-utilisateurs (3 rôles, isolation stricte)

**Ressources Requises** :
- **Équipe minimum viable** : 1 dev full-stack + PM/testeur + 4 testeurs terrain
- **Timeline** : jusqu'à date soutenance
- **Infrastructure** : Hébergeur HDS certifié, Firebase (notifications), Expo (build mobile)

### MVP Feature Set (Phase 1)

**Core User Journeys Supportés :**

**Parcours complets :**
- ✅ **Marie (IDEL principale)** : optimisation planning + transmissions vocales → gain temps mesurable
- ✅ **Admin structure (Claire)** : configuration initiale + gestion utilisateurs + attribution patients

**Parcours partiels :**
- ⚠️ **Michel (IDEL réticent)** : onboarding simplifié, peut utiliser partiellement (planning OU transmissions)
- ⚠️ **Médecin prescripteur** : lecture seule graphiques basiques (pas dashboards avancés)

**Parcours différés V2 :**
- ❌ **Sophie (analytics rentabilité)** : pas d'analytics avancés en V1

**Must-Have Capabilities (Obligatoires MVP) :**

**1. Authentification & Sécurité (Socle)**
- MFA/FIDO2 + authentification biométrique optionnelle
- Chiffrement AES-256 bout en bout
- JWT local pour authentification offline
- Conformité HDS via partenaire certifié

**2. Gestion Patients (Base)**
- CRUD complet (création, lecture, modification, suppression)
- Attribution patients ↔ IDEL par admin
- Historique constantes avec visualisation simple (courbes basiques)
- Isolation multi-tenant stricte (étanchéité entre structures)

**3. Planning Intelligent (Innovation Clé)**
- Algorithme optimisation type "voyageur de commerce" adapté contraintes IDEL
- Génération automatique planning basée sur patients, localisations, préférences
- Modification manuelle intuitive (glisser-déposer)
- Recalcul instantané si changement (patient absent, urgence)
- Génération en < 5 secondes

**4. Transmissions (Innovation Clé)**
- **Saisie vocale IA** : intégration Superwhisper, transcription locale, validation humaine obligatoire
- **Saisie écrite simplifiée** : formulaire optimisé mobile
- **Templates prédéfinis** : 3-5 types de soins courants (toilette, pansement, injection, prise constantes, autre)
- **Audit trail complet** : version originale IA + version validée + auteur + timestamp

**5. Mode Offline-First (Pilier Architectural)**
- SQLite local chiffré (SQLCipher AES-256)
- Synchronisation automatique bidirectionnelle (serveur PostgreSQL HDS)
- Queue persistante avec retry automatique (backoff exponentiel)
- Indicateur visuel statut synchronisation (badge "non synchronisé")
- Fonctionne 100% sans réseau

**6. Gestion Rôles (Contexte Professionnel)**
- **Admin structure** : vision globale, configuration, gestion utilisateurs, attribution patients
- **IDEL collaborateur** : accès limité patients assignés uniquement
- **Médecin prescripteur** : lecture seule, graphiques constantes de ses patients, isolation stricte

**7. Notifications Push (Fonctionnalité Critique)**
- Firebase Cloud Messaging (iOS + Android)
- Types critiques : nouveau patient assigné, urgence ajoutée, modification planning
- Types informatifs : rappel patient prochain, synchronisation terminée
- Pas de données sensibles dans corps notification (sécurité HDS)

**Simplifications Acceptables MVP :**
- **Templates transmissions** : 3-5 types seulement (pas 50)
- **Graphiques patients** : visualisation simple courbes (pas dashboards avancés)
- **Notifications** : types critiques + informatifs basiques (pas toutes les catégories possibles)
- **Algorithme planning** : version initiale déterministe (pas encore ML adaptatif)
- **Support utilisateur** : email uniquement (pas chat live)

**Livrables MVP (Prototype Soutenance) :**
- Application mobile iOS + Android fonctionnelle (React Native/Expo)
- Back Office web opérationnel (administration structures)
- Mode offline avec synchronisation testée zones blanches
- Authentification MFA conforme HDS
- Documentation technique (architecture, déploiement, sécurité)
- Tests réalisés avec 4 testeurs réels (validation gain temps)

### Post-MVP Features

**Phase 2 : Post-MVP / Growth (6-12 mois)**

**Objectif** : Devenir le tout-en-un IDEL remplaçant Vega/Ozzen

**Scan Automatique Ordonnances (Priorité Haute)** :
- OCR/IA pour extraction automatique cotations
- Pré-remplissage facturation
- Gain de temps administratif supplémentaire
- Justification : demande terrain identifiée, différenciateur fort

**Facturation Intégrée** :
- Cotations NGAP automatiques
- Télétransmission CPAM
- Intégration API logiciels facturation existants (Vega, autres)
- Architecture données : séparation médicales/administratives déjà prévue V1

**Analytics Temps Réel** :
- Mesure précise temps gagné (tracking dans app)
- Taux d'acceptation suggestions planning (métriques IA)
- Dashboard rentabilité pour Sophie (revenus, km parcourus, temps facturable)
- NPS (Net Promoter Score) auprès utilisateurs

**Amélioration Continue Algorithme Planning** :
- Machine learning sur préférences utilisateur (apprentissage adaptatif)
- Optimisation basée sur historique réel (patterns individuels)
- Suggestions personnalisées par IDEL

**Graphiques Patients Avancés** :
- Dashboards évolution multi-paramètres
- Alertes seuils (tension hors norme, détérioration)
- Export rapports PDF pour médecins

**Parcours Utilisateurs Enrichis** :
- **Sophie (débutante)** : analytics rentabilité complets, conseils optimisation
- **Michel** : support dédié, tutoriels vidéo, onboarding accompagné renforcé

**Phase 3 : Expansion / Vision (2-3 ans)**

**Objectif** : Écosystème santé libérale multi-professions

**Extension Multi-Professions** :
- Kinésithérapeutes libéraux (adaptation algorithme planning, templates spécifiques)
- Sages-femmes (suivi grossesse, protocoles spécialisés)
- Orthophonistes, ergothérapeutes
- Autres professions paramédicales libérales

**Intégration DMP (Dossier Médical Partagé)** :
- Partage transmissions avec médecins et hôpitaux
- Interopérabilité HL7 FHIR complète
- Contribution au parcours de soins coordonné

**IA Prédictive** :
- Anticipation besoins patients basée sur historique (risque détérioration)
- Alertes prédictives pour médecins prescripteurs
- Optimisation prédictive des tournées (prévision durée soins)

**Écosystème Multi-Structures** :
- Collaboration inter-structures (remplacement, partage patients)
- Mutualisation de ressources
- Réseaux de soins coordonnés territoriaux

**Gamification & Engagement** :
- Mécaniques d'engagement utilisateur (badges, objectifs)
- Communauté IDEL intégrée (forum, partage bonnes pratiques)
- Formation continue intégrée

### Risk Mitigation Strategy

**Risques Techniques & Mitigations**

**Risque 1 : Complexité offline-first + HDS**
- **Impact** : Bugs synchronisation, perte données, non-conformité → blocage MVP
- **Probabilité** : Moyenne (architecture complexe, domaine réglementé)
- **Mitigation** :
  - Partenaire HDS certifié dès V1 (délégation expertise hébergement)
  - Tests approfondis zones blanches avant soutenance (validation terrain réel)
  - Queue persistante avec retry automatique (garantie 0 perte données)
  - Audit sécurité externe avant lancement (validation conformité)
  - Documentation architecture complète (traçabilité décisions techniques)

**Risque 2 : Algorithme planning génère suggestions inadaptées**
- **Impact** : Perte confiance utilisateur, abandon fonctionnalité clé
- **Probabilité** : Moyenne (algorithme V1, pas encore ML)
- **Mitigation** :
  - Contrôle total utilisateur (modification manuelle toujours possible, pas d'imposition)
  - Feedback 4 testeurs avant soutenance (itérations amélioration)
  - Transparence algorithme (afficher pourquoi cette suggestion : distance, durée, contraintes)
  - Amélioration continue V2 avec ML adaptatif
  - **Fallback** : mode manuel pur reste disponible en permanence

**Risque 3 : Transcription IA vocale trop imprécise**
- **Impact** : Validation prend plus de temps que saisie manuelle → pas de gain, frustration
- **Probabilité** : Faible (Superwhisper mature, français supporté nativement)
- **Mitigation** :
  - Tests MVP avec mère et sœur IDEL (validation terrain qualité transcription)
  - Vocabulaire personnalisé Superwhisper (terminologie médicale IDEL, noms médicaments, acronymes)
  - **Décision go/no-go MVP** : si gain temps insuffisant lors tests → désactivation IA vocale V1, report V2
  - **Fallback permanent** : saisie textuelle + templates toujours disponibles (utilisateur choisit)

**Risque 4 : Délais développement dépassés (retard MVP)**
- **Impact** : Prototype incomplet pour soutenance
- **Probabilité** : Moyenne (projet ambitieux, complexité technique)
- **Mitigation** :
  - **Priorisation stricte** : features critiques d'abord (auth → patients → planning → transmissions)
  - Expo pour rapidité développement (OTA updates, moins code natif)
  - Simplifications MVP acceptées (templates limités, graphiques basiques)
  - **Plan B si retard critique** : désactivation IA vocale en MVP (focus planning + transmissions textuelles), report V2
  - **MVP minimum absolu** : Auth + Patients + Planning + Transmissions textuelles + Offline basique

**Risques Marché & Validation**

**Risque 5 : IDEL ne perçoivent pas gain de temps suffisant**
- **Impact** : Échec adoption, validation terrain négative → échec produit
- **Probabilité** : Faible (sondage 12 IDEL valide douleur, besoin confirmé)
- **Mitigation** :
  - Tests itératifs avec 4 testeurs avant soutenance (ajustements basés feedback)
  - Visualisation concrète temps gagné (timer, feedback visuel dans app)
  - Ajustement algorithme et UX selon retours terrain
  - Validation "moment Waouh" avant démo finale (confirmation conviction utilisateur)
  - Mesure objective : chronomètre temps avant/après KURA

**Risque 6 : Résistance au changement (adoption lente post-MVP)**
- **Impact** : Marché lent à adopter, besoin marketing/sales important, croissance ralentie
- **Probabilité** : Moyenne (IDEL +45 ans majoritaires, habitudes ancrées)
- **Mitigation** :
  - Mode hybride suggestion/manuel (pas d'imposition IA, utilisateur garde contrôle)
  - Onboarding progressif (Michel peut n'utiliser que certaines fonctionnalités)
  - Stratégie bouche-à-oreille (early adopters ambassadrices recommandent pairs)
  - Support dédié et accompagnement au changement
  - Démonstration concrète ROI (30+ min gagnées/jour = X€ facturables en plus)

**Risques Ressources**

**Risque 7 : Équipe réduite ou moins de ressources que prévu**
- **Impact** : Fonctionnalités MVP réduites, qualité compromise, retards
- **Probabilité** : Variable (dépend contexte projet)
- **Mitigation** :
  - **MVP minimum absolu défini** : Si ressources critiquement réduites, prioriser :
    1. Auth + Patients (socle obligatoire)
    2. Planning intelligent (différenciateur #1)
    3. Transmissions textuelles uniquement (pas IA vocale si manque temps)
    4. Offline basique (sync simple sans gestion conflits avancée)
  - Expo (rapidité développement, moins code natif à écrire)
  - Réutilisation bibliothèques open-source (ne pas réinventer roue)
  - **Équipe minimum viable** : 1 dev full-stack + PM/testeur + testeurs terrain
  - Simplifications UI/UX acceptables (wireframes simples, pas design avancé)

---

## Functional Requirements

Les exigences fonctionnelles définissent le contrat de capacités complet du produit. Chaque FR est une capacité testable que le système DOIT fournir. Ces FRs serviront de base pour la conception UX, l'architecture technique et le découpage en epics.

### Authentification & Gestion des Comptes

**FR1** : Les utilisateurs peuvent créer un compte avec email, mot de passe et validation MFA (FIDO2/WebAuthn)

**FR2** : Les utilisateurs peuvent s'authentifier avec email + mot de passe + second facteur (FIDO2, SMS, ou application authenticator)

**FR3** : Les utilisateurs peuvent s'authentifier via biométrie (Face ID, Touch ID, empreinte digitale) si appareil compatible

**FR4** : Les utilisateurs peuvent s'authentifier en mode offline avec JWT local après première connexion online

**FR5** : Les utilisateurs peuvent réinitialiser leur mot de passe via lien email sécurisé

**FR6** : Les utilisateurs peuvent déconnecter tous leurs appareils à distance depuis paramètres de sécurité

**FR7** : Les admins peuvent révoquer l'accès d'un appareil compromis (vol/perte téléphone)

**FR8** : Le système déconnecte automatiquement les utilisateurs après 15 minutes d'inactivité

### Gestion des Structures & Utilisateurs

**FR9** : Les admins peuvent créer une structure professionnelle (cabinet, réseau IDEL)

**FR10** : Les admins peuvent inviter des IDEL collaborateurs par email avec rôle assigné

**FR11** : Les admins peuvent inviter des médecins prescripteurs par email avec accès lecture seule

**FR12** : Les admins peuvent définir les rôles et permissions (Admin, IDEL collaborateur, Médecin prescripteur)

**FR13** : Les admins peuvent désactiver ou supprimer un compte utilisateur

**FR14** : Les utilisateurs peuvent voir la liste des membres de leur structure avec leurs rôles

**FR15** : Les utilisateurs peuvent modifier leurs informations de profil (nom, préférences, photo)

### Gestion des Patients

**FR16** : Les IDEL et admins peuvent créer un nouveau dossier patient avec informations administratives (nom, adresse, téléphone, médecin traitant)

**FR17** : Les IDEL et admins peuvent consulter la fiche complète d'un patient assigné

**FR18** : Les IDEL et admins peuvent modifier les informations d'un patient

**FR19** : Les IDEL et admins peuvent archiver ou supprimer un dossier patient (avec confirmation et conformité RGPD)

**FR20** : Les admins peuvent attribuer ou retirer un patient à un IDEL collaborateur

**FR21** : Les IDEL collaborateurs peuvent uniquement accéder aux patients qui leur sont assignés

**FR22** : Les IDEL peuvent visualiser l'historique complet des transmissions d'un patient

**FR23** : Les IDEL peuvent visualiser l'évolution des constantes d'un patient sous forme de graphiques simples (courbes)

**FR24** : Les médecins prescripteurs peuvent consulter en lecture seule les données de suivi de leurs patients uniquement

**FR25** : Les utilisateurs peuvent rechercher un patient par nom, adresse ou médecin traitant

**FR26** : Les utilisateurs peuvent filtrer la liste des patients par statut (actif, archivé)

**FR27** : Le système assure l'isolation stricte des données patients entre structures (multi-tenant)

### Planning Intelligent

**FR28** : Les IDEL peuvent voir leur planning quotidien avec liste des patients à visiter

**FR29** : Le système génère automatiquement un planning optimisé basé sur les patients, localisations et préférences utilisateur

**FR30** : Les IDEL peuvent modifier manuellement l'ordre des patients dans le planning (glisser-déposer ou réorganisation)

**FR31** : Le système recalcule instantanément le planning si un patient est ajouté, retiré ou modifié

**FR32** : Les IDEL peuvent marquer un patient comme "absent" et le planning se réorganise automatiquement

**FR33** : Les IDEL peuvent ajouter une urgence au planning et le système propose une insertion optimale

**FR34** : Les IDEL peuvent voir l'itinéraire optimisé entre patients sur une carte (GPS intégré)

**FR35** : Les IDEL peuvent voir la durée estimée des trajets entre patients

**FR36** : Les IDEL peuvent définir leurs préférences de planning (horaires souhaités, pauses, zones géographiques prioritaires)

**FR37** : Le système affiche pourquoi un patient est suggéré à un certain moment (distance, contrainte horaire, durée soin)

**FR38** : Les IDEL peuvent basculer en mode manuel pur (désactivation suggestions automatiques)

### Transmissions & Documentation

**FR39** : Les IDEL peuvent saisir une transmission par dictée vocale (IA transcrit localement avec Superwhisper)

**FR40** : Les IDEL doivent obligatoirement valider ou corriger la transcription IA avant enregistrement

**FR41** : Les IDEL peuvent saisir une transmission par saisie écrite avec formulaire simplifié

**FR42** : Les IDEL peuvent utiliser un template prédéfini selon le type de soin (toilette, pansement, injection, prise constantes, autre)

**FR43** : Les IDEL peuvent enregistrer les constantes vitales d'un patient (tension, température, glycémie, poids, saturation O2)

**FR44** : Le système enregistre un audit trail complet pour chaque transmission (version originale IA, version validée, auteur, timestamp)

**FR45** : Les IDEL peuvent consulter l'historique des transmissions d'un patient avec dates et auteurs

**FR46** : Les IDEL peuvent modifier ou supprimer une transmission existante (avec traçabilité)

**FR47** : Les médecins prescripteurs peuvent consulter les transmissions de leurs patients en lecture seule

**FR48** : Les IDEL peuvent désactiver la saisie vocale IA et utiliser uniquement saisie textuelle

### Mode Offline & Synchronisation

**FR49** : Les IDEL peuvent utiliser 100% des fonctionnalités de l'application sans connexion réseau

**FR50** : Le système stocke localement les données patients assignés, planning de la semaine et transmissions en attente

**FR51** : Le système synchronise automatiquement les données dès qu'une connexion réseau est disponible

**FR52** : Les IDEL peuvent déclencher manuellement une synchronisation (pull-to-refresh)

**FR53** : Le système affiche un indicateur visuel clair du statut de synchronisation (synchronisé, en cours, non synchronisé)

**FR54** : Le système affiche un badge "non synchronisé" sur les données en attente de synchronisation

**FR55** : Le système notifie l'utilisateur si la synchronisation échoue après 24 heures

**FR56** : Le système applique la règle "serveur gagne" en cas de conflit de données (priorité données serveur)

**FR57** : Le système conserve un historique des synchronisations pour débogage

**FR58** : Les IDEL peuvent effacer toutes les données locales lors de désinscription d'un appareil

### Notifications & Alertes

**FR59** : Les utilisateurs reçoivent une notification push quand un nouveau patient leur est assigné

**FR60** : Les utilisateurs reçoivent une notification push quand une urgence est ajoutée à leur planning

**FR61** : Les utilisateurs reçoivent une notification push quand leur planning est modifié par un admin

**FR62** : Les utilisateurs reçoivent une notification push quand leur appareil est révoqué

**FR63** : Les utilisateurs reçoivent une notification informative 15 minutes avant le prochain patient

**FR64** : Les utilisateurs reçoivent une notification quand la synchronisation est terminée avec succès

**FR65** : Les utilisateurs reçoivent une notification locale programmée en début de journée avec récapitulatif planning

**FR66** : Les utilisateurs peuvent activer ou désactiver chaque type de notification dans les paramètres

**FR67** : Le système n'affiche jamais de données sensibles (nom patient, détails médicaux) dans le corps des notifications push

### Back Office Web (Administration)

**FR68** : Les admins peuvent accéder au back office via navigateur web depuis desktop

**FR69** : Les admins peuvent visualiser la liste complète de tous les patients de leur structure

**FR70** : Les admins peuvent visualiser la liste de tous les IDEL collaborateurs avec leurs patients assignés

**FR71** : Les admins peuvent importer une liste de patients via fichier CSV

**FR72** : Les admins peuvent exporter les données patients en format CSV ou PDF

**FR73** : Les admins peuvent voir un tableau de bord avec statistiques d'utilisation (nombre de patients, IDEL actifs, transmissions saisies)

**FR74** : Les admins peuvent réassigner un patient d'un IDEL à un autre en quelques clics

**FR75** : Les admins peuvent modifier le planning d'un IDEL collaborateur depuis le back office (ajouter, retirer, réorganiser patients)

### Conformité & Sécurité (Capacités Obligatoires HDS/RGPD)

**FR76** : Le système chiffre toutes les données de santé au repos (AES-256)

**FR77** : Le système chiffre toutes les données en transit (TLS 1.3)

**FR78** : Le système enregistre tous les accès aux données de santé dans un journal d'audit immuable

**FR79** : Les utilisateurs peuvent exporter l'intégralité de leurs données patients (droit à la portabilité RGPD)

**FR80** : Les utilisateurs peuvent demander la suppression complète d'un dossier patient (droit à l'oubli RGPD)

**FR81** : Le système conserve les données médicales pendant 10 ans à compter de la dernière consultation (conformité réglementaire)

**FR82** : Le système sépare architecturalement les données médicales (HDS) des données administratives (facturation V2)

**FR83** : Le système affiche un disclaimer clair : "L'utilisateur reste seul responsable des informations saisies et validées"

**FR84** : Les utilisateurs peuvent consulter l'historique complet des accès à leurs données (logs audit)

---

## Non-Functional Requirements

Les exigences non-fonctionnelles spécifient les attributs de qualité du système : performance, sécurité, fiabilité. Contrairement aux FRs qui définissent QUOI faire, les NFRs définissent COMMENT LE FAIRE avec quelle qualité.

### Performance

**NFR-PERF-1 : Temps de Démarrage Application**
- **Cold start** (première ouverture) : < 3 secondes sur appareil mid-range
- **Warm start** (retour depuis background) : < 1 seconde
- **Mesure** : timer intégré dans app, monitoring Firebase Performance

**NFR-PERF-2 : Génération Planning Intelligent**
- Planning optimisé généré en < 5 secondes pour jusqu'à 15 patients/jour
- Recalcul instantané après modification : < 2 secondes
- **Mesure** : timestamp début/fin algorithme, performance monitoring

**NFR-PERF-3 : Temps de Chargement Données Offline**
- Accès données locales (liste patients, planning) : < 2 secondes
- Ouverture fiche patient avec historique : < 3 secondes
- **Mesure** : timer requêtes SQLite, profiling performance

**NFR-PERF-4 : Synchronisation Données**
- Synchronisation 50 patients avec historique 6 mois : < 10 secondes (réseau 4G)
- Synchronisation incrémentale (nouvelles transmissions) : < 3 secondes
- **Mesure** : timer sync, monitoring réseau, analytics usage

**NFR-PERF-5 : Taille Application**
- Taille téléchargement initial : < 50 MB
- Taille base de données locale : ~50-200 MB pour 50 patients (historique 6 mois)
- **Mesure** : taille bundle app stores, monitoring stockage local

**NFR-PERF-6 : Consommation Batterie**
- Application ne doit pas consommer > 5% batterie/heure en utilisation active
- Mode background (sync uniquement) : < 1% batterie/heure
- **Mesure** : profiling iOS/Android battery usage

### Security

**NFR-SEC-1 : Chiffrement Données**
- Toutes les données de santé chiffrées au repos : AES-256
- Toutes les données en transit chiffrées : TLS 1.3 minimum
- Stockage local mobile chiffré : SQLCipher avec clé liée authentification utilisateur
- **Mesure** : audit sécurité, tests pénétration, validation certificats

**NFR-SEC-2 : Authentification Forte**
- MFA obligatoire pour tous les utilisateurs (FIDO2/WebAuthn préféré)
- Authentification biométrique optionnelle (Face ID/Touch ID) comme second facteur
- Session timeout automatique après 15 minutes d'inactivité
- **Mesure** : audit logs authentification, tests sécurité

**NFR-SEC-3 : Gestion des Secrets**
- Clés de chiffrement stockées dans HSM (Hardware Security Module) ou vault sécurisé
- Pas de secrets (API keys, tokens) hardcodés dans code source
- Rotation clés de chiffrement tous les 90 jours
- **Mesure** : audit code, revue infrastructure, pentest

**NFR-SEC-4 : Audit Logging**
- 100% des accès aux données de santé enregistrés dans logs immuables (append-only)
- Logs conservés 3 ans minimum (conformité RGPD + HDS)
- Logs incluent : qui, quand, quelle donnée, action effectuée
- **Mesure** : audit conformité, vérification logs, tests immutabilité

**NFR-SEC-5 : Isolation Multi-Tenant**
- Étanchéité absolue des données entre structures (isolation base de données)
- Tests automatisés d'isolation (utilisateur structure A ne peut jamais accéder données structure B)
- **Mesure** : tests automatisés sécurité, audit architecture

**NFR-SEC-6 : Protection Données Sensibles**
- Pas de données patient sensibles dans notifications push
- Pas de données médicales dans logs applicatifs non chiffrés
- Effacement sécurisé (wipe) données locales si appareil révoqué
- **Mesure** : revue code, tests sécurité, audit notifications

**NFR-SEC-7 : Conformité HDS**
- Hébergement données santé via partenaire HDS certifié
- Plan de Reprise d'Activité (PRA) et Plan de Continuité d'Activité (PCA) documentés
- Audit annuel de conformité HDS par organisme certifié
- **Mesure** : certification HDS hébergeur, audits annuels, documentation PRA/PCA

**NFR-SEC-8 : Conformité RGPD**
- Consentement explicite utilisateur pour traitement données personnelles de santé
- Export complet données utilisateur possible en < 24h (droit portabilité)
- Suppression complète données utilisateur en < 72h après demande (droit à l'oubli)
- **Mesure** : tests procédures RGPD, validation DPO, documentation traitements

### Reliability

**NFR-REL-1 : Disponibilité Offline**
- 100% des fonctionnalités critiques accessibles sans réseau (patients, planning, transmissions)
- Données stockées localement : patients assignés + planning 2 semaines + transmissions en attente
- **Mesure** : tests mode avion, validation zones blanches terrain

**NFR-REL-2 : Fiabilité Synchronisation**
- 0 perte de données garantie (queue persistante avec retry automatique)
- Retry automatique avec backoff exponentiel : 1s, 2s, 4s, 8s, ..., max 60s
- Synchronisation réussie dans 95% des cas en < 10 secondes (conditions réseau normales)
- **Mesure** : monitoring sync, logs erreurs, analytics success rate

**NFR-REL-3 : Gestion Conflits**
- Résolution automatique conflits : règle "serveur gagne" (données serveur prioritaires)
- Historique conflits conservé pour analyse et débogage
- **Mesure** : tests conflits simulés, logs résolution, validation comportement

**NFR-REL-4 : Stabilité Application**
- Taux de crash < 1% des sessions utilisateur (99% stabilité)
- Aucun bug bloquant en production MVP (démo soutenance)
- Crash reporting temps réel (Sentry ou Firebase Crashlytics)
- **Mesure** : crash analytics, tests QA, monitoring production

**NFR-REL-5 : Sauvegarde & Récupération**
- Sauvegarde automatique chiffrée toutes les 24h (données serveur)
- Rétention backups : 30 jours rolling + archivage annuel
- Temps de récupération données (RTO) : < 4 heures
- **Mesure** : tests restauration, documentation procédures, validation RTO

**NFR-REL-6 : Disponibilité Serveur**
- Uptime serveur backend : 99.5% minimum (équivaut à ~3.65h downtime/mois acceptable)
- Maintenance programmée annoncée 48h à l'avance, en dehors heures ouvrées
- **Mesure** : monitoring uptime, SLA hébergeur HDS, alertes downtime

### Integration

**NFR-INT-1 : Firebase Cloud Messaging**
- Notifications push délivrées en < 5 secondes après événement déclencheur
- Taux de délivrance : > 95% (iOS + Android combinés)
- **Mesure** : analytics Firebase, monitoring délais, success rate

**NFR-INT-2 : Superwhisper (Transcription Vocale)**
- Transcription locale complète (aucune donnée envoyée cloud externe)
- Support français natif avec vocabulaire personnalisé (terminologie médicale IDEL)
- Latence transcription : < 3 secondes pour transmission moyenne 30 secondes audio
- **Mesure** : timer transcription, validation confidentialité, tests qualité

**NFR-INT-3 : APIs Futures (V2 - Anticipation Architecture)**
- **CPAM** (télétransmission facturation) : format XML conforme normes SESAM-Vitale
- **DMP** (Dossier Médical Partagé) : interopérabilité HL7 FHIR R4
- Rate limiting API : 100 requêtes/minute/utilisateur (protection DoS)
- **Mesure** : tests intégration, validation formats, monitoring API usage

**NFR-INT-4 : Export/Import Données**
- Export données patients : formats JSON, CSV, PDF (portabilité RGPD)
- Import patients via CSV : jusqu'à 500 patients en < 30 secondes
- **Mesure** : tests performance import, validation formats export

### Scalability

**NFR-SCAL-1 : Croissance Utilisateurs**
- Architecture doit supporter 10x croissance utilisateurs sans refonte majeure
- Performance dégradation < 10% avec charge 10x supérieure
- **Mesure** : load testing, architecture review, stress tests

**NFR-SCAL-2 : Croissance Données**
- Base de données doit supporter 100 000+ patients avec performance constante
- Indexation optimisée : requêtes recherche patients en < 500ms même avec 100k patients
- **Mesure** : tests charge base données, profiling requêtes SQL

**NFR-SCAL-3 : Concurrence Utilisateurs**
- Support 1000 utilisateurs concurrents sans dégradation performance
- Synchronisation simultanée : 100 appareils peuvent sync en même temps sans saturation serveur
- **Mesure** : load testing concurrentiel, monitoring serveur, stress tests

### Accessibility

**NFR-ACC-1 : Support Appareils**
- Support iPhone 6s et plus récents (iOS 14+)
- Support Android 8.0+ (API 26+) couvrant 95%+ du marché
- Support résolutions écran : 320px à 1440px width
- **Mesure** : tests multi-devices, analytics usage appareil

**NFR-ACC-2 : Utilisabilité Interfaces**
- Interface utilisable en plein soleil (contraste suffisant)
- Taille police minimum : 16px (lisibilité pour Michel +45 ans)
- Boutons tactiles minimum : 44x44px (recommandation Apple/Android)
- **Mesure** : tests UX, feedback utilisateurs, validation accessibilité

**NFR-ACC-3 : Support Langues**
- Interface en français (langue principale)
- Transcription vocale : français natif avec accent régional supporté
- **Mesure** : tests linguistiques, validation Superwhisper

**NFR-ACC-4 : Conditions Réseau Dégradées**
- Application fonctionne en 3G (débit minimum 1 Mbps pour synchronisation)
- Tolérance perte connexion : pas de crash si réseau coupé brusquement
- **Mesure** : tests network throttling, simulation zones blanches
