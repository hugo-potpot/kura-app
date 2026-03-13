import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const TEAL_PRIMARY = '#00897B';
const INDIGO_SECONDARY = '#3949AB';

export const kuraLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: TEAL_PRIMARY,
    secondary: INDIGO_SECONDARY,
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#E0F2F1',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
};

export const kuraDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: TEAL_PRIMARY,
    secondary: INDIGO_SECONDARY,
    background: '#000000',
    surface: '#0D0D1A',
    surfaceVariant: '#1A1A2E',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
};
