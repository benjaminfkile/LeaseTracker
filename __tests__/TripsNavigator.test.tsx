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
