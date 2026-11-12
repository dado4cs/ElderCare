import { useCallback, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleManager,
  Device,
  State,
  Subscription,
} from 'react-native-ble-plx';

import type { WifiNetwork } from '@/types';

/* =========================================================================================
 *  ESPECIFICACIÓN DE LA CONEXIÓN BLUETOOTH (BLE) CON LA PULSERA ELDERCARE (ESP32)
 * =========================================================================================
 *
 * 1. DISPOSITIVO:
 *    - Nombre anunciado (BLE Device Name): "ElderCare-Pulsera"
 *    - Arquitectura GATT: Servidor periférico BLE (ESP32) y Cliente central (Smartphone).
 *
 * 2. SERVICIO GATT:
 *    - UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
 *
 * 3. CARACTERÍSTICAS Y FORMATO DE PARÁMETROS:
 *    --------------------------------------------------------------------------------------
 *    A) Escaneo de Redes (WiFi Scan)
 *       - UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8
 *       - Propiedad: READ (Lectura)
 *       - Formato esperado del ESP32: Cadena JSON codificada en Base64.
 *         Ejemplo en texto plano:
 *         [
 *           { "ssid": "Totalplay_2.4G", "signal": 4, "secured": true },
 *           { "ssid": "Infinitum_Fibra", "signal": 3, "secured": true },
 *           { "ssid": "Red_Abierta", "signal": 2, "secured": false }
 *         ]
 *
 *    B) Envío de Credenciales (Credentials)
 *       - UUID: a3c10001-2000-4000-8000-111122223333
 *       - Propiedad: WRITE (Escritura con respuesta)
 *       - Formato enviado por la App: Cadena de texto codificada en Base64 con el delimitador ";".
 *         Ejemplo en texto plano:
 *         "MiRedWiFi;MiContrasenaSegura123"
 *
 *    C) Estado de Conexión (Status & Bracelet ID)
 *       - UUID: a3c10002-2000-4000-8000-111122223333
 *       - Propiedad: READ / NOTIFY (Notificación)
 *       - Formato esperado del ESP32 tras probar la conexión WiFi: JSON codificado en Base64.
 *         - En caso de éxito:
 *           { "status": "OK", "id": "ECB-A89F2" }
 *         - En caso de contraseña incorrecta o error de conexión:
 *           { "status": "ERROR" }
 * ========================================================================================= */

/**
 * Bandera por defecto para alternar entre el mock de desarrollo y la conexión BLE real.
 */
export const DEFAULT_USE_MOCK = true;

export type BleLogLevel = 'info' | 'success' | 'warn' | 'error';

export type BleLogEntry = {
  id: string;
  time: string;
  level: BleLogLevel;
  message: string;
};

// =====================================
// CONFIGURACIÓN Y CONSTANTES BLE
// =====================================
export const BLE_CONFIG = {
  DEVICE_NAME: 'ElderCare-Pulsera',
  SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  CHAR_SCAN_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
  CHAR_CREDENTIALS_UUID: 'a3c10001-2000-4000-8000-111122223333',
  CHAR_STATUS_UUID: 'a3c10002-2000-4000-8000-111122223333',
  SCAN_TIMEOUT_MS: 12000,
  CONNECTION_TIMEOUT_MS: 15000,
  PROVISION_TIMEOUT_MS: 20000,
} as const;

// =====================================
// MOCK DE DESARROLLO
// =====================================
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_NETWORKS: WifiNetwork[] = [
  { ssid: 'Casa_WiFi', signal: 4, secured: true },
  { ssid: 'INFINITUM_2G', signal: 3, secured: true },
  { ssid: 'Vecinos_5G', signal: 2, secured: true },
  { ssid: 'Cafe_Libre', signal: 1, secured: false },
];

