import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';

const createWrapper = (children: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    <NavigationContainer>{children}</NavigationContainer>
  </QueryClientProvider>
);

describe('SettingsScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(createWrapper(<SettingsScreen />));
    });
  });

  it('renders with testID settings-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(createWrapper(<SettingsScreen />));
    });
    const screen = renderer!.root.findByProps({ testID: 'settings-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Settings title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(createWrapper(<SettingsScreen />));
    });
    const title = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(title).toBeDefined();
  });
});
