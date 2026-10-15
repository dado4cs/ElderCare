import { useCallback } from 'react';

import type { WifiNetwork } from '@/types';

/**
 * MOCK del hook BLE. Se reemplazará por react-native-ble-plx (CU-01).
 * Mantiene la interfaz esperada por PairingScreen:
 *  - scanNetworks(): lista de redes WiFi que reporta la pulsera
 *  - provision(ssid, password): envía credenciales; devuelve el ID de pulsera o lanza Error
 */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_NETWORKS: WifiNetwork[] = [
  { ssid: 'Casa_WiFi', signal: 4, secured: true },
  { ssid: 'INFINITUM_2G', signal: 3, secured: true },
  { ssid: 'Vecinos_5G', signal: 2, secured: true },
  { ssid: 'Cafe_Libre', signal: 1, secured: false },
];

export function useBLE() {
  const scanNetworks = useCallback(async (): Promise<WifiNetwork[]> => {
    await delay(1800);
    return MOCK_NETWORKS;
  }, []);

  const provision = useCallback(
    async (ssid: string, password: string, secured: boolean): Promise<string> => {
      await delay(2200);
      // Regla del mock: una red segura requiere contraseña de >= 8 caracteres (WPA).
      if (secured && password.length < 8) {
        throw new Error(`No se pudo conectar a "${ssid}". Revisa la contraseña e intenta de nuevo.`);
      }
      return `ECB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    },
    [],
  );

  return { scanNetworks, provision };
}
