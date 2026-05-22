# Story 5.3 : Saisie de Transmission par Texte & Templates

Status: review

## Story

En tant qu'IDEL,
Je veux saisir une transmission par texte avec templates prédéfinis selon le type de soin,
Afin d'avoir une alternative rapide à la dictée vocale, utilisable en toutes circonstances.

## Critères d'acceptation

1. **Chips de type de soin → formulaire pré-structuré**
   **Given** l'onglet texte du bottom sheet de transmission
   **When** je sélectionne un type parmi : Toilette · Pansement · Injection · Constantes · Autre
   **Then** un formulaire avec les champs adaptés au type s'affiche

2. **Enregistrement local avec audit trail**
   **Given** le formulaire de transmission affiché
   **When** je complète les champs et tape "Enregistrer"
   **Then** la transmission est sauvegardée en SQLite avec auteur + timestamp
   **And** un haptic feedback + checkmark vert confirme l'enregistrement

3. **Mode texte seul si voix désactivée (FR48)**
   **Given** l'option "Désactiver la saisie vocale" activée dans les paramètres
   **When** j'ouvre le bottom sheet de transmission
   **Then** seul l'onglet "Texte" est affiché (onglet "Dicter" masqué, pas grisé)

## Tâches / sous-tâches

- [x] Créer `features/transmissions/services/care-type-templates.ts`
- [x] Créer `features/transmissions/components/TextTransmissionForm.tsx`
- [x] Créer `features/transmissions/hooks/useTextTransmission.ts` (save SQLite + audit trail)
- [x] Créer `features/transmissions/hooks/useTransmissionPreferences.ts` (FR48 voice disable)
- [x] Mettre à jour `NewTransmissionSheet.tsx` : onglets Dicter/Texte + logique FR48
- [x] Tests Jest pour `useTextTransmission` et `care-type-templates`

## Notes de développement

### Templates par type
Chaque type de soin a une liste de champs `{ key, label, placeholder, multiline? }`.
Le contenu sauvegardé est une concaténation structurée : `"[Label]: valeur\n"`.

### Save SQLite
- Table : `transmissions` (ajoutée en 5.1)
- `content_original: null` (saisie texte, pas IA)
- `content_validated: texte formaté`
- `care_type` : le type sélectionné
- `syncedAt: null` (dirty flag pour sync ultérieure)

### FR48 — voice disable
AsyncStorage key : `@kura/disable_voice_transmission` (boolean stringifié).
`NewTransmissionSheet` : si `disableVoice === true`, affiche directement le tab Texte sans onglets.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
(vide)

### Completion Notes List

- `care-type-templates.ts` : 5 types (toilette/pansement/injection/constantes/autre) × champs structurés ; `formatTemplateFields()` concatène les champs remplis en texte lisible
- `TextTransmissionForm.tsx` : chips de sélection de type + formulaire dynamique + écran de succès (checkmark vert)
- `useTextTransmission.ts` : INSERT SQLite table `transmissions`, `content_original: null`, `syncedAt: null`, haptic Success
- `useTransmissionPreferences.ts` : AsyncStorage `@kura/disable_voice_transmission` (FR48)
- `NewTransmissionSheet.tsx` : onglets Dicter/Texte avec indicateur actif ; si `disableVoice`, onglets masqués et mode texte forcé (AC3 FR48)
- 14 tests passent (4 care-type-templates + 4 useTextTransmission + 2 whisper-service + 4 useVoiceTransmission)

### File List

- `apps/mobile/src/features/transmissions/services/care-type-templates.ts` (créé)
- `apps/mobile/src/features/transmissions/services/care-type-templates.test.ts` (créé)
- `apps/mobile/src/features/transmissions/components/TextTransmissionForm.tsx` (créé)
- `apps/mobile/src/features/transmissions/components/NewTransmissionSheet.tsx` (modifié — onglets + FR48)
- `apps/mobile/src/features/transmissions/hooks/useTextTransmission.ts` (créé)
- `apps/mobile/src/features/transmissions/hooks/useTextTransmission.test.ts` (créé)
- `apps/mobile/src/features/transmissions/hooks/useTransmissionPreferences.ts` (créé)
- `_bmad-output/implementation-artifacts/5-3-saisie-de-transmission-par-texte-templates.md` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-22 : Implémentation story 5.3 — saisie texte & templates ; statut → review
