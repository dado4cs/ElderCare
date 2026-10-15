import { createContext, useContext } from 'react';

import type { AlertRecord, AppState } from '@/types';

export type Action =
  | {
      type: 'LOADED';
      braceletId: string | null;
      alertHistory: AlertRecord[];
    }
  | { type: 'SET_BRACELET'; braceletId: string }
  | { type: 'CLEAR_BRACELET' }
  | { type: 'START_EMERGENCY' }
  | { type: 'SILENCE_EMERGENCY'; record: AlertRecord }
  | { type: 'SET_BATTERY'; level: number | null };

export const initialState: AppState = {
  isLoaded: false,
  braceletId: null,
  isEmergencyActive: false,
  alertHistory: [],
  batteryLevel: null,
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        isLoaded: true,
        braceletId: action.braceletId,
        alertHistory: action.alertHistory,
      };
    case 'SET_BRACELET':
      return { ...state, braceletId: action.braceletId };
    case 'CLEAR_BRACELET':
      return { ...state, braceletId: null, batteryLevel: null };
    case 'START_EMERGENCY':
      return { ...state, isEmergencyActive: true };
    case 'SILENCE_EMERGENCY':
      return {
        ...state,
        isEmergencyActive: false,
        alertHistory: [action.record, ...state.alertHistory],
      };
    case 'SET_BATTERY':
      return { ...state, batteryLevel: action.level };
  }
}

export type AppContextValue = {
  state: AppState;
  linkBracelet: (id: string) => Promise<void>;
  unlinkBracelet: () => Promise<void>;
  triggerEmergency: () => void;
  silenceEmergency: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
