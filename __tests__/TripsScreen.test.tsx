import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TripsScreen } from '../src/screens/trips/TripsScreen';

describe('TripsScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<TripsScreen />);
    });
  });

  it('renders with testID trips-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'trips-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Trips title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripsScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'trips-title' });
    expect(title).toBeDefined();
  });
});
