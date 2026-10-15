export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F7FA',
    border: '#E3E8EF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#1D4ED8',
    onPrimary: '#FFFFFF',
    primarySoft: '#EAF1FD',
    success: '#16A34A',
    successSoft: '#E8F6EE',
    warning: '#D97706',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
  },
  dark: {
    background: '#0B0F14',
    surface: '#161C24',
    border: '#263040',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    primarySoft: '#14223B',
    success: '#4ADE80',
    successSoft: '#12261B',
    warning: '#FBBF24',
    danger: '#F87171',
    dangerSoft: '#2D1517',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

/** Colores de la Pantalla de Emergencia (alto contraste, RNF-01) */
export const EmergencyColors = {
  background: '#D80000',
  foreground: '#FFFFFF',
  button: '#FFFFFF',
  buttonText: '#B00000',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const Radius = { md: 12, lg: 16, xl: 24, pill: 999 } as const;
