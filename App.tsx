/**
 * @format
 */

import React, { useCallback, useEffect } from 'react';
import { Linking, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';
import { useNotificationPermission } from './src/hooks/useNotificationPermission';
import { useForegroundNotification } from './src/hooks/useForegroundNotification';
import { useBackgroundNotification } from './src/hooks/useBackgroundNotification';
import { useMileageBuybackAlert } from './src/hooks/useMileageBuybackAlert';
import { useWeeklySummaryAlert } from './src/hooks/useWeeklySummaryAlert';
import { acceptLeaseInvite } from './src/api/leaseApi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});

const INVITE_URL_PATTERN = /^leasetracker:\/\/invite\/(.+)$/;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);
  const { shouldShowModal, handlePermission } = useNotificationPermission();
  useForegroundNotification();
  useBackgroundNotification();
  useMileageBuybackAlert();
  useWeeklySummaryAlert();

  useEffect(() => {
    hydrateFromStorage().finally(() => {
      BootSplash.hide({ fade: true });
    });
  }, [hydrateFromStorage]);

  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    const inviteMatch = url.match(INVITE_URL_PATTERN);
    if (inviteMatch) {
      const leaseId = inviteMatch[1];
      acceptLeaseInvite(leaseId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['leases'] });
          queryClient.invalidateQueries({ queryKey: ['lease-members', leaseId] });
        })
        .catch(() => {
          // Invite acceptance failed — navigation still lands on the lease list
          // so the user can see available leases.
        });
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ErrorBoundary>
          <RootNavigator />
          <NotificationPermissionModal
            visible={shouldShowModal}
            onAllow={() => handlePermission(true)}
            onDeny={() => handlePermission(false)}
          />
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
