---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics"]
inputDocuments:
  - type: prd
    path: "_bmad-output/planning-artifacts/prd.md"
    loaded: true
  - type: architecture
    path: "_bmad-output/planning-artifacts/architecture.md"
    loaded: true
  - type: ux-design
    path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    loaded: true
project_name: "idel-app (KURA)"
user_name: "Potpot"
date: "2026-02-20"
---

# idel-app (KURA) - Epic Breakdown

## Overview

Ce document fournit le découpage complet en epics et user stories pour KURA (idel-app), décomposant les exigences du PRD, des spécifications UX et de l'architecture en stories implémentables et actionnables pour l'équipe de développement.

## Requirements Inventory

### Functional Requirements

#### Authentification & Gestion des Comptes (FR1–FR8)

FR1 : Les utilisateurs peuvent créer un compte avec email, mot de passe et validation MFA (FIDO2/WebAuthn)
FR2 : Les utilisateurs peuvent s'authentifier avec email + mot de passe + second facteur (FIDO2, SMS, ou application authenticator)
FR3 : Les utilisateurs peuvent s'authentifier via biométrie (Face ID, Touch ID, empreinte digitale) si appareil compatible
FR4 : Les utilisateurs peuvent s'authentifier en mode offline avec JWT local après première connexion online
FR5 : Les utilisateurs peuvent réinitialiser leur mot de passe via lien email sécurisé
FR6 : Les utilisateurs peuvent déconnecter tous leurs appareils à distance depuis paramètres de sécurité
FR7 : Les admins peuvent révoquer l'accès d'un appareil compromis (vol/perte téléphone)
FR8 : Le système déconnecte automatiquement les utilisateurs après 15 minutes d'inactivité

#### Gestion des Structures & Utilisateurs (FR9–FR15)

FR9 : Les admins peuvent créer une structure professionnelle (cabinet, réseau IDEL)
FR10 : Les admins peuvent inviter des IDEL collaborateurs par email avec rôle assigné
FR11 : Les admins peuvent inviter des médecins prescripteurs par email avec accès lecture seule
FR12 : Les admins peuvent définir les rôles et permissions (Admin, IDEL collaborateur, Médecin prescripteur)
FR13 : Les admins peuvent désactiver ou supprimer un compte utilisateur
FR14 : Les utilisateurs peuvent voir la liste des membres de leur structure avec leurs rôles
FR15 : Les utilisateurs peuvent modifier leurs informations de profil (nom, préférences, photo)

#### Gestion des Patients (FR16–FR27)

FR16 : Les IDEL et admins peuvent créer un nouveau dossier patient avec informations administratives (nom, adresse, téléphone, médecin traitant)
FR17 : Les IDEL et admins peuvent consulter la fiche complète d'un patient assigné
FR18 : Les IDEL et admins peuvent modifier les informations d'un patient
FR19 : Les IDEL et admins peuvent archiver ou supprimer un dossier patient (avec confirmation et conformité RGPD)
FR20 : Les admins peuvent attribuer ou retirer un patient à un IDEL collaborateur
FR21 : Les IDEL collaborateurs peuvent uniquement accéder aux patients qui leur sont assignés
FR22 : Les IDEL peuvent visualiser l'historique complet des transmissions d'un patient
FR23 : Les IDEL peuvent visualiser l'évolution des constantes d'un patient sous forme de graphiques simples (courbes)
FR24 : Les médecins prescripteurs peuvent consulter en lecture seule les données de suivi de leurs patients uniquement
FR25 : Les utilisateurs peuvent rechercher un patient par nom, adresse ou médecin traitant
FR26 : Les utilisateurs peuvent filtrer la liste des patients par statut (actif, archivé)
FR27 : Le système assure l'isolation stricte des données patients entre structures (multi-tenant)

#### Planning Intelligent (FR28–FR38)

FR28 : Les IDEL peuvent voir leur planning quotidien avec liste des patients à visiter
FR29 : Le système génère automatiquement un planning optimisé basé sur les patients, localisations et préférences utilisateur
FR30 : Les IDEL peuvent modifier manuellement l'ordre des patients dans le planning (glisser-déposer ou réorganisation)
FR31 : Le système recalcule instantanément le planning si un patient est ajouté, retiré ou modifié
FR32 : Les IDEL peuvent marquer un patient comme "absent" et le planning se réorganise automatiquement
FR33 : Les IDEL peuvent ajouter une urgence au planning et le système propose une insertion optimale
FR34 : Les IDEL peuvent voir l'itinéraire optimisé entre patients sur une carte (GPS intégré)
FR35 : Les IDEL peuvent voir la durée estimée des trajets entre patients
FR36 : Les IDEL peuvent définir leurs préférences de planning (horaires souhaités, pauses, zones géographiques prioritaires)
FR37 : Le système affiche pourquoi un patient est suggéré à un certain moment (distance, contrainte horaire, durée soin)
FR38 : Les IDEL peuvent basculer en mode manuel pur (désactivation suggestions automatiques)

#### Transmissions & Documentation (FR39–FR48)

FR39 : Les IDEL peuvent saisir une transmission par dictée vocale (IA transcrit localement avec Superwhisper)
FR40 : Les IDEL doivent obligatoirement valider ou corriger la transcription IA avant enregistrement
FR41 : Les IDEL peuvent saisir une transmission par saisie écrite avec formulaire simplifié
FR42 : Les IDEL peuvent utiliser un template prédéfini selon le type de soin (toilette, pansement, injection, prise constantes, autre)
FR43 : Les IDEL peuvent enregistrer les constantes vitales d'un patient (tension, température, glycémie, poids, saturation O2)
FR44 : Le système enregistre un audit trail complet pour chaque transmission (version originale IA, version validée, auteur, timestamp)
FR45 : Les IDEL peuvent consulter l'historique des transmissions d'un patient avec dates et auteurs
FR46 : Les IDEL peuvent modifier ou supprimer une transmission existante (avec traçabilité)
FR47 : Les médecins prescripteurs peuvent consulter les transmissions de leurs patients en lecture seule
FR48 : Les IDEL peuvent désactiver la saisie vocale IA et utiliser uniquement saisie textuelle

#### Mode Offline & Synchronisation (FR49–FR58)

FR49 : Les IDEL peuvent utiliser 100% des fonctionnalités de l'application sans connexion réseau
FR50 : Le système stocke localement les données patients assignés, planning de la semaine et transmissions en attente
FR51 : Le système synchronise automatiquement les données dès qu'une connexion réseau est disponible
FR52 : Les IDEL peuvent déclencher manuellement une synchronisation (pull-to-refresh)
FR53 : Le système affiche un indicateur visuel clair du statut de synchronisation (synchronisé, en cours, non synchronisé)
FR54 : Le système affiche un badge "non synchronisé" sur les données en attente de synchronisation
FR55 : Le système notifie l'utilisateur si la synchronisation échoue après 24 heures
FR56 : Le système applique la règle "serveur gagne" en cas de conflit de données (priorité données serveur)
FR57 : Le système conserve un historique des synchronisations pour débogage
FR58 : Les IDEL peuvent effacer toutes les données locales lors de désinscription d'un appareil

#### Notifications & Alertes (FR59–FR67)

FR59 : Les utilisateurs reçoivent une notification push quand un nouveau patient leur est assigné
FR60 : Les utilisateurs reçoivent une notification push quand une urgence est ajoutée à leur planning
FR61 : Les utilisateurs reçoivent une notification push quand leur planning est modifié par un admin
FR62 : Les utilisateurs reçoivent une notification push quand leur appareil est révoqué
FR63 : Les utilisateurs reçoivent une notification informative 15 minutes avant le prochain patient
FR64 : Les utilisateurs reçoivent une notification quand la synchronisation est terminée avec succès
FR65 : Les utilisateurs reçoivent une notification locale programmée en début de journée avec récapitulatif planning
FR66 : Les utilisateurs peuvent activer ou désactiver chaque type de notification dans les paramètres
FR67 : Le système n'affiche jamais de données sensibles (nom patient, détails médicaux) dans le corps des notifications push

#### Back Office Web - Administration (FR68–FR75)

