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
