import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { EditLeaseScreen } from '../src/screens/leases/EditLeaseScreen';

describe('EditLeaseScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<EditLeaseScreen />);
    });
  });

  it('renders with testID edit-lease-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditLeaseScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'edit-lease-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Edit Lease title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditLeaseScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'edit-lease-title' });
    expect(title).toBeDefined();
  });
});
