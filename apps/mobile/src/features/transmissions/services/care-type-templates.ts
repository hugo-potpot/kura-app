export type CareType = 'toilette' | 'pansement' | 'injection' | 'constantes' | 'autre';

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  toilette: 'Toilette',
  pansement: 'Pansement',
  injection: 'Injection',
  constantes: 'Constantes',
  autre: 'Autre',
};

export const CARE_TYPES: CareType[] = ['toilette', 'pansement', 'injection', 'constantes', 'autre'];

export const CARE_TYPE_TEMPLATES: Record<CareType, TemplateField[]> = {
  toilette: [
    {
      key: 'observations',
      label: 'Observations générales',
      placeholder: 'Ex : Patient coopératif, soins réalisés sans incident…',
      multiline: true,
    },
    {
      key: 'etat_peau',
      label: 'État de la peau',
      placeholder: 'Ex : Peau intègre, pas d\'escarre…',
    },
    {
      key: 'zones',
      label: 'Zones à surveiller',
      placeholder: 'Ex : Légère rougeur talon gauche…',
    },
  ],

  pansement: [
    {
      key: 'plaie',
      label: 'Type et localisation',
      placeholder: 'Ex : Plaie chronique jambe droite, ulcère veineux…',
    },
    {
      key: 'etat',
      label: 'État de la plaie',
      placeholder: 'Ex : Amélioration, propre, bourgeonnement…',
    },
    {
      key: 'produit',
      label: 'Produit utilisé',
      placeholder: 'Ex : Betadine + compresses, Mepilex Border…',
    },
    {
      key: 'evolution',
      label: 'Dimensions / évolution',
      placeholder: 'Ex : 3×2 cm, stable vs J−2…',
    },
  ],

  injection: [
    {
      key: 'medicament',
      label: 'Médicament',
      placeholder: 'Ex : Lovenox 0,4 ml, insuline Lantus…',
    },
    {
      key: 'dosage',
      label: 'Dosage',
      placeholder: 'Ex : 0,4 ml, 10 unités, 500 mg…',
    },
    {
      key: 'voie',
      label: 'Voie d\'administration',
      placeholder: 'Ex : Sous-cutanée, intramusculaire, intraveineuse…',
    },
    {
      key: 'reactions',
      label: 'Réactions observées',
      placeholder: 'Ex : Aucune réaction locale, bien toléré…',
    },
  ],

  constantes: [
    {
      key: 'constantes',
      label: 'Constantes relevées',
      placeholder: 'Ex : TA 130/85 mmHg, pouls 72 bpm, temp 36,8 °C, SpO2 98 %…',
      multiline: true,
    },
    {
      key: 'observations',
      label: 'Observations cliniques',
      placeholder: 'Ex : Patient stable, pas de signe anormal…',
    },
  ],

  autre: [
    {
      key: 'texte',
      label: 'Transmission',
      placeholder: 'Saisissez votre transmission ici…',
      multiline: true,
    },
  ],
};

/** Formate les champs remplis en texte structuré lisible pour le stockage. */
export function formatTemplateFields(
  careType: CareType,
  values: Record<string, string>,
): string {
  const fields = CARE_TYPE_TEMPLATES[careType];
  const lines: string[] = [];
  for (const field of fields) {
    const val = (values[field.key] ?? '').trim();
    if (val.length > 0) {
      lines.push(`${field.label} : ${val}`);
    }
  }
  return lines.join('\n');
}
