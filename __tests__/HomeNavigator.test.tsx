jest.mock('../src/screens/home/DashboardScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    DashboardScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'dashboard-screen' },
        MockReact.createElement(Text, { testID: 'dashboard-title' }, 'Dashboard'),
      ),
  };
});

jest.mock('../src/screens/home/LeaseDetailScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    LeaseDetailScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'lease-detail-screen' },
        MockReact.createElement(Text, { testID: 'lease-detail-title' }, 'Lease Detail'),
      ),
  };
});

jest.mock('../src/screens/home/OdometerLogScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    OdometerLogScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'odometer-log-screen' },
        MockReact.createElement(Text, { testID: 'odometer-log-title' }, 'Odometer Log'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { HomeNavigator } from '../src/navigation/HomeNavigator';

describe('HomeNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <HomeNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders DashboardScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <HomeNavigator />
        </NavigationContainer>,
      );
    });
    const dashboardTitle = renderer!.root.findByProps({ testID: 'dashboard-title' });
    expect(dashboardTitle).toBeDefined();
  });
});
