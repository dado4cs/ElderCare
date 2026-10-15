import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage as FirebaseRemoteMessage,
} from '@react-native-firebase/messaging';

import { displayEmergencyNotification } from './notifications';

export type RemoteMessage = FirebaseRemoteMessage;

/**
 * TODO (P-02): el backend aún no define el payload. Mientras tanto,
 * cualquier mensaje FCM recibido se trata como alerta.
 */
export function isAlertMessage(_message: RemoteMessage): boolean {
  return true;
}

/** Registrar UNA vez a nivel de módulo en index.js (app en background/cerrada). */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async (message) => {
    if (isAlertMessage(message)) await displayEmergencyNotification();
  });
}

export async function requestFcmPermission(): Promise<void> {
  await requestPermission(getMessaging());
}

export async function getFcmToken(): Promise<string> {
  return getToken(getMessaging());
}

export function subscribeTokenRefresh(listener: (token: string) => void): () => void {
  return onTokenRefresh(getMessaging(), listener);
}

/** Mensajes con la app en primer plano. */
export function subscribeForeground(listener: (message: RemoteMessage) => void): () => void {
  return onMessage(getMessaging(), listener);
}

export function getLaunchMessage(): Promise<RemoteMessage | null> {
  return getInitialNotification(getMessaging());
}
