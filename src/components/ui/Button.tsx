import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const c = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: c.primary }
          : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
        (pressed || disabled) && { opacity: pressed ? 0.85 : 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? c.onPrimary : c.text} />
      ) : (
        <Text style={[styles.text, { color: primary ? c.onPrimary : c.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: { fontSize: 17, fontWeight: '600' },
});
