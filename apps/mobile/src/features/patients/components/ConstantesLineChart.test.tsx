import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('react-native-gifted-charts', () => ({
  LineChart: jest.fn(() => null),
}));

jest.mock('@/theme/kura-theme', () => ({
  COLORS: {
    primary: '#3949AB',
    background: '#F3FAFF',
    textSecondary: '#475569',
    white: '#FFFFFF',
  },
}));

import { ConstantesLineChart } from './ConstantesLineChart';

const MOCK_POINTS = [
  { value: 120, date: new Date('2026-04-01T09:00:00Z') },
  { value: 135, date: new Date('2026-04-05T09:00:00Z') },
  { value: 118, date: new Date('2026-04-10T09:00:00Z') },
];

const NORMAL_RANGE = { min: 90, max: 139 };
const ALERT_RANGE  = { min: 80, max: 180 };

describe('ConstantesLineChart', () => {
  it('affiche l\'état vide quand aucun point de données', () => {
    render(
      <ConstantesLineChart
        dataPoints={[]}
        unit="mmHg"
        label="Tension"
      />,
    );
    expect(screen.getByText('Aucune donnée sur cette période')).toBeTruthy();
  });

  it('affiche le graphique quand des données sont présentes', () => {
    const { LineChart } = jest.requireMock('react-native-gifted-charts') as { LineChart: jest.Mock };

    render(
      <ConstantesLineChart
        dataPoints={MOCK_POINTS}
        unit="mmHg"
        label="Tension"
        normalRange={NORMAL_RANGE}
        alertRange={ALERT_RANGE}
      />,
    );

    expect(LineChart).toHaveBeenCalled();
    expect(screen.queryByText('Aucune donnée sur cette période')).toBeNull();
  });

  it('affiche la légende des zones quand normalRange est défini', () => {
    render(
      <ConstantesLineChart
        dataPoints={MOCK_POINTS}
        unit="mmHg"
        label="Tension"
        normalRange={NORMAL_RANGE}
        alertRange={ALERT_RANGE}
      />,
    );

    expect(screen.getByText('✓ Normal')).toBeTruthy();
    expect(screen.getByText('⚠ Attention')).toBeTruthy();
    expect(screen.getByText('🚨 Alerte')).toBeTruthy();
  });

  it('n\'affiche pas la légende si normalRange absent (ex: poids)', () => {
    render(
      <ConstantesLineChart
        dataPoints={MOCK_POINTS}
        unit="kg"
        label="Poids"
      />,
    );

    expect(screen.queryByText('✓ Normal')).toBeNull();
    expect(screen.queryByText('⚠ Attention')).toBeNull();
    expect(screen.queryByText('🚨 Alerte')).toBeNull();
  });
});
