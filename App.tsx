/**
 * @format
 */

import React, { useCallback, useEffect } from 'react';
import { Linking, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';

const INVITE_URL_PATTERN = /^leasetracker:\/\/invite\/(.+)$/;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage().finally(() => {
      BootSplash.hide({ fade: true });
    });
  }, [hydrateFromStorage]);

  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    // The NavigationContainer linking config in RootNavigator handles URL→screen
    // navigation automatically for both paths. This handler is the hook point for
    // invite-acceptance side-effects (e.g. API call to accept the invite) that must
    // run in addition to navigation. The accept-invite business logic will be added
    // here once the corresponding API endpoint is available.
    const inviteMatch = url.match(INVITE_URL_PATTERN);
    if (inviteMatch) {
      // leaseId = inviteMatch[1]
      // TODO: dispatch accept-invite action when the endpoint is ready
    }
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDeepLink({ url });
        }
      })
      .catch(() => {
        // Unable to retrieve initial URL — not a deep-link launch.
      });
    return () => subscription.remove();
  }, [handleDeepLink]);

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
