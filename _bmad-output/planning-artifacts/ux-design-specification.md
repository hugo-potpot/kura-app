---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-core-experience', 'step-04-emotional-response', 'step-05-inspiration', 'step-06-design-system']
inputDocuments:
  - type: prd
    path: '_bmad-output/planning-artifacts/prd.md'
    loaded: true
  - type: product-brief
    path: '_bmad-output/planning-artifacts/product-brief-idel-app-2026-01-21.md'
    loaded: true
  - type: validation-report
    path: '_bmad-output/planning-artifacts/validation-report-prd-2026-01-21.md'
    loaded: true
date: 2026-01-21
project: idel-app
author: Potpot
---

# UX Design Specification - idel-app (KURA)

**Author:** Potpot
**Date:** 2026-01-21

---

## Executive Summary

### Project Vision

KURA (idel-app) est une application mobile healthcare offline-first conçue pour transformer le quotidien des 120 000+ infirmiers libéraux (IDEL) en France. L'objectif UX central est de **faire gagner 30+ minutes par jour** en simplifiant deux tâches critiques : l'organisation des tournées (planning intelligent IA) et la saisie des transmissions (vocale + templates).

**Philosophie UX** : IA assistante qui suggère, jamais décide - l'utilisateur garde 100% du contrôle.

**Plateformes** : Application mobile native cross-platform (React Native/Expo) iOS + Android + Back Office web desktop.

### Target Users

**Utilisateurs Primaires (IDEL) :**

**👤 Marie (80%) - L'Expérimentée** : Modérément tech, iPhone, adopte si gain temps visible
- **Pain UX** : Jongle entre 3 outils (charge mentale), transmissions chronophages le soir
- **Besoin UX** : Interface unifiée rapide, optimisation planning visible, transmissions express
- **Success UX** : Visualise concrètement temps gagné, rentre chez elle 1h plus tôt

**👩‍💼 Sophie (15%) - La Digital Native** : Très tech, early adopter, cherche rentabilité
- **Pain UX** : Patients dispersés 60 km, pas d'analytics rentabilité
- **Besoin UX** : Dashboard analytique, optimisation avancée, sécurité rassurante
- **Success UX** : Voit ROI chiffré (temps trajet -40%, patients supplémentaires)

**👨‍⚕️ Michel (5%) - Le Réticent** : Faible tech, 58 ans, méthodes papier 25 ans
- **Pain UX** : "Si c'est compliqué, je n'y arriverai jamais"
- **Besoin UX** : Interface ultra-simple, onboarding accompagné, peut n'utiliser que certaines features
- **Contrainte UX CRITIQUE** : Abandon immédiat si courbe apprentissage trop raide
- **Success UX** : Autonomie après onboarding, utilise planning + transmissions vocales uniquement

**Utilisateurs Secondaires :**

**🏢 Admin Structure (Claire)** : Desktop, Back Office web
- **Besoin UX** : Configuration 2h max, tableau de bord centralisé, gestion multi-IDEL
- **Device** : Desktop navigateur (Chrome, Firefox, Safari)

**👨‍⚕️ Médecin Prescripteur** : Tablette ou desktop, lecture seule
- **Besoin UX** : Consultation rapide sans surcharge, graphiques simples constantes
- **Contrainte** : Pas d'actions modification, isolation stricte

### Key Design Challenges

**Challenge 1 : Simplicité vs Puissance**
- Interface simple pour Michel (58 ans, papier) ET puissante pour Sophie (digital native, analytics)
- **Approche UX** : Progressive disclosure - features avancées cachées par défaut, révélées à la demande

**Challenge 2 : Offline-First UX (Zones Blanches)**
- 66% IDEL rencontrent difficultés réseau terrain
- Utilisateur doit comprendre statut synchronisation sans distraction
- **Approche UX** : Indicateurs subtils mais clairs (badge sync, icône réseau), feedback rassurant

**Challenge 3 : Validation IA Vocale Fluide**
- IA transcrit transmission MAIS validation humaine obligatoire (réglementation HDS)
- Flow doit être rapide (objectif 2-3 min total) tout en garantissant validation attentive
- **Approche UX** : Comparaison audio/texte facile, édition inline, validation 1-tap

**Challenge 4 : Planning Modification Terrain**
- Réorganiser planning en conditions difficiles (voiture stationnée, gants, plein soleil)
- **Approche UX** : Large touch targets (44x44px min), drag & drop intuitif, contraste élevé, undo immédiat

**Challenge 5 : Multi-Plateforme Cohérente**
- Mobile (IDEL terrain) + Web (Admin cabinet)
- Expériences différentes MAIS identité visuelle cohérente
- **Approche UX** : Design system unifié, patterns adaptés par plateforme

**Challenge 6 : Confiance Sécurité (Healthcare)**
- Données santé sensibles (HDS), MFA obligatoire
- Utilisateurs doivent **voir** que c'est sécurisé
- **Approche UX** : Indicateurs sécurité visibles (cadenas, badge MFA, certification HDS), transparence

### Design Opportunities

**Opportunity 1 : Visualisation Temps Gagné (Moment "Waouh")**
- Marie doit constater visuellement le gain (conviction = adoption)
- **UX Innovation** : Dashboard avant/après, timer comparatif, badge "Vous avez gagné 35 min aujourd'hui"

**Opportunity 2 : One-Tap Critical Actions**
- IDEL en mouvement, entre patients, mains occupées
- **UX Innovation** : Actions critiques 1-tap (patient absent, lancer navigation, marquer transmission faite)

**Opportunity 3 : Dark Mode Confortable (Saisie Nocturne)**
- Transmissions actuellement saisies le soir à domicile
- **UX Innovation** : Dark mode OLED optimisé pour réduire fatigue oculaire

**Opportunity 4 : Guidage Contextuel Intelligent**
- Michel abandonnerait si trop complexe, Sophie veut explorer seule
- **UX Innovation** : Tooltips contextuels adaptés au profil (Michel = guidage fort, Sophie = minimal)

