import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import type { LinkingOptions, Theme as NavTheme } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useTheme, useIsDark } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import type { AppTabParamList } from './types';
import { navigationRef } from './navigationRef';

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
  const theme = useTheme();
  const isDark = useIsDark();

  const navTheme: NavTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.background }]} testID="root-splash">
        <ActivityIndicator size="large" color={theme.colors.primary} testID="root-splash-indicator" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={navTheme}>
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
