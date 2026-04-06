import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AddLeaseScreen } from '../src/screens/leases/AddLeaseScreen';

describe('AddLeaseScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AddLeaseScreen />);
    });
  });

  it('renders with testID add-lease-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddLeaseScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'add-lease-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Add Lease title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddLeaseScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'add-lease-title' });
    expect(title).toBeDefined();
  });
});
