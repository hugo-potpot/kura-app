import { whisperService } from './whisper-service';

describe('whisperService (MVP mock)', () => {
  it('retourne une chaîne non vide après transcription', async () => {
    const result = await whisperService.transcribe('file:///fake/audio.m4a');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  it('retourne toujours un texte même avec un URI vide', async () => {
    const result = await whisperService.transcribe('');
    expect(result.length).toBeGreaterThan(0);
  });
});