FR68 : Les admins peuvent accéder au back office via navigateur web depuis desktop
FR69 : Les admins peuvent visualiser la liste complète de tous les patients de leur structure
FR70 : Les admins peuvent visualiser la liste de tous les IDEL collaborateurs avec leurs patients assignés
FR71 : Les admins peuvent importer une liste de patients via fichier CSV
FR72 : Les admins peuvent exporter les données patients en format CSV ou PDF
FR73 : Les admins peuvent voir un tableau de bord avec statistiques d'utilisation (nombre de patients, IDEL actifs, transmissions saisies)
FR74 : Les admins peuvent réassigner un patient d'un IDEL à un autre en quelques clics
FR75 : Les admins peuvent modifier le planning d'un IDEL collaborateur depuis le back office (ajouter, retirer, réorganiser patients)

#### Conformité & Sécurité - Capacités Obligatoires HDS/RGPD (FR76–FR84)

FR76 : Le système chiffre toutes les données de santé au repos (AES-256)
FR77 : Le système chiffre toutes les données en transit (TLS 1.3)
FR78 : Le système enregistre tous les accès aux données de santé dans un journal d'audit immuable
FR79 : Les utilisateurs peuvent exporter l'intégralité de leurs données patients (droit à la portabilité RGPD)
FR80 : Les utilisateurs peuvent demander la suppression complète d'un dossier patient (droit à l'oubli RGPD)
FR81 : Le système conserve les données médicales pendant 10 ans à compter de la dernière consultation (conformité réglementaire)
FR82 : Le système sépare architecturalement les données médicales (HDS) des données administratives (facturation V2)
FR83 : Le système affiche un disclaimer clair : "L'utilisateur reste seul responsable des informations saisies et validées"
FR84 : Les utilisateurs peuvent consulter l'historique complet des accès à leurs données (logs audit)

---

### Non-Functional Requirements

#### Performance

NFR-PERF-1 : Cold start < 3 secondes | Warm start < 1 seconde
NFR-PERF-2 : Planning optimisé généré en < 5 secondes pour jusqu'à 15 patients/jour ; recalcul < 2 secondes
NFR-PERF-3 : Accès données locales < 2 secondes | Ouverture fiche patient avec historique < 3 secondes
NFR-PERF-4 : Synchronisation 50 patients (historique 6 mois) < 10 secondes en 4G | Sync incrémentale < 3 secondes
NFR-PERF-5 : Taille téléchargement initial < 50 MB | Base de données locale ~50-200 MB pour 50 patients
NFR-PERF-6 : Consommation batterie < 5% par heure en utilisation active | < 1% en background (sync uniquement)

#### Security

NFR-SEC-1 : AES-256 au repos + TLS 1.3 en transit + SQLCipher local (clé liée authentification utilisateur)
NFR-SEC-2 : MFA obligatoire (FIDO2/WebAuthn) + biométrie optionnelle + session timeout 15 min
NFR-SEC-3 : Clés de chiffrement dans HSM/vault | Pas de secrets hardcodés | Rotation clés tous les 90 jours
NFR-SEC-4 : 100% accès données santé enregistrés (logs immuables append-only) | Conservés 3 ans minimum
NFR-SEC-5 : Isolation absolue données entre structures | Tests automatisés d'isolation multi-tenant
NFR-SEC-6 : Pas de données patient dans notifications push | Effacement sécurisé si appareil révoqué
NFR-SEC-7 : Hébergement HDS certifié + PRA/PCA documentés + audit annuel
NFR-SEC-8 : Consentement RGPD explicite | Export données < 24h | Suppression complète < 72h

#### Reliability

NFR-REL-1 : 100% fonctionnalités critiques accessibles sans réseau
NFR-REL-2 : 0 perte de données | Queue persistante + retry exponentiel (1s, 2s, 4s, … max 60s) | Succès sync > 95% en < 10s
NFR-REL-3 : Résolution conflits automatique "serveur gagne" | Historique conflits conservé
NFR-REL-4 : Taux de crash < 1% des sessions | 0 bug bloquant en production MVP
NFR-REL-5 : Sauvegarde automatique chiffrée toutes 24h | Rétention 30 jours rolling + archivage annuel | RTO < 4h
NFR-REL-6 : Uptime serveur > 99.5% | Maintenance annoncée 48h à l'avance hors heures ouvrées

#### Integration

NFR-INT-1 : Firebase FCM — notifications délivrées < 5 secondes | Taux délivrance > 95%
NFR-INT-2 : Whisper on-device — transcription locale (0 cloud) | Support français natif | Latence < 3 secondes pour 30s audio
NFR-INT-3 : APIs futures (CPAM XML SESAM-Vitale, DMP HL7 FHIR R4) | Rate limiting 100 req/min/utilisateur
NFR-INT-4 : Export JSON/CSV/PDF (portabilité RGPD) | Import CSV jusqu'à 500 patients < 30 secondes

#### Scalability

NFR-SCAL-1 : Architecture supporte 10x croissance utilisateurs sans refonte | Dégradation performance < 10%
NFR-SCAL-2 : Base de données supporte 100 000+ patients | Requêtes recherche < 500ms à 100k patients
NFR-SCAL-3 : Support 1000 utilisateurs concurrents | 100 appareils sync simultanément sans saturation

#### Accessibility

NFR-ACC-1 : Support iPhone 6s+ (iOS 14+) et Android 8.0+ (API 26+) | Résolutions 320px–1440px
NFR-ACC-2 : Interface utilisable en plein soleil | Police minimum 16px | Boutons tactiles minimum 44×44px
NFR-ACC-3 : Interface en français | Transcription vocale française avec accents régionaux
NFR-ACC-4 : Application fonctionne en 3G (1 Mbps) | Tolérance perte connexion sans crash

---

### Additional Requirements

#### Architecture — Exigences Techniques Issues de l'Architecture

**Starter Template (Architecture Section 2):**
- Monorepo Turborepo + pnpm workspaces comme structure de projet initiale obligatoire
- App mobile : `npx create-expo-app@latest apps/mobile --template blank-typescript` (Expo SDK 53)
- Back Office web : `npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir` (Next.js 15)
- Package partagé `packages/db/` : Schéma Drizzle ORM (SQLite mobile + PostgreSQL serveur)
- Package partagé `packages/shared/` : Types TypeScript, utilitaires (ULID, dates, constantes)

**Identifiants et Synchronisation :**
- ULID obligatoire pour tous les IDs (jamais auto-increment ni UUID v4 nu)
- Génération client-side (offline) via `ulidx` — triable lexicographiquement (= chronologiquement)
- Sync incrémentale : `GET /api/sync?since={ULID}` — récupère uniquement nouveautés

**ORM et Base de Données :**
- Drizzle ORM (pas Prisma) — 100% TypeScript/JS, compatible expo-sqlite, schéma partagé mobile ↔ serveur
- SQLite local chiffré avec `expo-sqlite` + SQLCipher (AES-256) — clé liée à l'authentification
- PostgreSQL serveur (hébergeur HDS certifié pour production — Neon DB/Railway pour prototype)

**Algorithme Planning :**
- Haversine pour calcul de distances lat/lng (offline, précis courtes distances)
- Nearest Neighbor + 2-opt comme heuristique MVP (O(n²), < 5s pour 15 patients)
- Géocodage via Nominatim OpenStreetMap (gratuit, RGPD-safe) — pipeline async avec fallback gracieux
- Coordonnées lat/lng obligatoires sur entité Patient (champs `latitude`, `longitude`)

**State Management Mobile :**
- Drizzle + expo-sqlite = source de vérité locale (toutes données persistées)
- TanStack Query v5 = cache serveur et synchronisation
- Zustand = état UI global (queue sync, statut offline, filtres actifs)
- React Hook Form = gestion formulaires transmission et patient

**API Backend :**
- REST/JSON via Next.js API Routes sous `/api/v1/`
- Enveloppe uniforme `{ data, error, meta }` sur toutes les routes
- Codes HTTP sémantiques (201 création, 204 suppression, 409 conflit sync…)
- Dates ISO 8601 en JSON, Unix timestamp en SQLite, format display `dd/MM/yyyy HH:mm` (locale fr)

