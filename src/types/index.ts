export type AlertRecord = {
  id: string;
  /** ISO 8601 */
  timestamp: string;
};

export type AppState = {
  /** Se carga AsyncStorage al iniciar */
  isLoaded: boolean;
  /** ID de la pulsera vinculada (null = sin pulsera) */
  braceletId: string | null;
  isEmergencyActive: boolean;
  alertHistory: AlertRecord[];
  /** null hasta que se implemente RF-10 */
  batteryLevel: number | null;
};

export type WifiNetwork = {
  ssid: string;
  /** 0-4 */
  signal: number;
  secured: boolean;
};

export type RootStackParamList = {
  Welcome: undefined;
  Pairing: undefined;
  Home: undefined;
  AlertHistory: undefined;
  Emergency: undefined;
};
