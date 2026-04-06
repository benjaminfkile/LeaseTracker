import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AlertSettingsScreen } from '../src/screens/settings/AlertSettingsScreen';

describe('AlertSettingsScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AlertSettingsScreen />);
    });
  });

  it('renders with testID alert-settings-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'alert-settings-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Alert Settings title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'alert-settings-title' });
    expect(title).toBeDefined();
  });
});
