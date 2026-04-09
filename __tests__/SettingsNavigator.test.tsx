jest.mock('../src/screens/settings/AlertSettingsScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    AlertSettingsScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'alert-settings-screen' },
        MockReact.createElement(Text, { testID: 'alert-settings-title' }, 'Alert Settings'),
      ),
  };
});

jest.mock('../src/screens/settings/SubscriptionScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    SubscriptionScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'subscription-screen' },
        MockReact.createElement(Text, { testID: 'subscription-title' }, 'Go Premium'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsNavigator } from '../src/navigation/SettingsNavigator';

describe('SettingsNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <QueryClientProvider client={new QueryClient()}>
          <NavigationContainer>
            <SettingsNavigator />
          </NavigationContainer>
        </QueryClientProvider>,
      );
    });
  });

  it('renders SettingsScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={new QueryClient()}>
          <NavigationContainer>
            <SettingsNavigator />
          </NavigationContainer>
        </QueryClientProvider>,
      );
    });
    const settingsTitle = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(settingsTitle).toBeDefined();
  });
});
