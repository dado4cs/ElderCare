import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

/** Contenedor base: fondo del tema + safe area + padding horizontal */
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
});
