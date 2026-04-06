import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BuybackAnalysisScreen } from '../src/screens/home/BuybackAnalysisScreen';

describe('BuybackAnalysisScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
  });

  it('renders with testID buyback-analysis-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'buyback-analysis-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Buyback Analysis title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'buyback-analysis-title' });
    expect(title).toBeDefined();
  });
});
