import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';

import { useApp } from '@/context/AppContext';
import { AlertHistoryScreen } from '@/screens/AlertHistoryScreen';
import { EmergencyScreen } from '@/screens/EmergencyScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { PairingScreen } from '@/screens/PairingScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import type { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Pantallas condicionales según el estado global:
 *  - Emergencia activa  -> solo EmergencyScreen (reemplaza toda la UI, RF-03)
 *  - Con pulsera (RF-09) -> Home / Historial
 *  - Sin pulsera         -> Welcome / Pairing
 */
export function AppNavigator() {
  const { state } = useApp();
  const scheme = useColorScheme();

  if (!state.isLoaded) return null;

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {state.isEmergencyActive ? (
          <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ gestureEnabled: false }} />
        ) : state.braceletId ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AlertHistory" component={AlertHistoryScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Pairing" component={PairingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
