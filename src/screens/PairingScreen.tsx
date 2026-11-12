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
  const { scanNetworks, provision, isMock, setIsMock, logs, clearLogs } = useBLE();

  const [phase, setPhase] = useState<Phase>('scanning');
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [selected, setSelected] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const scan = useCallback(async () => {
    setPhase('scanning');
    setError(null);
    try {
      setNetworks(await scanNetworks());
      setPhase('select');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo comunicar con la pulsera. Verifica el Bluetooth.'
      );
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
      await linkBracelet(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
      setPhase('select');
    }
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={c.primary} />
          <Text style={[styles.backText, { color: c.primary }]}>Volver</Text>
        </Pressable>

        {/* Botón para alternar la consola de logs y modo DEV */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowLogs((prev) => !prev)}
          style={[
            styles.devBadge,
            { backgroundColor: isMock ? '#F1F5F9' : '#DCFCE7' },
          ]}>
          <Ionicons
            name="terminal-outline"
            size={14}
            color={isMock ? '#475569' : '#166534'}
          />
          <Text
            style={[
              styles.devBadgeText,
              { color: isMock ? '#475569' : '#166534' },
            ]}>
            {isMock ? 'MOCK' : 'REAL'} ({logs.length})
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { color: c.text }]}>Vincular pulsera</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        {phase === 'password'
          ? `Ingresa la contraseña de "${selected?.ssid}".`
          : 'Elige la red WiFi de tu hogar para conectar la pulsera a internet.'}
      </Text>

      {/* Consola de logs en vivo para depuración de hardware */}
      {showLogs && (
        <View style={styles.logPanel}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Consola BLE (Depuración)</Text>
            <View style={styles.logActions}>
              <Pressable
                onPress={() => {
                  setIsMock(!isMock);
                  setTimeout(scan, 100);
                }}
                style={[
                  styles.miniBtn,
                  { backgroundColor: isMock ? '#2563EB' : '#16A34A' },
                ]}>
                <Text style={styles.miniBtnText}>
                  Cambiar a {isMock ? 'REAL' : 'MOCK'}
                </Text>
              </Pressable>
              <Pressable
                onPress={clearLogs}
                style={[styles.miniBtn, { backgroundColor: '#475569' }]}>
                <Text style={styles.miniBtnText}>Limpiar</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.logScroll}
            nestedScrollEnabled
            contentContainerStyle={{ padding: 10 }}>
            {logs.length === 0 ? (
              <Text style={styles.logEmpty}>No hay eventos registrados aún.</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logTime}>{log.time}</Text>
                  <Text
                    style={[
                      styles.logText,
                      log.level === 'error' && { color: '#F87171' },
                      log.level === 'success' && { color: '#4ADE80' },
                      log.level === 'warn' && { color: '#FBBF24' },
                      log.level === 'info' && { color: '#CBD5E1' },
                    ]}>
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

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
            {phase === 'scanning'
              ? 'Buscando redes WiFi…'
              : `Conectando a "${selected?.ssid}"…`}
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
                style={[
                  styles.network,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}>
                <Ionicons
                  name="wifi"
                  size={22}
                  color={c.primary}
                  style={{ opacity: 0.4 + n.signal * 0.15 }}
                />
                <Text style={[styles.ssid, { color: c.text }]}>{n.ssid}</Text>
                {n.secured && (
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={c.textSecondary}
                  />
                )}
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
            style={[
              styles.input,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                color: c.text,
              },
            ]}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '500' },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  devBadgeText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 22, marginTop: 6, marginBottom: 16 },
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
  error: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  hint: { fontSize: 13, marginTop: 10 },
  logPanel: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
  },
  logTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  logActions: { flexDirection: 'row', gap: 8 },
  miniBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  miniBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  logScroll: { maxHeight: 150 },
  logEmpty: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  logTime: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
