import { useCallback, useRef } from 'react';
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
 *         Donde:
 *           - ssid: Nombre de la red (string).
 *           - signal: Nivel de potencia mapeado del RSSI entre 1 y 4 (number).
 *           - secured: true si tiene clave (WPA/WPA2/WPA3), false si es abierta (boolean).
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
 *
 * 4. NEGOCIACIÓN DE MTU:
 *    - En Android se solicita un MTU de 512 bytes para transferir la lista JSON completa
 *      sin necesidad de fragmentar paquetes BLE.
 * ========================================================================================= */

/**
 * Bandera para alternar entre el mock de desarrollo y la conexión BLE real con el ESP32.
 * - true:  Utiliza datos simulados (útil en Expo Go o para desarrollo sin el ESP32).
 * - false: Utiliza react-native-ble-plx conectándose a la pulsera física.
 */
export const USE_BLE_MOCK = true;

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
      console.warn(
        '[BLE] BleManager no disponible en este entorno (se requiere Development Build).'
      );
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

  /**
   * 1. Conecta con el ESP32 y solicita la lista de redes WiFi escaneadas.
   */
  const scanNetworks = useCallback(async (): Promise<WifiNetwork[]> => {
    // Si estamos en modo Mock:
    if (USE_BLE_MOCK) {
      await delay(1800);
      return MOCK_NETWORKS;
    }

    // Modo Real:
    const manager = getBleManager();
    if (!manager) {
      console.warn('[useBLE] BleManager no disponible. Usando datos simulados.');
      await delay(1800);
      return MOCK_NETWORKS;
    }

    const hasPermissions = await requestBlePermissions();
    if (!hasPermissions) {
      throw new Error('Se requieren permisos de Bluetooth para vincular la pulsera.');
    }

    await ensureBluetoothPoweredOn(manager);

    // A) Escanear hasta encontrar la pulsera
    const device = await new Promise<Device>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const stopAndReject = (err: Error) => {
        clearTimeout(timeoutId);
        manager.stopDeviceScan();
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
          resolve(dev);
        }
      });
    });

    // B) Conectar y descubrir servicios
    let connected = await device.connect({ timeout: BLE_CONFIG.CONNECTION_TIMEOUT_MS });
    connected = await connected.discoverAllServicesAndCharacteristics();

    // C) Negociar MTU a 512 bytes (Android)
    if (Platform.OS === 'android') {
      try {
        connected = await connected.requestMTU(512);
      } catch {
        // Fallback al MTU base si la placa no lo renegocia
      }
    }

    currentDeviceRef.current = connected;

    // D) Leer característica de redes escaneadas
    const char = await connected.readCharacteristicForService(
      BLE_CONFIG.SERVICE_UUID,
      BLE_CONFIG.CHAR_SCAN_UUID
    );

    if (!char.value) {
      throw new Error('La pulsera no reportó ninguna red WiFi disponible.');
    }

    const jsonText = decodeBase64(char.value);
    const parsedNetworks: WifiNetwork[] = JSON.parse(jsonText);
    return parsedNetworks;
  }, []);

  /**
   * 2. Envía las credenciales seleccionadas al ESP32 y espera confirmación de conexión.
   */
  const provision = useCallback(
    async (ssid: string, password: string, secured: boolean): Promise<string> => {
      // Si estamos en modo Mock:
      if (USE_BLE_MOCK) {
        await delay(2200);
        if (secured && password.length < 8) {
          throw new Error(`No se pudo conectar a "${ssid}". Revisa la contraseña e intenta de nuevo.`);
        }
        return `ECB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      }

      // Modo Real:
      const device = currentDeviceRef.current;
      if (!device) {
        throw new Error('No hay una conexión activa con la pulsera. Vuelve a iniciar el escaneo.');
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
          reject(
            new Error(
              `Tiempo de espera agotado al conectar a "${ssid}". Verifica la contraseña e intenta de nuevo.`
            )
          );
        }, BLE_CONFIG.PROVISION_TIMEOUT_MS);

        // Suscribirse a la notificación de estado
        subscription = device.monitorCharacteristicForService(
          BLE_CONFIG.SERVICE_UUID,
          BLE_CONFIG.CHAR_STATUS_UUID,
          (err, char) => {
            if (err) {
              cleanup();
              device.cancelConnection().catch(() => {});
              currentDeviceRef.current = null;
              reject(err);
              return;
            }

            if (char?.value) {
              try {
                const raw = decodeBase64(char.value);
                const data = JSON.parse(raw) as { status: 'OK' | 'ERROR'; id?: string };

                if (data.status === 'OK' && data.id) {
                  cleanup();
                  device.cancelConnection().catch(() => {});
                  currentDeviceRef.current = null;
                  resolve(data.id);
                } else if (data.status === 'ERROR') {
                  cleanup();
                  device.cancelConnection().catch(() => {});
                  currentDeviceRef.current = null;
                  reject(
                    new Error(
                      `No se pudo conectar a "${ssid}". Revisa la contraseña e intenta de nuevo.`
                    )
                  );
                }
              } catch {
                // Ignorar fragmentos no parseables
              }
            }
          }
        );

        // Escribir las credenciales en la característica
        device
          .writeCharacteristicWithResponseForService(
            BLE_CONFIG.SERVICE_UUID,
            BLE_CONFIG.CHAR_CREDENTIALS_UUID,
            base64Payload
          )
          .catch((err) => {
            cleanup();
            device.cancelConnection().catch(() => {});
            currentDeviceRef.current = null;
            reject(new Error(`Error al enviar las credenciales: ${err.message}`));
          });
      });
    },
    []
  );

  return { scanNetworks, provision, isMock: USE_BLE_MOCK };
}
