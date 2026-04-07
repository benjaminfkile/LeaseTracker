jest.mock('../src/screens/trips/TripListScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    TripListScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'trip-list-screen' },
        MockReact.createElement(Text, { testID: 'trip-list-title' }, 'Saved Trips'),
      ),
  };
});

jest.mock('../src/screens/trips/AddTripScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    AddTripScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'add-trip-screen' },
        MockReact.createElement(Text, { testID: 'add-trip-title' }, 'Add Trip'),
      ),
  };
});

jest.mock('../src/screens/trips/EditTripScreen', () => {
  const MockReact = require('react');
  const { View, Text } = require('react-native');
  return {
    EditTripScreen: () =>
      MockReact.createElement(
        View,
        { testID: 'edit-trip-screen' },
        MockReact.createElement(Text, { testID: 'edit-trip-title' }, 'Edit Trip'),
      ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { TripsNavigator } from '../src/navigation/TripsNavigator';

describe('TripsNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <TripsNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders TripListScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <TripsNavigator />
        </NavigationContainer>,
      );
    });
    const listTitle = renderer!.root.findByProps({ testID: 'trip-list-title' });
    expect(listTitle).toBeDefined();
  });
});
