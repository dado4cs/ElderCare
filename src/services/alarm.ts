import { Vibration } from 'react-native';

/**
 * Alarma de emergencia.
 * TODO (P-04): reproducir sonido personalizado cuando se defina el audio.
 * Por ahora solo vibra en patrón repetitivo.
 */
const PATTERN = [0, 800, 400];

export function startAlarm(): void {
  Vibration.vibrate(PATTERN, true);
}

export function stopAlarm(): void {
  Vibration.cancel();
}