// =====================================
// UTILIDADES BASE64 (Sin dependencias)
// =====================================
function encodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let encoded = '';
  const bytes = new TextEncoder().encode(str);

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const e1 = b1 >> 2;
    const e2 = ((b1 & 3) << 4) | (b2 >> 4);
    const e3 = ((b2 & 15) << 2) | (b3 >> 6);
    const e4 = b3 & 63;

    if (i + 1 >= bytes.length) {
      encoded += chars.charAt(e1) + chars.charAt(e2) + '==';
    } else if (i + 2 >= bytes.length) {
      encoded += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + '=';
    } else {
      encoded += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
    }
  }

  return encoded;
}

function decodeBase64(b64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const cleanB64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];

  for (let i = 0; i < cleanB64.length; i += 4) {
    const e1 = chars.indexOf(cleanB64.charAt(i));
    const e2 = chars.indexOf(cleanB64.charAt(i + 1));
    const e3 = chars.indexOf(cleanB64.charAt(i + 2));
    const e4 = chars.indexOf(cleanB64.charAt(i + 3));

    const b1 = (e1 << 2) | (e2 >> 4);
    const b2 = ((e2 & 15) << 4) | (e3 >> 2);
    const b3 = ((e3 & 3) << 6) | e4;

    bytes.push(b1);
    if (e3 !== 64 && e3 !== -1 && i + 2 < cleanB64.length) bytes.push(b2);
    if (e4 !== 64 && e4 !== -1 && i + 3 < cleanB64.length) bytes.push(b3);
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// =====================================
// GESTIÓN NATIVA Y PERMISOS BLE
// =====================================
let bleManagerInstance: BleManager | null = null;

function getBleManager(): BleManager | null {
  if (!bleManagerInstance) {
    try {
      bleManagerInstance = new BleManager();
    } catch {
      return null;
    }
  }
  return bleManagerInstance;
}

async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Permiso de ubicación para Bluetooth',
      message: 'ElderCare necesita permiso de ubicación para detectar la pulsera.',
      buttonPositive: 'Aceptar',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

async function ensureBluetoothPoweredOn(manager: BleManager): Promise<void> {
  const state = await manager.state();
  if (state !== State.PoweredOn) {
    throw new Error('El Bluetooth está desactivado. Por favor actívalo en tu teléfono.');
  }
}

// =====================================
// HOOK PRINCIPAL: useBLE
// =====================================
export function useBLE() {
  const currentDeviceRef = useRef<Device | null>(null);
  const [isMock, setIsMock] = useState<boolean>(DEFAULT_USE_MOCK);
  const [logs, setLogs] = useState<BleLogEntry[]>([]);

  const addLog = useCallback((message: string, level: BleLogLevel = 'info') => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const entry: BleLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time,
      level,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), entry]); // Conserva los últimos 50 logs
    if (level === 'error') {
      console.error(`[BLE ${time}]`, message);
    } else if (level === 'warn') {
      console.warn(`[BLE ${time}]`, message);
    } else {
      console.log(`[BLE ${time}]`, message);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  /**
   * 1. Conecta con el ESP32 y solicita la lista de redes WiFi escaneadas.
   */
  const scanNetworks = useCallback(async (): Promise<WifiNetwork[]> => {
    addLog(`Iniciando escaneo (Modo: ${isMock ? 'SIMULADO / MOCK' : 'REAL / HARDWARE'})...`, 'info');

    // MODO MOCK
    if (isMock) {
      addLog('[MOCK] Esperando respuesta simulada (1.8s)...', 'info');
      await delay(1800);
      addLog(`[MOCK] Redes simuladas cargadas (${MOCK_NETWORKS.length} encontradas).`, 'success');
      return MOCK_NETWORKS;
    }

    // MODO REAL
    const manager = getBleManager();
    if (!manager) {
      addLog(
        '[ALERTA] BleManager no disponible (probablemente estás en Expo Go). Cambiando automáticamente a MOCK.',
        'warn'
      );
      await delay(1500);
      return MOCK_NETWORKS;
    }

    addLog('Comprobando permisos Bluetooth / Ubicación...', 'info');
    const hasPermissions = await requestBlePermissions();
    if (!hasPermissions) {
      const err = 'Permisos de Bluetooth o ubicación denegados.';
      addLog(err, 'error');
      throw new Error(err);
    }
    addLog('Permisos validados correctamente.', 'success');

    addLog('Verificando estado del Bluetooth...', 'info');
    await ensureBluetoothPoweredOn(manager);
    addLog('Bluetooth activo y listo.', 'success');

    // A) Escaneo BLE
    addLog(`Buscando periférico "${BLE_CONFIG.DEVICE_NAME}" [UUID: ${BLE_CONFIG.SERVICE_UUID.slice(0, 8)}...]`, 'info');
    const device = await new Promise<Device>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const stopAndReject = (err: Error) => {
        clearTimeout(timeoutId);
        manager.stopDeviceScan();
        addLog(`Fallo en escaneo: ${err.message}`, 'error');
        reject(err);
      };

      timeoutId = setTimeout(() => {
        stopAndReject(
          new Error('No se encontró la pulsera. Verifica que esté encendida y en modo vinculación.')
        );
      }, BLE_CONFIG.SCAN_TIMEOUT_MS);

      manager.startDeviceScan([BLE_CONFIG.SERVICE_UUID], { allowDuplicates: false }, (error, dev) => {
        if (error) {
          stopAndReject(error);
          return;
        }

        if (
          dev &&
          (dev.name === BLE_CONFIG.DEVICE_NAME || dev.serviceUUIDs?.includes(BLE_CONFIG.SERVICE_UUID))
        ) {
          clearTimeout(timeoutId);
          manager.stopDeviceScan();
          addLog(`¡Pulsera detectada! Nombre: "${dev.name || 'N/A'}" ID: ${dev.id}`, 'success');
          resolve(dev);
        }
      });
    });

    // B) Conexión y descubrimiento
    addLog(`Conectando con ${device.id}...`, 'info');
    let connected = await device.connect({ timeout: BLE_CONFIG.CONNECTION_TIMEOUT_MS });
    addLog('Conexión BLE establecida. Descubriendo servicios GATT...', 'info');
    connected = await connected.discoverAllServicesAndCharacteristics();
    addLog('Servicios y características descubiertos con éxito.', 'success');

    // C) Negociación de MTU (Android)
    if (Platform.OS === 'android') {
      try {
        addLog('Negociando MTU a 512 bytes...', 'info');
        connected = await connected.requestMTU(512);
        addLog('MTU negociado correctamente a 512 bytes.', 'success');
      } catch {
        addLog('No se pudo renegociar MTU, continuando con tamaño por defecto.', 'warn');
      }
    }

    currentDeviceRef.current = connected;

    // D) Lectura de redes
    addLog('Leyendo característica de redes WiFi (CHAR_SCAN)...', 'info');
    const char = await connected.readCharacteristicForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.CHAR_SCAN_UUID
    );

    if (!char.value) {
      const err = 'La pulsera no reportó ninguna red WiFi disponible.';
      addLog(err, 'error');
      throw new Error(err);
    }

    const jsonText = decodeBase64(char.value);
    addLog(`Datos recibidos del ESP32: ${jsonText.slice(0, 60)}...`, 'info');
    const parsedNetworks: WifiNetwork[] = JSON.parse(jsonText);
    addLog(`Lectura completada: ${parsedNetworks.length} redes detectadas.`, 'success');
    return parsedNetworks;
  }, [isMock, addLog]);

  /**
   * 2. Envía las credenciales seleccionadas al ESP32 y espera confirmación de conexión.
   */
  const provision = useCallback(
    async (ssid: string, password: string, secured: boolean): Promise<string> => {
      addLog(`Iniciando envío de credenciales para "${ssid}"...`, 'info');

      // MODO MOCK
      if (isMock) {
        addLog('[MOCK] Esperando tiempo de conexión simulado (2.2s)...', 'info');
        await delay(2200);
        if (secured && password.length < 8) {
          const err = `No se pudo conectar a "${ssid}". Revisa la contraseña e intenta de nuevo.`;
          addLog(`[MOCK] Error simulado: ${err}`, 'error');
          throw new Error(err);
        }
        const mockId = `ECB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        addLog(`[MOCK] Conexión simulada exitosa. ID asignado: ${mockId}`, 'success');
        return mockId;
      }

      // MODO REAL
      const device = currentDeviceRef.current;
      if (!device) {
        const err = 'No hay una conexión activa con la pulsera. Vuelve a iniciar el escaneo.';
        addLog(err, 'error');
        throw new Error(err);
      }

      const payload = `${ssid};${password}`;
      const base64Payload = encodeBase64(payload);

      return new Promise<string>((resolve, reject) => {
        let subscription: Subscription | null = null;
        let timeoutId: ReturnType<typeof setTimeout>;

        const cleanup = () => {
          clearTimeout(timeoutId);
          subscription?.remove();
        };

        timeoutId = setTimeout(() => {
          cleanup();
          device.cancelConnection().catch(() => {});
          currentDeviceRef.current = null;
          const timeoutErr = `Tiempo de espera agotado al conectar a "${ssid}". Verifica la contraseña.`;
          addLog(timeoutErr, 'error');
          reject(new Error(timeoutErr));
        }, BLE_CONFIG.PROVISION_TIMEOUT_MS);

        addLog('Suscribiéndose a notificaciones de estado (CHAR_STATUS)...', 'info');
        subscription = device.monitorCharacteristicForService(
          BLE_CONFIG.SERVICE_UUID,
          BLE_CONFIG.CHAR_STATUS_UUID,
          (err, char) => {
            if (err) {
              cleanup();
              device.cancelConnection().catch(() => {});
              currentDeviceRef.current = null;
              addLog(`Error en notificación: ${err.message}`, 'error');
              reject(err);
              return;
            }

            if (char?.value) {
              try {
                const raw = decodeBase64(char.value);
                addLog(`Notificación recibida del ESP32: ${raw}`, 'info');
                const data = JSON.parse(raw) as { status: 'OK' | 'ERROR'; id?: string };

                if (data.status === 'OK' && data.id) {
                  cleanup();
                  device.cancelConnection().catch(() => {});
                  currentDeviceRef.current = null;
                  addLog(`¡Pulsera vinculada con éxito! ID asignado: ${data.id}`, 'success');
                  resolve(data.id);
                } else if (data.status === 'ERROR') {
                  cleanup();
                  device.cancelConnection().catch(() => {});
                  currentDeviceRef.current = null;
                  const errorMsg = `La pulsera reportó error al conectar a "${ssid}".`;
                  addLog(errorMsg, 'error');
                  reject(new Error(errorMsg));
                }
              } catch {
                // Fragmento no JSON, ignorar
              }
            }
          }
        );

        addLog(`Escribiendo credenciales en CHAR_CREDENTIALS ("${ssid};***")...`, 'info');
        device
          .writeCharacteristicWithResponseForService(
            BLE_CONFIG.SERVICE_UUID,
            BLE_CONFIG.CHAR_CREDENTIALS_UUID,
            base64Payload
          )
          .then(() => {
            addLog('Credenciales enviadas al ESP32. Esperando que intente conectarse al router...', 'info');
          })
          .catch((err) => {
            cleanup();
            device.cancelConnection().catch(() => {});
            currentDeviceRef.current = null;
            addLog(`Fallo al escribir credenciales: ${err.message}`, 'error');
            reject(new Error(`Error al enviar las credenciales: ${err.message}`));
          });
      });
    },
    [isMock, addLog]
  );

  return {
    scanNetworks,
    provision,
    isMock,
    setIsMock,
    logs,
    clearLogs,
    addLog,
  };
}
