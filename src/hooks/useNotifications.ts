import notifee, { EventType } from '@notifee/react-native';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
import * as fcm from '@/services/fcm';
import { requestNotificationPermission } from '@/services/notifications';

/**
 * Permisos, token FCM y recepción de alertas en primer plano y al abrir
 * la app desde una notificación (incluida la app cerrada).
 */
export function useNotifications(): void {
  const { state, triggerEmergency } = useApp();
  const { isLoaded } = state;

  useEffect(() => {
    if (!isLoaded) return;
    let active = true;

    (async () => {
      await requestNotificationPermission();
      await fcm.requestFcmPermission();
      try {
        const t = await fcm.getFcmToken();
        console.log('FCM token:', t);
        // TODO (RF-08, P-01): POST del token al backend.
      } catch (e) {
        console.warn('No se pudo obtener el token FCM', e);
      }

      // App abierta desde una notificación de Notifee (killed / background)
      const initial = await notifee.getInitialNotification();
      if (active && initial?.notification.data?.type === 'alert') triggerEmergency();
      // ...o desde una notificación FCM mostrada por el sistema
      const launch = await fcm.getLaunchMessage();
      if (active && launch && fcm.isAlertMessage(launch)) triggerEmergency();
    })();

    const offMessage = fcm.subscribeForeground((m) => {
      if (fcm.isAlertMessage(m)) triggerEmergency();
    });
    const offToken = fcm.subscribeTokenRefresh((t) => console.log('FCM token (refresh):', t));
    const offEvents = notifee.onForegroundEvent(({ type, detail }) => {
      if (
        (type === EventType.PRESS || type === EventType.DELIVERED) &&
        detail.notification?.data?.type === 'alert'
      ) {
        triggerEmergency();
      }
    });

    return () => {
      active = false;
      offMessage();
      offToken();
      offEvents();
    };
  }, [isLoaded, triggerEmergency]);

}
