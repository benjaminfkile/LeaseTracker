import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeaseDetailScreen } from '../src/screens/home/LeaseDetailScreen';

describe('LeaseDetailScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeaseDetailScreen />);
    });
  });

  it('renders with testID lease-detail-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-detail-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Lease Detail title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'lease-detail-title' });
    expect(title).toBeDefined();
  });
});
