# Story 5.1 : Saisie de Transmission par Dictée Vocale IA

Status: review

## Story

En tant qu'IDEL,
Je veux dicter ma transmission vocalement après chaque soin, avec transcription locale instantanée par Whisper,
Afin de saisir une transmission complète en moins de 2 minutes au lieu de 10-45 minutes à l'écrit.

## Critères d'acceptation

1. **Hold-to-record (style WhatsApp)**
   **Given** l'écran de saisie de transmission
   **When** l'IDEL maintient appuyé le `VoiceRecorderButton`
   **Then** le bouton passe en état "recording" (rouge pulsant + timer visible)
   **And** l'enregistrement audio démarre immédiatement sans dialog de confirmation

2. **Transcription après relâchement**
   **Given** l'IDEL relâche le bouton après sa dictée
   **When** l'enregistrement se termine
   **Then** une animation "Transcription en cours…" s'affiche
   **And** le `TranscriptionViewer` s'affiche avec le texte transcrit en moins de 3 secondes

3. **Annulation par glissement vers le haut**
   **Given** le bouton maintenu puis glissé vers le haut
   **When** l'IDEL veut annuler
   **Then** un Snackbar "Enregistrement annulé" s'affiche et aucune donnée n'est sauvegardée

4. **Microphone indisponible**
   **Given** la permission microphone refusée ou indisponible
   **When** l'IDEL appuie sur le bouton vocal
   **Then** le message "Microphone inaccessible — utilisez la saisie textuelle" s'affiche

5. **Accès depuis la liste planning**
   **Given** une `PlanningCard` d'un patient `done` ou `pending`
   **When** l'IDEL appuie sur "Saisir une transmission"
   **Then** le bottom sheet de saisie s'ouvre, pré-rempli avec le `patientId` correspondant

## Tâches / sous-tâches

- [x] Ajouter la table `transmissions` au SQLite DDL + migration dans `db.native.ts`
- [x] Créer `features/transmissions/services/whisper-service.ts` (abstraction + MVP mock)
- [x] Créer `features/transmissions/components/VoiceRecorderButton.tsx` (hold-to-record)
- [x] Créer `features/transmissions/components/TranscriptionViewer.tsx`
- [x] Créer `features/transmissions/hooks/useVoiceTransmission.ts`
- [x] Créer le bottom sheet `NewTransmissionSheet.tsx` (onglet vocal uniquement pour cette story)
- [x] Câbler le FAB de `transmissions/index.tsx` pour ouvrir `NewTransmissionSheet`
- [x] Tests Jest pour `useVoiceTransmission` et `whisper-service`

## Notes de développement

### Dépendances
- `expo-av` (enregistrement audio) : dans le spec architecture (ligne 218). À installer : `npx expo install expo-av`
- `whisper.rn` (transcription on-device) : nécessite `expo prebuild` (natif). Pour MVP : **mock service** simulant une transcription en 1.5s avec texte aléatoire réaliste.

### Architecture
- `whisper-service.ts` : interface `WhisperService` avec `transcribe(audioUri: string): Promise<string>`. Implémentation MVP mock ; remplacer par `whisper.rn` en production.
- Enregistrement : `expo-av` `Audio.Recording` (mode `HIGH_QUALITY`)
- Permissions : `Audio.requestPermissionsAsync()` au montage
- Hold-to-record : `onPressIn` / `onPressOut` + `PanResponder` pour détecter le swipe-up d'annulation
- `NewTransmissionSheet` : `react-native-paper` `Modal` (bottom sheet style)

### Table SQLite à ajouter
```sql
CREATE TABLE IF NOT EXISTS transmissions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content_original TEXT,
  content_validated TEXT NOT NULL DEFAULT '',
  care_type TEXT NOT NULL DEFAULT 'autre',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER
);
```

### Statuts du bouton vocal
- `idle` : bouton bleu primaire, icône micro
- `recording` : bouton rouge pulsant, timer (secondes), hint "Glissez ↑ pour annuler"
- `transcribing` : spinner + "Transcription en cours…"
- `done` : remplacé par `TranscriptionViewer`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(vide)

### Completion Notes List

- `sqlite-ddl.ts` : table `transmissions` + 2 index ajoutés au DDL SQLite
- `whisper-service.ts` : interface `WhisperService` + mock MVP avec 1,5 s de latence simulée et phrases médicales réalistes
- `VoiceRecorderButton.tsx` : hold-to-record via PanResponder, pulsation rouge en recording, timer, hint glissement haut pour annuler
- `TranscriptionViewer.tsx` : zone éditable avec bandeau IA + note conformité HDS
- `useVoiceTransmission.ts` : state machine idle→recording→transcribing→done, import dynamique expo-av (évite erreurs Jest/web)
- `NewTransmissionSheet.tsx` : Modal RN bottom sheet avec VoiceRecorderButton + TranscriptionViewer + bouton "Valider"
- FAB `transmissions/index.tsx` : icône `microphone-plus`, onPress ouvre `NewTransmissionSheet`
- `test-utils/expo-av-stub.js` + `moduleNameMapper` : stub expo-av pour Jest
- 6 tests passent (2 whisper-service + 4 useVoiceTransmission)

### File List

- `apps/mobile/src/lib/sqlite-ddl.ts` (modifié)
- `apps/mobile/src/features/transmissions/services/whisper-service.ts` (créé)
- `apps/mobile/src/features/transmissions/services/whisper-service.test.ts` (créé)
- `apps/mobile/src/features/transmissions/components/VoiceRecorderButton.tsx` (créé)
- `apps/mobile/src/features/transmissions/components/TranscriptionViewer.tsx` (créé)
- `apps/mobile/src/features/transmissions/components/NewTransmissionSheet.tsx` (créé)
- `apps/mobile/src/features/transmissions/hooks/useVoiceTransmission.ts` (créé)
- `apps/mobile/src/features/transmissions/hooks/useVoiceTransmission.test.ts` (créé)
- `apps/mobile/src/app/(app)/transmissions/index.tsx` (modifié)
- `apps/mobile/test-utils/expo-av-stub.js` (créé)
- `apps/mobile/package.json` (modifié — moduleNameMapper expo-av)
- `_bmad-output/implementation-artifacts/5-1-saisie-de-transmission-par-dictee-vocale-ia.md` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

### Change Log

- 2026-05-22 : Implémentation story 5.1 — dictée vocale IA transmissions ; statut → review
