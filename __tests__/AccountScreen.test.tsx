import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AccountScreen } from '../src/screens/settings/AccountScreen';

describe('AccountScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AccountScreen />);
    });
  });

  it('renders with testID account-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'account-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Account title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AccountScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'account-title' });
    expect(title).toBeDefined();
  });
});
