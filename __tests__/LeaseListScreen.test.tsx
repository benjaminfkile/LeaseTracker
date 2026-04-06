import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeaseListScreen } from '../src/screens/leases/LeaseListScreen';

describe('LeaseListScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeaseListScreen />);
    });
  });

  it('renders with testID lease-list-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-list-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Lease List title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'lease-list-title' });
    expect(title).toBeDefined();
  });
});
