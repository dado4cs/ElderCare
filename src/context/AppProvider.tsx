import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { startAlarm, stopAlarm } from '@/services/alarm';
import * as storage from '@/services/storage';
import type { AlertRecord } from '@/types';

import { AppContext, initialState, reducer, type AppContextValue } from './AppContext';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [braceletId, alertHistory] = await Promise.all([
        storage.getBraceletId(),
        storage.getAlertHistory(),
      ]);
      if (!cancelled) dispatch({ type: 'LOADED', braceletId, alertHistory });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistir el historial cada vez que cambie (una vez cargado el estado inicial)
  useEffect(() => {
    if (state.isLoaded) storage.saveAlertHistory(state.alertHistory);
  }, [state.isLoaded, state.alertHistory]);

  const linkBracelet = useCallback(async (id: string) => {
    await storage.saveBraceletId(id);
    dispatch({ type: 'SET_BRACELET', braceletId: id });
  }, []);

  const unlinkBracelet = useCallback(async () => {
    await storage.clearBraceletId();
    dispatch({ type: 'CLEAR_BRACELET' });
  }, []);

  const triggerEmergency = useCallback(() => {
    dispatch({ type: 'START_EMERGENCY' });
    startAlarm();
  }, []);

  const silenceEmergency = useCallback(() => {
    stopAlarm();
    const now = new Date();
    const record: AlertRecord = {
      id: `${now.getTime()}`,
      timestamp: now.toISOString(),
    };
    dispatch({ type: 'SILENCE_EMERGENCY', record });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ state, linkBracelet, unlinkBracelet, triggerEmergency, silenceEmergency }),
    [state, linkBracelet, unlinkBracelet, triggerEmergency, silenceEmergency],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
