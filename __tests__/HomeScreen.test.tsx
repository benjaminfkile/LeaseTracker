import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { HomeScreen } from '../src/screens/home/HomeScreen';

describe('HomeScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<HomeScreen />);
    });
  });

  it('renders with testID home-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'home-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Home title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'home-title' });
    expect(title).toBeDefined();
  });
});
