import { formatTemplateFields, CARE_TYPE_TEMPLATES, CARE_TYPES } from './care-type-templates';

describe('care-type-templates', () => {
  it('tous les types de soin ont au moins un champ', () => {
    for (const type of CARE_TYPES) {
      expect(CARE_TYPE_TEMPLATES[type].length).toBeGreaterThan(0);
    }
  });

  it('formatTemplateFields concatène les champs remplis', () => {
    const result = formatTemplateFields('toilette', {
      observations: 'Patient coopératif',
      etat_peau: 'Peau intègre',
      zones: '',
    });
    expect(result).toContain('Patient coopératif');
    expect(result).toContain('Peau intègre');
    // Le champ vide ne doit pas apparaître
    expect(result).not.toContain('Zones à surveiller');
  });

  it('formatTemplateFields retourne une chaîne vide si tous les champs sont vides', () => {
    const result = formatTemplateFields('autre', { texte: '   ' });
    expect(result.trim()).toBe('');
  });

  it('formatTemplateFields formate correctement une injection', () => {
    const result = formatTemplateFields('injection', {
      medicament: 'Lovenox 0,4 ml',
      dosage: '0,4 ml',
      voie: 'Sous-cutanée',
      reactions: '',
    });
    expect(result).toContain('Médicament : Lovenox 0,4 ml');
    expect(result).toContain('Dosage : 0,4 ml');
    expect(result).toContain("Voie d'administration : Sous-cutanée");
    expect(result).not.toContain('Réactions observées');
  });
});
