import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AlertHistoryItem } from '@/components/AlertHistoryItem';
import { Screen } from '@/components/ui/Screen';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/types';

export function AlertHistoryScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'AlertHistory'>) {
  const c = useTheme();
  const { state } = useApp();
  const count = state.alertHistory.length;

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.back}
        hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={c.primary} />
        <Text style={[styles.backText, { color: c.primary }]}>Volver</Text>
      </Pressable>

      <Text style={[styles.title, { color: c.text }]}>Historial de Alertas</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Las alertas de tu pulsera, en un solo lugar.
      </Text>

      <View style={styles.sectionRow}>
        <Text style={[styles.section, { color: c.textSecondary }]}>Alertas recientes</Text>
        <Text style={[styles.section, { color: c.textSecondary }]}>
          {count} {count === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      <FlatList
        data={state.alertHistory}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <AlertHistoryItem record={item} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={count === 0 ? styles.emptyWrap : undefined}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>Aún no hay alertas registradas.</Text>
        }
        ListFooterComponent={
          count > 0 ? (
            <Text style={[styles.footer, { color: c.textSecondary }]}>Estás al día con tu historia.</Text>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 6, marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  section: { fontSize: 13 },
  sep: { height: 10 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', fontSize: 15 },
  footer: { textAlign: 'center', fontSize: 13, marginTop: 20 },
});
