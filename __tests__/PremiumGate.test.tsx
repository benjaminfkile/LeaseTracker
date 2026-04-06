import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PremiumGate } from '../src/components/PremiumGate';
import { Text } from 'react-native';

describe('PremiumGate', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <PremiumGate>
          <Text>Content</Text>
        </PremiumGate>,
      );
    });
  });

  it('renders its children', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate>
          <Text testID="child-content">Premium Content</Text>
        </PremiumGate>,
      );
    });
    const child = renderer!.root.findByProps({ testID: 'child-content' });
    expect(child).toBeDefined();
  });
});
