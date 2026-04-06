import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
