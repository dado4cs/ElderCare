import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { Share, StyleSheet, Text, View } from 'react-native';

import { BatteryWidget } from '@/components/BatteryWidget';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getFcmToken } from '@/services/fcm';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/types';

export function HomeScreen({ navigation }: StackScreenProps<RootStackParamList, 'Home'>) {
  const c = useTheme();
  const { state, triggerEmergency, unlinkBracelet } = useApp();

  return (
    <Screen>
      <Text style={[styles.title, { color: c.text }]}>Hola</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Tu tranquilidad, en un vistazo.
      </Text>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardLabel, { color: c.textSecondary }]}>Tu dispositivo</Text>
        <View style={[styles.shield, { backgroundColor: c.successSoft }]}>
          <Ionicons name="shield-checkmark-outline" size={34} color={c.success} />
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: c.success }]} />
          <Text style={[styles.status, { color: c.success }]}>Conectado</Text>
        </View>
        <Text style={[styles.monitor, { color: c.textSecondary }]}>Monitoreo activo</Text>
        {state.braceletId && (
          <Text style={[styles.id, { color: c.textSecondary }]}>ID: {state.braceletId}</Text>
        )}
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <BatteryWidget level={state.batteryLevel} />
      </View>

      <Button
        title="Ver Historial de Alertas"
        variant="secondary"
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate('AlertHistory')}
      />

      <View style={styles.flex} />

      {/* Herramientas de desarrollo hasta tener el backend/FCM */}
      {__DEV__ && (
        <View style={[styles.dev, { borderColor: c.border }]}>
          <Text style={[styles.devTitle, { color: c.textSecondary }]}>DESARROLLO</Text>
          <Button title="Simular alerta" variant="secondary" onPress={triggerEmergency} />
          <Button
            title="Compartir token FCM"
            variant="secondary"
            onPress={async () => Share.share({ message: await getFcmToken() })}
          />
          <Button title="Desvincular pulsera" variant="secondary" onPress={unlinkBracelet} />
        </View>
      )}
      <Text style={[styles.footer, { color: c.textSecondary }]}>Estamos aquí para cuidarte</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 4, marginBottom: 24 },
  card: { borderRadius: Radius.xl, borderWidth: 1, padding: 24, alignItems: 'center' },
  cardLabel: { fontSize: 14, marginBottom: 16 },
  shield: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  status: { fontSize: 28, fontWeight: '700' },
  monitor: { fontSize: 14, marginTop: 4 },
  id: { fontSize: 12, marginTop: 8 },
  divider: { height: 1, alignSelf: 'stretch', marginVertical: 20 },
  dev: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.md, padding: 12, gap: 8 },
  devTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  footer: { textAlign: 'center', fontSize: 13, marginTop: 14 },
});