**Opportunity 5 : Feedback Haptique (Actions Critiques)**
- Confirmation actions importantes en conditions terrain
- **UX Innovation** : Haptic feedback pour drag & drop planning, validation transmission, sync réussie

**Opportunity 6 : Accessibilité Soleil (Contraste Élevé)**
- Utilisation en extérieur fréquente (entre patients, parking)
- **UX Innovation** : Mode contraste élevé automatique (détection luminosité), police 16px minimum

## Core User Experience

### Defining Experience

**Double Action Centrale : Planning + Transmissions**

KURA repose sur **deux actions centrales indissociables** qui, combinées, créent le gain de temps promis (30+ min/jour) :

**Action Centrale 1 : Gérer Son Planning Quotidien**
- **Fréquence** : 1 fois/jour (matin avant tournée)
- **Objectif** : Passer de planification manuelle (30 min + charge mentale) à planning optimisé instantané
- **Flow critique** : Ouvrir app → voir planning auto-généré → (optionnel) réorganiser en glisser-déposer → lancer tournée
- **Success** : Marie voit planning optimisé en < 5s, peut modifier en 1-2 gestes si nécessaire

**Action Centrale 2 : Saisir Transmission Patient**
- **Fréquence** : 8-12 fois/jour (1 par patient visité)
- **Objectif** : Passer de saisie manuelle (45 min total le soir) à saisie express 2-3 min/transmission
- **Flow critique** : Sélectionner patient → dicter OU écrire → valider → enregistré → badge "transmission faite"
- **Success** : Transmission saisie en < 3 min (vocale validée OU texte avec template)

**Synergie des deux actions :**
- Planning optimisé → gagne 30 min trajets
- Transmissions rapides → gagne 30-40 min saisie
- **Total = 1h gagnée quotidiennement** (moment "Waouh")

### Platform Strategy

**Application Mobile Native (Priorité 1)**

**Plateformes cibles :**
- iOS 14+ (iPhone 6s et plus récents)
- Android 8.0+ (API 26, couverture 95%+ marché)
- Framework : React Native / Expo (code partagé 90%+)

**Interaction principale :** Touch-based (tactile)
- Large touch targets : 44x44px minimum (recommandations Apple/Android)
- Gestures critiques : tap, long press, swipe, drag & drop
- Haptic feedback pour actions importantes

**Contextes d'utilisation mobiles critiques :**

**🚗 En voiture (entre patients) :**
- Planning consulté/modifié rapidement
- Lancement navigation 1-tap
- Contraintes : Une main, attention limitée, besoin rapidité

**🌞 Extérieur / Plein soleil :**
- Contraste élevé obligatoire (lisibilité)
- Mode auto-ajustement luminosité
- Police 16px minimum (NFR-ACC-2)

**🧤 Avec gants (hiver, soins) :**
- Touch targets larges (pas de petits boutons)
- Pas d'interactions fines (pas de sliders petits)

**📵 Zones blanches (offline total) :**
- 100% fonctionnalités accessibles sans réseau
- Indicateur statut sync toujours visible
- Feedback rassurant "données sauvegardées localement"

**🌙 Soir à domicile :**
- Transmissions (si pas faites terrain)
- Dark mode confortable (réduction fatigue oculaire)
- Temps de saisie réduit (objectif < 15 min total vs 45 min actuellement)

**Back Office Web (Priorité 2 - Admin uniquement)**

**Plateforme cible :**
- Desktop navigateurs modernes (Chrome, Firefox, Safari)
- Responsive design (tablette compatible)

**Interaction principale :** Clavier + Souris
- Tableaux de données (liste patients, IDEL, stats)
- Import CSV (drag & drop de fichiers)
- Formulaires configuration (onboarding admin)

**Contexte d'utilisation :**
- Cabinet, bureau admin
- Configuration initiale (2h onboarding)
- Gestion quotidienne structure (10-15 min/jour)

**Offline Requirements :**
- Non requis pour Back Office (toujours connexion cabinet)
- Synchronisation temps réel avec mobile IDEL

### Effortless Interactions

**Interactions Zéro Friction (Must Be Perfect) :**

**1. Marquer Patient Absent** (Urgence Terrain)
- **Contexte** : Marie arrive chez patient, personne ne répond, doit réorganiser tournée immédiatement
- **UX Effortless** : Long press sur patient planning → menu contextuel → "Patient absent" → planning recalcule instantanément (< 2s)
- **Feedback** : Vibration haptic + animation recalcul + prochain patient surligné
- **Undo** : Swipe pour annuler si erreur

**2. Lancer Navigation Prochain Patient** (Action Ultra-Fréquente)
- **Contexte** : Transmission terminée, direction patient suivant
- **UX Effortless** : Tap sur bouton "Suivant" floating → GPS natif s'ouvre avec itinéraire chargé
- **Alternative** : Tap directement sur patient dans planning → option "Lancer navigation"
- **Smart** : Suggère "Prochain patient dans 5 min" avec countdown

**3. Validation Transcription IA Vocale** (Innovation Clé)
- **Contexte** : Marie dicte transmission 30s, IA transcrit, doit valider avant enregistrement (HDS obligatoire)
- **UX Effortless** : 
  - Transcription affichée avec lecture aisée
  - Différences audio/texte surlignées (si détection incertitude IA)
  - Édition inline (tap pour corriger mot directement)
  - Validation 1-tap bouton "Valider et Enregistrer" large
  - Replay audio possible si doute
- **Feedback** : Confirmation visuelle + haptic, badge "Transmission enregistrée"

**4. Voir Statut Synchronisation** (Confiance Offline)
- **Contexte** : Michel offline zone blanche, veut savoir si données safe
- **UX Effortless** : 
  - Icône sync permanente dans header (discrète mais visible)
  - 3 états clairs : ✅ Sync (vert), 🔄 En cours (orange animé), ⚠️ Non sync (badge rouge)
  - Tap sur icône → détails sync (X transmissions en attente, dernière sync il y a 2h)
- **Feedback** : Message rassurant "Données sauvegardées localement"

