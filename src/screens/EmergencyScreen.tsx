import { Ionicons } from '@expo/vector-icons';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmergencyColors as E } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

/** Pantalla 4: alto contraste (RNF-01). Un único botón: Silenciar (RF-06). */
export function EmergencyScreen() {
  const { silenceEmergency } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={E.background} />
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={180} color={E.foreground} />
        <Text style={styles.title}>¡ALERTA!</Text>
        <Text style={styles.subtitle}>Se presionó el botón de la pulsera</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Silenciar alarma"
        onPress={silenceEmergency}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
        <Ionicons name="volume-mute" size={32} color={E.buttonText} />
        <Text style={styles.buttonText}>SILENCIAR</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: E.background, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: E.foreground, fontSize: 56, fontWeight: '900' },
  subtitle: { color: E.foreground, fontSize: 22, textAlign: 'center' },
  button: {
    minHeight: 84,
    borderRadius: 20,
    backgroundColor: E.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: { color: E.buttonText, fontSize: 30, fontWeight: '800' },
});
