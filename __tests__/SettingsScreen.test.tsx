import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';

describe('SettingsScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<SettingsScreen />);
    });
  });

  it('renders with testID settings-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'settings-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Settings title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SettingsScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'settings-title' });
    expect(title).toBeDefined();
  });
});