**5. Accéder Fiche Patient Depuis Planning** (Consultation Rapide)
- **Contexte** : Marie chez patient, doit voir historique constantes avant soin
- **UX Effortless** : Tap sur patient dans planning → fiche patient slide de droite (modal) → constantes visibles top
- **Retour** : Swipe vers droite ou tap "Retour" → retour planning
- **Smart** : Dernières constantes affichées en premier (pas besoin scroll)

**6. Authentification Biométrique** (Sécurité Sans Friction)
- **Contexte** : Marie ouvre app 10-15 fois/jour, MFA obligatoire mais doit être fluide
- **UX Effortless** : Face ID / Touch ID → accès direct (< 1s)
- **Fallback** : Si biométrie échoue 2 fois → mot de passe + MFA classique
- **First login day** : Mot de passe + MFA setup → biométrie activée pour sessions suivantes

### Critical Success Moments

**Moment 1 : Première Ouverture Planning (Jour 1)**
- **Quand** : Marie ouvre KURA premier jour, voit planning auto-généré
- **Success** : "Wow, c'est déjà fait ? Et c'est cohérent avec mes habitudes"
- **Failure** : Planning aberrant (patient loin en premier) → perte confiance immédiate
- **UX Critical** : Algorithme doit être pertinent dès J1, OU message "Je vais apprendre vos préférences, modifiez si besoin"

**Moment 2 : Première Modification Planning (Contrôle)**
- **Quand** : Marie veut changer ordre, teste le glisser-déposer
- **Success** : Drag & drop fluide, planning recalcule instantanément, elle garde le contrôle
- **Failure** : Gesture buggy OU recalcul lent → "L'algo m'impose, je ne peux pas changer" → abandon
- **UX Critical** : Manipulation intuitive, feedback instantané, undo facile

**Moment 3 : Première Transmission Vocale (Innovation Test)**
- **Quand** : Marie teste IA vocale première fois
- **Success** : Transcription précise (95%+), validation rapide (< 1 min), gain temps évident
- **Failure** : Transcription erronée (< 70%) → validation prend 5 min → "Plus lent que écrire" → abandon feature
- **UX Critical** : Qualité transcription OU message clair "Vous pouvez utiliser mode texte si préféré"

**Moment 4 : Première Zone Blanche (Offline Test)**
- **Quand** : Michel en campagne, perd réseau, app doit fonctionner
- **Success** : Tout fonctionne normalement, indicateur montre "Hors ligne - OK", rassurance
- **Failure** : Features grises/désactivées OU aucun indicateur → "C'est cassé ?" → stress
- **UX Critical** : Feedback clair "Mode hors ligne actif", aucune feature désactivée

**Moment 5 : Visualisation Temps Gagné (Semaine 1 - Conviction)**
- **Quand** : Fin première semaine, Marie veut voir si ça vaut le coup
- **Success** : Dashboard montre "35 min gagnées en moyenne/jour cette semaine" → conviction
- **Failure** : Aucune mesure visible → Marie ne perçoit pas gain → abandon
- **UX Critical** : Visualisation concrète (chiffres, graphiques, comparaison avant/après)

**Moment 6 : Onboarding Michel (Adoption Réticent)**
- **Quand** : Michel utilise KURA première fois, doit être autonome rapidement
- **Success** : Onboarding 10-15 min, comprend essentiel, se sent capable
- **Failure** : Trop complexe, trop long (> 30 min) → "C'est pas pour moi" → abandon immédiat
- **UX Critical** : Guidage pas-à-pas, peut skip si déjà compris, tooltips contextuels permanents

### Experience Principles

**Principe 1 : Contrôle Utilisateur Absolu**
- L'IA suggère (planning optimisé, transcription), l'humain décide (modification, validation)
- Jamais d'imposition, toujours possibilité de désactiver IA (mode manuel pur)
- Undo/redo disponible sur actions critiques
- **Guideline** : Chaque suggestion IA = option, pas obligation

**Principe 2 : Rapidité Terrain (One-Tap Actions)**
- Actions critiques accessibles en 1-2 taps maximum
- Pas de navigation profonde pour fonctions fréquentes
- Floating action buttons pour actions contextuelles
- **Guideline** : Si utilisé > 5 fois/jour → max 2 taps pour y accéder

**Principe 3 : Offline Transparent**
- Utilisateur ne doit jamais se demander "Est-ce que ça va marcher sans réseau ?"
- Indicateur statut toujours visible mais discret
- Feedback rassurant sur sauvegarde locale
- **Guideline** : Offline = invisible (tout fonctionne), sync = visible (statut clair)

