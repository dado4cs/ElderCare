import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useBLE } from '@/hooks/useBLE';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList, WifiNetwork } from '@/types';

type Phase = 'scanning' | 'select' | 'password' | 'connecting';

export function PairingScreen({ navigation }: StackScreenProps<RootStackParamList, 'Pairing'>) {
  const c = useTheme();
  const { linkBracelet } = useApp();
  const { scanNetworks, provision } = useBLE();

  const [phase, setPhase] = useState<Phase>('scanning');
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selected, setSelected] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setPhase('scanning');
    try {
      setNetworks(await scanNetworks());
      setPhase('select');
    } catch {
      setError('No se pudo comunicar con la pulsera. Verifica el Bluetooth.');
      setPhase('select');
    }
  }, [scanNetworks]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    scan();
  }, [scan]);

  const choose = (n: WifiNetwork) => {
    setSelected(n);
    setPassword('');
    setError(null);
    setPhase(n.secured ? 'password' : 'connecting');
    if (!n.secured) connect(n, '');
  };

  const connect = async (network: WifiNetwork, pass: string) => {
    setError(null);
    setPhase('connecting');
    try {
      const id = await provision(network.ssid, pass, network.secured);
      // Guardar el ID hace que el navegador cambie solo a la Pantalla Principal.
      await linkBracelet(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
      setPhase('select'); // vuelve al paso 2 (lista de redes) según CU-01
    }
  };

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

      <Text style={[styles.title, { color: c.text }]}>Vincular pulsera</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        {phase === 'password'
          ? `Ingresa la contraseña de "${selected?.ssid}".`
          : 'Elige la red WiFi de tu hogar para conectar la pulsera a internet.'}
      </Text>

      {error && (
        <View style={[styles.error, { backgroundColor: c.dangerSoft }]}>
          <Ionicons name="alert-circle" size={20} color={c.danger} />
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        </View>
      )}

      {(phase === 'scanning' || phase === 'connecting') && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.status, { color: c.textSecondary }]}>
            {phase === 'scanning' ? 'Buscando redes WiFi…' : `Conectando a "${selected?.ssid}"…`}
          </Text>
        </View>
      )}

      {phase === 'select' && (
        <KeyboardAvoidingView style={styles.flex}>
          <ScrollView contentContainerStyle={styles.list}>
            {networks.map((n) => (
              <Pressable
                key={n.ssid}
                accessibilityRole="button"
                accessibilityLabel={`Red ${n.ssid}`}
                onPress={() => choose(n)}
                style={[styles.network, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="wifi" size={22} color={c.primary} style={{ opacity: 0.4 + n.signal * 0.15 }} />
                <Text style={[styles.ssid, { color: c.text }]}>{n.ssid}</Text>
                {n.secured && <Ionicons name="lock-closed" size={16} color={c.textSecondary} />}
              </Pressable>
            ))}
            <Button title="Buscar de nuevo" variant="secondary" onPress={scan} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {phase === 'password' && selected && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor={c.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
          />
          <Text style={[styles.hint, { color: c.textSecondary }]}>
            Modo prueba: una contraseña de menos de 8 caracteres simula un error de conexión.
          </Text>
          <View style={styles.flex} />
          <Button
            title="Conectar"
            disabled={password.length === 0}
            onPress={() => connect(selected, password)}
          />
          <Button
            title="Elegir otra red"
            variant="secondary"
            style={{ marginTop: 10 }}
            onPress={() => setPhase('select')}
          />
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 22, marginTop: 6, marginBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  status: { fontSize: 16 },
  list: { gap: 10, paddingBottom: 16 },
  network: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  ssid: { flex: 1, fontSize: 17, fontWeight: '500' },
  error: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: Radius.md, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  hint: { fontSize: 13, marginTop: 10 },
});
