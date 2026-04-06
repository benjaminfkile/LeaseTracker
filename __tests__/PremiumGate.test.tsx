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

  it('renders its children when isPremium is not provided', async () => {
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

  it('renders its children when isPremium is true', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={true}>
          <Text testID="child-content">Premium Content</Text>
        </PremiumGate>,
      );
    });
    const child = renderer!.root.findByProps({ testID: 'child-content' });
    expect(child).toBeDefined();
  });

  it('renders the lock overlay when isPremium is false', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={false}>
          <Text testID="child-content">Premium Content</Text>
        </PremiumGate>,
      );
    });
    const locked = renderer!.root.findByProps({ testID: 'premium-gate-locked' });
    expect(locked).toBeDefined();
  });

  it('does not render children when isPremium is false', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={false}>
          <Text testID="child-content">Premium Content</Text>
        </PremiumGate>,
      );
    });
    const children = renderer!.root.findAllByProps({ testID: 'child-content' });
    expect(children.length).toBe(0);
  });

  it('renders the Premium Feature title in lock overlay', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={false}>
          <Text>Content</Text>
        </PremiumGate>,
      );
    });
    const title = renderer!.root.findByProps({ testID: 'premium-gate-title' });
    expect(title).toBeDefined();
    expect(title.props.children).toBe('Premium Feature');
  });

  it('renders the upgrade button in lock overlay', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={false}>
          <Text>Content</Text>
        </PremiumGate>,
      );
    });
    const btn = renderer!.root.findByProps({ testID: 'premium-gate-upgrade-button' });
    expect(btn).toBeDefined();
  });

  it('calls onUpgrade when upgrade button is pressed', async () => {
    const onUpgrade = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <PremiumGate isPremium={false} onUpgrade={onUpgrade}>
          <Text>Content</Text>
        </PremiumGate>,
      );
    });
    const btn = renderer!.root.findByProps({ testID: 'premium-gate-upgrade-button' });
    await ReactTestRenderer.act(() => {
      btn.props.onPress();
    });
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});
