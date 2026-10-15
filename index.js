import notifee from '@notifee/react-native';
import { registerRootComponent } from 'expo';

import App from './src/App';
import { registerBackgroundHandler } from './src/services/fcm';
import { onBackgroundNotifeeEvent } from './src/services/notifications';

// Deben registrarse a nivel de módulo, antes de montar la app (background / killed).
registerBackgroundHandler();
notifee.onBackgroundEvent(onBackgroundNotifeeEvent);

registerRootComponent(App);
