/**
 * Abstraction du service de transcription vocale.
 *
 * Production : remplacer `MockWhisperService` par une implémentation `whisper.rn`
 * (https://github.com/mybigday/whisper.rn) après `expo prebuild`.
 *
 * Contrat : transcribe(audioUri) → texte transcrit (jamais d'appel cloud, RGPD/HDS).
 */

export interface WhisperService {
  transcribe(audioUri: string): Promise<string>;
}

// Phrases médicales réalistes pour la démo PFE
const MOCK_SAMPLES = [
  "Pansement changé. Plaie propre, cicatrisation en bonne voie. Pas de signe infectieux. Patient de bonne humeur.",
  "Injection Lovenox 0,4 ml réalisée en sous-cutané. Pas de réaction locale. Patient bien tolérant.",
  "Toilette complète effectuée. Peau en bon état. Pas d'escarre. Patient coopératif.",
  "Constantes relevées : tension 130 sur 85, pouls 72, température 36,8. Patient stable.",
  "Glycémie capillaire à 1,45 g/L. Injection insuline 10 unités selon schéma. Patient à jeun depuis 7 heures.",
  "Soins de nursing réalisés. Patient fatigué mais coopératif. Famille présente et rassurée.",
];

// MVP : simulation de transcription on-device avec délai réaliste
class MockWhisperService implements WhisperService {
  async transcribe(_audioUri: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_SAMPLES[Math.floor(Math.random() * MOCK_SAMPLES.length)] ?? '';
  }
}

export const whisperService: WhisperService = new MockWhisperService();
