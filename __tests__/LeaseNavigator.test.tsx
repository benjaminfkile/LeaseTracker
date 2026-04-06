jest.mock('../src/screens/leases/LeaseListScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    LeaseListScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'lease-list-screen' },
        MockReact.createElement(Text, { testID: 'lease-list-title' }, 'My Leases'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { LeaseNavigator } from '../src/navigation/LeaseNavigator';

describe('LeaseNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <LeaseNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders LeaseListScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <LeaseNavigator />
        </NavigationContainer>,
      );
    });
    const listTitle = renderer!.root.findByProps({ testID: 'lease-list-title' });
    expect(listTitle).toBeDefined();
  });
});
