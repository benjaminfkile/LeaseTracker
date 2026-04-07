import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeasesScreen } from '../src/screens/leases/LeasesScreen';

describe('LeasesScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeasesScreen />);
    });
  });

  it('renders with testID leases-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeasesScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'leases-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Leases title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeasesScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'leases-title' });
    expect(title).toBeDefined();
  });
});
