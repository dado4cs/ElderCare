import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type Event,
} from '@notifee/react-native';

export const ALERT_CHANNEL_ID = 'eldercare-alerts';

/** Canal de alta prioridad con sonido (Android 8+). */
export async function ensureAlertChannel(): Promise<void> {
  await notifee.createChannel({
    id: ALERT_CHANNEL_ID,
    name: 'Alertas de emergencia',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    bypassDnd: true,
  });
}

/**
 * Muestra la notificación de emergencia con fullScreenIntent para despertar
 * el celular y abrir la app aunque esté bloqueado o cerrada (RF-03, RF-04).
 * Se puede llamar desde el handler en segundo plano (sin UI).
 */
export async function displayEmergencyNotification(): Promise<void> {
  await ensureAlertChannel();
  await notifee.displayNotification({
    id: 'emergency',
    title: '¡ALERTA!',
    body: 'Se presionó el botón de la pulsera',
    data: { type: 'alert' },
    android: {
      channelId: ALERT_CHANNEL_ID,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
    },
  });
}

export async function clearEmergencyNotification(): Promise<void> {
  await notifee.cancelNotification('emergency');
}

/** Solicita el permiso de notificaciones (Android 13+ / iOS). */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

/** Handler de eventos en segundo plano (registrar en index.js). */
export async function onBackgroundNotifeeEvent(_event: Event): Promise<void> {
  // Nada que hacer: al tocar la notificación se abre la app y
  // useNotifications detecta la alerta con getInitialNotification().
}

export { EventType };