**Règles d'Implémentation Obligatoires (10 règles architecture Section 4.6) :**
1. ULID pour tous les IDs
2. snake_case colonnes DB, camelCase JSON API
3. Enveloppe `{ data, error, meta }` sur toutes routes API
4. Feature-based architecture (pas de dossiers `components/` globaux sauf partagés)
5. Tests co-localisés (`feature.test.ts` à côté de `feature.ts`)
6. Dates ISO 8601 en JSON, Unix timestamp en SQLite
7. Skeleton avant ActivityIndicator pour états de chargement
8. Toute erreur user-facing a une action (Réessayer ou Annuler minimum)
9. SecureStore exclusivement pour JWT et secrets (jamais AsyncStorage)
10. Schéma SQLite identique à PostgreSQL — même schéma Drizzle, deux drivers

**Infrastructure Prototype :**
- PostgreSQL : Neon DB (serverless free tier) ou Railway (EU region)
- API Next.js : Vercel (free tier, EU region)
- Données : Fixtures TypeScript (seed script) avec patients fictifs, coordonnées GPS réelles (zone test)
- Chiffrement SQLCipher et audit logs activés dès le prototype

#### UX Design — Exigences Issues de la Spec UX

**Design System :**
- React Native Paper 5.x (Material Design 3) comme design system principal
- Thème "Teal Nav" : header Teal `#00897B`, fond liste `#F5F5F5`, primaire indigo `#3949AB`
- Dark mode OLED automatique : fond `#000000`, surface `#0D0D1A` (économie batterie iPhone)
- Police natives : SF Pro (iOS) / Roboto (Android) / Inter (web Back Office)
- Taille police minimum : 16px (Body Large) — jamais en dessous pour texte actif
- Touch targets minimum : 48×48px (usage gants hiver, plein soleil)
- Grille 8px (Material Design 3 standard)

**Navigation Mobile :**
- Bottom Navigation 4 tabs permanents : Planning · Patients · Transmissions · Profil
- Portrait uniquement verrouillé (pas de rotation) — stabilité mobilité terrain
- Safe areas systématiques (SafeAreaView) pour encoche iOS et barre Android

**Composants Custom Obligatoires (8 composants) :**
- C1 `PlanningCard` : carte patient draggable avec handle, ETA, statut (états : default/active/done/dragging/absent)
- C2 `CircularProgressRing` : cercle progression journée dans header (SVG natif react-native-svg)
- C3 `VoiceRecorderButton` : hold-to-record (style WhatsApp) + onde sonore animée
- C4 `TranscriptionViewer` : affichage transcription IA + mots incertains surlignés + édition inline + audit trail
- C5 `SyncStatusIndicator` : indicateur 3 états (synced/syncing/pending) en header + bottom sheet détails
- C6 `ConstantesLineChart` : graphiques courbes tension/glycémie/poids (react-native-gifted-charts)
- C7 `MapToggleSection` : carte collapsible avec pins numérotés et polyline route (react-native-maps)
- C8 `TimeSavedWidget` : widget "Temps gagné" avec barre comparative avant/après KURA

**Patterns UX Obligatoires :**
- Maximum 1 bouton primaire par écran
- Actions fréquentes (> 5×/jour) accessibles en maximum 2 taps depuis l'écran principal
- Undo 5 secondes après toute modification planning (Snackbar avec bouton "Annuler")
- Dialog de confirmation obligatoire pour actions destructives (supprimer, marquer absent)
- Haptic feedback sur : validation transmission, drag & drop, patient absent, journée complétée
- Skeleton screens (pas de spinner seul) pour tous les états de chargement
- Chaque erreur user-facing propose une action immédiate (Réessayer/Annuler minimum)

**Back Office Web :**
- Drawer de navigation latérale : Tableau de bord · Patients · IDELs · Paramètres
- Layout responsive : ≥ 1024px desktop (nominal), 768–1023px tablette (drawer collapsé), < 768px non supporté
- Max-width 1200px centré sur wide screens (≥ 1440px)
- Semantic HTML + focus ring visible (`outline: 2px solid #3949AB`) + skip link
- Tailwind CSS + shadcn/ui (Back Office admin)

**Accessibilité WCAG 2.1 AA :**
- Contraste texte minimum 4.5:1 (WCAG AA), 7:1 ciblé sur éléments critiques
- Support VoiceOver (iOS) et TalkBack (Android) avec `accessibilityLabel` + `accessibilityHint` + `accessibilityRole`
- Mode contraste élevé via API système iOS/Android
- Daltonisme : succès/erreur/alerte identifiés toujours par icône + couleur + texte (jamais couleur seule)
- Dynamic Type supporté : `allowFontScaling={true}` + `maxFontSizeMultiplier={1.5}`

---

### FR Coverage Map

