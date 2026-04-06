import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import type { AppTabParamList } from './types';

export const linking: LinkingOptions<AppTabParamList> = {
  prefixes: ['leasetracker://'],
  config: {
    screens: {
      Leases: {
        screens: {
          LeaseList: 'invite/:leaseId',
        },
      },
      Home: {
        screens: {
          LeaseDetail: 'lease/:leaseId',
        },
      },
    },
  },
};

export function RootNavigator(): React.ReactElement {
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isLoading) {
    return (
      <View style={styles.splash} testID="root-splash">
        <ActivityIndicator size="large" testID="root-splash-indicator" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
