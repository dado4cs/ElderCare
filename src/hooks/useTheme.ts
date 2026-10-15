import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

/** Colores según el tema del sistema (RNF-03) */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
