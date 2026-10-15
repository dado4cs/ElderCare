# ElderCare

App móvil (React Native / Expo SDK 57, Android primero) que alerta al cuidador cuando se presiona la pulsera del adulto mayor. Ver `analisis_diseño_v2.md`.

## Desarrollo

```bash
pnpm install
npx expo start        # Expo Go sirve mientras no se agreguen módulos nativos
npx tsc --noEmit
npx eslint src
```

## Estado actual

- Pantallas 0–4 implementadas (Bienvenida, Vinculación, Principal, Historial, Emergencia).
- BLE **simulado** (`src/hooks/useBLE.ts`): en modo prueba, una contraseña < 8 caracteres simula error.
- Alarma: solo vibración (`src/services/alarm.ts`) hasta definir el audio (P-04).
- En `__DEV__` la pantalla principal tiene botones para simular alerta y desvincular.

## Pendiente

react-native-ble-plx real, Firebase (FCM) + Notifee (requieren development build y `google-services.json`), POST del token al backend, batería real.
