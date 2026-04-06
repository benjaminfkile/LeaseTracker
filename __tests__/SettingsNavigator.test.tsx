import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { SettingsNavigator } from '../src/navigation/SettingsNavigator';

describe('SettingsNavigator', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <SettingsNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders SettingsScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <SettingsNavigator />
        </NavigationContainer>,
      );
    });
    const settingsTitle = renderer!.root.findByProps({ testID: 'settings-title' });
    expect(settingsTitle).toBeDefined();
  });
});
