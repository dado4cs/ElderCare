import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/types';

const STEPS = [
  'Enciende la pulsera y acércala al móvil.',
  'Activa el Bluetooth de tu móvil.',
  'Elige tu pulsera en la lista de dispositivos detectados.',
];

export function WelcomeScreen({ navigation }: StackScreenProps<RootStackParamList, 'Welcome'>) {
  const c = useTheme();
  return (
    <Screen>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="watch-outline" size={40} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>Bienvenido</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Conecta tu pulsera y da el primer paso para tu tranquilidad.
        </Text>

        <View style={[styles.card, { backgroundColor: c.primarySoft }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle-outline" size={20} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.text }]}>Cómo vincular tu pulsera</Text>
          </View>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.step}>
              <Text style={[styles.stepNumber, { color: c.primary }]}>{i + 1}</Text>
              <Text style={[styles.stepText, { color: c.text }]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <Button title="Vincular Pulsera" onPress={() => navigation.navigate('Pairing')} />
      <Text style={[styles.footer, { color: c.textSecondary }]}>Estamos aquí para cuidarte</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 34, fontWeight: '700' },
  subtitle: { fontSize: 17, lineHeight: 24, marginTop: 8, marginBottom: 28 },
  card: { borderRadius: Radius.lg, padding: 18, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  step: { flexDirection: 'row', gap: 12 },
  stepNumber: { fontSize: 16, fontWeight: '700', width: 16 },
  stepText: { flex: 1, fontSize: 16, lineHeight: 22 },
  footer: { textAlign: 'center', fontSize: 13, marginTop: 14 },
});
