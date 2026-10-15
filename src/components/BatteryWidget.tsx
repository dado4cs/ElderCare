import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * Widget de batería de la pulsera (RF-10).
 * Modularizado: recibe `level` por props. Mientras sea null (backend pendiente, P-03)
 * muestra un placeholder "-- %".
 */
export function BatteryWidget({ level }: { level: number | null }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.textSecondary }]}>Batería</Text>
      <View style={styles.value}>
        <Ionicons name="battery-half-outline" size={22} color={c.success} />
        <Text style={[styles.percent, { color: c.text }]}>
          {level === null ? '-- %' : `${level}%`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  percent: { fontSize: 20, fontWeight: '700' },
});
