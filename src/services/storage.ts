import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlertRecord } from '@/types';

const KEYS = {
  braceletId: 'eldercare:braceletId',
  alertHistory: 'eldercare:alertHistory',
} as const;

export async function getBraceletId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.braceletId);
}

export async function saveBraceletId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.braceletId, id);
}

export async function clearBraceletId(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.braceletId);
}

export async function getAlertHistory(): Promise<AlertRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.alertHistory);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AlertRecord[]) : [];
  } catch {
    return [];
  }
}

export async function saveAlertHistory(history: AlertRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.alertHistory, JSON.stringify(history));
}
