import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AddReadingScreen } from '../src/screens/home/AddReadingScreen';

describe('AddReadingScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AddReadingScreen />);
    });
  });

  it('renders with testID add-reading-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'add-reading-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Add Reading title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'add-reading-title' });
    expect(title).toBeDefined();
  });
});
