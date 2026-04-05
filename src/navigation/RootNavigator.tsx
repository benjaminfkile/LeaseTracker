import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator(): React.ReactElement {
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