| FR | Epic | Domaine |
|----|------|---------|
| FR1 | Epic 1 | Création compte MFA |
| FR2 | Epic 1 | Authentification email + MFA |
| FR3 | Epic 1 | Authentification biométrique |
| FR4 | Epic 1 | Auth offline JWT local |
| FR5 | Epic 1 | Réinitialisation mot de passe |
| FR6 | Epic 1 | Déconnexion distante appareils |
| FR7 | Epic 1 | Révocation appareil compromis |
| FR8 | Epic 1 | Déconnexion automatique 15 min |
| FR9 | Epic 2 | Création structure professionnelle |
| FR10 | Epic 2 | Invitation IDEL collaborateurs |
| FR11 | Epic 2 | Invitation médecins prescripteurs |
| FR12 | Epic 2 | Gestion rôles et permissions |
| FR13 | Epic 2 | Désactivation/suppression compte |
| FR14 | Epic 2 | Liste membres structure |
| FR15 | Epic 2 | Modification profil utilisateur |
| FR16 | Epic 3 | Création dossier patient |
| FR17 | Epic 3 | Consultation fiche patient |
| FR18 | Epic 3 | Modification informations patient |
| FR19 | Epic 3 | Archivage/suppression patient (RGPD) |
| FR20 | Epic 3 | Attribution patient ↔ IDEL |
| FR21 | Epic 3 | Isolation patients par IDEL |
| FR22 | Epic 3 | Historique transmissions patient |
| FR23 | Epic 3 | Graphiques constantes patient |
| FR24 | Epic 3 | Lecture seule médecin prescripteur |
| FR25 | Epic 3 | Recherche patient |
| FR26 | Epic 3 | Filtrage liste patients |
| FR27 | Epic 3 | Isolation multi-tenant structures |
| FR28 | Epic 4 | Visualisation planning quotidien |
| FR29 | Epic 4 | Génération planning optimisé (IA) |
| FR30 | Epic 4 | Modification manuelle (drag & drop) |
| FR31 | Epic 4 | Recalcul instantané planning |
| FR32 | Epic 4 | Patient absent → réorganisation auto |
| FR33 | Epic 4 | Insertion urgence optimale |
| FR34 | Epic 4 | Carte itinéraire optimisé |
| FR35 | Epic 4 | Durée estimée trajets |
| FR36 | Epic 4 | Préférences planning IDEL |
| FR37 | Epic 4 | Transparence suggestions IA |
| FR38 | Epic 4 | Mode manuel pur (désactivation IA) |
| FR39 | Epic 5 | Dictée vocale IA (Whisper local) |
| FR40 | Epic 5 | Validation obligatoire transcription |
| FR41 | Epic 5 | Saisie textuelle simplifiée |
| FR42 | Epic 5 | Templates prédéfinis types soins |
| FR43 | Epic 5 | Enregistrement constantes vitales |
| FR44 | Epic 5 | Audit trail transmission complet |
| FR45 | Epic 5 | Historique transmissions patient |
| FR46 | Epic 5 | Modification/suppression transmission |
| FR47 | Epic 5 | Lecture seule médecin (transmissions) |
| FR48 | Epic 5 | Désactivation IA vocale |
| FR49 | Epic 6 | 100% fonctionnel sans réseau |
| FR50 | Epic 6 | Stockage local données (SQLite) |
| FR51 | Epic 6 | Synchronisation automatique |
| FR52 | Epic 6 | Synchronisation manuelle (pull-to-refresh) |
| FR53 | Epic 6 | Indicateur visuel statut sync |
| FR54 | Epic 6 | Badge "non synchronisé" |
| FR55 | Epic 6 | Notification échec sync 24h |
| FR56 | Epic 6 | Règle "serveur gagne" conflits |
| FR57 | Epic 6 | Historique synchronisations |
| FR58 | Epic 6 | Effacement sécurisé données locales |
| FR59 | Epic 7 | Notification nouveau patient assigné |
| FR60 | Epic 7 | Notification urgence ajoutée |
| FR61 | Epic 7 | Notification modification planning |
| FR62 | Epic 7 | Notification révocation appareil |
| FR63 | Epic 7 | Rappel 15 min prochain patient |
| FR64 | Epic 7 | Notification sync terminée |
| FR65 | Epic 7 | Notification matinale récap planning |
| FR66 | Epic 7 | Paramètres notifications par type |
| FR67 | Epic 7 | Aucune donnée sensible dans notification |
| FR68 | Epic 8 | Accès Back Office navigateur desktop |
| FR69 | Epic 8 | Liste patients structure (admin) |
| FR70 | Epic 8 | Liste IDEL collaborateurs + patients |
| FR71 | Epic 8 | Import patients CSV |
| FR72 | Epic 8 | Export données CSV/PDF |
| FR73 | Epic 8 | Tableau de bord statistiques |
| FR74 | Epic 8 | Réassignation patient IDEL ↔ IDEL |
| FR75 | Epic 8 | Modification planning IDEL (Back Office) |
| FR76 | Epic 9 | Chiffrement AES-256 au repos |
| FR77 | Epic 9 | Chiffrement TLS 1.3 en transit |
| FR78 | Epic 9 | Audit logs immuables (append-only) |
| FR79 | Epic 9 | Export données portabilité RGPD |
| FR80 | Epic 9 | Suppression dossier (droit à l'oubli) |
| FR81 | Epic 9 | Rétention données médicales 10 ans |
| FR82 | Epic 9 | Séparation architecturale médicales/admin |
| FR83 | Epic 9 | Disclaimer responsabilité utilisateur |
| FR84 | Epic 9 | Consultation logs accès (audit) |

**Couverture totale : 84/84 FRs ✅**

---

## Epic List

### Epic 1 : Fondations & Authentification Sécurisée
Les utilisateurs peuvent créer leur compte, s'authentifier avec MFA (FIDO2/WebAuthn), activer la biométrie (Face ID / Touch ID) et gérer leurs sessions de façon sécurisée sur iOS et Android. Inclut la mise en place du monorepo Turborepo (story 1.1 — socle de tout le projet).
**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8

### Epic 2 : Gestion de la Structure & des Utilisateurs
Les admins peuvent créer leur cabinet ou réseau IDEL, inviter leurs collaborateurs (IDEL + médecins prescripteurs) avec les bons rôles, gérer les permissions RBAC, et les utilisateurs peuvent gérer leur profil.
**FRs couverts :** FR9, FR10, FR11, FR12, FR13, FR14, FR15

### Epic 3 : Gestion des Patients
Les IDEL et admins peuvent créer, consulter, modifier et archiver des dossiers patients avec géolocalisation. Les patients sont attribués aux IDEL, les données sont isolées par structure (multi-tenant), et les constantes vitales sont visualisables sous forme de graphiques. Les médecins prescripteurs ont accès en lecture seule.
**FRs couverts :** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 4 : Planning Intelligent de Tournée
Les IDEL peuvent voir leur planning quotidien auto-optimisé (algorithme Haversine + Nearest Neighbor + 2-opt), le modifier par glisser-déposer, marquer des patients absents avec recalcul instantané, gérer les urgences, définir leurs préférences et visualiser l'itinéraire complet sur une carte.
**FRs couverts :** FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

### Epic 5 : Transmissions & Documentation Médicale
Les IDEL peuvent saisir des transmissions par dictée vocale (IA Whisper locale + validation humaine obligatoire) ou par texte avec templates prédéfinis, enregistrer les constantes vitales avec audit trail complet et immuable. Les médecins prescripteurs consultent les transmissions en lecture seule.
**FRs couverts :** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48

### Epic 6 : Mode Offline-First & Synchronisation
Les IDEL peuvent utiliser 100% des fonctionnalités sans connexion réseau (SQLite local chiffré). Les données se synchronisent automatiquement via queue persistante avec retry exponentiel, gestion de conflits "serveur gagne", et indicateur visuel de statut sync permanent dans l'interface.
**FRs couverts :** FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58

### Epic 7 : Notifications & Alertes
Les utilisateurs reçoivent des notifications push pertinentes via Firebase FCM (nouveau patient assigné, urgence, modification planning, révocation appareil, rappels), avec notifications locales programmées, sans jamais exposer de données sensibles. Chaque type de notification est configurable.
**FRs couverts :** FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR67

### Epic 8 : Back Office Web d'Administration
Les admins peuvent gérer toute leur structure depuis un navigateur desktop : liste complète des patients et IDEL, import CSV (500 patients < 30s), export CSV/PDF, tableau de bord statistiques d'utilisation, réassignation patients entre IDEL, et modification des plannings des collaborateurs.
**FRs couverts :** FR68, FR69, FR70, FR71, FR72, FR73, FR74, FR75

### Epic 9 : Conformité, Sécurité & Gouvernance des Données
Le système respecte toutes les exigences HDS/RGPD : chiffrement AES-256, logs d'audit immuables (append-only, 3 ans), droit à la portabilité (export < 24h), droit à l'oubli (suppression < 72h), rétention 10 ans données médicales, séparation architecturale médicales/administratives, et consultation des logs d'accès.
**FRs couverts :** FR76, FR77, FR78, FR79, FR80, FR81, FR82, FR83, FR84

---

## Epic 1 : Fondations & Authentification Sécurisée

Les utilisateurs peuvent créer leur compte, s'authentifier avec MFA (FIDO2/WebAuthn), activer la biométrie (Face ID / Touch ID) et gérer leurs sessions de façon sécurisée sur iOS et Android. Inclut la mise en place du monorepo Turborepo (story 1.1 — socle de tout le projet).

### Story 1.1 : Initialisation du Monorepo & Socle Technique

En tant que développeur,
Je veux un monorepo Turborepo configuré avec l'app mobile Expo SDK 53, le Back Office Next.js 15, et les packages partagés (`db/` + `shared/`),
Afin que toute l'équipe puisse développer sur une base cohérente avec schéma Drizzle partagé et types TypeScript communs.

**Acceptance Criteria:**

**Given** un dépôt vide
**When** on exécute `pnpm install` à la racine
**Then** les workspaces `apps/mobile`, `apps/web`, `packages/db`, `packages/shared` sont tous installés et buildables sans erreur

**Given** le package `packages/db`
**When** on importe le schéma Drizzle
**Then** les entités `users`, `structures`, `patients`, `transmissions`, `planning_entries`, `sync_queue`, `audit_logs` sont définies avec des colonnes ULID (type `text`)

**Given** le package `packages/shared`
**When** on importe `generateId()`
**Then** la fonction retourne un ULID valide (format `[0-9A-Z]{26}`) généré côté client sans round-trip serveur

**Given** `apps/mobile`
**When** on lance `pnpm expo start`
**Then** l'app démarre sans erreur dans Expo Go (iOS et Android)

**Given** `apps/web`
**When** on lance `pnpm dev`
**Then** Next.js 15 démarre sur localhost:3000 sans erreur

**Given** `packages/db/seed/fixtures.ts`
**When** on lance `pnpm db:seed`
**Then** la base PostgreSQL est alimentée avec au moins 1 structure, 3 IDELs fictifs, et 10 patients fictifs avec coordonnées GPS réelles pour valider l'algorithme de planning

---

### Story 1.2 : Création de Compte Utilisateur avec MFA

En tant que nouvel utilisateur (IDEL ou Admin),
Je veux créer un compte avec email, mot de passe et configurer un second facteur MFA (FIDO2/WebAuthn ou application authenticator),
Afin que mon compte soit sécurisé dès la création et conforme aux exigences HDS.

**Acceptance Criteria:**

**Given** l'écran de création de compte
**When** je saisis un email valide + mot de passe (≥ 12 caractères, 1 majuscule, 1 chiffre, 1 spécial) et valide
**Then** le système crée mon compte et m'invite immédiatement à configurer le MFA
**And** aucun accès à l'app n'est possible avant la validation MFA

**Given** l'étape de configuration MFA
**When** je choisis "Application Authenticator" et scanne le QR code
**Then** je peux saisir le code TOTP 6 chiffres pour valider et accéder à l'app

**Given** l'étape de configuration MFA
**When** je choisis "Clé de sécurité FIDO2/WebAuthn"
**Then** je peux enregistrer ma clé physique ou la biométrie de l'appareil comme second facteur

**Given** un email déjà utilisé
**When** je tente de créer un compte avec cet email
**Then** le message "Un compte existe déjà avec cet email" s'affiche sans révéler le mot de passe associé

**Given** la création réussie
**When** mon compte est créé
**Then** le disclaimer légal est affiché : "L'utilisateur reste seul responsable des informations saisies et validées"

---

### Story 1.3 : Connexion Sécurisée avec Email + MFA

En tant qu'utilisateur enregistré,
Je veux me connecter avec mon email, mon mot de passe et mon second facteur MFA,
Afin d'accéder à mes données patients de façon sécurisée.

**Acceptance Criteria:**

**Given** l'écran de connexion
**When** je saisis email + mot de passe corrects et valide
**Then** le système me demande le second facteur MFA (TOTP ou FIDO2)

**Given** l'étape MFA
**When** je saisis le code TOTP valide (ou valide via FIDO2)
**Then** je suis authentifié, un JWT signé (7 jours) est émis par BetterAuth, stocké dans Expo SecureStore (mobile) ou cookie httpOnly sécurisé (web)
**And** je suis redirigé vers l'écran Planning (mobile) ou le tableau de bord (Back Office web)

**Given** 3 tentatives de mot de passe échouées consécutives
**When** j'essaie de me connecter
**Then** un délai de 30 secondes est imposé avant la prochaine tentative (protection brute-force)

**Given** un code MFA invalide
**When** je le saisis
**Then** le message "Code incorrect, veuillez réessayer" s'affiche sans bloquer le compte immédiatement

---

### Story 1.4 : Authentification Biométrique (Face ID / Touch ID)

En tant qu'utilisateur IDEL,
Je veux activer l'authentification biométrique pour les sessions suivantes,
Afin d'accéder à l'app en moins d'une seconde sans ressaisir mon mot de passe + MFA à chaque ouverture.

**Acceptance Criteria:**

**Given** la première connexion réussie avec email + MFA
**When** l'appareil supporte Face ID / Touch ID / empreinte digitale
**Then** l'app propose d'activer la biométrie comme accès rapide (bouton "Activer" + "Plus tard")

**Given** la biométrie activée
**When** j'ouvre l'app après expiration de session (15 min inactivité ou fermeture)
**Then** le prompt Face ID / Touch ID s'affiche et l'accès est accordé en moins d'une seconde

**Given** 2 échecs biométriques consécutifs
**When** je tente la biométrie
**Then** le fallback email + MFA classique est présenté automatiquement

**Given** un appareil sans biométrie disponible
**When** je me connecte pour la première fois
**Then** l'étape de proposition biométrique est ignorée silencieusement (aucune erreur, aucun bouton grisé)

---

### Story 1.5 : Authentification Offline avec JWT Local

En tant qu'IDEL en zone blanche,
Je veux pouvoir m'authentifier sans connexion réseau après ma première connexion online,
Afin de continuer à utiliser l'app même sans 4G/5G pendant ma tournée.

**Acceptance Criteria:**

**Given** un JWT valide stocké dans SecureStore (émis depuis moins de 7 jours)
**When** j'ouvre l'app en mode avion
**Then** la signature JWT est validée localement (HMAC-SHA256) et j'accède à l'app sans réseau
**And** toutes les fonctionnalités de l'app restent disponibles (aucune feature grisée)

**Given** un JWT expiré (plus de 7 jours sans connexion online)
**When** j'ouvre l'app en mode avion
**Then** le message "Connexion internet requise pour renouveler votre session" s'affiche avec bouton "Réessayer"

**Given** un réseau disponible avec refresh token valide (moins de 30 jours)
**When** l'app détecte la connexion réseau
**Then** le JWT est renouvelé automatiquement en arrière-plan, transparent pour l'utilisateur

---

### Story 1.6 : Réinitialisation de Mot de Passe

En tant qu'utilisateur ayant oublié son mot de passe,
Je veux recevoir un lien de réinitialisation par email sécurisé,
Afin de récupérer l'accès à mon compte sans assistance technique.

**Acceptance Criteria:**

**Given** l'écran de connexion
**When** je tape "Mot de passe oublié" et saisis mon email enregistré
**Then** je reçois un email avec un lien de réinitialisation valide 15 minutes
**And** le message affiché est "Si cet email est enregistré, un lien vous a été envoyé" (sécurité anti-énumération)

**Given** le lien de réinitialisation cliqué dans les 15 minutes
**When** je saisis un nouveau mot de passe conforme aux règles de complexité
**Then** le mot de passe est mis à jour et je suis invité à me reconnecter avec email + MFA

**Given** un lien de réinitialisation expiré (plus de 15 minutes)
**When** je tente de l'utiliser
**Then** le message "Lien expiré, veuillez en demander un nouveau" s'affiche avec bouton de renvoi

---

### Story 1.7 : Gestion Sécurité — Déconnexion & Révocation Appareil

En tant qu'utilisateur ou admin,
Je veux pouvoir déconnecter tous mes appareils à distance et révoquer un appareil compromis,
Afin de protéger mes données patients en cas de vol ou perte de téléphone.

**Acceptance Criteria:**

**Given** l'écran Paramètres > Sécurité
**When** je tape "Déconnecter tous mes appareils" et confirme
**Then** tous les JWT actifs sont invalidés (blacklist JTI côté serveur) et chaque appareil demande une re-authentification au prochain accès

**Given** un admin dans le Back Office
**When** il sélectionne un appareil d'un IDEL et clique "Révoquer cet appareil"
**Then** le JTI de cet appareil est blacklisté immédiatement
**And** l'IDEL voit le message "Votre accès a été révoqué sur cet appareil" au prochain démarrage
**And** les données locales SQLite sont effacées de façon sécurisée lors de la prochaine ouverture

**Given** une session sans activité pendant 15 minutes
**When** l'app passe en background ou reste inactive (AppState listener)
**Then** le JWT est supprimé de SecureStore et l'utilisateur doit se réauthentifier (biométrie ou email+MFA)

---

## Epic 2 : Gestion de la Structure & des Utilisateurs

Les admins peuvent créer leur cabinet ou réseau IDEL, inviter leurs collaborateurs (IDEL + médecins prescripteurs) avec les bons rôles, gérer les permissions RBAC, et les utilisateurs peuvent gérer leur profil.

### Story 2.1 : Création de la Structure Professionnelle (Onboarding Admin)

En tant qu'admin,
Je veux créer ma structure professionnelle (cabinet ou réseau IDEL) avec ses informations essentielles,
Afin de pouvoir ensuite inviter mon équipe et gérer mes patients depuis un espace centralisé.

**Acceptance Criteria:**

**Given** un admin connecté pour la première fois (sans structure existante)
**When** il complète le formulaire d'onboarding (nom cabinet, adresse, SIRET optionnel)
**Then** la structure est créée avec un `structure_id` ULID unique
**And** l'admin est redirigé vers le tableau de bord Back Office avec le message "Votre structure est prête — invitez votre équipe"

**Given** l'isolation multi-tenant
**When** l'admin accède à ses données
**Then** seules les données de sa propre structure sont visibles (filtrage `structure_id` strict sur toutes les requêtes API)

**Given** un second admin avec le même SIRET
**When** il tente de créer une structure
**Then** une alerte "Cette structure semble déjà exister" est affichée (sans blocage dur)

---

### Story 2.2 : Invitation des IDEL Collaborateurs

En tant qu'admin,
Je veux inviter des IDEL collaborateurs par email avec le rôle "IDEL collaborateur",
Afin qu'ils puissent rejoindre ma structure et accéder uniquement à leurs patients assignés.

**Acceptance Criteria:**

**Given** le Back Office > Paramètres > Équipe
**When** l'admin saisit un email et sélectionne "IDEL collaborateur" puis envoie l'invitation
**Then** un email d'invitation avec lien est envoyé (valide 7 jours)
**And** l'IDEL apparaît en statut "Invitation en attente" dans la liste de l'équipe

**Given** l'IDEL clique sur le lien d'invitation
**When** il crée son compte et se connecte avec MFA
**Then** il est automatiquement rattaché à la structure de l'admin avec le rôle "IDEL collaborateur"

**Given** un lien d'invitation expiré (plus de 7 jours)
**When** l'IDEL tente de l'utiliser
**Then** le message "Cette invitation a expiré — contactez votre admin pour en recevoir une nouvelle" s'affiche

---

### Story 2.3 : Invitation des Médecins Prescripteurs

En tant qu'admin,
Je veux inviter des médecins prescripteurs avec un accès lecture seule sur leurs patients,
Afin qu'ils puissent consulter l'évolution de leurs patients sans pouvoir modifier quoi que ce soit.

**Acceptance Criteria:**

**Given** le Back Office > Paramètres > Équipe
**When** l'admin saisit l'email du médecin et sélectionne "Médecin prescripteur"
**Then** une invitation est envoyée et le médecin apparaît en statut "Invitation en attente"

**Given** le médecin connecté avec son compte
**When** il accède à l'interface
**Then** il ne voit que les patients qui lui sont explicitement associés
**And** aucun bouton de modification, création ou suppression n'est visible ni accessible

**Given** le rôle "Médecin prescripteur"
**When** une requête API de modification (POST/PATCH/DELETE) est tentée avec ce token
**Then** le serveur retourne `403 Forbidden` systématiquement

---

### Story 2.4 : Gestion des Rôles, Permissions & Désactivation de Compte

En tant qu'admin,
Je veux modifier les rôles des membres, désactiver ou supprimer des comptes,
Afin de garder le contrôle total sur qui accède à quelles données au sein de ma structure.

**Acceptance Criteria:**

**Given** la liste des membres dans le Back Office
**When** l'admin change le rôle d'un utilisateur et confirme
**Then** les nouvelles permissions sont effectives immédiatement à la prochaine requête API
**And** un log d'audit enregistre le changement (qui a modifié, quand, ancien rôle, nouveau rôle)

**Given** un membre actif
**When** l'admin clique "Désactiver ce compte" et confirme le dialog
**Then** toutes les sessions actives sont invalidées (JWT blacklistés)
**And** l'utilisateur voit "Votre compte a été désactivé — contactez votre admin" s'il tente de se connecter

**Given** un admin qui tente de se supprimer lui-même (seul admin de la structure)
**When** il clique "Supprimer mon compte"
**Then** le message "Impossible — vous êtes le seul admin de cette structure" s'affiche (protection anti-verrouillage)

---

### Story 2.5 : Consultation de l'Équipe & Gestion du Profil Utilisateur

En tant qu'utilisateur (IDEL, Admin ou Médecin),
Je veux voir la liste des membres de ma structure et modifier mes informations de profil,
Afin de connaître mon équipe et maintenir mes informations à jour.

**Acceptance Criteria:**

**Given** l'écran Profil (mobile) ou Paramètres (Back Office)
**When** je consulte la liste de l'équipe
**Then** je vois les membres avec leur nom, rôle et statut (actif / invitation en attente)
**And** uniquement les membres de ma propre structure (isolation multi-tenant stricte)

**Given** l'écran de modification de profil
**When** je modifie mon nom, prénom ou photo de profil et enregistre
**Then** les modifications sont sauvegardées et visibles immédiatement dans toute l'interface

**Given** un IDEL collaborateur qui consulte la liste de l'équipe
**When** il navigue vers Paramètres > Équipe
**Then** il voit les membres mais les boutons de gestion des rôles ne sont pas affichés (RBAC côté UI + API)

---

## Epic 3 : Gestion des Patients

Les IDEL et admins peuvent créer, consulter, modifier et archiver des dossiers patients avec géolocalisation automatique. Les patients sont attribués aux IDEL, les données sont isolées par structure (multi-tenant), les constantes vitales sont visualisables sous forme de graphiques, et les médecins prescripteurs ont accès en lecture seule.

### Story 3.1 : Création d'un Dossier Patient avec Géolocalisation

En tant qu'IDEL ou admin,
Je veux créer un nouveau dossier patient avec ses informations administratives et son adresse géolocalisée automatiquement,
Afin que ce patient soit intégré dans mon planning et son suivi médical puisse commencer.

**Acceptance Criteria:**

**Given** l'écran "Nouveau patient"
**When** je saisis nom, prénom, adresse, téléphone et médecin traitant, puis valide
**Then** le dossier patient est créé avec un `patient_id` ULID
**And** un géocodage automatique (Nominatim OSM) est déclenché pour obtenir `latitude` et `longitude` à partir de l'adresse

**Given** le géocodage réussi
**When** les coordonnées sont retournées
**Then** `latitude` et `longitude` sont stockées dans SQLite local pour l'algorithme de planning offline

**Given** le géocodage échoue (adresse inconnue ou hors réseau)
**When** la création est sauvegardée
**Then** le patient est créé sans coordonnées GPS avec un avertissement visuel "Adresse non géolocalisée — ce patient sera placé en fin de planning"
**And** l'IDEL peut toujours le réordonner manuellement (drag & drop)

**Given** un IDEL collaborateur qui crée un patient
**When** la création est validée
**Then** le patient est automatiquement isolé dans la structure de l'IDEL (`structure_id` extrait du JWT)

---

### Story 3.2 : Consultation & Modification de la Fiche Patient

En tant qu'IDEL ou admin,
Je veux consulter la fiche complète d'un patient et modifier ses informations,
Afin de maintenir son dossier à jour au fil du temps.

**Acceptance Criteria:**

**Given** la liste des patients
**When** je tape sur un patient
**Then** sa fiche s'affiche avec : informations administratives, médecin traitant, dernières constantes vitales et lien vers l'historique des transmissions

**Given** la fiche patient ouverte
**When** je modifie l'adresse et enregistre
**Then** un nouveau géocodage est déclenché automatiquement pour mettre à jour `lat/lng`
**And** la modification est enregistrée localement (offline-safe) puis synchronisée via la queue

**Given** un IDEL collaborateur
**When** il tente d'accéder à un patient non assigné via l'URL directe ou l'API
**Then** le serveur retourne `403 Forbidden` (isolation RBAC stricte côté API, indépendante de l'UI)

---

### Story 3.3 : Attribution des Patients aux IDEL & Isolation Multi-Tenant

En tant qu'admin,
Je veux attribuer ou retirer des patients à mes IDEL collaborateurs,
Afin que chaque IDEL n'ait accès qu'à ses patients assignés, en toute sécurité.

**Acceptance Criteria:**

**Given** la liste patients dans le Back Office
**When** l'admin sélectionne un patient et clique "Assigner à [IDEL]"
**Then** le patient apparaît dans le planning de l'IDEL assigné
**And** une notification push est envoyée à l'IDEL "Un nouveau patient vous a été assigné"

**Given** un patient assigné à IDEL-A dans la même structure
**When** IDEL-B tente d'accéder à ce patient (liste ou API directe)
**Then** le patient n'apparaît pas dans sa liste et toute requête retourne `403 Forbidden`

**Given** l'admin qui retire un patient à un IDEL
**When** il clique "Retirer l'assignation" et confirme
**Then** le patient disparaît du planning de cet IDEL
**And** ses données locales sont marquées pour nettoyage lors de la prochaine synchronisation

---

### Story 3.4 : Recherche, Filtrage & Liste des Patients

En tant qu'utilisateur (IDEL ou admin),
Je veux rechercher un patient par nom/adresse/médecin et filtrer la liste par statut,
Afin de trouver rapidement un dossier parmi ma liste.

**Acceptance Criteria:**

**Given** la liste des patients avec la barre de recherche (Searchbar Paper)
**When** je saisis au moins 2 caractères
**Then** les résultats sont filtrés en temps réel par nom, adresse ou médecin traitant
**And** le terme recherché est surligné dans les résultats

**Given** les chips de filtrage (Tous / Actifs / Archivés)
**When** je sélectionne "Archivés"
**Then** seuls les patients archivés sont affichés avec une indication visuelle de leur statut

**Given** une recherche sans résultat
**When** aucun patient ne correspond aux critères
**Then** l'état vide affiche "Aucun patient trouvé" avec icône loupe et bouton "Effacer la recherche"

---

### Story 3.5 : Archivage, Suppression & Conformité RGPD

En tant qu'IDEL ou admin,
Je veux archiver ou supprimer définitivement un dossier patient avec confirmation explicite,
Afin de respecter le droit à l'oubli RGPD tout en respectant la rétention obligatoire de 10 ans.

**Acceptance Criteria:**

**Given** la fiche patient active
**When** je tape "Archiver ce patient" et confirme le dialog
**Then** le patient passe en statut "archivé", disparaît du planning actif
**And** son historique médical reste accessible en lecture depuis la liste "Archivés"

**Given** la fiche patient archivée
**When** je tape "Supprimer définitivement" et saisis le nom du patient pour confirmation
**Then** un dialog d'avertissement indique "Cette action est irréversible — toutes les données seront supprimées"
**And** après double confirmation, les données sont marquées pour suppression sécurisée (droit à l'oubli FR80)

**Given** un patient avec transmissions de moins de 10 ans
**When** une suppression définitive est demandée
**Then** le système affiche "Attention : la réglementation impose une conservation de 10 ans" avec choix "Archiver plutôt" (recommandé) ou "Supprimer quand même"

---

### Story 3.6 : Visualisation des Constantes & Graphiques Patient

En tant qu'IDEL ou médecin prescripteur,
Je veux visualiser l'évolution des constantes vitales d'un patient sous forme de graphiques (tension, glycémie, poids, température, SpO2),
Afin de suivre son état clinique en un coup d'œil lors de mes visites.

**Acceptance Criteria:**

**Given** la fiche patient, onglet "Constantes"
**When** au moins une constante a été enregistrée
**Then** un graphique courbe s'affiche (composant `ConstantesLineChart` C6) avec zones colorées : vert = normal, orange = attention, rouge = alerte
**And** chaque zone est identifiée par icône + couleur + label (pas de couleur seule — accessibilité daltonisme)

**Given** le graphique affiché
**When** je tape sur un point de la courbe
**Then** un tooltip affiche la valeur exacte + la date de mesure

**Given** le sélecteur de plage temporelle
**When** je bascule entre "7 jours", "30 jours", "6 mois"
**Then** le graphique se met à jour pour afficher la période sélectionnée

**Given** un médecin prescripteur accédant aux constantes de son patient
**When** il consulte l'onglet Constantes
**Then** il voit les mêmes graphiques qu'un IDEL, sans bouton "Saisir des constantes" (lecture seule stricte)

---

## Epic 4 : Planning Intelligent de Tournée

Les IDEL peuvent voir leur planning quotidien auto-optimisé (algorithme Haversine + Nearest Neighbor + 2-opt), le modifier par glisser-déposer, marquer des patients absents avec recalcul instantané, gérer les urgences, définir leurs préférences et visualiser l'itinéraire complet sur une carte collapsible.

### Story 4.1 : Affichage du Planning Quotidien (Écran Principal)

En tant qu'IDEL,
Je veux voir mon planning du jour avec la liste ordonnée de mes patients, la progression journée et les ETAs,
Afin de démarrer ma tournée en un coup d'œil sans chercher d'informations.

**Acceptance Criteria:**

**Given** l'app ouverte sur l'onglet Planning
**When** le planning du jour est chargé depuis SQLite local
**Then** l'écran affiche le header Teal avec `CircularProgressRing` (0/N patients), ETA total estimé et statut sync
**And** la liste ordonnée des patients s'affiche en `PlanningCard` (nom, adresse courte, heure estimée, type de soin, ETA)
**And** le chargement des données locales s'effectue en moins de 2 secondes (NFR-PERF-3)

**Given** la section carte `MapToggleSection`
**When** l'écran s'affiche
**Then** le bouton "🗺️ Voir la carte ∨" collapsible est visible
**And** l'état déplié/replié est mémorisé entre sessions via AsyncStorage

**Given** aucun patient planifié aujourd'hui
**When** l'écran Planning s'affiche
**Then** l'état vide "Aucun patient planifié aujourd'hui" s'affiche avec icône calendrier et lien "Voir mes patients"

---

### Story 4.2 : Génération Automatique du Planning Optimisé (Algorithme IA)

En tant qu'IDEL,
Je veux que mon planning soit généré automatiquement en tenant compte des localisations, durées de soins et contraintes horaires,
Afin de gagner 30+ minutes par jour sur l'organisation de ma tournée.

**Acceptance Criteria:**

**Given** une liste de patients assignés avec `lat/lng` et contraintes horaires
**When** la génération du planning est déclenchée (matin ou manuellement)
**Then** l'algorithme Nearest Neighbor + 2-opt calcule l'ordre optimal en moins de 5 secondes pour jusqu'à 15 patients (NFR-PERF-2)
**And** l'algorithme tient compte : distance Haversine, durée de soin variable, fenêtres horaires patients, préférences IDEL

**Given** un patient sans coordonnées GPS
**When** le planning est généré
**Then** ce patient est placé en fin de liste avec l'avertissement "Adresse non géolocalisée"

**Given** l'algorithme exécuté localement
**When** le réseau est absent (mode avion)
**Then** le planning est généré et disponible sans connexion (100% offline, NFR-REL-1)

**Given** le planning généré
**When** l'IDEL consulte une PlanningCard
**Then** elle affiche l'explication de la position du patient : "Mme Dupont en premier — sur votre route + RDV 9h" (FR37, transparence IA)

---

### Story 4.3 : Modification Manuelle du Planning (Drag & Drop)

En tant qu'IDEL,
Je veux réorganiser l'ordre de mes patients par glisser-déposer avec recalcul instantané,
Afin de garder le contrôle total sur ma tournée et adapter à mes connaissances terrain.

**Acceptance Criteria:**

**Given** la liste de planning
**When** je maintiens appuyé une `PlanningCard` (long press)
**Then** la carte entre en mode drag (élévation 3dp, rotation 2°, haptic feedback léger)
**And** les autres cartes se réorganisent visuellement pour indiquer la position de dépôt

**Given** une carte déplacée et relâchée à une nouvelle position
**When** le dépôt est effectué
**Then** l'ordre est mis à jour instantanément avec haptic feedback impact
**And** les ETAs de toutes les cartes sont recalculés en moins de 2 secondes
**And** un Snackbar "Modification enregistrée — Annuler" s'affiche 5 secondes (undo disponible)

**Given** le bouton "Mode Manuel Pur" activé dans les paramètres (FR38)
**When** l'IDEL accède au planning
**Then** aucune suggestion automatique n'est générée et l'ordre est entièrement sous contrôle manuel

---

### Story 4.4 : Gestion des Patients Absents & Urgences

En tant qu'IDEL,
Je veux marquer un patient absent et ajouter des urgences avec recalcul automatique du planning,
Afin de gérer les imprévus terrain en quelques secondes sans perdre le fil de ma tournée.

**Acceptance Criteria:**

**Given** une `PlanningCard` dans la liste
**When** je glisse la carte vers la gauche (swipe left)
**Then** un menu contextuel s'affiche avec 3 options max : "Absent", "Déplacer à un autre jour", "Naviguer"

**Given** l'option "Absent" sélectionnée
**When** je confirme le dialog "Retirer [Nom] du planning ?"
**Then** le patient est retiré, le planning recalcule automatiquement en moins de 2 secondes (NFR-PERF-2)
**And** un Snackbar "Patient retiré — Annuler" s'affiche 5 secondes avec haptic feedback moyen

**Given** le FAB "+" dans l'écran Planning
**When** je tape et sélectionne "Ajouter une urgence" puis choisis un patient
**Then** l'algorithme propose la position optimale d'insertion dans le planning existant (FR33)
**And** l'IDEL peut accepter la suggestion ou choisir manuellement une autre position

---

### Story 4.5 : Carte Itinéraire & Navigation GPS

En tant qu'IDEL,
Je veux visualiser l'itinéraire de ma tournée sur une carte et lancer la navigation GPS en 1 tap,
Afin de me repérer rapidement et naviguer vers le prochain patient sans friction.

**Acceptance Criteria:**

**Given** la section carte dépliée (`MapToggleSection` C7)
**When** la carte est affichée
**Then** tous les patients sont visibles comme pins numérotés ① ② ③ (indigo = à faire, vert = fait, orange = absent)
**And** une `Polyline` en tirets fins trace l'itinéraire dans l'ordre du planning

**Given** un tap sur un pin de la carte
**When** je sélectionne un patient
**Then** la liste défile automatiquement vers la `PlanningCard` correspondante

**Given** le FAB "🗺️ Naviguer" ou le bouton dans la `PlanningCard`
**When** je tape dessus
**Then** l'app GPS native (Maps iOS / Google Maps Android) s'ouvre avec l'adresse pré-chargée en moins de 1 tap supplémentaire

**Given** un patient marqué comme "fait"
**When** sa transmission est validée
**Then** l'ETA "Arrivée chez prochain patient dans X min" se met à jour dans la card suivante (FR35)

---

### Story 4.6 : Préférences de Planning

En tant qu'IDEL,
Je veux définir mes préférences de planning (horaires de début, pauses, zones géographiques prioritaires),
Afin que l'algorithme génère des suggestions alignées avec mon mode de travail habituel.

**Acceptance Criteria:**

**Given** l'écran Paramètres > Préférences Planning
**When** je définis heure de début habituelle, durée de pause déjeuner et zones géographiques prioritaires
**Then** ces préférences sont sauvegardées localement et utilisées par l'algorithme à chaque génération

**Given** des préférences configurées (ex. début 8h, pause 12h30 30min)
**When** le planning est généré
**Then** l'algorithme respecte ces contraintes et insère la pause à l'heure souhaitée

**Given** l'option "Mode Manuel Pur" dans les préférences
**When** l'IDEL l'active
**Then** le bouton "Générer planning" disparaît de l'interface et aucune suggestion automatique n'est produite (FR38)

---

## Epic 5 : Transmissions & Documentation Médicale

Les IDEL peuvent saisir des transmissions par dictée vocale (IA Whisper locale + validation humaine obligatoire) ou par texte avec templates prédéfinis, enregistrer les constantes vitales avec audit trail complet et immuable. Les médecins prescripteurs consultent les transmissions en lecture seule.

### Story 5.1 : Saisie de Transmission par Dictée Vocale IA

En tant qu'IDEL,
Je veux dicter ma transmission vocalement après chaque soin, avec transcription locale instantanée par Whisper,
Afin de saisir une transmission complète en moins de 2 minutes au lieu de 10-45 minutes à l'écrit.

**Acceptance Criteria:**

**Given** l'écran de saisie de transmission
**When** je maintiens appuyé le `VoiceRecorderButton` (C3, geste hold-to-record style WhatsApp)
**Then** le bouton passe en état "recording" (rouge pulsant + onde sonore animée + timer visible)
**And** l'enregistrement audio démarre immédiatement sans dialog de confirmation

**Given** je relâche le bouton après ma dictée
**When** l'enregistrement se termine
**Then** Whisper on-device (0 cloud) transcrit l'audio en moins de 3 secondes pour 30 secondes d'audio (NFR-INT-2)
**And** le `TranscriptionViewer` (C4) s'affiche avec le texte transcrit

**Given** le bouton maintenu puis glissé vers le haut (geste annulation)
**When** je veux annuler
**Then** un Snackbar "Enregistrement annulé" s'affiche et aucune donnée n'est sauvegardée

**Given** le microphone refusé ou indisponible
**When** j'appuie sur le bouton vocal
**Then** le message "Microphone inaccessible — utilisez la saisie textuelle" s'affiche avec bouton direct vers le mode texte

---

### Story 5.2 : Validation Obligatoire de la Transcription IA (Conformité HDS)

En tant qu'IDEL,
Je veux vérifier et corriger la transcription IA avant enregistrement définitif,
Afin de garantir l'exactitude médicale et respecter mon obligation légale de validation (conformité HDS).

**Acceptance Criteria:**

**Given** le `TranscriptionViewer` affiché après transcription
**When** je lis le texte
**Then** les mots avec faible confiance IA sont surlignés en jaune pour attirer mon attention

**Given** un mot incorrect dans la transcription
**When** je tape dessus
**Then** le clavier s'ouvre avec le mot sélectionné prêt à être corrigé (édition inline directe)

**Given** un doute sur la transcription
**When** je tape "🔊 Réécouter"
**Then** l'audio original est rejoué pour comparaison avant validation

**Given** la transcription validée ou corrigée
**When** je tape "✅ Valider et enregistrer"
**Then** l'audit trail est créé : version originale IA + version validée + `user_id` auteur + timestamp ISO 8601 (FR44, NFR-SEC-4)
**And** un haptic feedback fort + checkmark vert confirme l'enregistrement
**And** la `PlanningCard` du patient affiche le double check vert "Vu ✅ + Transmission ✅"

**Given** la transcription disponible
**When** aucun tap sur "Valider et enregistrer" n'a eu lieu
**Then** aucun enregistrement automatique ne se produit (validation humaine obligatoire FR40, sans exception)

---

### Story 5.3 : Saisie de Transmission par Texte & Templates

En tant qu'IDEL,
Je veux saisir une transmission par texte avec templates prédéfinis selon le type de soin,
Afin d'avoir une alternative rapide à la dictée vocale, utilisable en toutes circonstances.

**Acceptance Criteria:**

**Given** l'écran de saisie de transmission, onglet texte
**When** je sélectionne un type de soin parmi les chips : "Toilette · Pansement · Injection · Constantes · Autre"
**Then** un formulaire pré-structuré s'affiche avec les champs adaptés au type de soin sélectionné

**Given** le formulaire de transmission affiché
**When** je complète les champs et tape "Enregistrer"
**Then** la transmission est sauvegardée localement avec audit trail (auteur + timestamp)
**And** un haptic feedback + checkmark vert confirme l'enregistrement

**Given** l'option "Désactiver la saisie vocale" activée dans les paramètres (FR48)
**When** j'accède à l'écran de transmission
**Then** seul le mode texte est proposé (bouton vocal masqué, pas grisé)

---

### Story 5.4 : Enregistrement des Constantes Vitales

En tant qu'IDEL,
Je veux enregistrer les constantes vitales d'un patient (tension, température, glycémie, poids, SpO2) lors de chaque visite,
Afin d'alimenter l'historique clinique consultable par le médecin prescripteur et visualisable en graphiques.

**Acceptance Criteria:**

**Given** l'écran de saisie de transmission ou la fiche patient
**When** je tape "Saisir les constantes"
**Then** un formulaire s'affiche avec les champs : tension (systolique/diastolique), température, glycémie, poids, SpO2
**And** chaque champ numérique utilise `keyboardType="decimal-pad"` pour faciliter la saisie terrain

**Given** des constantes saisies et enregistrées
**When** je retourne à la fiche patient
**Then** le graphique `ConstantesLineChart` est mis à jour immédiatement avec les nouvelles valeurs

**Given** une valeur hors plage normale (ex. tension > 18/11)
**When** j'enregistre la constante
**Then** une alerte "Valeur hors norme — vérifiez avant d'enregistrer" s'affiche avec icône ⚠️ + couleur orange
**And** l'enregistrement reste possible après confirmation (l'IDEL reste seul responsable)

---

### Story 5.5 : Historique des Transmissions & Audit Trail

En tant qu'IDEL ou médecin prescripteur,
Je veux consulter l'historique complet des transmissions d'un patient avec dates, auteurs et versions originales IA,
Afin de suivre l'évolution du suivi médical et disposer d'une traçabilité médico-légale complète.

**Acceptance Criteria:**

**Given** la fiche patient, onglet "Transmissions"
**When** l'historique se charge
**Then** les transmissions s'affichent en ordre chronologique inverse avec date, auteur et extrait du contenu

**Given** une transmission issue de la dictée vocale
**When** je tape dessus pour l'ouvrir
**Then** les deux versions sont visibles : "Dictée IA originale" (gris italique) + "Version validée" (texte principal) + auteur + timestamp

**Given** une transmission que j'ai saisie
**When** je tape "Modifier" et enregistre ma correction
**Then** la modification crée une nouvelle entrée d'audit trail (version précédente conservée, auteur de la modification, timestamp)

**Given** un médecin prescripteur consultant les transmissions de son patient
**When** il accède à l'historique
**Then** il voit toutes les transmissions en lecture seule, sans bouton "Modifier" ni "Supprimer"
