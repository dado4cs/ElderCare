import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AlertRecord } from '@/types';

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export function AlertHistoryItem({ record }: { record: AlertRecord }) {
  const c = useTheme();
  return (
    <View style={[styles.item, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name="warning" size={22} color={c.danger} />
      <Text style={[styles.title, { color: c.text }]}>Alerta de emergencia</Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>{formatTimestamp(record.timestamp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13 },
});
