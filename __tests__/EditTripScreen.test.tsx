import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { EditTripScreen } from '../src/screens/trips/EditTripScreen';

describe('EditTripScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<EditTripScreen />);
    });
  });

  it('renders with testID edit-trip-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'edit-trip-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Edit Trip title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'edit-trip-title' });
    expect(title).toBeDefined();
  });
});
