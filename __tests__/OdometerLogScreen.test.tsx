import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { OdometerLogScreen } from '../src/screens/home/OdometerLogScreen';

describe('OdometerLogScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<OdometerLogScreen />);
    });
  });

  it('renders with testID odometer-log-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'odometer-log-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Odometer Log title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'odometer-log-title' });
    expect(title).toBeDefined();
  });
});
