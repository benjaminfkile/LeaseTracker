import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { DashboardScreen } from '../src/screens/home/DashboardScreen';

describe('DashboardScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<DashboardScreen />);
    });
  });

  it('renders with testID dashboard-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'dashboard-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Dashboard title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'dashboard-title' });
    expect(title).toBeDefined();
  });
});
