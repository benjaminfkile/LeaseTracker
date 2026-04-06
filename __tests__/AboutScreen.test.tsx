import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AboutScreen } from '../src/screens/settings/AboutScreen';

describe('AboutScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AboutScreen />);
    });
  });

  it('renders with testID about-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AboutScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'about-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the About title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AboutScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'about-title' });
    expect(title).toBeDefined();
  });
});
