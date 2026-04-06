import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PaceDetailScreen } from '../src/screens/home/PaceDetailScreen';

describe('PaceDetailScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PaceDetailScreen />);
    });
  });

  it('renders with testID pace-detail-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'pace-detail-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Pace Detail title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'pace-detail-title' });
    expect(title).toBeDefined();
  });
});
