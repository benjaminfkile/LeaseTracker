import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SubscriptionScreen } from '../src/screens/settings/SubscriptionScreen';

describe('SubscriptionScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<SubscriptionScreen />);
    });
  });

  it('renders with testID subscription-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'subscription-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Subscription title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<SubscriptionScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'subscription-title' });
    expect(title).toBeDefined();
  });
});