**Principe 4 : Progressive Disclosure (Michel vs Sophie)**
- Interface simple par défaut (Michel ne voit que l'essentiel)
- Features avancées révélées à la demande (Sophie peut explorer)
- Personnalisation niveau guidage selon profil utilisateur
- **Guideline** : Essentiel visible, avancé accessible (pas imposé)

**Principe 5 : Feedback Visuel Immédiat**
- Chaque action → retour visuel instantané (< 100ms perçu comme instantané)
- Success = feedback positif (vert, checkmark, haptic)
- Error = feedback clair avec solution (rouge, message actionable)
- **Guideline** : Jamais d'action silencieuse, toujours confirmer visuellement

**Principe 6 : Confiance & Sécurité Visible**
- Sécurité HDS/MFA = point fort (Sophie rassurée)
- Indicateurs sécurité subtils mais présents (cadenas, badge HDS certifié)
- Transparence validation IA (afficher version originale + validée)
- **Guideline** : Sécurité = visible sans être intrusive, confiance = explicite

## Desired Emotional Response

### Primary Emotional Goals

**Émotion Centrale : Sérénité Efficace**

KURA doit créer un sentiment de **sérénité efficace** - l'utilisateur se sent à la fois :
- **Serein** : pas de stress organisation, confiance que tout fonctionne (même offline)
- **Efficace** : gagne du temps concrètement, actions fluides, sentiment de maîtrise

**Par Persona :**

**Marie (80%) :** Sérénité + Satisfaction du temps gagné
- Passe de "stress charge mentale" à "contrôle serein de ma journée"
- Émotion clé : **Soulagement** ("Je rentre plus tôt chez moi") + **Fierté** ("J'ai optimisé ma tournée")

**Sophie (15%) :** Empowerment + Confiance dans rentabilité
- Passe de "stress financier dispersion" à "maîtrise optimisation"
- Émotion clé : **Empowerment** ("Je pilote ma rentabilité") + **Enthousiasme** ("Les analytics me montrent mon ROI")

**Michel (5%) :** Surprise positive + Capacité
- Passe de "anxiété tech" à "confiance en capacités"
- Émotion clé : **Soulagement** ("C'est pas si compliqué") + **Fierté discrète** ("J'y arrive même à mon âge")

**Admin (Claire) :** Contrôle + Efficacité gestion
- Passe de "jonglage complexe" à "pilotage centralisé"
- Émotion clé : **Efficacité** ("2h config, tout est en place") + **Satisfaction** ("Vision globale structure")

**Médecin :** Réassurance + Collaboration facilitée
- Passe de "incertitude évolution patients" à "suivi serein"
- Émotion clé : **Réassurance** ("Je vois l'évolution en temps réel") + **Confiance** ("Coordination IDEL facilitée")

### Emotional Journey Mapping

**Découverte (Jour 0) :**
- **Émotion actuelle** : Curiosité + Scepticisme ("Encore un outil ?")
- **Émotion désirée** : Intérêt + Ouverture ("Ça a l'air sérieux, je vais tester")
- **UX pour y arriver** : Design professionnel, branding santé, certification HDS visible dès App Store

**Première Ouverture (Jour 1) :**
- **Émotion actuelle** : Appréhension ("Ça va être compliqué ?")
- **Émotion désirée** : Surprise positive ("Ah, c'est déjà configuré ?")
- **UX pour y arriver** : Tout pré-configuré par admin, planning déjà généré, message accueil personnalisé

**Première Action (Jour 1) :**
- **Émotion actuelle** : Hésitation ("Comment je fais ?")
- **Émotion désirée** : Découverte facile ("Ok, j'ai compris")
- **UX pour y arriver** : Premier succès rapide (< 5 min), tooltips contextuels, feedback positif immédiat

**Utilisation Quotidienne (Semaine 1) :**
- **Émotion actuelle** : Test ("Est-ce que ça tient ses promesses ?")
- **Émotion désirée** : Efficacité croissante ("Ça marche vraiment bien")
- **UX pour y arriver** : Interactions fluides, temps de réponse rapides (< 2s), offline fiable

**Moment "Waouh" (Fin Semaine 1) :**
- **Émotion actuelle** : Évaluation ("Ça vaut le coup ?")
- **Émotion désirée** : Conviction ("Je gagne vraiment du temps !")
- **UX pour y arriver** : Dashboard temps gagné visible, graphiques avant/après, badge "35 min gagnées aujourd'hui"

**Adoption (Semaine 2-3) :**
- **Émotion actuelle** : Habitude naissante
- **Émotion désirée** : Confiance + Dépendance positive ("Je ne peux plus m'en passer")
- **UX pour y arriver** : Expérience cohérente sans surprises, fiabilité absolue, pas de bugs

**Ambassadrice (Post-Adoption) :**
- **Émotion actuelle** : Satisfaction
- **Émotion désirée** : Fierté + Envie de partager ("Mes collègues doivent essayer")
- **UX pour y arriver** : Features remarquables à montrer, demo facile, onboarding rapide pour nouveaux

### Micro-Emotions

**Confiance vs Scepticisme** (Healthcare Critique)
- **Contexte** : Données santé sensibles, réglementation stricte (HDS/RGPD)
- **Émotion désirée** : Confiance absolue dans sécurité et conformité
- **Émotion à éviter** : Doute sur sécurité, anxiété fuites données
- **Impact UX** : Sophie adopte car "MFA = personne ne peut se connecter sans mon consentement"

**Contrôle vs Impuissance** (IA Assistante Philosophie)
- **Contexte** : Algorithme suggère planning, IA transcrit transmissions
- **Émotion désirée** : Maîtrise totale ("L'IA m'assiste, ne me remplace pas")
- **Émotion à éviter** : Sentiment d'imposition, perte de contrôle professionnel
- **Impact UX** : Marie teste modification planning → "Ok, ça garde mon contrôle" → adoption

**Efficacité vs Frustration** (Promesse Gain Temps)
- **Contexte** : Promesse marketing = 30+ min gagnées/jour
- **Émotion désirée** : Sentiment d'efficacité mesurable
- **Émotion à éviter** : Frustration "Ça prend autant de temps qu'avant"
- **Impact UX** : Timer visible, dashboard comparatif, feedback "Transmission en 2 min vs 10 min avant"

**Sérénité vs Stress** (Offline Zones Blanches)
- **Contexte** : 66% IDEL rencontrent problèmes réseau terrain
- **Émotion désirée** : Sérénité ("Ça marche toujours")
- **Émotion à éviter** : Anxiété "Mes données sont-elles sauvegardées ?", stress perte connexion
- **Impact UX** : Michel zone blanche → voit "Hors ligne - Données sauvegardées" → rassurance

**Accomplissement vs Échec** (Progress & Success)
- **Contexte** : 8-12 patients/jour, besoin sentir progression
- **Émotion désirée** : Accomplissement quotidien ("J'ai terminé ma journée")
- **Émotion à éviter** : Sentiment d'inachevé, doute "Ai-je tout fait ?"
- **Impact UX** : Badge "8/8 patients vus", checkmarks verts, transmissions toutes faites = satisfaction

**Capacité vs Dépassement** (Michel Adoption)
- **Contexte** : Michel 58 ans, faible tech, réticent
- **Émotion désirée** : "Je suis capable" (confiance en soi)
- **Émotion à éviter** : Dépassement "C'est trop dur pour moi" → abandon immédiat
- **Impact UX** : Onboarding progressif, Michel dit "C'est pas si terrible, même à mon âge"

### Design Implications

**Confiance (Sécurité Healthcare) → UX Design :**
- Badge "HDS Certifié" visible dans header app
- Icône cadenas sur données sensibles
- MFA setup guidé avec explications claires
- Logs accès consultables (transparence)
- Message "Vos données sont protégées" lors première connexion

**Contrôle (IA Assistante) → UX Design :**
- Drag & drop planning fluide et réactif (< 100ms feedback)
- Bouton "Mode Manuel" accessible en 1 tap depuis settings
- Historique modifications planning consultable
- Undo visible et permanent (icône flèche retour)
- Désactivation IA vocale possible (switch dans settings)

**Efficacité (Gain Temps) → UX Design :**
- Dashboard "Temps gagné" accessible depuis menu principal
- Timer visible pendant saisie transmission (feedback temps réel)
- Raccourcis 1-tap pour actions fréquentes (navigation, patient absent)
- Templates prédéfinis 3-5 types (sélection rapide)
- Badge journalier "Vous avez gagné 35 min aujourd'hui"

**Sérénité (Offline) → UX Design :**
- Icône sync dans header permanente mais discrète (coin sup droit)
- 3 états visuels clairs : ✅ Sync, 🔄 En cours, ⚠️ Non sync (avec badge count)
- Message rassurant "Hors ligne - Données sauvegardées localement" si perte réseau
- Queue sync visible (tap sur icône → "3 transmissions en attente de sync")
- Aucune feature désactivée en mode offline

**Accomplissement (Progress) → UX Design :**
- Progress bar journée "6/8 patients vus" dans header planning
- Checkmarks verts sur patients terminés (transmission faite)
- Badge "Journée complétée" quand 8/8 fait
- Récapitulatif fin journée "8 patients, 6h45 tournée, 12 transmissions"
- Animation célébration subtile quand journée complète

**Capacité (Michel Accessible) → UX Design :**
- Onboarding interactif pas-à-pas (3-4 écrans max)
- Bouton "Passer" sur chaque étape onboarding (si déjà compris)
- Tooltips contextuels permanents (icône "?" sur features complexes)
- Interface épurée par défaut (features avancées dans menu "Plus")
- Mode "Guidage renforcé" activable dans settings

### Emotional Design Principles

**Principe Émotionnel 1 : Rassurer Sans Infantiliser**
- Utilisateurs = professionnels de santé expérimentés (8-25 ans exercice)
- **Design** : Guidage discret, messages respectueux, pas de ton condescendant
- **Exemple** : "Planning optimisé prêt" (pas "Bravo ! Vous avez réussi !")

**Principe Émotionnel 2 : Célébrer les Victoires Quotidiennes**
- Gain temps = victoire quotidienne à valoriser
- **Design** : Dashboard temps gagné, badges progression, feedback positif actions complétées
- **Exemple** : "35 min gagnées aujourd'hui" avec animation subtile, pas exubérante

**Principe Émotionnel 3 : Transparence Totale (Confiance Healthcare)**
- Données santé sensibles = besoin transparence absolue
- **Design** : Logs accès visibles, historique modifications, version originale IA consultable
- **Exemple** : Transmission montre "Dictée originale" + "Version validée par vous" + timestamp

**Principe Émotionnel 4 : Feedback Positif > Feedback Négatif**
- Encourager adoption, pas punir erreurs
- **Design** : Success messages visibles, erreurs discrètes avec solution
- **Exemple** : Sync réussie = badge vert, sync échouée = icône orange + "Retry automatique dans 5s"

**Principe Émotionnel 5 : Contrôle = Confiance**
- Utilisateur sent qu'il maîtrise l'outil → confiance → adoption
- **Design** : Toujours offrir choix (IA suggère OU mode manuel), undo facile, settings accessibles
- **Exemple** : Planning IA + bouton "Modifier manuellement" toujours visible

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**1. WAZE - Navigation Optimisée & Recalcul Temps Réel**

**Ce qu'ils font bien :**
- **Optimisation intelligente** : Calcul meilleur itinéraire en temps réel avec conditions trafic
- **Recalcul instantané** : Si déviation, recalcule automatiquement sans intervention
- **Feedback visuel clair** : Temps estimé arrivée visible, alertes visuelles dangers
- **One-tap actions** : Signaler incident = 1 tap, pas de formulaire complexe
- **Communauté** : Autres utilisateurs enrichissent données (pertinent pour V2 KURA ?)

**Patterns transférables pour KURA :**
- **Optimisation transparente** : Afficher pourquoi ce planning (distance, durée, contraintes) comme Waze affiche raisons itinéraire
- **Recalcul instantané** : Patient absent → nouveau planning en < 2s comme Waze recalcule itinéraire
- **ETA visible** : "Arrivée chez Mme Durand dans 12 min" comme Waze affiche ETA
- **One-tap reporting** : "Patient absent" en 1 tap comme Waze signale incident
- **Navigation intégrée** : Tap sur patient → lance Waze/GPS natif avec adresse pré-chargée

**Visual Design :**
- Interface carte dominante, infos superposées
- Couleurs vives pour alertes (orange = attention, rouge = urgent)
- Touch targets larges pour usage voiture

**2. WHATSAPP - Vocal Simplifié & Familiarité Universelle**

**Ce qu'ils font bien :**
- **Messages vocaux ultra-simples** : Hold to record, release to send (0 friction)
- **Feedback visuel immédiat** : Onde sonore animée pendant enregistrement
- **Playback facile** : Tap pour réécouter, vitesse lecture ajustable (1x, 1.5x, 2x)
- **Familiarité** : 99% utilisateurs IDEL connaissent déjà WhatsApp
- **Offline messaging** : Messages envoyés quand réseau revient (queue transparente)

**Patterns transférables pour KURA :**
- **Vocal familiar** : Hold bouton micro pour dicter transmission (gesture WhatsApp connu)
- **Feedback enregistrement** : Onde sonore + timer visible pendant dictée
- **Playback transcription** : Tap pour réécouter audio original si doute sur transcription IA
- **Queue sync** : Transmissions en attente affichées avec badge count (comme messages non envoyés WhatsApp)
- **Simplicité absolue** : Si WhatsApp vocal fonctionne pour grand-mères, fonctionne pour Michel 58 ans

**Visual Design :**
- Bouton micro central et large (impossible de rater)
- Feedback visuel pendant enregistrement (onde sonore)
- Checkmarks bleus quand message reçu (adapté : transmission synchronisée)

**3. APPLE HEALTH - Visualisation Constantes & Graphiques Santé**

**Ce qu'ils font bien :**
- **Graphiques constantes clairs** : Courbes tension, fréquence cardiaque, poids over time
- **Zoom temporel** : Jour / Semaine / Mois / Année (ajustement granularité)
- **Valeurs normales** : Zones vertes (normal), orange (attention), rouge (alerte)
- **Dashboard synthétique** : Infos essentielles en un coup d'œil
- **Design santé professionnel** : Crédible, sobre, pas ludique

**Patterns transférables pour KURA :**
- **Graphiques constantes patients** : Courbes tension, glycémie, poids inspirées Apple Health (familiarité)
- **Zones normales visuelles** : Ligne verte "tension normale 12/8", alerte orange si hors zone
- **Zoom temporel** : Historique patient sur 1 semaine / 1 mois / 6 mois
- **Dashboard synthèse** : Dernières constantes + tendance (↗️↘️) en haut fiche patient
- **Branding santé** : Design sobre et professionnel (crédibilité healthcare)

**Visual Design :**
- Blanc dominant, couleurs santé (vert = bon, orange = attention, rouge = alerte)
- Typography médicale (SF Pro pour iOS, Roboto pour Android)
- Graphiques minimalistes, données denses mais lisibles

**4. VEGA - Anti-Modèle à Éviter Absolument**

**Ce qu'ils font MAL (à ne PAS reproduire) :**

❌ **Interface datée (pré-2015)** :
- Design vieillot, pas natif mobile
- **KURA doit** : Design moderne, native mobile, suivre guidelines iOS/Android 2026

❌ **Pas de planning intelligent** :
- Organisation 100% manuelle, aucune suggestion
- **KURA doit** : Algorithme suggère, utilisateur ajuste (combo IA + contrôle)

❌ **Offline limité et buggy** :
- Fonctionnalités désactivées sans réseau, sync échoue fréquemment
- **KURA doit** : 100% fonctionnel offline, sync fiable avec queue persistante

❌ **Complexité excessive** :
- Trop de menus, navigation profonde, fonctionnalités cachées
- **KURA doit** : Navigation plate (max 2-3 niveaux), actions fréquentes en 1-2 taps

❌ **Pas de feedback temps gagné** :
- Utilisateur ne voit pas bénéfice concret
- **KURA doit** : Dashboard "Temps gagné", métriques visibles, moment "Waouh"

❌ **Onboarding inexistant** :
- Utilisateur livré à lui-même
- **KURA doit** : Onboarding guidé 10-15 min, tooltips permanents option

**Leçon principale VEGA :**
> "Ne pas innover sur l'UX tue l'adoption même si fonctionnalités existent"

KURA doit être l'**opposé UX de Vega** : moderne, simple, intuitif, intelligent.

### Transferable UX Patterns

**Pattern 1 : Optimisation Transparente (Inspiré WAZE)**
- **Quoi** : Afficher pourquoi algorithme suggère cet ordre planning
- **Où** : Planning screen, icône "ℹ️" tap → "Mme Dupont d'abord car sur votre route + RDV 9h"
- **Bénéfice** : Confiance algorithme, utilisateur comprend logique

**Pattern 2 : Hold-to-Record Vocal (Inspiré WHATSAPP)**
- **Quoi** : Hold bouton micro pour dicter transmission, release pour terminer
- **Où** : Écran transmission, bouton micro large central
- **Bénéfice** : Gesture familier (99% IDEL utilisent WhatsApp), 0 apprentissage

**Pattern 3 : Graphiques Constantes Familiers (Inspiré APPLE HEALTH)**
- **Quoi** : Courbes constantes (tension, glycémie, poids) avec zones normales colorées
- **Où** : Fiche patient, onglet "Constantes"
- **Bénéfice** : Visualisation rapide évolution, pattern familier utilisateurs iPhone

**Pattern 4 : ETA Dynamique (Inspiré WAZE)**
- **Quoi** : "Arrivée chez prochain patient dans 12 min" avec mise à jour temps réel
- **Où** : Header planning, card patient suivant
- **Bénéfice** : Anticipation, gestion temps, stress réduit

**Pattern 5 : Queue Messages (Inspiré WHATSAPP)**
- **Quoi** : Badge count transmissions en attente sync (ex: "3 transmissions non synchronisées")
- **Où** : Icône sync header, liste transmissions avec badge orange
- **Bénéfice** : Transparence sync, utilisateur sait ce qui attend réseau

**Pattern 6 : Checkmarks Satisfaction (Inspiré WHATSAPP + TODOIST)**
- **Quoi** : Checkmark vert quand patient vu + transmission faite
- **Où** : Liste planning, chaque patient
- **Bénéfice** : Sentiment accomplissement, progression visible

**Pattern 7 : Dashboard Santé Sobre (Inspiré APPLE HEALTH)**
- **Quoi** : Design blanc, couleurs santé (vert/orange/rouge), typography médicale
- **Où** : Toute l'app, branding global
- **Bénéfice** : Crédibilité professionnelle healthcare, pas ludique

### Anti-Patterns to Avoid

**Anti-Pattern 1 : Interface Datée Non-Native (VEGA)**
- **Problème** : Design web responsive forcé en mobile, pas de gestures natives
- **Impact** : Sentiment "vieux logiciel", friction interactions
- **KURA évite** : React Native natif, gestures iOS/Android standards (swipe, long press, drag)

**Anti-Pattern 2 : Features Désactivées Offline (VEGA)**
- **Problème** : Boutons grisés ou erreurs "Connexion requise" sans réseau
- **Impact** : Stress utilisateur, perte confiance, sentiment "C'est cassé"
- **KURA évite** : 100% features fonctionnelles offline, sync transparente en background

**Anti-Pattern 3 : Navigation Profonde Complexe (VEGA)**
- **Problème** : 4-5 niveaux menus pour accéder fonction courante
- **Impact** : Temps perdu, frustration, "Où est cette fonction déjà ?"
- **KURA évite** : Navigation plate max 2-3 niveaux, actions fréquentes en 1-2 taps

**Anti-Pattern 4 : Pas de Feedback Visuel Temps Gagné (VEGA)**
- **Problème** : Utilisateur ne voit pas bénéfice concret
- **Impact** : Pas de "moment Waouh", abandon faute de conviction
- **KURA évite** : Dashboard temps gagné, timer comparatif, métriques visibles

**Anti-Pattern 5 : Onboarding Absent ou Trop Long (VEGA + Apps Complexes)**
- **Problème** : Soit aucun guidage, soit tutorial 30 min ennuyeux
- **Impact** : Michel abandonnerait immédiatement
- **KURA évite** : Onboarding interactif 10-15 min, skippable si compris, tooltips permanents

**Anti-Pattern 6 : Sync Bugs Fréquents (VEGA Offline Limité)**
- **Problème** : Données perdues, conflits non résolus, sync échoue sans explication
- **Impact** : Perte confiance totale, anxiété données
- **KURA évite** : Queue persistante garantie 0 perte, retry automatique, statut sync clair

**Anti-Pattern 7 : Complexité Inutile (Over-Engineering UX)**
- **Problème** : Trop d'options, réglages complexes, surcharge cognitive
- **Impact** : Michel : "C'est trop compliqué"
- **KURA évite** : Progressive disclosure, essentiel visible, avancé caché mais accessible

### Design Inspiration Strategy

**Ce que KURA Adopte (Directement) :**

**De WAZE :**
- ✅ Optimisation transparente : afficher pourquoi cette suggestion planning
- ✅ Recalcul instantané : patient absent → nouveau planning < 2s
- ✅ ETA dynamique : "Prochain patient dans 12 min"
- ✅ One-tap actions : signaler incident = signaler patient absent

**De WHATSAPP :**
- ✅ Hold-to-record vocal : gesture familier universel
- ✅ Onde sonore feedback : visualisation enregistrement en cours
- ✅ Playback simple : tap pour réécouter audio
- ✅ Checkmarks progression : double check bleu = transmission synchronisée

**D'APPLE HEALTH :**
- ✅ Graphiques constantes : courbes tension/glycémie/poids over time
- ✅ Zones normales colorées : vert = OK, orange = attention, rouge = alerte
- ✅ Dashboard synthétique : dernières constantes + tendance en haut
- ✅ Branding santé sobre : blanc, couleurs médicales, typography professionnelle

**Ce que KURA Adapte (Modifie pour Contexte IDEL) :**

**WAZE → KURA Planning :**
- Adaptation : Optimisation tient compte **durée soins** (pas juste distance), horaires patients, préférences IDEL
- Modification : Carte optionnelle (pas dominante), liste planning prioritaire (plus rapide consulter)

**WHATSAPP → KURA Transmissions :**
- Adaptation : Vocal + **validation obligatoire** (réglementation HDS) vs WhatsApp direct
- Modification : Transcription IA affichée pour validation, édition inline possible, audit trail

**APPLE HEALTH → KURA Constantes :**
- Adaptation : Graphiques **multi-patients** (pas 1 utilisateur), historique 6 mois (pas années)
- Modification : Saisie constantes par IDEL (pas auto-tracking capteurs), export PDF médecins

**Ce que KURA Évite Absolument (Anti-Modèle VEGA) :**

❌ Interface datée non-native → ✅ Design moderne React Native natif iOS/Android  
❌ Offline buggy limité → ✅ Offline-first architectural, 100% fonctionnel sans réseau  
❌ Navigation profonde complexe → ✅ Navigation plate max 2-3 niveaux  
❌ Pas de feedback temps gagné → ✅ Dashboard métriques, timer, visualisation gain  
❌ Onboarding absent → ✅ Onboarding guidé 10-15 min, skippable, tooltips  
❌ Sync bugs fréquents → ✅ Queue persistante, retry auto, 0 perte données garantie  
❌ Complexité excessive → ✅ Progressive disclosure, essentiel visible, avancé caché

### Design Inspiration Strategy Summary

**Philosophie UX KURA :**
> "Combiner la familiarité de Waze + WhatsApp + Apple Health dans un contexte professionnel healthcare IDEL, en évitant tous les pièges de Vega"

**Navigation Planning = WAZE** (optimisation intelligente, recalcul, ETA)  
**Transmissions Vocales = WHATSAPP** (hold-to-record, playback, simplicité)  
**Constantes Patients = APPLE HEALTH** (graphiques sobres, zones normales, dashboard)  
**À ÉVITER = VEGA** (interface datée, offline buggy, complexité, pas de feedback)

**Unique à KURA :**
- IA assistante (suggère, ne décide jamais) - pas dans Waze/WhatsApp/Health
- Double validation vocale (IA transcrit + humain valide) - réglementation HDS
- Offline-first absolu (pas juste "offline capable") - zones blanches 66%
- Multi-rôles isolés (IDEL, Admin, Médecin) - pas dans apps grand public

## Design System Foundation

### Design System Choice

**Choix : React Native Paper (Material Design 3 pour React Native)**

React Native Paper est le design system sélectionné pour KURA, offrant une fondation solide de composants natifs iOS/Android avec customisation brand healthcare.

**Type** : Système themeable établi (Material Design 3)  
**Framework** : React Native natif (compatible Expo)  
**Version** : React Native Paper 5.x (Material Design 3)  
**Licence** : MIT (open source)

### Rationale for Selection

**1. Compatibilité Technique Parfaite**
- **React Native natif** : Composants natifs iOS/Android, pas de web wrappers
- **Compatible Expo** : Pas besoin eject immédiat pour MVP
- **Performance** : Gestures natives (swipe, drag & drop), haptic feedback supporté
- **Offline-aware** : Composants peuvent gérer états offline/online

**2. Rapidité Développement (Critical pour Timeline Soutenance)**
- **Bibliothèque complète** : 60+ composants prêts (Buttons, Cards, Lists, Forms, Navigation, Modals)
- **Focus logique métier** : Dev se concentre sur planning IA et sync offline, pas sur UI basique
- **Documentation riche** : Exemples code, playground interactif, communauté active
- **Time-to-market** : Gain 30-40% temps dev UI vs custom from scratch

**3. Familiarité Utilisateur (Marie, Sophie, Michel)**
- **Material Design reconnu** : 70%+ apps Android utilisent Material (familiarité patterns)
- **Guidelines accessibilité** : WCAG compliance intégrée, touch targets 48dp (équivalent 44px iOS)
- **Patterns standards** : Navigation drawer, FAB (Floating Action Button), Snackbar familiar

**4. Customisation Brand Healthcare**
- **Theming flexible** : Couleurs, typography, spacing, border radius customisables
- **Couleurs santé** : Blanc dominant, vert santé (#4CAF50), bleu médical (#2196F3), rouge alerte (#F44336)
- **Typography médicale** : SF Pro (iOS), Roboto (Android) - polices système natives
- **Composants custom** : Peut créer composants spécifiques KURA (graphiques constantes, planning card)

**5. Accessibilité Native (Michel + NFR-ACC Requirements)**
- **Contraste couleurs** : Palette MD3 respecte WCAG 2.1 AA minimum
- **Touch targets** : 48dp par défaut (> 44px requis NFR-ACC-2)
- **Police lisible** : 16sp minimum (Michel 58 ans, lisibilité critique)
- **Screen readers** : Support Android TalkBack et iOS VoiceOver (bonus accessibilité)

**6. Dark Mode Intégré** (Opportunity 3 - Saisie Nocturne)
- **Support natif** : Dark theme MD3 avec palette adaptée
- **Auto-switch** : Détection préférences système iOS/Android
- **OLED optimisé** : Noirs purs (#000000) pour économie batterie

**Alternatives Considérées et Rejetées :**

**NativeBase :** Similaire mais communauté plus petite, docs moins complètes, mise à jour moins fréquente  
**Tamagui :** Ultra-performant mais courbe apprentissage élevée, overkill pour MVP, complexité inutile  
**iOS Native Only (SwiftUI)** : Exclut Android (50% marché IDEL), double dev requis  
**Custom From Scratch :** 3-4 semaines dev juste pour composants de base, risque bugs, timeline soutenance incompatible

### Implementation Approach

**Phase 1 : Setup & Configuration (Jour 1-2)**
- Installation : `npm install react-native-paper`
- Configuration thème KURA : couleurs healthcare, typography médicale
- Setup navigation : React Navigation avec Paper integration
- Import icônes : Material Community Icons (5000+ icônes)

**Phase 2 : Composants Core (Semaine 1-2)**
- **Planning** : List, Card, FAB (floating action button pour "Patient absent")
- **Transmissions** : TextInput, Button (micro), Surface (transcription display)
- **Navigation** : Bottom tabs (Planning, Patients, Transmissions, Profil)
- **Sync Status** : Badge, IconButton (header sync indicator)

**Phase 3 : Composants Custom KURA (Semaine 3-4)**
- **PlanningCard** : Carte patient avec drag handle, ETA, statut transmission
- **ConstantesChart** : Graphique courbes inspiré Apple Health (custom component)
- **VoiceRecorder** : Bouton micro hold-to-record inspiré WhatsApp (custom)
- **SyncQueueIndicator** : Indicateur sync avec states (custom overlay)

**Phase 4 : Theming Healthcare (Semaine 4)**
- Couleurs brand : Blanc (#FFFFFF), Vert santé (#4CAF50), Bleu médical (#2196F3)
- Dark mode : Noir OLED (#000000), gris foncé (#121212), accents adaptés
- Typography : SF Pro (iOS), Roboto (Android), tailles 16px min
- Spacing : 8px grid system (Material Design standard)

### Customization Strategy

**Ce qu'on Garde de Material Design 3 :**
- ✅ Composants standards : Button, Card, List, TextInput, Switch, Checkbox
- ✅ Navigation patterns : Bottom tabs, drawer (admin back office), modal
- ✅ Feedback patterns : Snackbar (confirmations), Dialog (alertes importantes)
- ✅ Accessibilité : Contraste, touch targets, screen readers

**Ce qu'on Customise pour KURA :**
- 🎨 **Couleurs** : Palette healthcare (blanc, vert santé, bleu médical) vs palette Material standard
- 🎨 **Typography** : Tailles augmentées (16px min vs 14px MD3) pour Michel lisibilité
- 🎨 **Border radius** : Réduit (8px vs 12px MD3) pour look professionnel médical (pas trop arrondi)
- 🎨 **Elevation/Shadows** : Subtiles (2-4dp) pour professionnel (pas trop ludique)

**Composants Custom KURA (Pas dans Paper) :**
- **PlanningCard** : Carte patient draggable avec infos spécifiques IDEL
- **VoiceRecorderButton** : Hold-to-record inspiré WhatsApp avec onde sonore
- **ConstantesLineChart** : Graphiques tension/glycémie inspirés Apple Health
- **SyncStatusBadge** : Indicateur 3 états (sync, syncing, pending) dans header
- **TimeSavedWidget** : Dashboard "Temps gagné" avec comparaison avant/après

**Branding KURA :**
- **Logo** : À créer (icône stylisée IDEL ou coeur + planning)
- **Couleur primaire** : Bleu médical confiance (#2196F3 ou variant)
- **Couleur secondaire** : Vert santé succès (#4CAF50)
- **Couleur alerte** : Orange attention (#FF9800), Rouge urgence (#F44336)
- **Typographie** : SF Pro iOS / Roboto Android (natives), poids Regular 16px, Medium 18px, Bold 20px
