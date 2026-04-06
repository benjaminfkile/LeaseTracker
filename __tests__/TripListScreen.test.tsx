import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TripListScreen } from '../src/screens/trips/TripListScreen';

describe('TripListScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<TripListScreen />);
    });
  });

  it('renders with testID trip-list-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'trip-list-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Trip List title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'trip-list-title' });
    expect(title).toBeDefined();
  });
});
