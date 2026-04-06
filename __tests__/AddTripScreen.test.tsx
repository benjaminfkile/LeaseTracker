import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AddTripScreen } from '../src/screens/trips/AddTripScreen';

describe('AddTripScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AddTripScreen />);
    });
  });

  it('renders with testID add-trip-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'add-trip-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Add Trip title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'add-trip-title' });
    expect(title).toBeDefined();
  });
});
