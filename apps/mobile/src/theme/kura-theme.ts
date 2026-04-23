import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Figma tokens
export const COLORS = {
  // Primaires
  primary: '#3949AB',       // Indigo principal
  primaryDark: '#1E3093',   // Indigo foncé (gradient start)
  teal: '#00897B',          // Teal (planning header)
  tealAccent: '#8DF5E4',   // Teal accent clair

  // Fonds
  background: '#F3FAFF',   // Fond général (fill_VXH5SP)
  white: '#FFFFFF',
  surface: '#FFFFFF',

  // Composants
  navBg: 'rgba(243, 250, 255, 0.92)',         // Bottom nav bg (frosted)
  navBorder: 'rgba(198, 197, 212, 0.18)',      // Bottom nav border
  activeTabBg: '#CBE7F5',                       // Tab actif bg pill
  cardBg: '#E6F6FF',                            // Cartes

  // Textes
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#5C8DAA',

  // États
  warning: '#FFF7ED',
  warningBorder: '#FFEDD5',
  warningText: '#EA580C',
  success: '#00897B',
  error: '#E53935',

  // Input
  inputBg: '#C8DFF0',
} as const;

export const kuraLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.teal,
    background: COLORS.background,
    surface: COLORS.white,
    surfaceVariant: COLORS.cardBg,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: COLORS.textPrimary,
    onSurface: COLORS.textPrimary,
    onSurfaceVariant: COLORS.textSecondary,
  },
};

export const kuraDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.teal,
    background: '#000000',
    surface: '#0D0D1A',
    surfaceVariant: '#1A1A2E',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
  },
};
