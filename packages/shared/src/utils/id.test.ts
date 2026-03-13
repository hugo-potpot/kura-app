import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('retourne une chaîne de 26 caractères', () => {
    const id = generateId();
    expect(id).toHaveLength(26);
  });

  it('respecte le format ULID [0-9A-Z]{26}', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('génère des IDs uniques à chaque appel', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("génère sans round-trip serveur (synchrone)", () => {
    // Si generateId() était async, ce test échouerait
    const id = generateId();
    expect(typeof id).toBe('string');
  });
});
