/**
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage().finally(() => {
      BootSplash.hide({ fade: true });
    });
  }, [hydrateFromStorage]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
